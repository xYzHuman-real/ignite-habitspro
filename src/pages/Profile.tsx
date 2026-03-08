import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Flame, Target, UserPlus, Users, Edit3, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/lib/store";

export default function Profile() {
  const { profile: p, updateProfile } = useProfile();
  const [editing, setEditing] = useState(!p.name);
  const [form, setForm] = useState({ name: p.name, username: p.username, bio: p.bio });

  const saveProfile = () => {
    if (!form.name.trim()) return;
    const initials = form.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    updateProfile({ ...form, avatar: initials });
    setEditing(false);
  };

  const avatarText = p.avatar || "?";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6">
          {editing ? (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl">Set Up Your Profile</h2>
              <Input placeholder="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="@username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              <Textarea placeholder="Write a short bio..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={2} />
              <Button onClick={saveProfile} className="bg-gradient-primary text-primary-foreground">
                <Check className="h-4 w-4 mr-1" /> Save Profile
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <Avatar className="w-24 h-24 border-4 border-primary shadow-glow-primary">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground font-display text-2xl font-bold">
                    {avatarText}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left flex-1">
                  <h1 className="text-2xl font-display font-bold">{p.name}</h1>
                  <p className="text-muted-foreground text-sm">{p.username || "No username set"}</p>
                  <p className="text-sm mt-1">{p.bio || "No bio yet"}</p>
                  <div className="flex gap-4 mt-3 justify-center sm:justify-start">
                    <Button size="sm" variant="outline" onClick={() => { setForm({ name: p.name, username: p.username, bio: p.bio }); setEditing(true); }}>
                      <Edit3 className="h-4 w-4 mr-1" /> Edit Profile
                    </Button>
                    <Button size="sm" className="bg-gradient-primary text-primary-foreground">
                      <UserPlus className="h-4 w-4 mr-1" /> Follow
                    </Button>
                    <Button size="sm" variant="outline">
                      <Users className="h-4 w-4 mr-1" /> Message
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-5" />

              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-display font-bold">{p.followers}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{p.following}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold flex items-center justify-center gap-1">
                    {p.totalStreak} <Flame className="h-5 w-5 text-primary" />
                  </p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{p.habitsCompleted}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {!editing && p.badges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5">
            <h2 className="font-display font-semibold text-lg mb-3">Badges</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {p.badges.map((badge) => (
                <div key={badge.name} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <span className="text-2xl">{badge.icon}</span>
                  <span className="text-xs text-center text-muted-foreground">{badge.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {!editing && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5">
            <h2 className="font-display font-semibold text-lg mb-3">Activity</h2>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 49 }).map((_, i) => {
                const intensity = Math.random();
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-sm ${
                      intensity > 0.8 ? "bg-gradient-primary" :
                      intensity > 0.5 ? "bg-primary/60" :
                      intensity > 0.2 ? "bg-primary/30" :
                      "bg-muted"
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Joined {p.joinDate}</span>
              <div className="flex items-center gap-1">
                Less <div className="w-3 h-3 rounded-sm bg-muted" /> <div className="w-3 h-3 rounded-sm bg-primary/30" /> <div className="w-3 h-3 rounded-sm bg-primary/60" /> <div className="w-3 h-3 rounded-sm bg-gradient-primary" /> More
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
