import { auth } from "@clerk/nextjs/server"

import { GAME_PORT, startGameServer } from "@/lib/daytona/utils"
import { getGame } from "@/lib/games/queries"

const PREVIEW_TTL_SECONDS = 3600

// GET /api/games/:id/preview -> { url } for the game's sandbox preview
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const game = await getGame(id)
  if (!game) return Response.json({ error: "Not found" }, { status: 404 })
  if (!game.sandboxId) {
    return Response.json({ error: "No sandbox yet" }, { status: 409 })
  }

  try {
    const { sandbox } = await startGameServer(game.sandboxId)
    const preview = await sandbox.getSignedPreviewUrl(
      GAME_PORT,
      PREVIEW_TTL_SECONDS
    )
    return Response.json({ url: preview.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Preview failed"
    return Response.json({ error: message }, { status: 502 })
  }
}
