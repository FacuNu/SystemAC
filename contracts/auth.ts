import { z } from "zod";
import { userSessionSchema } from "@/contracts/shared";

export const loginRequestSchema = z.object({
  employeeCode: z.string().trim().min(1, "El ID es obligatorio."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

export const changePasswordRequestSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Debes confirmar la nueva contraseña."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const loginResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  redirectTo: z.string().nullable(),
  user: userSessionSchema.nullable(),
});

export const logoutResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
});

export const changePasswordResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
  redirectTo: z.string().nullable(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type ChangePasswordResponse = z.infer<typeof changePasswordResponseSchema>;
