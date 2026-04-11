import { z } from "zod";
import {
  baseDateRangeSchema,
  reportSummarySchema,
  salarySummarySchema,
} from "@/contracts/shared";

export const monthlyXlsxRequestSchema = baseDateRangeSchema.extend({
  format: z.literal("xlsx").default("xlsx"),
}).refine((value) => value.fromDate <= value.toDate, {
  message: "El rango de fechas no puede estar invertido.",
  path: ["toDate"],
});

export const monthlyXlsxResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  fileName: z.string().nullable(),
});

export const sendReportEmailRequestSchema = baseDateRangeSchema.extend({
  recipientEmail: z.string().email(),
  subject: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(5000),
}).refine((value) => value.fromDate <= value.toDate, {
  message: "El rango de fechas no puede estar invertido.",
  path: ["toDate"],
});

export const sendReportEmailResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  logId: z.string().uuid().nullable(),
});

export const adminSalaryDetailResponseSchema = z.object({
  ok: z.boolean(),
  summary: salarySummarySchema.nullable(),
  reports: z.array(reportSummarySchema),
});

export type MonthlyXlsxRequest = z.infer<typeof monthlyXlsxRequestSchema>;
export type MonthlyXlsxResponse = z.infer<typeof monthlyXlsxResponseSchema>;
export type SendReportEmailRequest = z.infer<typeof sendReportEmailRequestSchema>;
export type SendReportEmailResponse = z.infer<
  typeof sendReportEmailResponseSchema
>;
export type AdminSalaryDetailResponse = z.infer<
  typeof adminSalaryDetailResponseSchema
>;
