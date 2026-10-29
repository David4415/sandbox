"use server"

import { auth as clerkAuth } from "@clerk/nextjs/server"
import { auth } from "@trigger.dev/sdk"
import { chat, type ChatStartSessionParams } from "@trigger.dev/sdk/ai"

import type { gameChat } from "@/trigger/chat"

import { getGame } from "./queries"

const start = chat.createStartSessionAction<typeof gameChat>("game-chat")

// getGame is scoped to the caller's org, so a chatId (the game id) the caller
// doesn't own is rejected before any token or session is issued.
async function assertGameAccess(chatId: string) {
  const { userId, orgId } = await clerkAuth()
  if (!userId || !orgId) throw new Error("Unauthorized")
  if (!(await getGame(chatId))) throw new Error("Not found")
}

export async function startChatSession(
  params: ChatStartSessionParams<typeof gameChat>
) {
  await assertGameAccess(params.chatId)
  return start(params)
}

export async function mintChatAccessToken(chatId: string) {
  await assertGameAccess(chatId)
  return auth.createPublicToken({
    scopes: { read: { sessions: chatId }, write: { sessions: chatId } },
    expirationTime: "1h",
  })
}
