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
