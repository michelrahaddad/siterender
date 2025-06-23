export interface TrackingData {
  buttonType: 'plan_subscription' | 'doctor_appointment' | 'enterprise_quote';
  planName?: string;
  doctorName?: string;
  name: string; // ← obrigatório
  phone?: string;
  email?: string; // ← opcional
}

export const trackWhatsAppConversion = async (data: TrackingData) => {
  try {
    if (!data.buttonType || data.buttonType.trim() === '') {
      console.warn('❌ Falha ao rastrear conversão: buttonType ausente ou inválido', data);
      return;
    }

    if (!data.name || data.name.trim().length < 2) {
      console.warn('❌ Nome inválido fornecido na conversão:', data);
      return;
    }

    await fetch('/track-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('❌ Erro ao enviar conversão para o backend:', error);
  }
};

export const generateWhatsAppLink = (phone: string, message: string, trackingData: TrackingData): string => {
  if (!trackingData.buttonType || trackingData.buttonType.trim() === '') {
    console.warn('❌ buttonType ausente ao gerar link WhatsApp:', trackingData);
    return '#'; // Link neutro para evitar redirecionamento inválido
  }

  // Rastreia a conversão
  trackWhatsAppConversion(trackingData);

  // Gera o link para redirecionamento
  const { generateWhatsAppUrl } = require('@/lib/device-detection');
  return generateWhatsAppUrl(phone, message);
};
