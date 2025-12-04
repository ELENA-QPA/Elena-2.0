import { z } from "zod";

// Schema para login
export const loginSchema = z.object({
  email: z.string().email({
    message: "Por favor ingrese un correo electrónico válido.",
  }),
  password: z.string().min(8, {
    message: "La contraseña debe tener al menos 8 caracteres.",
  }),
});

// Schema para registro
export const registerSchema = z.object({
  firstName: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  lastName: z.string().min(2, {
    message: "El apellido debe tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor ingrese un correo electrónico válido.",
  }),
  password: z.string().min(8, {
    message: "La contraseña debe tener al menos 8 caracteres.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Confirme su contraseña.",
  }),
  phone: z.string().min(10, {
    message: "El teléfono debe tener al menos 10 dígitos.",
  }),
  company: z.string().min(2, {
    message: "El nombre de la empresa debe tener al menos 2 caracteres.",
  }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debe aceptar los términos y condiciones.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Tipos TypeScript derivados de los esquemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// Schema para forgot password
export const forgotPasswordSchema = z.object({
  email: z.string().email({
    message: "Por favor ingrese un correo electrónico válido.",
  }),
});

// Schema para reset password
export const resetPasswordSchema = z.object({
  password: z.string().min(8, {
    message: "La contraseña debe tener al menos 8 caracteres.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Confirme su contraseña.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
