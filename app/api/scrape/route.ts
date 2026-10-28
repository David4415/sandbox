import { getFirecrawl } from "@/lib/firecrawl"

// POST /api/scrape  { "url": "https://example.com" }
export async function POST(request: Request) {
  const { url } = await request.json().catch(() => ({}))
  if (typeof url !== "string" || !URL.canParse(url)) {
    return Response.json(
      { error: "A valid `url` is required" },
      { status: 400 }
    )
  }

  try {
    const doc = await getFirecrawl().scrape(url, { formats: ["markdown"] })
    return Response.json({ markdown: doc.markdown, metadata: doc.metadata })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scrape failed"
    return Response.json({ error: message }, { status: 502 })
  }
}
