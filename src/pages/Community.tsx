import { useState } from "react";
import { motion } from "framer-motion";
import { Users, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type CommunityGroup, communityGroups as initialGroups } from "@/lib/store";

export default function Community() {
  const [groups, setGroups] = useState<CommunityGroup[]>(initialGroups);

  const toggleJoin = (id: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === id ? { ...g, joined: !g.joined, members: g.joined ? g.members - 1 : g.members + 1 } : g
      )
    );
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
                  <Button size="sm" variant="ghost">
                    <MessageCircle className="h-4 w-4 mr-1" /> Chat
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
