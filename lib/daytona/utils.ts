import type { Sandbox } from "@daytona/sdk"
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

const GAME_DIR = "/home/daytona/game"
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
