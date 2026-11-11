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

// /status (hosting_sdk 1.20.8): the per-order status page the Terms
// promise. There is no order store behind this site yet, so it is honest:
// it checks the reference is well formed (studio-pay.ts; no order store, so not that we issued it) and says live
// status pages are not switched on yet, and how the client hears about each
// phase until then. It never shows made-up phases or dates.

import "./studio.css";

import { BackToTop } from "@/components/custom/back-to-top";

import { StudioCurrencyProvider, StudioHeader } from "./studio-client";
import { StudioFooter } from "./studio-home";
import { STUDIO_STATUS_COPY, STUDIO_STATUS_HREF } from "./studio-order";
import { studioCleanRef, studioIsOrderRef } from "./studio-pay";

export function StudioStatus({ fontClassName, refCode }: { fontClassName: string; refCode: string }) {
  const S = STUDIO_STATUS_COPY;
  const ref = refCode ? studioCleanRef(refCode) : "";
  const valid = ref ? studioIsOrderRef(ref) : false;
  return (
    <StudioCurrencyProvider>
      <div id="top" className={`st ${fontClassName}`}>
        <StudioHeader base="/" current={STUDIO_STATUS_HREF} />
        <main className="tp">
          <div className="wrap">
            <p className="kick">{S.kicker}</p>
            <h1 className="disp od-h1">{S.title}</h1>
            <p className="lede">{S.lede}</p>
            <form className="tp-form" method="get" action={STUDIO_STATUS_HREF}>
              <label className="sr-only" htmlFor="st-ref">
                {S.label}
              </label>
              <input id="st-ref" name="ref" defaultValue={ref} placeholder={S.placeholder} maxLength={40} autoComplete="off" />
              <button type="submit" className="btn btn-ink">
                {S.button}
              </button>
            </form>
            {ref && !valid ? (
              <p className="of-err" role="alert">
                {S.bad}
              </p>
            ) : null}
            <div className="tp-note" role="status">
              {valid ? <p className="sm num">{S.good(ref)}</p> : null}
              <b>{S.honestTitle}</b>
              <span className="sm">{S.honest}</span>
            </div>
          </div>
        </main>
        <StudioFooter />
        <BackToTop />
      </div>
    </StudioCurrencyProvider>
  );
}
