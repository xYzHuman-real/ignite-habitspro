import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, RefreshCw, Clock, CheckCircle2, Coffee, Utensils,
  Moon, Target, BookOpen, Flame, ArrowLeft, Zap, Brain, Settings2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ScheduleBlock {
  time: string;
  duration: number;
  title: string;
  type: "habit" | "todo" | "focus" | "break" | "meal" | "wind_down";
  icon: string;
  priority: "high" | "medium" | "low";
  tip: string;
}

interface DailyPlan {
  greeting: string;
  summary: string;
  schedule: ScheduleBlock[];
  motivation: string;
}

const typeStyles: Record<string, { bg: string; border: string; text: string }> = {
  habit: { bg: "bg-primary/5", border: "border-primary/20", text: "text-primary" },
  todo: { bg: "bg-teal-500/5", border: "border-teal-500/20", text: "text-teal-600 dark:text-teal-400" },
  focus: { bg: "bg-blue-500/5", border: "border-blue-500/20", text: "text-blue-600 dark:text-blue-400" },
  break: { bg: "bg-green-500/5", border: "border-green-500/20", text: "text-green-600 dark:text-green-400" },
  meal: { bg: "bg-amber-500/5", border: "border-amber-500/20", text: "text-amber-600 dark:text-amber-400" },
  wind_down: { bg: "bg-purple-500/5", border: "border-purple-500/20", text: "text-purple-600 dark:text-purple-400" },
};

const typeIcons: Record<string, any> = {
  habit: Flame,
  todo: CheckCircle2,
  focus: Target,
  break: Coffee,
  meal: Utensils,
  wind_down: Moon,
};

const priorityDots: Record<string, string> = {
  high: "bg-destructive",
  medium: "bg-teal-400",
  low: "bg-blue-400",
};

const COOLDOWN_MS = 30 * 60 * 1000;
const COOLDOWN_KEY = "daily_plan_last_generated";

const PREFS_KEY = "daily_plan_prefs_v1";

interface PlannerPrefs {
  wakeTime: string;
  sleepTime: string;
  studyStart: string;
  studyEnd: string;
  workStart: string;
  workEnd: string;
  breakPreference: string;
  goalFocus: string;
}

const DEFAULT_PREFS: PlannerPrefs = {
  wakeTime: "07:00",
  sleepTime: "23:00",
  studyStart: "",
  studyEnd: "",
  workStart: "",
  workEnd: "",
  breakPreference: "balanced",
  goalFocus: "",
};

