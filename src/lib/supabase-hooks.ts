import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getLevelForPoints, getDailyLoginBonus } from "@/lib/xp-levels";

// ---- Profile ----
export function useProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", user?.id] }),
  });

  return { profile, isLoading, updateProfile: updateProfile.mutate };
}

// ---- Guest mode helpers ----
const GUEST_HABITS_KEY = "guest_habits";
const isGuest = () => typeof window !== "undefined" && localStorage.getItem("guest_mode") === "true";
const readGuestHabits = (): any[] => {
  try { return JSON.parse(localStorage.getItem(GUEST_HABITS_KEY) || "[]"); } catch { return []; }
};
const writeGuestHabits = (h: any[]) => localStorage.setItem(GUEST_HABITS_KEY, JSON.stringify(h));
const guestId = () => "guest";

// ---- Habits ----
export function useHabits() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const guest = !user && isGuest();
  const queryUserId = user?.id ?? (guest ? guestId() : undefined);

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ["habits", queryUserId],
    queryFn: async () => {
      if (guest) {
        const now = new Date();
        const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const list = readGuestHabits().map((h: any) => {
          if (h.completed_today) {
            const updated = new Date(h.updated_at);
            const updatedLocal = `${updated.getFullYear()}-${String(updated.getMonth() + 1).padStart(2, "0")}-${String(updated.getDate()).padStart(2, "0")}`;
            if (updatedLocal !== todayLocal) return { ...h, completed_today: false, current: 0 };
          }
          return h;
        });
        writeGuestHabits(list);
        const priorityWeight: Record<string, number> = { very_important: 0, important: 1, less_important: 2 };
        return [...list].sort((a, b) => {
          const pa = priorityWeight[a.priority] ?? 1;
          const pb = priorityWeight[b.priority] ?? 1;
          if (pa !== pb) return pa - pb;
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        });
      }
      if (!user) return [];
      const { data } = await supabase.from("habits").select("*").eq("user_id", user.id).order("sort_order").order("created_at");
      if (!data) return [];

      // Reset habits that were completed on a previous day (local time)
      const now = new Date();
      const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

      const staleHabits = data.filter((h) => {
        if (!h.completed_today) return false;
        const updated = new Date(h.updated_at);
        const updatedLocal = `${updated.getFullYear()}-${String(updated.getMonth() + 1).padStart(2, "0")}-${String(updated.getDate()).padStart(2, "0")}`;
        return updatedLocal !== todayLocal;
      });

      let result = data;
      if (staleHabits.length > 0) {
        await Promise.all(
          staleHabits.map((h) =>
            supabase.from("habits").update({
              completed_today: false,
              current: 0,
            }).eq("id", h.id)
          )
        );
        result = data.map((h) =>
          staleHabits.find((s) => s.id === h.id)
            ? { ...h, completed_today: false, current: 0 }
            : h
        );
      }

      // Sort by priority weight (very_important > important > less_important), then sort_order
      const priorityWeight: Record<string, number> = { very_important: 0, important: 1, less_important: 2 };
      return [...result].sort((a, b) => {
        const pa = priorityWeight[(a as any).priority] ?? 1;
        const pb = priorityWeight[(b as any).priority] ?? 1;
        if (pa !== pb) return pa - pb;
        return ((a as any).sort_order ?? 0) - ((b as any).sort_order ?? 0);
      });
    },
    enabled: !!user || guest,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["habits", queryUserId] });

  const addHabit = useMutation({
    mutationFn: async (habit: { name: string; icon: string; target: number; difficulty: string; [key: string]: unknown }) => {
      if (guest) {
        const list = readGuestHabits();
        const nowIso = new Date().toISOString();
        list.unshift({
          id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          user_id: guestId(),
          completed_today: false,
          current: 0,
          streak: 0,
          longest_streak: 0,
          sort_order: 0,
          priority: "important",
          reminder_enabled: false,
          reminder_days: ["mon","tue","wed","thu","fri","sat","sun"],
          created_at: nowIso,
          updated_at: nowIso,
          ...habit,
        });
        writeGuestHabits(list);
        return;
      }
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("habits").insert({ ...habit, user_id: user.id } as any);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateHabit = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      if (guest) {
        const list = readGuestHabits().map((h: any) => h.id === id ? { ...h, ...updates, updated_at: new Date().toISOString() } : h);
        writeGuestHabits(list);
        return;
      }
      const { error } = await supabase.from("habits").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      if (guest) {
        writeGuestHabits(readGuestHabits().filter((h: any) => h.id !== id));
        return;
      }
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleHabit = useMutation({
    mutationFn: async (habit: { id: string; completed_today: boolean; current: number; target: number; streak: number; longest_streak: number }) => {
      if (guest) {
        const list = readGuestHabits().map((h: any) => {
          if (h.id !== habit.id) return h;
          if (habit.completed_today) return { ...h, completed_today: false, current: 0, updated_at: new Date().toISOString() };
          const newCurrent = habit.current + 1;
          const nowComplete = newCurrent >= habit.target;
          return { ...h, current: newCurrent, completed_today: nowComplete, streak: nowComplete ? h.streak + 1 : h.streak, longest_streak: Math.max(h.longest_streak, nowComplete ? h.streak + 1 : h.streak), updated_at: new Date().toISOString() };
        });
        writeGuestHabits(list);
        return;
      }
      if (!user) throw new Error("Not authenticated");

      // If already completed, reset (un-complete)
      if (habit.completed_today) {
        const { error } = await supabase.from("habits").update({
          completed_today: false,
          current: 0,
          // Don't change streak on un-complete to avoid confusion
        }).eq("id", habit.id);
        if (error) throw error;
        return;
      }

      const newCurrent = habit.current + 1;
      const nowComplete = newCurrent >= habit.target;

      // Update the habit's completion status (but don't change streak yet)
      const { error } = await supabase.from("habits").update({
        completed_today: nowComplete,
        current: newCurrent,
      }).eq("id", habit.id);
      if (error) throw error;

      if (nowComplete) {
        const now = new Date();
        const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        // Check if this habit already had a completion row today (=> already counted, prevent double-streak bump)
        const { data: existing } = await supabase
          .from("habit_completions")
          .select("id")
          .eq("habit_id", habit.id)
          .eq("completed_date", localDate)
          .maybeSingle();

        const alreadyCountedToday = !!existing;

        if (!alreadyCountedToday) {
          await supabase.from("habit_completions").insert({
            user_id: user.id,
            habit_id: habit.id,
            completed_date: localDate,
          });
        }

        await supabase.from("activity_log").upsert({
          user_id: user.id,
          activity_type: "habit_completion",
          activity_date: localDate,
          count: 1,
        }, { onConflict: "user_id,activity_type,activity_date" });

        // Skip streak/profile updates if this habit was already counted today
        if (alreadyCountedToday) return;

        // Check if ALL habits are now completed for today
        const { data: allHabits } = await supabase.from("habits").select("id, completed_today, streak, longest_streak").eq("user_id", user.id);
        const allCompleted = allHabits && allHabits.length > 0 && allHabits.every((h) => h.id === habit.id ? true : h.completed_today);

        if (allCompleted && allHabits) {
          // Increase streak for ALL habits — once per day
          await Promise.all(
            allHabits.map((h) => {
              const newStreak = h.id === habit.id ? habit.streak + 1 : h.streak + 1;
              const newLongest = Math.max(h.longest_streak, newStreak);
              return supabase.from("habits").update({
                streak: newStreak,
                longest_streak: newLongest,
              }).eq("id", h.id);
            })
          );
        }

        // Award points based on priority
        const habitPriority = (habit as any).priority || "important";
        const pointsMap: Record<string, number> = { very_important: 10, important: 5, less_important: 2 };
        const earnedPoints = pointsMap[habitPriority] || 5;
        const { data: profileData } = await supabase.from("profiles").select("total_streak, habits_completed, leaderboard_points, coins, lifetime_xp").eq("user_id", user.id).single();
        if (profileData) {
          const newPoints = profileData.leaderboard_points + earnedPoints;
          const newCoins = (profileData.coins || 0) + earnedPoints;
          const newLifetime = ((profileData as any).lifetime_xp || 0) + earnedPoints;
          const newLevel = getLevelForPoints(newLifetime);
          const maxStreak = allHabits ? Math.max(...allHabits.map(h => h.id === habit.id ? habit.streak + 1 : h.streak)) : habit.streak + 1;
          await supabase.from("profiles").update({
            total_streak: Math.max(profileData.total_streak, maxStreak),
            habits_completed: profileData.habits_completed + 1,
            leaderboard_points: newPoints,
            coins: newCoins,
            lifetime_xp: newLifetime,
            xp_level: newLevel.level,
            title: newLevel.title,
          } as any).eq("user_id", user.id);
        }
      }
    },
    onMutate: async (habit) => {
      await qc.cancelQueries({ queryKey: ["habits", queryUserId] });
      const previous = qc.getQueryData(["habits", queryUserId]);
      qc.setQueryData(["habits", queryUserId], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((h: any) => {
          if (h.id !== habit.id) return h;
          if (habit.completed_today) return { ...h, completed_today: false, current: 0 };
          const newCurrent = habit.current + 1;
          return { ...h, current: newCurrent, completed_today: newCurrent >= habit.target };
        });
      });
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(["habits", queryUserId], ctx.previous);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["habits", queryUserId] });
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  return { habits, isLoading, addHabit: addHabit.mutate, updateHabit: updateHabit.mutate, deleteHabit: deleteHabit.mutate, toggleHabit: toggleHabit.mutate };
}

// ---- Todos ----
export function useTodos() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["todos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("todos").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const addTodo = useMutation({
    mutationFn: async (todo: { text: string; priority: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("todos").insert({ ...todo, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos", user?.id] }),
  });

  const toggleTodo = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from("todos").update({ completed: !completed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos", user?.id] }),
  });

  const deleteTodo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos", user?.id] }),
  });

  return { todos, isLoading, addTodo: addTodo.mutate, toggleTodo: toggleTodo.mutate, deleteTodo: deleteTodo.mutate };
}

// ---- Pomodoro Sessions ----
export function usePomodoroSessions() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: ["pomodoro_sessions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("pomodoro_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", today);
      return data || [];
    },
    enabled: !!user,
  });

  const addSession = useMutation({
    mutationFn: async (session: { duration_minutes: number; session_type: string; linked_task?: string | null; linked_subject?: string | null }) => {
      if (!user) throw new Error("Not authenticated");
      const { linked_task, linked_subject, ...rest } = session;
      const { error } = await supabase.from("pomodoro_sessions").insert({
        ...rest,
        user_id: user.id,
        ...(linked_task ? { linked_task } : {}),
        ...(linked_subject ? { linked_subject } : {}),
      } as any);
      if (error) throw error;

      await supabase.from("activity_log").upsert({
        user_id: user.id,
        activity_type: "pomodoro_session",
        activity_date: new Date().toISOString().split("T")[0],
        count: 1,
      }, { onConflict: "user_id,activity_type,activity_date" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pomodoro_sessions", user?.id] }),
  });

  return { sessions, addSession: addSession.mutate };
}

// ---- Leaderboard ----
export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, total_streak, leaderboard_points, habits_completed, show_profile, show_stats, show_avatar, title, xp_level")
        .eq("show_profile", true)
        .order("leaderboard_points", { ascending: false })
        .limit(50);
      // Respect privacy: hide stats/avatar when user opted out
      return (data || []).map((u: any) => ({
        ...u,
        avatar_url: u.show_avatar === false ? null : u.avatar_url,
        total_streak: u.show_stats === false ? 0 : u.total_streak,
        habits_completed: u.show_stats === false ? 0 : u.habits_completed,
      }));
    },
  });
}

