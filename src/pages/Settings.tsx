import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Camera, Flame, Bell,
  Globe, Lock, ShieldCheck, Smartphone, Zap,
  ChevronRight, ArrowLeft, Download, Trash2, Mail, BarChart3,
  Volume2, Clock, Target, BookOpen, Trophy, LogOut
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "@/lib/supabase-hooks";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useLocalPref } from "@/lib/use-local-pref";

type SettingsSection = "main" | "privacy" | "notifications" | "preferences" | "about";

export default function Settings() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [section, setSection] = useState<SettingsSection>("main");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Persisted preferences
  const [showLeaderboard, setShowLeaderboard] = useLocalPref("show_leaderboard", true);
  const [showActivity, setShowActivity] = useLocalPref("show_activity", true);
  const [habitReminders, setHabitReminders] = useLocalPref("habit_reminders", true);
  const [streakAlerts, setStreakAlerts] = useLocalPref("streak_alerts", true);
  const [focusSounds, setFocusSounds] = useLocalPref("focus_sounds", true);
  const [dailySummary, setDailySummary] = useLocalPref("daily_summary", false);
  const [socialNotifs, setSocialNotifs] = useLocalPref("social_notifs", true);
  const [haptic, setHaptic] = useLocalPref("haptic", true);
  const [animations, setAnimations] = useLocalPref("animations", true);
  const [autoStart, setAutoStart] = useLocalPref("auto_start_timer", false);
  const [lockScreen, setLockScreen] = useLocalPref("focus_lock_screen", true);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      await supabase.auth.signOut();
      toast({ title: "Account deleted", description: "Your data has been permanently removed." });
    } catch (e: any) {
      toast({ title: "Failed to delete account", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const toCsv = (headers: string[], rows: Record<string, any>[]) => {
        const lines = [headers.join(",")];
        rows.forEach((r) => {
          lines.push(headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","));
        });
        return lines.join("\n");
      };
      const dl = (content: string, filename: string) => {
        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
      };
      const [h, j, g, t, c] = await Promise.all([
        supabase.from("habits").select("*").eq("user_id", user.id),
        supabase.from("journal_entries").select("*").eq("user_id", user.id),
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("todos").select("*").eq("user_id", user.id),
        supabase.from("habit_completions").select("*").eq("user_id", user.id),
      ]);
      if (h.data?.length) dl(toCsv(["name","icon","difficulty","streak","longest_streak","target","current","created_at"], h.data), "habits.csv");
      if (c.data?.length) dl(toCsv(["habit_id","completed_date","created_at"], c.data), "habit_completions.csv");
      if (j.data?.length) dl(toCsv(["entry_date","mood","reflection","gratitude","wins","improvements"], j.data), "journal.csv");
      if (g.data?.length) dl(toCsv(["title","description","target_value","current_value","unit","completed","deadline"], g.data), "goals.csv");
      if (t.data?.length) dl(toCsv(["text","priority","completed","created_at"], t.data), "todos.csv");
      toast({ title: "Export complete!", description: "Your data has been downloaded." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (!profile) return null;

  const SettingsItem = ({ icon: Icon, label, desc, onClick, danger }: {
    icon: any; label: string; desc: string; onClick: () => void; danger?: boolean;
  }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? "bg-destructive/10" : "bg-primary/10"}`}>
        <Icon className={`h-5 w-5 ${danger ? "text-destructive" : "text-primary"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? "text-destructive" : ""}`}>{label}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
    </button>
  );

  const SectionHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="flex items-center gap-3 mb-4">
      <button onClick={onBack} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h2 className="text-lg font-display font-bold">{title}</h2>
    </div>
  );

  const ToggleRow = ({ id, icon: Icon, label, desc, checked, onChange }: {
    id: string; icon: any; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-3">
      <Label htmlFor={id} className="flex items-center gap-3 cursor-pointer flex-1">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      <AnimatePresence mode="wait">
        {section === "main" && (
          <motion.div key="main" {...pageVariants} transition={{ duration: 0.2 }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => navigate("/profile")} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-display font-bold">Settings</h1>
                <p className="text-xs text-muted-foreground">Manage your app preferences</p>
              </div>
            </div>

            {/* Account */}
            <Card className="p-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2 pb-1">Account</p>
              <SettingsItem icon={Eye} label="Privacy" desc="Control profile visibility & data sharing" onClick={() => setSection("privacy")} />
              <SettingsItem icon={Bell} label="Notifications" desc="Alerts, reminders & sounds" onClick={() => setSection("notifications")} />
              <SettingsItem icon={Zap} label="Preferences" desc="Theme, language & display" onClick={() => setSection("preferences")} />
            </Card>

            {/* App */}
            <Card className="p-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2 pb-1">App</p>
              <SettingsItem icon={Mail} label="Customer Support" desc="Get help or send feedback" onClick={() => setSection("about")} />
              <SettingsItem icon={BookOpen} label="About Ignite" desc="Version, credits & links" onClick={() => setSection("about")} />
            </Card>

            {/* Data */}
            <Card className="p-2 mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-2 pb-1">Data</p>
              <button onClick={handleExportData} disabled={exporting} className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
                  <Download className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{exporting ? "Exporting..." : "Export All Data"}</p>
                  <p className="text-xs text-muted-foreground">Download habits, journal, goals as CSV</p>
                </div>
              </button>
            </Card>

            {/* Sign out */}
            <Card className="p-2 mb-3">
              <button
                onClick={async () => { await signOut(); navigate("/auth"); }}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted/60 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
                  <LogOut className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Log out</p>
                  <p className="text-xs text-muted-foreground">Sign out of your account</p>
                </div>
              </button>
            </Card>

            {/* Danger */}
            <Card className="p-2 border-destructive/20">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wider px-3 pt-2 pb-1">Danger Zone</p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-destructive/5 transition-colors text-left">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-destructive/10">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">Delete Account</p>
                      <p className="text-xs text-muted-foreground">Permanently remove all data</p>
                    </div>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account and all data. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {deleting ? "Deleting..." : "Yes, delete my account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          </motion.div>
        )}

        {section === "privacy" && (
          <motion.div key="privacy" {...pageVariants} transition={{ duration: 0.2 }}>
            <SectionHeader title="Privacy" onBack={() => setSection("main")} />
            <Card className="p-5">
              <div className="space-y-1">
                <ToggleRow id="show-avatar" icon={Camera} label="Profile Picture" desc="Show your avatar to other users" checked={profile.show_avatar !== false} onChange={(v) => updateProfile({ show_avatar: v })} />
                <Separator />
                <ToggleRow id="show-stats" icon={Flame} label="Stats & Streaks" desc="Show streak, points, and completed habits" checked={profile.show_stats !== false} onChange={(v) => updateProfile({ show_stats: v })} />
                <Separator />
                <ToggleRow id="show-profile" icon={EyeOff} label="Profile Visibility" desc="Allow others to view your full profile" checked={profile.show_profile !== false} onChange={(v) => updateProfile({ show_profile: v })} />
                <Separator />
                <ToggleRow id="show-leaderboard" icon={Trophy} label="Leaderboard Visibility" desc="Appear in public leaderboard rankings" checked={showLeaderboard} onChange={setShowLeaderboard} />
                <Separator />
                <ToggleRow id="show-activity" icon={BarChart3} label="Activity Heatmap" desc="Show your activity to profile visitors" checked={showActivity} onChange={setShowActivity} />
              </div>
            </Card>
          </motion.div>
        )}

        {section === "notifications" && (
          <motion.div key="notifications" {...pageVariants} transition={{ duration: 0.2 }}>
            <SectionHeader title="Notifications" onBack={() => setSection("main")} />
            <Card className="p-5">
              <div className="space-y-1">
                <ToggleRow id="habit-reminders" icon={Bell} label="Habit Reminders" desc="Get reminded to complete your habits" checked={habitReminders} onChange={setHabitReminders} />
                <Separator />
                <ToggleRow id="streak-alerts" icon={Flame} label="Streak Alerts" desc="Warning before losing your streak" checked={streakAlerts} onChange={setStreakAlerts} />
                <Separator />
                <ToggleRow id="focus-sounds" icon={Volume2} label="Focus Session Sounds" desc="Play ambient sounds during focus" checked={focusSounds} onChange={setFocusSounds} />
                <Separator />
                <ToggleRow id="daily-summary" icon={Clock} label="Daily Summary" desc="Evening recap of your productivity" checked={dailySummary} onChange={setDailySummary} />
                <Separator />
                <ToggleRow id="social-notifs" icon={Globe} label="Social Notifications" desc="Followers, partner requests & messages" checked={socialNotifs} onChange={setSocialNotifs} />
              </div>
            </Card>
          </motion.div>
        )}

        {section === "preferences" && (
          <motion.div key="preferences" {...pageVariants} transition={{ duration: 0.2 }}>
            <SectionHeader title="Preferences" onBack={() => setSection("main")} />
            <Card className="p-5 space-y-1">
              <ToggleRow id="haptic" icon={Smartphone} label="Haptic Feedback" desc="Vibration on interactions" checked={haptic} onChange={setHaptic} />
              <Separator />
              <ToggleRow id="animations" icon={Zap} label="Animations" desc="Smooth transitions & micro-animations" checked={animations} onChange={setAnimations} />
              <Separator />
              <ToggleRow id="auto-start" icon={Target} label="Auto-start Timer" desc="Start focus timer when opening app" checked={autoStart} onChange={setAutoStart} />
              <Separator />
              <ToggleRow id="lock-screen" icon={Lock} label="Focus Lock Screen" desc="Lock navigation during focus sessions" checked={lockScreen} onChange={setLockScreen} />
            </Card>
          </motion.div>
        )}

        {section === "about" && (
          <motion.div key="about" {...pageVariants} transition={{ duration: 0.2 }}>
            <SectionHeader title="About Ignite" onBack={() => setSection("main")} />
            <Card className="p-5 space-y-4">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center shadow-glow-primary">
                  <Flame className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg">Ignite HabitPro</h3>
                  <p className="text-xs text-muted-foreground">Version 1.0.0</p>
                </div>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Your all-in-one productivity companion designed for students, professionals, and deep workers who want to build lasting habits and master their focus.
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> What's Inside
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { icon: Target, title: "Habit Tracking", desc: "Build streaks with daily habits, priorities & smart reminders" },
                    { icon: Clock, title: "Deep Focus Timer", desc: "Distraction-free Pomodoro with app blocking & ambient themes" },
                    { icon: BookOpen, title: "Smart To-Do List", desc: "Tasks with attachments, calendar view & productivity insights" },
                    { icon: Trophy, title: "Gamification", desc: "Earn XP, climb leaderboards, unlock achievements & shop rewards" },
                    { icon: Globe, title: "Focus Rooms", desc: "Study together in real-time virtual rooms with friends" },
                    { icon: BarChart3, title: "AI Daily Planner", desc: "Smart daily schedule generated from your habits & goals" },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Why Ignite?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Built with love for people who refuse mediocrity. Combining habit science, deep work principles, and gamification — Ignite turns your goals into a journey worth showing up for, every single day.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <a href="mailto:support.ignitehabitproapp@gmail.com" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
                  <Mail className="h-4 w-4" /> Contact Support
                </a>
                <button onClick={() => navigate("/privacy-policy")} className="flex items-center justify-center gap-2 text-sm text-primary hover:underline mx-auto">
                  <ShieldCheck className="h-4 w-4" /> Privacy Policy
                </button>
                <button onClick={() => navigate("/terms-of-service")} className="flex items-center justify-center gap-2 text-sm text-primary hover:underline mx-auto">
                  <BookOpen className="h-4 w-4" /> Terms of Service
                </button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
