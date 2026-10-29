"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { useTriggerChatTransport } from "@trigger.dev/sdk/chat/react"
import { getToolName, isToolUIPart, type UIMessage } from "ai"
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { ChatComposer } from "@/components/chat-composer"
import {
  mintChatAccessToken,
  startChatSession,
} from "@/lib/games/chat-actions"
import type { gameChat } from "@/trigger/chat"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"

type ToolPart = Extract<UIMessage["parts"][number], { toolCallId: string }>

const TOOL_LABELS: Record<string, string> = {
  write_file: "Writing file",
  replace_text: "Editing file",
  read_file: "Reading file",
  list_files: "Listing files",
  delete_files: "Deleting files",
}

function getText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
}

function ToolMarker({ part }: { part: ToolPart }) {
  const name = getToolName(part)
  const label = TOOL_LABELS[name] ?? name
  const failed =
    part.state === "output-error" || part.state === "output-denied"
  const done = part.state === "output-available"

  return (
    <Marker data-state={failed ? "failed" : done ? "done" : "active"}>
      <MarkerIcon>
        {failed ? (
          <XIcon className="text-destructive" />
        ) : done ? (
          <CheckIcon />
        ) : (
          <Loader2Icon className="animate-spin" />
        )}
      </MarkerIcon>
      <MarkerContent className={failed ? "text-destructive" : undefined}>
        {label}
        {failed && part.state === "output-error" ? `: ${part.errorText}` : null}
      </MarkerContent>
    </Marker>
  )
}

export function ChatThread({
  id,
  initialMessages,
  initialPrompt,
  initialSession,
  onTurnFinish,
}: {
  id: string
  initialMessages: UIMessage[]
  initialPrompt?: string
  initialSession?: { publicAccessToken: string; lastEventId?: string }
  onTurnFinish?: () => void
}) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const transport = useTriggerChatTransport<typeof gameChat>({
    task: "game-chat",
    accessToken: ({ chatId }) => mintChatAccessToken(chatId),
    startSession: ({ chatId, clientData }) =>
      startChatSession({ chatId, clientData }),
    sessions: initialSession ? { [id]: initialSession } : undefined,
  })
  const { messages, sendMessage, status, stop } = useChat({
    id,
    messages: initialMessages,
    transport,
    resume: initialMessages.length > 0,
    onFinish: () => onTurnFinish?.(),
  })

  // Send the prompt from the new-game composer once, then drop it from the URL.
  // Deferred so React Strict Mode's mount/unmount/remount cycle cancels the first
  // run instead of letting useChat's unmount cleanup abort the request mid-flight.
  const promptSent = useRef(false)
  useEffect(() => {
    if (!initialPrompt || promptSent.current) return
    const timeout = setTimeout(() => {
      promptSent.current = true
      if (initialMessages.length === 0) sendMessage({ text: initialPrompt })
      router.replace(`/games/${id}`)
    }, 0)
    return () => clearTimeout(timeout)
  }, [initialPrompt, initialMessages.length, id, router, sendMessage])

  function handleSubmit(text: string) {
    if (status !== "ready") return
    sendMessage({ text })
    setValue("")
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <MessageScrollerProvider defaultScrollPosition="end">
        <MessageScroller className="h-auto flex-1">
          <MessageScrollerViewport className="scrollbar-none">
            <MessageScrollerContent className="mx-auto w-full max-w-3xl p-6">
              {messages.map((message) => (
                <MessageScrollerItem key={message.id} messageId={message.id}>
                  {message.role === "assistant" ? (
                    <Message>
                      <MessageAvatar>
                        <Image src="/logo.svg" alt="" width={32} height={32} />
                      </MessageAvatar>
                      <MessageContent>
                        {message.parts.map((part, index) => {
                          if (part.type === "text") {
                            return part.text ? (
                              <Bubble key={index} variant="ghost">
                                <BubbleContent>{part.text}</BubbleContent>
                              </Bubble>
                            ) : null
                          }
                          if (isToolUIPart(part)) {
                            return <ToolMarker key={index} part={part} />
                          }
                          return null
                        })}
                      </MessageContent>
                    </Message>
                  ) : (
                    <Message align="end">
                      <MessageContent>
                        <Bubble variant="secondary" align="end">
                          <BubbleContent>{getText(message)}</BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  )}
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="mx-auto w-full max-w-3xl shrink-0 px-6 pb-6">
        <ChatComposer
          value={value}
          onValueChange={setValue}
          onSubmit={handleSubmit}
          isRunning={status === "submitted" || status === "streaming"}
          onStop={stop}
        />
      </div>
    </div>
  )
}
