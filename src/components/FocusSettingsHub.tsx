import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Shield, ShieldCheck, ShieldOff, Plus, X, Volume2, MessageSquare, Palette } from "lucide-react";
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

export function FocusSettingsHub() {
  const { settings, toggleBlockedApp, toggleWhitelistedApp, addCustomApp, removeApp, setSoundVolume, POPULAR_APPS } = useFocusSettings();
  const { ownedThemes, currentTheme, selectTheme } = useFocusThemes();
  const [customApp, setCustomApp] = useState("");
  const [open, setOpen] = useState(false);

  const handleAddCustom = () => {
    if (customApp.trim()) {
      addCustomApp(customApp.trim());
      setCustomApp("");
    }
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
              Selected apps will trigger a return-to-focus overlay during sessions. On native builds, these apps can be fully blocked.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {POPULAR_APPS.map((app) => {
                const isBlocked = settings.blockedApps.includes(app);
                const isWhitelisted = settings.whitelistedApps.includes(app);
                return (
                  <button
                    key={app}
                    onClick={() => toggleBlockedApp(app)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                      isBlocked
                        ? "bg-destructive/15 border-destructive/30 text-destructive"
                        : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {isBlocked ? "🚫 " : ""}{app}
                  </button>
                );
              })}
            </div>

            {/* Custom app input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom app..."
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
