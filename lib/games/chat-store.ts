import type { UIMessage } from "ai"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

// Worker-side persistence for the chat agent. Unlike ./queries, this has no
// Clerk request context: access is enforced when the session is started.
export async function loadGameMessages(id: string) {
  const [game] = await db
    .select({ messages: games.messages })
    .from(games)
    .where(eq(games.id, id))
    .limit(1)

  return game?.messages ?? []
}

export async function saveGameMessages(id: string, messages: UIMessage[]) {
  await db.update(games).set({ messages }).where(eq(games.id, id))
}

// One UPDATE, so messages and the resume cursor can never be read out of sync.
export async function saveGameTurn(
  id: string,
  turn: {
    messages: UIMessage[]
    publicAccessToken: string
    lastEventId?: string
  }
) {
  await db
    .update(games)
    .set({
      messages: turn.messages,
      publicAccessToken: turn.publicAccessToken,
      lastEventId: turn.lastEventId ?? null,
    })
    .where(eq(games.id, id))
}
