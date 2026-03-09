import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Flame, UserPlus, Edit3, Check, LogOut, Shield, Coins, Gift, Trash2, Download, Camera, Eye, EyeOff, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useProfile, useBadges, useActivityLog, useFollowers, useDailyLogin } from "@/lib/supabase-hooks";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getLevelForPoints, getNextLevel, getProgressToNext } from "@/lib/xp-levels";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Profile() {
  const { signOut, user } = useAuth();
  const { profile, isLoading, updateProfile } = useProfile();
  const { allBadges, earnedBadgeIds } = useBadges();
  const { activities } = useActivityLog();
  const { followerCount, followingCount } = useFollowers();
  const { claimDaily, todayLogin, isClaiming } = useDailyLogin();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState({ display_name: "", username: "", bio: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-claim daily login on page visit
  useEffect(() => {
    if (profile && !todayLogin) {
      claimDaily(undefined, {
        onSuccess: (result: any) => {
          if (result) {
            toast({
              title: `Daily Reward! 🎁 +${result.bonus} pts`,
              description: `Login streak: ${result.streak} day${result.streak > 1 ? "s" : ""}!`,
            });
          }
        },
      });
    }
  }, [profile, todayLogin]);

  if (isLoading || !profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const startEdit = () => {
    setForm({ display_name: profile.display_name, username: profile.username || "", bio: profile.bio || "" });
    setEditing(true);
  };

  const saveProfile = () => {
    if (!form.display_name.trim()) return;
    updateProfile(form);
    setEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 5MB.", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Add cache buster
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      updateProfile({ avatar_url: avatarUrl });
      toast({ title: "Profile picture updated! 📸" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      await supabase.auth.signOut();
      toast({ title: "Account deleted", description: "Your account and all data have been permanently removed." });
    } catch (e: any) {
      toast({ title: "Failed to delete account", description: e.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const toCsv = (headers: string[], rows: Record<string, any>[]) => {
    const lines = [headers.join(",")];
    rows.forEach((r) => {
      lines.push(headers.map((h) => {
        const val = String(r[h] ?? "").replace(/"/g, '""');
        return `"${val}"`;
      }).join(","));
    });
    return lines.join("\n");
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      const [habitsRes, journalRes, goalsRes, todosRes, completionsRes] = await Promise.all([
        supabase.from("habits").select("*").eq("user_id", authUser.id),
        supabase.from("journal_entries").select("*").eq("user_id", authUser.id),
        supabase.from("goals").select("*").eq("user_id", authUser.id),
        supabase.from("todos").select("*").eq("user_id", authUser.id),
        supabase.from("habit_completions").select("*").eq("user_id", authUser.id),
      ]);

      if (habitsRes.data?.length) {
        downloadFile(toCsv(["name", "icon", "difficulty", "streak", "longest_streak", "target", "current", "reminder_enabled", "reminder_time", "created_at"], habitsRes.data), "habits.csv");
      }
      if (completionsRes.data?.length) {
        downloadFile(toCsv(["habit_id", "completed_date", "created_at"], completionsRes.data), "habit_completions.csv");
      }
      if (journalRes.data?.length) {
        downloadFile(toCsv(["entry_date", "mood", "reflection", "gratitude", "wins", "improvements"], journalRes.data), "journal.csv");
      }
      if (goalsRes.data?.length) {
        downloadFile(toCsv(["title", "description", "target_value", "current_value", "unit", "completed", "deadline", "created_at"], goalsRes.data), "goals.csv");
      }
      if (todosRes.data?.length) {
        downloadFile(toCsv(["text", "priority", "completed", "created_at"], todosRes.data), "todos.csv");
      }

      toast({ title: "Export complete!", description: "Your data has been downloaded as CSV files." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const avatarText = profile.display_name ? profile.display_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) : "?";
  const earnedBadges = allBadges.filter((b) => earnedBadgeIds.includes(b.id));
  const joinDate = format(new Date(profile.created_at), "MMM yyyy");
  const currentLevel = getLevelForPoints(profile.leaderboard_points);
  const nextLevel = getNextLevel(profile.leaderboard_points);
  const progressToNext = getProgressToNext(profile.leaderboard_points);

  // Build heatmap from activity log
  const activityMap = new Map<string, number>();
  activities.forEach((a) => {
    activityMap.set(a.activity_date, (activityMap.get(a.activity_date) || 0) + a.count);
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          {editing ? (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl">Edit Profile</h2>
              <Input placeholder="Your Name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
              <Input placeholder="@username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              <Textarea placeholder="Write a short bio..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} />
              <div className="flex gap-2">
                <Button onClick={saveProfile} className="bg-gradient-primary text-primary-foreground">
                  <Check className="h-4 w-4 mr-1" /> Save
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-primary shadow-glow-primary">
                    {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name} />}
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-display text-2xl font-bold">
                      {avatarText}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl font-display font-bold">{profile.display_name || "Set up your profile"}</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-muted-foreground text-sm">{profile.username ? `@${profile.username}` : "No username set"}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {currentLevel.icon} Lv.{currentLevel.level} {(profile as any).title || currentLevel.title}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{profile.bio || "No bio yet"}</p>
                  <div className="flex gap-2 mt-3 justify-center sm:justify-start flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                      <Camera className="h-4 w-4 mr-1" /> {uploadingAvatar ? "Uploading..." : "Change Photo"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={startEdit}>
                      <Edit3 className="h-4 w-4 mr-1" /> Edit Profile
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={signOut}>
                      <LogOut className="h-4 w-4 mr-1" /> Sign Out
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-display font-bold">{followerCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold flex items-center justify-center gap-1">
                    {profile.total_streak} <Flame className="h-5 w-5 text-primary" />
                  </p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{profile.habits_completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>

              {/* Points & Level Progress */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-accent" />
                    <span className="font-semibold">{profile.leaderboard_points} points</span>
                  </div>
                  {nextLevel && (
                    <span className="text-xs text-muted-foreground">
                      {nextLevel.minPoints - profile.leaderboard_points} pts to Lv.{nextLevel.level}
                    </span>
                  )}
                </div>
                <Progress value={progressToNext} className="h-2" />
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                {profile.streak_freezes > 0 && (
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>{profile.streak_freezes} streak freezes</span>
                  </div>
                )}
                {todayLogin && (
                  <div className="flex items-center gap-1">
                    <Gift className="h-4 w-4 text-success" />
                    <span>Daily reward claimed ✓</span>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {!editing && earnedBadges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5">
            <h2 className="font-display font-semibold text-lg mb-3">Badges</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {earnedBadges.map((badge) => (
                <div key={badge.id} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-xs text-center text-muted-foreground">{badge.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    badge.tier === "gold" ? "bg-accent/30 text-accent-foreground" :
                    badge.tier === "silver" ? "bg-muted text-muted-foreground" :
                    "bg-primary/10 text-primary"
                  }`}>{badge.tier}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {!editing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5">
            <h2 className="font-display font-semibold text-lg mb-3">Activity</h2>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 49 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (48 - i));
                const dateStr = date.toISOString().split("T")[0];
                const count = activityMap.get(dateStr) || 0;
                return (
                  <div
                    key={i}
                    title={`${dateStr}: ${count} activities`}
                    className={`aspect-square rounded-sm ${
                      count >= 4 ? "bg-gradient-primary" :
                      count >= 3 ? "bg-primary/60" :
                      count >= 1 ? "bg-primary/30" :
                      "bg-muted"
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Joined {joinDate}</span>
              <div className="flex items-center gap-1">
                Less <div className="w-3 h-3 rounded-sm bg-muted" /> <div className="w-3 h-3 rounded-sm bg-primary/30" /> <div className="w-3 h-3 rounded-sm bg-primary/60" /> <div className="w-3 h-3 rounded-sm bg-gradient-primary" /> More
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {!editing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-5">
            <h2 className="font-display font-semibold text-lg mb-1">Your Data</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Download all your habits, journal entries, goals, and todos as CSV files.
            </p>
            <Button variant="outline" size="sm" onClick={handleExportData} disabled={exporting}>
              <Download className="h-4 w-4 mr-1" />
              {exporting ? "Exporting..." : "Export All Data"}
            </Button>
          </Card>
        </motion.div>
      )}

      {!editing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="p-5">
            <h2 className="font-display font-semibold text-lg mb-1 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Privacy Settings
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Control what other users can see on your profile.</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-avatar" className="flex items-center gap-2 cursor-pointer">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Profile Picture</p>
                    <p className="text-xs text-muted-foreground">Show your avatar to other users</p>
                  </div>
                </Label>
                <Switch
                  id="show-avatar"
                  checked={(profile as any).show_avatar !== false}
                  onCheckedChange={(checked) => updateProfile({ show_avatar: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="show-stats" className="flex items-center gap-2 cursor-pointer">
                  <Flame className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Stats & Streaks</p>
                    <p className="text-xs text-muted-foreground">Show streak, points, and completed habits</p>
                  </div>
                </Label>
                <Switch
                  id="show-stats"
                  checked={(profile as any).show_stats !== false}
                  onCheckedChange={(checked) => updateProfile({ show_stats: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="show-profile" className="flex items-center gap-2 cursor-pointer">
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Profile Visibility</p>
                    <p className="text-xs text-muted-foreground">Allow others to view your full profile</p>
                  </div>
                </Label>
                <Switch
                  id="show-profile"
                  checked={(profile as any).show_profile !== false}
                  onCheckedChange={(checked) => updateProfile({ show_profile: checked })}
                />
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {!editing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-5 border-destructive/30">
            <h2 className="font-display font-semibold text-lg mb-1 text-destructive">Danger Zone</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={deleting}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deleting ? "Deleting..." : "Delete Account"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account, all habits, journal entries, goals, streaks, badges, and community data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
