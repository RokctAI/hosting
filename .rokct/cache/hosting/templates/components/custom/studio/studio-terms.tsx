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

// /terms (hosting_sdk 1.20.8): the Terms on a page of their own, the same
// list the order form and the acknowledgement email carry
// (studioOrderTerms). Server component; the orders address is passed in
// from the host, like /order.

import "./studio.css";

import { BackToTop } from "@/components/custom/back-to-top";

import { StudioCurrencyProvider, StudioHeader } from "./studio-client";
import { StudioFooter } from "./studio-home";
import { STUDIO_ORDER_COPY, STUDIO_ORDER_HREF, studioOrderTerms } from "./studio-order";

export const STUDIO_TERMS_HREF = "/terms";

export function StudioTerms({ fontClassName, ordersEmail }: { fontClassName: string; ordersEmail: string }) {
  const C = STUDIO_ORDER_COPY;
  return (
    <StudioCurrencyProvider>
      <div id="top" className={`st ${fontClassName}`}>
        <StudioHeader base="/" current={STUDIO_TERMS_HREF} />
        <main className="tp">
          <div className="wrap">
            <p className="kick">{C.termsKicker}</p>
            <h1 className="disp od-h1">{C.termsTitle}</h1>
            <p className="lede">{C.termsNote}</p>
            <ol className="terms od-terms">
              {studioOrderTerms(ordersEmail).map((t) => (
                <li key={t.b}>
                  <b>{t.b}</b>
                  <span>{t.t}</span>
                </li>
              ))}
            </ol>
            <p className="sm">
              <a className="btn btn-acc btn-sm" href={STUDIO_ORDER_HREF}>
                {C.homeCta}
              </a>
            </p>
          </div>
        </main>
        <StudioFooter />
        <BackToTop />
      </div>
    </StudioCurrencyProvider>
  );
}
