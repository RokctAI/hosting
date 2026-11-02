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

// /order (hosting_sdk 1.18.0): the studio's order form on its own page, in
// the studio's language - the header, a ledger head, the form
// (studio-order-form.tsx), the Terms beside it with the 24-hour promise, the
// WhatsApp way in and the footer. Server component; the orders address it
// prints is the one the route sends to (studio-order-config.ts), passed in
// by app/order/page.tsx from the request's host.

import "./studio.css";

import { BackToTop } from "@/components/custom/back-to-top";

import { StudioCurrencyProvider, StudioHeader } from "./studio-client";
import { STUDIO_WHATSAPP_DISPLAY, STUDIO_WHATSAPP_URL } from "./studio-copy";
import { StudioFooter } from "./studio-home";
import { STUDIO_ORDER_COPY, STUDIO_ORDER_HREF, STUDIO_ORDER_PROMISE, studioOrderTerms } from "./studio-order";
import { StudioOrderForm } from "./studio-order-form";

export function StudioOrder({ fontClassName, ordersEmail }: { fontClassName: string; ordersEmail: string }) {
  const C = STUDIO_ORDER_COPY;
  const terms = studioOrderTerms(ordersEmail);
  return (
    <StudioCurrencyProvider>
      <div id="top" className={`st ${fontClassName}`}>
        <StudioHeader base="/" current={STUDIO_ORDER_HREF} />
        <main className="od">
          <section className="wk-head">
            <div className="wrap">
              <p className="kick">{C.kicker}</p>
              <div className="wk-head-g">
                <h1 className="disp wk-h1">{C.title}</h1>
                <div className="wk-head-r">
                  <p className="lede">{C.lede}</p>
                  <p className="sm">{C.aside}</p>
                </div>
              </div>
            </div>
          </section>
          <section className="od-body" aria-label="Order form">
            <div className="wrap od-g">
              <StudioOrderForm />
              <aside className="od-side">
                <div className="refund">
                  <p className="kick">{C.termsKicker}</p>
                  <p className="big">{STUDIO_ORDER_PROMISE}</p>
                </div>
                <h2 className="od-terms-h">{C.termsTitle}</h2>
                <ol className="terms od-terms">
                  {terms.map((t) => (
                    <li key={t.b}>
                      <b>{t.b}</b>
                      <span>{t.t}</span>
                    </li>
                  ))}
                </ol>
                <p className="fine">{C.termsNote}</p>
                <p className="sm od-wa">
                  Rather talk? <a href={STUDIO_WHATSAPP_URL}>WhatsApp {STUDIO_WHATSAPP_DISPLAY}</a>. Files can also go to{" "}
                  <a href={`mailto:${ordersEmail}`}>{ordersEmail}</a>.
                </p>
              </aside>
            </div>
          </section>
        </main>
        <StudioFooter />
        <BackToTop />
      </div>
    </StudioCurrencyProvider>
  );
}
