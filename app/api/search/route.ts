import type { NextRequest } from "next/server"

import { getFirecrawl } from "@/lib/firecrawl"

// GET /api/search?q=next.js+16&limit=5
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q = searchParams.get("q")?.trim()
  const limit = Math.min(Number(searchParams.get("limit")) || 5, 20)
  if (!q) {
    return Response.json({ error: "`q` is required" }, { status: 400 })
  }

  try {
    const data = await getFirecrawl().search(q, { limit })
    return Response.json({ results: data.web ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed"
    return Response.json({ error: message }, { status: 502 })
  }
}
