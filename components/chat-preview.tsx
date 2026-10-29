"use client"

import { useEffect, useState } from "react"

export function ChatPreview({
  gameId,
  revision,
}: {
  gameId: string
  revision: number
}) {
  const [url, setUrl] = useState<string>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/games/${gameId}/preview`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Preview failed")
        setUrl(data.url)
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message)
      })
    return () => controller.abort()
  }, [gameId])

  if (error) return <p className="p-4 text-sm text-destructive">{error}</p>
  if (!url) return <p className="p-4 text-sm text-muted-foreground">Loading preview…</p>

  // The URL stays the same across edits, so a new key remounts the iframe to reload it.
  return (
    <iframe
      key={revision}
      src={url}
      title="Game preview"
      className="size-full border-0"
    />
  )
}
