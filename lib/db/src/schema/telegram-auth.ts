import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";

export const telegramLoginAttemptsTable = pgTable("telegram_login_attempts", {
  stateHash: text("state_hash").primaryKey(),
  browserHash: text("browser_hash").notNull(),
  verifier: text("verifier").notNull(),
  nonce: text("nonce").notNull(),
  redirectUri: text("redirect_uri").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const telegramSessionsTable = pgTable("telegram_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  principal: text("principal").notNull(),
  displayName: text("display_name").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("telegram_sessions_expiry_idx").on(table.expiresAt)]);
