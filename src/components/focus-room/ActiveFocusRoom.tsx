import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Send, Coffee, Flame, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useFocusRoomChat } from "@/lib/use-focus-rooms";

interface ActiveFocusRoomProps {
  room: any;
  participants: any[];
  participantCount: number;
  onLeave: () => void;
  onClose: () => void;
}

export function ActiveFocusRoom({ room, participants, participantCount, onLeave, onClose }: ActiveFocusRoomProps) {
  const { user } = useAuth();
  const chatMessages = useFocusRoomChat(room.id);
  const [chatMsg, setChatMsg] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Set dark background on root while focus room is active (covers status-bar area on native)
  useEffect(() => {
    const prevHtml = document.documentElement.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    const dark = "hsl(222 30% 6%)";
    document.documentElement.style.backgroundColor = dark;
    document.body.style.backgroundColor = dark;
    return () => {
      document.documentElement.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
    };
  }, []);

  // Timer logic — auto-cycles between focus and break
  useEffect(() => {
    if (!room || room.status !== "active" || !room.started_at) {
      setTimeLeft(null);
      setIsOnBreak(false);
      setCycleCount(0);
      return;
    }
    const focusSec = room.session_duration_minutes * 60;
    const breakSec = (room.break_duration_minutes || 0) * 60;
    const cycleSec = focusSec + breakSec;

    const tick = () => {
      const elapsed = (Date.now() - new Date(room.started_at).getTime()) / 1000;
      if (breakSec > 0) {
        const cyclePos = elapsed % cycleSec;
        const cycle = Math.floor(elapsed / cycleSec);
        setCycleCount(cycle);
        if (cyclePos < focusSec) {
          setIsOnBreak(false);
          setTimeLeft(Math.max(0, Math.round(focusSec - cyclePos)));
        } else {
          setIsOnBreak(true);
          setTimeLeft(Math.max(0, Math.round(cycleSec - cyclePos)));
        }
      } else {
        setIsOnBreak(false);
        setTimeLeft(Math.max(0, Math.round(focusSec - elapsed)));
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [room]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  const phaseSeconds = isOnBreak
    ? (room.break_duration_minutes || 0) * 60
    : room.session_duration_minutes * 60;
  const totalSeconds = phaseSeconds;
  const progress = timeLeft !== null && phaseSeconds > 0 ? (phaseSeconds - timeLeft) / phaseSeconds : 0;
  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;

  // SVG circle params
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const sendChat = async () => {
    if (!chatMsg.trim() || !room.id || !user) return;
    const text = chatMsg.trim();
    setChatMsg("");
    await supabase.from("focus_room_messages" as any).insert({
      room_id: room.id,
      user_id: user.id,
      message: text,
    } as any);
  };

  // Participant display names
  const participantProfiles = participants.filter((p: any) => p.room_id === room.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{
        background: "linear-gradient(160deg, hsl(222 30% 6%) 0%, hsl(240 25% 12%) 50%, hsl(222 30% 8%) 100%)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, hsl(220 80% 60%), transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-40 opacity-[0.05]"
          style={{ background: "linear-gradient(to top, hsl(260 60% 50%), transparent)" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-3">
        <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 backdrop-blur-sm">
          <ArrowLeft className="h-5 w-5 text-white/80" />
        </button>
        <div className="text-center flex-1 mx-3">
          <h2 className="text-white font-display font-semibold text-base truncate">{room.name}</h2>
          <p className="text-white/40 text-xs flex items-center justify-center gap-1">
            <Users className="h-3 w-3" /> {participantCount} focusing together
          </p>
        </div>
        <button onClick={onLeave} className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 backdrop-blur-sm">
          <X className="h-5 w-5 text-red-400/80" />
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center overflow-hidden">
        {/* Timer Section */}
        {!isOnBreak ? (
          <div className="flex flex-col items-center pt-4 pb-2">
            <p className="text-white/40 text-xs tracking-widest uppercase mb-4">Time Remaining</p>
            
            {/* Circular Timer */}
            <div className="relative w-[272px] h-[272px] flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 272 272">
                {/* Background ring */}
                <circle cx="136" cy="136" r={radius} fill="none" stroke="hsla(220, 50%, 30%, 0.2)" strokeWidth="6" />
                {/* Progress ring */}
                <circle
                  cx="136" cy="136" r={radius}
                  fill="none"
                  stroke="url(#timerGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(220, 80%, 60%)" />
                    <stop offset="100%" stopColor="hsl(260, 70%, 60%)" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Inner glow */}
              <div className="absolute inset-4 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, hsl(220 80% 60%) 0%, transparent 70%)" }} />

              {/* Time display */}
              <div className="relative text-center">
                <p className="text-5xl font-display font-bold text-white tabular-nums tracking-tight">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </p>
                {room.status === "waiting" ? (
                  <p className="text-white/30 text-xs mt-1">Waiting to start</p>
                ) : (
                  <p className="text-white/30 text-xs mt-1">Focus Session</p>
                )}
              </div>
            </div>

            {/* Motivational text */}
            <p className="text-white/25 text-xs mt-3 italic">Stay focused, you're doing great ✨</p>
          </div>
        ) : (
          /* Break Mode */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center pt-8 pb-4"
          >
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-3">
              <Coffee className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="text-white font-display font-bold text-xl">Break Time!</h3>
            <p className="text-white/40 text-sm mt-1">Chat with your focus partners</p>
            <div className="mt-4 flex items-center gap-3 px-6 py-2 rounded-xl bg-white/5">
              <div className="text-center">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Focus</p>
                <p className="text-white font-display font-semibold">{room.session_duration_minutes}m</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Break</p>
                <p className="text-white font-display font-semibold">{room.break_duration_minutes}m</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Score</p>
                <p className="text-white font-display font-semibold flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-primary" /> 100%
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Participants */}
        <div className="flex items-center gap-1.5 py-2">
          {participantProfiles.slice(0, 5).map((p: any, i: number) => (
            <div key={p.id} className="relative">
              <Avatar className="w-8 h-8 border-2 border-white/10">
                <AvatarFallback className="text-[10px] bg-white/10 text-white/60 font-medium">
                  {p.user_id === user?.id ? "You" : `U${i + 1}`}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-400 border-2"
                style={{ borderColor: "hsl(222, 30%, 8%)" }} />
            </div>
          ))}
          {participantCount > 5 && (
            <span className="text-white/30 text-xs ml-1">+{participantCount - 5}</span>
          )}
        </div>

        {/* Session progress */}
        <div className="w-full max-w-xs px-6 mt-2">
          <div className="flex items-center justify-between text-[10px] text-white/30 mb-1.5">
            <span>Session Progress</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(220 80% 60%), hsl(260 70% 60%))" }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
          {room.break_duration_minutes && !isOnBreak && room.status === "active" && (
            <p className="text-white/20 text-[10px] mt-1.5 text-center">
              Next break in {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
            </p>
          )}
        </div>

        {/* Chat Section */}
        <div className="w-full flex-1 flex flex-col mt-4 min-h-0">
          <div className="px-4 mb-2">
            <div className="h-px bg-white/5" />
          </div>
          
          <ScrollArea className="flex-1 px-4 min-h-0" ref={scrollRef as any}>
            <div className="space-y-2.5 py-1">
              {chatMessages.length === 0 && (
                <p className="text-center text-white/20 text-xs py-6">
                  {isOnBreak ? "Break time — say hi! 👋" : "💬 Chat available during break time"}
                </p>
              )}
              {chatMessages.map((msg: any) => {
                const isMe = msg.user_id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="w-6 h-6 shrink-0">
                      <AvatarFallback className={`text-[9px] ${isMe ? "bg-blue-500/30 text-blue-300" : "bg-white/10 text-white/50"}`}>
                        {(msg.display_name || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`rounded-2xl px-3 py-1.5 text-sm max-w-[70%] ${
                      isMe
                        ? "bg-blue-500/20 text-blue-100 rounded-tr-sm"
                        : "bg-white/5 text-white/70 rounded-tl-sm"
                    }`}>
                      {msg.message}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Chat input */}
          <div className="px-4 pb-3 pt-2">
            <div className="flex gap-2">
              <Input
                placeholder={isOnBreak ? "Say something..." : "Chat during break"}
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                disabled={!isOnBreak}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-blue-500/30 rounded-xl"
              />
              <Button
                onClick={sendChat}
                size="icon"
                disabled={!isOnBreak}
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 shrink-0 rounded-xl disabled:opacity-30"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
