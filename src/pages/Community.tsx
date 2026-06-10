import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Users, MessageCircle, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCommunityGroups } from "@/lib/supabase-hooks";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import PageHero from "@/components/PageHero";

interface ChatMessage {
  id: string;
  message: string;
  user_id: string;
  created_at: string;
  display_name?: string;
}

function useChatMessages(groupId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      setLoading(true);
      const { data } = await supabase
        .from("community_messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (cancelled) return;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((m) => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);

        const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name]));

        if (!cancelled) {
          setMessages(
            data.map((m) => ({
              ...m,
              display_name: profileMap.get(m.user_id) || "User",
            }))
          );
        }
      } else {
        if (!cancelled) setMessages([]);
      }
      if (!cancelled) setLoading(false);
    }

    loadMessages();

    const channel = supabase
      .channel(`community-chat:${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_messages",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", newMsg.user_id)
            .single();

          if (!cancelled) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [
                ...prev,
                { ...newMsg, display_name: profile?.display_name || "User" },
              ];
            });
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [groupId]);

  return { messages, loading };
}

export default function Community() {
  const { user } = useAuth();
  const { groups, memberships, joinGroup, leaveGroup } = useCommunityGroups();
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("join");
  const { messages, loading: messagesLoading } = useChatMessages(chatGroupId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatGroup = groups.find((g) => g.id === chatGroupId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatGroupId || !user) return;
    const text = newMessage.trim();
    setNewMessage("");
    await supabase.from("community_messages").insert({
      group_id: chatGroupId,
      user_id: user.id,
      message: text,
    });
  };

  const joinedGroups = groups.filter((g) => memberships.includes(g.id));
  const availableGroups = groups.filter((g) => !memberships.includes(g.id));

  if (groups.length === 0) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-12 w-48" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  const renderGroupCard = (group: typeof groups[0], joined: boolean, i: number) => (
    <motion.div key={group.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
      <Card className={`p-5 space-y-3 ${joined ? "border-primary/30" : ""}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{group.icon}</span>
            <div>
              <h3 className="font-display font-semibold">{group.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" /> {group.member_count.toLocaleString()} members
              </p>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{group.description}</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            className={joined ? "" : "bg-gradient-primary text-primary-foreground"}
            variant={joined ? "outline" : "default"}
            onClick={() => joined ? leaveGroup(group.id) : joinGroup(group.id)}
          >
            {joined ? "Leave" : "Join"}
          </Button>
          {joined && (
            <Button size="sm" variant="ghost" onClick={() => setChatGroupId(group.id)}>
              <MessageCircle className="h-4 w-4 mr-1" /> Chat
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHero
        eyebrow="Stay Accountable"
        title="Community"
        subtitle="Join groups and grow together"
        icon={Users}
        stats={[
          { icon: Users, label: "Groups", value: groups.length },
          { icon: MessageCircle, label: "Joined", value: joinedGroups.length },
          { icon: Send, label: "Available", value: availableGroups.length },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="join" className="flex-1">Join ({availableGroups.length})</TabsTrigger>
          <TabsTrigger value="joined" className="flex-1">Joined ({joinedGroups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="join" className="mt-4">
          {availableGroups.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">You've joined all available communities!</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {availableGroups.map((group, i) => renderGroupCard(group, false, i))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="joined" className="mt-4">
          {joinedGroups.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">You haven't joined any communities yet. Browse the "Join" tab!</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {joinedGroups.map((group, i) => renderGroupCard(group, true, i))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!chatGroupId} onOpenChange={(open) => !open && setChatGroupId(null)}>
        <DialogContent className="sm:max-w-lg w-full h-[100dvh] sm:h-[85vh] max-h-[100dvh] sm:max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader
            className="px-4 py-2.5 border-b shrink-0"
            style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
          >
            <DialogTitle className="font-display flex items-center gap-2 text-base">
              <span className="text-xl leading-none">{chatGroup?.icon}</span>
              <span className="truncate">{chatGroup?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 px-3" ref={scrollRef}>
            <div className="space-y-1.5 py-2">
              {messagesLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                </div>
              )}
              {!messagesLoading && messages.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No messages yet. Start the conversation! 💬
                </p>
              )}
              {messages.map((msg, idx) => {
                const isMe = msg.user_id === user?.id;
                const prev = messages[idx - 1];
                const showAvatar = !prev || prev.user_id !== msg.user_id;
                return (
                  <div key={msg.id} className={`flex gap-1.5 items-end ${isMe ? "flex-row-reverse" : ""}`}>
                    <div className="w-6 shrink-0">
                      {showAvatar && (
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className={`text-[10px] ${isMe ? "bg-gradient-primary text-primary-foreground" : "bg-muted"}`}>
                            {(msg.display_name || "U")[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <div className={`max-w-[78%] ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      {showAvatar && !isMe && (
                        <span className="text-[10px] text-muted-foreground px-2 mb-0.5">{msg.display_name}</span>
                      )}
                      <div
                        className={`rounded-2xl px-3 py-1.5 text-sm leading-snug break-words ${
                          isMe
                            ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[9px] text-muted-foreground px-2 mt-0.5">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <div
            className="flex gap-2 px-3 py-2 border-t bg-background shrink-0"
            style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
          >
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="h-9"
            />
            <Button onClick={sendMessage} size="icon" className="h-9 w-9 bg-gradient-primary text-primary-foreground shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
