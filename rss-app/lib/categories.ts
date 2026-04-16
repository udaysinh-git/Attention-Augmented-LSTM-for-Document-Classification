import type { FeedCategory } from "@/lib/rss";

export type CategoryMeta = {
  color:   string;   // text color for badges / confidence
  bg:      string;   // badge background
  border:  string;   // badge border
  solidBg: string;   // solid background used when no image is available
  dot:     string;   // colored dot in sidebar / pills
};

export const CATEGORY_META: Record<FeedCategory, CategoryMeta> = {
  "Tech & Science": {
    color:   "text-cyan-400",
    bg:      "bg-cyan-500/10",
    border:  "border-cyan-500/20",
    solidBg: "bg-cyan-950",
    dot:     "bg-cyan-400",
  },
  Business: {
    color:   "text-emerald-400",
    bg:      "bg-emerald-500/10",
    border:  "border-emerald-500/20",
    solidBg: "bg-emerald-950",
    dot:     "bg-emerald-400",
  },
  "World News": {
    color:   "text-amber-400",
    bg:      "bg-amber-500/10",
    border:  "border-amber-500/20",
    solidBg: "bg-amber-950",
    dot:     "bg-amber-400",
  },
  Sports: {
    color:   "text-blue-400",
    bg:      "bg-blue-500/10",
    border:  "border-blue-500/20",
    solidBg: "bg-blue-950",
    dot:     "bg-blue-400",
  },
  Security: {
    color:   "text-rose-400",
    bg:      "bg-rose-500/10",
    border:  "border-rose-500/20",
    solidBg: "bg-rose-950",
    dot:     "bg-rose-400",
  },
  General: {
    color:   "text-zinc-400",
    bg:      "bg-zinc-500/10",
    border:  "border-zinc-500/20",
    solidBg: "bg-zinc-900",
    dot:     "bg-zinc-400",
  },
};

export const ALL_CATEGORIES: FeedCategory[] = [
  "Tech & Science",
  "Business",
  "World News",
  "Sports",
  "Security",
  "General",
];
