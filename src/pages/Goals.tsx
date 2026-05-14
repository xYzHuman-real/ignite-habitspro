import { useState } from "react";
import { motion } from "framer-motion";
import {
  Crosshair, Plus, Calendar as CalendarIcon, Trash2, CheckCircle2,
  Circle, ChevronDown, ChevronUp, Target, Flag, Edit3, X, Save,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import PageHero from "@/components/PageHero";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useGoals, useMilestones } from "@/lib/use-goals";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, isPast } from "date-fns";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const UNITS = ["percent", "hours", "sessions", "pages", "km", "reps", "days", "tasks", "custom"];

export default function Goals() {
  const { goals, isLoading, addGoal, updateGoal, deleteGoal } = useGoals();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", target_value: "100", unit: "percent", deadline: undefined as Date | undefined });

  const resetForm = () => {
    setForm({ title: "", description: "", target_value: "100", unit: "percent", deadline: undefined });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title,
      description: form.description || undefined,
      target_value: parseInt(form.target_value) || 100,
      unit: form.unit,
      deadline: form.deadline ? format(form.deadline, "yyyy-MM-dd") : null,
    };

    if (editingId) {
      updateGoal({ id: editingId, updates: payload }, {
        onSuccess: () => { toast({ title: "Goal Updated! ✏️" }); resetForm(); },
      });
    } else {
      addGoal(payload, {
        onSuccess: () => { toast({ title: "Goal Created! 🎯" }); resetForm(); },
      });
    }
  };

  const handleEdit = (goal: any) => {
    setForm({
      title: goal.title,
      description: goal.description || "",
      target_value: String(goal.target_value),
      unit: goal.unit,
      deadline: goal.deadline ? new Date(goal.deadline) : undefined,
    });
    setEditingId(goal.id);
    setShowForm(true);
  };

  const handleProgress = (goal: any, delta: number) => {
    const newVal = Math.max(0, Math.min(goal.target_value, goal.current_value + delta));
    const isComplete = newVal >= goal.target_value;
    updateGoal({ id: goal.id, updates: { current_value: newVal, completed: isComplete } }, {
      onSuccess: () => {
        if (isComplete) {
          toast({ title: "🎉 Goal Complete!", description: `You reached your target for "${goal.title}"!`, duration: 3000 });
        }
      },
    });
  };

  const activeGoals = goals.filter((g: any) => !g.completed);
  const completedGoals = goals.filter((g: any) => g.completed);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-56" />
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-6">
      <motion.div variants={item}>
        <PageHero
          eyebrow="Your Targets"
          title="Goals"
          subtitle="Set targets, track milestones, and crush them"
          icon={Crosshair}
          progress={goals.length > 0 ? Math.round(goals.reduce((sum: number, g: any) => sum + (g.current_value / g.target_value) * 100, 0) / goals.length) : 0}
          stats={[
            { icon: Target, label: "Active", value: activeGoals.length },
            { icon: CheckCircle2, label: "Done", value: completedGoals.length },
            { icon: Flag, label: "Total", value: goals.length },
          ]}
        />
      </motion.div>
      <motion.div variants={item} className="flex justify-end">
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-1" /> New Goal
        </Button>
      </motion.div>

      {/* Create / Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Edit Goal" : "Create New Goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="Goal title (e.g., Read 30 books)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="resize-none" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Target</label>
                <Input type="number" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Unit</label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Deadline (optional)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.deadline && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {form.deadline ? format(form.deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.deadline} onSelect={(d) => setForm({ ...form, deadline: d })} disabled={(d) => d < new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleSubmit} className="w-full bg-gradient-primary text-primary-foreground">
              <Save className="h-4 w-4 mr-2" /> {editingId ? "Update" : "Create"} Goal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Goals */}
      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <motion.div variants={item}>
          <Card className="p-8 text-center">
            <Crosshair className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground mb-3">No goals yet. Set your first goal to start tracking!</p>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> Create Goal
            </Button>
          </Card>
        </motion.div>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-semibold text-lg">Active Goals</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {activeGoals.map((goal: any) => (
                  <GoalCard key={goal.id} goal={goal} expanded={expandedId === goal.id} onToggle={() => setExpandedId(expandedId === goal.id ? null : goal.id)} onEdit={() => handleEdit(goal)} onDelete={() => deleteGoal(goal.id)} onProgress={handleProgress} />
                ))}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-semibold text-lg text-muted-foreground">Completed ({completedGoals.length})</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {completedGoals.map((goal: any) => (
                  <GoalCard key={goal.id} goal={goal} expanded={expandedId === goal.id} onToggle={() => setExpandedId(expandedId === goal.id ? null : goal.id)} onEdit={() => handleEdit(goal)} onDelete={() => deleteGoal(goal.id)} onProgress={handleProgress} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

