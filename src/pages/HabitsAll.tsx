import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useHabits } from "@/lib/supabase-hooks";
import { Skeleton } from "@/components/ui/skeleton";
import HabitCard from "@/components/habits/HabitCard";

export default function HabitsAll() {
  const navigate = useNavigate();
  const { habits, isLoading, toggleHabit, deleteHabit } = useHabits();

  const sortedHabits = useMemo(
    () => [...habits].sort((a, b) => ((a as any).sort_order || 0) - ((b as any).sort_order || 0)),
    [habits]
  );

  return (
    <div className="max-w-lg mx-auto px-5 pb-32 pt-2">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-[14px] text-muted-foreground hover:text-foreground transition-colors -ml-2 mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <h1 className="text-[28px] font-display font-semibold tracking-tight text-foreground">
        All Habits
      </h1>
      <p className="text-[13px] text-muted-foreground mt-1 mb-6">
        Swipe right to complete · tap trash to delete
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🌱</p>
          <p className="text-muted-foreground text-sm">
            No habits yet. Tap + to add your first one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit as any}
              onToggle={(h) => toggleHabit(h as any)}
              onDelete={deleteHabit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
