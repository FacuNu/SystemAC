import { z } from "zod";
import {
  geoPointSchema,
  isoDateTimeSchema,
  reportSummarySchema,
  userSessionSchema,
} from "@/contracts/shared";

export const checkInRequestSchema = z.object({
  location: geoPointSchema,
  clientTimestamp: isoDateTimeSchema,
});

export const checkInResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  report: reportSummarySchema.nullable(),
});

export const checkOutRequestSchema = z.object({
  location: geoPointSchema,
  taskText: z.string().trim().max(5000).optional(),
  confirmNullReport: z.boolean(),
  clientTimestamp: isoDateTimeSchema,
});

export const checkOutResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
  report: reportSummarySchema.nullable(),
});

export const currentReportStateSchema = z.object({
  ok: z.boolean(),
  user: userSessionSchema.nullable(),
  openReport: reportSummarySchema.nullable(),
});

export type CheckInRequest = z.infer<typeof checkInRequestSchema>;
export type CheckInResponse = z.infer<typeof checkInResponseSchema>;
export type CheckOutRequest = z.infer<typeof checkOutRequestSchema>;
export type CheckOutResponse = z.infer<typeof checkOutResponseSchema>;
export type CurrentReportState = z.infer<typeof currentReportStateSchema>;
