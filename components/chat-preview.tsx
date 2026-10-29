"use client"

import { useEffect, useState } from "react"

export function ChatPreview({ gameId }: { gameId: string }) {
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

  return <iframe src={url} title="Game preview" className="size-full border-0" />
}
