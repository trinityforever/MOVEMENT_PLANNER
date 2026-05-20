// Stub for react-native-web compatibility
const WS = typeof WebSocket !== 'undefined' ? WebSocket : function() {};
export default WS;
