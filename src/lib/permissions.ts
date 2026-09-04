// Premium permission flow: primer dialog → native request → record outcome.
// Web is a no-op; the Android WebView shell exposes a small native bridge.
import { Capacitor } from "@capacitor/core";

export type PermissionKey =
  | "notifications"
  | "usage_access"
  | "battery_optimization"
  | "background_activity";

const RECORD_PREFIX = "perm:";

const isReactNativeWebView = () =>
  typeof window !== "undefined" && typeof (window as any).ReactNativeWebView?.postMessage === "function";

function postToNative(message: object) {
  try {
    (window as any).ReactNativeWebView?.postMessage(JSON.stringify(message));
  } catch {}
}

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
  if (isReactNativeWebView()) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (granted: boolean) => {
        if (settled) return;
        settled = true;
        window.removeEventListener("igniteNativeMessage", onMessage as EventListener);
        setPermissionState("notifications", granted ? "granted" : "denied");
        resolve(granted);
      };
      const onMessage = (event: Event) => {
        const detail = (event as CustomEvent).detail;
        if (detail?.type === "notifications_result") finish(detail.granted === true);
      };
      window.addEventListener("igniteNativeMessage", onMessage as EventListener);
      postToNative({ type: "request_notifications" });
      window.setTimeout(() => finish(false), 15000);
    });
  }

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

export async function openUsageAccessSettings(): Promise<void> {
  if (isReactNativeWebView()) {
    postToNative({ type: "open_usage_access" });
  } else if (Capacitor.isNativePlatform()) {
    try {
      const win = window as any;
      await win?.Capacitor?.Plugins?.BlockedAppMonitor?.openUsageAccessSettings?.();
    } catch {}
  }
  setPermissionState("usage_access", "granted");
}

export async function openBatteryOptimizationSettings(): Promise<void> {
  if (isReactNativeWebView()) {
    postToNative({ type: "open_battery_optimization" });
  } else if (Capacitor.isNativePlatform()) {
    try {
      const win = window as any;
      await win?.Capacitor?.Plugins?.BlockedAppMonitor?.requestIgnoreBatteryOptimizations?.();
    } catch {}
  }
  setPermissionState("battery_optimization", "granted");
}

export async function openBackgroundActivitySettings(): Promise<void> {
  if (isReactNativeWebView()) {
    postToNative({ type: "open_app_settings" });
  } else if (Capacitor.isNativePlatform()) {
    try {
      const win = window as any;
      await win?.Capacitor?.Plugins?.BlockedAppMonitor?.openAppSettings?.();
    } catch {}
  }
  setPermissionState("background_activity", "granted");
}
