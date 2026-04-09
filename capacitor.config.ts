import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.wave.chat',
  appName: 'Wave',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
};

export default config;
