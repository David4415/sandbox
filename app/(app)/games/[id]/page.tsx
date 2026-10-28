import { auth } from "@clerk/nextjs/server"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await auth.protect({ unauthenticatedUrl: "/sign-in" })
  const { id } = await params

  return <p>{id}</p>
}
