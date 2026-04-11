"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("systemac-theme");
    const nextTheme = storedTheme === "dark" ? "dark" : "light";

    setTheme(nextTheme);
    applyTheme(nextTheme);
    setIsReady(true);
  }, []);

  function handleToggle() {
    const nextTheme = theme === "light" ? "dark" : "light";

    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem("systemac-theme", nextTheme);
  }

  return (
    <Button
      aria-label={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
      className="size-11 justify-center rounded-2xl px-0 py-0"
      disabled={!isReady}
      onClick={handleToggle}
      variant="secondary"
      title={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
    >
      {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  );
}
