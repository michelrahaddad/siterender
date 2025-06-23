import type { Request, Response } from "express";
import { storage } from "../storage";
import { whatsappConversionSchema } from "@shared/validation";
import { ApiResponse, WhatsAppConversion } from "@shared/types";
import { HTTP_STATUS } from "@shared/constants";
import { WhatsAppService } from "../services/whatsappService";
import { z } from "zod";
import { log } from "../core/vite"; // ajuste conforme sua estrutura

export class WhatsAppController {
  static async createConversion(req: Request, res: Response) {
    try {
      const validatedData = whatsappConversionSchema.parse(req.body);

      const isValidName = validatedData.name?.trim() !== "";
      const isValidButton = validatedData.buttonType?.trim() !== "";

      if (!isValidName || !isValidButton) {
        log(`[WhatsAppController] ❌ Campos obrigatórios ausentes ou vazios`, "whatsapp");

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: "Campos obrigatórios ausentes ou vazios: 'name' e 'buttonType'"
        });
      }

      const conversionData: WhatsAppConversion = {
        ...validatedData,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.get("User-Agent") || "Unknown"
      };

      const conversion = await WhatsAppService.createConversion(conversionData);
      const userAgent = req.get("User-Agent") || "";
      const whatsappUrl = WhatsAppService.generateWhatsAppUrl(conversion, userAgent);

      log(`[WhatsAppController] ✅ Conversão registrada com sucesso. Tipo: ${conversion.buttonType}`, "whatsapp");

      const response: ApiResponse = {
        success: true,
        data: { conversion, whatsappUrl }
      };

      return res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        log(`[WhatsAppController] ❌ Erro de validação: ${error.message}`, "whatsapp");

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: "Dados inválidos fornecidos",
          message: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")
        });
      }

      log(`[WhatsAppController] ❌ Erro interno ao criar conversão: ${error instanceof Error ? error.message : String(error)}`, "whatsapp");

      return res.status(500).json({
        success: false,
        error: "Erro ao processar solicitação"
      });
    }
  }

  static async getConversions(req: Request, res: Response) {
    try {
      const conversions = await storage.getAllWhatsappConversions();

      const response: ApiResponse = {
        success: true,
        data: conversions
      };

      return res.json(response);
    } catch (error) {
      log(`[WhatsAppController] ❌ Erro ao buscar conversões: ${String(error)}`, "whatsapp");

      return res.status(500).json({
        success: false,
        error: "Erro interno ao buscar conversões"
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
      return res.send(csv);
    } catch (error) {
      log(`[WhatsAppController] ❌ Erro ao exportar CSV: ${String(error)}`, "whatsapp");

      return res.status(500).json({
        success: false,
        error: "Erro interno ao exportar conversões"
      });
    }
  }
}

