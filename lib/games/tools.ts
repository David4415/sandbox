import type { Sandbox } from "@daytona/sdk"
import { tool } from "ai"
import { posix } from "node:path"
import { z } from "zod"

import { GAME_DIR, getGameSandbox } from "@/lib/daytona/utils"

const MAX_READ_BYTES = 200_000
const MAX_LIST_ENTRIES = 500

// Resolves a model-supplied path against the game directory and rejects
// anything that would land outside it (absolute paths, `..` escapes).
function resolveGamePath(path: string) {
  if (path.includes("\0") || posix.isAbsolute(path)) {
    throw new Error(`Path must be relative to the game directory: ${path}`)
  }
  const full = posix.join(GAME_DIR, path)
  if (full !== GAME_DIR && !full.startsWith(`${GAME_DIR}/`)) {
    throw new Error(`Path escapes the game directory: ${path}`)
  }
  return full
}

// Like resolveGamePath, but for targets that must be a file or subpath, not the root itself.
function resolveGameFile(path: string) {
  const full = resolveGamePath(path)
  if (full === GAME_DIR) throw new Error("Path must name a file or subdirectory")
  return full
}

async function ensureParentDirs(sandbox: Sandbox, fullPath: string) {
  const segments = posix.relative(GAME_DIR, posix.dirname(fullPath)).split("/")
  let dir = GAME_DIR
  for (const segment of segments.filter(Boolean)) {
    dir = `${dir}/${segment}`
    try {
      await sandbox.fs.createFolder(dir, "755")
    } catch {
      // already exists
    }
  }
}

async function walk(sandbox: Sandbox, dir: string, out: string[]) {
  for (const entry of await sandbox.fs.listFiles(dir)) {
    if (out.length >= MAX_LIST_ENTRIES) return
    const full = `${dir}/${entry.name}`
    const rel = posix.relative(GAME_DIR, full)
    if (entry.isDir) {
      out.push(`${rel}/`)
      await walk(sandbox, full, out)
    } else {
      out.push(rel)
    }
  }
}

// File tools for one game, confined to its sandbox's game directory. The
// sandbox is resolved lazily (once per turn) so turns that never touch files
// don't pay for it.
export function createGameTools(gameId: string) {
  let pending: Promise<Sandbox> | undefined
  const sandbox = () =>
    (pending ??= getGameSandbox(gameId).then(({ sandbox }) => sandbox))

  return {
    write_file: tool({
      description:
        "Create a file or completely overwrite an existing one. Parent directories are created as needed.",
      inputSchema: z.object({
        path: z.string().describe("File path relative to the game directory"),
        content: z.string().describe("Full file contents"),
      }),
      execute: async ({ path, content }) => {
        const full = resolveGameFile(path)
        const sb = await sandbox()
        await ensureParentDirs(sb, full)
        await sb.fs.uploadFile(Buffer.from(content), full)
        return { path, bytes: Buffer.byteLength(content) }
      },
    }),

    replace_text: tool({
      description:
        "Replace text in an existing file. `old_text` must match exactly (including whitespace) and appear exactly once, unless `replace_all` is true.",
      inputSchema: z.object({
        path: z.string().describe("File path relative to the game directory"),
        old_text: z.string().min(1).describe("Exact text to find"),
        new_text: z.string().describe("Replacement text"),
        replace_all: z.boolean().optional(),
      }),
      execute: async ({ path, old_text, new_text, replace_all }) => {
        const full = resolveGameFile(path)
        const sb = await sandbox()
        const current = (await sb.fs.downloadFile(full)).toString("utf8")

        const count = current.split(old_text).length - 1
        if (count === 0) throw new Error(`old_text not found in ${path}`)
        if (count > 1 && !replace_all) {
          throw new Error(
            `old_text appears ${count} times in ${path}; add more context or set replace_all`
          )
        }

        const updated = replace_all
          ? current.split(old_text).join(new_text)
          : current.replace(old_text, () => new_text)
        await sb.fs.uploadFile(Buffer.from(updated), full)
        return { path, replacements: replace_all ? count : 1 }
      },
    }),

    read_file: tool({
      description: "Read a text file from the game directory.",
      inputSchema: z.object({
        path: z.string().describe("File path relative to the game directory"),
      }),
      execute: async ({ path }) => {
        const full = resolveGameFile(path)
        const buffer = await (await sandbox()).fs.downloadFile(full)
        return {
          path,
          content: buffer.subarray(0, MAX_READ_BYTES).toString("utf8"),
          truncated: buffer.length > MAX_READ_BYTES,
        }
      },
    }),

    list_files: tool({
      description:
        "Recursively list files in the game directory (directories end with a slash).",
      inputSchema: z.object({
        path: z
          .string()
          .optional()
          .describe("Subdirectory to list; defaults to the game directory"),
      }),
      execute: async ({ path }) => {
        const dir = resolveGamePath(path ?? ".")
        const entries: string[] = []
        await walk(await sandbox(), dir, entries)
        return { entries, truncated: entries.length >= MAX_LIST_ENTRIES }
      },
    }),

    delete_files: tool({
      description:
        "Delete files or directories (directories are removed recursively).",
      inputSchema: z.object({
        paths: z
          .array(z.string())
          .min(1)
          .describe("Paths relative to the game directory"),
      }),
      execute: async ({ paths }) => {
        // Validate everything up front so a bad path deletes nothing.
        const targets = paths.map((path) => resolveGameFile(path))
        const sb = await sandbox()
        for (const full of targets) await sb.fs.deleteFile(full, true)
        return { deleted: paths }
      },
    }),
  }
}
