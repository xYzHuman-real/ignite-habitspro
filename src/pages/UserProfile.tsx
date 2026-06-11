import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Flame, UserPlus, UserMinus, Trophy, Target, CalendarDays, Coins, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { PremiumBadge } from "@/components/PremiumBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useFollowers } from "@/lib/supabase-hooks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getLevelForPoints, getNextLevel, getProgressToNext } from "@/lib/xp-levels";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { followerCount, followingCount, isFollowing, followUser, unfollowUser } = useFollowers(userId);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user_profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
      return data;
    },
    enabled: !!userId,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ["user_public_badges", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: userBadges } = await supabase.from("user_badges").select("badge_id").eq("user_id", userId);
      if (!userBadges?.length) return [];
      const badgeIds = userBadges.map((b) => b.badge_id);
      const { data } = await supabase.from("badges").select("*").in("id", badgeIds);
      return data || [];
    },
    enabled: !!userId,
  });

  const isOwnProfile = user?.id === userId;
  const showAvatar = isOwnProfile || (profile as any)?.show_avatar !== false;
  const showStats = isOwnProfile || (profile as any)?.show_stats !== false;
  const showProfile = isOwnProfile || (profile as any)?.show_profile !== false;

  if (isLoading || !profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const avatarText = profile.display_name
    ? profile.display_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const currentLevel = getLevelForPoints(profile.leaderboard_points);
  const joinDate = format(new Date(profile.created_at), "MMM yyyy");

  const handleFollowToggle = () => {
    if (!userId) return;
    if (isFollowing) {
      unfollowUser(userId);
      toast({ title: "Unfollowed" });
    } else {
      followUser(userId);
      toast({ title: "Following! 🎉" });
    }
  };

  if (!showProfile && !isOwnProfile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="p-8 text-center">
          <EyeOff className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h2 className="font-display font-bold text-lg">{profile.display_name || "User"}</h2>
          <p className="text-muted-foreground mt-1">This profile is private.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <Avatar className="w-24 h-24 border-4 border-primary shadow-glow-primary">
              {showAvatar && profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name} />}
              <AvatarFallback className="bg-gradient-primary text-primary-foreground font-display text-2xl font-bold">
                {avatarText}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <h1 className="text-2xl font-display font-bold">{profile.display_name || "Anonymous"}</h1>
                {(() => {
                  const now = Date.now();
                  const until = (profile as any).premium_until ? new Date((profile as any).premium_until).getTime() : 0;
                  const isPaid = (profile as any).subscription_tier === "premium" && until > now;
                  return isPaid ? <PremiumBadge size="sm" /> : null;
                })()}
              </div>
              <div className="flex items-center gap-2 mt-0.5 justify-center sm:justify-start flex-wrap">
                {profile.username && (
                  <p className="text-muted-foreground text-sm">@{profile.username}</p>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {currentLevel.icon} Lv.{currentLevel.level} {profile.title || currentLevel.title}
                </span>
              </div>
              {profile.bio && <p className="text-sm mt-2 text-muted-foreground">{profile.bio}</p>}

              {!isOwnProfile && (
                <div className="mt-3 flex justify-center sm:justify-start">
                  <Button
                    size="sm"
                    variant={isFollowing ? "outline" : "default"}
                    className={isFollowing ? "" : "bg-gradient-primary text-primary-foreground"}
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? (
                      <><UserMinus className="h-4 w-4 mr-1" /> Unfollow</>
                    ) : (
                      <><UserPlus className="h-4 w-4 mr-1" /> Follow</>
                    )}
                  </Button>
                </div>
              )}

              {isOwnProfile && (
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={() => navigate("/profile")}>
                    Go to My Profile
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-5" />

          {showStats ? (
            <>
              <div className="grid grid-cols-4 gap-4 text-center">
                <button
                  type="button"
                  onClick={() => navigate(`/user/${userId}/follows?tab=followers`)}
                  className="rounded-lg py-1 hover:bg-muted/40 active:scale-95 transition"
                >
                  <motion.p layout className="text-2xl font-display font-bold">
                    {followerCount}
                  </motion.p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/user/${userId}/follows?tab=following`)}
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
                  <p className="text-xs text-muted-foreground">Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{profile.habits_completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground flex-wrap justify-center sm:justify-start">
                <div className="flex items-center gap-1">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="font-semibold">{profile.leaderboard_points} points</span>
                </div>
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  <span>Joined {joinDate}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">This user has hidden their stats.</p>
          )}
        </Card>
      </motion.div>

      {badges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5">
            <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" /> Badges
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {badges.map((badge) => (
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
    </div>
  );
}
