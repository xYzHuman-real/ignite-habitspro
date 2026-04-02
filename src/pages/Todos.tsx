import { useState, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { Plus, Trash2, Check, ChevronDown, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTodos, useProfile } from "@/lib/supabase-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import { toast } from "sonner";

// Points config
const POINTS_MAP: Record<string, number> = { high: 15, medium: 10, low: 5 };

function TodoCard({ todo, onToggle, onDelete }: {
  todo: any;
  onToggle: (t: any) => void;
  onDelete: (id: string) => void;
}) {
  const x = useMotionValue(0);
  const controls = useAnimation();

  const rightBg = useTransform(x, [0, 100], [0, 1]);
  const leftBg = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100 && !todo.completed) {
      controls.start({ x: 0, transition: { duration: 0.2, ease: "easeOut" } });
      onToggle(todo);
    } else if (info.offset.x < -100) {
      controls.start({ x: -400, opacity: 0, transition: { duration: 0.3 } }).then(() => {
        onDelete(todo.id);
      });
      return;
    } else {
      controls.start({ x: 0, transition: { duration: 0.2, ease: "easeOut" } });
    }
  };

  const priorityStyle = todo.priority === "high"
    ? "bg-destructive/10 text-destructive"
    : todo.priority === "medium"
    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400";

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe right bg (complete) */}
      <motion.div
        className="absolute inset-0 bg-success/20 rounded-2xl flex items-center pl-6"
        style={{ opacity: rightBg }}
      >
        <Check className="h-5 w-5 text-success" />
      </motion.div>
      {/* Swipe left bg (delete) */}
      <motion.div
        className="absolute inset-0 bg-destructive/20 rounded-2xl flex items-center justify-end pr-6"
        style={{ opacity: leftBg }}
      >
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
        className={`relative bg-card rounded-2xl p-3 shadow-sm border border-border/50 ${todo.completed ? "opacity-60" : ""}`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(todo)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
              todo.completed ? "bg-success border-success" : "border-muted-foreground/30 hover:border-primary"
            }`}
          >
            {todo.completed && <Check className="h-3 w-3 text-success-foreground" />}
          </button>
          <span className={`flex-1 text-sm ${todo.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {todo.text}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityStyle}`}>
            {todo.priority}
          </span>
          <Button variant="ghost" size="icon" onClick={() => onDelete(todo.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function CollapsibleSection({ title, count, children, defaultOpen = true }: {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 group">
        <motion.div
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{count}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 mt-1">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Todos() {
  const { todos, isLoading, addTodo, toggleTodo, deleteTodo } = useTodos();
  const { profile } = useProfile();
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState("medium");

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    addTodo({ text: newTodo, priority });
    setNewTodo("");
    toast.success("Task added!");
  };

  const handleToggle = (todo: any) => {
    toggleTodo({ id: todo.id, completed: todo.completed });
    if (!todo.completed) {
      const pts = POINTS_MAP[todo.priority] || 10;
      toast.success(`+${pts} points earned! 🎉`);
    }
  };

  const completed = todos.filter((t) => t.completed).length;
  const progressPct = todos.length > 0 ? (completed / todos.length) * 100 : 0;

  // Group tasks
  const highPriority = todos.filter(t => !t.completed && t.priority === "high");
  const todayTasks = todos.filter(t => !t.completed && t.priority !== "high");
  const completedTasks = todos.filter(t => t.completed);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 px-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-14" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 px-4 pb-32">
      {/* Glassmorphism Header */}
      <Card className="p-5 bg-card/80 backdrop-blur-xl border-border/50 shadow-lg rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">To-Do List</h1>
            <p className="text-sm text-muted-foreground">{completed}/{todos.length} tasks completed today</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progressPct} className="flex-1 h-2" />
          <span className="text-xs font-semibold text-primary">{Math.round(progressPct)}%</span>
        </div>
      </Card>

      {/* Quick Add */}
      <Card className="p-3 shadow-md rounded-2xl border-border/50">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 rounded-xl border-border/50"
          />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-28 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button onClick={handleAdd} className="bg-gradient-primary text-primary-foreground rounded-xl h-10 w-10 p-0">
              <Plus className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </Card>

      {todos.length === 0 && (
        <Card className="p-8 text-center rounded-2xl">
          <p className="text-muted-foreground">No tasks yet. Add one above to get started! ✅</p>
        </Card>
      )}

      {/* Collapsible Sections */}
      <div className="space-y-4">
        {highPriority.length > 0 && (
          <CollapsibleSection title="High Priority" count={highPriority.length}>
            <AnimatePresence>
              {highPriority.map(todo => (
                <motion.div key={todo.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}>
                  <TodoCard todo={todo} onToggle={handleToggle} onDelete={deleteTodo} />
                </motion.div>
              ))}
            </AnimatePresence>
          </CollapsibleSection>
        )}

        {todayTasks.length > 0 && (
          <CollapsibleSection title="Today" count={todayTasks.length}>
            <AnimatePresence>
              {todayTasks.map(todo => (
                <motion.div key={todo.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}>
                  <TodoCard todo={todo} onToggle={handleToggle} onDelete={deleteTodo} />
                </motion.div>
              ))}
            </AnimatePresence>
          </CollapsibleSection>
        )}

        {completedTasks.length > 0 && (
          <CollapsibleSection title="Completed" count={completedTasks.length} defaultOpen={false}>
            <AnimatePresence>
              {completedTasks.map(todo => (
                <motion.div key={todo.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}>
                  <TodoCard todo={todo} onToggle={handleToggle} onDelete={deleteTodo} />
                </motion.div>
              ))}
            </AnimatePresence>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}
