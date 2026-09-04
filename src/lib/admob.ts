import { Capacitor } from "@capacitor/core";

export const ADMOB_CONFIG = {
  androidAppId: "ca-app-pub-4277470186530282~4160816796",
  rewardedAdUnitId: {
    android: "ca-app-pub-4277470186530282/5380394113",
    test: "ca-app-pub-3940256099942544/5224354917",
  },
  rewardPoints: 10,
} as const;

const isReactNativeWebView = () =>
  typeof window !== "undefined" && typeof (window as any).ReactNativeWebView?.postMessage === "function";

function postToNative(message: object) {
  try {
    (window as any).ReactNativeWebView?.postMessage(JSON.stringify(message));
  } catch {}
}

export const isNativeAdMob = () =>
  (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") || isReactNativeWebView();

export const useTestAds = !import.meta.env.PROD;

export const getRewardedAdUnitId = () =>
  useTestAds ? ADMOB_CONFIG.rewardedAdUnitId.test : ADMOB_CONFIG.rewardedAdUnitId.android;

let initialized = false;

export async function initAdMob(): Promise<boolean> {
  if (isReactNativeWebView()) {
    if (initialized) return true;
    postToNative({ type: "initialize_ads" });
    initialized = true;
    return true;
  }
  if (!Capacitor.isNativePlatform() || initialized) return initialized;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.initialize({ initializeForTesting: useTestAds, testingDevices: [] });
    initialized = true;
  } catch (err) {
    console.warn("[AdMob] initialization failed", err);
    initialized = false;
  }
  return initialized;
}

export const INTERSTITIAL_AD_UNIT = {
  android: "ca-app-pub-4277470186530282/9115549012",
  test: "ca-app-pub-3940256099942544/1033173712",
} as const;

export const getInterstitialAdUnitId = () =>
  useTestAds ? INTERSTITIAL_AD_UNIT.test : INTERSTITIAL_AD_UNIT.android;

let interstitialInFlight = false;

export async function showInterstitialAd(): Promise<boolean> {
  if (!isNativeAdMob() || interstitialInFlight) return false;
  interstitialInFlight = true;
  try {
    if (isReactNativeWebView()) {
      await initAdMob();
      return await new Promise<boolean>((resolve) => {
        let settled = false;
        const finish = (shown: boolean) => {
          if (settled) return;
          settled = true;
          window.removeEventListener("igniteNativeMessage", onMessage as EventListener);
          resolve(shown);
        };
        const onMessage = (event: Event) => {
          const detail = (event as CustomEvent).detail;
          if (detail?.type === "interstitial_result") finish(detail.shown === true);
        };
        window.addEventListener("igniteNativeMessage", onMessage as EventListener);
        postToNative({ type: "show_interstitial" });
        window.setTimeout(() => finish(false), 30000);
      });
    }

    const ok = await initAdMob();
    if (!ok) return false;
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.prepareInterstitial({ adId: getInterstitialAdUnitId(), isTesting: useTestAds });
    await AdMob.showInterstitial();
    return true;
  } catch (err) {
    console.warn("[AdMob] interstitial unavailable", err);
    return false;
  } finally {
    interstitialInFlight = false;
  }
}