// ---- Community Groups ----
export function useCommunityGroups() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: groups = [] } = useQuery({
    queryKey: ["community_groups"],
    queryFn: async () => {
      const { data } = await supabase.from("community_groups").select("*").order("member_count", { ascending: false });
      return data || [];
    },
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ["community_memberships", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("community_memberships").select("group_id").eq("user_id", user.id);
      return (data || []).map((m) => m.group_id);
    },
    enabled: !!user,
  });

  const joinGroup = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("community_memberships").insert({ user_id: user.id, group_id: groupId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community_groups"] });
      qc.invalidateQueries({ queryKey: ["community_memberships", user?.id] });
    },
  });

  const leaveGroup = useMutation({
    mutationFn: async (groupId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("community_memberships").delete().eq("user_id", user.id).eq("group_id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community_groups"] });
      qc.invalidateQueries({ queryKey: ["community_memberships", user?.id] });
    },
  });

  return { groups, memberships, joinGroup: joinGroup.mutate, leaveGroup: leaveGroup.mutate };
}

// ---- Badges ----
export function useBadges() {
  const { user } = useAuth();

  const { data: allBadges = [] } = useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data } = await supabase.from("badges").select("*");
      return data || [];
    },
  });

  const { data: earnedBadgeIds = [] } = useQuery({
    queryKey: ["user_badges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("user_badges").select("badge_id").eq("user_id", user.id);
      return (data || []).map((b) => b.badge_id);
    },
    enabled: !!user,
  });

  return { allBadges, earnedBadgeIds };
}

