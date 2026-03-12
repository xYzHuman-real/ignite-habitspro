import { useState, useEffect } from "react";

export interface FocusSettings {
  blockedApps: string[];
  whitelistedApps: string[];
  soundVolume: number;
  showFeedbackButton: boolean;
}

const DEFAULT_SETTINGS: FocusSettings = {
  blockedApps: ["Instagram", "Snapchat", "TikTok", "Twitter/X", "Facebook", "YouTube", "Reddit"],
  whitelistedApps: [],
  soundVolume: 0.3,
  showFeedbackButton: true,
};

const STORAGE_KEY = "focus_settings";

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
    POPULAR_APPS: [
      "Instagram", "Snapchat", "TikTok", "Twitter/X", "Facebook",
      "YouTube", "Reddit", "WhatsApp", "Telegram", "Discord",
      "Netflix", "Twitch", "Pinterest", "Spotify", "Games",
    ],
  };
}
