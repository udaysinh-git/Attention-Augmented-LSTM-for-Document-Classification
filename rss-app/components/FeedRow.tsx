"use client";

import { motion } from "framer-motion";
import { cardVariants } from "@/components/FeedCard";
import { CATEGORY_META } from "@/lib/categories";
import type { FeedItem } from "@/lib/rss";

function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

export default function FeedRow({ item }: { item: FeedItem }) {
  const meta = CATEGORY_META[item.category] ?? CATEGORY_META.General;
  const conf = item.confidence != null ? `${(item.confidence * 100).toFixed(0)}%` : null;

  return (
    <motion.div
      variants={cardVariants}
      className="group flex items-center gap-3 px-4 py-2.5 hover:bg-white/3 transition-colors"
    >
      {/* Category dot */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />

      {/* Category label — hidden on small screens */}
      <span className={`hidden sm:block font-mono text-[10px] tracking-wider uppercase w-24 shrink-0 ${meta.color}`}>
        {item.category}
      </span>

      {/* Title */}
      <a
        href={item.link}
        target="_blank"
        rel="noreferrer"
        className="flex-1 text-sm text-zinc-300 hover:text-zinc-100 line-clamp-1 min-w-0 transition-colors"
      >
        {item.title}
      </a>

      {/* Source */}
      <span className="hidden md:block font-mono text-[11px] text-zinc-600 shrink-0 w-28 truncate text-right">
        {item.source}
      </span>

      {/* Confidence */}
      {conf && (
        <span className={`font-mono text-[10px] shrink-0 w-8 text-right ${meta.color} opacity-60`}>
          {conf}
        </span>
      )}

      {/* Date */}
      <span className="font-mono text-[11px] text-zinc-600 shrink-0 w-12 text-right">
        {formatDate(item.pubDate)}
      </span>
    </motion.div>
  );
}
