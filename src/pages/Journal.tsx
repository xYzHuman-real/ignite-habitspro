import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Smile, Meh, Frown, Sparkles, Trophy, ArrowUp, Heart, Trash2, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useJournal } from "@/lib/use-journal";
import { useHabits } from "@/lib/supabase-hooks";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, subDays } from "date-fns";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const MOODS = [
  { value: "great", icon: "😄", label: "Great", color: "bg-success/15 text-success border-success/30" },
  { value: "good", icon: "🙂", label: "Good", color: "bg-primary/15 text-primary border-primary/30" },
  { value: "neutral", icon: "😐", label: "Okay", color: "bg-muted text-muted-foreground border-border" },
  { value: "low", icon: "😔", label: "Low", color: "bg-accent/15 text-accent-foreground border-accent/30" },
  { value: "bad", icon: "😞", label: "Rough", color: "bg-destructive/15 text-destructive border-destructive/30" },
];

const PROMPTS = [
  "What went well today?",
  "What are you grateful for?",
  "What did you learn today?",
  "How did your habits make you feel?",
  "What would you do differently?",
  "What's one thing you're proud of?",
];

export default function Journal() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const { entries, recentEntries, isLoading, saveEntry, deleteEntry, isSaving } = useJournal(selectedDate);
  const { habits } = useHabits();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("daily");
  const [mood, setMood] = useState("neutral");
  const [reflection, setReflection] = useState("");
  const [wins, setWins] = useState("");
  const [improvements, setImprovements] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);

  const isToday = selectedDate === new Date().toISOString().split("T")[0];
  const randomPrompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];

  // Load existing entry into form
  const loadEntry = (entry: any) => {
    setMood(entry.mood);
    setReflection(entry.reflection || "");
    setWins(entry.wins || "");
    setImprovements(entry.improvements || "");
    setGratitude(entry.gratitude || "");
    setSelectedHabit(entry.habit_id || null);
  };

  const handleSave = () => {
    if (!reflection.trim()) {
      toast({ title: "Write something first!", description: "Add a reflection before saving.", variant: "destructive" });
      return;
    }
    saveEntry(
      { mood, reflection, wins, improvements, gratitude, habit_id: selectedHabit },
      {
        onSuccess: () => {
          toast({ title: "Journal Saved! 📝", description: "Your reflection has been recorded." });
          // Reset form for new entry
          if (!entries.find((e: any) => e.habit_id === selectedHabit)) {
            setReflection("");
            setWins("");
            setImprovements("");
            setGratitude("");
          }
        },
      }
    );
  };

  const navigateDate = (direction: number) => {
    const d = direction > 0 ? addDays(new Date(selectedDate), 1) : subDays(new Date(selectedDate), 1);
    if (d <= new Date()) setSelectedDate(d.toISOString().split("T")[0]);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Find daily entry (no habit linked)
  const dailyEntry = entries.find((e: any) => !e.habit_id);
  const habitEntries = entries.filter((e: any) => e.habit_id);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl mx-auto space-y-6">
      <motion.div variants={item}>
        <h1 className="text-3xl font-display font-bold flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" />
          Daily Journal
        </h1>
        <p className="text-muted-foreground mt-1">Reflect on your day and track your growth</p>
      </motion.div>

      {/* Date Navigation */}
      <motion.div variants={item}>
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="font-display font-semibold text-lg">
              {isToday ? "Today" : format(new Date(selectedDate), "EEEE")}
            </p>
            <p className="text-sm text-muted-foreground">{format(new Date(selectedDate), "MMMM d, yyyy")}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigateDate(1)} disabled={isToday}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="daily">Daily Reflection</TabsTrigger>
          <TabsTrigger value="habits">Habit Notes ({habitEntries.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Daily Reflection Tab */}
        <TabsContent value="daily">
          <motion.div variants={item} className="space-y-4">
            {/* Mood Selector */}
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-3">How are you feeling?</h3>
              <div className="flex gap-2 flex-wrap">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                      mood === m.value ? m.color + " ring-2 ring-offset-2 ring-primary/30" : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-xl">{m.icon}</span>
                    <span className="text-sm font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Reflection */}
            <Card className="p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" /> Reflection
                  </h3>
                  <span className="text-xs text-muted-foreground italic">Prompt: {randomPrompt}</span>
                </div>
                <Textarea
                  placeholder="Write about your day..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1">
                    <Trophy className="h-3.5 w-3.5 text-accent" /> Wins
                  </label>
                  <Textarea
                    placeholder="What went well?"
                    value={wins}
                    onChange={(e) => setWins(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1">
                    <ArrowUp className="h-3.5 w-3.5 text-primary" /> Improvements
                  </label>
                  <Textarea
                    placeholder="What to improve?"
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium flex items-center gap-1 mb-1">
                    <Heart className="h-3.5 w-3.5 text-destructive" /> Gratitude
                  </label>
                  <Textarea
                    placeholder="What are you thankful for?"
                    value={gratitude}
                    onChange={(e) => setGratitude(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-gradient-primary text-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" />
                {dailyEntry ? "Update Entry" : "Save Entry"}
              </Button>
            </Card>

            {/* Show existing daily entry */}
            {dailyEntry && (
              <Card className="p-4 border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{MOODS.find((m) => m.value === (dailyEntry as any).mood)?.icon || "😐"}</span>
                    <span className="text-sm font-medium">Saved entry</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteEntry((dailyEntry as any).id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{(dailyEntry as any).reflection}</p>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        {/* Habit Notes Tab */}
        <TabsContent value="habits">
          <motion.div variants={item} className="space-y-4">
            {habits.length === 0 ? (
              <Card className="p-8 text-center">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Create habits first to write habit-specific notes.</p>
              </Card>
            ) : (
              <>
                {/* Habit selector */}
                <Card className="p-4">
                  <h3 className="font-display font-semibold mb-3">Select a habit to reflect on</h3>
                  <div className="flex gap-2 flex-wrap">
                    {habits.map((h: any) => {
                      const hasEntry = habitEntries.find((e: any) => e.habit_id === h.id);
                      return (
                        <button
                          key={h.id}
                          onClick={() => {
                            setSelectedHabit(h.id);
                            if (hasEntry) loadEntry(hasEntry);
                            else { setReflection(""); setMood("neutral"); setWins(""); setImprovements(""); setGratitude(""); }
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                            selectedHabit === h.id ? "border-primary bg-primary/10 ring-2 ring-primary/30" :
                            hasEntry ? "border-success/30 bg-success/5" : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <span>{h.icon}</span>
                          <span className="text-sm">{h.name}</span>
                          {hasEntry && <span className="text-xs text-success">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {selectedHabit && (
                  <Card className="p-5 space-y-3">
                    <h3 className="font-display font-semibold">
                      How did {habits.find((h: any) => h.id === selectedHabit)?.icon}{" "}
                      {habits.find((h: any) => h.id === selectedHabit)?.name} go?
                    </h3>
                    <div className="flex gap-2">
                      {MOODS.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => setMood(m.value)}
                          className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                            mood === m.value ? m.color + " ring-1 ring-primary/30" : "border-border"
                          }`}
                        >
                          {m.icon}
                        </button>
                      ))}
                    </div>
                    <Textarea
                      placeholder="How did this habit go today?"
                      value={reflection}
                      onChange={(e) => setReflection(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                    <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary text-primary-foreground">
                      <Save className="h-4 w-4 mr-2" />
                      {habitEntries.find((e: any) => e.habit_id === selectedHabit) ? "Update" : "Save"} Note
                    </Button>
                  </Card>
                )}

                {/* Existing habit notes */}
                {habitEntries.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-display font-semibold text-sm text-muted-foreground">Today's Habit Notes</h3>
                    {habitEntries.map((e: any) => {
                      const habit = habits.find((h: any) => h.id === e.habit_id);
                      return (
                        <Card key={e.id} className="p-3 flex items-start gap-3">
                          <span className="text-xl">{habit?.icon || "📝"}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{habit?.name || "Habit"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{e.reflection}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{MOODS.find((m) => m.value === e.mood)?.icon}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteEntry(e.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <motion.div variants={item} className="space-y-3">
            {recentEntries.length === 0 ? (
              <Card className="p-8 text-center">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No journal entries yet. Write your first reflection!</p>
              </Card>
            ) : (
              recentEntries.map((entry: any) => (
                <Card
                  key={entry.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => { setSelectedDate(entry.entry_date); setActiveTab("daily"); loadEntry(entry); }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{MOODS.find((m) => m.value === entry.mood)?.icon || "😐"}</span>
                      <span className="font-display font-semibold text-sm">
                        {format(new Date(entry.entry_date), "EEEE, MMM d")}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${MOODS.find((m) => m.value === entry.mood)?.color || ""}`}>
                      {MOODS.find((m) => m.value === entry.mood)?.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{entry.reflection}</p>
                  {entry.wins && <p className="text-xs text-success mt-1">🏆 {entry.wins}</p>}
                </Card>
              ))
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
