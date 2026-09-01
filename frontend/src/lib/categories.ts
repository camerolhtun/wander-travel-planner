import type { ItemCategory } from "@/lib/types";

/**
 * Trail-map legend. Cool, low-saturation tones that sit inside the Glacier
 * palette; food keeps one warm cue because "food" reads warm everywhere.
 */
export const CATEGORY_META: Record<
  ItemCategory,
  { label: string; icon: string; badge: string }
> = {
  attraction: {
    label: "Attraction",
    icon: "◆",
    badge: "bg-[#2c7da0]/12 text-[#1d5e7c] dark:text-[#8fd0ec]",
  },
  food: {
    label: "Food",
    icon: "●",
    badge: "bg-[#b9765a]/14 text-[#9a5a41] dark:text-[#dba184]",
  },
  activity: {
    label: "Activity",
    icon: "▲",
    badge: "bg-[#5c8a78]/14 text-[#3f6d5b] dark:text-[#9ccbb9]",
  },
  transit: {
    label: "Transit",
    icon: "─",
    badge: "bg-[#6b7f92]/14 text-[#4a5c6e] dark:text-[#a8bccb]",
  },
  rest: {
    label: "Rest",
    icon: "○",
    badge: "bg-[#7a7396]/14 text-[#5b5578] dark:text-[#b8b2d0]",
  },
};
