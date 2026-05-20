const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');
const path = require('path');

// Known mappings from react-native internal paths to react-native-web equivalents
const RNW_ALIASES = {
  'react-native/Libraries/Alert/Alert': 'react-native-web/dist/exports/Alert',
  'react-native/Libraries/Animated/Animated': 'react-native-web/dist/exports/Animated',
  'react-native/Libraries/Animated/NativeAnimatedHelper': 'react-native-web/dist/exports/Animated',
  'react-native/Libraries/Animated/components/AnimatedImage': 'react-native-web/dist/exports/Animated',
  'react-native/Libraries/Animated/components/AnimatedScrollView': 'react-native-web/dist/exports/Animated',
  'react-native/Libraries/Animated/nodes/AnimatedColor': 'react-native-web/dist/exports/Animated',
  'react-native/Libraries/Animated/nodes/AnimatedStyle': 'react-native-web/dist/exports/Animated',
  'react-native/Libraries/AppState/AppState': 'react-native-web/dist/exports/AppState',
  'react-native/Libraries/Components/Keyboard/Keyboard': 'react-native-web/dist/exports/Keyboard',
  'react-native/Libraries/Components/RefreshControl/RefreshControl': 'react-native-web/dist/exports/RefreshControl',
  'react-native/Libraries/Components/SafeAreaView/SafeAreaView': 'react-native-web/dist/exports/SafeAreaView',
  'react-native/Libraries/Components/ScrollView/ScrollView': 'react-native-web/dist/exports/ScrollView',
  'react-native/Libraries/Components/ScrollView/ScrollViewNativeComponent': 'react-native-web/dist/exports/ScrollView',
  'react-native/Libraries/Components/ScrollView/ScrollViewStickyHeader': 'react-native-web/dist/exports/ScrollView',
  'react-native/Libraries/Components/ScrollView/processDecelerationRate': 'react-native-web/dist/exports/ScrollView',
  'react-native/Libraries/Components/StatusBar/StatusBar': 'react-native-web/dist/exports/StatusBar',
  'react-native/Libraries/Components/TextInput/TextInputState': 'react-native-web/dist/exports/TextInput',
  'react-native/Libraries/Components/Touchable/TouchableHighlight': 'react-native-web/dist/exports/TouchableHighlight',
  'react-native/Libraries/Components/Touchable/TouchableOpacity': 'react-native-web/dist/exports/TouchableOpacity',
  'react-native/Libraries/Components/Touchable/TouchableWithoutFeedback': 'react-native-web/dist/exports/TouchableWithoutFeedback',
  'react-native/Libraries/Components/View/View': 'react-native-web/dist/exports/View',
  'react-native/Libraries/Components/View/ViewNativeComponent': 'react-native-web/dist/exports/View',
  'react-native/Libraries/Image/Image': 'react-native-web/dist/exports/Image',
  'react-native/Libraries/Image/AssetSourceResolver': 'react-native-web/dist/exports/Image',
  'react-native/Libraries/Lists/FlatList': 'react-native-web/dist/exports/FlatList',
  'react-native/Libraries/Lists/SectionList': 'react-native-web/dist/exports/SectionList',
  'react-native/Libraries/Lists/VirtualizedList': 'react-native-web/dist/vendor/react-native/VirtualizedList/index',
  'react-native/Libraries/Lists/VirtualizedSectionList': 'react-native-web/dist/vendor/react-native/VirtualizedSectionList/index',
  'react-native/Libraries/Lists/FillRateHelper': 'react-native-web/dist/vendor/react-native/FillRateHelper/index',
  'react-native/Libraries/Lists/ViewabilityHelper': 'react-native-web/dist/vendor/react-native/ViewabilityHelper/index',
  'react-native/Libraries/Linking/Linking': 'react-native-web/dist/exports/Linking',
  'react-native/Libraries/Network/XMLHttpRequest': path.resolve(__dirname, 'stubs/XMLHttpRequest.js'),
  'react-native/Libraries/Pressability/Pressability': 'react-native-web/dist/exports/Pressable',
  'react-native/Libraries/Pressability/HoverState': 'react-native-web/dist/exports/Pressable',
  'react-native/Libraries/StyleSheet/StyleSheet': 'react-native-web/dist/exports/StyleSheet',
  'react-native/Libraries/StyleSheet/normalizeColor': 'react-native-web/dist/exports/StyleSheet',
  'react-native/Libraries/StyleSheet/processColor': 'react-native-web/dist/exports/StyleSheet',
  'react-native/Libraries/StyleSheet/PlatformColorValueTypes': path.resolve(__dirname, 'stubs/PlatformColorValueTypes.js'),
  'react-native/Libraries/Text/Text': 'react-native-web/dist/exports/Text',
  'react-native/Libraries/Utilities/Platform': 'react-native-web/dist/exports/Platform',
  'react-native/Libraries/Utilities/BackHandler': 'react-native-web/dist/exports/BackHandler',
  'react-native/Libraries/Utilities/DevSettings': path.resolve(__dirname, 'stubs/DevToolsSettingsManager.js'),
  'react-native/Libraries/Utilities/DevToolsSettings/DevToolsSettingsManager': path.resolve(__dirname, 'stubs/DevToolsSettingsManager.js'),
  'react-native/Libraries/Utilities/HMRClient': path.resolve(__dirname, 'stubs/HMRClient.js'),
  'react-native/Libraries/Utilities/differ/matricesDiffer': path.resolve(__dirname, 'stubs/matricesDiffer.js'),
  'react-native/Libraries/Utilities/differ/sizesDiffer': path.resolve(__dirname, 'stubs/sizesDiffer.js'),
  'react-native/Libraries/WebSocket/WebSocket': path.resolve(__dirname, 'stubs/WebSocket.js'),
  'react-native/Libraries/WebSocket/WebSocketInterceptor': path.resolve(__dirname, 'stubs/WebSocket.js'),
  'react-native/Libraries/EventEmitter/NativeEventEmitter': 'react-native-web/dist/vendor/react-native/NativeEventEmitter',
  'react-native/Libraries/ReactNative/AppContainer': 'react-native-web/dist/exports/AppRegistry',
  'react-native/Libraries/ReactNative/renderApplication': path.resolve(__dirname, 'stubs/renderApplication.js'),
  'react-native/Libraries/ReactNative/PaperUIManager': path.resolve(__dirname, 'stubs/UIManager.js'),
  'react-native/Libraries/ReactNative/UIManager': path.resolve(__dirname, 'stubs/UIManager.js'),
  'react-native/Libraries/ReactNative/UIManagerProperties': path.resolve(__dirname, 'stubs/UIManagerProperties.js'),
  'react-native/Libraries/ReactNative/ReactNativeFeatureFlags': path.resolve(__dirname, 'stubs/ReactNativeFeatureFlags.js'),
  'react-native/Libraries/ReactPrivate/ReactNativePrivateInterface': path.resolve(__dirname, 'stubs/ReactNativePrivateInterface.js'),
  'react-native/Libraries/NativeComponent/PlatformBaseViewConfig': path.resolve(__dirname, 'stubs/ReactNativeViewViewConfig.js'),
  'react-native/Libraries/NativeComponent/ViewConfigIgnore': path.resolve(__dirname, 'stubs/ReactNativeViewViewConfig.js'),
  'react-native/Libraries/Components/View/ReactNativeStyleAttributes': path.resolve(__dirname, 'stubs/ReactNativeStyleAttributes.js'),
  'react-native/Libraries/Components/View/ReactNativeViewViewConfig': path.resolve(__dirname, 'stubs/ReactNativeViewViewConfig.js'),
  'react-native/Libraries/Components/View/ReactNativeViewViewConfigAndroid': path.resolve(__dirname, 'stubs/ReactNativeViewViewConfig.js'),
  'react-native/Libraries/Network/RCTNetworking': path.resolve(__dirname, 'stubs/RCTNetworking.js'),
  'react-native/Libraries/Alert/RCTAlertManager': path.resolve(__dirname, 'stubs/RCTAlertManager.js'),
  'react-native/Libraries/Core/NativeExceptionsManager': path.resolve(__dirname, 'stubs/NativeExceptionsManager.js'),
  'react-native/Libraries/Core/ReactNativeVersionCheck': path.resolve(__dirname, 'stubs/ReactNativeVersionCheck.js'),
  'react-native/Libraries/Core/setUpDeveloperTools': path.resolve(__dirname, 'stubs/empty.js'),
  'react-native/Libraries/Core/setUpReactDevTools': path.resolve(__dirname, 'stubs/empty.js'),
  'react-native/Libraries/LogBox/LogBox': path.resolve(__dirname, 'stubs/empty.js'),
  'react-native/Libraries/LogBox/UI/LogBoxInspectorCodeFrame': path.resolve(__dirname, 'stubs/empty.js'),
  'react-native/Libraries/LogBox/UI/LogBoxInspectorHeader': path.resolve(__dirname, 'stubs/empty.js'),
  'react-native/Libraries/LogBox/UI/LogBoxInspectorReactFrames': path.resolve(__dirname, 'stubs/empty.js'),
  'react-native/Libraries/LogBox/UI/LogBoxInspectorStackFrame': path.resolve(__dirname, 'stubs/empty.js'),
  'react-native/Libraries/LogBox/UI/LogBoxNotification': path.resolve(__dirname, 'stubs/empty.js'),
  'react-native/Libraries/LayoutAnimation/LayoutAnimation': path.resolve(__dirname, 'stubs/empty.js'),
  'react-native/Libraries/Inspector/Inspector': path.resolve(__dirname, 'stubs/empty.js'),
  'react-native/Libraries/Components/TraceUpdateOverlay/TraceUpdateOverlay': path.resolve(__dirname, 'stubs/empty.js'),
  'react-native/Libraries/Components/AccessibilityInfo/legacySendAccessibilityEvent': path.resolve(__dirname, 'stubs/legacySendAccessibilityEvent.js'),
  'react-native/Libraries/Image/AssetRegistry': path.resolve(__dirname, 'stubs/AssetRegistry.js'),
  'react-native/Libraries/Image/resolveAssetSource': path.resolve(__dirname, 'stubs/AssetRegistry.js'),
};

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Plugin to redirect all react-native internal paths
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /^react-native\/Libraries\//,
      (resource) => {
        // Strip query string and normalize the request
        const requestPath = resource.request.replace(/\?.*$/, '');

        if (RNW_ALIASES[requestPath]) {
          resource.request = RNW_ALIASES[requestPath];
        } else {
          // Fallback: redirect unknown react-native internals to empty stub
          resource.request = path.resolve(__dirname, 'stubs/empty.js');
        }
      }
    )
  );

  // react-native-maps contains JSX and is never used on web (MapScreen.web.tsx uses Leaflet)
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /^react-native-maps$/,
      path.resolve(__dirname, 'stubs/empty.js')
    )
  );

  // @gorhom/bottom-sheet Touchables.js imports from react-native-gesture-handler
  // which doesn't export touchables on web — redirect to react-native-web touchables
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(
      /^\.[\\/]?Touchables$/,
      (resource) => {
        if (
          resource.context &&
          resource.context.includes('@gorhom/bottom-sheet') &&
          resource.context.includes('touchables')
        ) {
          resource.request = path.resolve(__dirname, 'stubs/GorhomTouchables.js');
        }
      }
    )
  );

  return config;
};
