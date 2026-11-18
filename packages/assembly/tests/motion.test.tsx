import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { __setReducedMotion, motionCalls } from 'react-native';
import { MotionViewport, MOTION_PRESETS } from '../src/MotionViewport';

async function render(motion: 'subtle' | 'expressive' | 'none' | undefined, reduce = false) {
  __setReducedMotion(reduce);
  motionCalls.length = 0;
  let root!: renderer.ReactTestRenderer;
  await act(async () => {
    root = renderer.create(<MotionViewport motion={motion}><></></MotionViewport>);
    await Promise.resolve();
  });
  return root;
}
test('subtle entrances use measured native-driver translations, not static spec labels', async () => {
  const root = await render('subtle');
  assert.ok(root.toJSON());
  const calls = [...motionCalls];
  assert.equal(calls.length, 2);
  assert.ok(calls.every(c => c.kind === 'timing'));
  assert.deepEqual(calls.map(c => c.config.duration), [180, 180]);
  assert.ok(calls.every(c => c.config.useNativeDriver === true));
  act(() => root.unmount());
});
test('expressive entrances change physics, distance, and fade timing', async () => {
  const root = await render('expressive');
  assert.deepEqual(motionCalls.map(c => c.kind), ['timing', 'spring']);
  assert.equal(motionCalls[0].config.duration, 300);
  assert.equal(motionCalls[1].config.stiffness, 160);
  assert.ok(MOTION_PRESETS.expressive.offset > MOTION_PRESETS.subtle.offset);
  act(() => root.unmount());
});
test('none and omitted motion never animate', async () => {
  for (const motion of ['none', undefined] as const) {
    const root = await render(motion);
    assert.deepEqual(motionCalls, []);
    act(() => root.unmount());
  }
});
test('OS reduced-motion preference overrides even expressive art direction', async () => {
  const root = await render('expressive', true);
  assert.deepEqual(motionCalls, []);
  act(() => root.unmount());
});
test('changing accessibility preference stops future motion', async () => {
  const root = await render('subtle');
  motionCalls.length = 0;
  await act(async () => { __setReducedMotion(true); await Promise.resolve(); });
  assert.deepEqual(motionCalls, []);
  act(() => root.unmount());
});
