"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

import { db } from "@/lib/db"
import { games } from "@/lib/db/schema"

export async function createGame(formData: FormData) {
  const { orgId } = await auth.protect({ unauthenticatedUrl: "/sign-in" })
  if (!orgId) throw new Error("No active organization")

  const title = String(formData.get("title") ?? "").trim()
  if (!title) return

  await db.insert(games).values({ orgId, title })

  revalidatePath("/", "layout")
}
