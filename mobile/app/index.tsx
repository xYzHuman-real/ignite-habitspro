import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import mobileAds, { AdEventType, InterstitialAd, RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const WEB_APP_URL = 'file:///android_asset/www/index.html';
const APP_PACKAGE = 'app.lovable.ignitehabitspro';
const USE_TEST_ADS = true;
const LIVE_REWARDED_AD = 'ca-app-pub-4277470186530282/5380394113';
const LIVE_INTERSTITIAL_AD = 'ca-app-pub-4277470186530282/9115549012';

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

async function initializeAds() {
  try {
    await mobileAds().initialize();
    return true;
  } catch (error) {
    console.warn('[AdMob] initialization failed', error);
    return false;
  }
}

async function showInterstitial() {
  if (!(await initializeAds())) return false;
  const ad = InterstitialAd.createForAdRequest(USE_TEST_ADS ? TestIds.INTERSTITIAL : LIVE_INTERSTITIAL_AD, {
    requestNonPersonalizedAdsOnly: true,
  });

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (shown: boolean) => {
      if (settled) return;
      settled = true;
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      resolve(shown);
    };
    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => ad.show());
    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => finish(true));
    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('[AdMob] interstitial error', error);
      finish(false);
    });
    ad.load();
    setTimeout(() => finish(false), 30000);
  });
}

async function showRewarded() {
  if (!(await initializeAds())) return null;
  const ad = RewardedAd.createForAdRequest(USE_TEST_ADS ? TestIds.REWARDED : LIVE_REWARDED_AD, {
    requestNonPersonalizedAdsOnly: true,
  });

  return new Promise<{ amount: number; type?: string } | null>((resolve) => {
    let settled = false;
    let reward: { amount: number; type?: string } | null = null;
    const finish = () => {
      if (settled) return;
      settled = true;
      unsubscribeLoaded();
      unsubscribeReward();
      unsubscribeClosed();
      unsubscribeError();
      resolve(reward);
    };
    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => ad.show());
    const unsubscribeReward = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (value) => {
      reward = { amount: value.amount, type: value.type };
    });
    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, finish);
    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.warn('[AdMob] rewarded error', error);
      finish();
    });
    ad.load();
    setTimeout(finish, 60000);
  });
}

export default function Index() {
  const [ready, setReady] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    void initializeAds();
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
        const initialized = await initializeAds();
        sendToWebView(webViewRef, { type: 'ads_initialized', initialized });
        return;
      }

      if (message.type === 'show_interstitial') {
        const shown = await showInterstitial();
        sendToWebView(webViewRef, { type: 'interstitial_result', shown });
        return;
      }

      if (message.type === 'show_rewarded') {
        const reward = await showRewarded();
        sendToWebView(webViewRef, {
          type: 'rewarded_result',
          rewarded: Boolean(reward),
          amount: reward?.amount ?? 0,
          rewardType: reward?.type ?? null,
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
        databaseEnabled
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
