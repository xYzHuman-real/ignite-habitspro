import { Capacitor } from "@capacitor/core";

/**
 * AdMob configuration — keep IDs here so they can be swapped easily.
 * Test IDs are used automatically outside of production builds.
 */
export const ADMOB_CONFIG = {
  androidAppId: "ca-app-pub-4277470186530282~4160816796",
  rewardedAdUnitId: {
    android: "ca-app-pub-4277470186530282/5380394113",
    // Google's official test unit — used in dev/preview builds
    test: "ca-app-pub-3940256099942544/5224354917",
  },
  /** Points granted per successfully completed rewarded ad */
  rewardPoints: 10,
} as const;

export const isNativeAdMob = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

/** Live IDs only in production builds; test ads everywhere else. */
export const useTestAds = !import.meta.env.PROD;

export const getRewardedAdUnitId = () =>
  useTestAds ? ADMOB_CONFIG.rewardedAdUnitId.test : ADMOB_CONFIG.rewardedAdUnitId.android;

let initialized = false;

/** Initialize the Mobile Ads SDK once at app start. Safe no-op on web. */
export async function initAdMob(): Promise<boolean> {
  if (!isNativeAdMob() || initialized) return initialized;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.initialize({
      initializeForTesting: useTestAds,
      testingDevices: [],
    });
    initialized = true;
  } catch (err) {
    console.warn("[AdMob] initialization failed", err);
    initialized = false;
  }
  return initialized;
}

/** Interstitial ad unit IDs (shown after a focus session ends). */
export const INTERSTITIAL_AD_UNIT = {
  android: "ca-app-pub-4277470186530282/9115549012",
  // Google's official test interstitial unit
  test: "ca-app-pub-3940256099942544/1033173712",
} as const;

export const getInterstitialAdUnitId = () =>
  useTestAds ? INTERSTITIAL_AD_UNIT.test : INTERSTITIAL_AD_UNIT.android;

let interstitialInFlight = false;

/**
 * Prepare + show an interstitial ad. Fails silently on web or on any error
 * so the user flow is never blocked.
 */
export async function showInterstitialAd(): Promise<boolean> {
  if (!isNativeAdMob() || interstitialInFlight) return false;
  interstitialInFlight = true;
  try {
    const ok = await initAdMob();
    if (!ok) return false;
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.prepareInterstitial({
      adId: getInterstitialAdUnitId(),
      isTesting: useTestAds,
    });
    await AdMob.showInterstitial();
    return true;
  } catch (err) {
    console.warn("[AdMob] interstitial unavailable", err);
    return false;
  } finally {
    interstitialInFlight = false;
  }
}
