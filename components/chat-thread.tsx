import Image from "next/image"

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

const messages = [
  {
    id: "1",
    role: "user",
    text: "I want a voxel survival game where I gather wood and stone, then build a shelter before night falls.",
  },
  {
    id: "2",
    role: "assistant",
    text: "Great idea. I'll start with a small procedurally generated island, a day/night cycle and basic gathering. Do you want zombies at night, or just darkness?",
  },
  {
    id: "3",
    role: "user",
    text: "Zombies, but slow ones. And let me craft a pickaxe and an axe.",
  },
  {
    id: "4",
    role: "assistant",
    text: "Done. I added slow zombies that spawn after sunset, plus a crafting menu with a wooden pickaxe and axe. Press E to open it. Want me to add a health bar next?",
  },
  {
    id: "5",
    role: "user",
    text: "Yes please, and make the world a bit bigger.",
  },
  {
    id: "6",
    role: "assistant",
    text: "Health bar added in the top-left corner, and the island is now twice as wide. Give it a try and tell me what you'd like to change.",
  },
]

export function ChatThread() {
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
                          <BubbleContent>{message.text}</BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  ) : (
                    <Message align="end">
                      <MessageContent>
                        <Bubble variant="secondary" align="end">
                          <BubbleContent>{message.text}</BubbleContent>
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
      <div className="mx-auto flex w-full mb-6 max-w-3xl flex-col px-6 pb-6">
        <ChatComposer />
      </div>
    </div>
  )
}
