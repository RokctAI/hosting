"use client";

/**
 * Host-owned light/dark toggle, mirrored from RokctAI/rokctai_frontend's
 * `components/custom/theme-toggle.tsx` — same path, same prop signature
 * (`className`), same behaviour: it flips the `dark` class on <html> through
 * next-themes.
 *
 * The pre-mount branch renders the same-sized button with no icon, so the
 * header does not reflow once the resolved theme is known and the server and
 * client agree on the first paint.
 */
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        aria-label="Toggle theme"
      >
        <span className="h-5 w-5" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
    >
      <Sun className="h-5 w-5 dark:hidden" />
      <Moon className="hidden h-5 w-5 dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default ThemeToggle;
