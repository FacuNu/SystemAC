"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  compact?: boolean;
};

export function LogoutButton({ compact = false }: LogoutButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/login");
      router.refresh();
      setIsSubmitting(false);
    }
  }

  return (
    <Button
      variant="secondary"
      onClick={handleLogout}
      disabled={isSubmitting}
      className={compact ? "px-4 py-2" : undefined}
    >
      <LogOut className="size-4" />
      {isSubmitting ? "Saliendo..." : "Cerrar sesion"}
    </Button>
  );
}
