import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Award, Clock, BookOpen, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/lib/supabase-hooks";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

function FocusQualityGauge({ quality }: { quality: number }) {
  const angle = (quality / 100) * 180;
  const label = quality >= 80 ? "Great" : quality >= 60 ? "Good" : quality >= 40 ? "Fair" : "Low";
  const color = quality >= 80 ? "hsl(var(--success))" : quality >= 60 ? "hsl(var(--primary))" : quality >= 40 ? "hsl(var(--accent))" : "hsl(var(--destructive))";

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full h-full">
          <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" strokeLinecap="round" />
          <path
            d="M 10 55 A 50 50 0 0 1 110 55"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(angle / 180) * 157} 157`}
          />
          <circle cx={60 + 50 * Math.cos((Math.PI * (180 - angle)) / 180)} cy={55 - 50 * Math.sin((Math.PI * (180 - angle)) / 180)} r="5" fill={color} />
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className="text-2xl font-display font-bold">{quality}%</span>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground max-w-[140px]">Based on app retention during sessions</p>
    </div>
  );
}

export function FocusStatsTab() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  // Fetch last 7 days of sessions
  const { data: weekSessions = [] } = useQuery({
    queryKey: ["week_sessions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data } = await supabase
        .from("pomodoro_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("session_type", "focus")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Chart data for last 7 days
  const chartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayMinutes = weekSessions
        .filter((s) => s.created_at.startsWith(dateStr))
        .reduce((sum, s) => sum + s.duration_minutes, 0);
      result.push({
        day: days[d.getDay() === 0 ? 6 : d.getDay() - 1],
        minutes: dayMinutes,
        isToday: i === 0,
      });
    }
    return result;
  }, [weekSessions]);

  // Focus quality: ratio of completed sessions to total
  const focusQuality = useMemo(() => {
    if (weekSessions.length === 0) return 0;
    const completed = weekSessions.filter((s) => s.completed).length;
    return Math.round((completed / weekSessions.length) * 100);
  }, [weekSessions]);

  // Recent sessions (last 5)
  const recentSessions = useMemo(() => {
    return weekSessions.slice(0, 5).map((s) => ({
      id: s.id,
      subject: s.linked_subject || s.linked_task || "General Focus",
      minutes: s.duration_minutes,
      points: s.duration_minutes >= 10 ? Math.floor(s.duration_minutes / 3) : 0,
      icon: s.linked_subject ? "📖" : s.linked_task ? "📋" : "⏱️",
    }));
  }, [weekSessions]);

  const totalPoints = profile?.leaderboard_points || 0;
  const streak = profile?.total_streak || 0;

  return (
    <div className="space-y-5">
      {/* Streak & Points */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Day Streak</p>
                <p className="text-3xl font-display font-bold">{streak}</p>
              </div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex items-center gap-3">
              <Award className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Points</p>
                <p className="text-3xl font-display font-bold">{totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Focus Quality */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="p-5">
          <h3 className="text-sm font-display font-semibold mb-3">Focus Quality</h3>
          <FocusQualityGauge quality={focusQuality} />
        </Card>
      </motion.div>

      {/* Minutes Focused Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-display font-semibold">Minutes Focused</h3>
            <span className="text-xs text-muted-foreground">Last 7 Days</span>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="20%">
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis hide />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={entry.isToday ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.5)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Recent Sessions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="p-5">
          <h3 className="text-sm font-display font-semibold mb-3">Recent Sessions</h3>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No sessions yet this week</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-sm font-medium">{s.subject}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {s.minutes}m
                    </span>
                    <span className="text-xs font-semibold text-primary">+{s.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Go to Theme Store */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Button
          onClick={() => navigate("/shop")}
          className="w-full bg-foreground text-background hover:bg-foreground/90 h-12 text-base font-semibold"
        >
          Go to Theme Store <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
