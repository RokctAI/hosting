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

// hosting_sdk 1.21.0: the CORTEX frame for auth_sdk's pages (login,
// register, forgot-password). Ray: every app shell gets its own design for
// register and login.
//
// auth_sdk >= 1.12.0 wraps those pages in SiteShell from this path and
// installs a generic default here (base_sdk's Header above the card).
// hosting_sdk is the home SDK, so the installer keeps this copy, the same
// pattern delivery_sdk follows for Juvo: the auth card sits inside the
// CORTEX header, footer, faces and tokens (studio.css, studio-fonts.ts),
// with a brand panel beside it. Presentation only: the auth views, their
// actions and their form fields are auth_sdk's and are not touched. The
// header's Log in / Sign up come from its HeaderAuthSlot, so the page's
// handlers are not needed here.

"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import "@/components/custom/studio/studio.css";
import "@/components/custom/cortex-auth/cortex-auth.css";

import { CORTEX_AUTH_COPY, cortexAuthPanel } from "@/components/custom/cortex-auth/cortex-auth-copy";
import { StudioCurrencyProvider, StudioHeader } from "@/components/custom/studio/studio-client";
import { STUDIO_FOOTER } from "@/components/custom/studio/studio-copy";
import { studioFontClassName } from "@/components/custom/studio/studio-fonts";

export interface SiteShellProps {
  children: ReactNode;
  /** Header "Log in" handler from the auth page; the CORTEX header ignores it. */
  openLoginPopup?: () => void;
  /** Header "Sign up" handler from the auth page; the CORTEX header ignores it. */
  openSignupPopup?: () => void;
}

export function SiteShell({ children }: SiteShellProps) {
  const panel = cortexAuthPanel(usePathname());
  return (
    <StudioCurrencyProvider>
      <div id="top" className={`st ${studioFontClassName}`}>
        <StudioHeader base="/" />
        <main className="ca">
          <div className="wrap ca-g">
            <aside className="ca-side" aria-label={CORTEX_AUTH_COPY.sideLabel}>
              <p className="kick">{panel.kicker}</p>
              <p className="disp ca-h">
                {panel.title.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </p>
              <p className="lede ca-lede">{panel.lede}</p>
              <ul className="ca-pts">
                {CORTEX_AUTH_COPY.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </aside>
            <div className="ca-card">{children}</div>
          </div>
        </main>
        <footer className="ft">
          <div className="wrap ft-in">
            <div>
              <span className="mark">
                CORTEX
                <i aria-hidden="true" />
              </span>
              <p className="sm">{STUDIO_FOOTER.about}</p>
            </div>
            <div className="r">
              <span className="motto">{STUDIO_FOOTER.motto}</span>
              {/* hosting_sdk 1.20.7's footer: `© <year> CORTEX`, no maker credit. */}
              <span className="fine">
                © {new Date().getFullYear()} {STUDIO_FOOTER.siteName}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </StudioCurrencyProvider>
  );
}

/** The mark above the auth card: the header's own CORTEX wordmark and oxblood square. */
export function SiteShellLogo({ size = 56 }: { size?: number }) {
  return (
    <span className="mark ca-mark" style={{ fontSize: Math.round(size * 0.6) }} aria-hidden="true">
      CORTEX
      <i />
    </span>
  );
}
