import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function usePartners() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // All partnerships (pending + accepted) with profile info
  const { data: partnerships = [], isLoading } = useQuery({
    queryKey: ["partnerships", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("accountability_partners")
        .select("*")
        .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`);
      if (!data || data.length === 0) return [];

      // Collect partner user ids + own profile for shared streak derivation
      const partnerIds = data.map((p) =>
        p.requester_id === user.id ? p.partner_id : p.requester_id
      );
      const profilesRes = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, total_streak, leaderboard_points, habits_completed, show_avatar, show_stats")
        .in("user_id", partnerIds);
      const profiles = profilesRes.data || [];

      // Compute shared streaks via RPC (server-side: both partners had habit OR focus activity each day)
      const sharedStreaks = await Promise.all(
        partnerIds.map(async (pid) => {
          const { data: streak } = await supabase.rpc("get_shared_streak", {
            user_a: user.id,
            user_b: pid,
          });
          return { pid, streak: (streak as number | null) ?? 0 };
        })
      );

      return data.map((p) => {
        const partnerId = p.requester_id === user.id ? p.partner_id : p.requester_id;
        const profile = profiles.find((pr) => pr.user_id === partnerId);
        const shared = sharedStreaks.find((s) => s.pid === partnerId)?.streak ?? 0;
        return { ...p, partner_profile: profile, is_requester: p.requester_id === user.id, shared_streak: shared };
      });
    },
    enabled: !!user,
  });


  const sendRequest = useMutation({
    mutationFn: async (partnerUsername: string) => {
      if (!user) throw new Error("Not authenticated");
      // Find user by username or display_name
      const { data: target } = await supabase
        .from("profiles")
        .select("user_id")
        .or(`username.ilike.${partnerUsername},display_name.ilike.${partnerUsername}`)
        .neq("user_id", user.id)
        .limit(1)
        .single();
      if (!target) throw new Error("USER_NOT_FOUND");

      // Check if partnership already exists
      const existing = partnerships.find(
        (p) =>
          (p.requester_id === user.id && p.partner_id === target.user_id) ||
          (p.partner_id === user.id && p.requester_id === target.user_id)
      );
      if (existing) throw new Error("ALREADY_EXISTS");

      const { error } = await supabase.from("accountability_partners").insert({
        requester_id: user.id,
        partner_id: target.user_id,
      });
      if (error) throw error;

      // Send notification
      await supabase.from("notifications").insert({
        user_id: target.user_id,
        type: "partner_request",
        title: "🤝 Partner Request",
        message: `Someone wants to be your accountability partner!`,
        icon: "🤝",
        action_url: "/partners",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partnerships", user?.id] }),
  });

  const respondRequest = useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      if (accept) {
        const { error } = await supabase
          .from("accountability_partners")
          .update({ status: "accepted" })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("accountability_partners")
          .delete()
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partnerships", user?.id] }),
  });

  const removePartner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accountability_partners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partnerships", user?.id] }),
  });

  const nudgePartner = useMutation({
    mutationFn: async ({ partnerId, partnerName }: { partnerId: string; partnerName: string }) => {
      if (!user) throw new Error("Not authenticated");

      // 1-hour cooldown: check last nudge sent to this partner
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data: recentNudges } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", partnerId)
        .eq("type", "nudge")
        .gte("created_at", oneHourAgo)
        .limit(1);

      if (recentNudges && recentNudges.length > 0) {
        throw new Error("COOLDOWN");
      }

      // Get sender's display name
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();
      const senderName = senderProfile?.display_name || "Your partner";

      const title = "👋 Nudge!";
      const message = `${senderName} nudged you — don't break your streak!`;

      // Insert in-app notification
      await supabase.from("notifications").insert({
        user_id: partnerId,
        type: "nudge",
        title,
        message,
        icon: "👋",
        action_url: "/habits",
      });

      // Send push notification
      try {
        await supabase.functions.invoke("send-push", {
          body: {
            user_id: partnerId,
            title,
            body: message,
            data: { action_url: "/habits" },
          },
        });
      } catch (e) {
        console.error("Failed to send push for nudge:", e);
      }
    },
    onSuccess: () => {},
  });

  const accepted = partnerships.filter((p) => p.status === "accepted");
  const pendingIncoming = partnerships.filter(
    (p) => p.status === "pending" && !p.is_requester
  );
  const pendingOutgoing = partnerships.filter(
    (p) => p.status === "pending" && p.is_requester
  );

  return {
    accepted,
    pendingIncoming,
    pendingOutgoing,
    isLoading,
    sendRequest: sendRequest.mutate,
    isSending: sendRequest.isPending,
    sendError: sendRequest.error,
    respondRequest: respondRequest.mutate,
    removePartner: removePartner.mutate,
    nudgePartner: nudgePartner.mutate,
  };
}
