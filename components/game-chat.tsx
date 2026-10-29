"use client"

import { useState } from "react"
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
  const [revision, setRevision] = useState(0)

  const thread = (
    <ChatThread
      onTurnFinish={() => setRevision((r) => r + 1)}
      id={id}
      initialMessages={initialMessages}
      initialPrompt={initialPrompt}
      initialSession={initialSession}
    />
  )

  if (!hasSandbox) return <div className="h-svh overflow-hidden">{thread}</div>

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-svh overflow-hidden">
      <ResizablePanel defaultSize="40%" minSize="25%" className="overflow-hidden">
        {thread}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="60%" minSize="25%">
        <ChatPreview gameId={id} revision={revision} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
