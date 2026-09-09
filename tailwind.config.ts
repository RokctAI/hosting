/*
 * Copyright (c) 2026 ROKCT INTELLIGENCE (PTY) LTD
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Mirrors RokctAI/rokctai_frontend's tailwind.config.ts - the shell that
// already renders these same base_sdk / auth_sdk components - so the two
// Next.js shells stay on one Tailwind (v3, class dark mode, shadcn HSL
// tokens, tailwindcss-animate). Four deliberate differences, all because
// this shell is not that one:
//
//   * content: no `./pages/**` (App Router only here) and no
//     `./node_modules/streamdown/**` (not a dependency). The globs must
//     cover every directory an SDK installer writes into, or the composed
//     pages' classes are purged out of the build: app/ and components/ are
//     where the composed .tsx lands, lib/ and hooks/ are the remaining
//     composed destinations that could ever carry a class string.
//   * no `fontFamily` override: rokctai_frontend loads Geist and points
//     `font-sans`/`font-mono` at its CSS variables. This shell loads no
//     webfont in the root layout, so Tailwind's default stacks are what
//     `font-sans`/`font-mono` should resolve to here.
//   * `primary` reads `hsl(var(--primary))` rather than rokctai_frontend's
//     hardcoded wealth-green; the variable lives in app/globals.css (today
//     rokctai_frontend's own primary, as a placeholder). The `wealth-green`
//     scale and the `marquee` keyframes are rokctai-only (zero uses in this
//     tree), so they are not carried.
//   * no `safelist`: nothing in this tree builds those width classes
//     dynamically.

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
