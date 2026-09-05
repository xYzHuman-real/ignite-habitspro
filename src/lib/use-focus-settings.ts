import { useState, useEffect } from "react";

export interface FocusSettings {
  blockedApps: string[];
  blockedAppPackages: string[];
  whitelistedApps: string[];
  soundVolume: number;
  showFeedbackButton: boolean;
}

const DEFAULT_BLOCKED_APPS = ["Instagram", "TikTok", "YouTube", "Snapchat"];

export interface AppCatalogEntry {
  name: string;
  pkg: string;
  category: "Social" | "Video" | "Messaging" | "Streaming" | "Gaming" | "Shopping" | "News";
}

export const APP_CATALOG: AppCatalogEntry[] = [
  { name: "Instagram", pkg: "com.instagram.android", category: "Social" },
  { name: "Facebook", pkg: "com.facebook.katana", category: "Social" },
  { name: "X (Twitter)", pkg: "com.twitter.android", category: "Social" },
  { name: "Snapchat", pkg: "com.snapchat.android", category: "Social" },
  { name: "Reddit", pkg: "com.reddit.frontpage", category: "Social" },
  { name: "Pinterest", pkg: "com.pinterest", category: "Social" },
  { name: "LinkedIn", pkg: "com.linkedin.android", category: "Social" },
  { name: "YouTube", pkg: "com.google.android.youtube", category: "Video" },
  { name: "YouTube Shorts", pkg: "com.google.android.apps.youtube.creator", category: "Video" },
  { name: "TikTok", pkg: "com.zhiliaoapp.musically", category: "Video" },
  { name: "Messenger", pkg: "com.facebook.orca", category: "Messaging" },
  { name: "WhatsApp", pkg: "com.whatsapp", category: "Messaging" },
  { name: "Telegram", pkg: "org.telegram.messenger", category: "Messaging" },
  { name: "Discord", pkg: "com.discord", category: "Messaging" },
  { name: "Netflix", pkg: "com.netflix.mediaclient", category: "Streaming" },
  { name: "Prime Video", pkg: "com.amazon.avod.thirdpartyclient", category: "Streaming" },
  { name: "Twitch", pkg: "tv.twitch.android.app", category: "Streaming" },
  { name: "Spotify", pkg: "com.spotify.music", category: "Streaming" },
  { name: "BGMI", pkg: "com.pubg.imobile", category: "Gaming" },
  { name: "Free Fire", pkg: "com.dts.freefireth", category: "Gaming" },
  { name: "Clash of Clans", pkg: "com.supercell.clashofclans", category: "Gaming" },
  { name: "Clash Royale", pkg: "com.supercell.clashroyale", category: "Gaming" },
  { name: "Call of Duty Mobile", pkg: "com.activision.callofduty.shooter", category: "Gaming" },
  { name: "Amazon", pkg: "in.amazon.mShop.android.shopping", category: "Shopping" },
  { name: "Flipkart", pkg: "com.flipkart.android", category: "Shopping" },
  { name: "Myntra", pkg: "com.myntra.android", category: "Shopping" },
];

const POPULAR_APPS = APP_CATALOG.map((a) => a.name);
const CATALOG_BY_NAME = new Map(APP_CATALOG.map((a) => [a.name, a.pkg]));

const DEFAULT_SETTINGS: FocusSettings = {
  blockedApps: DEFAULT_BLOCKED_APPS,
  blockedAppPackages: DEFAULT_BLOCKED_APPS.map((name) => CATALOG_BY_NAME.get(name)).filter(Boolean) as string[],
  whitelistedApps: [],
  soundVolume: 0.3,
  showFeedbackButton: true,
};

const STORAGE_KEY = "focus_settings";

export function useFocusSettings() {
  const [settings, setSettings] = useState<FocusSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const blockedApps = Array.isArray(parsed.blockedApps) ? parsed.blockedApps : DEFAULT_BLOCKED_APPS;
        const blockedAppPackages = Array.isArray(parsed.blockedAppPackages)
          ? parsed.blockedAppPackages
          : blockedApps.map((name: string) => CATALOG_BY_NAME.get(name)).filter(Boolean);
        return { ...DEFAULT_SETTINGS, ...parsed, blockedApps, blockedAppPackages };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const toggleBlockedApp = (app: string) => {
    setSettings((prev) => {
      const pkg = CATALOG_BY_NAME.get(app);
      const removing = prev.blockedApps.includes(app);
      return {
        ...prev,
        blockedApps: removing ? prev.blockedApps.filter((a) => a !== app) : [...prev.blockedApps, app],
        blockedAppPackages: pkg
          ? (removing ? prev.blockedAppPackages.filter((p) => p !== pkg) : Array.from(new Set([...prev.blockedAppPackages, pkg])))
          : prev.blockedAppPackages,
      };
    });
  };

  const toggleBlockedPackage = (app: { name: string; packageName: string }) => {
    setSettings((prev) => {
      const removing = prev.blockedAppPackages.includes(app.packageName);
      return {
        ...prev,
        blockedApps: removing ? prev.blockedApps.filter((name) => name !== app.name) : [...prev.blockedApps, app.name],
        blockedAppPackages: removing
          ? prev.blockedAppPackages.filter((pkg) => pkg !== app.packageName)
          : Array.from(new Set([...prev.blockedAppPackages, app.packageName])),
      };
    });
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
    const pkg = CATALOG_BY_NAME.get(app);
    setSettings((prev) => ({
      ...prev,
      blockedApps: prev.blockedApps.filter((a) => a !== app),
      blockedAppPackages: pkg ? prev.blockedAppPackages.filter((p) => p !== pkg) : prev.blockedAppPackages,
      whitelistedApps: prev.whitelistedApps.filter((a) => a !== app),
    }));
  };

  const setSoundVolume = (vol: number) => {
    setSettings((prev) => ({ ...prev, soundVolume: vol }));
  };

  return {
    settings,
    toggleBlockedApp,
    toggleBlockedPackage,
    toggleWhitelistedApp,
    addCustomApp,
    removeApp,
    setSoundVolume,
    APP_CATALOG,
    POPULAR_APPS,
  };
}
