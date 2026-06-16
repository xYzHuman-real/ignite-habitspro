import { Search, CalendarDays, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FILTER_CHIPS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Done" },
  { value: "overdue", label: "Overdue" },
];

const TAG_CHIPS = [
  { value: "Study", label: "📚 Study" },
  { value: "Work", label: "💼 Work" },
  { value: "Health", label: "💪 Health" },
  { value: "Personal", label: "🏠 Personal" },
];

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  filterPriority: string;
  onFilterPriority: (v: string) => void;
  filterTag: string;
  onFilterTag: (v: string) => void;
  filterStatus: string;
  onFilterStatus: (v: string) => void;
  viewMode: "list" | "calendar";
  onViewMode: (v: "list" | "calendar") => void;
}

export function TodoFilters({ search, onSearchChange, filterTag, onFilterTag, filterStatus, onFilterStatus, viewMode, onViewMode }: Props) {
  return (
    <div className="space-y-3">
      {/* Search + View toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9 rounded-2xl border-border/30 h-10 text-sm bg-card shadow-sm"
          />
        </div>
        <div className="flex bg-muted/50 rounded-2xl p-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewMode("list")}
            className={cn("h-9 w-9 rounded-xl", viewMode === "list" && "bg-card shadow-sm")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewMode("calendar")}
            className={cn("h-9 w-9 rounded-xl", viewMode === "calendar" && "bg-card shadow-sm")}
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Horizontal filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.value}
            onClick={() => onFilterStatus(chip.value)}
            className={cn(
              "text-xs px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all font-medium",
              filterStatus === chip.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            )}
          >
            {chip.label}
          </button>
        ))}
        <div className="w-px bg-border/30 mx-1 shrink-0" />
        {TAG_CHIPS.map(chip => (
          <button
            key={chip.value}
            onClick={() => onFilterTag(filterTag === chip.value ? "all" : chip.value)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-medium",
              filterTag === chip.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/40 text-muted-foreground hover:bg-muted"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
