import { useState } from "react";
import { Bell, Eye, BatteryCharging, Activity } from "lucide-react";
import { PermissionPrimer } from "./PermissionPrimer";
import {
  PermissionKey,
  requestNotificationPermission,
  openUsageAccessSettings,
  openBatteryOptimizationSettings,
  openBackgroundActivitySettings,
  setPermissionState,
} from "@/lib/permissions";
import { Capacitor } from "@capacitor/core";

interface Step {
  key: PermissionKey;
  icon: any;
  title: string;
  body: string;
  bullets: string[];
  primary: string;
  request: () => Promise<unknown>;
  nativeOnly?: boolean;
}

const STEPS: Step[] = [
  {
    key: "notifications",
    icon: Bell,
    title: "Stay on track with reminders",
    body: "We'll send a gentle nudge for your habits, streaks, and focus breaks — nothing spammy.",
    bullets: [
      "Habit reminders at the times you choose",
      "Streak-saving alerts before midnight",
      "Focus session completion pings",
    ],
    primary: "Enable notifications",
    request: requestNotificationPermission,
  },
  {
    key: "usage_access",
    icon: Eye,
    title: "Block distractions during focus",
    body: "Usage Access lets Ignite see which app you've just opened so it can pull you back when you wander into a blocked one.",
    bullets: [
      "Detects Instagram, YouTube, TikTok, X, and more",
      "Only used while a focus session is active",
      "Nothing about your apps is sent to our servers",
    ],
    primary: "Open Usage Access settings",
    request: openUsageAccessSettings,
    nativeOnly: true,
  },
  {
    key: "battery_optimization",
    icon: BatteryCharging,
    title: "Keep timers running",
    body: "Android aggressively kills background work. Disable battery optimization for Ignite so your focus timer doesn't pause when the screen turns off.",
    bullets: [
      "Focus timer ticks reliably with screen off",
      "Reminders fire on time",
      "Tiny battery cost — only while a timer runs",
    ],
    primary: "Allow background battery",
    request: openBatteryOptimizationSettings,
    nativeOnly: true,
  },
  {
    key: "background_activity",
    icon: Activity,
    title: "Allow background activity",
    body: "Lets Ignite finish saving your session and deliver scheduled reminders even after you swipe the app away.",
    bullets: [
      "Saves your focus session if Android closes the app",
      "Delivers habit reminders on schedule",
    ],
    primary: "Open app settings",
    request: openBackgroundActivitySettings,
    nativeOnly: true,
  },
];

const STORAGE_KEY = "permissions_primer_completed_v1";

export function hasCompletedPermissionPrimer() {
  try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return true; }
}

interface Props {
  onFinish: () => void;
}

export function PermissionPrimerFlow({ onFinish }: Props) {
  const reactNativeShell = typeof window !== "undefined" && typeof (window as any).ReactNativeWebView?.postMessage === "function";
  const native = Capacitor.isNativePlatform() || reactNativeShell;
  const steps = STEPS.filter((s) => native || !s.nativeOnly);
  const [index, setIndex] = useState(0);

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    onFinish();
  };

  if (steps.length === 0) {
    finish();
    return null;
  }

  const step = steps[index];
  const advance = () => {
    if (index + 1 >= steps.length) finish();
    else setIndex(index + 1);
  };

  return (
    <PermissionPrimer
      open
      icon={step.icon}
      title={step.title}
      body={step.body}
      bullets={step.bullets}
      primaryLabel={step.primary}
      secondaryLabel={index + 1 === steps.length ? "Done" : "Skip"}
      onAllow={async () => {
        try { await step.request(); } catch {}
        advance();
      }}
      onSkip={() => {
        setPermissionState(step.key, "denied");
        advance();
      }}
    />
  );
}
