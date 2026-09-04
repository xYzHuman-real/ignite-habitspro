import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const WEB_APP_URL = 'file:///android_asset/www/index.html';
const APP_PACKAGE = 'app.lovable.ignitehabitspro';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function sendToWebView(webView: React.RefObject<WebView | null>, message: object) {
  const script = `window.dispatchEvent(new CustomEvent('igniteNativeMessage',{detail:${JSON.stringify(message)}})); true;`;
  webView.current?.injectJavaScript(script);
}

export default function Index() {
  const [ready, setReady] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data ?? {};
      sendToWebView(webViewRef, {
        type: 'notification_opened',
        action_url: typeof data.action_url === 'string' ? data.action_url : null,
      });
    });
    return () => responseSubscription.remove();
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
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Ignite reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        let permission = await Notifications.getPermissionsAsync();
        if (!permission.granted) permission = await Notifications.requestPermissionsAsync();

        let nativeToken: string | null = null;
        if (permission.granted) {
          try {
            const token = await Notifications.getDevicePushTokenAsync();
            nativeToken = typeof token.data === 'string' ? token.data : null;
          } catch (error) {
            console.warn('[Notifications] native push token unavailable', error);
          }
        }

        sendToWebView(webViewRef, {
          type: 'notifications_result',
          granted: permission.granted,
          token: nativeToken,
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
