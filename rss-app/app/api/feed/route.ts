import { NextResponse } from "next/server";
import { getCategorizedFeedItems, type FeedSource } from "@/lib/rss";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sources?: FeedSource[];
      limit?: number;
    };

    const sources: FeedSource[] = Array.isArray(body.sources)
      ? body.sources.filter((s) => s?.url && s?.name)
      : [];

    if (sources.length === 0) {
      return NextResponse.json(
        { error: "No valid feed sources provided" },
        { status: 400 },
      );
    }

    const items = await getCategorizedFeedItems(sources, body.limit ?? sources.length * 20);
    return NextResponse.json(items);
  } catch (err) {
    console.error("[api/feed]", err);
    return NextResponse.json(
      { error: "Failed to fetch or classify feed items" },
      { status: 500 },
    );
  }
}
