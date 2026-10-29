import { anthropic } from "@ai-sdk/anthropic"
import { chat } from "@trigger.dev/sdk/ai"

import { createGameSandbox } from "@/lib/daytona/utils"
import { saveGameTurn } from "@/lib/games/chat-store"
import { gameInstructions } from "@/lib/games/instructions"

// Trigger keeps the conversation history itself; the games row is a copy for
// rendering the page, plus the session state a reopened tab needs to reconnect.
export const gameChat = chat.agent({
  id: "game-chat",
  // Once per chat (not on continuation runs), so each game gets exactly one sandbox.
  onChatStart: async ({ chatId }) => {
    await createGameSandbox(chatId)
  },
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
  run: async ({ messages, signal, streamText }) =>
    streamText({
      model: anthropic("claude-sonnet-5-5"),
      system: gameInstructions.join("\n\n"),
      messages,
      abortSignal: signal,
    }),
})
