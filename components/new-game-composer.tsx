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
      onSubmit={(title) => {
        const formData = new FormData()
        formData.set("title", title)
        void createGame(formData)
        setValue("")
      }}
    />
  )
}
