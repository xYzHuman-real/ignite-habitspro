import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Tag } from "lucide-react";
import type { Todo } from "@/lib/use-enhanced-todos";

const AVAILABLE_TAGS = ["Study", "Work", "Health", "Personal"];
const TAG_COLORS: Record<string, string> = {
  Study: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  Work: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  Health: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  Personal: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
};

interface Props {
  todo: Todo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Record<string, unknown>) => void;
}

export function EditTodoSheet({ todo, open, onOpenChange, onSave }: Props) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [recurring, setRecurring] = useState("none");

  useEffect(() => {
    if (todo) {
      setText(todo.text);
      setPriority(todo.priority);
      setDueDate(todo.due_date ? new Date(todo.due_date) : undefined);
      setTags(todo.tags || []);
      setNotes(todo.notes || "");
      setRecurring(todo.recurring || "none");
    }
  }, [todo]);

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSave = () => {
    if (!todo) return;
    onSave(todo.id, {
      text,
      priority,
      due_date: dueDate ? dueDate.toISOString() : null,
      tags,
      notes,
      recurring,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Task</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <Input value={text} onChange={e => setText(e.target.value)} placeholder="Task name" className="rounded-xl" />

          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start rounded-xl", !dueDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Set due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><Tag className="h-3 w-3" /> Tags</label>
            <div className="flex gap-1.5 flex-wrap">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    tags.includes(tag) ? TAG_COLORS[tag] + " border-current" : "bg-muted/50 text-muted-foreground border-transparent"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <Select value={recurring} onValueChange={setRecurring}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Recurring" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No repeat</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>

          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes, links, references..." className="rounded-xl min-h-[80px]" />

          <Button onClick={handleSave} className="w-full rounded-xl">Save Changes</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