// ---- Activity Log ----
export function useActivityLog() {
  const { user } = useAuth();

  const { data: activities = [] } = useQuery({
    queryKey: ["activity_log", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const since = new Date();
      since.setDate(since.getDate() - 120);
      const sinceStr = since.toISOString().split("T")[0];
      const sinceIso = since.toISOString();

      const [logRes, habitRes, pomoRes] = await Promise.all([
        supabase.from("activity_log").select("activity_date, count").eq("user_id", user.id).gte("activity_date", sinceStr),
        supabase.from("habit_completions").select("completed_date").eq("user_id", user.id).gte("completed_date", sinceStr),
        supabase.from("pomodoro_sessions").select("created_at").eq("user_id", user.id).eq("session_type", "focus").gte("created_at", sinceIso),
      ]);

      const map = new Map<string, number>();
      (logRes.data || []).forEach((r: any) => map.set(r.activity_date, (map.get(r.activity_date) || 0) + (r.count || 1)));
      (habitRes.data || []).forEach((r: any) => map.set(r.completed_date, (map.get(r.completed_date) || 0) + 1));
      (pomoRes.data || []).forEach((r: any) => {
        const d = new Date(r.created_at).toISOString().split("T")[0];
        map.set(d, (map.get(d) || 0) + 1);
      });
      return Array.from(map.entries()).map(([activity_date, count]) => ({ activity_date, count }));
    },
    enabled: !!user,
  });

  return { activities };
}

