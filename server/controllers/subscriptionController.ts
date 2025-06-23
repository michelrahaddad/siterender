import type { Request, Response } from "express";
import { storage } from "../storage";
import { ApiResponse } from "@shared/types";

export class SubscriptionController {
  static async createSubscription(req: Request, res: Response) {
    try {
      const { customerId, planId, paymentMethod } = req.body;
      
      // Validate plan exists
      const plan = await storage.getPlanById(planId);
      if (!plan) {
        const response: ApiResponse = {
          success: false,
          error: "Plano não encontrado"
        };
        return res.status(404).json(response);
      }
      
      // Create subscription
      const subscription = await storage.createSubscription({
        customerId,
        planId,
        paymentMethod,
        paymentStatus: 'pending',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      });
      
      const response: ApiResponse = {
        success: true,
        data: subscription,
        message: "Assinatura criada com sucesso"
      };
      
      res.status(201).json(response);
    } catch (error) {
      console.error("[SubscriptionController] Error creating subscription:", error);
      
      const response: ApiResponse = {
        success: false,
        error: "Erro ao criar assinatura"
      };
      
      res.status(500).json(response);
    }
  }

  static async getSubscriptionById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          error: "ID da assinatura inválido"
        };
        return res.status(400).json(response);
      }
      
      const subscription = await storage.getSubscriptionById(id);
      
      if (!subscription) {
        const response: ApiResponse = {
          success: false,
          error: "Assinatura não encontrada"
        };
        return res.status(404).json(response);
      }
      
      const response: ApiResponse = {
        success: true,
        data: subscription
      };
      
      res.json(response);
    } catch (error) {
      console.error("[SubscriptionController] Error getting subscription by ID:", error);
      
      const response: ApiResponse = {
        success: false,
        error: "Erro ao buscar assinatura"
      };
      
      res.status(500).json(response);
    }
  }
}
