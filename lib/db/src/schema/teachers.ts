import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const teachersTable = pgTable("teachers", {
  id: text("id").primaryKey(),
  clerkId: text("clerk_id").unique(),
  fullNameUz: text("full_name_uz").notNull(),
  fullNameRu: text("full_name_ru").notNull(),
  specializationUz: text("specialization_uz").notNull().default(""),
  specializationRu: text("specialization_ru").notNull().default(""),
  bioUz: text("bio_uz").notNull().default(""),
  bioRu: text("bio_ru").notNull().default(""),
  avatarUrl: text("avatar_url"),
  experienceYears: integer("experience_years").notNull().default(0),
  certificates: jsonb("certificates").notNull().default([]),
  phone: text("phone"),
  telegramUrl: text("telegram_url"),
  websiteUrl: text("website_url"),
  youtubeUrl: text("youtube_url"),
  cityUz: text("city_uz"),
  cityRu: text("city_ru"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTeacherSchema = createInsertSchema(teachersTable);
export type Teacher = typeof teachersTable.$inferSelect;
