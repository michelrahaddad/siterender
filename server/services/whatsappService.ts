import { WhatsAppConversion } from "@shared/types";
import { InsertWhatsappConversion } from "@shared/schema";
import { WHATSAPP_CONFIG } from "@shared/constants";
import { storage } from "../storage";

export class WhatsAppService {
  static async createConversion(data: InsertWhatsappConversion) {
    return await storage.createWhatsappConversion(data);
  }

  static generateWhatsAppUrl(conversion: Partial<WhatsAppConversion>, userAgent?: string): string {
    // ✅ Verificação explícita contra campos vazios ou ausentes
    const buttonType = conversion.buttonType?.trim();
    if (!buttonType) {
      throw new Error("Missing or empty 'buttonType' for WhatsApp URL generation");
    }

    const name = conversion.name?.trim() || "Cliente";
    const phone = conversion.phone?.trim() || "";
    const email = conversion.email?.trim() || "";
    const planName = conversion.planName?.trim() || "";
    const doctorName = conversion.doctorName?.trim() || "";

    let message = "";

    switch (buttonType) {
      case "plan_subscription":
        message = WHATSAPP_CONFIG.MESSAGE_TEMPLATES.PLAN_SUBSCRIPTION(name, phone, email, planName);
        break;
      case "doctor_appointment":
        message = WHATSAPP_CONFIG.MESSAGE_TEMPLATES.DOCTOR_APPOINTMENT(name, phone, email, doctorName);
        break;
      case "enterprise_quote":
        message = WHATSAPP_CONFIG.MESSAGE_TEMPLATES.ENTERPRISE_QUOTE(name, phone, email);
        break;
      default:
        throw new Error(`Tipo de botão inválido: ${buttonType}`);
    }

    const encoded = encodeURIComponent(message);
    const isMobile = userAgent
      ? /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|phone/i.test(userAgent)
      : false;

    return isMobile
      ? `https://wa.me/${WHATSAPP_CONFIG.DEFAULT_PHONE}?text=${encoded}`
      : `https://web.whatsapp.com/send?phone=${WHATSAPP_CONFIG.DEFAULT_PHONE}&text=${encoded}`;
  }
}
