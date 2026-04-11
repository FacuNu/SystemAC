import { redirect } from "next/navigation";
import { getCurrentUser, isAuthError, requireRole } from "@/lib/auth";

type PanelLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function PanelLayout({ children }: PanelLayoutProps) {
  try {
    await requireRole("employee");
  } catch (error) {
    if (isAuthError(error)) {
      if (error.code === "AUTH_FORBIDDEN") {
        const currentUser = await getCurrentUser();

        redirect(currentUser?.role === "admin" ? "/admin" : "/login");
      }

      redirect("/login");
    }

    throw error;
  }

  return children;
}
