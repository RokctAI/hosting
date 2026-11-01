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

// The three faces of the studio home, served by the shell itself through
// next/font. Big Shoulders Display (SIL OFL 1.1, fonts/OFL.txt) ships as the
// four latin weights (500 to 800) Google Fonts serves under that name; next/font/google
// only knows the newer optical-size family "Big Shoulders", whose widths
// differ, so the Display cut ships as a local file.

import { Hanken_Grotesk, Newsreader } from "next/font/google";
import localFont from "next/font/local";

export const studioDisplay = localFont({
  src: [
    { path: "./fonts/big-shoulders-display-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/big-shoulders-display-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/big-shoulders-display-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/big-shoulders-display-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-st-disp",
  display: "swap",
  adjustFontFallback: false,
});

// 1.10.0: the hand on the ROKCT card's sketch sheet (studio-sketch.tsx):
// Caveat 500 (SIL OFL 1.1, fonts/OFL-caveat.txt), the latin cut, for the
// notes a designer scribbles beside a sketch. Used nowhere else.
export const studioHand = localFont({
  src: [{ path: "./fonts/caveat-500.woff2", weight: "500", style: "normal" }],
  variable: "--font-st-hand",
  display: "swap",
  adjustFontFallback: false,
});

export const studioSerif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-st-serif",
  display: "swap",
});

export const studioSans = Hanken_Grotesk({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-st-sans",
  display: "swap",
});

export const studioFontClassName = [studioDisplay.variable, studioSerif.variable, studioSans.variable, studioHand.variable].join(" ");
