import { DaytonaNotFoundError, type Sandbox } from "@daytona/sdk"
import { eq } from "drizzle-orm"

import { daytona } from "@/lib/daytona/client"
import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

// Gives a game its own sandbox, seeded with a placeholder page, and records the
// id on the game row. Worker-side like ../games/chat-store: no Clerk context.
export async function createGameSandbox(gameId: string): Promise<{ sandbox: Sandbox }> {
  const sandbox = await daytona.create({ labels: { gameId } })

  await sandbox.fs.createFolder("/home/daytona/game", "755")
  await sandbox.fs.uploadFile(
    Buffer.from("New game"),
    "/home/daytona/game/index.html"
  )

  await db.update(games).set({ sandboxId: sandbox.id }).where(eq(games.id, gameId))
  return { sandbox }
}

// Always resolves to a started sandbox for the game, for chat tools that need
// one: reuses the recorded sandbox (starting it if it was stopped) and only
// creates a fresh one when the game has none or it no longer exists.
export async function getGameSandbox(gameId: string): Promise<{ sandbox: Sandbox }> {
  const [game] = await db
    .select({ sandboxId: games.sandboxId })
    .from(games)
    .where(eq(games.id, gameId))
    .limit(1)
  if (!game) throw new Error(`Game ${gameId} not found`)

  if (game.sandboxId) {
    try {
      const sandbox = await daytona.get(game.sandboxId)
      if (sandbox.state !== "started") await sandbox.start()
      return { sandbox }
    } catch (error) {
      if (!(error instanceof DaytonaNotFoundError)) throw error
    }
  }

  return createGameSandbox(gameId)
}

export const GAME_DIR = "/home/daytona/game"
export const GAME_PORT = 3000
const SERVER_SESSION = "game-server"

async function isServerUp(sandbox: Sandbox) {
  const res = await sandbox.process.executeCommand(
    `curl -fsS -o /dev/null --max-time 2 http://localhost:${GAME_PORT}/index.html`
  )
  return res.exitCode === 0
}

// Serves the game's index.html from the sandbox on GAME_PORT. Reuses a running
// server when the health check passes instead of starting a new one.
export async function startGameServer(sandboxId: string) {
  const sandbox = await daytona.get(sandboxId)
  if (sandbox.state !== "started") await sandbox.start()

  if (!(await isServerUp(sandbox))) {
    try {
      await sandbox.process.createSession(SERVER_SESSION)
    } catch {
      // session already exists from a previous start
    }
    await sandbox.process.executeSessionCommand(SERVER_SESSION, {
      command: `cd ${GAME_DIR} && python3 -m http.server ${GAME_PORT}`,
      runAsync: true,
    })

    let up = false
    for (let i = 0; i < 10 && !up; i++) {
      await new Promise((r) => setTimeout(r, 500))
      up = await isServerUp(sandbox)
    }
    if (!up) throw new Error("Game server failed to start")
  }

  return { sandbox }
}
