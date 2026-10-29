import { anthropic } from "@ai-sdk/anthropic"
import { auth } from "@clerk/nextjs/server"
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai"

import { getGame, saveGameMessages } from "@/lib/games/queries"

export const maxDuration = 30

export async function POST(request: Request) {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, message }: { id: string; message: UIMessage } =
    await request.json()

  const game = await getGame(id)
  if (!game) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const messages = [...game.messages, message]

  const result = streamText({
    model: anthropic("claude-sonnet-5-5"),
    messages: await convertToModelMessages(messages),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      onEnd: ({ messages }) => saveGameMessages(orgId, id, messages),
    }),
  })
}
