import { pgTable, text, integer, timestamp, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { coursesTable } from "./courses";
import { teachersTable } from "./teachers";

export const reviewsTable = pgTable("reviews", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => coursesTable.id),
  teacherId: text("teacher_id").notNull().references(() => teachersTable.id),
  reviewerName: text("reviewer_name").notNull(),
  stars: integer("stars").notNull(),
  comment: text("comment").notNull(),
  visitorHash: text("visitor_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("reviews_visitor_course_idx").on(table.courseId, table.visitorHash),
  check("reviews_stars_range", sql`${table.stars} BETWEEN 1 AND 5`),
]);

export const insertReviewSchema = createInsertSchema(reviewsTable);
export type Review = typeof reviewsTable.$inferSelect;
