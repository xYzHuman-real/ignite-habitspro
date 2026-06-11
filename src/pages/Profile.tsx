import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Flame, UserPlus, Edit3, Check, LogOut, Shield, Coins, Gift, Camera, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useProfile, useBadges, useActivityLog, useFollowers, useDailyLogin } from "@/lib/supabase-hooks";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getLevelForPoints, getNextLevel, getProgressToNext } from "@/lib/xp-levels";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UsernameField } from "@/components/UsernameField";
import { PremiumBadge } from "@/components/PremiumBadge";
import { usePremium } from "@/lib/use-premium";

export default function Profile() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { profile, isLoading, updateProfile } = useProfile();
  const { allBadges, earnedBadgeIds } = useBadges();
  const { activities } = useActivityLog();
  const { followerCount, followingCount } = useFollowers();
  const { claimDaily, todayLogin, isClaiming } = useDailyLogin();
  const { toast } = useToast();
  const { isPremium, isPaid, isTrial } = usePremium();
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState({ display_name: "", username: "", bio: "" });
  const [usernameValid, setUsernameValid] = useState(true);
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

  const saveProfile = async () => {
    if (!form.display_name.trim()) return;
    if (!usernameValid) {
      toast({ title: "Please choose a valid username", variant: "destructive" });
      return;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        updateProfile(
          { ...form, username: form.username || null } as any,
          { onSuccess: () => resolve(), onError: (e: any) => reject(e) } as any
        );
      });
      setEditing(false);
    } catch (e: any) {
      if (e?.code === "23505" || /duplicate|unique/i.test(e?.message || "")) {
        toast({ title: "Username already taken", description: "Pick a different one.", variant: "destructive" });
      } else {
        toast({ title: "Could not save profile", description: e?.message, variant: "destructive" });
      }
    }
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


  const avatarText = profile.display_name ? profile.display_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) : "?";
  const earnedBadges = allBadges.filter((b) => earnedBadgeIds.includes(b.id));
  const joinDate = format(new Date(profile.created_at), "MMM yyyy");
  const lifetimeXp = (profile as any).lifetime_xp ?? profile.leaderboard_points;
  const currentLevel = getLevelForPoints(lifetimeXp);
  const nextLevel = getNextLevel(lifetimeXp);
  const progressToNext = getProgressToNext(lifetimeXp);

  // Build heatmap from activity log
  const activityMap = new Map<string, number>();
  activities.forEach((a) => {
    activityMap.set(a.activity_date, (activityMap.get(a.activity_date) || 0) + a.count);
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6 relative">
          {/* Settings icon top-right */}
          {!editing && (
            <button
              onClick={() => navigate("/settings")}
              className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          {editing ? (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl">Edit Profile</h2>
              <Input placeholder="Your Name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
              <UsernameField
                value={form.username}
                onChange={(v) => setForm({ ...form, username: v })}
                currentUsername={profile.username}
                onValidityChange={setUsernameValid}
              />
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
                  <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                    <h1 className="text-2xl font-display font-bold">{profile.display_name || "Set up your profile"}</h1>
                    {isPremium && (
                      <PremiumBadge
                        size="sm"
                        label="Premium"
                        onClick={() => navigate("/pricing")}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 justify-center sm:justify-start flex-wrap">
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
                <button
                  type="button"
                  onClick={() => navigate("/follows?tab=followers")}
                  className="rounded-lg py-1 hover:bg-muted/40 active:scale-95 transition"
                >
                  <motion.p layout className="text-2xl font-display font-bold">
                    {followerCount}
                  </motion.p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/follows?tab=following")}
                  className="rounded-lg py-1 hover:bg-muted/40 active:scale-95 transition"
                >
                  <motion.p layout className="text-2xl font-display font-bold">
                    {followingCount}
                  </motion.p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </button>
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

              {/* XP & Coins */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5" title="Lifetime XP (never resets)">
                      <Flame className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{lifetimeXp}</span>
                      <span className="text-xs text-muted-foreground">Lifetime XP</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Weekly leaderboard points">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">WK</span>
                      <span className="font-semibold">{profile.leaderboard_points}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Spendable coins">
                      <Coins className="h-4 w-4 text-accent" />
                      <span className="font-semibold">{profile.coins || 0}</span>
                      <span className="text-xs text-muted-foreground">coins</span>
                    </div>
                  </div>
                  {nextLevel && (
                    <span className="text-xs text-muted-foreground">
                      {nextLevel.minPoints - lifetimeXp} to Lv.{nextLevel.level}
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
    </div>
  );
}
