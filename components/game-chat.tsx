"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { UIMessage } from "ai"

import { ChatPreview } from "@/components/chat-preview"
import { ChatThread } from "@/components/chat-thread"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export function GameChat({
  id,
  initialMessages,
  initialPrompt,
  initialSession,
  hasSandbox,
}: {
  id: string
  initialMessages: UIMessage[]
  initialPrompt?: string
  initialSession?: { publicAccessToken: string; lastEventId?: string }
  hasSandbox?: boolean
}) {
  const router = useRouter()
  const [revision, setRevision] = useState(0)

  // The sandbox is created during the first turn, after this page was rendered,
  // so refetch the game then to learn about it.
  function handleTurnFinish() {
    setRevision((r) => r + 1)
    if (!hasSandbox) router.refresh()
  }

  // Same tree with or without a sandbox, so the thread keeps its chat state
  // when the preview panel appears.
  return (
    <ResizablePanelGroup orientation="horizontal" className="h-svh overflow-hidden">
      <ResizablePanel
        id="thread"
        defaultSize={hasSandbox ? "40%" : "100%"}
        minSize="25%"
        className="overflow-hidden"
      >
        <ChatThread
          onTurnFinish={handleTurnFinish}
          id={id}
          initialMessages={initialMessages}
          initialPrompt={initialPrompt}
          initialSession={initialSession}
        />
      </ResizablePanel>
      {hasSandbox && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel id="preview" defaultSize="60%" minSize="25%">
            <ChatPreview gameId={id} revision={revision} />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}
