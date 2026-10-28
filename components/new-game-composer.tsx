"use client"

import { useState } from "react"

import { ChatComposer } from "@/components/chat-composer"
import { createGame } from "@/lib/games/actions"

export function NewGameComposer() {
  const [value, setValue] = useState("")

  return (
    <ChatComposer
      value={value}
      onValueChange={setValue}
      action={async (formData) => {
        await createGame(formData)
        setValue("")
      }}
    />
  )
}
