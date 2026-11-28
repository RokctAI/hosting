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

// hosting_sdk 1.21.0: the words beside the auth card (../site-shell.tsx).
// CORTEX's voice from studio-copy.ts; the card's own words stay auth_sdk's.

export interface CortexAuthPanel {
  kicker: string;
  title: string[];
  lede: string;
}

export const CORTEX_AUTH_COPY = {
  sideLabel: "About CORTEX",
  login: {
    kicker: "CORTEX · Sign in",
    title: ["Welcome", "back."],
    lede: "Sign in to your CORTEX account to carry on.",
  },
  register: {
    kicker: "CORTEX · New account",
    title: ["Your brand,", "taken seriously."],
    lede: "Create a CORTEX account to get started.",
  },
  forgot: {
    kicker: "CORTEX · Account help",
    title: ["Lost your", "password?"],
    lede: "It happens. Our team is a WhatsApp message away if the steps here do not get you back in.",
  },
  points: [
    "One price agreed before we start",
    "A render to approve after every phase",
    "Our team a WhatsApp message away",
  ],
} as const;

/** The panel for the auth page at `pathname` (login when unknown). */
export function cortexAuthPanel(pathname: string | null): CortexAuthPanel {
  const p = pathname ?? "";
  const c = p.startsWith("/register") ? CORTEX_AUTH_COPY.register : p.startsWith("/forgot") ? CORTEX_AUTH_COPY.forgot : CORTEX_AUTH_COPY.login;
  return { kicker: c.kicker, title: [...c.title], lede: c.lede };
}
