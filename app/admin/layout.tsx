import { redirect } from "next/navigation";
import { getCurrentUser, isAuthError, requireRole } from "@/lib/auth";

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  try {
    await requireRole("admin");
  } catch (error) {
    if (isAuthError(error)) {
      if (error.code === "AUTH_FORBIDDEN") {
        const currentUser = await getCurrentUser();

        redirect(currentUser?.role === "employee" ? "/panel" : "/login");
      }

      redirect("/login");
    }

    throw error;
  }

  return children;
}
