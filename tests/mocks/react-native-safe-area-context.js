import React from 'react';

export const SafeAreaView = (props) => React.createElement('SafeAreaView', props, props.children);
export const useSafeAreaInsets = () => ({ top: 44, bottom: 34, left: 0, right: 0 });

export default { SafeAreaView, useSafeAreaInsets };
