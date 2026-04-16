"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowClockwise,
  SlidersHorizontal,
  MagnifyingGlass,
  List,
  SquaresFour,
} from "@phosphor-icons/react";

import FeedCard, { cardVariants } from "@/components/FeedCard";
import FeedRow from "@/components/FeedRow";
import FeedManager, { type Feed } from "@/components/FeedManager";
import { SkeletonCard, SkeletonRow } from "@/components/SkeletonCard";
import { ALL_CATEGORIES, CATEGORY_META } from "@/lib/categories";
import type { FeedCategory, FeedItem } from "@/lib/rss";

// ── Default feed sources ──────────────────────────────────────────────────────
const DEFAULT_FEEDS: Feed[] = [
  // Tech & Science
  { id: "hn",        name: "Hacker News",        url: "https://hnrss.org/frontpage",                          enabled: true,  custom: false },
  { id: "r-ml",      name: "r/MachineLearning",  url: "https://www.reddit.com/r/MachineLearning/.rss",        enabled: true,  custom: false },
  { id: "r-prog",    name: "r/programming",      url: "https://www.reddit.com/r/programming/.rss",            enabled: true,  custom: false },
  { id: "ars",       name: "Ars Technica",        url: "https://feeds.arstechnica.com/arstechnica/index",      enabled: true,  custom: false },
  { id: "wired",     name: "Wired",               url: "https://www.wired.com/feed/rss",                       enabled: true,  custom: false },
  { id: "verge",     name: "The Verge",           url: "https://www.theverge.com/rss/index.xml",               enabled: false, custom: false },
  // Business
  { id: "tc",        name: "TechCrunch",          url: "https://techcrunch.com/feed/",                         enabled: true,  custom: false },
  { id: "r-finance", name: "r/finance",           url: "https://www.reddit.com/r/finance/.rss",                enabled: false, custom: false },
  // World News
  { id: "bbc",       name: "BBC News",             url: "https://feeds.bbci.co.uk/news/world/rss.xml",          enabled: true,  custom: false },
  { id: "reuters",   name: "Reuters",              url: "https://feeds.reuters.com/reuters/topNews",             enabled: false, custom: false },
  { id: "r-world",   name: "r/worldnews",          url: "https://www.reddit.com/r/worldnews/.rss",              enabled: false, custom: false },
  // Sports
  { id: "r-sports",  name: "r/sports",             url: "https://www.reddit.com/r/sports/.rss",                 enabled: false, custom: false },
  // Security
  { id: "krebs",      name: "Krebs on Security",    url: "https://krebsonsecurity.com/feed/",                          enabled: true,  custom: false },
  { id: "schneier",   name: "Schneier on Security", url: "https://www.schneier.com/feed/atom/",                        enabled: true,  custom: false },
  { id: "thn",        name: "The Hacker News",      url: "https://thehackernews.com/feeds/posts/default",              enabled: true,  custom: false },
  { id: "bleeping",   name: "Bleeping Computer",    url: "https://www.bleepingcomputer.com/feed/",                     enabled: true,  custom: false },
  { id: "naked",      name: "Naked Security",       url: "https://nakedsecurity.sophos.com/feed/",                     enabled: true,  custom: false },
  { id: "grahamc",    name: "Graham Cluley",        url: "https://grahamcluley.com/feed/",                             enabled: true,  custom: false },
  { id: "wired-sec",  name: "Wired Security",       url: "https://www.wired.com/feed/category/security/latest/rss",   enabled: true,  custom: false },
  { id: "tc-sec",     name: "TechCrunch Security",  url: "https://techcrunch.com/tag/security/feed/",                  enabled: true,  custom: false },
  { id: "darkread",   name: "Dark Reading",         url: "https://www.darkreading.com/rss.xml",                        enabled: false, custom: false },
  { id: "secweek",    name: "SecurityWeek",         url: "https://www.securityweek.com/feed/",                         enabled: false, custom: false },
  { id: "sans",       name: "SANS ISC",             url: "https://isc.sans.edu/rssfeed_full.xml",                      enabled: false, custom: false },
  { id: "cisa",       name: "CISA Alerts",          url: "https://www.cisa.gov/uscert/ncas/alerts.xml",                enabled: false, custom: false },
  { id: "malwareb",   name: "Malwarebytes Blog",    url: "https://www.malwarebytes.com/blog/feed/",                    enabled: false, custom: false },
  { id: "troyhunt",   name: "Troy Hunt",            url: "https://www.troyhunt.com/rss/",                              enabled: false, custom: false },
  { id: "r-netsec",   name: "r/netsec",             url: "https://www.reddit.com/r/netsec/.rss",                       enabled: false, custom: false },
  { id: "r-security", name: "r/cybersecurity",      url: "https://www.reddit.com/r/cybersecurity/.rss",                enabled: false, custom: false },
  { id: "r-hacking",  name: "r/hacking",            url: "https://www.reddit.com/r/hacking/.rss",                      enabled: false, custom: false },
  // Sports
  { id: "bbc-sport",  name: "BBC Sport",            url: "https://feeds.bbci.co.uk/sport/rss.xml",                     enabled: true,  custom: false },
  { id: "espn",       name: "ESPN",                 url: "https://www.espn.com/espn/rss/news",                         enabled: true,  custom: false },
  { id: "r-nfl",      name: "r/nfl",                url: "https://www.reddit.com/r/nfl/.rss",                          enabled: false, custom: false },
  { id: "r-nba",      name: "r/nba",                url: "https://www.reddit.com/r/nba/.rss",                          enabled: false, custom: false },
  { id: "r-soccer",   name: "r/soccer",             url: "https://www.reddit.com/r/soccer/.rss",                       enabled: false, custom: false },
];

