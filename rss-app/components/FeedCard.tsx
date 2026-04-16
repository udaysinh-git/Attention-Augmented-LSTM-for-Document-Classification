"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CATEGORY_META } from "@/lib/categories";
import type { FeedItem } from "@/lib/rss";

export const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 20 },
  },
};

function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
}

type Props = { item: FeedItem; featured?: boolean };

export default function FeedCard({ item, featured }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  const meta    = CATEGORY_META[item.category] ?? CATEGORY_META.General;
  const hasImg  = !!item.imageUrl && !imgFailed;
  const conf    = item.confidence != null ? `${(item.confidence * 100).toFixed(0)}%` : null;

  return (
    <motion.article
      variants={cardVariants}
      className={[
        "group relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5",
        "hover:border-white/10 transition-colors duration-200",
        featured ? "md:col-span-2" : "",
      ].join(" ")}
    >
      {/* ── Image area ── */}
      <div className={["relative overflow-hidden", featured ? "aspect-16/7" : "aspect-video"].join(" ")}>

        {hasImg ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="card-img absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          /* Solid color placeholder — no gradients */
          <div className={`absolute inset-0 ${meta.solidBg} flex items-center justify-center`}>
            <span className={`font-mono text-xs tracking-widest uppercase opacity-20 ${meta.color}`}>
              {item.category}
            </span>
          </div>
        )}

        {/* Category badge — top left */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded border ${meta.bg} ${meta.border} ${meta.color}`}>
            {item.category}
          </span>
        </div>

        {/* Confidence badge — top right */}
        {conf && (
          <div className="absolute top-3 right-3 z-10">
            <span className="font-mono text-[10px] text-zinc-400 bg-black/50 px-2 py-0.5 rounded border border-white/10">
              {conf}
            </span>
          </div>
        )}

        {/* Featured: solid dark bar at bottom for title legibility — no gradient */}
        {featured && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/65 px-4 py-4 md:px-6 md:py-5">
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="block hover:underline underline-offset-2 decoration-white/40"
            >
              <h2 className="text-base md:text-xl font-semibold text-white line-clamp-2 leading-snug">
                {item.title}
              </h2>
            </a>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="font-mono text-[11px] text-zinc-300">{item.source}</span>
              <span className="font-mono text-[11px] text-zinc-500">{formatDate(item.pubDate)}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Content (regular cards) ── */}
      {!featured && (
        <div className="p-4">
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="block hover:underline underline-offset-2 decoration-zinc-600"
          >
            <h2 className="text-sm font-medium text-zinc-100 line-clamp-2 leading-snug">
              {item.title}
            </h2>
          </a>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] text-zinc-500 truncate">{item.source}</span>
            <div className="flex items-center gap-2 shrink-0">
              {conf && (
                <span className={`font-mono text-[10px] opacity-60 ${meta.color}`}>{conf}</span>
              )}
              <span className="font-mono text-[11px] text-zinc-600">{formatDate(item.pubDate)}</span>
            </div>
          </div>
        </div>
      )}
    </motion.article>
  );
}
