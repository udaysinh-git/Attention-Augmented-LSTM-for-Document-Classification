import Parser from "rss-parser";

export type FeedCategory =
  | "Tech & Science"
  | "Business"
  | "World News"
  | "Sports"
  | "Security"
  | "General";

export type FeedItem = {
  title: string;
  link: string;
  pubDate?: string;
  source: string;
  category: FeedCategory;
  confidence?: number;
  snippet?: string;
  imageUrl?: string;
};

export type FeedSource = {
  name: string;
  url: string;
};

// ── Custom RSS item fields for media extraction ───────────────────────────────
type MediaNode = { $: { url: string; medium?: string } };

type CustomItem = {
  mediaContent?: MediaNode | MediaNode[];
  mediaThumbnail?: MediaNode | MediaNode[];
  enclosure?: { url?: string; type?: string };
};

const parser = new Parser<Record<string, never>, CustomItem>({
  timeout: 10_000,
  headers: { "User-Agent": "rss-intelligence/1.0" },
  customFields: {
    item: [
      ["media:content",   "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
});

function extractImage(item: CustomItem): string | undefined {
  const mc = item.mediaContent;
  if (mc) {
    const node = Array.isArray(mc) ? mc[0] : mc;
    if (node?.$?.url) return node.$.url;
  }
  const mt = item.mediaThumbnail;
  if (mt) {
    const node = Array.isArray(mt) ? mt[0] : mt;
    if (node?.$?.url) return node.$.url;
  }
  if (item.enclosure?.url) {
    const t = item.enclosure.type ?? "";
    if (t.startsWith("image/") || !t) return item.enclosure.url;
  }
  return undefined;
}

// ── Keyword fallback (used when inference API is unreachable) ─────────────────
const KEYWORD_MAP: Array<[FeedCategory, RegExp]> = [
  [
    "Security",
    /\b(hack|breach|vulnerabilit|exploit|malware|ransomware|phishing|cve-?\d|zero[- ]day|patch|cybersecurity|infosec|threat actor|data leak|firewall|ddos|botnet|trojan|spyware|keylogger|credential|pgp|rsa|ssl|tls|cipher|encrypt|decrypt|intrusion|incident response|soc |siem|pentest|red team|bug bounty|supply chain attack|apt\b|nation[- ]state)\b/i,
  ],
  [
    "Sports",
    /\b(nfl|nba|nhl|mlb|fifa|premier league|champions league|laliga|bundesliga|serie a|formula 1|f1|grand prix|soccer|football|basketball|baseball|tennis|golf|cricket|rugby|olympic|championship|tournament|match|fixture|transfer|signing|coach|roster|season|playoff|finals|standings|goal|touchdown|homerun|slam dunk)\b/i,
  ],
  [
    "World News",
    /\b(war|conflict|ceasefire|sanction|treaty|diplomacy|election|president|prime minister|parliament|congress|senate|nato|un security council|refugee|protest|coup|military|troops|missile|airstrike|ukraine|russia|china|israel|gaza|taiwan|iran|north korea|g7|g20)\b/i,
  ],
  [
    "Business",
    /\b(startup|funding|series [a-e]|ipo|acquisition|merger|revenue|profit|earnings|valuation|venture capital|hedge fund|stock market|nasdaq|s&p|dow jones|inflation|interest rate|gdp|layoff|bankruptcy|ceo|cfo|quarterly results)\b/i,
  ],
  [
    "Tech & Science",
    /\b(software|hardware|algorithm|open[- ]source|github|llm|gpt|transformer|neural network|deep learning|machine learning|artificial intelligence|robotics|quantum|semiconductor|chip|gpu|cpu|api|cloud|kubernetes|linux|python|javascript|typescript|rust|nasa|spacex|webb telescope|crispr|genome|physics|biology|climate)\b/i,
  ],
];

function keywordClassify(text: string): FeedCategory {
  for (const [category, pattern] of KEYWORD_MAP) {
    if (pattern.test(text)) return category;
  }
  return "General";
}

// ── Inference API ─────────────────────────────────────────────────────────────
const CLASSIFY_API = process.env.CLASSIFY_API_URL ?? "http://localhost:8000";

type ClassifyResult = {
  label: FeedCategory;
  confidence: number;
};

async function batchClassify(texts: string[]): Promise<ClassifyResult[]> {
  const res = await fetch(`${CLASSIFY_API}/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`Classify API ${res.status}`);
  const data = (await res.json()) as { results: ClassifyResult[] };
  return data.results;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function getCategorizedFeedItems(
  sources: FeedSource[],
  limit = 48,
): Promise<FeedItem[]> {
  if (sources.length === 0) return [];

  // 1. Fetch all feeds in parallel
  const settled = await Promise.allSettled(
    sources.map(async (src) => {
      const feed = await parser.parseURL(src.url);
      return (feed.items ?? []).map((item) => ({
        title:   item.title?.trim() || "Untitled",
        link:    item.link || src.url,
        pubDate: item.pubDate,
        source:  src.name,
        snippet: item.contentSnippet?.trim() || item.content?.trim() || "",
        imageUrl: extractImage(item as CustomItem),
      }));
    }),
  );

  const raw = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // 2. Sort by date, keep top `limit`
  const sorted = raw
    .sort((a, b) => {
      const at = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const bt = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return bt - at;
    })
    .slice(0, limit);

  // 3. Batch classify via LSTM inference API
  const texts = sorted.map((i) => `${i.title} ${i.snippet}`.trim());
  let classifications: ClassifyResult[] | null = null;
  try {
    classifications = await batchClassify(texts);
  } catch {
    console.warn("[rss] Inference API unreachable — using General fallback");
  }

  return sorted.map<FeedItem>((item, i) => ({
    title:      item.title,
    link:       item.link,
    pubDate:    item.pubDate,
    source:     item.source,
    snippet:    item.snippet,
    imageUrl:   item.imageUrl,
    category:   classifications?.[i]?.label ?? keywordClassify(`${item.title} ${item.snippet}`),
    confidence: classifications?.[i]?.confidence,
  }));
}
