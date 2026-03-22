import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.minibot.app',
  appName: 'Mini Bot',
  webDir: 'dist',
  android: {
    allowEdgeToEdge: true
  }
};

export default config;