function GoalCard({ goal, expanded, onToggle, onEdit, onDelete, onProgress }: {
  goal: any; expanded: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void; onProgress: (goal: any, delta: number) => void;
}) {
  const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  const daysLeft = goal.deadline ? differenceInDays(new Date(goal.deadline), new Date()) : null;
  const overdue = goal.deadline && isPast(new Date(goal.deadline)) && !goal.completed;

  return (
    <motion.div variants={item}>
      <Card className={`p-4 space-y-3 transition-shadow hover:shadow-md ${goal.completed ? "opacity-75" : ""} ${overdue ? "border-destructive/40" : ""}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {goal.completed ? <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" /> : <Target className="h-5 w-5 text-primary flex-shrink-0" />}
              <h3 className={`font-display font-semibold text-base truncate ${goal.completed ? "line-through text-muted-foreground" : ""}`}>{goal.title}</h3>
            </div>
            {goal.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1 ml-7">{goal.description}</p>}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Edit3 className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{goal.current_value}/{goal.target_value} {goal.unit}</span>
            <span className={`font-medium ${pct >= 100 ? "text-success" : "text-primary"}`}>{pct}%</span>
          </div>
          <Progress value={pct} className="h-2.5" />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          {goal.deadline && (
            <Badge variant="outline" className={`text-[10px] ${overdue ? "border-destructive/50 text-destructive" : ""}`}>
              <Flag className="h-3 w-3 mr-1" />
              {overdue ? "Overdue" : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">{goal.unit}</Badge>
        </div>

        {/* Quick progress buttons */}
        {!goal.completed && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onProgress(goal, -1)}>-1</Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onProgress(goal, 1)}>+1</Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onProgress(goal, 5)}>+5</Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => onProgress(goal, 10)}>+10</Button>
          </div>
        )}

        {/* Expanded: Milestones */}
        {expanded && <MilestonesSection goalId={goal.id} />}

        {expanded && (
          <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Goal
          </Button>
        )}
      </Card>
    </motion.div>
  );
}

function MilestonesSection({ goalId }: { goalId: string }) {
  const { milestones, addMilestone, toggleMilestone, deleteMilestone } = useMilestones(goalId);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addMilestone({ title: newTitle, target_value: parseInt(newTarget) || 0 });
    setNewTitle("");
    setNewTarget("");
  };

  return (
    <div className="space-y-2 pt-2 border-t">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Milestones</h4>

      {milestones.map((m: any) => (
        <div key={m.id} className="flex items-center gap-2 group">
          <button onClick={() => toggleMilestone({ id: m.id, completed: m.completed })}>
            {m.completed ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
          </button>
          <span className={`text-sm flex-1 ${m.completed ? "line-through text-muted-foreground" : ""}`}>{m.title}</span>
          {m.target_value > 0 && <span className="text-[10px] text-muted-foreground">@{m.target_value}</span>}
          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => deleteMilestone(m.id)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      <div className="flex gap-2">
        <Input placeholder="Add milestone..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="text-sm h-8" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
        <Input placeholder="At" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} className="text-sm h-8 w-16" type="number" />
        <Button size="sm" variant="outline" className="h-8" onClick={handleAdd}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}
