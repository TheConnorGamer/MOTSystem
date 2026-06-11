"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import type { GarageFilter, GarageSort } from "@/lib/garage";

interface GarageToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filter: GarageFilter;
  onFilterChange: (v: GarageFilter) => void;
  sort: GarageSort;
  onSortChange: (v: GarageSort) => void;
  count: number;
}

export function GarageToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  count,
}: GarageToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search reg, nickname, make..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          <span>{count} vehicle{count !== 1 ? "s" : ""}</span>
        </div>
        <Select
          value={filter}
          onChange={(e) => onFilterChange(e.target.value as GarageFilter)}
          className="h-8 w-[130px] text-xs"
        >
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="attention">Needs attention</SelectItem>
          <SelectItem value="mot">Has MOT date</SelectItem>
          <SelectItem value="tax">Has tax date</SelectItem>
          <SelectItem value="service">Has service</SelectItem>
        </Select>
        <Select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as GarageSort)}
          className="h-8 w-[130px] text-xs"
        >
          <SelectItem value="urgency">Most urgent</SelectItem>
          <SelectItem value="name">Name A–Z</SelectItem>
          <SelectItem value="added">Recently added</SelectItem>
        </Select>
      </div>
    </div>
  );
}
