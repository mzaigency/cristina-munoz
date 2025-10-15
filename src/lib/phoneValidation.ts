import { z } from "zod";

// Spanish phone number validation
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "El número de teléfono es requerido")
  .refine(
    (phone) => {
      // Remove spaces, dashes, and other common separators
      const cleanPhone = phone.replace(/[\s-]/g, "");
      // Spanish phone numbers are 9 digits
      // Mobile: starts with 6 or 7
      // Landline: starts with 8 or 9
      return /^[6-9]\d{8}$/.test(cleanPhone);
    },
    {
      message: "Introduce un número de teléfono válido (9 dígitos)",
    }
  );

export const cleanPhoneNumber = (phone: string): string => {
  return phone.trim().replace(/[\s-]/g, "");
};
