import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useWeeklyReport() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["weekly_report", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      startOfWeek.setHours(0, 0, 0, 0);
      const startStr = startOfWeek.toISOString().split("T")[0];

      // Previous week for comparison
      const prevStart = new Date(startOfWeek);
      prevStart.setDate(prevStart.getDate() - 7);
      const prevStartStr = prevStart.toISOString().split("T")[0];
      const prevEndStr = startStr;

      // This week's habit completions
      const { data: completions } = await supabase
        .from("habit_completions")
        .select("completed_date, habit_id")
        .eq("user_id", user.id)
        .gte("completed_date", startStr);

      // Previous week's habit completions
      const { data: prevCompletions } = await supabase
        .from("habit_completions")
        .select("completed_date")
        .eq("user_id", user.id)
        .gte("completed_date", prevStartStr)
        .lt("completed_date", prevEndStr);

      // This week's focus sessions
      const { data: sessions } = await supabase
        .from("pomodoro_sessions")
        .select("duration_minutes, session_type, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startOfWeek.toISOString());

      // Previous week's focus sessions
      const { data: prevSessions } = await supabase
        .from("pomodoro_sessions")
        .select("duration_minutes")
        .eq("user_id", user.id)
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", startOfWeek.toISOString());

      // Daily logins this week
      const { data: logins } = await supabase
        .from("daily_logins")
        .select("login_date, points_earned, streak")
        .eq("user_id", user.id)
        .gte("login_date", startStr);

      // All habits for context
      const { data: habits } = await supabase
        .from("habits")
        .select("id, name, icon, streak, longest_streak")
        .eq("user_id", user.id);

      // Profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("leaderboard_points, total_streak, habits_completed")
        .eq("user_id", user.id)
        .single();

      const totalCompletions = (completions || []).length;
      const prevTotalCompletions = (prevCompletions || []).length;
      const totalFocusMinutes = (sessions || []).reduce((sum, s) => sum + s.duration_minutes, 0);
      const prevFocusMinutes = (prevSessions || []).reduce((sum, s) => sum + s.duration_minutes, 0);
      const totalPointsEarned = (logins || []).reduce((sum, l) => sum + l.points_earned, 0);
      const loginStreak = logins && logins.length > 0 ? Math.max(...logins.map((l) => l.streak)) : 0;
      const daysActive = new Set((completions || []).map((c) => c.completed_date)).size;

      // Unique habits completed per day for consistency
      const dayMap = new Map<string, Set<string>>();
      (completions || []).forEach((c) => {
        if (!dayMap.has(c.completed_date)) dayMap.set(c.completed_date, new Set());
        dayMap.get(c.completed_date)!.add(c.habit_id);
      });

      // Daily breakdown (Mon-Sun)
      const dailyBreakdown = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return {
          day: dayNames[i],
          date: dateStr,
          completions: dayMap.get(dateStr)?.size || 0,
          focusMinutes: (sessions || [])
            .filter((s) => s.created_at.startsWith(dateStr))
            .reduce((sum, s) => sum + s.duration_minutes, 0),
        };
      });

      // Top habit (most completions this week)
      const habitCounts = new Map<string, number>();
      (completions || []).forEach((c) => {
        habitCounts.set(c.habit_id, (habitCounts.get(c.habit_id) || 0) + 1);
      });
      let topHabitId = "";
      let topCount = 0;
      habitCounts.forEach((count, id) => {
        if (count > topCount) { topCount = count; topHabitId = id; }
      });
      const topHabit = (habits || []).find((h) => h.id === topHabitId);

      return {
        weekStart: startStr,
        totalCompletions,
        prevTotalCompletions,
        completionChange: prevTotalCompletions > 0 ? Math.round(((totalCompletions - prevTotalCompletions) / prevTotalCompletions) * 100) : totalCompletions > 0 ? 100 : 0,
        totalFocusMinutes,
        prevFocusMinutes,
        focusChange: prevFocusMinutes > 0 ? Math.round(((totalFocusMinutes - prevFocusMinutes) / prevFocusMinutes) * 100) : totalFocusMinutes > 0 ? 100 : 0,
        totalPointsEarned,
        loginStreak,
        daysActive,
        totalHabits: (habits || []).length,
        dailyBreakdown,
        topHabit: topHabit ? { name: topHabit.name, icon: topHabit.icon, count: topCount, streak: topHabit.streak } : null,
        bestStreak: (habits || []).reduce((max, h) => Math.max(max, h.streak), 0),
        longestStreak: (habits || []).reduce((max, h) => Math.max(max, h.longest_streak), 0),
        totalPoints: profile?.leaderboard_points || 0,
      };
    },
    enabled: !!user,
  });
}
