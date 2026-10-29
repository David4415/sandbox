import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

import { ChatThread } from "@/components/chat-thread"
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
    <ChatThread
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
    />
  )
}
