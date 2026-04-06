import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Tag, Repeat, FileText, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

const AVAILABLE_TAGS = ["Study", "Work", "Health", "Personal"];
const TAG_COLORS: Record<string, string> = {
  Study: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  Work: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  Health: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  Personal: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
};

interface Props {
  onAdd: (todo: { text: string; priority: string; due_date?: string | null; tags?: string[]; notes?: string; recurring?: string }) => void;
}

export function AddTodoForm({ onAdd }: Props) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [showMore, setShowMore] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [recurring, setRecurring] = useState("none");

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd({
      text,
      priority,
      due_date: dueDate ? dueDate.toISOString() : null,
      tags,
      notes,
      recurring,
    });
    setText("");
    setDueDate(undefined);
    setTags([]);
    setNotes("");
    setRecurring("none");
    setShowMore(false);
    toast.success("Task added!");
  };

  return (
    <Card className="p-3 shadow-md rounded-2xl border-border/50">
      <div className="flex gap-2">
        <Input
          placeholder="Add a new task..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !showMore && handleAdd()}
          className="flex-1 rounded-xl border-border/50"
        />
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-24 rounded-xl text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => setShowMore(!showMore)} className="h-10 w-10 shrink-0">
          <motion.div animate={{ rotate: showMore ? 180 : 0 }}>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </Button>
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button onClick={handleAdd} className="bg-gradient-primary text-primary-foreground rounded-xl h-10 w-10 p-0">
            <Plus className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      {showMore && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-3 space-y-3">
          {/* Due date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("flex-1 justify-start text-left text-xs rounded-xl h-9", !dueDate && "text-muted-foreground")}>
                  {dueDate ? format(dueDate, "PPP") : "Set due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex gap-1.5 flex-wrap">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                    tags.includes(tag) ? TAG_COLORS[tag] + " border-current" : "bg-muted/50 text-muted-foreground border-transparent hover:border-border"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Recurring */}
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-muted-foreground shrink-0" />
            <Select value={recurring} onValueChange={setRecurring}>
              <SelectTrigger className="flex-1 rounded-xl text-xs h-9">
                <SelectValue placeholder="No repeat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes, links, references..."
              className="flex-1 rounded-xl text-xs min-h-[60px]"
            />
          </div>
        </motion.div>
      )}
    </Card>
  );
}
