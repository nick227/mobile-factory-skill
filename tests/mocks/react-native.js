import React from 'react';

export const View = (props) => React.createElement('View', props, props.children);
export const Text = (props) => React.createElement('Text', props, props.children);
export const Pressable = (props) => {
  const style = typeof props.style === 'function' ? props.style({ pressed: false }) : props.style;
  return React.createElement('Pressable', { ...props, style }, props.children);
};
export const TouchableOpacity = (props) => React.createElement('TouchableOpacity', props, props.children);
export const ActivityIndicator = (props) => React.createElement('ActivityIndicator', props);
export const ScrollView = (props) => React.createElement('ScrollView', props, props.children);
export const TextInput = (props) => React.createElement('TextInput', props);
export const Switch = (props) => React.createElement('Switch', props);
export const Image = (props) => React.createElement('Image', props);
export const Modal = (props) => props.visible !== false ? React.createElement('Modal', props, props.children) : null;
export const FlatList = (props) => {
  const items = (props.data || []).map((item, index) =>
    props.renderItem ? props.renderItem({ item, index }) : null
  );
  return React.createElement('FlatList', props, items);
};
export const KeyboardAvoidingView = (props) => React.createElement('KeyboardAvoidingView', props, props.children);
export const Platform = { OS: 'ios', select: (obj) => obj.ios ?? obj.default };
export const StyleSheet = { create: (s) => s };
export const useColorScheme = () => 'light';
export const useWindowDimensions = () => ({ width: 375, height: 812, scale: 2, fontScale: 1 });

export default {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Switch,
  Image,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  useColorScheme,
  useWindowDimensions
};

const motionListeners = new Set();
let prefersReducedMotion = false;
export const motionCalls = [];
export const __setReducedMotion = (enabled) => {
  prefersReducedMotion = Boolean(enabled);
  for (const listener of motionListeners) listener(prefersReducedMotion);
};
export const AccessibilityInfo = {
  isReduceMotionEnabled: () => Promise.resolve(prefersReducedMotion),
  addEventListener: (_event, cb) => {
    motionListeners.add(cb);
    return { remove: () => motionListeners.delete(cb) };
  },
};
class AnimatedValue {
  constructor(v) { this.value = v; }
  setValue(v) { this.value = v; }
  stopAnimation() {}
}
const anim = (kind, value, config) => {
  motionCalls.push({ kind, config });
  return { start(callback) { value.setValue(config.toValue); callback?.({ finished: true }); }, stop() {} };
};
export const Animated = {
  Value: AnimatedValue,
  View: (props) => React.createElement('Animated.View', props, props.children),
  timing: (v, config) => anim('timing', v, config),
  spring: (v, config) => anim('spring', v, config),
  parallel: (animations) => ({
    start(callback) { animations.forEach(a => a.start()); callback?.({ finished: true }); },
    stop() { animations.forEach(a => a.stop()); },
  }),
};
