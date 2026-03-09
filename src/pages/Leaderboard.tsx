import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Flame, Target, UserPlus, UserMinus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLeaderboard, useFollowers } from "@/lib/supabase-hooks";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

function FollowButton({ userId }: { userId: string }) {
  const { user } = useAuth();
  const { isFollowing, followUser, unfollowUser } = useFollowers(userId);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!user || user.id === userId) return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        unfollowUser(userId);
        toast({ title: "Unfollowed" });
      } else {
        followUser(userId);
        toast({ title: "Following! 🎉" });
      }
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <Button
      size="sm"
      variant={isFollowing ? "outline" : "default"}
      className={isFollowing ? "h-7 px-2 text-xs" : "h-7 px-2 text-xs bg-gradient-primary text-primary-foreground"}
      disabled={loading}
      onClick={(e) => { e.stopPropagation(); handleToggle(); }}
    >
      {isFollowing ? <><UserMinus className="h-3 w-3 mr-1" />Unfollow</> : <><UserPlus className="h-3 w-3 mr-1" />Follow</>}
    </Button>
  );
}

export default function Leaderboard() {
  const { data: users = [], isLoading } = useLeaderboard();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-12 w-48 mx-auto" />
        <Skeleton className="h-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  const ranked = users.map((u, i) => ({
    rank: i + 1,
    userId: u.user_id,
    name: u.display_name || "Anonymous",
    avatar: (u.display_name || "A").slice(0, 2).toUpperCase(),
    avatarUrl: u.avatar_url,
    streak: u.total_streak,
    points: u.leaderboard_points,
    habits: u.habits_completed,
    isMe: u.user_id === user?.id,
  }));

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  if (ranked.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 text-center">
        <h1 className="text-3xl font-display font-bold">Leaderboard</h1>
        <Card className="p-8">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No one on the leaderboard yet. Start completing habits to earn points!</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-bold text-center">Leaderboard</h1>

      {top3.length >= 3 && (
        <div className="flex items-end justify-center gap-4 py-4">
          {[top3[1], top3[0], top3[2]].map((u, i) => {
            const heights = ["h-24", "h-32", "h-20"];
            const medals = ["🥈", "🥇", "🥉"];
            return (
              <motion.div key={u.rank} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} className="flex flex-col items-center cursor-pointer" onClick={() => navigate(`/user/${u.userId}`)}>
                <span className="text-2xl mb-2">{medals[i]}</span>
                <Avatar className={`${i === 1 ? "w-16 h-16" : "w-12 h-12"} border-2 ${i === 1 ? "border-accent shadow-glow-accent" : "border-border"}`}>
                  {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.name} />}
                  <AvatarFallback className={`font-display font-bold ${i === 1 ? "bg-gradient-accent text-accent-foreground" : "bg-muted"}`}>
                    {u.avatar}
                  </AvatarFallback>
                </Avatar>
                <p className="font-display font-semibold text-sm mt-2">{u.isMe ? "You" : u.name}</p>
                <p className="text-xs text-muted-foreground">{u.points.toLocaleString()} pts</p>
                {!u.isMe && <div className="mt-1"><FollowButton userId={u.userId} /></div>}
                <div className={`${heights[i]} w-20 rounded-t-lg mt-2 ${i === 1 ? "bg-gradient-accent" : "bg-muted"}`} />
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        {rest.map((u, i) => (
          <motion.div key={u.rank} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
            <Card className={`p-3 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors ${u.isMe ? "border-primary/40 bg-primary/5" : ""}`} onClick={() => navigate(`/user/${u.userId}`)}>
              <span className="w-8 text-center font-display font-bold text-muted-foreground">#{u.rank}</span>
              <Avatar className="w-10 h-10">
                {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.name} />}
                <AvatarFallback className={`font-display text-sm ${u.isMe ? "bg-gradient-primary text-primary-foreground" : "bg-muted"}`}>
                  {u.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{u.isMe ? "You" : u.name}</p>
                <p className="text-xs text-muted-foreground">{u.points.toLocaleString()} points</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-primary" />{u.streak}</span>
                  <span className="flex items-center gap-1"><Target className="h-3 w-3" />{u.habits}</span>
                </div>
                {!u.isMe && <FollowButton userId={u.userId} />}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