const STORAGE_KEY = "rss-intelligence-feeds";

function loadFeeds(): Feed[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Feed[];
      const savedIds = new Set(saved.map((f) => f.id));
      // Append any default feeds that didn't exist when the user first loaded
      const newDefaults = DEFAULT_FEEDS.filter((f) => !savedIds.has(f.id));
      return [...saved, ...newDefaults];
    }
  } catch { /* ignore */ }
  return DEFAULT_FEEDS;
}

function saveFeeds(feeds: Feed[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(feeds)); } catch { /* ignore */ }
}

function formatTimeAgo(d: Date) {
  const secs = Math.floor((Date.now() - d.getTime()) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  // loading starts false so SSR + client initial renders agree — no hydration mismatch.
  // hasMounted flips after first paint; that flip triggers the actual data fetch.
  const [hasMounted,     setHasMounted]     = useState(false);
  const [feeds,          setFeeds]          = useState<Feed[]>(DEFAULT_FEEDS);
  const [items,          setItems]          = useState<FeedItem[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [managerOpen,    setManagerOpen]    = useState(false);
  const [activeCategory, setActiveCategory] = useState<"All" | FeedCategory>("All");
  const [view,           setView]           = useState<"card" | "compact">("card");
  const [lastFetched,    setLastFetched]    = useState<Date | null>(null);
  const [refreshKey,     setRefreshKey]     = useState(0);
  const [search,         setSearch]         = useState("");

  // On mount: load persisted feeds and signal ready
  useEffect(() => {
    const saved = loadFeeds();
    setFeeds(saved);
    setHasMounted(true);
  }, []);

  const fetchItems = useCallback(async (activeFeedsParam: Feed[]) => {
    const enabled = activeFeedsParam
      .filter((f) => f.enabled)
      .map((f) => ({ name: f.name, url: f.url }));

    if (enabled.length === 0) { setItems([]); setLoading(false); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: enabled, limit: enabled.length * 20 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems(await res.json() as FeedItem[]);
      setLastFetched(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feeds");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch after mount, on feed toggle, or manual refresh
  useEffect(() => {
    if (!hasMounted) return;
    fetchItems(feeds);
  }, [hasMounted, feeds, fetchItems, refreshKey]);

  function handleFeedsChange(next: Feed[]) { saveFeeds(next); setFeeds(next); }
  function handleRefresh()                  { setRefreshKey((k) => k + 1); }

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = items.filter((item) => {
    const catOk    = activeCategory === "All" || item.category === activeCategory;
    const searchOk = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.source.toLowerCase().includes(search.toLowerCase());
    return catOk && searchOk;
  });

  const enabledCount = feeds.filter((f) => f.enabled).length;
  const catCounts    = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  // Show skeletons before hydration completes or while fetching
  const isBusy = !hasMounted || loading;

  return (
    <div className="flex h-dvh overflow-hidden bg-[#09090b]">

      {/* ── Sidebar xl+ ─────────────────────────────────────────────────── */}
      <aside className="hidden xl:flex flex-col w-56 shrink-0 border-r border-white/5 overflow-y-auto">
        <nav className="flex-1 p-3 pt-4 space-y-0.5">
          <SidebarFilter label="All" count={items.length} active={activeCategory === "All"} onClick={() => setActiveCategory("All")} />
          {ALL_CATEGORIES.filter((c) => c !== "General").map((cat) => (
            <SidebarFilter
              key={cat} label={cat}
              count={catCounts[cat] ?? 0}
              active={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              color={CATEGORY_META[cat].dot}
            />
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/5 space-y-1.5">
          {([["Sources", enabledCount], ["Items", items.length]] as const).map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="font-mono text-[10px] text-zinc-600">{k}</span>
              <span className="font-mono text-[10px] text-zinc-500">{v}</span>
            </div>
          ))}
          {lastFetched && (
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-zinc-600">Updated</span>
              <span className="font-mono text-[10px] text-zinc-500">{formatTimeAgo(lastFetched)}</span>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Sticky header */}
        <header className="sticky top-0 z-20 border-b border-white/5 bg-[#09090b]/90 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 md:px-6 h-14">

            <span className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 xl:hidden">RSS</span>

            {/* Search */}
            <div className="flex-1 flex items-center gap-2.5 bg-zinc-900 border border-white/6 rounded-lg px-3 py-2 max-w-sm">
              <MagnifyingGlass size={14} className="text-zinc-600 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="flex-1 bg-transparent text-sm font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none min-w-0"
              />
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              {lastFetched && !loading && (
                <span className="hidden md:block font-mono text-[11px] text-zinc-600 mr-1">
                  {formatTimeAgo(lastFetched)}
                </span>
              )}

              {/* View toggle: card ↔ compact */}
              <button
                onClick={() => setView((v) => (v === "card" ? "compact" : "card"))}
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/6 transition-colors"
                aria-label={view === "card" ? "Switch to compact view" : "Switch to card view"}
                title={view === "card" ? "Compact view" : "Card view"}
              >
                {view === "card"
                  ? <List size={16} weight="bold" />
                  : <SquaresFour size={16} weight="bold" />}
              </button>

              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/6 transition-colors disabled:opacity-40 active:scale-[0.95]"
                aria-label="Refresh feeds"
              >
                <ArrowClockwise size={16} weight="bold" className={loading ? "animate-spin" : ""} />
              </button>

              {/* Manage feeds */}
              <button
                onClick={() => setManagerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/8 hover:border-white/14 text-zinc-300 hover:text-zinc-100 transition-colors text-sm font-mono active:scale-[0.97]"
              >
                <SlidersHorizontal size={14} weight="bold" />
                <span className="hidden sm:inline">Feeds</span>
              </button>
            </div>
          </div>

          {/* Mobile category pills */}
          <div className="xl:hidden flex gap-1.5 overflow-x-auto px-4 pb-3 no-scrollbar">
            <CategoryPill label="All" active={activeCategory === "All"} count={items.length} onClick={() => setActiveCategory("All")} />
            {ALL_CATEGORIES.filter((c) => c !== "General").map((cat) => (
              <CategoryPill
                key={cat} label={cat}
                active={activeCategory === cat}
                count={catCounts[cat] ?? 0}
                color={CATEGORY_META[cat].color}
                onClick={() => setActiveCategory(cat)}
              />
            ))}
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 p-4 md:p-6">

          {/* Error banner */}
          {error && !loading && (
            <div className="mb-6 px-4 py-3 rounded-xl border border-rose-500/20 bg-rose-500/8 text-rose-400 text-sm font-mono">
              {error} — check your network or feed sources
            </div>
          )}

          {/* Skeletons */}
          {isBusy && (
            view === "card" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} featured={i === 0} />)}
              </div>
            ) : (
              <div className="rounded-xl border border-white/5 overflow-hidden divide-y divide-white/4">
                {Array.from({ length: 16 }, (_, i) => <SkeletonRow key={i} />)}
              </div>
            )
          )}

          {/* Empty state */}
          {!isBusy && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="font-mono text-xs tracking-widest uppercase text-zinc-600 mb-2">No articles</p>
              <p className="text-sm text-zinc-500 max-w-xs">
                {search
                  ? `No results for "${search}"`
                  : activeCategory !== "All"
                    ? `Nothing classified as ${activeCategory} yet`
                    : "Enable at least one feed source to start"}
              </p>
            </div>
          )}

          {/* Feed items */}
          {!isBusy && filtered.length > 0 && (
            <AnimatePresence mode="wait">
              {view === "card" ? (
                <motion.div
                  key={`card-${refreshKey}-${activeCategory}-${search}`}
                  variants={gridVariants}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {filtered.map((item, i) => (
                    <FeedCard key={`${item.link}-${i}`} item={item} featured={i === 0} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key={`compact-${refreshKey}-${activeCategory}-${search}`}
                  variants={gridVariants}
                  initial="hidden"
                  animate="show"
                  className="rounded-xl border border-white/5 overflow-hidden divide-y divide-white/4"
                >
                  {filtered.map((item, i) => (
                    <FeedRow key={`${item.link}-${i}`} item={item} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* Feed manager */}
      <FeedManager
        open={managerOpen}
        feeds={feeds}
        onClose={() => setManagerOpen(false)}
        onChange={handleFeedsChange}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function SidebarFilter({ label, count, active, onClick, color }: {
  label: string; count: number; active: boolean; onClick: () => void; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors",
        active ? "bg-white/8 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/4",
      ].join(" ")}
    >
      <span className="flex items-center gap-2 min-w-0">
        {color && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />}
        <span className="text-sm truncate">{label}</span>
      </span>
      <span className="font-mono text-[11px] shrink-0 text-zinc-600">{count > 0 ? count : ""}</span>
    </button>
  );
}

function CategoryPill({ label, active, count, onClick, color }: {
  label: string; active: boolean; count: number; onClick: () => void; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors text-xs font-mono whitespace-nowrap",
        active ? "bg-white/10 border-white/15 text-zinc-100" : "border-white/6 text-zinc-500 hover:text-zinc-300 hover:border-white/10",
      ].join(" ")}
    >
      {color && active && <span className={`w-1.5 h-1.5 rounded-full ${color}`} />}
      {label}
      {count > 0 && <span className="text-zinc-600">{count}</span>}
    </button>
  );
}