// ---- Challenges ----
export function useChallenges() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: challenges = [] } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data } = await supabase.from("challenges").select("*");
      return data || [];
    },
  });

  const { data: userChallenges = [] } = useQuery({
    queryKey: ["user_challenges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("user_challenges").select("*").eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const joinChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("user_challenges").insert({ user_id: user.id, challenge_id: challengeId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_challenges", user?.id] }),
  });

  const checkIn = useMutation({
    mutationFn: async ({ userChallengeId, currentProgress, targetDays, lastCheckinDate, challengeName, challengeDescription }: { 
      userChallengeId: string; currentProgress: number; targetDays: number; lastCheckinDate: string | null; challengeName: string; challengeDescription?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Prevent same-day double check-in using local date
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (lastCheckinDate === today) {
        throw new Error("ALREADY_CHECKED_IN");
      }

      // For study-related challenges, validate focus timer usage today
      const isStudyChallenge = challengeName.toLowerCase().includes("study") || challengeName.toLowerCase().includes("focus") || challengeName.toLowerCase().includes("pomodoro");
      if (isStudyChallenge) {
        // Extract required hours from description (e.g. "2 hours", "1.5 hours", "3-hour")
        let requiredMinutes = 60; // default 1 hour
        if (challengeDescription) {
          const hourMatch = challengeDescription.match(/(\d+\.?\d*)\s*[-\s]?hour/i);
          if (hourMatch) {
            requiredMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
          }
        }

        const { data: todaySessions } = await supabase
          .from("pomodoro_sessions")
          .select("duration_minutes")
          .eq("user_id", user.id)
          .gte("created_at", today);
        const totalMinutes = (todaySessions || []).reduce((sum, s) => sum + s.duration_minutes, 0);
        if (totalMinutes < requiredMinutes) {
          const requiredHours = requiredMinutes / 60;
          throw new Error(`INSUFFICIENT_FOCUS:${requiredHours}`);
        }
      }

      const newProgress = currentProgress + 1;
      const isComplete = newProgress >= targetDays;
      const { error } = await supabase.from("user_challenges").update({
        progress: newProgress,
        completed: isComplete,
        completed_at: isComplete ? new Date().toISOString() : null,
        last_checkin_date: today,
      }).eq("id", userChallengeId);
      if (error) throw error;

      if (isComplete) {
        const challenge = challenges.find((c) => {
          const uc = userChallenges.find((u) => u.id === userChallengeId);
          return uc && c.id === uc.challenge_id;
        });
        if (challenge) {
          const { data: profile } = await supabase.from("profiles").select("leaderboard_points, lifetime_xp").eq("user_id", user.id).single();
          if (profile) {
            await supabase.from("profiles").update({
              leaderboard_points: profile.leaderboard_points + challenge.points_reward,
              lifetime_xp: ((profile as any).lifetime_xp || 0) + challenge.points_reward,
            } as any).eq("user_id", user.id);
          }
          if (challenge.badge_reward) {
            await supabase.from("user_badges").upsert({
              user_id: user.id,
              badge_id: challenge.badge_reward,
            }, { onConflict: "user_id,badge_id" });
          }

          // Notify on challenge completion
          await supabase.from("notifications").insert({
            user_id: user.id,
            type: "challenge_complete",
            title: "🏆 Challenge Complete!",
            message: `You finished "${challenge.name}" and earned ${challenge.points_reward} points!`,
            icon: "🏆",
            action_url: "/challenges",
          });
        }
      }
    },
    onMutate: async ({ userChallengeId, currentProgress, targetDays }) => {
      await qc.cancelQueries({ queryKey: ["user_challenges", user?.id] });
      const prev = qc.getQueryData(["user_challenges", user?.id]);
      qc.setQueryData(["user_challenges", user?.id], (old: any) =>
        (old || []).map((u: any) =>
          u.id === userChallengeId
            ? { ...u, progress: currentProgress + 1, completed: currentProgress + 1 >= targetDays, last_checkin_date: new Date().toISOString().slice(0, 10) }
            : u
        )
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["user_challenges", user?.id], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["user_challenges", user?.id] });
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      qc.invalidateQueries({ queryKey: ["user_badges", user?.id] });
    },
  });

  return { challenges, userChallenges, joinChallenge: joinChallenge.mutate, checkIn: checkIn.mutate };
}

