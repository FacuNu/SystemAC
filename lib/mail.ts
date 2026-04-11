import type { SendReportEmailRequest } from "@/contracts/admin";

export async function sendMonthlyReportEmail(
  _payload: SendReportEmailRequest,
) {
  void _payload;
  throw new Error(
    "sendMonthlyReportEmail() se implementará en la fase de correo.",
  );
}
