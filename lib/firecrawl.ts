import Firecrawl from "@mendable/firecrawl-js"

let client: Firecrawl | undefined

// Server-only: reads FIRECRAWL_API_KEY, so never import this from a client component.
export function getFirecrawl() {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not set (add it to .env.local)")
  }
  return (client ??= new Firecrawl({ apiKey }))
}
