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
import { CalendarIcon, Tag, Link2, Paperclip, X, Repeat } from "lucide-react";
import type { Todo, Attachment } from "@/lib/use-enhanced-todos";

const AVAILABLE_TAGS = ["Study", "Work", "Health", "Personal"];
const TAG_COLORS: Record<string, string> = { Study: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400", Work: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400", Health: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400", Personal: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" };
const REPEAT_LABELS: Record<string, string> = { none: "No repeat", daily: "Daily", weekly: "Weekly", monthly: "Monthly" };
const normalizeUrl = (url: string) => { const value = url.trim(); return /^https?:\/\//i.test(value) ? value : `https://${value}`; };

interface Props { todo: Todo | null; open: boolean; onOpenChange: (open: boolean) => void; onSave: (id: string, updates: Record<string, unknown>) => void; }

export function EditTodoSheet({ todo, open, onOpenChange, onSave }: Props) {
  const [text, setText] = useState(""); const [priority, setPriority] = useState("medium"); const [dueDate, setDueDate] = useState<Date | undefined>(); const [tags, setTags] = useState<string[]>([]); const [notes, setNotes] = useState(""); const [recurring, setRecurring] = useState("none"); const [attachments, setAttachments] = useState<Attachment[]>([]); const [linkUrl, setLinkUrl] = useState(""); const [linkName, setLinkName] = useState("");
  useEffect(() => { if (todo) { setText(todo.text); setPriority(todo.priority); setDueDate(todo.due_date ? new Date(todo.due_date) : undefined); setTags(todo.tags || []); setNotes(todo.notes || ""); setRecurring(todo.recurring || "none"); setAttachments(todo.attachments || []); } }, [todo]);
  const toggleTag = (tag: string) => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const addLink = () => { if (!linkUrl.trim()) return; const url = normalizeUrl(linkUrl); const type: Attachment["type"] = url.includes("docs.google.com") ? "google_doc" : url.includes("drive.google.com") ? "google_drive" : "link"; setAttachments(prev => [...prev, { type, name: linkName || url, url }]); setLinkUrl(""); setLinkName(""); };
  const handleSave = () => { if (!todo) return; onSave(todo.id, { text, priority, due_date: dueDate ? dueDate.toISOString() : null, tags, notes, recurring, attachments }); onOpenChange(false); };

  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+5rem)]"><SheetHeader><SheetTitle className="text-lg font-display">Edit Task</SheetTitle></SheetHeader><div className="space-y-4 mt-4">
    <Input value={text} onChange={e => setText(e.target.value)} placeholder="Task name" className="rounded-2xl h-12" />
    <div className="flex gap-2">{(["low", "medium", "high"] as const).map(p => <button key={p} onClick={() => setPriority(p)} className={cn("flex-1 py-2 rounded-xl text-xs font-semibold capitalize border transition-all", priority === p ? p === "high" ? "bg-destructive/10 text-destructive border-destructive/30" : p === "medium" ? "bg-primary/10 text-primary border-primary/30" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800" : "bg-muted/30 text-muted-foreground border-transparent")}>{p}</button>)}</div>
    <div><label className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> Due Date</label><Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start rounded-2xl h-10", !dueDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dueDate ? format(dueDate, "PPP") : "Set due date"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" /></PopoverContent></Popover></div>
    <div><label className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><Tag className="h-3 w-3" /> Tags</label><div className="flex gap-2 flex-wrap">{AVAILABLE_TAGS.map(tag => <button key={tag} onClick={() => toggleTag(tag)} className={cn("text-xs px-3 py-1.5 rounded-full border transition-all", tags.includes(tag) ? TAG_COLORS[tag] + " border-current" : "bg-muted/30 text-muted-foreground border-transparent")}>{tag}</button>)}</div></div>
    <div><label className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-2"><Repeat className="h-3 w-3" /> Repeat</label><Select value={recurring} onValueChange={setRecurring}><SelectTrigger className="rounded-2xl h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No repeat</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select><p className="text-[10px] text-primary mt-1.5">{REPEAT_LABELS[recurring]}</p></div>
    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes, links, references..." className="rounded-2xl min-h-[80px]" />
    <div><label className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><Paperclip className="h-3 w-3" /> Links & Attachments</label>{attachments.map((att, i) => <div key={i} className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-2 text-xs mb-1.5"><Link2 className="h-3 w-3 text-primary shrink-0" /><span className="truncate flex-1">{att.name}</span><button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}><X className="h-3 w-3 text-muted-foreground" /></button></div>)}<div className="flex gap-2"><Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="Paste link..." className="rounded-xl h-8 text-xs flex-1" /><Button size="sm" variant="outline" onClick={addLink} className="rounded-xl h-8 text-xs">Add</Button></div></div>
    <Button onClick={handleSave} className="w-full rounded-2xl h-12 font-semibold">Save Changes</Button>
  </div></SheetContent></Sheet>;
}