export default function DailyPlanner() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [prefs, setPrefs] = useState<PlannerPrefs>(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_PREFS;
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const updatePref = <K extends keyof PlannerPrefs>(key: K, value: PlannerPrefs[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const generatePlan = async () => {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
    const elapsed = Date.now() - last;
    if (last && elapsed < COOLDOWN_MS) {
      const minsLeft = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
      toast({ title: "Cooldown active ⏳", description: `Try again in ${minsLeft} min.`, variant: "destructive" });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sign in required",
          description: "Please sign in to generate your AI daily schedule.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const res = await supabase.functions.invoke("generate-daily-plan", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: prefs,
      });

      if (res.error) {
        throw new Error(res.error.message || "Failed to generate plan");
      }

      if (res.data?.error) {
        throw new Error(res.data.error);
      }

      setPlan(res.data);
      localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
      toast({ title: "Schedule generated! ✨", description: "Your personalized plan is ready." });
    } catch (e: any) {
      const msg = e.message || "Failed to generate plan";
      setError(msg);
      toast({ title: "Generation failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Daily Planner
          </h1>
          <p className="text-xs text-muted-foreground">AI-powered personalized schedule</p>
        </div>
      </div>


      {/* Preferences */}
      <Collapsible open={prefsOpen} onOpenChange={setPrefsOpen}>
        <Card className="p-4">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full text-left">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <span className="font-display font-semibold text-sm">Your Day Preferences</span>
              </div>
              <span className="text-xs text-muted-foreground">{prefsOpen ? "Hide" : "Customize"}</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Wake time</Label>
                <Input type="time" value={prefs.wakeTime} onChange={(e) => updatePref("wakeTime", e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Sleep time</Label>
                <Input type="time" value={prefs.sleepTime} onChange={(e) => updatePref("sleepTime", e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Study start</Label>
                <Input type="time" value={prefs.studyStart} onChange={(e) => updatePref("studyStart", e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Study end</Label>
                <Input type="time" value={prefs.studyEnd} onChange={(e) => updatePref("studyEnd", e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Work start</Label>
                <Input type="time" value={prefs.workStart} onChange={(e) => updatePref("workStart", e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Work end</Label>
                <Input type="time" value={prefs.workEnd} onChange={(e) => updatePref("workEnd", e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Break style</Label>
              <Select value={prefs.breakPreference} onValueChange={(v) => updatePref("breakPreference", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short-frequent">Short & frequent (5 min / 25 min)</SelectItem>
                  <SelectItem value="balanced">Balanced (10 min / 50 min)</SelectItem>
                  <SelectItem value="long-sparse">Long & sparse (20 min / 90 min)</SelectItem>
                  <SelectItem value="minimal">Minimal — deep work blocks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Primary goal focus today</Label>
              <Input
                placeholder="e.g. Finish chapter 5, ship landing page"
                value={prefs.goalFocus}
                onChange={(e) => updatePref("goalFocus", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Empty state / Generate CTA */}
      {!plan && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-8 text-center space-y-4 border-dashed border-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mx-auto flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Generate Your Daily Schedule</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                AI will analyze your habits, todos, and goals to create a personalized, balanced schedule for today.
              </p>
            </div>
            <Button onClick={generatePlan} size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground gap-2">
              <Sparkles className="h-4 w-4" />
              Generate My Schedule
            </Button>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </Card>
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-primary animate-spin" />
              </div>
              <div>
                <p className="font-medium text-sm">Analyzing your data...</p>
                <p className="text-xs text-muted-foreground">Creating your personalized schedule</p>
              </div>
            </div>
          </Card>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </motion.div>
      )}

      {/* Generated plan */}
      {plan && !loading && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Greeting card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-5 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm">{plan.greeting}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{plan.summary}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Schedule timeline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-display font-semibold text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Today's Schedule
                </h2>
                <Button variant="ghost" size="sm" onClick={generatePlan} className="text-xs gap-1">
                  <RefreshCw className="h-3 w-3" /> Regenerate
                </Button>
              </div>

              {plan.schedule.map((block, idx) => {
                const style = typeStyles[block.type] || typeStyles.break;
                const TypeIcon = typeIcons[block.type] || BookOpen;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.2, ease: "easeOut" }}
                  >
                    <Card className={`p-3.5 ${style.bg} ${style.border} border`}>
                      <div className="flex items-start gap-3">
                        {/* Time column */}
                        <div className="flex flex-col items-center shrink-0 w-12">
                          <span className="text-xs font-mono font-bold">{block.time}</span>
                          <span className="text-[10px] text-muted-foreground">{block.duration}m</span>
                        </div>

                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.bg}`}>
                          <span className="text-lg">{block.icon}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{block.title}</p>
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDots[block.priority] || priorityDots.low}`} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <TypeIcon className={`h-3 w-3 ${style.text}`} />
                            <span className={`text-[10px] font-medium capitalize ${style.text}`}>{block.type.replace("_", " ")}</span>
                          </div>
                          {block.tip && (
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">💡 {block.tip}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Motivation footer */}
            {plan.motivation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-4 text-center bg-gradient-to-r from-primary/5 to-accent/5 border-primary/10">
                  <p className="text-sm text-muted-foreground italic">"{plan.motivation}"</p>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
