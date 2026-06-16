import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { isPast, isToday, isFuture } from "date-fns";

import { useEnhancedTodos, type Todo } from "@/lib/use-enhanced-todos";
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
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </motion.div>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
        <span className="text-[10px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded-full">{count}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 mt-1">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function Todos() {
  const { todos, subtasks, isLoading, addTodo, updateTodo, toggleTodo, deleteTodo, addSubtask, toggleSubtask, deleteSubtask } = useEnhancedTodos();

  const [editTodo, setEditTodo] = useState<Todo | null>(null);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showFab, setShowFab] = useState(false);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleToggle = (todo: Todo) => {
    toggleTodo({ id: todo.id, completed: todo.completed });
    if (!todo.completed) {
      const pts = POINTS_MAP[todo.priority] || 10;
      toast.success(`+${pts} XP earned! 🎉`);
    }
  };

  const handleLongPressStart = useCallback((todoId: string) => {
    longPressTimer.current = setTimeout(() => {
      toast.info("Drag to reorder", { duration: 1500 });
    }, 4000);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const filtered = useMemo(() => {
    let result = [...todos];
    if (search) result = result.filter(t => t.text.toLowerCase().includes(search.toLowerCase()));
    if (filterPriority !== "all") result = result.filter(t => t.priority === filterPriority);
    if (filterTag !== "all") result = result.filter(t => (t.tags || []).includes(filterTag));
    if (filterStatus === "pending") result = result.filter(t => !t.completed);
    if (filterStatus === "completed") result = result.filter(t => t.completed);
    if (filterStatus === "overdue") result = result.filter(t => !t.completed && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));
    if (filterStatus === "upcoming") result = result.filter(t => !t.completed && t.due_date && isFuture(new Date(t.due_date)) && !isToday(new Date(t.due_date)));
    return result;
  }, [todos, search, filterPriority, filterTag, filterStatus]);

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
      <div className="max-w-lg mx-auto space-y-3 px-4 pt-2">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-11 rounded-2xl" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
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
              initial={{ opacity: 0, y: -8 }}
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
    <div className="max-w-lg mx-auto px-4 pb-32 space-y-5">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-[28px] font-display font-semibold tracking-tight text-foreground">Tasks</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {todos.length === 0
            ? "Add your first task."
            : `${totalCompleted} of ${todos.length} done · ${Math.round(progressPct)}%`}
        </p>
      </div>

      {/* Productivity Summary */}
      <ProductivitySummary todos={todos} />

      {/* Add Task */}
      <AddTodoForm onAdd={addTodo} />

      {/* Filters */}
      <TodoFilters
        search={search} onSearchChange={setSearch}
        filterPriority={filterPriority} onFilterPriority={setFilterPriority}
        filterTag={filterTag} onFilterTag={setFilterTag}
        filterStatus={filterStatus} onFilterStatus={setFilterStatus}
        viewMode={viewMode} onViewMode={setViewMode}
      />

      {todos.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        </div>
      )}

      {viewMode === "calendar" ? (
        <TodoCalendarView todos={filtered} onToggle={handleToggle} />
      ) : (
        <div className="space-y-2">
          {renderSection("Overdue", overdueTasks)}
          {renderSection("High Priority", highPriority)}
          {renderSection("Today", todayTasks)}
          {renderSection("Upcoming", upcomingTasks)}
          {renderSection("Completed", completedTasks, false)}
        </div>
      )}

      {/* Subtle all-caught-up line, not a card */}
      {todos.length > 0 && completedTasks.length >= todayTasks.length && todayTasks.length === 0 && !isLoading && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-[13px] text-muted-foreground pt-2"
        >
          All caught up.
        </motion.p>
      )}

      {/* Edit Sheet */}
      <EditTodoSheet
        todo={editTodo}
        open={!!editTodo}
        onOpenChange={open => !open && setEditTodo(null)}
        onSave={(id, updates) => updateTodo({ id, updates })}
      />

      {/* Floating Add Button */}
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => {
          const input = document.querySelector<HTMLInputElement>('input[placeholder="Add a task..."]');
          input?.focus();
        }}
        className="fixed bottom-24 right-5 z-40 w-13 h-13 w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center"
        style={{ boxShadow: "0 8px 20px -6px hsl(220 30% 10% / 0.25)" }}
      >
        <Plus className="h-5 w-5" />
      </motion.button>
    </div>
  );
}
