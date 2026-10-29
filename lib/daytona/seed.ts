import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

import type { Sandbox } from "@daytona/sdk"

// Files seeded into every new sandbox. Not imported anywhere, so trigger.config.ts
// copies the folder into the deploy build; cwd is the project root (dev) or the
// build dir (deploy), and the folder sits at the same relative path in both.
const RUNTIME_DIR = path.join(process.cwd(), "lib/games/runtime")

// Copies every file and subfolder of RUNTIME_DIR into the sandbox game dir.
export async function seedRuntime(sandbox: Sandbox, localDir = RUNTIME_DIR, remoteDir = "/home/daytona/game") {
  await sandbox.fs.createFolder(remoteDir, "755")
  for (const entry of await readdir(localDir, { withFileTypes: true })) {
    const local = path.join(localDir, entry.name)
    const remote = `${remoteDir}/${entry.name}`
    if (entry.isDirectory()) await seedRuntime(sandbox, local, remote)
    else await sandbox.fs.uploadFile(await readFile(local), remote)
  }
}
