import { useState } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { Check, Trash2, ChevronDown, Plus, Pencil, X, Calendar, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Todo, Subtask } from "@/lib/use-enhanced-todos";
import { format, isPast, isToday } from "date-fns";

const TAG_COLORS: Record<string, string> = {
  Study: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  Work: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  Health: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  Personal: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
};

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
    if (info.offset.x > 100 && !todo.completed) {
      controls.start({ x: 0, transition: { duration: 0.2 } });
      onToggle(todo);
    } else if (info.offset.x < -100) {
      controls.start({ x: -400, opacity: 0, transition: { duration: 0.3 } }).then(() => onDelete(todo.id));
      return;
    } else {
      controls.start({ x: 0, transition: { duration: 0.2 } });
    }
  };

  const priorityStyle = todo.priority === "high"
    ? "bg-destructive/10 text-destructive"
    : todo.priority === "medium"
    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";

  const isOverdue = todo.due_date && !todo.completed && isPast(new Date(todo.due_date)) && !isToday(new Date(todo.due_date));
  const completedSubs = subtasks.filter(s => s.completed).length;

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    onAddSubtask(todo.id, newSubtask);
    setNewSubtask("");
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <motion.div className="absolute inset-0 bg-success/20 rounded-2xl flex items-center pl-6" style={{ opacity: rightBg }}>
        <Check className="h-5 w-5 text-success" />
      </motion.div>
      <motion.div className="absolute inset-0 bg-destructive/20 rounded-2xl flex items-center justify-end pr-6" style={{ opacity: leftBg }}>
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
        className={`relative bg-card rounded-2xl shadow-sm border ${isOverdue ? "border-destructive/50" : "border-border/50"} ${todo.completed ? "opacity-60" : ""}`}
      >
        <div className="p-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggle(todo)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                todo.completed ? "bg-success border-success" : "border-muted-foreground/30 hover:border-primary"
              }`}
            >
              {todo.completed && <Check className="h-3 w-3 text-success-foreground" />}
            </button>
            <div className="flex-1 min-w-0">
              <span className={`text-sm block ${todo.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {todo.text}
              </span>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {todo.due_date && (
                  <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                    <Calendar className="h-3 w-3" />
                    {format(new Date(todo.due_date), "MMM d")}
                  </span>
                )}
                {todo.recurring !== "none" && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Repeat className="h-3 w-3" /> {todo.recurring}
                  </span>
                )}
                {(todo.tags || []).map(tag => (
                  <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full ${TAG_COLORS[tag] || "bg-muted text-muted-foreground"}`}>
                    {tag}
                  </span>
                ))}
                {subtasks.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{completedSubs}/{subtasks.length} subtasks</span>
                )}
              </div>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${priorityStyle}`}>
              {todo.priority}
            </span>
            <Button variant="ghost" size="icon" onClick={() => onEdit(todo)} className="h-7 w-7 text-muted-foreground hover:text-primary shrink-0">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {(subtasks.length > 0 || todo.notes) && (
              <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)} className="h-7 w-7 text-muted-foreground shrink-0">
                <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.div>
              </Button>
            )}
          </div>
        </div>

        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="px-3 pb-3 border-t border-border/30">
            {todo.notes && (
              <p className="text-xs text-muted-foreground mt-2 bg-muted/50 rounded-lg p-2">{todo.notes}</p>
            )}
            <div className="mt-2 space-y-1.5">
              {subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => onToggleSubtask(sub.id, sub.completed)}
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${sub.completed ? "bg-success border-success" : "border-muted-foreground/30"}`}
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
