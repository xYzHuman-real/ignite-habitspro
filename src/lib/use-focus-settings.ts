import { useState, useEffect } from "react";

export interface FocusSettings {
  blockedApps: string[];
  whitelistedApps: string[];
  soundVolume: number;
  showFeedbackButton: boolean;
}

const DEFAULT_SETTINGS: FocusSettings = {
  blockedApps: ["Instagram", "TikTok", "YouTube", "Snapchat"],
  whitelistedApps: [],
  soundVolume: 0.3,
  showFeedbackButton: true,
};

const STORAGE_KEY = "focus_settings";

// Play Store safe app catalog: categorized list with Android package names.
// On native builds, these package names go into AndroidManifest <queries> entries
// (NOT QUERY_ALL_PACKAGES) so PackageManager can detect them if installed.
export interface AppCatalogEntry {
  name: string;
  pkg: string;
  category: "Social" | "Video" | "Messaging" | "Streaming" | "Gaming" | "Shopping" | "News";
}

export const APP_CATALOG: AppCatalogEntry[] = [
  // Social
  { name: "Instagram", pkg: "com.instagram.android", category: "Social" },
  { name: "Facebook", pkg: "com.facebook.katana", category: "Social" },
  { name: "X (Twitter)", pkg: "com.twitter.android", category: "Social" },
  { name: "Snapchat", pkg: "com.snapchat.android", category: "Social" },
  { name: "Reddit", pkg: "com.reddit.frontpage", category: "Social" },
  { name: "Pinterest", pkg: "com.pinterest", category: "Social" },
  { name: "LinkedIn", pkg: "com.linkedin.android", category: "Social" },
  // Video
  { name: "YouTube", pkg: "com.google.android.youtube", category: "Video" },
  { name: "YouTube Shorts", pkg: "com.google.android.apps.youtube.creator", category: "Video" },
  { name: "TikTok", pkg: "com.zhiliaoapp.musically", category: "Video" },
  // Messaging
  { name: "Messenger", pkg: "com.facebook.orca", category: "Messaging" },
  { name: "WhatsApp", pkg: "com.whatsapp", category: "Messaging" },
  { name: "Telegram", pkg: "org.telegram.messenger", category: "Messaging" },
  { name: "Discord", pkg: "com.discord", category: "Messaging" },
  // Streaming
  { name: "Netflix", pkg: "com.netflix.mediaclient", category: "Streaming" },
  { name: "Prime Video", pkg: "com.amazon.avod.thirdpartyclient", category: "Streaming" },
  { name: "Twitch", pkg: "tv.twitch.android.app", category: "Streaming" },
  { name: "Spotify", pkg: "com.spotify.music", category: "Streaming" },
  // Gaming
  { name: "BGMI", pkg: "com.pubg.imobile", category: "Gaming" },
  { name: "Free Fire", pkg: "com.dts.freefireth", category: "Gaming" },
  { name: "Clash of Clans", pkg: "com.supercell.clashofclans", category: "Gaming" },
  { name: "Clash Royale", pkg: "com.supercell.clashroyale", category: "Gaming" },
  { name: "Call of Duty Mobile", pkg: "com.activision.callofduty.shooter", category: "Gaming" },
  // Shopping
  { name: "Amazon", pkg: "in.amazon.mShop.android.shopping", category: "Shopping" },
  { name: "Flipkart", pkg: "com.flipkart.android", category: "Shopping" },
  { name: "Myntra", pkg: "com.myntra.android", category: "Shopping" },
];

const POPULAR_APPS = APP_CATALOG.map((a) => a.name);

export function useFocusSettings() {
  const [settings, setSettings] = useState<FocusSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggleBlockedApp = (app: string) => {
    setSettings((prev) => ({
      ...prev,
      blockedApps: prev.blockedApps.includes(app)
        ? prev.blockedApps.filter((a) => a !== app)
        : [...prev.blockedApps, app],
    }));
  };

  const toggleWhitelistedApp = (app: string) => {
    setSettings((prev) => ({
      ...prev,
      whitelistedApps: prev.whitelistedApps.includes(app)
        ? prev.whitelistedApps.filter((a) => a !== app)
        : [...prev.whitelistedApps, app],
    }));
  };

  const addCustomApp = (app: string) => {
    if (!app.trim()) return;
    setSettings((prev) => ({
      ...prev,
      blockedApps: prev.blockedApps.includes(app) ? prev.blockedApps : [...prev.blockedApps, app],
    }));
  };

  const removeApp = (app: string) => {
    setSettings((prev) => ({
      ...prev,
      blockedApps: prev.blockedApps.filter((a) => a !== app),
      whitelistedApps: prev.whitelistedApps.filter((a) => a !== app),
    }));
  };

  const setSoundVolume = (vol: number) => {
    setSettings((prev) => ({ ...prev, soundVolume: vol }));
  };

  return {
    settings,
    toggleBlockedApp,
    toggleWhitelistedApp,
    addCustomApp,
    removeApp,
    setSoundVolume,
    APP_CATALOG,
    POPULAR_APPS,
  };
}
