import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, MessageCircle, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { type CommunityGroup, communityGroups as initialGroups } from "@/lib/store";

interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  isMe: boolean;
}

const mockMessages: Record<string, ChatMessage[]> = {
  "1": [
    { id: "1", user: "Sarah C.", avatar: "SC", text: "Good morning everyone! Just finished my 5am run 🏃", time: "6:12 AM", isMe: false },
    { id: "2", user: "You", avatar: "AJ", text: "Amazing! I just completed my meditation session 🧘", time: "6:15 AM", isMe: true },
    { id: "3", user: "Jordan L.", avatar: "JL", text: "Love the energy! Keep it up team 💪", time: "6:20 AM", isMe: false },
    { id: "4", user: "Maya P.", avatar: "MP", text: "Day 48 of waking up at 5am! Who's with me?", time: "6:25 AM", isMe: false },
  ],
  "2": [
    { id: "1", user: "Alex R.", avatar: "AR", text: "Just hit a new PR on deadlifts! 🎉", time: "7:00 AM", isMe: false },
    { id: "2", user: "You", avatar: "AJ", text: "Congrats! What's your routine looking like?", time: "7:05 AM", isMe: true },
    { id: "3", user: "Chris W.", avatar: "CW", text: "Anyone doing the 30-day pushup challenge?", time: "7:15 AM", isMe: false },
  ],
  "5": [
    { id: "1", user: "Emma D.", avatar: "ED", text: "Reminder: drink your water! 💧", time: "9:00 AM", isMe: false },
    { id: "2", user: "You", avatar: "AJ", text: "Already on glass #3! 🥤", time: "9:10 AM", isMe: true },
  ],
};

export default function Community() {
  const [groups, setGroups] = useState<CommunityGroup[]>(initialGroups);
  const [chatGroup, setChatGroup] = useState<CommunityGroup | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(mockMessages);
  const [newMessage, setNewMessage] = useState("");

  const toggleJoin = (id: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, joined: !g.joined, members: g.joined ? g.members - 1 : g.members + 1 } : g
      )
    );
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !chatGroup) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      user: "You",
      avatar: "AJ",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isMe: true,
    };
    setMessages((prev) => ({
      ...prev,
      [chatGroup.id]: [...(prev[chatGroup.id] || []), msg],
    }));
    setNewMessage("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Community</h1>
        <p className="text-muted-foreground">Join groups and stay accountable together</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {groups.map((group, i) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={`p-5 space-y-3 ${group.joined ? "border-primary/30" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{group.icon}</span>
                  <div>
                    <h3 className="font-display font-semibold">{group.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {group.members.toLocaleString()} members
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{group.description}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className={group.joined ? "" : "bg-gradient-primary text-primary-foreground"}
                  variant={group.joined ? "outline" : "default"}
                  onClick={() => toggleJoin(group.id)}
                >
                  {group.joined ? "Leave" : "Join"}
                </Button>
                {group.joined && (
                  <Button size="sm" variant="ghost" onClick={() => setChatGroup(group)}>
                    <MessageCircle className="h-4 w-4 mr-1" /> Chat
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={!!chatGroup} onOpenChange={(open) => !open && setChatGroup(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {chatGroup?.icon} {chatGroup?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 max-h-[50vh] pr-3">
            <div className="space-y-3 py-2">
              {(messages[chatGroup?.id || ""] || []).map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.isMe ? "flex-row-reverse" : ""}`}>
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className={`text-xs ${msg.isMe ? "bg-gradient-primary text-primary-foreground" : "bg-muted"}`}>
                      {msg.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[70%] ${msg.isMe ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      {!msg.isMe && <span className="text-xs font-medium">{msg.user}</span>}
                      <span className="text-xs text-muted-foreground">{msg.time}</span>
                    </div>
                    <div className={`rounded-2xl px-3 py-2 text-sm ${
                      msg.isMe
                        ? "bg-gradient-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {(!messages[chatGroup?.id || ""] || messages[chatGroup?.id || ""].length === 0) && (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No messages yet. Start the conversation! 💬
                </p>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2 pt-2 border-t">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button onClick={sendMessage} size="icon" className="bg-gradient-primary text-primary-foreground shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
