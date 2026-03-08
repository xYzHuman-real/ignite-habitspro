import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Clock, Users, CheckCircle2, Zap, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useChallenges, useBadges } from "@/lib/supabase-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const difficultyColors: Record<string, string> = {
  easy: "bg-success/15 text-success border-success/30",
  medium: "bg-accent/15 text-accent-foreground border-accent/30",
  hard: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function Challenges() {
  const { challenges, userChallenges, joinChallenge, checkIn } = useChallenges();
  const { allBadges } = useBadges();
  const { toast } = useToast();
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);

  const joinedIds = new Set(userChallenges.map((uc) => uc.challenge_id));

  const activeChallenges = challenges.filter((c) => !joinedIds.has(c.id));
  const myChallenges = challenges.filter((c) => joinedIds.has(c.id));

  const getUserChallenge = (challengeId: string) =>
    userChallenges.find((uc) => uc.challenge_id === challengeId);

  const getBadge = (badgeId: string | null) =>
    badgeId ? allBadges.find((b) => b.id === badgeId) : null;

  const detail = challenges.find((c) => c.id === selectedChallenge);
  const detailUc = selectedChallenge ? getUserChallenge(selectedChallenge) : null;
  const detailBadge = detail ? getBadge(detail.badge_reward) : null;

  const handleJoin = (challengeId: string, name: string) => {
    joinChallenge(challengeId);
    toast({
      title: "Challenge Joined! 🎯",
      description: `You've joined "${name}". Let's crush it!`,
    });
  };

  if (challenges.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-56" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52" />
          ))}
        </div>
      </div>
    );
  }

  const ChallengeCard = ({
    challenge,
    joined,
  }: {
    challenge: (typeof challenges)[0];
    joined: boolean;
  }) => {
    const uc = getUserChallenge(challenge.id);
    const badge = getBadge(challenge.badge_reward);
    const progressPct = uc
      ? Math.min(100, Math.round((uc.progress / challenge.duration_days) * 100))
      : 0;

    return (
      <motion.div variants={item}>
        <Card
          className={`p-5 space-y-4 cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col ${
            joined ? "border-primary/30" : ""
          }`}
          onClick={() => setSelectedChallenge(challenge.id)}
        >
          <div className="flex items-start justify-between">
            <span className="text-3xl">{challenge.icon}</span>
            <Badge
              variant="outline"
              className={
                difficultyColors[
                  challenge.duration_days <= 7
                    ? "easy"
                    : challenge.duration_days <= 14
                    ? "medium"
                    : "hard"
                ]
              }
            >
              {challenge.duration_days}d
            </Badge>
          </div>

          <div className="flex-1">
            <h3 className="font-display font-semibold text-base">
              {challenge.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {challenge.description}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-accent" />
              <span>{challenge.points_reward} pts</span>
              {badge && (
                <>
                  <span>•</span>
                  <Award className="h-3.5 w-3.5 text-primary" />
                  <span>{badge.name}</span>
                </>
              )}
            </div>

            {joined && uc ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    Day {uc.progress}/{challenge.duration_days}
                  </span>
                  <span className="font-medium text-primary">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />
                {uc.completed ? (
                  <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Completed!
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-1 border-primary/30 text-primary hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      checkIn({ userChallengeId: uc.id, currentProgress: uc.progress, targetDays: challenge.duration_days });
                      toast({
                        title: uc.progress + 1 >= challenge.duration_days ? "Challenge Complete! 🏆" : "Checked In! ✅",
                        description: uc.progress + 1 >= challenge.duration_days
                          ? `You completed "${challenge.name}" and earned ${challenge.points_reward} points!`
                          : `Day ${uc.progress + 1}/${challenge.duration_days} done. Keep going!`,
                      });
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Check In Today
                  </Button>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                className="w-full bg-gradient-primary text-primary-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoin(challenge.id, challenge.name);
                }}
              >
                Join Challenge
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <Trophy className="h-7 w-7 text-accent" />
          Challenges
        </h1>
        <p className="text-muted-foreground mt-1">
          Push your limits, earn rewards, and level up your habits
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-3"
      >
        <Card className="p-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">
            {myChallenges.length}
          </p>
          <p className="text-xs text-muted-foreground">Joined</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-display font-bold text-success">
            {userChallenges.filter((uc) => uc.completed).length}
          </p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-display font-bold text-accent">
            {userChallenges.reduce(
              (sum, uc) =>
                sum +
                (uc.completed
                  ? challenges.find((c) => c.id === uc.challenge_id)
                      ?.points_reward || 0
                  : 0),
              0
            )}
          </p>
          <p className="text-xs text-muted-foreground">Points Earned</p>
        </Card>
      </motion.div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">
            Browse ({activeChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="my">
            My Challenges ({myChallenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          {activeChallenges.length === 0 ? (
            <Card className="p-8 text-center">
              <Trophy className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                You've joined all available challenges! 🎉
              </p>
            </Card>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {activeChallenges.map((c) => (
                <ChallengeCard key={c.id} challenge={c} joined={false} />
              ))}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="my">
          {myChallenges.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">
                No challenges joined yet. Browse and join one!
              </p>
            </Card>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {myChallenges.map((c) => (
                <ChallengeCard key={c.id} challenge={c} joined={true} />
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedChallenge}
        onOpenChange={(open) => !open && setSelectedChallenge(null)}
      >
        {detail && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-3 text-xl">
                <span className="text-3xl">{detail.icon}</span>
                {detail.name}
              </DialogTitle>
              <DialogDescription>{detail.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted p-3 text-center">
                  <Clock className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-sm font-semibold">
                    {detail.duration_days} Days
                  </p>
                  <p className="text-xs text-muted-foreground">Duration</p>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <Zap className="h-4 w-4 mx-auto text-accent mb-1" />
                  <p className="text-sm font-semibold">
                    {detail.points_reward} pts
                  </p>
                  <p className="text-xs text-muted-foreground">Reward</p>
                </div>
              </div>

              {detailBadge && (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="text-2xl">{detailBadge.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{detailBadge.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Badge reward • {detailBadge.tier} tier
                    </p>
                  </div>
                </div>
              )}

              {detailUc ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-semibold text-primary">
                      {detailUc.progress}/{detail.duration_days} days
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      100,
                      (detailUc.progress / detail.duration_days) * 100
                    )}
                    className="h-3"
                  />
                  {detailUc.completed ? (
                    <div className="flex items-center justify-center gap-2 text-success font-medium pt-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Challenge Completed! 🎉
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-gradient-primary text-primary-foreground"
                      onClick={() => {
                        checkIn({ userChallengeId: detailUc.id, currentProgress: detailUc.progress, targetDays: detail.duration_days });
                        toast({
                          title: detailUc.progress + 1 >= detail.duration_days ? "Challenge Complete! 🏆" : "Checked In! ✅",
                          description: detailUc.progress + 1 >= detail.duration_days
                            ? `You completed "${detail.name}" and earned ${detail.points_reward} points!`
                            : `Day ${detailUc.progress + 1}/${detail.duration_days} done. Keep it up!`,
                        });
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Check In for Today
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  className="w-full bg-gradient-primary text-primary-foreground"
                  onClick={() => {
                    handleJoin(detail.id, detail.name);
                    setSelectedChallenge(null);
                  }}
                >
                  Join This Challenge
                </Button>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
