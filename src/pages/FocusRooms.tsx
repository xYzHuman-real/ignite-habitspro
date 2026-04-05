import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Lock, Unlock, Play, LogOut, Clock, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useFocusRooms } from "@/lib/use-focus-rooms";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { PageTransition } from "@/components/PageTransition";
import { ActiveFocusRoom } from "@/components/focus-room/ActiveFocusRoom";

export default function FocusRooms() {
  const { user } = useAuth();
  const { rooms, participants, createRoom, joinRoom, joinByCode, leaveRoom, startRoom, getParticipantCount, isJoined } = useFocusRooms();

  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [duration, setDuration] = useState(50);
  const [breakDur, setBreakDur] = useState(10);
  const [inviteCode, setInviteCode] = useState("");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const activeRoom = rooms.find((r: any) => r.id === activeRoomId);

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

        {/* Full-screen Active Room */}
        <AnimatePresence>
          {activeRoomId && activeRoom && (
            <ActiveFocusRoom
              room={activeRoom}
              participants={participants}
              participantCount={getParticipantCount(activeRoom.id)}
              onLeave={() => { leaveRoom(activeRoom.id); setActiveRoomId(null); }}
              onClose={() => setActiveRoomId(null)}
            />
          )}
        </AnimatePresence>

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
