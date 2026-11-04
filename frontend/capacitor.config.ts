import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apex.stockiq',
  appName: 'StockIQ Enterprise',
  webDir: 'dist/web/browser',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#080c14'
    }
  }
};

export default config;

