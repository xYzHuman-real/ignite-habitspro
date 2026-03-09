import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, Send, UserPlus, Bell, Trash2, Check, X, Flame, Trophy, Target, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePartners } from "@/lib/use-partners";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function NudgeCooldownButton({ partnerId, partnerName, onNudge }: {
  partnerId: string;
  partnerName: string;
  onNudge: (partnerId: string, name: string) => void;
}) {
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(() => {
    const stored = localStorage.getItem(`nudge_cooldown_${partnerId}`);
    if (stored) {
      const end = parseInt(stored, 10);
      if (end > Date.now()) return end;
      localStorage.removeItem(`nudge_cooldown_${partnerId}`);
    }
    return null;
  });
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!cooldownEnd) { setRemaining(0); return; }
    const tick = () => {
      const left = Math.max(0, cooldownEnd - Date.now());
      setRemaining(left);
      if (left <= 0) {
        setCooldownEnd(null);
        localStorage.removeItem(`nudge_cooldown_${partnerId}`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd, partnerId]);

  const handleNudge = () => {
    const end = Date.now() + 60 * 60 * 1000; // 1 hour
    localStorage.setItem(`nudge_cooldown_${partnerId}`, String(end));
    setCooldownEnd(end);
    onNudge(partnerId, partnerName);
  };

  const inCooldown = remaining > 0;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleNudge}
      disabled={inCooldown}
      className="flex-1"
    >
      {inCooldown ? (
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {mins}:{secs.toString().padStart(2, "0")}
        </span>
      ) : (
        "👋 Nudge"
      )}
    </Button>
  );
}

export default function Partners() {
  const navigate = useNavigate();
  const {
    accepted,
    pendingIncoming,
    pendingOutgoing,
    isLoading,
    sendRequest,
    isSending,
    respondRequest,
    removePartner,
    nudgePartner,
  } = usePartners();
  const [username, setUsername] = useState("");

  const handleSend = () => {
    if (!username.trim()) return;
    sendRequest(username.trim(), {
      onSuccess: () => {
        toast.success("Partner request sent!");
        setUsername("");
      },
      onError: (err: Error) => {
        if (err.message === "USER_NOT_FOUND") toast.error("User not found");
        else if (err.message === "ALREADY_EXISTS") toast.error("Partnership already exists");
        else toast.error("Failed to send request");
      },
    });
  };

  const handleNudge = (partnerId: string, name: string) => {
    nudgePartner(
      { partnerId, partnerName: name },
      {
        onSuccess: () => toast.success(`Nudge sent to ${name}! 👋`),
        onError: (err: Error) => {
          if (err.message === "COOLDOWN") {
            toast.error("You can only nudge once per hour. Try again later! ⏳");
          } else {
            toast.error("Failed to send nudge");
          }
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Handshake className="h-8 w-8 text-primary" /> Accountability Partners
        </h1>
        <p className="text-muted-foreground">Team up and stay on track together</p>
      </div>

      {/* Send request */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Add a Partner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter username or display name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button
              onClick={handleSend}
              disabled={isSending || !username.trim()}
              className="bg-gradient-primary text-primary-foreground shrink-0"
            >
              <Send className="h-4 w-4 mr-1" /> Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending incoming */}
      <AnimatePresence>
        {pendingIncoming.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-accent/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Bell className="h-4 w-4 text-accent" /> Incoming Requests
                  <Badge variant="secondary" className="ml-auto">{pendingIncoming.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingIncoming.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-bold">
                        {(p.partner_profile?.display_name || "?")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.partner_profile?.display_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">Wants to be your partner</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => respondRequest({ id: p.id, accept: true })} className="bg-gradient-primary text-primary-foreground">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => respondRequest({ id: p.id, accept: false })}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending outgoing */}
      {pendingOutgoing.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Pending Sent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingOutgoing.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs">{(p.partner_profile?.display_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm truncate">{p.partner_profile?.display_name || "Unknown"}</span>
                <Badge variant="outline" className="text-muted-foreground">Pending</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active partners */}
      <div>
        <h2 className="text-lg font-display font-semibold mb-3 flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" /> Your Partners
          {accepted.length > 0 && <Badge variant="secondary">{accepted.length}</Badge>}
        </h2>

        {accepted.length === 0 ? (
          <Card className="p-8 text-center">
            <Handshake className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No partners yet. Send a request above to get started!</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {accepted.map((p, i) => {
              const profile = p.partner_profile;
              const name = profile?.display_name || "Partner";
              const partnerId = profile?.user_id || "";
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-lg">
                            {name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display font-semibold text-lg">{name}</h3>
                            <Badge variant="outline" className="text-xs">
                              🤝 Shared Streak: {p.shared_streak}
                            </Badge>
                          </div>
                          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Flame className="h-3.5 w-3.5 text-primary" /> {profile?.total_streak || 0} streak
                            </span>
                            <span className="flex items-center gap-1">
                              <Trophy className="h-3.5 w-3.5 text-accent" /> {profile?.leaderboard_points || 0} pts
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="h-3.5 w-3.5" /> {profile?.habits_completed || 0} done
                            </span>
                          </div>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <div className="flex gap-2">
                        <NudgeCooldownButton
                          partnerId={partnerId}
                          partnerName={name}
                          onNudge={handleNudge}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removePartner(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
