import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Shield, ShieldCheck, ShieldOff, Plus, X, Volume2, MessageSquare, Palette, Search, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFocusSettings } from "@/lib/use-focus-settings";
import { useFocusThemes } from "@/lib/use-focus-themes";
import { cn } from "@/lib/utils";

interface InstalledApp {
  name: string;
  packageName: string;
  icon?: string;
}

export function FocusSettingsHub() {
  const { settings, toggleBlockedApp, toggleBlockedPackage, toggleWhitelistedApp, addCustomApp, removeApp, setSoundVolume, APP_CATALOG, POPULAR_APPS } = useFocusSettings();
  const { ownedThemes, currentTheme, selectTheme } = useFocusThemes();
  const [customApp, setCustomApp] = useState("");
  const [open, setOpen] = useState(false);
  const [appSearch, setAppSearch] = useState("");
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const loadInstalledApps = () => {
    setLoadingApps(true);
    setAppSearch("");
    const native = (window as any).igniteNative;
    if (native?.getInstalledApps) {
      native.getInstalledApps();
    } else {
      setInstalledApps(APP_CATALOG.map((app) => ({ name: app.name, packageName: app.pkg })));
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    const onNativeMessage = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.type !== "installed_apps_result") return;
      const apps = Array.isArray(detail.apps) ? detail.apps.filter((app: any) => app?.name && app?.packageName) : [];
      setInstalledApps(apps);
      setLoadingApps(false);
    };
    window.addEventListener("igniteNativeMessage", onNativeMessage);
    return () => window.removeEventListener("igniteNativeMessage", onNativeMessage);
  }, []);

  useEffect(() => {
    if (open) loadInstalledApps();
  }, [open]);

  const filteredApps = useMemo(() => {
    const query = appSearch.trim().toLowerCase();
    if (!query) return installedApps;
    return installedApps.filter((app) => app.name.toLowerCase().includes(query));
  }, [installedApps, appSearch]);

  const handleAddCustom = () => {
    if (customApp.trim()) {
      addCustomApp(customApp.trim());
      setCustomApp("");
    }
  };

  const isPackageBlocked = (app: InstalledApp) => {
    if (settings.blockedAppPackages.includes(app.packageName)) return true;
    const catalog = APP_CATALOG.find((entry) => entry.pkg === app.packageName);
    return !settings.blockedAppPackages.length && !!catalog && settings.blockedApps.includes(catalog.name);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings className="h-4 w-4" /> Focus Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Focus Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Distraction Blocklist */}
          <div>
            <h3 className="font-display font-semibold text-sm mb-2 flex items-center gap-1.5">
              <ShieldOff className="h-4 w-4 text-destructive" /> Distraction Blocklist
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Choose apps installed on your phone. During focus, selected apps trigger the return-to-focus guard.
            </p>

            <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
              <div className="p-2.5 border-b border-border flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    placeholder="Search installed apps..."
                    className="h-9 pl-8 text-sm"
                  />
                </div>
                <Button type="button" size="sm" variant="outline" className="h-9" onClick={loadInstalledApps} disabled={loadingApps}>
                  {loadingApps ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Refresh"}
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto p-1.5">
                {loadingApps && installedApps.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading apps installed on this phone...
                  </div>
                ) : filteredApps.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No matching installed apps found.
                  </div>
                ) : (
                  filteredApps.map((app) => {
                    const blocked = isPackageBlocked(app);
                    return (
                      <button
                        key={app.packageName}
                        type="button"
                        onClick={() => toggleBlockedPackage(app)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                          blocked ? "bg-destructive/10" : "hover:bg-muted/60"
                        )}
                      >
                        {app.icon ? (
                          <img src={app.icon} alt="" className="h-9 w-9 rounded-[10px] shrink-0" />
                        ) : (
                          <div className="h-9 w-9 rounded-[10px] bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
                            {app.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{app.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{app.packageName}</p>
                        </div>
                        <Switch checked={blocked} onCheckedChange={() => toggleBlockedPackage(app)} onClick={(e) => e.stopPropagation()} />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground mt-2">
              {settings.blockedAppPackages.length} app{settings.blockedAppPackages.length === 1 ? "" : "s"} selected for blocking.
            </p>

            {/* Custom app input */}
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Add custom app name..."
                value={customApp}
                onChange={(e) => setCustomApp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                className="text-sm"
              />
              <Button size="sm" variant="outline" onClick={handleAddCustom}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Custom blocked apps */}
            {settings.blockedApps.filter((a) => !POPULAR_APPS.includes(a)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.blockedApps.filter((a) => !POPULAR_APPS.includes(a)).map((app) => (
                  <span key={app} className="px-2 py-1 rounded-full text-xs bg-destructive/15 text-destructive flex items-center gap-1">
                    🚫 {app}
                    <button onClick={() => removeApp(app)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Whitelist */}
          <div>
            <h3 className="font-display font-semibold text-sm mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" /> Whitelisted Apps
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              These apps won't trigger the focus overlay even during sessions.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Calculator", "Notes", "Dictionary", "Calendar", "Clock"].map((app) => {
                const isWhitelisted = settings.whitelistedApps.includes(app);
                return (
                  <button
                    key={app}
                    onClick={() => toggleWhitelistedApp(app)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                      isWhitelisted
                        ? "bg-success/15 border-success/30 text-success"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {isWhitelisted ? "✅ " : ""}{app}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Sound Volume */}
          <div>
            <h3 className="font-display font-semibold text-sm mb-2 flex items-center gap-1.5">
              <Volume2 className="h-4 w-4 text-primary" /> Ambient Sound Volume
            </h3>
            <Slider
              value={[settings.soundVolume * 100]}
              onValueChange={([v]) => setSoundVolume(v / 100)}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">{Math.round(settings.soundVolume * 100)}%</p>
          </div>

          <Separator />

          {/* Focus Themes */}
          <div>
            <h3 className="font-display font-semibold text-sm mb-2 flex items-center gap-1.5">
              <Palette className="h-4 w-4 text-accent" /> Focus Theme
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ownedThemes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => selectTheme(theme.value)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-left",
                    currentTheme.value === theme.value
                      ? "border-primary shadow-glow-primary"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <div
                    className="w-full h-8 rounded-md mb-2"
                    style={{ background: theme.gradient }}
                  />
                  <p className="text-xs font-medium">{theme.icon} {theme.name}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Buy more themes from the Shop → Themes tab
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
