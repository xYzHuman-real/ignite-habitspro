import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, UserPlus, UserMinus, Users, X } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumBadge } from "@/components/PremiumBadge";
import { useToast } from "@/hooks/use-toast";

type Mode = "followers" | "following";

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  subscription_tier: string | null;
  premium_until: string | null;
  trial_ends_at: string | null;
};

function isUserPremium(p: ProfileRow) {
  const now = Date.now();
  const trial = p.trial_ends_at ? new Date(p.trial_ends_at).getTime() : 0;
  const until = p.premium_until ? new Date(p.premium_until).getTime() : 0;
  const isTrial = trial > now && p.subscription_tier !== "premium";
  const isPaid = p.subscription_tier === "premium" && until > now;
  return isTrial || isPaid;
}

export default function FollowList() {
  const { userId } = useParams<{ userId: string }>();
  const [params] = useSearchParams();
  const tabParam = (params.get("tab") as Mode) || "followers";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>(tabParam);
  const [search, setSearch] = useState("");

  const targetId = userId || user?.id;

  const { data: ownerProfile } = useQuery({
    queryKey: ["follow_list_owner", targetId],
    queryFn: async () => {
      if (!targetId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username")
        .eq("user_id", targetId)
        .maybeSingle();
      return data;
    },
    enabled: !!targetId,
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["follow_list", targetId, mode],
    queryFn: async () => {
      if (!targetId) return [];
      const col = mode === "followers" ? "follower_id" : "following_id";
      const matchCol = mode === "followers" ? "following_id" : "follower_id";
      const { data: rels } = await supabase
        .from("followers")
        .select(`${col}, created_at`)
        .eq(matchCol, targetId)
        .order("created_at", { ascending: false });
      const ids = (rels || []).map((r: any) => r[col]).filter(Boolean);
      if (!ids.length) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, subscription_tier, premium_until, trial_ends_at")
        .in("user_id", ids);
      const map = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      return ids.map((id) => map.get(id)).filter(Boolean) as ProfileRow[];
    },
    enabled: !!targetId,
  });

  const { data: myFollowing = [] } = useQuery({
    queryKey: ["my_following_ids", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from("followers").select("following_id").eq("follower_id", user.id);
      return (data || []).map((r) => r.following_id);
    },
    enabled: !!user?.id,
  });
  const followingSet = useMemo(() => new Set(myFollowing), [myFollowing]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (p) =>
        (p.display_name || "").toLowerCase().includes(q) ||
        (p.username || "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const toggleFollow = async (otherId: string, currentlyFollowing: boolean) => {
    if (!user?.id || otherId === user.id) return;
    if (currentlyFollowing) {
      const { error } = await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", otherId);
      if (error) return toast({ title: "Could not unfollow", variant: "destructive" });
      toast({ title: "Unfollowed" });
    } else {
      const { error } = await supabase.from("followers").insert({ follower_id: user.id, following_id: otherId });
      if (error) return toast({ title: "Could not follow", variant: "destructive" });
      toast({ title: "Following! 🎉" });
    }
    qc.invalidateQueries({ queryKey: ["my_following_ids", user.id] });
    qc.invalidateQueries({ queryKey: ["follower_count"] });
    qc.invalidateQueries({ queryKey: ["following_count"] });
    qc.invalidateQueries({ queryKey: ["is_following"] });
  };

  const headerName = ownerProfile?.display_name || ownerProfile?.username || "User";

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 -mx-4 px-4 pt-2 pb-3 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">@{ownerProfile?.username || headerName}</p>
            <h1 className="font-display font-bold text-base leading-tight">{headerName}</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-3 grid grid-cols-2 rounded-full bg-muted/60 p-1">
          {(["followers", "following"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`relative py-2 text-sm font-medium rounded-full transition-colors capitalize ${
                mode === m ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {mode === m && (
                <motion.span
                  layoutId="follow-tab-pill"
                  className="absolute inset-0 rounded-full bg-gradient-primary shadow-md"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative">{m}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${mode}…`}
            className="pl-9 pr-9 rounded-full h-10 bg-muted/40 border-border/60 focus-visible:ring-1"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="mt-4 space-y-2">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-3 flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-20 rounded-full" />
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center py-16 px-6"
          >
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center mb-4">
              <Users className="h-9 w-9 text-primary/70" />
            </div>
            <h3 className="font-display font-bold text-lg">
              {search
                ? "No matches"
                : mode === "followers"
                ? "No followers yet"
                : "Not following anyone"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {search
                ? "Try a different name or username."
                : mode === "followers"
                ? "Share your profile to grow your circle."
                : "Discover people from the leaderboard or community."}
            </p>
            {!search && (
              <Button variant="outline" className="mt-5 rounded-full" onClick={() => navigate("/leaderboard")}>
                Discover people
              </Button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((p, idx) => {
              const isMe = p.user_id === user?.id;
              const following = followingSet.has(p.user_id);
              const premium = isUserPremium(p);
              const initials = (p.display_name || p.username || "?")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <motion.div
                  key={p.user_id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut", delay: Math.min(idx, 8) * 0.015 }}
                >
                  <Card className="p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors border-border/50">
                    <Link to={`/user/${p.user_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 border border-border/40">
                        {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.display_name || ""} />}
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="font-semibold text-sm truncate">{p.display_name || "Anonymous"}</p>
                          {premium && <PremiumBadge size="sm" label="Pro" />}
                        </div>
                        {p.username && (
                          <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                        )}
                      </div>
                    </Link>
                    {!isMe && (
                      <Button
                        size="sm"
                        variant={following ? "outline" : "default"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollow(p.user_id, following);
                        }}
                        className={`rounded-full h-8 px-3 text-xs ${
                          following ? "" : "bg-gradient-primary text-primary-foreground"
                        }`}
                      >
                        {following ? (
                          <><UserMinus className="h-3.5 w-3.5 mr-1" /> Following</>
                        ) : (
                          <><UserPlus className="h-3.5 w-3.5 mr-1" /> Follow</>
                        )}
                      </Button>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
