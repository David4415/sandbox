"use client"

import { ArrowUpIcon, ChevronDownIcon, GripIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"

export function ChatComposer({
  value,
  onValueChange,
  onSubmit,
}: {
  value: string
  onValueChange: (value: string) => void
  onSubmit: (value: string) => void
}) {
  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault()
        const text = value.trim()
        if (text) onSubmit(text)
      }}
    >
      <InputGroup>
        <InputGroupTextarea
          name="title"
          placeholder="Describe the game you want to build…"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
        <InputGroupAddon align="block-end">
          <DropdownMenu>
            <DropdownMenuTrigger render={<InputGroupButton />}>
              <GripIcon />
              Kimi K3
              <ChevronDownIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Kimi K3</DropdownMenuItem>
              <DropdownMenuItem>Claude Sonnet 5.5</DropdownMenuItem>
              <DropdownMenuItem>Claude Opus 5.5</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <InputGroupButton
            type="submit"
            variant="default"
            size="icon-sm"
            className="ml-auto rounded-full"
            aria-label="Send"
          >
            <ArrowUpIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}
