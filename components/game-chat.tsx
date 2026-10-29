"use client"

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
  const thread = (
    <ChatThread
      id={id}
      initialMessages={initialMessages}
      initialPrompt={initialPrompt}
      initialSession={initialSession}
    />
  )

  if (!hasSandbox) return <div className="h-svh">{thread}</div>

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-svh">
      <ResizablePanel defaultSize="40%" minSize="25%">
        {thread}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="60%" minSize="25%">
        <ChatPreview gameId={id} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
