"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { ChatComposer } from "@/components/chat-composer"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"

function getText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
}

export function ChatThread({
  id,
  initialMessages,
  initialPrompt,
}: {
  id: string
  initialMessages: UIMessage[]
  initialPrompt?: string
}) {
  const router = useRouter()
  const [value, setValue] = useState("")
  const { messages, sendMessage, status } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      // The server holds the thread; only send the new message.
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: { id, message: messages[messages.length - 1] },
      }),
    }),
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
    <div className="flex h-svh flex-col">
      <MessageScrollerProvider defaultScrollPosition="end">
        <MessageScroller className="h-auto flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="mx-auto w-full max-w-3xl p-6">
              {messages.map((message) => (
                <MessageScrollerItem key={message.id} messageId={message.id}>
                  {message.role === "assistant" ? (
                    <Message>
                      <MessageAvatar>
                        <Image src="/logo.svg" alt="" width={32} height={32} />
                      </MessageAvatar>
                      <MessageContent>
                        <Bubble variant="ghost">
                          <BubbleContent>{getText(message)}</BubbleContent>
                        </Bubble>
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
      <div className="mx-auto w-full max-w-3xl px-6 pb-6">
        <ChatComposer
          value={value}
          onValueChange={setValue}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}