// ---- Followers ----
export function useFollowers(targetUserId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const profileId = targetUserId || user?.id;

  const { data: followerCount = 0 } = useQuery({
    queryKey: ["follower_count", profileId],
    queryFn: async () => {
      if (!profileId) return 0;
      const { count } = await supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", profileId);
      return count || 0;
    },
    enabled: !!profileId,
  });

  const { data: followingCount = 0 } = useQuery({
    queryKey: ["following_count", profileId],
    queryFn: async () => {
      if (!profileId) return 0;
      const { count } = await supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", profileId);
      return count || 0;
    },
    enabled: !!profileId,
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ["is_following", user?.id, targetUserId],
    queryFn: async () => {
      if (!user || !targetUserId || user.id === targetUserId) return false;
      const { data } = await supabase.from("followers").select("id").eq("follower_id", user.id).eq("following_id", targetUserId).single();
      return !!data;
    },
    enabled: !!user && !!targetUserId && user.id !== targetUserId,
  });

  const followUser = useMutation({
    mutationFn: async (followingId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("followers").insert({ follower_id: user.id, following_id: followingId });
      if (error) throw error;
    },
    onMutate: async (followingId) => {
      await qc.cancelQueries({ queryKey: ["follower_count", followingId] });
      await qc.cancelQueries({ queryKey: ["following_count", user?.id] });
      await qc.cancelQueries({ queryKey: ["is_following", user?.id, followingId] });
      const prevFollowerCount = qc.getQueryData<number>(["follower_count", followingId]);
      const prevFollowingCount = qc.getQueryData<number>(["following_count", user?.id]);
      const prevIsFollowing = qc.getQueryData<boolean>(["is_following", user?.id, followingId]);
      qc.setQueryData(["follower_count", followingId], (old: number | undefined) => (old ?? 0) + 1);
      qc.setQueryData(["following_count", user?.id], (old: number | undefined) => (old ?? 0) + 1);
      qc.setQueryData(["is_following", user?.id, followingId], true);
      return { prevFollowerCount, prevFollowingCount, prevIsFollowing, followingId };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      qc.setQueryData(["follower_count", ctx.followingId], ctx.prevFollowerCount);
      qc.setQueryData(["following_count", user?.id], ctx.prevFollowingCount);
      qc.setQueryData(["is_following", user?.id, ctx.followingId], ctx.prevIsFollowing);
    },
    onSettled: (_data, _err, followingId) => {
      qc.invalidateQueries({ queryKey: ["follower_count", followingId] });
      qc.invalidateQueries({ queryKey: ["following_count", user?.id] });
      qc.invalidateQueries({ queryKey: ["is_following", user?.id, followingId] });
      qc.invalidateQueries({ queryKey: ["follow_list"] });
      qc.invalidateQueries({ queryKey: ["my_following_ids", user?.id] });
    },
  });

  const unfollowUser = useMutation({
    mutationFn: async (followingId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", followingId);
      if (error) throw error;
    },
    onMutate: async (followingId) => {
      await qc.cancelQueries({ queryKey: ["follower_count", followingId] });
      await qc.cancelQueries({ queryKey: ["following_count", user?.id] });
      await qc.cancelQueries({ queryKey: ["is_following", user?.id, followingId] });
      const prevFollowerCount = qc.getQueryData<number>(["follower_count", followingId]);
      const prevFollowingCount = qc.getQueryData<number>(["following_count", user?.id]);
      const prevIsFollowing = qc.getQueryData<boolean>(["is_following", user?.id, followingId]);
      qc.setQueryData(["follower_count", followingId], (old: number | undefined) => Math.max((old ?? 0) - 1, 0));
      qc.setQueryData(["following_count", user?.id], (old: number | undefined) => Math.max((old ?? 0) - 1, 0));
      qc.setQueryData(["is_following", user?.id, followingId], false);
      return { prevFollowerCount, prevFollowingCount, prevIsFollowing, followingId };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      qc.setQueryData(["follower_count", ctx.followingId], ctx.prevFollowerCount);
      qc.setQueryData(["following_count", user?.id], ctx.prevFollowingCount);
      qc.setQueryData(["is_following", user?.id, ctx.followingId], ctx.prevIsFollowing);
    },
    onSettled: (_data, _err, followingId) => {
      qc.invalidateQueries({ queryKey: ["follower_count", followingId] });
      qc.invalidateQueries({ queryKey: ["following_count", user?.id] });
      qc.invalidateQueries({ queryKey: ["is_following", user?.id, followingId] });
      qc.invalidateQueries({ queryKey: ["follow_list"] });
      qc.invalidateQueries({ queryKey: ["my_following_ids", user?.id] });
    },
  });

  return { followerCount, followingCount, isFollowing, followUser: followUser.mutate, unfollowUser: unfollowUser.mutate, isToggling: followUser.isPending || unfollowUser.isPending };
}

