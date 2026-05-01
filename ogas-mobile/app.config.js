export default {
  expo: {
    name: "Ogas LPG Marketplace",
    slug: "ogas-lpg-marketplace",
    owner: "ogas-ventures",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "ogas-lpg-marketplace",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    updates: {
      url: "https://u.expo.dev/746ac3f5-301d-48f9-9a77-56b3303ab6d2",
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ogasventures.ogasmarketplace"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.ogasventures.ogasmarketplace"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "746ac3f5-301d-48f9-9a77-56b3303ab6d2"
      }
    }
  }
};
