import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, StyleSheet, View, Platform, ToastAndroid } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as IntentLauncher from 'expo-intent-launcher';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const WEB_APP_URL = 'file:///android_asset/www/index.html';
const APP_PACKAGE = 'app.lovable.ignitehabitspro';
const INSTALLED_APPS_ACTION = 'app.lovable.ignitehabitspro.GET_INSTALLED_APPS';
const INSTALLED_APPS_EXTRA = 'app.lovable.ignitehabitspro.installedApps';
const APP_PACKAGES: Record<string, string> = {
  Instagram: 'com.instagram.android', Facebook: 'com.facebook.katana', 'X (Twitter)': 'com.twitter.android', Snapchat: 'com.snapchat.android', Reddit: 'com.reddit.frontpage', Pinterest: 'com.pinterest', LinkedIn: 'com.linkedin.android',
  YouTube: 'com.google.android.youtube', 'YouTube Shorts': 'com.google.android.apps.youtube.creator', TikTok: 'com.zhiliaoapp.musically',
  Messenger: 'com.facebook.orca', WhatsApp: 'com.whatsapp', Telegram: 'org.telegram.messenger', Discord: 'com.discord',
  Netflix: 'com.netflix.mediaclient', 'Prime Video': 'com.amazon.avod.thirdpartyclient', Twitch: 'tv.twitch.android.app', Spotify: 'com.spotify.music',
  BGMI: 'com.pubg.imobile', 'Free Fire': 'com.dts.freefireth', 'Clash of Clans': 'com.supercell.clashofclans', 'Clash Royale': 'com.supercell.clashroyale', 'Call of Duty Mobile': 'com.activision.callofduty.shooter',
  Amazon: 'in.amazon.mShop.android.shopping', Flipkart: 'com.flipkart.android', Myntra: 'com.myntra.android',
};

function sendToWebView(webView: React.RefObject<WebView | null>, message: object) {
  const script = `window.dispatchEvent(new CustomEvent('igniteNativeMessage',{detail:${JSON.stringify(message)}})); true;`;
  webView.current?.injectJavaScript(script);
}

