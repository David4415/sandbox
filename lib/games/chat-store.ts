import type { UIMessage } from "ai"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

// Worker-side persistence for the chat agent. Unlike ./queries, this has no
// Clerk request context: access is enforced when the session is started.
// One UPDATE, so messages and the resume cursor can never be read out of sync.
// `lastEventId` is left untouched when omitted (turn start).
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
      ...(turn.lastEventId && { lastEventId: turn.lastEventId }),
    })
    .where(eq(games.id, id))
}
