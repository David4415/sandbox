import { anthropic } from "@ai-sdk/anthropic"
import { chat } from "@trigger.dev/sdk/ai"
import { streamText } from "ai"

import { saveGameTurn } from "@/lib/games/chat-store"

// Trigger keeps the conversation history itself; the games row is a copy for
// rendering the page, plus the session state a reopened tab needs to reconnect.
export const gameChat = chat.agent({
  id: "game-chat",
  onTurnStart: async ({ chatId, uiMessages, chatAccessToken }) => {
    // Saved before the answer streams, so a tab reopened mid-answer can resume.
    chat.deferBeforeOutput(
      saveGameTurn(chatId, {
        messages: uiMessages,
        publicAccessToken: chatAccessToken,
      })
    )
  },
  onTurnComplete: async ({
    chatId,
    uiMessages,
    chatAccessToken,
    lastEventId,
  }) => {
    await saveGameTurn(chatId, {
      messages: uiMessages,
      publicAccessToken: chatAccessToken,
      lastEventId,
    })
  },
  run: async ({ messages, signal }) =>
    streamText({
      ...chat.toStreamTextOptions(),
      model: anthropic("claude-sonnet-5-5"),
      messages,
      abortSignal: signal,
    }),
})
