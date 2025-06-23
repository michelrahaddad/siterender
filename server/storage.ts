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
  constructor() {
    setTimeout(() => {
      this.initializePlans();
      this.initializeAdmin();
    }, 3000);
  }

  private async initializePlans() {
    try {
      // Ensure plans table has required columns
      await pool.query(`
        ALTER TABLE plans 
        ADD COLUMN IF NOT EXISTS adhesion_fee DECIMAL(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS max_dependents INTEGER DEFAULT 0
      `);
      
      // Check if plans exist using direct SQL
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
    } catch (error) {
      console.error("Error initializing plans:", error);
    }
  }

  private async initializeAdmin() {
    try {
      if (!process.env.DATABASE_URL) {
        console.log('DATABASE_URL not configured - skipping admin initialization');
        return;
      }
      
      console.log('Setting up admin user system...');
      
      // First, create the admin_users table if it doesn't exist
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
      
      // Check if admin exists
      const checkResult = await pool.query('SELECT COUNT(*) as count FROM admin_users WHERE username = $1', ['admin']);
      const adminCount = parseInt(checkResult.rows[0].count);
      
      console.log(`Found ${adminCount} admin users`);
      
      if (adminCount === 0) {
        console.log('Creating admin user...');
        const hashedPassword = await bcrypt.hash('vidah2025', 10);
        
        await pool.query(
          'INSERT INTO admin_users (username, password, email, is_active, created_at) VALUES ($1, $2, $3, $4, NOW())',
          ['admin', hashedPassword, 'admin@cartaovidah.com', true]
        );
        
        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }
    } catch (error) {
      console.error("Error initializing admin:", error);
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
      // Fallback to direct SQL if Drizzle fails
      const result = await pool.query('SELECT * FROM plans');
      return result.rows;
    }
  }

  async getPlanById(id: number): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
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
    const [admin] = await db
      .insert(adminUsers)
      .values({ ...insertAdmin, password: hashedPassword })
      .returning();
    return admin;
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    try {
      // Use direct PostgreSQL query to avoid schema conflicts
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
      console.log('Verifying admin password for username:', username);
      
      if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not configured');
        return false;
      }
      
      const admin = await this.getAdminByUsername(username);
      if (!admin) {
        console.log('Admin not found in database');
        return false;
      }
      
      console.log('Admin found, comparing password...');
      const isValid = await bcrypt.compare(password, admin.password);
      console.log('Password verification result:', isValid);
      
      return isValid;
    } catch (error) {
      console.error("Error verifying admin password:", error);
      return false;
    }
  }

  async createWhatsappConversion(insertConversion: InsertWhatsappConversion): Promise<WhatsappConversion> {
    try {
      console.log('Storage - attempting to save conversion:', insertConversion);
      
      if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL not configured');
        throw new Error('Database not configured');
      }
      
      const [conversion] = await db
        .insert(whatsappConversions)
        .values(insertConversion)
        .returning();
      
      console.log('Storage - conversion saved successfully');
      return conversion;
    } catch (error) {
      console.error("Storage - database error:", error);
      
      // Return fallback conversion to prevent crash
      const mockConversion: WhatsappConversion = {
        id: Date.now(),
        name: insertConversion.name || '',
        phone: insertConversion.phone || '',
        email: insertConversion.email || '',
        buttonType: insertConversion.buttonType,
        planName: insertConversion.planName || null,
        doctorName: insertConversion.doctorName || null,
        ipAddress: insertConversion.ipAddress || null,
        userAgent: insertConversion.userAgent || null,
        createdAt: new Date()
      };
      
      console.log('Storage - returning temporary conversion to prevent crash');
      return mockConversion;
    }
  }

  async getAllWhatsappConversions(): Promise<WhatsappConversion[]> {
    try {
      return await db.select().from(whatsappConversions).orderBy(whatsappConversions.createdAt);
    } catch (error) {
      console.error("Error getting WhatsApp conversions:", error);
      return [];
    }
  }

  async getWhatsappConversionsByDateRange(startDate: Date, endDate: Date): Promise<WhatsappConversion[]> {
    try {
      return await db
        .select()
        .from(whatsappConversions)
        .where(
          and(
            gte(whatsappConversions.createdAt, startDate),
            lte(whatsappConversions.createdAt, endDate)
          )
        )
        .orderBy(whatsappConversions.createdAt);
    } catch (error) {
      console.error("Error getting WhatsApp conversions by date range:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
