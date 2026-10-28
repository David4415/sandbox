import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

import { ChatThread } from "@/components/chat-thread"
import { getGame } from "@/lib/games/queries"

export default async function Page({
  params,
  searchParams,
}: PageProps<"/games/[id]">) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })

  const { id } = await params
  const game = await getGame(id)
  if (!game) notFound()

  const { prompt } = await searchParams

  return (
    <ChatThread
      gameId={game.id}
      initialMessages={game.messages}
      initialPrompt={
        game.messages.length === 0 && typeof prompt === "string"
          ? prompt
          : undefined
      }
    />
  )
}
