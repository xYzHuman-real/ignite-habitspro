import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function useFocusRooms() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["focus_rooms"],
    queryFn: async () => {
      const { data } = await supabase
        .from("focus_rooms" as any)
        .select("*")
        .in("status", ["waiting", "active"])
        .order("created_at", { ascending: false });
      return (data || []) as any[];
    },
  });

  // Realtime: refresh on any room or participant change
  useEffect(() => {
    const channel = supabase
      .channel("focus_rooms_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "focus_rooms" }, () => {
        qc.invalidateQueries({ queryKey: ["focus_rooms"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "focus_room_participants" }, () => {
        qc.invalidateQueries({ queryKey: ["focus_room_participants"] });
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [qc]);

  const { data: participants = [] } = useQuery({
    queryKey: ["focus_room_participants"],
    queryFn: async () => {
      const roomIds = rooms.map((r: any) => r.id);
      if (roomIds.length === 0) return [];
      const { data } = await supabase
        .from("focus_room_participants" as any)
        .select("*")
        .in("room_id", roomIds);
      return (data || []) as any[];
    },
    enabled: rooms.length > 0,
  });

  const createRoom = useMutation({
    mutationFn: async ({ name, isPrivate, durationMinutes, breakMinutes }: {
      name: string; isPrivate: boolean; durationMinutes: number; breakMinutes: number;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const invite_code = isPrivate ? generateInviteCode() : null;
      const { data, error } = await supabase.from("focus_rooms" as any).insert({
        name,
        creator_id: user.id,
        is_private: isPrivate,
        invite_code,
        session_duration_minutes: durationMinutes,
        break_duration_minutes: breakMinutes,
      } as any).select().single();
      if (error) throw error;
      // Auto-join creator
      await supabase.from("focus_room_participants" as any).insert({
        room_id: (data as any).id,
        user_id: user.id,
      } as any);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["focus_rooms"] });
      qc.invalidateQueries({ queryKey: ["focus_room_participants"] });
    },
  });

  const joinRoom = useMutation({
    mutationFn: async (roomId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("focus_room_participants" as any).insert({
        room_id: roomId,
        user_id: user.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["focus_room_participants"] });
    },
  });

  const joinByCode = useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error("Not authenticated");
      const { data: room } = await supabase
        .from("focus_rooms" as any)
        .select("id")
        .eq("invite_code", code.toUpperCase())
        .single();
      if (!room) throw new Error("Invalid invite code");
      const { error } = await supabase.from("focus_room_participants" as any).insert({
        room_id: (room as any).id,
        user_id: user.id,
      } as any);
      if (error) throw error;
      return room;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["focus_rooms"] });
      qc.invalidateQueries({ queryKey: ["focus_room_participants"] });
    },
  });

  const leaveRoom = useMutation({
    mutationFn: async (roomId: string) => {
      if (!user) throw new Error("Not authenticated");
      await supabase
        .from("focus_room_participants" as any)
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["focus_room_participants"] });
    },
  });

  const startRoom = useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase
        .from("focus_rooms" as any)
        .update({ status: "active", started_at: new Date().toISOString() } as any)
        .eq("id", roomId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["focus_rooms"] });
    },
  });

  const getParticipantCount = (roomId: string) =>
    participants.filter((p: any) => p.room_id === roomId).length;

  const isJoined = (roomId: string) =>
    participants.some((p: any) => p.room_id === roomId && p.user_id === user?.id);

  return {
    rooms,
    participants,
    isLoading,
    createRoom: createRoom.mutate,
    joinRoom: joinRoom.mutate,
    joinByCode: joinByCode.mutate,
    leaveRoom: leaveRoom.mutate,
    startRoom: startRoom.mutate,
    getParticipantCount,
    isJoined,
  };
}

// Chat hook for focus room messages
export function useFocusRoomChat(roomId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!roomId) { setMessages([]); return; }
    let cancelled = false;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("focus_room_messages" as any)
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);
      if (!cancelled && data) {
        // Fetch display names
        const userIds = [...new Set((data as any[]).map((m: any) => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        const nameMap = new Map((profiles || []).map(p => [p.user_id, p.display_name]));
        setMessages((data as any[]).map((m: any) => ({ ...m, display_name: nameMap.get(m.user_id) || "User" })));
      }
    };
    fetchMessages();

    const channel = supabase
      .channel(`focus_room_chat_${roomId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "focus_room_messages",
        filter: `room_id=eq.${roomId}`,
      }, async (payload) => {
        const msg = payload.new as any;
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", msg.user_id).single();
        if (!cancelled) {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, { ...msg, display_name: profile?.display_name || "User" }];
          });
        }
      })
      .subscribe();

    return () => { cancelled = true; channel.unsubscribe(); };
  }, [roomId]);

  return messages;
}
