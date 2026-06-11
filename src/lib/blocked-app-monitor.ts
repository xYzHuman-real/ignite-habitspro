// Thin wrapper around a custom Android Capacitor plugin that detects when the
// user opens a blocked app during a focus session, using UsageStatsManager.
//
// The native side lives in docs/native-blocked-apps.md as copy-paste Kotlin
// you add after `npx cap add android`. On web (and before the plugin is
// installed) every call is a safe no-op so the rest of the app keeps working.

import { Capacitor } from "@capacitor/core";

export const DEFAULT_BLOCKED_PACKAGES = [
  "com.instagram.android",
  "com.google.android.youtube",
  "com.zhiliaoapp.musically",      // TikTok
  "com.ss.android.ugc.trill",      // TikTok (intl variants)
  "com.facebook.katana",
  "com.twitter.android",            // X
  "com.snapchat.android",
  "com.reddit.frontpage",
];

interface BlockedAppMonitorPlugin {
  hasUsageAccess(): Promise<{ granted: boolean }>;
  openUsageAccessSettings(): Promise<void>;
  requestIgnoreBatteryOptimizations(): Promise<void>;
  openAppSettings(): Promise<void>;
  startMonitoring(opts: { packages: string[]; pollMs?: number }): Promise<void>;
  stopMonitoring(): Promise<void>;
  addListener(
    event: "blockedAppOpened",
    cb: (e: { package: string }) => void
  ): Promise<{ remove: () => void }>;
}

function getPlugin(): BlockedAppMonitorPlugin | null {
  if (!Capacitor.isNativePlatform()) return null;
  const win = window as any;
  return win?.Capacitor?.Plugins?.BlockedAppMonitor ?? null;
}

export async function startBlockedAppMonitor(
  onBlocked: (pkg: string) => void,
  packages: string[] = DEFAULT_BLOCKED_PACKAGES
): Promise<() => void> {
  const plugin = getPlugin();
  if (!plugin) return () => {};
  try {
    const listener = await plugin.addListener("blockedAppOpened", (e) => onBlocked(e.package));
    await plugin.startMonitoring({ packages, pollMs: 1500 });
    return async () => {
      try { await plugin.stopMonitoring(); } catch {}
      listener.remove();
    };
  } catch {
    return () => {};
  }
}
