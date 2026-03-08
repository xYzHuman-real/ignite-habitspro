import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTodos } from "@/lib/supabase-hooks";
import { Skeleton } from "@/components/ui/skeleton";

export default function Todos() {
  const { todos, isLoading, addTodo, toggleTodo, deleteTodo } = useTodos();
  const [newTodo, setNewTodo] = useState("");
  const [priority, setPriority] = useState("medium");

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    addTodo({ text: newTodo, priority });
    setNewTodo("");
  };

  const completed = todos.filter((t) => t.completed).length;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-14" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">To-Do List</h1>
        <p className="text-muted-foreground">{completed}/{todos.length} tasks completed</p>
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1"
          />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} className="bg-gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {todos.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No tasks yet. Add one above to get started! ✅</p>
        </Card>
      )}

      <div className="space-y-2">
        <AnimatePresence>
          {todos.map((todo) => (
            <motion.div
              key={todo.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
            >
              <Card className={`p-3 flex items-center gap-3 transition-all ${todo.completed ? "opacity-60" : ""}`}>
                <button
                  onClick={() => toggleTodo({ id: todo.id, completed: todo.completed })}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                    todo.completed ? "bg-success border-success" : "border-muted-foreground/30 hover:border-primary"
                  }`}
                >
                  {todo.completed && <Check className="h-3 w-3 text-success-foreground" />}
                </button>
                <span className={`flex-1 text-sm ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                  {todo.text}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  todo.priority === "high" ? "bg-destructive/10 text-destructive" :
                  todo.priority === "medium" ? "bg-accent/30 text-accent-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {todo.priority}
                </span>
                <Button variant="ghost" size="icon" onClick={() => deleteTodo(todo.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
