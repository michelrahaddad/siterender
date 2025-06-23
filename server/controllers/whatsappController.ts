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
}
