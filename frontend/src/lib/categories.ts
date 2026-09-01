import type { ItemCategory } from "@/lib/types";

export const CATEGORY_META: Record<
  ItemCategory,
  { label: string; icon: string; badge: string }
> = {
  attraction: {
    label: "Attraction",
    icon: "🎟️",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  food: {
    label: "Food",
    icon: "🍽️",
    badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  },
  activity: {
    label: "Activity",
    icon: "🥾",
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  transit: {
    label: "Transit",
    icon: "🚆",
    badge: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
  rest: {
    label: "Rest",
    icon: "☕",
    badge: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
};
