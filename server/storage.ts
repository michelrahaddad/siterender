import { customers, subscriptions, digitalCards, plans, adminUsers, whatsappConversions, type Customer, type InsertCustomer, type Subscription, type InsertSubscription, type DigitalCard, type InsertDigitalCard, type Plan, users, type User, type InsertUser, type AdminUser, type InsertAdminUser, type WhatsappConversion, type InsertWhatsappConversion } from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  getCustomerByCpf(cpf: string): Promise<Customer | undefined>;
  
  getAllPlans(): Promise<Plan[]>;
  getPlanById(id: number): Promise<Plan | undefined>;
  
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionById(id: number): Promise<Subscription | undefined>;
  updateSubscriptionStatus(id: number, status: string): Promise<Subscription | undefined>;
  
  createDigitalCard(card: InsertDigitalCard): Promise<DigitalCard>;
  getDigitalCardBySubscription(subscriptionId: number): Promise<DigitalCard | undefined>;

  // Admin management
  createAdminUser(admin: InsertAdminUser): Promise<AdminUser>;
  getAdminByUsername(username: string): Promise<AdminUser | undefined>;
  verifyAdminPassword(username: string, password: string): Promise<boolean>;

  // WhatsApp conversion tracking
  createWhatsappConversion(conversion: InsertWhatsappConversion): Promise<WhatsappConversion>;
  getAllWhatsappConversions(): Promise<WhatsappConversion[]>;
  getWhatsappConversionsByDateRange(startDate: Date, endDate: Date): Promise<WhatsappConversion[]>;
}

export class DatabaseStorage implements IStorage {
  private initialized = false;

