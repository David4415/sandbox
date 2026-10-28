import { auth } from "@clerk/nextjs/server"
import type { UIMessage } from "ai"
import { and, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

export async function listGames() {
  const { orgId } = await auth()
  if (!orgId) return []

  return db
    .select({ id: games.id, title: games.title })
    .from(games)
    .where(eq(games.orgId, orgId))
    .orderBy(desc(games.updatedAt))
}

export async function getGame(id: string) {
  const { orgId } = await auth()
  if (!orgId) return null

  const [game] = await db
    .select({ id: games.id, title: games.title, messages: games.messages })
    .from(games)
    .where(and(eq(games.id, id), eq(games.orgId, orgId)))
    .limit(1)

  return game ?? null
}

export async function saveGameMessages({
  id,
  orgId,
  messages,
}: {
  id: string
  orgId: string
  messages: UIMessage[]
}) {
  await db
    .update(games)
    .set({ messages })
    .where(and(eq(games.id, id), eq(games.orgId, orgId)))
}
