// Native screen-body entrance controlled by the approved Experience Direction.
// Never animate until the OS accessibility preference is known. Existing apps without
// motion directives retain their prior immediate rendering behavior.
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import type { ExperienceSpec } from './spec';

export type MotionDirection = NonNullable<ExperienceSpec['motion']>;
export const MOTION_PRESETS = Object.freeze({
  none: { duration: 0, offset: 0 },
  subtle: { duration: 180, offset: 7 },
  expressive: { duration: 300, offset: 18 },
});

export function MotionViewport({
  motion, children,
}: { motion?: MotionDirection; children: React.ReactNode }) {
  const [reduced, setReduced] = useState<boolean | null>(null);
  const opacity = useRef(new Animated.Value(motion && motion !== 'none' ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => { if (mounted) setReduced(Boolean(enabled)); })
      .catch(() => { if (mounted) setReduced(true); });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (mounted) setReduced(Boolean(enabled));
    });
    return () => { mounted = false; sub.remove(); };
  }, []);

  useEffect(() => {
    if (reduced === null) return;
    const preset = MOTION_PRESETS[motion ?? 'none'];
    if (reduced || preset.duration === 0) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    opacity.setValue(0);
    translateY.setValue(preset.offset);
    const fade = Animated.timing(opacity, { toValue: 1, duration: preset.duration, useNativeDriver: true });
    const move = motion === 'expressive'
      ? Animated.spring(translateY, { toValue: 0, damping: 19, stiffness: 160, mass: 0.9, useNativeDriver: true })
      : Animated.timing(translateY, { toValue: 0, duration: preset.duration, useNativeDriver: true });
    const animation = Animated.parallel([fade, move]);
    animation.start();
    return () => animation.stop();
  }, [motion, reduced, opacity, translateY]);

  return (
    <Animated.View
      testID="factory-motion-viewport"
      style={{ flex: 1, opacity, transform: [{ translateY }] }}
    >
      {children}
    </Animated.View>
  );
}