export default function Index() {
  const [ready, setReady] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const lastBackPressRef = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBackRef.current) { webViewRef.current?.goBack(); return true; }
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) { BackHandler.exitApp(); return true; }
      lastBackPressRef.current = now;
      ToastAndroid.show('Click back twice to exit the app', ToastAndroid.SHORT);
      return true;
    });
    return () => subscription.remove();
  }, []);

  const startFocusGuard = async (message: any) => {
    const configuredPackages: string[] = message?.settings?.blockedAppPackages || [];
    const names: string[] = message?.settings?.blockedApps || [];
    const packages = configuredPackages.length ? configuredPackages : names.map(name => APP_PACKAGES[name]).filter(Boolean);
    if (!packages.length || !message?.timerState?.endTime) return;
    try {
      await IntentLauncher.startActivityAsync('app.lovable.ignitehabitspro.START_FOCUS_GUARD', {
        packageName: APP_PACKAGE,
        className: '.FocusGuardStarterActivity',
        extra: {
          'app.lovable.ignitehabitspro.blockedPackages': JSON.stringify(packages),
          'app.lovable.ignitehabitspro.endTime': message.timerState.endTime,
        },
      });
    } catch (error) { console.warn('[Focus Guard] unable to start', error); }
  };

  const stopFocusGuard = async () => {
    try { await IntentLauncher.startActivityAsync('app.lovable.ignitehabitspro.STOP_FOCUS_GUARD', { packageName: APP_PACKAGE, className: '.FocusGuardStarterActivity' }); }
    catch (error) { console.warn('[Focus Guard] unable to stop', error); }
  };

  const getInstalledApps = async () => {
    try {
      const result = await IntentLauncher.startActivityAsync(INSTALLED_APPS_ACTION, {
        packageName: APP_PACKAGE,
        className: '.FocusGuardStarterActivity',
      });
      const raw = result?.extra?.[INSTALLED_APPS_EXTRA];
      const baseApps = typeof raw === 'string' ? JSON.parse(raw) : [];
      const apps: Array<{ name: string; packageName: string; icon?: string }> = [];
      for (let start = 0; start < baseApps.length; start += 12) {
        const batch = baseApps.slice(start, start + 12);
        const enriched = await Promise.all(batch.map(async (app: { name: string; packageName: string }) => {
          try {
            const icon = await IntentLauncher.getApplicationIconAsync(app.packageName);
            return { ...app, icon: icon || undefined };
          } catch {
            return app;
          }
        }));
        apps.push(...enriched);
      }
      sendToWebView(webViewRef, { type: 'installed_apps_result', apps });
    } catch (error) {
      console.warn('[Focus Guard] unable to discover installed apps', error);
      sendToWebView(webViewRef, { type: 'installed_apps_result', apps: [] });
    }
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    if (Platform.OS !== 'android') return;
    let message: any;
    try { message = JSON.parse(event.nativeEvent.data); } catch { return; }
    try {
      if (message.type === 'initialize_ads') { sendToWebView(webViewRef, { type: 'ads_initialized', initialized: false }); return; }
      if (message.type === 'show_interstitial') { sendToWebView(webViewRef, { type: 'interstitial_result', shown: false }); return; }
      if (message.type === 'show_rewarded') { sendToWebView(webViewRef, { type: 'rewarded_result', rewarded: false, amount: 0, rewardType: null }); return; }
      if (message.type === 'request_notifications') { sendToWebView(webViewRef, { type: 'notifications_result', granted: false, token: null, platform: 'android' }); return; }
      if (message.type === 'get_installed_apps') { await getInstalledApps(); return; }
      if (message.type === 'open_usage_access') { await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.USAGE_ACCESS_SETTINGS); sendToWebView(webViewRef, { type: 'settings_opened', setting: 'usage_access' }); return; }
      if (message.type === 'open_overlay_permission') { await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.MANAGE_OVERLAY_PERMISSION, { data: `package:${APP_PACKAGE}` }); sendToWebView(webViewRef, { type: 'settings_opened', setting: 'overlay_permission' }); return; }
      if (message.type === 'focus_guard_sync') { await startFocusGuard(message); return; }
      if (message.type === 'focus_guard_stop') { await stopFocusGuard(); return; }
      if (message.type === 'open_battery_optimization') { await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, { data: `package:${APP_PACKAGE}` }); sendToWebView(webViewRef, { type: 'settings_opened', setting: 'battery_optimization' }); return; }
      if (message.type === 'open_app_settings') { await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS, { data: `package:${APP_PACKAGE}` }); sendToWebView(webViewRef, { type: 'settings_opened', setting: 'background_activity' }); return; }
    } catch (error) { console.warn('[Native bridge] request failed', message?.type, error); sendToWebView(webViewRef, { type: 'native_error', request: message?.type ?? 'unknown' }); }
  };

  return <View style={styles.container}><StatusBar style="auto" /><WebView ref={webViewRef} source={{ uri: WEB_APP_URL }} style={styles.webview} originWhitelist={['*']} allowFileAccess allowFileAccessFromFileURLs allowUniversalAccessFromFileURLs javaScriptEnabled domStorageEnabled sharedCookiesEnabled thirdPartyCookiesEnabled setSupportMultipleWindows={false} mediaPlaybackRequiresUserAction={false} onMessage={handleMessage} onShouldStartLoadWithRequest={(request) => { const url = request.url; if (url.startsWith('http://') || url.startsWith('https://')) { Linking.openURL(url).catch((error) => console.warn('[Native link] failed', error)); return false; } return true; }} onNavigationStateChange={(navState) => { canGoBackRef.current = navState.canGoBack; }} onLoadEnd={() => setReady(true)} />{!ready && <View style={styles.loading} pointerEvents="none"><ActivityIndicator size="large" /></View>}</View>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, webview: { flex: 1, backgroundColor: '#1a1a2e' }, loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' } });