// ---- Shop ----
export function useShopItems() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: shopItems = [] } = useQuery({
    queryKey: ["shop_items"],
    queryFn: async () => {
      const { data } = await supabase.from("shop_items").select("*").order("price");
      return data || [];
    },
  });

  const purchaseItem = useMutation({
    mutationFn: async ({ itemId, price, itemType, itemValue }: { itemId: string; price: number; itemType: string; itemValue: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Get current coins (shop currency) - NOT leaderboard_points
      const { data: profile } = await supabase.from("profiles").select("coins, leaderboard_points, streak_freezes, title").eq("user_id", user.id).single();
      if (!profile) throw new Error("Profile not found");
      
      // Use coins for purchases, NOT leaderboard_points
      const availableCoins = profile.coins || 0;
      if (availableCoins < price) throw new Error("Not enough coins");

      // Deduct coins only - leaderboard_points and XP stay the same
      await supabase.from("profiles").update({
        coins: availableCoins - price,
        ...(itemType === "streak_freeze" ? { streak_freezes: profile.streak_freezes + parseInt(itemValue) } : {}),
        ...(itemType === "title" ? { title: itemValue } : {}),
      }).eq("user_id", user.id);

      // Record purchase
      await supabase.from("shop_purchases").insert({ user_id: user.id, item_id: itemId, price_paid: price });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      qc.invalidateQueries({ queryKey: ["shop_items"] });
    },
  });

  return { shopItems, purchaseItem: purchaseItem.mutate, isPurchasing: purchaseItem.isPending };
}

