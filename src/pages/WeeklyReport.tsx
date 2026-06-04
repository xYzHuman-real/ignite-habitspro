import { motion } from "framer-motion";
import { BarChart3, Flame, Target, Clock, Coins, TrendingUp, TrendingDown, Minus, Calendar, Award, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWeeklyReport } from "@/lib/use-weekly-report";
import { format, parseISO } from "date-fns";
import PageHero from "@/components/PageHero";


const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function TrendBadge({ value }: { value: number }) {
  if (value > 0) return <span className="flex items-center gap-0.5 text-xs text-success font-medium"><TrendingUp className="h-3 w-3" />+{value}%</span>;
  if (value < 0) return <span className="flex items-center gap-0.5 text-xs text-destructive font-medium"><TrendingDown className="h-3 w-3" />{value}%</span>;
  return <span className="flex items-center gap-0.5 text-xs text-muted-foreground font-medium"><Minus className="h-3 w-3" />0%</span>;
}

export default function WeeklyReport() {
  const { data: report, isLoading } = useWeeklyReport();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground">No report data available yet.</p>
      </div>
    );
  }

  const weekLabel = format(parseISO(report.weekStart), "MMM d, yyyy");
  const focusHours = Math.floor(report.totalFocusMinutes / 60);
  const focusMins = report.totalFocusMinutes % 60;
  const consistencyPct = report.totalHabits > 0 ? Math.round((report.daysActive / 7) * 100) : 0;
  const maxDailyCompletions = Math.max(...report.dailyBreakdown.map((d) => d.completions), 1);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6">
      <motion.div variants={item}>
        <PageHero
          eyebrow={`Week of ${weekLabel}`}
          title="Weekly Report"
          subtitle="Here's how you did this week"
          icon={BarChart3}
          progress={consistencyPct}
          stats={[
            { icon: Target, label: "Habits", value: report.totalCompletions },
            { icon: Clock, label: "Focus", value: focusHours > 0 ? `${focusHours}h${focusMins}m` : `${focusMins}m` },
            { icon: Flame, label: "Streak", value: `${report.bestStreak}d` },
          ]}
        />
      </motion.div>

      {/* Key Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Target className="h-4 w-4 text-primary" />
            <TrendBadge value={report.completionChange} />
          </div>
          <p className="text-2xl font-display font-bold">{report.totalCompletions}</p>
          <p className="text-xs text-muted-foreground">Habits Completed</p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Clock className="h-4 w-4 text-accent" />
            <TrendBadge value={report.focusChange} />
          </div>
          <p className="text-2xl font-display font-bold">
            {focusHours > 0 ? `${focusHours}h ${focusMins}m` : `${focusMins}m`}
          </p>
          <p className="text-xs text-muted-foreground">Focus Time</p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Coins className="h-4 w-4 text-accent" />
          </div>
          <p className="text-2xl font-display font-bold">{report.totalPointsEarned}</p>
          <p className="text-xs text-muted-foreground">Points Earned</p>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <Flame className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-display font-bold">{report.bestStreak}</p>
          <p className="text-xs text-muted-foreground">Current Streak</p>
        </Card>
      </motion.div>

      {/* Daily Breakdown Bar Chart */}
      <motion.div variants={item}>
        <Card className="p-5">
          <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Daily Activity
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground/70 hover:text-foreground transition-colors">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs">
                  Daily Activity counts the total actions logged each day: habits completed, focus sessions finished, to-dos closed, and journal entries written. Higher bars = busier, more productive days.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h2>

          <div className="flex items-end gap-3 h-40">
            {report.dailyBreakdown.map((d) => {
              const barHeight = maxDailyCompletions > 0 ? (d.completions / maxDailyCompletions) * 100 : 0;
              const isToday = d.date === new Date().toISOString().split("T")[0];
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{d.completions}</span>
                  <div className="w-full flex items-end" style={{ height: "120px" }}>
                    <div
                      className={`w-full rounded-t-md transition-all ${isToday ? "bg-gradient-primary" : "bg-primary/30"}`}
                      style={{ height: `${Math.max(barHeight, 4)}%` }}
                    />
                  </div>
                  <span className={`text-xs ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      <motion.div variants={item} className="grid md:grid-cols-2 gap-4">
        {/* Consistency */}
        <Card className="p-5 space-y-3">
          <h2 className="font-display font-semibold text-lg">Consistency</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" stroke="hsl(var(--muted))" strokeWidth="6" fill="none" />
                <circle
                  cx="40" cy="40" r="34"
                  stroke="hsl(var(--primary))"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${consistencyPct * 2.136} ${213.6 - consistencyPct * 2.136}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-lg">
                {consistencyPct}%
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{report.daysActive}/7 days active</p>
              <p className="text-xs text-muted-foreground mt-1">
                {consistencyPct >= 80 ? "Outstanding consistency! 🔥" :
                 consistencyPct >= 50 ? "Good effort, keep pushing! 💪" :
                 "Room to improve. Show up more! 📈"}
              </p>
            </div>
          </div>
        </Card>

        {/* Top Habit */}
        <Card className="p-5 space-y-3">
          <h2 className="font-display font-semibold text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" />
            Star Habit
          </h2>
          {report.topHabit ? (
            <div className="flex items-center gap-4">
              <span className="text-4xl">{report.topHabit.icon}</span>
              <div>
                <p className="font-semibold">{report.topHabit.name}</p>
                <p className="text-sm text-muted-foreground">
                  Completed {report.topHabit.count} time{report.topHabit.count !== 1 ? "s" : ""} this week
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current streak: {report.topHabit.streak} days
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Complete habits this week to see your star performer!
            </p>
          )}
        </Card>
      </motion.div>

      {/* Focus Time Breakdown */}
      <motion.div variants={item}>
        <Card className="p-5">
          <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-accent" />
            Focus Time Breakdown
          </h2>
          <div className="space-y-2">
            {report.dailyBreakdown.map((d) => (
              <div key={d.day} className="flex items-center gap-3">
                <span className="text-xs w-8 text-muted-foreground">{d.day}</span>
                <div className="flex-1">
                  <Progress
                    value={report.totalFocusMinutes > 0 ? (d.focusMinutes / Math.max(...report.dailyBreakdown.map((x) => x.focusMinutes), 1)) * 100 : 0}
                    className="h-2"
                  />
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {d.focusMinutes > 0 ? `${d.focusMinutes}m` : "—"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Summary */}
      <motion.div variants={item}>
        <Card className="p-5 bg-gradient-primary text-primary-foreground border-0">
          <h2 className="font-display font-semibold text-lg mb-2">Week Summary</h2>
          <p className="text-sm opacity-90">
            You completed <strong>{report.totalCompletions} habits</strong> across <strong>{report.daysActive} days</strong>,
            spent <strong>{focusHours > 0 ? `${focusHours}h ${focusMins}m` : `${focusMins}m`}</strong> focused,
            and earned <strong>{report.totalPointsEarned} points</strong>.
            {report.completionChange > 0 ? ` That's ${report.completionChange}% more habits than last week! 🚀` :
             report.completionChange < 0 ? ` Let's beat last week's record next time! 💪` :
             " Keep the momentum going! ⚡"}
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
