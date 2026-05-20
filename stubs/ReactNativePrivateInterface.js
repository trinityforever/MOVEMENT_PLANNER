// Stub for react-native-web compatibility
const iface = {
  get Platform() { return require('react-native-web').Platform; },
  get RCTDeviceEventEmitter() { return require('react-native-web/dist/vendor/react-native/NativeEventEmitter').default; },
  get UIManager() { return {}; },
};
export default iface;
