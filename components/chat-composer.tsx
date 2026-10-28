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
  action,
}: {
  value: string
  onValueChange: (value: string) => void
  onSubmit?: () => void
  action?: (formData: FormData) => void | Promise<void>
}) {
  return (
    <form
      action={action}
      onSubmit={
        onSubmit
          ? (event) => {
              event.preventDefault()
              onSubmit()
            }
          : undefined
      }
      className="contents"
    >
      <InputGroup>
        <InputGroupTextarea
          name="title"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="Describe the game you want to build…"
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
