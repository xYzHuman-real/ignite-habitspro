import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Calendar, Tag, Repeat, FileText, Link2, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Attachment } from "@/lib/use-enhanced-todos";

const AVAILABLE_TAGS = ["Study", "Work", "Health", "Personal"];
const TAG_COLORS: Record<string, string> = {
  Study: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  Work: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  Health: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  Personal: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-destructive text-destructive-foreground",
  medium: "bg-primary text-primary-foreground",
  low: "bg-muted text-muted-foreground",
};

interface Props {
  onAdd: (todo: { text: string; priority: string; due_date?: string | null; tags?: string[]; notes?: string; recurring?: string; attachments?: Attachment[] }) => void;
}

export function AddTodoForm({ onAdd }: Props) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [recurring, setRecurring] = useState("none");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkName, setLinkName] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const addLink = () => {
    if (!linkUrl.trim()) return;
    const type: Attachment["type"] = linkUrl.includes("docs.google.com") ? "google_doc"
      : linkUrl.includes("drive.google.com") ? "google_drive"
      : "link";
    setAttachments(prev => [...prev, { type, name: linkName || linkUrl, url: linkUrl }]);
    setLinkUrl("");
    setLinkName("");
    setShowLinkInput(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuickAdd = () => {
    if (!text.trim()) return;
    onAdd({ text, priority });
    setText("");
    toast.success("Task added!");
  };

  const handleFullAdd = () => {
    if (!text.trim()) return;
    onAdd({
      text, priority,
      due_date: dueDate ? dueDate.toISOString() : null,
      tags, notes, recurring, attachments,
    });
    setText("");
    setDueDate(undefined);
    setTags([]);
    setNotes("");
    setRecurring("none");
    setAttachments([]);
    setSheetOpen(false);
    toast.success("Task added!");
  };

  return (
    <>
      {/* Compact inline bar */}
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Add a task..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleQuickAdd()}
          className="flex-1 h-11 rounded-2xl border-border/40 bg-card text-sm shadow-sm"
        />
        <button
          onClick={() => {
            const next = priority === "medium" ? "high" : priority === "high" ? "low" : "medium";
            setPriority(next);
          }}
          className={cn("h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors", PRIORITY_COLORS[priority])}
          title={`Priority: ${priority}`}
        >
          {priority[0].toUpperCase()}
        </button>
        <Button onClick={handleQuickAdd} size="icon" className="h-11 w-11 rounded-2xl bg-primary text-primary-foreground shadow-md shrink-0">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Expand button to open full sheet */}
      <button
        onClick={() => setSheetOpen(true)}
        className="text-xs text-muted-foreground flex items-center gap-1 mt-1 ml-1 hover:text-primary transition-colors"
      >
        <Plus className="h-3 w-3" /> Add details, due date, attachments...
      </button>

      {/* Full creation sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+6rem)]">
          <SheetHeader>
            <SheetTitle className="text-lg font-display">New Task</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 mt-4">
            <Input value={text} onChange={e => setText(e.target.value)} placeholder="What do you need to do?" className="rounded-2xl h-12 text-base" />

            {/* Priority */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Priority</label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all border",
                      priority === p
                        ? p === "high" ? "bg-destructive/10 text-destructive border-destructive/30"
                          : p === "medium" ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                        : "bg-muted/30 text-muted-foreground border-transparent"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Calendar className="h-3 w-3" /> Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start rounded-2xl h-10", !dueDate && "text-muted-foreground")}>
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Tag className="h-3 w-3" /> Tags</label>
              <div className="flex gap-2 flex-wrap">
                {AVAILABLE_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-all",
                      tags.includes(tag) ? TAG_COLORS[tag] + " border-current" : "bg-muted/30 text-muted-foreground border-transparent hover:border-border"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Recurring */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Repeat className="h-3 w-3" /> Repeat</label>
              <Select value={recurring} onValueChange={setRecurring}>
                <SelectTrigger className="rounded-2xl h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><FileText className="h-3 w-3" /> Notes</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes, references..." className="rounded-2xl min-h-[80px] text-sm" />
            </div>

            {/* Attachments */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><Paperclip className="h-3 w-3" /> Attachments</label>
              {attachments.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {attachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2 text-xs">
                      <Link2 className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate flex-1">{att.name}</span>
                      <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}

              <AnimatePresence>
                {showLinkInput && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden">
                    <Input value={linkName} onChange={e => setLinkName(e.target.value)} placeholder="Link name (optional)" className="rounded-xl h-9 text-xs" />
                    <div className="flex gap-2">
                      <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="Paste URL..." className="rounded-xl h-9 text-xs flex-1" />
                      <Button size="sm" onClick={addLink} className="rounded-xl h-9 text-xs">Add</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setShowLinkInput(!showLinkInput)} className="rounded-xl text-xs gap-1 h-8">
                  <Link2 className="h-3 w-3" /> Add Link
                </Button>
              </div>
            </div>

            <Button onClick={handleFullAdd} className="w-full rounded-2xl h-12 text-sm font-semibold bg-primary text-primary-foreground shadow-md">
              Create Task
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
