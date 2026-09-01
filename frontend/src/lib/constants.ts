import type { ItemCategory } from "@/lib/types";

export const INTEREST_OPTIONS = [
  "food",
  "history",
  "art",
  "nature",
  "nightlife",
  "shopping",
  "adventure",
  "relaxation",
] as const;

export const ITEM_CATEGORIES: ItemCategory[] = [
  "attraction",
  "food",
  "activity",
  "transit",
  "rest",
];

export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
