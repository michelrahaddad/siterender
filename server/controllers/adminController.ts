import type { Request, Response } from "express";
import { storage } from "../storage";
import { ApiResponse } from "@shared/types";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secure-secret-key-change-in-production";

export class AdminController {
  static async login(req: Request, res: Response) {
    try {
      console.log('Admin login attempt:', req.body);
      
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: "Username e password são obrigatórios"
        });
      }

      console.log(`[Security] Login attempt for username: ${username} from IP: ${req.ip}`);

      const isValid = await storage.verifyAdminPassword(username, password);
      
      if (!isValid) {
        console.log(`[Security] Failed login attempt for username: ${username} from IP: ${req.ip}`);
        
        return res.status(401).json({
          success: false,
          error: "Credenciais inválidas"
        });
      }

      const admin = await storage.getAdminByUsername(username);
      if (!admin) {
        console.log(`[Security] Admin not found: ${username}`);
        
        return res.status(401).json({
          success: false,
          error: "Usuário não encontrado"
        });
      }

      const token = jwt.sign(
        { 
          id: admin.id, 
          username: admin.username,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        },
        JWT_SECRET
      );

      console.log(`[Security] Successful login for username: ${username} from IP: ${req.ip}`);

      const response: ApiResponse = {
        success: true,
        data: {
          token,
          admin: {
            id: admin.id,
            username: admin.username,
            email: admin.email
          }
        }
      };

      res.json(response);
    } catch (error) {
      console.error("[AdminController] Login error:", error);
      
      const response: ApiResponse = {
        success: false,
        error: "Erro interno do servidor"
      };
      
      res.status(500).json(response);
    }
  }

  static async getConversions(req: Request, res: Response) {
    try {
      const conversions = await storage.getAllWhatsappConversions();
      
      const response: ApiResponse = {
        success: true,
        data: conversions
      };
      
      res.json(response);
    } catch (error) {
      console.error("[AdminController] Error getting conversions:", error);
      
      const response: ApiResponse = {
        success: false,
        error: "Erro ao buscar conversões"
      };
      
      res.status(500).json(response);
    }
  }

  static async exportConversions(req: Request, res: Response) {
    try {
      const { startDate, endDate, format = 'csv' } = req.query;
      
      let conversions;
      if (startDate && endDate) {
        conversions = await storage.getWhatsappConversionsByDateRange(
          new Date(startDate as string),
          new Date(endDate as string)
        );
      } else {
        conversions = await storage.getAllWhatsappConversions();
      }

      if (format === 'csv') {
        const csv = AdminController.convertToCSV(conversions);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="conversions.csv"');
        res.send(csv);
      } else {
        const response: ApiResponse = {
          success: true,
          data: conversions
        };
        res.json(response);
      }
    } catch (error) {
      console.error("[AdminController] Error exporting conversions:", error);
      
      const response: ApiResponse = {
        success: false,
        error: "Erro ao exportar conversões"
      };
      
      res.status(500).json(response);
    }
  }

  static async getDashboard(req: Request, res: Response) {
    try {
      const conversions = await storage.getAllWhatsappConversions();
      
      const stats = {
        totalConversions: conversions.length,
        planSubscriptions: conversions.filter(c => c.buttonType === 'plan_subscription').length,
        doctorConsultations: conversions.filter(c => c.buttonType === 'doctor_consultation').length,
        corporateQuotes: conversions.filter(c => c.buttonType === 'corporate_quote').length
      };
      
      const response: ApiResponse = {
        success: true,
        data: {
          stats,
          conversions: conversions.slice(0, 10) // Latest 10 conversions
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error("[AdminController] Error getting dashboard:", error);
      
      const response: ApiResponse = {
        success: false,
        error: "Erro ao buscar dashboard"
      };
      
      res.status(500).json(response);
    }
  }

  private static convertToCSV(conversions: any[]): string {
    if (conversions.length === 0) {
      return 'Email,Phone,First_Name,Last_Name,Interest_Category,Campaign_Type\n';
    }

    const headers = 'Email,Phone,First_Name,Last_Name,Interest_Category,Campaign_Type\n';
    
    const rows = conversions.map(conversion => {
      const [firstName, ...lastNameParts] = (conversion.name || '').split(' ');
      const lastName = lastNameParts.join(' ');
      const cleanPhone = (conversion.phone || '').replace(/\D/g, '');
      
      const interestCategory = conversion.planName || conversion.doctorName || 'Geral';
      const campaignType = conversion.buttonType === 'plan_subscription' ? 'Planos' :
                          conversion.buttonType === 'doctor_consultation' ? 'Consultas' :
                          'Corporativo';
      
      return `"${conversion.email || ''}","${cleanPhone}","${firstName || ''}","${lastName}","${interestCategory}","${campaignType}"`;
    });

    return headers + rows.join('\n');
  }
}
