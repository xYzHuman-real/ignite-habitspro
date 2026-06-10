import { useState } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { Check, Trash2, ChevronDown, Plus, Pencil, X, Calendar, Repeat, Zap, Paperclip, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Todo, Subtask } from "@/lib/use-enhanced-todos";
import { format, isPast, isToday } from "date-fns";

const TAG_COLORS: Record<string, string> = {
  Study: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Work: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Health: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Personal: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const PRIORITY_BAR: Record<string, string> = {
  high: "bg-destructive",
  medium: "bg-primary",
  low: "bg-blue-400 dark:bg-blue-500",
};

const POINTS_MAP: Record<string, number> = { high: 15, medium: 10, low: 5 };

interface TodoCardProps {
  todo: Todo;
  subtasks: Subtask[];
  onToggle: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onAddSubtask: (todoId: string, text: string) => void;
  onToggleSubtask: (id: string, completed: boolean) => void;
  onDeleteSubtask: (id: string) => void;
}

export function TodoCard({ todo, subtasks, onToggle, onDelete, onEdit, onAddSubtask, onToggleSubtask, onDeleteSubtask }: TodoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const x = useMotionValue(0);
  const controls = useAnimation();
  const rightBg = useTransform(x, [0, 100], [0, 1]);
  const leftBg = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const future = todo.due_date && !todo.completed && !isToday(new Date(todo.due_date)) && new Date(todo.due_date) > new Date();
    if (info.offset.x > 100 && !todo.completed && !future) {
      controls.start({ x: 0, transition: { duration: 0.2 } });
      onToggle(todo);
    } else if (info.offset.x < -100) {
      controls.start({ x: -400, opacity: 0, transition: { duration: 0.3 } }).then(() => onDelete(todo.id));
      return;
    } else {
      controls.start({ x: 0, transition: { duration: 0.2 } });
    }
  };

  const isOverdue = todo.due_date && !todo.completed && isPast(new Date(todo.due_date)) && !isToday(new Date(todo.due_date));
  const isFuture = todo.due_date && !todo.completed && !isToday(new Date(todo.due_date)) && new Date(todo.due_date) > new Date();
  const completedSubs = subtasks.filter(s => s.completed).length;
  const xpReward = POINTS_MAP[todo.priority] || 10;
  const hasAttachments = (todo.attachments || []).length > 0;
  const hasExpandable = subtasks.length > 0 || todo.notes || hasAttachments;

  const handleToggle = () => {
    if (isFuture) return;
    onToggle(todo);
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    onAddSubtask(todo.id, newSubtask);
    setNewSubtask("");
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe backgrounds */}
      <motion.div className="absolute inset-0 bg-success/20 rounded-2xl flex items-center pl-5" style={{ opacity: rightBg }}>
        <Check className="h-5 w-5 text-success" />
        <span className="text-xs text-success ml-2 font-medium">Complete</span>
      </motion.div>
      <motion.div className="absolute inset-0 bg-destructive/20 rounded-2xl flex items-center justify-end pr-5" style={{ opacity: leftBg }}>
        <span className="text-xs text-destructive mr-2 font-medium">Delete</span>
        <Trash2 className="h-5 w-5 text-destructive" />
      </motion.div>

      <motion.div
        style={{ x }}
        animate={controls}
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.1}
        dragDirectionLock
        onDragEnd={handleDragEnd}
        className={`relative bg-card rounded-2xl shadow-sm border ${isOverdue ? "border-destructive/40" : "border-border/30"} ${todo.completed ? "opacity-50" : ""}`}
      >
        {/* Priority color bar */}
        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${PRIORITY_BAR[todo.priority] || PRIORITY_BAR.medium}`} />

        <div className="pl-4 pr-3 py-3">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              onClick={handleToggle}
              disabled={isFuture}
              title={isFuture ? `Available on ${format(new Date(todo.due_date!), "MMM d")}` : undefined}
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 shrink-0 ${
                todo.completed ? "bg-success border-success scale-95" : "border-muted-foreground/25 hover:border-primary"
              } ${isFuture ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {todo.completed && <Check className="h-3 w-3 text-success-foreground" />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${todo.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>
                {todo.text}
              </p>

              {/* Meta row */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {todo.due_date && (
                  <span className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                    isOverdue ? "bg-destructive/10 text-destructive font-semibold" : "bg-muted/50 text-muted-foreground"
                  }`}>
                    <Calendar className="h-2.5 w-2.5" />
                    {format(new Date(todo.due_date), "MMM d")}
                  </span>
                )}
                {todo.recurring !== "none" && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 bg-muted/50 px-1.5 py-0.5 rounded-md">
                    <Repeat className="h-2.5 w-2.5" /> {todo.recurring}
                  </span>
                )}
                {(todo.tags || []).map(tag => (
                  <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${TAG_COLORS[tag] || "bg-muted text-muted-foreground"}`}>
                    {tag}
                  </span>
                ))}
                {subtasks.length > 0 && (
                  <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">
                    {completedSubs}/{subtasks.length}
                  </span>
                )}
                {hasAttachments && (
                  <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <Paperclip className="h-2.5 w-2.5" /> {todo.attachments.length}
                  </span>
                )}
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-1 shrink-0">
              {!todo.completed && (
                <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <Zap className="h-2.5 w-2.5" /> +{xpReward}
                </span>
              )}
              <Button variant="ghost" size="icon" onClick={() => onEdit(todo)} className="h-7 w-7 text-muted-foreground hover:text-primary">
                <Pencil className="h-3 w-3" />
              </Button>
              {hasExpandable && (
                <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)} className="h-7 w-7 text-muted-foreground">
                  <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
                    <ChevronDown className="h-3 w-3" />
                  </motion.div>
                </Button>
              )}
            </div>
          </div>

          {/* Subtask progress bar */}
          {subtasks.length > 0 && (
            <div className="mt-2 ml-8">
              <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-success rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedSubs / subtasks.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Expanded section */}
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-4 pb-3 border-t border-border/20">
            {todo.notes && (
              <p className="text-xs text-muted-foreground mt-2.5 bg-muted/30 rounded-xl p-2.5 leading-relaxed">{todo.notes}</p>
            )}

            {/* Attachments */}
            {hasAttachments && (
              <div className="mt-2.5 space-y-1">
                {todo.attachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-primary/5 hover:bg-primary/10 rounded-xl px-3 py-2 text-xs text-primary transition-colors"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{att.name}</span>
                  </a>
                ))}
              </div>
            )}

            {/* Subtasks */}
            <div className="mt-2.5 space-y-1.5">
              {subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => onToggleSubtask(sub.id, sub.completed)}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${sub.completed ? "bg-success border-success" : "border-muted-foreground/25"}`}
                  >
                    {sub.completed && <Check className="h-2.5 w-2.5 text-success-foreground" />}
                  </button>
                  <span className={`text-xs flex-1 ${sub.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{sub.text}</span>
                  <Button variant="ghost" size="icon" onClick={() => onDeleteSubtask(sub.id)} className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-1.5 mt-1">
                <Input
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddSubtask()}
                  placeholder="Add subtask..."
                  className="h-7 text-xs rounded-lg"
                />
                <Button size="icon" variant="ghost" onClick={handleAddSubtask} className="h-7 w-7 shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
