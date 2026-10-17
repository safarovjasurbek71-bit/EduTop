import { pgTable, text, integer, boolean, date, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { teachersTable } from "./teachers";
import { categoriesTable } from "./categories";

export const coursesTable = pgTable("courses", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull().references(() => teachersTable.id),
  titleUz: text("title_uz").notNull(),
  titleRu: text("title_ru").notNull(),
  descriptionUz: text("description_uz").notNull(),
  descriptionRu: text("description_ru").notNull(),
  categoryId: text("category_id").notNull().references(() => categoriesTable.id),
  deliveryMode: text("delivery_mode").notNull(),
  priceUzs: integer("price_uzs").notNull().default(0),
  originalPriceUzs: integer("original_price_uzs"),
  discountPercent: integer("discount_percent"),
  resourceUrl: text("resource_url"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  listingExpiresAt: timestamp("listing_expires_at", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("published"),
  featured: boolean("featured").notNull().default(false),
  cityUz: text("city_uz"),
  cityRu: text("city_ru"),
  scheduleUz: text("schedule_uz"),
  scheduleRu: text("schedule_ru"),
  paymentUrl: text("payment_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("courses_teacher_idx").on(table.teacherId),
  index("courses_active_idx").on(table.status, table.listingExpiresAt),
]);

export const insertCourseSchema = createInsertSchema(coursesTable);
export type Course = typeof coursesTable.$inferSelect;
