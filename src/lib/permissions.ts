// Premium permission flow: primer dialog → native request → record outcome.
// Web is a no-op (returns granted=true) so flows work in the preview.
import { Capacitor } from "@capacitor/core";

export type PermissionKey =
  | "notifications"
  | "usage_access"
  | "battery_optimization"
  | "background_activity";

const RECORD_PREFIX = "perm:";

export function getPermissionState(key: PermissionKey): "granted" | "denied" | "unknown" {
  try {
    return (localStorage.getItem(RECORD_PREFIX + key) as any) || "unknown";
  } catch {
    return "unknown";
  }
}

export function setPermissionState(key: PermissionKey, state: "granted" | "denied") {
  try { localStorage.setItem(RECORD_PREFIX + key, state); } catch {}
}

export function shouldShowPrimer(key: PermissionKey): boolean {
  return getPermissionState(key) === "unknown";
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    setPermissionState("notifications", "granted");
    return true;
  }
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    const res = await LocalNotifications.requestPermissions();
    const granted = res.display === "granted";
    setPermissionState("notifications", granted ? "granted" : "denied");
    return granted;
  } catch {
    setPermissionState("notifications", "denied");
    return false;
  }
}

// These three (usage access, battery opt, background activity) require system
// settings pages on Android — typically opened via a custom plugin. We mark
// them granted optimistically once the user confirms; the native blocked-app
// monitor plugin can re-verify and re-prompt as needed.
export async function openUsageAccessSettings(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const win = window as any;
      // Expects a custom plugin exposed as `BlockedAppMonitor` (see docs/native-blocked-apps.md).
      await win?.Capacitor?.Plugins?.BlockedAppMonitor?.openUsageAccessSettings?.();
    } catch { /* noop */ }
  }
  setPermissionState("usage_access", "granted");
}

export async function openBatteryOptimizationSettings(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const win = window as any;
      await win?.Capacitor?.Plugins?.BlockedAppMonitor?.requestIgnoreBatteryOptimizations?.();
    } catch { /* noop */ }
  }
  setPermissionState("battery_optimization", "granted");
}

export async function openBackgroundActivitySettings(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const win = window as any;
      await win?.Capacitor?.Plugins?.BlockedAppMonitor?.openAppSettings?.();
    } catch { /* noop */ }
  }
  setPermissionState("background_activity", "granted");
}
