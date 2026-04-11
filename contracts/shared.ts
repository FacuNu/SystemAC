import { z } from "zod";

export const employeeRoleSchema = z.enum(["admin", "employee"]);
export const workReportStatusSchema = z.enum(["open", "closed", "nullified"]);
export const compensationTypeSchema = z.enum(["hourly", "monthly", "unset"]);
export const isoDateTimeSchema = z.string().datetime({ offset: true });

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative(),
});

export const userSessionSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  employeeCode: z.string(),
  role: employeeRoleSchema,
  mustChangePassword: z.boolean(),
});

export const reportSummarySchema = z.object({
  id: z.string().uuid(),
  employeeId: z.string().uuid(),
  workDate: z.string(),
  checkInAt: isoDateTimeSchema.nullable(),
  checkOutAt: isoDateTimeSchema.nullable(),
  checkInLocation: geoPointSchema.nullable(),
  checkOutLocation: geoPointSchema.nullable(),
  taskText: z.string().nullable(),
  nullReport: z.boolean(),
  totalMinutes: z.number().int().nullable(),
  status: workReportStatusSchema,
});

export const salarySummarySchema = z.object({
  employeeId: z.string().uuid(),
  employeeName: z.string(),
  validWorkedMinutes: z.number().int().nonnegative(),
  validWorkedHours: z.number().nonnegative(),
  nullReportCount: z.number().int().nonnegative(),
  validDayCount: z.number().int().nonnegative(),
  compensationType: compensationTypeSchema,
  hourlyRate: z.number().nullable(),
  monthlySalary: z.number().nullable(),
  estimatedSalary: z.number().nullable(),
});

export const baseDateRangeSchema = z.object({
  fromDate: z.string().date(),
  toDate: z.string().date(),
});

export const dateRangeSchema = baseDateRangeSchema.refine(
  (value) => value.fromDate <= value.toDate,
  {
    message: "El rango de fechas no puede estar invertido.",
    path: ["toDate"],
  },
);
