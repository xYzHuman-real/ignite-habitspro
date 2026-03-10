import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Lock, Unlock, Play, LogOut, Send, Clock, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFocusRooms, useFocusRoomChat } from "@/lib/use-focus-rooms";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PageTransition } from "@/components/PageTransition";

export default function FocusRooms() {
  const { user } = useAuth();
  const { rooms, createRoom, joinRoom, joinByCode, leaveRoom, startRoom, getParticipantCount, isJoined } = useFocusRooms();

  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [duration, setDuration] = useState(50);
  const [breakDur, setBreakDur] = useState(10);
  const [inviteCode, setInviteCode] = useState("");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const activeRoom = rooms.find((r: any) => r.id === activeRoomId);
  const chatMessages = useFocusRoomChat(activeRoomId);
  const [chatMsg, setChatMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  const handleCreate = () => {
    if (!roomName.trim()) return;
    createRoom({ name: roomName.trim(), isPrivate, durationMinutes: duration, breakMinutes: breakDur });
    setShowCreate(false);
    setRoomName("");
    toast.success("Room created!");
  };

  const handleJoinByCode = () => {
    if (!inviteCode.trim()) return;
    joinByCode(inviteCode.trim(), {
      onSuccess: () => { toast.success("Joined room!"); setInviteCode(""); },
      onError: () => toast.error("Invalid invite code"),
    } as any);
  };

  const sendChat = async () => {
    if (!chatMsg.trim() || !activeRoomId || !user) return;
    const text = chatMsg.trim();
    setChatMsg("");
    await supabase.from("focus_room_messages" as any).insert({
      room_id: activeRoomId,
      user_id: user.id,
      message: text,
    } as any);
  };

  // Timer for active room
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== "active" || !activeRoom.started_at) {
      setTimeLeft(null); return;
    }
    const tick = () => {
      const elapsed = (Date.now() - new Date(activeRoom.started_at).getTime()) / 1000;
      const total = activeRoom.session_duration_minutes * 60;
      setTimeLeft(Math.max(0, Math.round(total - elapsed)));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [activeRoom]);

  const isOnBreak = activeRoom?.status === "active" && timeLeft !== null && timeLeft <= 0;

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Focus Rooms</h1>
            <p className="text-muted-foreground">Study together, stay focused</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-1" /> Create
          </Button>
        </div>

        {/* Join by code */}
        <Card className="p-4">
          <p className="text-sm font-medium mb-2">Join Private Room</p>
          <div className="flex gap-2">
            <Input placeholder="Enter invite code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="uppercase" />
            <Button variant="outline" onClick={handleJoinByCode}>Join</Button>
          </div>
        </Card>

        {/* Room list */}
        <div className="grid sm:grid-cols-2 gap-4">
          {rooms.filter((r: any) => !r.is_private || isJoined(r.id)).map((room: any, i: number) => (
            <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`p-5 space-y-3 ${isJoined(room.id) ? "border-primary/30" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {room.is_private ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                    <h3 className="font-display font-semibold">{room.name}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${room.status === "active" ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                    {room.status === "active" ? "🔴 Live" : "Waiting"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {getParticipantCount(room.id)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {room.session_duration_minutes}m</span>
                </div>
                {room.is_private && room.invite_code && isJoined(room.id) && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(room.invite_code); toast.success("Copied!"); }}
                    className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
                  >
                    <Copy className="h-3 w-3" /> Code: {room.invite_code}
                  </button>
                )}
                <div className="flex gap-2">
                  {!isJoined(room.id) ? (
                    <Button size="sm" className="bg-gradient-primary text-primary-foreground" onClick={() => joinRoom(room.id)}>Join</Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setActiveRoomId(room.id)}>
                        <Play className="h-3.5 w-3.5 mr-1" /> Open
                      </Button>
                      {room.creator_id === user?.id && room.status === "waiting" && (
                        <Button size="sm" className="bg-gradient-success text-success-foreground" onClick={() => startRoom(room.id)}>Start</Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => leaveRoom(room.id)}>
                        <LogOut className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
          {rooms.length === 0 && (
            <Card className="p-8 text-center col-span-2">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No focus rooms yet. Create one to get started!</p>
            </Card>
          )}
        </div>

        {/* Active Room Dialog */}
        <Dialog open={!!activeRoomId} onOpenChange={open => !open && setActiveRoomId(null)}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-display">{activeRoom?.name}</DialogTitle>
            </DialogHeader>
            {activeRoom?.status === "active" && timeLeft !== null && !isOnBreak && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">Time Remaining</p>
                <p className="text-4xl font-display font-bold tabular-nums text-primary">
                  {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{getParticipantCount(activeRoom.id)} focusing together</p>
              </div>
            )}
            {activeRoom?.status === "waiting" && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Waiting for the host to start the session...</p>
                <p className="text-sm text-muted-foreground mt-1">{getParticipantCount(activeRoom.id)} participants ready</p>
              </div>
            )}
            {isOnBreak && (
              <div className="text-center py-4">
                <p className="text-2xl">☕</p>
                <p className="font-display font-semibold text-lg mt-1">Break Time!</p>
                <p className="text-sm text-muted-foreground">Chat with your focus partners</p>
              </div>
            )}
            {/* Chat (available during break) */}
            <ScrollArea className="flex-1 min-h-0 max-h-[40vh] pr-3" ref={scrollRef as any}>
              <div className="space-y-3 py-2">
                {chatMessages.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    {isOnBreak ? "Break time — say hi! 👋" : "Chat available during break time"}
                  </p>
                )}
                {chatMessages.map((msg: any) => {
                  const isMe = msg.user_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                      <Avatar className="w-7 h-7 shrink-0">
                        <AvatarFallback className={`text-xs ${isMe ? "bg-gradient-primary text-primary-foreground" : "bg-muted"}`}>
                          {(msg.display_name || "U")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`rounded-2xl px-3 py-1.5 text-sm max-w-[70%] ${isMe ? "bg-gradient-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="flex gap-2 pt-2 border-t">
              <Input
                placeholder={isOnBreak ? "Say something..." : "Chat during break"}
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                disabled={!isOnBreak}
              />
              <Button onClick={sendChat} size="icon" disabled={!isOnBreak} className="bg-gradient-primary text-primary-foreground shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Room Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Create Focus Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Room Name</Label>
                <Input placeholder="Study Session" value={roomName} onChange={e => setRoomName(e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Private Room</Label>
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
              </div>
              <div>
                <Label>Focus Duration (minutes)</Label>
                <div className="flex gap-2 mt-1">
                  {[25, 50, 60, 90].map(d => (
                    <Button key={d} size="sm" variant={duration === d ? "default" : "outline"} onClick={() => setDuration(d)}
                      className={duration === d ? "bg-gradient-primary text-primary-foreground" : ""}>
                      {d}m
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Break Duration (minutes)</Label>
                <div className="flex gap-2 mt-1">
                  {[5, 10, 15].map(d => (
                    <Button key={d} size="sm" variant={breakDur === d ? "default" : "outline"} onClick={() => setBreakDur(d)}
                      className={breakDur === d ? "bg-gradient-primary text-primary-foreground" : ""}>
                      {d}m
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full bg-gradient-primary text-primary-foreground">Create Room</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
