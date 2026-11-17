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
