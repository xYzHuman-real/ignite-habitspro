import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as IntentLauncher from 'expo-intent-launcher';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const WEB_APP_URL = 'file:///android_asset/www/index.html';
const APP_PACKAGE = 'app.lovable.ignitehabitspro';

function sendToWebView(webView: React.RefObject<WebView | null>, message: object) {
  const script = `window.dispatchEvent(new CustomEvent('igniteNativeMessage',{detail:${JSON.stringify(message)}})); true;`;
  webView.current?.injectJavaScript(script);
}

export default function Index() {
  const [ready, setReady] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    // Notifications are temporarily disabled in the native shell for crash isolation.
    return undefined;
  }, []);

  const handleMessage = async (event: WebViewMessageEvent) => {
    if (Platform.OS !== 'android') return;
    let message: any;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    try {
      if (message.type === 'initialize_ads') {
        sendToWebView(webViewRef, { type: 'ads_initialized', initialized: false });
        return;
      }

      if (message.type === 'show_interstitial') {
        sendToWebView(webViewRef, { type: 'interstitial_result', shown: false });
        return;
      }

      if (message.type === 'show_rewarded') {
        sendToWebView(webViewRef, {
          type: 'rewarded_result',
          rewarded: false,
          amount: 0,
          rewardType: null,
        });
        return;
      }

      if (message.type === 'request_notifications') {
        sendToWebView(webViewRef, {
          type: 'notifications_result',
          granted: false,
          token: null,
          platform: 'android',
        });
        return;
      }

      if (message.type === 'open_usage_access') {
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.USAGE_ACCESS_SETTINGS);
        sendToWebView(webViewRef, { type: 'settings_opened', setting: 'usage_access' });
        return;
      }

      if (message.type === 'open_battery_optimization') {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
          { data: `package:${APP_PACKAGE}` },
        );
        sendToWebView(webViewRef, { type: 'settings_opened', setting: 'battery_optimization' });
        return;
      }

      if (message.type === 'open_app_settings') {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
          { data: `package:${APP_PACKAGE}` },
        );
        sendToWebView(webViewRef, { type: 'settings_opened', setting: 'background_activity' });
      }
    } catch (error) {
      console.warn('[Native bridge] request failed', message?.type, error);
      sendToWebView(webViewRef, { type: 'native_error', request: message?.type ?? 'unknown' });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        style={styles.webview}
        originWhitelist={['*']}
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        setSupportMultipleWindows={false}
        onMessage={handleMessage}
        onLoadEnd={() => setReady(true)}
      />
      {!ready && (
        <View style={styles.loading} pointerEvents="none">
          <ActivityIndicator size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: '#1a1a2e' },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a2e',
  },
});
