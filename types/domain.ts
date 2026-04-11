export type EmployeeRole = "admin" | "employee";
export type WorkReportStatus = "open" | "closed" | "nullified";
export type CompensationType = "hourly" | "monthly" | "unset";

export type GeoPoint = {
  lat: number;
  lng: number;
  accuracy: number;
};

export type SessionUser = {
  id: string;
  fullName: string;
  employeeCode: string;
  role: EmployeeRole;
  mustChangePassword: boolean;
};

export type Employee = {
  id: string;
  fullName: string;
  employeeCode: string;
  role: EmployeeRole;
  hourlyRate: number | null;
  monthlySalary: number | null;
  isActive: boolean;
  createdAt: string;
};

export type ReportSummary = {
  id: string;
  employeeId: string;
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  checkInLocation: GeoPoint | null;
  checkOutLocation: GeoPoint | null;
  taskText: string | null;
  nullReport: boolean;
  totalMinutes: number | null;
  status: WorkReportStatus;
};

export type SalarySummary = {
  employeeId: string;
  employeeName: string;
  validWorkedMinutes: number;
  validWorkedHours: number;
  nullReportCount: number;
  validDayCount: number;
  compensationType: CompensationType;
  hourlyRate: number | null;
  monthlySalary: number | null;
  estimatedSalary: number | null;
};
