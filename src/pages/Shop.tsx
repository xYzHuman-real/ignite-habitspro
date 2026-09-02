import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Coins, Zap, Shield, Sparkles, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile, useShopItems } from "@/lib/supabase-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { getLevelForPoints, getNextLevel, getProgressToNext, XP_LEVELS } from "@/lib/xp-levels";
import PageHero from "@/components/PageHero";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const categoryIcons: Record<string, React.ReactNode> = {
  power_ups: <Shield className="h-4 w-4" />,
  titles: <Tag className="h-4 w-4" />,
  boosts: <Zap className="h-4 w-4" />,
  cosmetics: <Sparkles className="h-4 w-4" />,
  themes: <Sparkles className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  power_ups: "Power-Ups",
  titles: "Titles",
  boosts: "Boosts",
  cosmetics: "Cosmetics",
  themes: "Focus Themes",
};

export default function Shop() {
  const { profile, isLoading } = useProfile();
  const { shopItems, purchaseItem, isPurchasing } = useShopItems();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  if (isLoading || !profile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-32" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  const points = profile.coins || 0; // Use coins for shop, not leaderboard_points
  const currentLevel = getLevelForPoints(points);
  const nextLevel = getNextLevel(points);
  const progressToNext = getProgressToNext(points);

  const categories = [...new Set(shopItems.map((i) => i.category))];
  const filteredItems = activeTab === "all" ? shopItems : shopItems.filter((i) => i.category === activeTab);

  const handlePurchase = (itemData: { id: string; name: string; price: number; item_type: string; item_value: string }) => {
    if (points < itemData.price) {
      toast({ title: "Not Enough Points 💰", description: `You need ${itemData.price - points} more points.`, variant: "destructive" });
      return;
    }
    purchaseItem(
      { itemId: itemData.id, price: itemData.price, itemType: itemData.item_type, itemValue: itemData.item_value },
      {
        onSuccess: () => {
          toast({ title: "Purchased! 🎉", description: `You got "${itemData.name}" for ${itemData.price} points.` });
        },
        onError: (err: Error) => {
          toast({ title: "Purchase Failed", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHero
        eyebrow="Rewards Shop"
        title="Spend Your Points"
        subtitle="Upgrades, boosts, and perks await"
        icon={ShoppingBag}
        progress={progressToNext}
        progressLabel={`Lv ${currentLevel.level}`}
        stats={[
          { icon: Coins, label: "Coins", value: points },
          { icon: Sparkles, label: "Level", value: currentLevel.title },
          { icon: Zap, label: "Items", value: shopItems.length },
        ]}
      />

      <RewardedAdCard />


      {/* Points & Level Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="text-center">
              <div className="text-4xl mb-1">{currentLevel.icon}</div>
              <p className="text-sm font-semibold text-primary">Level {currentLevel.level}</p>
              <p className="text-xs text-muted-foreground">{currentLevel.title}</p>
            </div>
            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-accent" />
                  <span className="text-2xl font-display font-bold">{points}</span>
                  <span className="text-sm text-muted-foreground">points</span>
                </div>
                {nextLevel && (
                  <span className="text-xs text-muted-foreground">
                    {nextLevel.minPoints - points} pts to Level {nextLevel.level}
                  </span>
                )}
              </div>
              <Progress value={progressToNext} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentLevel.title}</span>
                <span>{nextLevel ? nextLevel.title : "Max Level!"}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* XP Levels Overview */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-5">
          <h2 className="font-display font-semibold text-lg mb-3">XP Levels</h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {XP_LEVELS.map((lvl) => (
              <div
                key={lvl.level}
                className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl min-w-[80px] transition-colors ${
                  currentLevel.level >= lvl.level ? "bg-primary/10 border border-primary/30" : "bg-muted/50"
                }`}
              >
                <span className="text-xl">{lvl.icon}</span>
                <span className="text-xs font-medium mt-1">{lvl.title}</span>
                <span className="text-[10px] text-muted-foreground">{lvl.minPoints} pts</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Shop Items */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto -mx-1 px-1 touch-pan-x" style={{ WebkitOverflowScrolling: 'touch' }}>
          <TabsList className="w-max">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((cat: string) => (
              <TabsTrigger key={cat} value={cat} className="flex items-center gap-1">
                {categoryIcons[cat]} {categoryLabels[cat] || cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={activeTab}>
          {filteredItems.length === 0 ? (
            <Card className="p-8 text-center">
              <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No items in this category</p>
            </Card>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((shopItem) => (
                <motion.div key={shopItem.id} variants={item}>
                  <Card className="p-5 space-y-3 h-full flex flex-col">
                    <div className="flex items-start justify-between">
                      <span className="text-3xl">{shopItem.icon}</span>
                      <Badge variant="outline" className="bg-accent/15 text-accent-foreground border-accent/30">
                        <Coins className="h-3 w-3 mr-1" />
                        {shopItem.price}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold">{shopItem.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{shopItem.description}</p>
                    </div>
                    <Button
                      className={points >= shopItem.price ? "w-full bg-gradient-primary text-primary-foreground" : "w-full"}
                      variant={points >= shopItem.price ? "default" : "outline"}
                      disabled={points < shopItem.price || isPurchasing}
                      onClick={() => handlePurchase(shopItem)}
                    >
                      {points >= shopItem.price ? "Buy Now" : `Need ${shopItem.price - points} more pts`}
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
