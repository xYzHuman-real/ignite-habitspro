import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GRADE_POINTS: Record<string, number> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D+": 1.3, "D": 1.0, "F": 0.0,
};

interface Course {
  id: string;
  name: string;
  grade: string;
  credits: number;
}

export function GpaCalculator() {
  const [expanded, setExpanded] = useState(false);
  const [courses, setCourses] = useState<Course[]>([
    { id: "1", name: "", grade: "A", credits: 3 },
  ]);

  const addCourse = useCallback(() => {
    setCourses((prev) => [...prev, { id: Date.now().toString(), name: "", grade: "A", credits: 3 }]);
  }, []);

  const removeCourse = useCallback((id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateCourse = useCallback((id: string, field: keyof Course, value: string | number) => {
    setCourses((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  }, []);

  const gpa = courses.length > 0
    ? courses.reduce((sum, c) => sum + GRADE_POINTS[c.grade] * c.credits, 0) /
      Math.max(1, courses.reduce((sum, c) => sum + c.credits, 0))
    : 0;

  return (
    <Card className="p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          <h3 className="font-display font-semibold text-sm">GPA Calculator</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-display text-primary">{gpa.toFixed(2)}</span>
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
              {courses.map((course) => (
                <div key={course.id} className="flex gap-2 items-center">
                  <Input
                    placeholder="Course"
                    value={course.name}
                    onChange={(e) => updateCourse(course.id, "name", e.target.value)}
                    className="flex-1 h-8 text-xs"
                  />
                  <Select value={course.grade} onValueChange={(v) => updateCourse(course.id, "grade", v)}>
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(GRADE_POINTS).map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={course.credits}
                    onChange={(e) => updateCourse(course.id, "credits", parseInt(e.target.value) || 1)}
                    className="w-14 h-8 text-xs"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeCourse(course.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCourse} className="w-full text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add Course
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
