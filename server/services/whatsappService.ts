import { WhatsAppConversion } from "@shared/types";
import { InsertWhatsappConversion } from "@shared/schema";
import { WHATSAPP_CONFIG } from "@shared/constants";
import { storage } from "../storage";

/**
 * Service class for handling WhatsApp conversion logic
 */
export class WhatsAppService {
  /**
   * Creates a new WhatsApp conversion record
   */
  static async createConversion(data: InsertWhatsappConversion) {
    return await storage.createWhatsappConversion(data);
  }

  /**
   * Generates WhatsApp URL with appropriate message template and device detection
   */
  static generateWhatsAppUrl(conversion: any, userAgent?: string): string {
    const {
      buttonType,
      name = '',
      phone = '',
      email = '',
      planName = '',
      doctorName = ''
    } = conversion;

    if (!buttonType || typeof buttonType !== 'string') {
      throw new Error("Missing or invalid 'buttonType' for WhatsApp URL generation");
    }

    let message = '';

    switch (buttonType) {
      case 'plan_subscription':
        message = WHATSAPP_CONFIG.MESSAGE_TEMPLATES.PLAN_SUBSCRIPTION(name, phone, email, planName);
        break;
      case 'doctor_appointment':
        message = WHATSAPP_CONFIG.MESSAGE_TEMPLATES.DOCTOR_APPOINTMENT(name, phone, email, doctorName);
        break;
      case 'enterprise_quote':
        message = WHATSAPP_CONFIG.MESSAGE_TEMPLATES.ENTERPRISE_QUOTE(name, phone, email);
        break;
      default:
        throw new Error(`Invalid button type: ${buttonType}`);
    }

    const encodedMessage = encodeURIComponent(message);

    const isMobile = userAgent
      ? /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|phone/i.test(userAgent)
      : false;

    if (isMobile) {
      return `https://wa.me/${WHATSAPP_CONFIG.DEFAULT_PHONE}?text=${encodedMessage}`;
    } else {
      return `https://web.whatsapp.com/send?phone=${WHATSAPP_CONFIG.DEFAULT_PHONE}&text=${encodedMessage}`;
    }
  }

  /**
   * Gets conversions by date range
   */
  static async getConversionsByDateRange(startDate: Date, endDate: Date) {
    return await storage.getWhatsappConversionsByDateRange(startDate, endDate);
  }

  /**
   * Gets all conversions
   */
  static async getAllConversions() {
    return await storage.getAllWhatsappConversions();
  }
}
