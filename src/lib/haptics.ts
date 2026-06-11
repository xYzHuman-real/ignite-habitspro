// Haptics with safe web fallback. Native impact via Capacitor when available.
import { Capacitor } from "@capacitor/core";

let nativeHaptics: typeof import("@capacitor/haptics") | null = null;

async function load() {
  if (nativeHaptics || !Capacitor.isNativePlatform()) return nativeHaptics;
  try {
    nativeHaptics = await import("@capacitor/haptics");
  } catch {
    nativeHaptics = null;
  }
  return nativeHaptics;
}

function enabled() {
  try {
    const v = localStorage.getItem("pref_haptic");
    // useLocalPref stores JSON
    return v === null ? true : JSON.parse(v) !== false;
  } catch {
    return true;
  }
}

function webVibrate(ms: number) {
  try { navigator.vibrate?.(ms); } catch { /* noop */ }
}

export async function hapticLight() {
  if (!enabled()) return;
  if (Capacitor.isNativePlatform()) {
    const h = await load();
    h?.Haptics.impact({ style: h.ImpactStyle.Light }).catch(() => {});
  } else {
    webVibrate(10);
  }
}

export async function hapticMedium() {
  if (!enabled()) return;
  if (Capacitor.isNativePlatform()) {
    const h = await load();
    h?.Haptics.impact({ style: h.ImpactStyle.Medium }).catch(() => {});
  } else {
    webVibrate(18);
  }
}

export async function hapticSuccess() {
  if (!enabled()) return;
  if (Capacitor.isNativePlatform()) {
    const h = await load();
    h?.Haptics.notification({ type: h.NotificationType.Success }).catch(() => {});
  } else {
    webVibrate(25);
  }
}
