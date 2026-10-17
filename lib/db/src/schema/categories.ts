import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const categoriesTable = pgTable("categories", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  nameUz: text("name_uz").notNull(),
  nameRu: text("name_ru").notNull(),
  position: integer("position").notNull().default(0),
});

export const insertCategorySchema = createInsertSchema(categoriesTable);
export type Category = typeof categoriesTable.$inferSelect;
