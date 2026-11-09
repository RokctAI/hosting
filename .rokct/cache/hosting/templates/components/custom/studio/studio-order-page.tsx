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

// /order (hosting_sdk 1.19.0): the studio's order page. A short hero with
// the forever-hosting callout, then the five-step stepper with its live
// price (studio-order-form.tsx). `?paid=<ref>` and `?cancelled=1` are the
// PayFast return and cancel states (studio-pay.ts). Server component; the
// orders address it prints is the one the route sends to
// (studio-order-config.ts), passed in by app/order/page.tsx from the host.

import "./studio.css";

import { RiCheckboxCircleLine, RiCloseCircleLine, RiInfinityLine } from "@remixicon/react";

import { BackToTop } from "@/components/custom/back-to-top";

import { StudioCurrencyProvider, StudioHeader } from "./studio-client";
import { STUDIO_WHATSAPP_DISPLAY, STUDIO_WHATSAPP_URL } from "./studio-copy";
import { StudioFooter } from "./studio-home";
import { STUDIO_ORDER_COPY, STUDIO_ORDER_HREF, STUDIO_ORDER_PROMISE, studioOrderTerms } from "./studio-order";
import { StudioOrderForm, type StudioOrderPayOptions } from "./studio-order-form";

export type StudioOrderReturn = { kind: "paid"; ref: string } | { kind: "cancelled" } | null;

export function StudioOrder({
  fontClassName,
  ordersEmail,
  back = null,
  pay,
}: {
  fontClassName: string;
  ordersEmail: string;
  back?: StudioOrderReturn;
  /** 1.20.7: the payment step's options, from the server's env. */
  pay?: StudioOrderPayOptions;
}) {
  const C = STUDIO_ORDER_COPY;
  const terms = studioOrderTerms(ordersEmail);
  return (
    <StudioCurrencyProvider>
      <div id="top" className={`st ${fontClassName}`}>
        <StudioHeader base="/" current={STUDIO_ORDER_HREF} />
        <main className="od">
          <section className="od-hero">
            <div className="wrap od-hero-g">
              <div>
                <p className="kick">{C.kicker}</p>
                <h1 className="disp od-h1">{C.title}</h1>
                <p className="lede">{C.lede}</p>
              </div>
              <div className="od-forever">
                <RiInfinityLine size={28} aria-hidden="true" />
                <div>
                  <b>{C.foreverTitle}</b>
                  <span>{C.foreverText}</span>
                </div>
              </div>
            </div>
          </section>
          {back ? (
            <section className="od-back" role="status">
              <div className="wrap">
                {back.kind === "paid" ? (
                  <div className="od-back-in ok">
                    <RiCheckboxCircleLine size={26} aria-hidden="true" />
                    <div>
                      <b>{C.paidTitle}</b>
                      <span>
                        {C.paidText}
                        {back.ref ? ` Your reference: ${back.ref}.` : ""}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="od-back-in">
                    <RiCloseCircleLine size={26} aria-hidden="true" />
                    <div>
                      <b>{C.cancelTitle}</b>
                      <span>{C.cancelText}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : null}
          <section className="od-body" aria-label="Order form">
            <div className="wrap">
              <StudioOrderForm terms={terms} promise={STUDIO_ORDER_PROMISE} pay={pay} />
              <p className="sm od-wa">
                Rather talk? <a href={STUDIO_WHATSAPP_URL}>WhatsApp {STUDIO_WHATSAPP_DISPLAY}</a>. Files can also go to{" "}
                <a href={`mailto:${ordersEmail}`}>{ordersEmail}</a>.
              </p>
            </div>
          </section>
        </main>
        <StudioFooter />
        <BackToTop />
      </div>
    </StudioCurrencyProvider>
  );
}
