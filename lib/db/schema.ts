import type { UIMessage } from "ai"
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull(),
    title: text("title").notNull(),
    messages: jsonb("messages").$type<UIMessage[]>().notNull().default([]),
    // Trigger.dev chat session state, written with `messages` so a reload resumes from the right cursor.
    publicAccessToken: text("public_access_token"),
    lastEventId: text("last_event_id"),
    // Daytona sandbox that holds this game's files.
    sandboxId: text("sandbox_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("games_org_id_idx").on(table.orgId)],
)
