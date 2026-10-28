"use server"

import { anthropic } from "@ai-sdk/anthropic"
import { auth } from "@clerk/nextjs/server"
import { generateText } from "ai"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

export async function createGame(formData: FormData) {
  const { orgId } = await auth.protect({ unauthenticatedUrl: "/sign-in" })
  if (!orgId) throw new Error("No active organization")

  const prompt = String(formData.get("title") ?? "").trim()
  if (!prompt) return

  let title = prompt.slice(0, 60)
  try {
    const { text } = await generateText({
      model: anthropic("claude-haiku-5-5"),
      instructions:
        "Write a short title (max 6 words) for a game based on the user's description. Reply with the title only, no quotes or punctuation at the end.",
      prompt,
    })
    title = text.trim() || title
  } catch (error) {
    console.error("Failed to generate game title", error)
  }

  const [game] = await db
    .insert(games)
    .values({ orgId, title })
    .returning({ id: games.id })

  revalidatePath("/", "layout")
  redirect(`/games/${game.id}?${new URLSearchParams({ prompt })}`)
}
