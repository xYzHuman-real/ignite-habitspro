import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, X, Zap, Palette } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTodos } from "@/lib/supabase-hooks";
import { useFocusThemes, type FocusTheme } from "@/lib/use-focus-themes";

const PRESET_SUBJECTS = [
  "📐 Mathematics",
  "🔬 Science",
  "📖 English",
  "💻 Computer Science",
  "📚 History",
  "🌍 Geography",
  "🎨 Art",
  "🧪 Chemistry",
  "⚡ Physics",
  "📝 General Study",
];

interface TaskLinkPopupProps {
  open: boolean;
  onSelect: (task: { type: "task" | "subject"; label: string; id?: string } | null, theme?: string) => void;
  onClose: () => void;
}

export function TaskLinkPopup({ open, onSelect, onClose }: TaskLinkPopupProps) {
  const { todos } = useTodos();
  const { ownedThemes, currentTheme, selectTheme } = useFocusThemes();
  const [tab, setTab] = useState<"subjects" | "tasks">("subjects");
  const [customSubject, setCustomSubject] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(currentTheme.value);

  const incompleteTodos = todos.filter((t) => !t.completed);

  const handleSelectSubject = (subject: string) => {
    selectTheme(selectedTheme);
    onSelect({ type: "subject", label: subject }, selectedTheme);
  };

  const handleSelectTask = (todo: { id: string; text: string }) => {
    selectTheme(selectedTheme);
    onSelect({ type: "task", label: todo.text, id: todo.id }, selectedTheme);
  };

  const handleCustomSubject = () => {
    if (customSubject.trim()) {
      selectTheme(selectedTheme);
      onSelect({ type: "subject", label: customSubject.trim() }, selectedTheme);
      setCustomSubject("");
    }
  };

  const handleSkip = () => {
    selectTheme(selectedTheme);
    onSelect(null, selectedTheme);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            What are you focusing on?
          </DialogTitle>
          <DialogDescription>
            Link this session to a task or subject for better analytics.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 mt-2">
          <Button
            variant={tab === "subjects" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("subjects")}
            className={tab === "subjects" ? "bg-gradient-primary text-primary-foreground" : ""}
          >
            <BookOpen className="h-3.5 w-3.5 mr-1" /> Subjects
          </Button>
          <Button
            variant={tab === "tasks" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("tasks")}
            className={tab === "tasks" ? "bg-gradient-primary text-primary-foreground" : ""}
          >
            📋 Tasks ({incompleteTodos.length})
          </Button>
        </div>

        <div className="max-h-[30vh] overflow-y-auto space-y-2 mt-2">
          <AnimatePresence mode="wait">
            {tab === "subjects" ? (
              <motion.div
                key="subjects"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-2"
              >
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_SUBJECTS.map((subject) => (
                    <Button
                      key={subject}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs h-9"
                      onClick={() => handleSelectSubject(subject)}
                    >
                      {subject}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Custom subject..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCustomSubject()}
                    className="flex-1 text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={handleCustomSubject} disabled={!customSubject.trim()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-2"
              >
                {incompleteTodos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending tasks. Add tasks in your To-Do list.
                  </p>
                ) : (
                  incompleteTodos.slice(0, 10).map((todo) => (
                    <Button
                      key={todo.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs h-9"
                      onClick={() => handleSelectTask(todo)}
                    >
                      <span className={`mr-2 w-2 h-2 rounded-full inline-block ${
                        todo.priority === "high" ? "bg-destructive" :
                        todo.priority === "medium" ? "bg-accent" : "bg-muted-foreground"
                      }`} />
                      {todo.text}
                    </Button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Selection */}
        <div className="mt-3 pt-3 border-t border-border">
          <h4 className="text-sm font-display font-semibold flex items-center gap-1.5 mb-2">
            <Palette className="h-4 w-4 text-primary" /> Choose Theme
          </h4>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ownedThemes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => setSelectedTheme(theme.value)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all ${
                  selectedTheme === theme.value ? "border-primary shadow-glow-primary" : "border-transparent"
                }`}
              >
                <div
                  className="w-14 h-9 rounded-md"
                  style={{ background: theme.gradient }}
                />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{theme.icon} {theme.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between mt-3">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
            Skip & Start
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
