import { z } from "zod";
import {
  insertCustomerSchema,
  insertSubscriptionSchema,
  insertDigitalCardSchema,
  insertAdminUserSchema,
  insertWhatsappConversionSchema
} from "./schema";

// CPF validation function
export function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');
  if (cpf.length !== 11 || /^(.)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let rest = 11 - (sum % 11);
  if (rest >= 10) rest = 0;
  if (rest !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  rest = 11 - (sum % 11);
  if (rest >= 10) rest = 0;
  return rest === parseInt(cpf[10]);
}

// Phone validation
export function isValidPhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 10 || clean.length > 11) return false;
  const ddd = parseInt(clean.substring(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (clean.length === 11) return clean[2] === '9';
  return clean[2] !== '9';
}

// Schemas
export const emailSchema = z.string().email("Email inválido").min(1);
export const cpfSchema = z.string().min(11).max(14).refine(isValidCPF, "CPF inválido");
export const phoneSchema = z.string()
  .refine(phone => {
    const p = phone.replace(/\D/g, '');
    return p.length >= 10 && p.length <= 11;
  }, "Telefone deve ter entre 10 e 11 dígitos")
  .refine(isValidPhone, "Formato de telefone inválido");

export const nameSchema = z.string()
  .min(2, "Nome deve ter pelo menos 2 caracteres")
  .max(100)
  .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços");

// Conversão WhatsApp - Corrigido
export const whatsappConversionSchema = z.object({
  name: nameSchema,
  buttonType: z.enum(['plan_subscription', 'doctor_appointment', 'enterprise_quote'], {
    errorMap: () => ({ message: 'Tipo de botão inválido' })
  }),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  planName: z.string().optional(),
  doctorName: z.string().optional(),
});
