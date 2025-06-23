import type { Request, Response } from "express";
import { storage } from "../storage";
import { ApiResponse } from "@shared/types";

export class WhatsAppController {
  static async createConversion(req: Request, res: Response) {
    try {
      console.log('WhatsApp Controller - received data:', req.body);
      
      const { buttonType, name, phone, email, planName, doctorName } = req.body;
      
      if (!buttonType) {
        const response: ApiResponse = {
          success: false,
          error: "Campo buttonType é obrigatório"
        };
        return res.status(400).json(response);
      }
      
      const conversionData = {
        buttonType,
        name: name || '',
        phone: phone || '',
        email: email || '',
        planName: planName || null,
        doctorName: doctorName || null,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null
      };

      const conversion = await storage.createWhatsappConversion(conversionData);
      
      const response: ApiResponse = {
        success: true,
        data: conversion
      };
      
      res.json(response);
    } catch (error) {
      console.error("[WhatsAppController] Error creating conversion:", error);
      
      const response: ApiResponse = {
        success: false,
        error: "Erro ao criar conversão"
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
      console.error("[WhatsAppController] Error getting conversions:", error);
      
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
        const csv = WhatsAppController.convertToCSV(conversions);
        
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
      console.error("[WhatsAppController] Error exporting conversions:", error);
      
      const response: ApiResponse = {
        success: false,
        error: "Erro ao exportar conversões"
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