// ---- Daily Login ----
export function useDailyLogin() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const claimDaily = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const today = new Date().toISOString().split("T")[0];

      // Check if already claimed today
      const { data: existing } = await supabase.from("daily_logins").select("id").eq("user_id", user.id).eq("login_date", today).single();
      if (existing) return null; // already claimed

      // Get yesterday's login for streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const { data: yesterdayLogin } = await supabase.from("daily_logins").select("streak").eq("user_id", user.id).eq("login_date", yesterdayStr).single();

      let newStreak = yesterdayLogin ? yesterdayLogin.streak + 1 : 1;
      let freezeUsed = false;

      // Auto-use streak freeze if yesterday was missed but streak exists from 2 days ago
      if (!yesterdayLogin) {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const twoAgoStr = twoDaysAgo.toISOString().split("T")[0];
        const { data: twoAgoLogin } = await supabase.from("daily_logins").select("streak").eq("user_id", user.id).eq("login_date", twoAgoStr).single();
        if (twoAgoLogin) {
          const { data: prof } = await supabase.from("profiles").select("streak_freezes").eq("user_id", user.id).single();
          if (prof && prof.streak_freezes > 0) {
            newStreak = twoAgoLogin.streak + 1;
            freezeUsed = true;
            await supabase.from("profiles").update({ streak_freezes: prof.streak_freezes - 1 }).eq("user_id", user.id);
            await supabase.from("notifications").insert({
              user_id: user.id,
              type: "streak_freeze",
              title: "🧊 Streak Freeze Used",
              message: `We saved your streak! ${prof.streak_freezes - 1} freeze${prof.streak_freezes - 1 === 1 ? "" : "s"} left.`,
              icon: "🧊",
            });
          }
        }
      }

      const bonus = getDailyLoginBonus(newStreak);

      await supabase.from("daily_logins").insert({ user_id: user.id, login_date: today, streak: newStreak, points_earned: bonus });

      // Add points to profile (both leaderboard_points for ranking and coins for shop)
      const { data: profile } = await supabase.from("profiles").select("leaderboard_points, coins, lifetime_xp").eq("user_id", user.id).single();
      if (profile) {
        const newPoints = profile.leaderboard_points + bonus;
        const newCoins = (profile.coins || 0) + bonus;
        const newLifetime = ((profile as any).lifetime_xp || 0) + bonus;
        const newLevel = getLevelForPoints(newLifetime);
        await supabase.from("profiles").update({
          leaderboard_points: newPoints,
          coins: newCoins,
          lifetime_xp: newLifetime,
          xp_level: newLevel.level,
          title: newLevel.title,
        } as any).eq("user_id", user.id);
      }

      return { streak: newStreak, bonus, freezeUsed };

    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
      qc.invalidateQueries({ queryKey: ["daily_login", user?.id] });
    },
  });

  const { data: todayLogin } = useQuery({
    queryKey: ["daily_login", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase.from("daily_logins").select("*").eq("user_id", user.id).eq("login_date", today).single();
      return data;
    },
    enabled: !!user,
  });

  return { claimDaily: claimDaily.mutate, todayLogin, isClaiming: claimDaily.isPending };
}
