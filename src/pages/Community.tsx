import { useState } from "react";
import { motion } from "framer-motion";
import { Users, MessageCircle, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCommunityGroups } from "@/lib/supabase-hooks";
import { Skeleton } from "@/components/ui/skeleton";

export default function Community() {
  const { groups, memberships, joinGroup, leaveGroup } = useCommunityGroups();
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Record<string, { text: string; time: string }[]>>({});
  const [newMessage, setNewMessage] = useState("");

  const chatGroup = groups.find((g) => g.id === chatGroupId);

  const sendMessage = () => {
    if (!newMessage.trim() || !chatGroupId) return;
    setLocalMessages((prev) => ({
      ...prev,
      [chatGroupId]: [...(prev[chatGroupId] || []), { text: newMessage, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }],
    }));
    setNewMessage("");
  };

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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Community</h1>
        <p className="text-muted-foreground">Join groups and stay accountable together</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {groups.map((group, i) => {
          const joined = memberships.includes(group.id);
          return (
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
        })}
      </div>

      <Dialog open={!!chatGroupId} onOpenChange={(open) => !open && setChatGroupId(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {chatGroup?.icon} {chatGroup?.name}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0 max-h-[50vh] pr-3">
            <div className="space-y-3 py-2">
              {(localMessages[chatGroupId || ""] || []).map((msg, i) => (
                <div key={i} className="flex gap-2 flex-row-reverse">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">You</AvatarFallback>
                  </Avatar>
                  <div className="max-w-[70%] text-right">
                    <span className="text-xs text-muted-foreground">{msg.time}</span>
                    <div className="rounded-2xl px-3 py-2 text-sm bg-gradient-primary text-primary-foreground rounded-tr-sm">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
              {(!localMessages[chatGroupId || ""] || localMessages[chatGroupId || ""].length === 0) && (
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