  constructor() {
    // Initialize database setup in background
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    if (this.initialized || !process.env.DATABASE_URL) {
      return;
    }

    try {
      console.log('Initializing database...');
      
      // Create admin_users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);

      // Add missing columns to plans table
      await pool.query(`
        ALTER TABLE plans 
        ADD COLUMN IF NOT EXISTS adhesion_fee DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS max_dependents INTEGER DEFAULT 0
      `);

      // Add missing columns to whatsapp_conversions table
      await pool.query(`
        ALTER TABLE whatsapp_conversions 
        ADD COLUMN IF NOT EXISTS button_type TEXT NOT NULL DEFAULT 'plan_subscription',
        ADD COLUMN IF NOT EXISTS plan_name TEXT,
        ADD COLUMN IF NOT EXISTS doctor_name TEXT,
        ADD COLUMN IF NOT EXISTS ip_address TEXT,
        ADD COLUMN IF NOT EXISTS user_agent TEXT
      `);

      // Create admin user if not exists
      const adminCheck = await pool.query('SELECT COUNT(*) as count FROM admin_users WHERE username = $1', ['admin']);
      const adminCount = parseInt(adminCheck.rows[0].count);
      
      if (adminCount === 0) {
        const hashedPassword = await bcrypt.hash('vidah2025', 10);
        await pool.query(
          'INSERT INTO admin_users (username, password, email, is_active, created_at) VALUES ($1, $2, $3, $4, NOW())',
          ['admin', hashedPassword, 'admin@cartaovidah.com', true]
        );
        console.log('Admin user created successfully with username: admin, password: vidah2025');
      } else {
        console.log('Admin user already exists');
      }

      // Initialize plans if not exists
      const planCheck = await pool.query('SELECT COUNT(*) as count FROM plans');
      const planCount = parseInt(planCheck.rows[0].count);
      
      if (planCount === 0) {
        await pool.query(`
          INSERT INTO plans (name, type, annual_price, monthly_price, adhesion_fee, max_dependents, is_active, created_at)
          VALUES 
            ('Cartão Familiar', 'familiar', 418.80, 34.90, 0, 4, true, NOW()),
            ('Cartão Corporativo', 'empresarial', 0, 0, 0, 0, true, NOW())
        `);
        console.log('Plans initialized successfully');
      }

      this.initialized = true;
      console.log('Database initialization completed');
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer;
  }

  async getCustomerByCpf(cpf: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.cpf, cpf));
    return customer;
  }

  async getAllPlans(): Promise<Plan[]> {
    try {
      return await db.select().from(plans);
    } catch (error) {
      // Fallback to direct SQL
      const result = await pool.query('SELECT * FROM plans ORDER BY id');
      return result.rows;
    }
  }

  async getPlanById(id: number): Promise<Plan | undefined> {
    try {
      const [plan] = await db.select().from(plans).where(eq(plans.id, id));
      return plan;
    } catch (error) {
      const result = await pool.query('SELECT * FROM plans WHERE id = $1', [id]);
      return result.rows[0];
    }
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async getSubscriptionById(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }

  async updateSubscriptionStatus(id: number, status: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ paymentStatus: status })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription;
  }

  async createDigitalCard(insertCard: InsertDigitalCard): Promise<DigitalCard> {
    const [card] = await db
      .insert(digitalCards)
      .values(insertCard)
      .returning();
    return card;
  }

  async getDigitalCardBySubscription(subscriptionId: number): Promise<DigitalCard | undefined> {
    const [card] = await db.select().from(digitalCards).where(eq(digitalCards.subscriptionId, subscriptionId));
    return card;
  }

  async createAdminUser(insertAdmin: InsertAdminUser): Promise<AdminUser> {
    const hashedPassword = await bcrypt.hash(insertAdmin.password, 10);
    
    const result = await pool.query(
      'INSERT INTO admin_users (username, password, email, is_active, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [insertAdmin.username, hashedPassword, insertAdmin.email, true]
    );
    
    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      password: row.password,
      email: row.email,
      isActive: row.is_active,
      createdAt: row.created_at
    };
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    try {
      const result = await pool.query(
        'SELECT id, username, password, email, is_active, created_at FROM admin_users WHERE username = $1',
        [username]
      );
      
      if (result.rows.length === 0) return undefined;
      
      const row = result.rows[0];
      return {
        id: row.id,
        username: row.username,
        password: row.password,
        email: row.email,
        isActive: row.is_active,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error("Error getting admin by username:", error);
      return undefined;
    }
  }

  async verifyAdminPassword(username: string, password: string): Promise<boolean> {
    try {
      console.log('=== VERIFY ADMIN PASSWORD ===');
      console.log('Username:', username);
      console.log('Password provided:', !!password);
      console.log('Database URL exists:', !!process.env.DATABASE_URL);
      
      if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not configured');
        return false;
      }
      
      const admin = await this.getAdminByUsername(username);
      console.log('Admin found in DB:', admin ? 'YES' : 'NO');
      
      if (!admin) {
        console.log('Admin not found in database');
        return false;
      }
      
      console.log('Comparing password with hash...');
      const isValid = await bcrypt.compare(password, admin.password);
      console.log('Password comparison result:', isValid);
      
      return isValid;
    } catch (error) {
      console.error("Error verifying admin password:", error);
      console.error("Stack trace:", error.stack);
      return false;
    }
  }

  async createWhatsappConversion(insertConversion: InsertWhatsappConversion): Promise<WhatsappConversion> {
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error('Database not configured');
      }
      
      const result = await pool.query(`
        INSERT INTO whatsapp_conversions (name, phone, email, button_type, plan_name, doctor_name, ip_address, user_agent, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `, [
        insertConversion.name || '',
        insertConversion.phone || '',
        insertConversion.email || '',
        insertConversion.buttonType,
        insertConversion.planName || null,
        insertConversion.doctorName || null,
        insertConversion.ipAddress || null,
        insertConversion.userAgent || null
      ]);
      
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        buttonType: row.button_type,
        planName: row.plan_name,
        doctorName: row.doctor_name,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at
      };
    } catch (error) {
      console.error("Storage - database error:", error);
      throw error;
    }
  }

  async getAllWhatsappConversions(): Promise<WhatsappConversion[]> {
    try {
      const result = await pool.query(`
        SELECT id, name, phone, email, button_type, plan_name, doctor_name, ip_address, user_agent, created_at
        FROM whatsapp_conversions 
        ORDER BY created_at DESC
      `);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name || '',
        phone: row.phone || '',
        email: row.email || '',
        buttonType: row.button_type,
        planName: row.plan_name,
        doctorName: row.doctor_name,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error("Error getting WhatsApp conversions:", error);
      return [];
    }
  }

  async getWhatsappConversionsByDateRange(startDate: Date, endDate: Date): Promise<WhatsappConversion[]> {
    try {
      const result = await pool.query(`
        SELECT id, name, phone, email, button_type, plan_name, doctor_name, ip_address, user_agent, created_at
        FROM whatsapp_conversions 
        WHERE created_at >= $1 AND created_at <= $2
        ORDER BY created_at DESC
      `, [startDate, endDate]);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name || '',
        phone: row.phone || '',
        email: row.email || '',
        buttonType: row.button_type,
        planName: row.plan_name,
        doctorName: row.doctor_name,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error("Error getting WhatsApp conversions by date range:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
