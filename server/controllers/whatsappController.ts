import type { Request, Response } from "express";
import { storage } from "../storage";
import { whatsappConversionSchema } from "@shared/validation";
import { ApiResponse, WhatsAppConversion } from "@shared/types";
import { HTTP_STATUS } from "@shared/constants";
import { WhatsAppService } from "../services/whatsappService";
import { z } from "zod";
import { log } from "../utils/vite"; // ✅ Caminho corrigido

export class WhatsAppController {
  static async createConversion(req: Request, res: Response) {
    try {
      const validatedData = whatsappConversionSchema.parse(req.body);

      // ✅ Validação aprimorada
      const isValidName = validatedData.name && validatedData.name.trim() !== "";
      const isValidButton = validatedData.buttonType && validatedData.buttonType.trim() !== "";

      if (!isValidName || !isValidButton) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: "Campos obrigatórios ausentes ou vazios: 'name' e 'buttonType'",
        });
      }

      const conversionData: WhatsAppConversion = {
        ...validatedData,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.get("User-Agent") || "Unknown",
      };

      const conversion = await WhatsAppService.createConversion(conversionData);
      const userAgent = req.get("User-Agent") || "";
      const whatsappUrl = WhatsAppService.generateWhatsAppUrl(conversion, userAgent);

      const response: ApiResponse = {
        success: true,
        data: { conversion, whatsappUrl },
      };

      log(`Conversão registrada com sucesso: ${validatedData.buttonType} - ${validatedData.name}`, "WhatsAppController");
      res.json(response);
    } catch (error) {
      console.error("[WhatsAppController] Error creating conversion:", error);

      if (error instanceof z.ZodError) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: "Dados inválidos fornecidos",
          message: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", "),
        });
      }

      res.status(500).json({
        success: false,
        error: "Erro ao processar solicitação",
      });
    }
  }

  static async getConversions(req: Request, res: Response) {
    try {
      const conversions = await storage.getAllWhatsappConversions();

      const response: ApiResponse = {
        success: true,
        data: conversions,
      };

      res.json(response);
    } catch (error) {
      console.error("[WhatsAppController] Erro ao buscar conversões:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno ao buscar conversões",
      });
    }
  }

  static async exportConversions(req: Request, res: Response) {
    try {
      const conversions = await storage.getAllWhatsappConversions();

      const csv = conversions.map(conv =>
        `"${conv.name}","${conv.email}","${conv.phone}","${conv.buttonType}","${conv.createdAt}"`
      ).join("\n");

      res.setHeader("Content-disposition", "attachment; filename=conversions.csv");
      res.setHeader("Content-Type", "text/csv");
      res.send(csv);
    } catch (error) {
      console.error("[WhatsAppController] Erro ao exportar conversões:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno ao exportar conversões",
      });
    }
  }
}
