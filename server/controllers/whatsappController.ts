import type { Request, Response } from "express";
import { storage } from "../storage";
import { whatsappConversionSchema } from "@shared/validation";
import { ApiResponse, WhatsAppConversion } from "@shared/types";
import { HTTP_STATUS } from "@shared/constants";
import { WhatsAppService } from "../services/whatsappService";
import { z } from "zod";

export class WhatsAppController {
  static async createConversion(req: Request, res: Response) {
    try {
      const validatedData = whatsappConversionSchema.parse(req.body);

      if (!validatedData.name || !validatedData.buttonType) {
        return res.status(400).json({
          success: false,
          error: "Campos obrigatórios ausentes: 'name' e 'buttonType'"
        });
      }

      const conversionData: WhatsAppConversion = {
        ...validatedData,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown',
      };

      const conversion = await WhatsAppService.createConversion(conversionData);
      const userAgent = req.get('User-Agent') || '';
      const whatsappUrl = WhatsAppService.generateWhatsAppUrl(conversion, userAgent);

      const response: ApiResponse = {
        success: true,
        data: { conversion, whatsappUrl }
      };

      res.json(response);
    } catch (error) {
      console.error("[WhatsAppController] Error creating conversion:", error);

      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: "Dados inválidos fornecidos",
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      }

      res.status(500).json({
        success: false,
        error: "Erro ao processar solicitação"
      });
    }
  }
}
