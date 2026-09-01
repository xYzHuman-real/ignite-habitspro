import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ignitehabitspro',
  appName: 'Ignite HabitPro',
  // Production builds package the compiled web app from dist. Do not set
  // server.url here: a remote URL would make the released Android app depend
  // on a mutable hosted website instead of the reviewed app bundle.
  webDir: 'dist',
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
  },
};

export default config;
