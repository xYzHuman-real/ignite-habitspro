import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { format, isSameDay } from "date-fns";
import type { Todo } from "@/lib/use-enhanced-todos";

interface Props {
  todos: Todo[];
  onToggle: (todo: Todo) => void;
}

export function TodoCalendarView({ todos, onToggle }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const tasksOnDate = useMemo(() => {
    if (!selectedDate) return [];
    return todos.filter(t => t.due_date && isSameDay(new Date(t.due_date), selectedDate));
  }, [todos, selectedDate]);

  const datesWithTasks = useMemo(() => {
    const dates: Date[] = [];
    todos.forEach(t => {
      if (t.due_date) dates.push(new Date(t.due_date));
    });
    return dates;
  }, [todos]);

  return (
    <div className="space-y-3">
      <Card className="p-2 rounded-2xl border-border/50">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="p-3 pointer-events-auto mx-auto"
          modifiers={{ hasTasks: datesWithTasks }}
          modifiersClassNames={{ hasTasks: "bg-primary/10 font-bold text-primary" }}
        />
      </Card>

      {selectedDate && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {format(selectedDate, "EEEE, MMM d")} · {tasksOnDate.length} tasks
          </h3>
          {tasksOnDate.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks on this date</p>
          )}
          {tasksOnDate.map(todo => (
            <Card key={todo.id} className="p-3 rounded-xl border-border/50 flex items-center gap-3">
              <button
                onClick={() => onToggle(todo)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  todo.completed ? "bg-success border-success" : "border-muted-foreground/30"
                }`}
              >
                {todo.completed && <Check className="h-3 w-3 text-success-foreground" />}
              </button>
              <span className={`text-sm flex-1 ${todo.completed ? "line-through text-muted-foreground" : ""}`}>{todo.text}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                todo.priority === "high" ? "bg-destructive/10 text-destructive" :
                todo.priority === "medium" ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" :
                "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
              }`}>{todo.priority}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
