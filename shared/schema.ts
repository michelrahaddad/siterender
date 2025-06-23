import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tabelas principais
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  cpf: text("cpf").notNull().unique(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // individual, familiar, empresarial
  annualPrice: decimal("annual_price", { precision: 10, scale: 2 }).notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  adhesionFee: decimal("adhesion_fee", { precision: 10, scale: 2 }).default("0"),
  maxDependents: integer("max_dependents").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  planId: integer("plan_id").notNull().references(() => plans.id),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  paymentStatus: text("payment_status").default("pending"),
  isActive: boolean("is_active").default(true),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull().references(() => subscriptions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paidAt: timestamp("paid_at").defaultNow(),
  method: text("method").notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const whatsappConversions = pgTable("whatsapp_conversions", {
  id: serial("id").primaryKey(),
  phone: text("phone"),
  name: text("name"),
  email: text("email"),
  buttonType: text("button_type").notNull(), // 'plan_subscription', 'doctor_appointment', 'enterprise_quote'
  planName: text("plan_name"),
  doctorName: text("doctor_name"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const digitalCards = pgTable("digital_cards", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull().references(() => subscriptions.id),
  cardNumber: text("card_number").notNull().unique(),
  qrCode: text("qr_code").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export type WhatsappConversion = typeof whatsappConversions.$inferSelect;
export type InsertWhatsappConversion = typeof whatsappConversions.$inferInsert;

export type DigitalCard = typeof digitalCards.$inferSelect;
export type InsertDigitalCard = typeof digitalCards.$inferInsert;

// Schemas com Zod
export const insertLeadSchema = createInsertSchema(leads, {
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8),
});

export const insertCustomerSchema = createInsertSchema(customers);
export const insertPlanSchema = createInsertSchema(plans);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertDigitalCardSchema = createInsertSchema(digitalCards);
export const insertAdminUserSchema = createInsertSchema(adminUsers);
export const insertWhatsappConversionSchema = createInsertSchema(whatsappConversions);
