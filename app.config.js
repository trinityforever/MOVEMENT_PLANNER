module.exports = {
  expo: {
    name: "Movement Planning",
    slug: "movement-planning",
    version: "1.0.0",
    sdkVersion: "49.0.0",
    platforms: ["ios", "android", "web"],
    scheme: "movement-planning",
    jsEngine: "hermes",
    plugins: ["expo-router"],
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    ios: {
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  },
};
