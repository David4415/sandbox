"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"

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

export function ChatThread({
  gameId,
  initialMessages,
  initialPrompt,
}: {
  gameId: string
  initialMessages: UIMessage[]
  initialPrompt?: string
}) {
  const router = useRouter()
  const promptSent = useRef(false)
  const [input, setInput] = useState("")
  const { messages, sendMessage } = useChat({
    id: gameId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: { id, message: messages[messages.length - 1] },
      }),
    }),
  })

  useEffect(() => {
    if (!initialPrompt || promptSent.current) return
    promptSent.current = true
    sendMessage({ text: initialPrompt })
    router.replace(`/games/${gameId}`)
  }, [initialPrompt, sendMessage, router, gameId])

  return (
    <div className="flex h-svh flex-col">
      <MessageScrollerProvider defaultScrollPosition="end">
        <MessageScroller className="h-auto flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="mx-auto w-full max-w-3xl p-6">
              {messages.map((message) => {
                const text = message.parts
                  .map((part) => (part.type === "text" ? part.text : ""))
                  .join("")

                return (
                  <MessageScrollerItem key={message.id} messageId={message.id}>
                    {message.role === "assistant" ? (
                      <Message>
                        <MessageAvatar>
                          <Image
                            src="/logo.svg"
                            alt=""
                            width={32}
                            height={32}
                          />
                        </MessageAvatar>
                        <MessageContent>
                          <Bubble variant="ghost">
                            <BubbleContent>{text}</BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    ) : (
                      <Message align="end">
                        <MessageContent>
                          <Bubble variant="secondary" align="end">
                            <BubbleContent>{text}</BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    )}
                  </MessageScrollerItem>
                )
              })}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="mx-auto mb-6 flex w-full max-w-3xl flex-col px-6 pb-6">
        <ChatComposer
          value={input}
          onValueChange={setInput}
          onSubmit={() => {
            const text = input.trim()
            if (!text) return
            sendMessage({ text })
            setInput("")
          }}
        />
      </div>
    </div>
  )
}
