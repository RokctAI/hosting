"use client";

/**
 * Host-owned theme seam, mirrored from RokctAI/rokctai_frontend's
 * `components/custom/theme-provider.tsx` with the same public shape (it is a
 * pass-through for next-themes' own props).
 *
 * ONE deliberate difference from that copy: the props type is imported from
 * "next-themes", not from "next-themes/dist/types". next-themes 0.4.6 ships
 * no `dist/types` entry point — it re-exports `ThemeProviderProps` from the
 * package root — so the rokctai_frontend spelling is a type error that only
 * survives there because its next.config.mjs sets
 * `typescript.ignoreBuildErrors`. This shell does not mask type errors.
 *
 * `attribute="class"` is what makes this drive `darkMode: ["class"]` in
 * tailwind.config.ts; without it the `dark:` variants all over the composed
 * SDK pages are dead CSS.
 */
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import * as React from "react";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export default ThemeProvider;
