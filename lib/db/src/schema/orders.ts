import { pgTable, text, jsonb, timestamp, numeric, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  buyerId: text("buyer_id").notNull(),
  items: jsonb("items").notNull().$type<
    { serviceId: string; quantity: number; notes?: string }[]
  >(),
  paymentMethod: text("payment_method").notNull(),
  promoCode: text("promo_code"),
  address: text("address"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  paymentId: text("payment_id"),
  total: numeric("total", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
