import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { isPast, isToday, isFuture } from "date-fns";

import { useEnhancedTodos, type Todo } from "@/lib/use-enhanced-todos";
import { useProfile } from "@/lib/supabase-hooks";
import { TodoCard } from "@/components/todos/TodoCard";
import { AddTodoForm } from "@/components/todos/AddTodoForm";
import { TodoFilters } from "@/components/todos/TodoFilters";
import { EditTodoSheet } from "@/components/todos/EditTodoSheet";
import { TodoCalendarView } from "@/components/todos/TodoCalendarView";
import { ProductivitySummary } from "@/components/todos/ProductivitySummary";

const POINTS_MAP: Record<string, number> = { high: 15, medium: 10, low: 5 };

function CollapsibleSection({ title, count, children, defaultOpen = true }: {
  title: string; count: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 group">
        <motion.div animate={{ rotate: open ? 0 : -90 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{count}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 mt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Todos() {
  const { todos, subtasks, isLoading, addTodo, updateTodo, toggleTodo, deleteTodo, addSubtask, toggleSubtask, deleteSubtask, reorderTodos } = useEnhancedTodos();
  const { profile } = useProfile();
  const { resolvedTheme, setTheme } = useTheme();

  const [editTodo, setEditTodo] = useState<Todo | null>(null);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Long-press drag state
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragEnabled, setDragEnabled] = useState<string | null>(null);

  const handleToggle = (todo: Todo) => {
    toggleTodo({ id: todo.id, completed: todo.completed });
    if (!todo.completed) {
      const pts = POINTS_MAP[todo.priority] || 10;
      toast.success(`+${pts} XP earned! 🎉`);
    }
  };

  const handleLongPressStart = useCallback((todoId: string) => {
    longPressTimer.current = setTimeout(() => {
      setDragEnabled(todoId);
      toast.info("Drag to reorder", { duration: 1500 });
    }, 4000);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  // Filtered todos
  const filtered = useMemo(() => {
    let result = [...todos];
    if (search) result = result.filter(t => t.text.toLowerCase().includes(search.toLowerCase()));
    if (filterPriority !== "all") result = result.filter(t => t.priority === filterPriority);
    if (filterTag !== "all") result = result.filter(t => (t.tags || []).includes(filterTag));
    if (filterStatus === "pending") result = result.filter(t => !t.completed);
    if (filterStatus === "completed") result = result.filter(t => t.completed);
    if (filterStatus === "overdue") result = result.filter(t => !t.completed && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));
    return result;
  }, [todos, search, filterPriority, filterTag, filterStatus]);

  // Group tasks
  const overdueTasks = filtered.filter(t => !t.completed && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));
  const highPriority = filtered.filter(t => !t.completed && t.priority === "high" && !overdueTasks.includes(t));
  const todayTasks = filtered.filter(t => !t.completed && t.priority !== "high" && !overdueTasks.includes(t) && (!t.due_date || isToday(new Date(t.due_date)) || !isFuture(new Date(t.due_date))));
  const upcomingTasks = filtered.filter(t => !t.completed && t.due_date && isFuture(new Date(t.due_date)) && !isToday(new Date(t.due_date)) && !highPriority.includes(t));
  const completedTasks = filtered.filter(t => t.completed);

  const totalCompleted = todos.filter(t => t.completed).length;
  const progressPct = todos.length > 0 ? (totalCompleted / todos.length) * 100 : 0;

  const getSubtasks = (todoId: string) => subtasks.filter(s => s.todo_id === todoId);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 px-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-14" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  const renderSection = (title: string, tasks: Todo[], defaultOpen = true) => {
    if (tasks.length === 0) return null;
    return (
      <CollapsibleSection title={title} count={tasks.length} defaultOpen={defaultOpen}>
        <AnimatePresence>
          {tasks.map(todo => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              onPointerDown={() => handleLongPressStart(todo.id)}
              onPointerUp={handleLongPressEnd}
              onPointerLeave={handleLongPressEnd}
            >
              <TodoCard
                todo={todo}
                subtasks={getSubtasks(todo.id)}
                onToggle={handleToggle}
                onDelete={deleteTodo}
                onEdit={setEditTodo}
                onAddSubtask={(todoId, text) => addSubtask({ todoId, text })}
                onToggleSubtask={(id, completed) => toggleSubtask({ id, completed })}
                onDeleteSubtask={deleteSubtask}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </CollapsibleSection>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 px-4 pb-32">
      {/* Header */}
      <Card className="p-5 bg-card/80 backdrop-blur-xl border-border/50 shadow-lg rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">To-Do List</h1>
            <p className="text-sm text-muted-foreground">{totalCompleted}/{todos.length} tasks completed</p>
          </div>
          <ThemeToggle theme={(resolvedTheme as "light" | "dark") || "light"} toggle={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} />
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progressPct} className="flex-1 h-2" />
          <span className="text-xs font-semibold text-primary">{Math.round(progressPct)}%</span>
        </div>
      </Card>

      {/* Productivity Summary */}
      <ProductivitySummary todos={todos} />

      {/* Add Task */}
      <AddTodoForm onAdd={addTodo} />

      {/* Filters & Search */}
      <TodoFilters
        search={search} onSearchChange={setSearch}
        filterPriority={filterPriority} onFilterPriority={setFilterPriority}
        filterTag={filterTag} onFilterTag={setFilterTag}
        filterStatus={filterStatus} onFilterStatus={setFilterStatus}
        viewMode={viewMode} onViewMode={setViewMode}
      />

      {todos.length === 0 && (
        <Card className="p-8 text-center rounded-2xl">
          <p className="text-muted-foreground">No tasks yet. Add one above to get started! ✅</p>
        </Card>
      )}

      {viewMode === "calendar" ? (
        <TodoCalendarView todos={filtered} onToggle={handleToggle} />
      ) : (
        <div className="space-y-4">
          {renderSection("🔴 Overdue", overdueTasks)}
          {renderSection("🔥 High Priority", highPriority)}
          {renderSection("📋 Today", todayTasks)}
          {renderSection("📅 Upcoming", upcomingTasks)}
          {renderSection("✅ Completed", completedTasks, false)}
        </div>
      )}

      {/* Edit Sheet */}
      <EditTodoSheet
        todo={editTodo}
        open={!!editTodo}
        onOpenChange={open => !open && setEditTodo(null)}
        onSave={(id, updates) => updateTodo({ id, updates })}
      />
    </div>
  );
}
