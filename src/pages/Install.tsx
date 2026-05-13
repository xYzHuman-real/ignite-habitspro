import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Apple, Chrome, Download, Share, Plus, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/PageTransition";

type Platform = "mac-safari" | "mac-chrome" | "ios" | "android" | "windows" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const isMac = /Macintosh/.test(ua) && !/Mobile/.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  if (isMac && isSafari) return "mac-safari";
  if (isMac) return "mac-chrome";
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Windows/.test(ua)) return "windows";
  return "other";
}

export default function InstallPage() {
  const [platform, setPlatform] = useState<Platform>("other");
  const [installed, setInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  const steps: Record<Platform, { icon: any; title: string; lines: string[] }> = {
    "mac-safari": {
      icon: Apple,
      title: "Install on macOS (Safari)",
      lines: [
        "Click the Share button in the Safari toolbar",
        "Choose Add to Dock",
        "Confirm the name 'Ignite' and click Add",
        "Launch Ignite from your Dock or Launchpad",
      ],
    },
    "mac-chrome": {
      icon: Chrome,
      title: "Install on macOS (Chrome / Edge / Arc)",
      lines: [
        "Click the install icon in the address bar (or use the browser menu)",
        "Choose Install Ignite Habit Pro",
        "The app opens in its own window like a native Mac app",
        "Pin it to your Dock for one-click access",
      ],
    },
    ios: { icon: Apple, title: "Install on iPhone / iPad", lines: ["Open in Safari", "Tap Share", "Tap Add to Home Screen"] },
    android: { icon: Chrome, title: "Install on Android", lines: ["Open in Chrome", "Tap the menu", "Tap Install app"] },
    windows: { icon: Chrome, title: "Install on Windows", lines: ["Click the install icon in the address bar", "Choose Install"] },
    other: { icon: Download, title: "Install Ignite", lines: ["Open this page in Safari, Chrome, or Edge", "Use your browser's Install / Add to Dock option"] },
  };

  const s = steps[platform];
  const Icon = s.icon;

  return (
    <PageTransition>
      <div className="max-w-xl mx-auto space-y-6 pb-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
          <Card className="p-6 rounded-3xl bg-gradient-to-br from-card to-muted/40 border-border/40 shadow-glow-primary/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md">
                <Download className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Install Ignite</h1>
                <p className="text-sm text-muted-foreground">Get the native-app feel on your device</p>
              </div>
            </div>

            {installed ? (
              <div className="flex items-center gap-2 text-success bg-success/10 rounded-xl p-3">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Ignite is already installed on this device.</span>
              </div>
            ) : deferredPrompt ? (
              <Button onClick={triggerInstall} className="w-full h-12 rounded-2xl bg-gradient-primary text-primary-foreground font-semibold">
                <Plus className="h-4 w-4 mr-1" /> Install Ignite Habit Pro
              </Button>
            ) : null}
          </Card>
        </motion.div>

        <Card className="p-5 rounded-3xl space-y-4 border-border/40">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <h2 className="font-display font-semibold">{s.title}</h2>
          </div>
          <ol className="space-y-2.5">
            {s.lines.map((line, i) => (
              <li key={i} className="flex gap-3 items-start text-sm">
                <span className="h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{i + 1}</span>
                <span className="pt-0.5 text-foreground/90">{line}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-5 rounded-3xl border-border/40 space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground flex items-center gap-2"><Share className="h-4 w-4 text-primary" /> Why install?</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Opens in its own window — no browser tabs or address bar</li>
            <li>Lives in your Dock with a proper app icon</li>
            <li>Faster launch and full-screen focus mode</li>
            <li>Works across macOS Ventura, Sonoma, Sequoia and later</li>
          </ul>
        </Card>
      </div>
    </PageTransition>
  );
}
