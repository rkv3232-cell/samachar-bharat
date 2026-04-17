import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.samacharbharat',
  appName: 'Samachar Bharat',
  webDir: 'public',
  server: {
    url: 'http://192.168.1.3:3000',
    cleartext: true
  }
};

export default config;
