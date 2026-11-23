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

import { RiCheckboxCircleLine, RiCloseCircleLine, RiInfinityLine, RiShieldCheckLine } from "@remixicon/react";

import { BackToTop } from "@/components/custom/back-to-top";

import { StudioCurrencyProvider, StudioHeader } from "./studio-client";
import { StudioFooter } from "./studio-home";
import { STUDIO_ORDER_COPY, STUDIO_ORDER_HREF, STUDIO_ORDER_PROMISE, STUDIO_STARTUPS_COPY, STUDIO_STARTUPS_HREF, STUDIO_STATUS_HREF, studioOrderTerms } from "./studio-order";
import { StudioOrderForm, type StudioOrderPayOptions } from "./studio-order-form";
import type { StudioPayReturnPath } from "./studio-pay";

import { tx } from "@/app/lib/i18n/phrases";
export type StudioOrderReturn = { kind: "paid"; ref: string } | { kind: "cancelled" } | null;

export function StudioOrder({
  fontClassName,
  ordersEmail,
  back = null,
  pay,
  path = "/order",
}: {
  fontClassName: string;
  ordersEmail: string;
  back?: StudioOrderReturn;
  /** 1.20.7: the payment step's options, from the server's env. */
  pay?: StudioOrderPayOptions;
  /** The page this renders on. /startups shows the startup hero; the form and its checks are the same. */
  path?: StudioPayReturnPath;
}) {
  const C = STUDIO_ORDER_COPY;
  const hero = path === STUDIO_STARTUPS_HREF ? STUDIO_STARTUPS_COPY : null;
  const terms = studioOrderTerms(ordersEmail);
  return (
    <StudioCurrencyProvider>
      <div id="top" className={`st ${fontClassName}`}>
        <StudioHeader base="/" current={path} />
        <main className="od">
          <section className="od-hero">
            <div className="wrap od-hero-g">
              <div>
                <p className="kick">{hero ? hero.kicker : C.kicker}</p>
                <h1 className="disp od-h1">{hero ? hero.title : C.title}</h1>
                <p className="lede">{hero ? hero.lede : C.lede}</p>
              </div>
              <div className="od-side-hl">
                <div className="od-forever">
                  <RiInfinityLine size={28} aria-hidden="true" />
                  <div>
                    <b>{tx(C.foreverTitle)}</b>
                    <span>
                      {tx(C.foreverText)} <mark>{tx(C.foreverLimit)}</mark>.
                    </span>
                  </div>
                </div>
                {/* 1.20.8 (Ray): the money-back guarantee, in yellow-orange. */}
                <div className="od-money">
                  <RiShieldCheckLine size={28} aria-hidden="true" />
                  <div>
                    <b>{tx(C.moneyBackTitle)}</b>
                    <span>{tx(C.moneyBackText)}</span>
                  </div>
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
                      <b>{tx(C.paidTitle)}</b>
                      <span>
                        {tx(C.paidText)}
                        {back.ref ? ` Your reference is ${back.ref}.` : ""}{" "}
                        {back.ref ? <a href={`${STUDIO_STATUS_HREF}?ref=${encodeURIComponent(back.ref)}`}>{tx("Order status")}</a> : null}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="od-back-in">
                    <RiCloseCircleLine size={26} aria-hidden="true" />
                    <div>
                      <b>{tx(C.cancelTitle)}</b>
                      <span>{tx(C.cancelText)}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : null}
          <section className="od-body" aria-label={tx("Order form")}>
            <div className="wrap">
              <StudioOrderForm terms={terms} promise={STUDIO_ORDER_PROMISE} pay={pay} path={path} />
              <p className="sm od-wa">
                {/* 1.20.8 (Ray, 13:31Z): the order flow is email only, no WhatsApp. */}
                {tx("Files can also go to")}{" "}
                <a href={`mailto:${ordersEmail}`}>{tx(ordersEmail)}</a>{tx(". Read the full")}{" "}<a href="/terms">terms</a>.
              </p>
            </div>
          </section>
        </main>
        <StudioFooter current={path} />
        <BackToTop />
      </div>
    </StudioCurrencyProvider>
  );
}
