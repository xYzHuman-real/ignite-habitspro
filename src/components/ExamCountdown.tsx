import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Exam {
  id: string;
  name: string;
  date: string;
}

const STORAGE_KEY = "exam_countdowns";

function loadExams(): Exam[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function ExamCountdown() {
  const [expanded, setExpanded] = useState(false);
  const [exams, setExams] = useState<Exam[]>(loadExams);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
  }, [exams]);

  const addExam = useCallback(() => {
    if (!newName.trim() || !newDate) return;
    setExams((prev) => [...prev, { id: Date.now().toString(), name: newName.trim(), date: newDate }]);
    setNewName("");
    setNewDate("");
  }, [newName, newDate]);

  const removeExam = useCallback((id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const sortedExams = [...exams].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const nextExam = sortedExams.find((e) => getDaysUntil(e.date) >= 0);
  const nextDays = nextExam ? getDaysUntil(nextExam.date) : null;

  return (
    <Card className="p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">Exam Countdown</h3>
        </div>
        <div className="flex items-center gap-2">
          {nextExam ? (
            <span className={`text-sm font-bold font-display ${
              nextDays !== null && nextDays <= 3 ? "text-destructive" :
              nextDays !== null && nextDays <= 7 ? "text-accent-foreground" : "text-primary"
            }`}>
              {nextDays === 0 ? "Today!" : `${nextDays}d`}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No exams</span>
          )}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2">
              {sortedExams.map((exam) => {
                const days = getDaysUntil(exam.date);
                const isPast = days < 0;
                return (
                  <div key={exam.id} className={`flex items-center justify-between text-xs ${isPast ? "opacity-50" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{exam.name}</span>
                      <span className="text-muted-foreground">{new Date(exam.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-display font-bold text-sm ${
                        !isPast && days <= 3 ? "text-destructive" :
                        !isPast && days <= 7 ? "text-accent-foreground" : "text-muted-foreground"
                      }`}>
                        {isPast ? "Done" : days === 0 ? "Today" : `${days}d`}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeExam(exam.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Exam name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 h-8 text-xs"
                />
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-32 h-8 text-xs"
                />
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={addExam} disabled={!newName.trim() || !newDate}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
