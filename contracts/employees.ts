import { z } from "zod";
import {
  compensationTypeSchema,
  employeeRoleSchema,
} from "@/contracts/shared";

const employeeCodeSchema = z.string().trim().min(1).transform((value) => value.toUpperCase());
const moneySchema = z.coerce.number().nonnegative();

export const employeeSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  employeeCode: z.string(),
  role: employeeRoleSchema,
  hourlyRate: z.number().nullable(),
  monthlySalary: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const adminEmployeeListResponseSchema = z.object({
  ok: z.literal(true),
  employees: z.array(employeeSchema),
});

export const createEmployeeRequestSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  employeeCode: employeeCodeSchema,
  dni: z.string().trim().min(6).max(32),
  compensationType: compensationTypeSchema.exclude(["unset"]),
  amount: moneySchema,
  isActive: z.boolean().default(true),
});

export const updateEmployeeRequestSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  employeeCode: employeeCodeSchema,
  compensationType: compensationTypeSchema.exclude(["unset"]),
  amount: moneySchema,
  isActive: z.boolean(),
});

export const resetEmployeePasswordRequestSchema = z.object({
  newPassword: z.string().trim().min(8).max(128),
});

export const resetEmployeePasswordResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
});

export const employeeMutationResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
  employee: employeeSchema,
});

export type EmployeeRecord = z.infer<typeof employeeSchema>;
export type CreateEmployeeRequest = z.infer<typeof createEmployeeRequestSchema>;
export type UpdateEmployeeRequest = z.infer<typeof updateEmployeeRequestSchema>;
export type ResetEmployeePasswordRequest = z.infer<
  typeof resetEmployeePasswordRequestSchema
>;
