import { motion } from "framer-motion";
import { Trophy, Flame, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { leaderboardData } from "@/lib/store";

export default function Leaderboard() {
  const top3 = leaderboardData.slice(0, 3);
  const rest = leaderboardData.slice(3);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-bold text-center">Leaderboard</h1>

      {/* Top 3 podium */}
      <div className="flex items-end justify-center gap-4 py-4">
        {[top3[1], top3[0], top3[2]].map((user, i) => {
          const heights = ["h-24", "h-32", "h-20"];
          const medals = ["🥈", "🥇", "🥉"];
          return (
            <motion.div
              key={user.rank}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center"
            >
              <span className="text-2xl mb-2">{medals[i]}</span>
              <Avatar className={`${i === 1 ? "w-16 h-16" : "w-12 h-12"} border-2 ${i === 1 ? "border-accent shadow-glow-accent" : "border-border"}`}>
                <AvatarFallback className={`font-display font-bold ${i === 1 ? "bg-gradient-accent text-accent-foreground" : "bg-muted"}`}>
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              <p className="font-display font-semibold text-sm mt-2">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.points.toLocaleString()} pts</p>
              <div className={`${heights[i]} w-20 rounded-t-lg mt-2 ${
                i === 1 ? "bg-gradient-accent" : i === 0 ? "bg-muted" : "bg-muted"
              }`} />
            </motion.div>
          );
        })}
      </div>

      {/* Rest of leaderboard */}
      <div className="space-y-2">
        {rest.map((user, i) => (
          <motion.div
            key={user.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <Card className={`p-3 flex items-center gap-4 ${user.name === "You" ? "border-primary/40 bg-primary/5" : ""}`}>
              <span className="w-8 text-center font-display font-bold text-muted-foreground">#{user.rank}</span>
              <Avatar className="w-10 h-10">
                <AvatarFallback className={`font-display text-sm ${user.name === "You" ? "bg-gradient-primary text-primary-foreground" : "bg-muted"}`}>
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.points.toLocaleString()} points</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-primary" />{user.streak}</span>
                <span className="flex items-center gap-1"><Target className="h-3 w-3" />{user.habits}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
