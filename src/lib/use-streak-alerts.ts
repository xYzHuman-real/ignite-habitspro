import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

// Send push notification via edge function
async function sendPush(userId: string, title: string, body: string, actionUrl?: string) {
  try {
    await supabase.functions.invoke("send-push", {
      body: {
        user_id: userId,
        title,
        body,
        data: actionUrl ? { action_url: actionUrl } : {},
      },
    });
  } catch (e) {
    console.error("Failed to send push notification:", e);
  }
}

/**
 * Auto-generates notifications for:
 * 1. Streak-at-risk alerts (habits not completed today)
 * 2. Habit reminders (if user has habits with reminders)
 * 3. Challenge progress nudges
 * Runs once per session to avoid spamming.
 */
export function useStreakAlerts() {
  const { user } = useAuth();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!user || hasRun.current) return;
    hasRun.current = true;

    const checkAndNotify = async () => {
      const today = new Date().toISOString().split("T")[0];

      // Check if we already sent notifications today
      const { data: todayNotifs } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("type", "streak_alert")
        .gte("created_at", today)
        .limit(1);

      if (todayNotifs && todayNotifs.length > 0) return;

      // Get habits with active streaks that aren't completed today
      const { data: habits } = await supabase
        .from("habits")
        .select("id, name, icon, streak, completed_today")
        .eq("user_id", user.id);

      if (!habits || habits.length === 0) return;

      const atRiskHabits = habits.filter((h) => h.streak >= 3 && !h.completed_today);
      const incompleteHabits = habits.filter((h) => !h.completed_today);

      // Streak-at-risk alerts
      if (atRiskHabits.length > 0) {
        const topHabit = atRiskHabits.reduce((a, b) => (a.streak > b.streak ? a : b));
        const title = "🔥 Streak at Risk!";
        const message = `Your ${topHabit.name} streak (${topHabit.streak} days) is at risk! Complete it today to keep going.`;
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "streak_alert",
          title,
          message,
          icon: "🔥",
          action_url: "/habits",
        });
        await sendPush(user.id, title, message, "/habits");
      }

      // Daily habit reminder
      if (incompleteHabits.length > 0) {
        const title = "📋 Daily Habits Reminder";
        const message = `You have ${incompleteHabits.length} habit${incompleteHabits.length > 1 ? "s" : ""} to complete today. Let's go!`;
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "habit_reminder",
          title,
          message,
          icon: "📋",
          action_url: "/habits",
        });
        await sendPush(user.id, title, message, "/habits");
      }

      // Check challenge progress
      const { data: userChallenges } = await supabase
        .from("user_challenges")
        .select("id, progress, challenge_id, completed, last_checkin_date")
        .eq("user_id", user.id)
        .eq("completed", false);

      if (userChallenges && userChallenges.length > 0) {
        const uncheckdToday = userChallenges.filter((uc: any) => uc.last_checkin_date !== today);
        if (uncheckdToday.length > 0) {
          const title = "🏆 Challenge Check-in";
          const message = `You have ${uncheckdToday.length} active challenge${uncheckdToday.length > 1 ? "s" : ""} waiting for today's check-in!`;
          await supabase.from("notifications").insert({
            user_id: user.id,
            type: "challenge_reminder",
            title,
            message,
            icon: "🏆",
            action_url: "/challenges",
          });
          await sendPush(user.id, title, message, "/challenges");
        }
      }
    };

    const timer = setTimeout(checkAndNotify, 3000);
    return () => clearTimeout(timer);
  }, [user]);
}
