// Stub for react-native-web compatibility
const assets = {};
export function registerAsset(asset) { assets[asset.hash] = asset; return asset.hash; }
export function getAssetByID(id) { return assets[id]; }
