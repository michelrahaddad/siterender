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

// Tabela de usuários do sistema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Tabela de administradores (adminUsers)
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

// Clientes
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  cpf: text("cpf").notNull().unique(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Planos disponíveis
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'individual', 'familiar', 'empresarial'
  annualPrice: decimal("annual_price", { precision: 10, scale: 2 }).notNull(),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Assinaturas ativas dos clientes
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  planId: integer("plan_id").notNull().references(() => plans.id),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
});

// Pagamentos
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull().references(() => subscriptions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paidAt: timestamp("paid_at").defaultNow(),
  method: text("method").notNull(), // 'pix', 'credit_card', etc.
});

// Leads
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Conversões pelo WhatsApp
export const whatsappConversions = pgTable("whatsapp_conversions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cartões digitais vinculados à assinatura
export const digitalCards = pgTable("digital_cards", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  subscriptionId: integer("subscription_id").notNull().references(() => subscriptions.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod Schemas
export const insertLeadSchema = createInsertSchema(leads, {
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8),
});

export const insertCustomerSchema = createInsertSchema(customers);
export const insertPlanSchema = createInsertSchema(plans);
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertPaymentSchema = createInsertSchema(payments);

// Exportações únicas e corretas
export {
  users,
  adminUsers,
  customers,
  subscriptions,
  digitalCards,
  plans,
  whatsappConversions,
  leads,
};
