import { eq } from "drizzle-orm"

import { daytona } from "@/lib/daytona/client"
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

// Gives a game its own sandbox, seeded with a placeholder page, and records the
// id on the game row. Worker-side like ../games/chat-store: no Clerk context.
export async function createGameSandbox(gameId: string) {
  const sandbox = await daytona.create({ labels: { gameId } })

  await sandbox.fs.createFolder("/home/daytona/game", "755")
  await sandbox.fs.uploadFile(
    Buffer.from("New game"),
    "/home/daytona/game/index.html"
  )

  await db.update(games).set({ sandboxId: sandbox.id }).where(eq(games.id, gameId))
  return sandbox.id
}
