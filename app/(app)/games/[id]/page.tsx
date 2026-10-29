import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

import { GameChat } from "@/components/game-chat"
import { getGame } from "@/lib/games/queries"

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ prompt?: string }>
}) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })
  const { id } = await params
  const { prompt } = await searchParams

  const game = await getGame(id)
  if (!game) notFound()

  return (
    <GameChat
      id={game.id}
      initialMessages={game.messages}
      initialSession={
        game.publicAccessToken
          ? {
              publicAccessToken: game.publicAccessToken,
              lastEventId: game.lastEventId ?? undefined,
            }
          : undefined
      }
      initialPrompt={prompt}
      hasSandbox={!!game.sandboxId}
    />
  )
}
