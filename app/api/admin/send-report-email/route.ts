import { buildNotImplementedResponse } from "@/lib/api";

export async function POST() {
  return buildNotImplementedResponse(
    "Envío por mail pendiente de implementación en la fase de correo.",
  );
}
