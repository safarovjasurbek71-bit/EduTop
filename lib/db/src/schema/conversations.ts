import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { coursesTable } from "./courses";
import { teachersTable } from "./teachers";

export const conversationsTable = pgTable("conversations", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => coursesTable.id),
  teacherId: text("teacher_id").notNull().references(() => teachersTable.id),
  guestName: text("guest_name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  unreadCount: integer("unread_count").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("conversations_teacher_idx").on(table.teacherId)]);

export const messagesTable = pgTable("conversation_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull().references(() => conversationsTable.id),
  senderType: text("sender_type").notNull(),
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("messages_conversation_idx").on(table.conversationId)]);

export const insertConversationSchema = createInsertSchema(conversationsTable);
export const insertMessageSchema = createInsertSchema(messagesTable);
export type Conversation = typeof conversationsTable.$inferSelect;
