"use client"

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { CoinsIcon, MessageSquareIcon, SquarePenIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Empty, EmptyDescription } from "@/components/ui/empty"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppSidebar({
  games,
}: {
  games: { id: string; title: string }[]
}) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:hidden">
              <Image src="/logo.svg" alt="" width={20} height={20} className="size-5" />
              <span className="font-logo text-base">Sandbox</span>
            </div>
            <SidebarTrigger />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/"}
                  render={<Link href="/" />}
                >
                  <SquarePenIcon />
                  New game
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Recents</SidebarGroupLabel>
          <SidebarGroupContent>
            {games.length === 0 ? (
              <Empty className="border p-2 group-data-[collapsible=icon]:hidden">
                <EmptyDescription className="text-xs">
                  Your games will live here.
                </EmptyDescription>
              </Empty>
            ) : (
              <SidebarMenu className="group-data-[collapsible=icon]:hidden">
                {games.map((game) => (
                  <SidebarMenuItem key={game.id}>
                    <SidebarMenuButton>{game.title}</SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
            <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <MessageSquareIcon />
                  Recents
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <CoinsIcon />
              Credits
            </SidebarMenuButton>
            <SidebarMenuBadge>$1.00</SidebarMenuBadge>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="flex items-center justify-between gap-2 px-2 group-data-[collapsible=icon]:px-0">
          <OrganizationSwitcher
            appearance={{
              elements: {
                rootBox:
                  "w-full! max-w-full min-w-0 flex-1 group-data-[collapsible=icon]:hidden",
                organizationSwitcherTrigger: "w-full min-w-0 max-w-full justify-between",
                organizationPreviewTextContainer: "min-w-0",
                organizationPreviewMainIdentifier: "truncate",
              },
            }}
          />
          <UserButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
