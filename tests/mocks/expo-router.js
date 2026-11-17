// Test-only expo-router: records navigation and serves route params set by the test.
import React from 'react';
export const routerCalls = [];
let params = {};
export const __setParams = (p) => { params = p; };
export const useRouter = () => ({
  push: (to) => routerCalls.push(['push', to]),
  replace: (to) => routerCalls.push(['replace', to]),
  back: () => routerCalls.push(['back']),
  canGoBack: () => true,
});
export const useLocalSearchParams = () => params;
export const Stack = (props) => React.createElement('Stack', props);
export default { useRouter, useLocalSearchParams, Stack };
