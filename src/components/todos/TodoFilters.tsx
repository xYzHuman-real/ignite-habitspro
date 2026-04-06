import { Search, Filter, CalendarDays, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AVAILABLE_TAGS = ["Study", "Work", "Health", "Personal"];

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

export function TodoFilters({ search, onSearchChange, filterPriority, onFilterPriority, filterTag, onFilterTag, filterStatus, onFilterStatus, viewMode, onViewMode }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9 rounded-xl border-border/50 h-9 text-sm"
          />
        </div>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="icon"
          onClick={() => onViewMode("list")}
          className="h-9 w-9 rounded-xl shrink-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "calendar" ? "default" : "outline"}
          size="icon"
          onClick={() => onViewMode("calendar")}
          className="h-9 w-9 rounded-xl shrink-0"
        >
          <CalendarDays className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Select value={filterPriority} onValueChange={onFilterPriority}>
          <SelectTrigger className="w-24 rounded-xl text-xs h-8">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTag} onValueChange={onFilterTag}>
          <SelectTrigger className="w-24 rounded-xl text-xs h-8">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {AVAILABLE_TAGS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={onFilterStatus}>
          <SelectTrigger className="w-28 rounded-xl text-xs h-8">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
