import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ignitehabitspro',
  appName: 'ignite-habitspro',
  webDir: 'dist',
  server: {
    url: 'https://ignite-habitspro.lovable.app',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    AdMob: {
      // Writes com.google.android.gms.ads.APPLICATION_ID to AndroidManifest.xml on sync
      appId: 'ca-app-pub-4277470186530282~4160816796',
    },
  },
};

export default config;
