type NativeMessage = Record<string, unknown>;

function post(message: NativeMessage) {
  try {
    const bridge = (window as any).ReactNativeWebView;
    bridge?.postMessage(JSON.stringify(message));
  } catch {}
}

export function installNativeFocusBridge() {
  if (typeof window === "undefined") return;
  (window as any).igniteNative = {
    openUsageAccess: () => post({ type: "open_usage_access" }),
    openOverlayPermission: () => post({ type: "open_overlay_permission" }),
    getInstalledApps: () => post({ type: "get_installed_apps" }),
  };

  const storage = window.localStorage;
  const originalSetItem = storage.setItem.bind(storage);
  const originalRemoveItem = storage.removeItem.bind(storage);
  let syncing = false;

  const sync = () => {
    if (syncing) return;
    syncing = true;
    try {
      const timerRaw = storage.getItem("timer_state");
      const settingsRaw = storage.getItem("focus_settings");
      post({
        type: "focus_guard_sync",
        timerState: timerRaw ? JSON.parse(timerRaw) : null,
        settings: settingsRaw ? JSON.parse(settingsRaw) : null,
      });
    } catch {} finally {
      syncing = false;
    }
  };

  storage.setItem = (key: string, value: string) => {
    originalSetItem(key, value);
    if (key === "timer_state" || key === "focus_settings") sync();
  };
  storage.removeItem = (key: string) => {
    originalRemoveItem(key);
    if (key === "timer_state") post({ type: "focus_guard_stop" });
  };

  window.addEventListener("igniteNativeMessage", (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail?.type === "focus_guard_ended") {
      storage.removeItem("timer_state");
      window.location.hash = "#/timer";
      window.location.reload();
    }
  });
}
