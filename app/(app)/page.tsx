import { auth } from "@clerk/nextjs/server"
import Image from "next/image"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default async function Page() {
  await auth.protect({unauthenticatedUrl:"/sign-in"})

  return (
    <div className="flex min-h-svh flex-col items-center bg-[#1c1b19] p-6">
      <Empty className="gap-0">
        <EmptyHeader className="max-w-3xl gap-6">
          <EmptyMedia className="mb-6">
            <Image src="/logo.svg" alt="Logo" width={96} height={96} priority />
          </EmptyMedia>
          <EmptyTitle className="text-4xl font-medium tracking-tight text-[#f3f2ee] sm:text-5xl">
            What should we build today?
          </EmptyTitle>
          <EmptyDescription className="text-lg/relaxed text-[#b8b3a7] sm:text-xl/relaxed">
            Build your own racers, shooters, puzzles and whole worlds using your
            own words. If you can describe it, you can play it.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
