import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, UserPlus, UserMinus, Users, X, Loader2 } from "lucide-react";
import { useQuery, useQueryClient, useMutation, useInfiniteQuery } from "@tanstack/react-query";
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

const PAGE_SIZE = 20;

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
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const targetId = userId || user?.id;
  const hasSearch = !!search.trim();

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

  // ---- Infinite scroll (no search) ----
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingInfinite,
  } = useInfiniteQuery({
    queryKey: ["follow_list_infinite", targetId, mode],
    initialPageParam: 0,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (!targetId) return { rows: [] as ProfileRow[], nextOffset: null as number | null };
      const col = mode === "followers" ? "follower_id" : "following_id";
      const matchCol = mode === "followers" ? "following_id" : "follower_id";
      const { data: rels } = await supabase
        .from("followers")
        .select(`${col}, created_at`)
        .eq(matchCol, targetId)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + PAGE_SIZE - 1);
      const ids = (rels || []).map((r: any) => r[col]).filter(Boolean);
      if (!ids.length) return { rows: [] as ProfileRow[], nextOffset: null };
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, subscription_tier, premium_until, trial_ends_at")
        .in("user_id", ids);
      const map = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      const rows = ids.map((id) => map.get(id)).filter(Boolean) as ProfileRow[];
      const nextOffset = (rels || []).length === PAGE_SIZE ? pageParam + PAGE_SIZE : null;
      return { rows, nextOffset };
    },
    getNextPageParam: (lastPage: { rows: ProfileRow[]; nextOffset: number | null }) => lastPage.nextOffset,
    enabled: !!targetId && !hasSearch,
  });

  // ---- Full load (when searching) ----
  const { data: fullRows = [], isLoading: isLoadingFull } = useQuery({
    queryKey: ["follow_list_full", targetId, mode],
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
    enabled: !!targetId && hasSearch,
  });

  const rawRows = hasSearch
    ? fullRows
    : (infiniteData?.pages.flatMap((p) => p.rows) ?? []);
  const isLoading = hasSearch ? isLoadingFull : isLoadingInfinite;

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
    if (!q) return rawRows;
    return rawRows.filter(
      (p) =>
        (p.display_name || "").toLowerCase().includes(q) ||
        (p.username || "").toLowerCase().includes(q),
    );
  }, [rawRows, search]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (hasSearch || !hasNextPage || isFetchingNextPage) return;
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasSearch, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Invalidate both list queries on mutations
  const invalidateLists = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["follow_list_infinite"] });
    qc.invalidateQueries({ queryKey: ["follow_list_full"] });
    qc.invalidateQueries({ queryKey: ["my_following_ids", user?.id] });
    qc.invalidateQueries({ queryKey: ["follower_count"] });
    qc.invalidateQueries({ queryKey: ["following_count"] });
    qc.invalidateQueries({ queryKey: ["is_following"] });
  }, [qc, user?.id]);

  const toggleFollowMutation = useMutation({
    mutationFn: async ({ otherId, currentlyFollowing }: { otherId: string; currentlyFollowing: boolean }) => {
      if (!user?.id || otherId === user.id) throw new Error("Invalid action");
      if (currentlyFollowing) {
        const { error } = await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", otherId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("followers").insert({ follower_id: user.id, following_id: otherId });
        if (error) throw error;
      }
    },
    onMutate: async ({ otherId, currentlyFollowing }) => {
      await qc.cancelQueries({ queryKey: ["my_following_ids", user?.id] });
      await qc.cancelQueries({ queryKey: ["follow_list_infinite"] });
      await qc.cancelQueries({ queryKey: ["follow_list_full"] });
      await qc.cancelQueries({ queryKey: ["follower_count"] });
      await qc.cancelQueries({ queryKey: ["following_count"] });
      await qc.cancelQueries({ queryKey: ["is_following"] });

      const prevMyFollowing = qc.getQueryData<string[]>(["my_following_ids", user?.id]);
      const prevInfinite = qc.getQueryData<{ pages: { rows: ProfileRow[]; nextOffset: number | null }[] }>(["follow_list_infinite", targetId, mode]);
      const prevFull = qc.getQueryData<ProfileRow[]>(["follow_list_full", targetId, mode]);

      qc.setQueryData(["my_following_ids", user?.id], (old: string[] | undefined) => {
        if (!old) return currentlyFollowing ? [] : [otherId];
        if (currentlyFollowing) return old.filter((id) => id !== otherId);
        if (old.includes(otherId)) return old;
        return [...old, otherId];
      });

      if (mode === "following" && targetId === user?.id && currentlyFollowing) {
        qc.setQueryData(["follow_list_infinite", targetId, mode], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              rows: page.rows.filter((p: ProfileRow) => p.user_id !== otherId),
            })),
          };
        });
        qc.setQueryData(["follow_list_full", targetId, mode], (old: ProfileRow[] | undefined) => {
          return (old || []).filter((p) => p.user_id !== otherId);
        });
      }

      return { prevMyFollowing, prevInfinite, prevFull };
    },
    onError: (_err, { currentlyFollowing }, ctx) => {
      if (ctx?.prevMyFollowing) qc.setQueryData(["my_following_ids", user?.id], ctx.prevMyFollowing);
      if (ctx?.prevInfinite) qc.setQueryData(["follow_list_infinite", targetId, mode], ctx.prevInfinite);
      if (ctx?.prevFull) qc.setQueryData(["follow_list_full", targetId, mode], ctx.prevFull);
      toast({ title: currentlyFollowing ? "Could not unfollow" : "Could not follow", variant: "destructive" });
    },
    onSuccess: (_data, { currentlyFollowing }) => {
      toast({ title: currentlyFollowing ? "Unfollowed" : "Following! 🎉" });
    },
    onSettled: () => {
      invalidateLists();
    },
  });

  const toggleFollow = useCallback(
    (otherId: string, currentlyFollowing: boolean) => {
      toggleFollowMutation.mutate({ otherId, currentlyFollowing });
    },
    [toggleFollowMutation],
  );

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
                      <motion.div layout transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                        <Button
                          size="sm"
                          variant={following ? "outline" : "default"}
                          disabled={toggleFollowMutation.isPending}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(p.user_id, following);
                          }}
                          className={`rounded-full h-8 px-3 text-xs transition-all active:scale-95 ${
                            following ? "" : "bg-gradient-primary text-primary-foreground"
                          }`}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                              key={following ? "following" : "follow"}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                              className="flex items-center"
                            >
                              {following ? (
                                <><UserMinus className="h-3.5 w-3.5 mr-1" /> Following</>
                              ) : (
                                <><UserPlus className="h-3.5 w-3.5 mr-1" /> Follow</>
                              )}
                            </motion.span>
                          </AnimatePresence>
                        </Button>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Infinite scroll sentinel */}
        {!hasSearch && (
          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && (
              <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
