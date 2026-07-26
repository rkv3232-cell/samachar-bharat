import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.samacharbharat',
  appName: 'Samachar Bharat',
  webDir: 'public',
  server: {
    url: 'https://samachar-bharat-liard.vercel.app',
    cleartext: true
  }
};

export default config;
