"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Plus,
  Trash,
  Rss,
  ToggleLeft,
  ToggleRight,
  Warning,
} from "@phosphor-icons/react";

export type Feed = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  custom: boolean;
};

type Props = {
  open: boolean;
  feeds: Feed[];
  onClose: () => void;
  onChange: (feeds: Feed[]) => void;
};

function isValidUrl(s: string) {
  try { new URL(s); return true; } catch { return false; }
}

export default function FeedManager({ open, feeds, onClose, onChange }: Props) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    setUrlError("");
    const trimUrl = url.trim();
    const trimName = name.trim() || new URL(trimUrl).hostname;

    if (!trimUrl) { setUrlError("URL is required"); return; }
    if (!isValidUrl(trimUrl)) { setUrlError("Enter a valid URL"); return; }
    if (feeds.some((f) => f.url === trimUrl)) {
      setUrlError("This feed is already added");
      return;
    }

    const newFeed: Feed = {
      id: crypto.randomUUID(),
      name: trimName,
      url: trimUrl,
      enabled: true,
      custom: true,
    };
    onChange([...feeds, newFeed]);
    setName("");
    setUrl("");
    inputRef.current?.focus();
  }

  function handleToggle(id: string) {
    onChange(feeds.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
  }

  function handleRemove(id: string) {
    onChange(feeds.filter((f) => f.id !== id));
  }

  const enabledCount = feeds.filter((f) => f.enabled).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-zinc-950 border-l border-white/8 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <div className="flex items-center gap-2.5">
                <Rss size={16} className="text-zinc-400" weight="bold" />
                <span className="font-mono text-xs tracking-widest uppercase text-zinc-300">
                  Feed Sources
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/6 transition-colors"
                aria-label="Close"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">

              {/* Add new feed form */}
              <div className="px-5 py-5 border-b border-white/6">
                <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-4">
                  Add Feed
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="block font-mono text-[11px] text-zinc-400 mb-1.5">
                      Name <span className="text-zinc-600">(optional)</span>
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My Custom Feed"
                      className="w-full bg-zinc-900 border border-white/8 rounded-lg px-3 py-2 text-sm font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] text-zinc-400 mb-1.5">
                      RSS URL
                    </label>
                    <input
                      ref={inputRef}
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setUrlError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                      placeholder="https://example.com/feed.xml"
                      className={[
                        "w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm font-mono text-zinc-200",
                        "placeholder:text-zinc-600 focus:outline-none transition-colors",
                        urlError
                          ? "border-rose-500/50 focus:border-rose-500"
                          : "border-white/8 focus:border-white/20",
                      ].join(" ")}
                    />
                    {urlError && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Warning size={12} className="text-rose-400 shrink-0" />
                        <span className="font-mono text-[11px] text-rose-400">{urlError}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAdd}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-white/8 hover:border-white/14 rounded-lg px-4 py-2 text-sm font-mono text-zinc-200 transition-colors active:scale-[0.98]"
                  >
                    <Plus size={14} weight="bold" />
                    Add Feed
                  </button>
                </div>
              </div>

              {/* Feed list */}
              <div className="px-5 py-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">
                    Active Sources
                  </p>
                  <span className="font-mono text-[10px] text-zinc-600">
                    {enabledCount}/{feeds.length} enabled
                  </span>
                </div>

                <div className="space-y-1">
                  {feeds.map((feed) => (
                    <div
                      key={feed.id}
                      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/4 transition-colors"
                    >
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(feed.id)}
                        className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
                        aria-label={feed.enabled ? "Disable feed" : "Enable feed"}
                      >
                        {feed.enabled ? (
                          <ToggleRight size={22} className="text-emerald-400" weight="fill" />
                        ) : (
                          <ToggleLeft size={22} className="text-zinc-600" weight="fill" />
                        )}
                      </button>

                      {/* Name + URL */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${feed.enabled ? "text-zinc-200" : "text-zinc-500"}`}>
                          {feed.name}
                        </p>
                        <p className="font-mono text-[10px] text-zinc-600 truncate mt-0.5">
                          {feed.url}
                        </p>
                      </div>

                      {/* Remove (custom feeds only) */}
                      {feed.custom && (
                        <button
                          onClick={() => handleRemove(feed.id)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          aria-label="Remove feed"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/6">
              <p className="font-mono text-[10px] text-zinc-600 text-center">
                Changes apply automatically · Saved to browser
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
