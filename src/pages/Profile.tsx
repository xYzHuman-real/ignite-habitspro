import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Flame, UserPlus, Edit3, Check, LogOut, Shield, Coins, Gift, Camera, Settings, Crown, Sparkles, ArrowRight } from "lucide-react";
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
  const { isPremium, isPaid, isTrial, trialDaysLeft } = usePremium();
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
    <div className="max-w-2xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: "easeOut" }}>
        <Card className="p-6 relative bg-card border border-border/60 shadow-none">
          {!editing && (
            <button
              onClick={() => navigate("/settings")}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/60 transition-colors"
              aria-label="Settings"
            >
              <Settings className="h-[18px] w-[18px] text-muted-foreground" />
            </button>
          )}
          {editing ? (
            <div className="space-y-4">
              <h2 className="font-display font-semibold text-[20px] tracking-tight">Edit Profile</h2>
              <Input placeholder="Your Name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
              <UsernameField
                value={form.username}
                onChange={(v) => setForm({ ...form, username: v })}
                currentUsername={profile.username}
                onValidityChange={setUsernameValid}
              />
              <Textarea placeholder="Write a short bio..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} />
              <div className="flex gap-2">
                <Button onClick={saveProfile}>
                  <Check className="h-4 w-4 mr-1" /> Save
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="relative group">
                  <Avatar className="w-[72px] h-[72px] ring-1 ring-border/70">
                    {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name} />}
                    <AvatarFallback className="bg-muted text-foreground font-display text-lg font-semibold">
                      {avatarText}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                    aria-label="Change photo"
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 justify-center flex-wrap">
                    <h1 className="text-[22px] font-display font-semibold tracking-tight leading-tight">
                      {profile.display_name || "Set up your profile"}
                    </h1>
                    {isPremium && (
                      <PremiumBadge size="sm" label="Premium" onClick={() => navigate("/pricing")} />
                    )}
                  </div>
                  <p className="text-[13px] text-muted-foreground">
                    {profile.username ? `@${profile.username}` : "No username set"}
                    <span className="mx-1.5 text-border">·</span>
                    Lv.{currentLevel.level} {(profile as any).title || currentLevel.title}
                  </p>
                  {profile.bio && (
                    <p className="text-[14px] text-foreground/80 max-w-sm mx-auto pt-1">{profile.bio}</p>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full h-8 px-4 text-[12px] font-medium mt-1"
                  onClick={startEdit}
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit Profile
                </Button>
              </div>

              {/* Stats + level — one combined block */}
              <div className="mt-6 pt-5 border-t border-border/60">
                <div className="grid grid-cols-4 divide-x divide-border/60">
                  <button type="button" onClick={() => navigate("/follows?tab=followers")} className="flex flex-col items-center py-1 active:opacity-60 transition">
                    <motion.span layout className="text-[20px] font-display font-semibold tabular-nums leading-none">{followerCount}</motion.span>
                    <span className="text-[11px] text-muted-foreground mt-1.5">Followers</span>
                  </button>
                  <button type="button" onClick={() => navigate("/follows?tab=following")} className="flex flex-col items-center py-1 active:opacity-60 transition">
                    <motion.span layout className="text-[20px] font-display font-semibold tabular-nums leading-none">{followingCount}</motion.span>
                    <span className="text-[11px] text-muted-foreground mt-1.5">Following</span>
                  </button>
                  <div className="flex flex-col items-center py-1">
                    <span className="text-[20px] font-display font-semibold tabular-nums leading-none">{profile.total_streak}</span>
                    <span className="text-[11px] text-muted-foreground mt-1.5">Day streak</span>
                  </div>
                  <div className="flex flex-col items-center py-1">
                    <span className="text-[20px] font-display font-semibold tabular-nums leading-none">{profile.habits_completed}</span>
                    <span className="text-[11px] text-muted-foreground mt-1.5">Completed</span>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground">Level {currentLevel.level}</span>
                    {nextLevel && (
                      <span className="text-muted-foreground tabular-nums">
                        {nextLevel.minPoints - lifetimeXp} XP to Lv.{nextLevel.level}
                      </span>
                    )}
                  </div>
                  <Progress value={progressToNext} className="h-1" />
                  <p className="text-[12px] text-muted-foreground tabular-nums pt-0.5">
                    <span className="text-foreground font-medium">{lifetimeXp}</span> XP
                    <span className="mx-1.5 text-border">·</span>
                    <span className="text-foreground font-medium">{profile.leaderboard_points}</span> this week
                    <span className="mx-1.5 text-border">·</span>
                    <span className="text-foreground font-medium">{profile.coins || 0}</span> coins
                  </p>
                </div>
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {!editing && !isPaid && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          type="button"
          onClick={() => navigate("/pricing")}
          className="w-full text-left rounded-2xl p-4 bg-card border border-border/60 hover:border-primary/40 transition-colors flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Crown className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[14px] font-semibold text-foreground">
                {isTrial ? "Keep Premium after your trial" : "Upgrade to Premium"}
              </p>
              {isTrial && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground tabular-nums">
                  {trialDaysLeft}d left
                </span>
              )}
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
              {isTrial ? "Subscribe to keep unlimited access" : "Unlimited habits, AI planner, no ads"}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </motion.button>
      )}

      {!editing && earnedBadges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.25, ease: "easeOut" }}>
          <Card className="p-5 bg-card border border-border/60 shadow-none">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground">Badges</h2>
              <span className="text-[12px] text-muted-foreground tabular-nums">{earnedBadges.length}</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {earnedBadges.map((badge) => (
                <div key={badge.id} className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-xl">
                    {badge.icon}
                  </div>
                  <span className="text-[11px] text-center text-muted-foreground leading-tight line-clamp-2">{badge.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {!editing && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.25, ease: "easeOut" }}>
          <Card className="p-5 bg-card border border-border/60 shadow-none">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground">Activity</h2>
              <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                <CalendarDays className="h-3 w-3" /> Joined {joinDate}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 49 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (48 - i));
                const dateStr = date.toISOString().split("T")[0];
                const count = activityMap.get(dateStr) || 0;
                return (
                  <div
                    key={i}
                    title={`${dateStr}: ${count} activities`}
                    className={`aspect-square rounded-[4px] ${
                      count >= 4 ? "bg-primary" :
                      count >= 3 ? "bg-primary/60" :
                      count >= 1 ? "bg-primary/25" :
                      "bg-muted/60"
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-3 text-[11px] text-muted-foreground">
              Less
              <div className="w-2.5 h-2.5 rounded-[3px] bg-muted/60" />
              <div className="w-2.5 h-2.5 rounded-[3px] bg-primary/25" />
              <div className="w-2.5 h-2.5 rounded-[3px] bg-primary/60" />
              <div className="w-2.5 h-2.5 rounded-[3px] bg-primary" />
              More
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
