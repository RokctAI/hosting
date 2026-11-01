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

// /work (hosting_sdk 1.11.0): every site in the shell's showcase list,
// ranked, as a grid - the page the home row's "See more" card opens. The
// studio's own header (its anchors pointing back at the home page), the
// grid (studio-showcase-client.tsx: each site's desktop and phone shots,
// the corner link, name, kind and line, a site leaving the grid if a
// picture fails) and the studio footer. Server component; tokens and faces
// are the home page's (studio.css, studio-fonts.ts).

import "./studio.css";

import { BackToTop } from "@/components/custom/back-to-top";

import { StudioCurrencyProvider, StudioHeader } from "./studio-client";
import { STUDIO_WHATSAPP_URL } from "./studio-copy";
import { StudioFooter } from "./studio-home";
import { StudioShowcaseCount, StudioShowcaseGrid, StudioShowcaseScope, StudioShowcaseSection } from "./studio-showcase-client";
import { STUDIO_SHOWCASE_COPY, type ShowcaseSite } from "./studio-showcase";

export function StudioWork({
  fontClassName,
  sites,
  rescue = [],
}: {
  fontClassName: string;
  sites: ShowcaseSite[];
  /** The built-in stand-in if every site drops in the browser (loadShowcase). */
  rescue?: ShowcaseSite[];
}) {
  const P = STUDIO_SHOWCASE_COPY.page;
  return (
    <StudioCurrencyProvider>
      <div id="top" className={`st ${fontClassName}`}>
        <StudioHeader base="/" />
        <StudioShowcaseScope>
          <main className="wk">
            <section className="wk-head">
              <div className="wrap">
                <p className="kick">{P.kicker}</p>
                <div className="wk-head-g">
                  <h1 className="disp wk-h1">{P.heading}</h1>
                  <div className="wk-head-r">
                    <p className="lede">{P.lede}</p>
                    <StudioShowcaseCount className="fine num" initial={sites.length} />
                  </div>
                </div>
              </div>
            </section>
            {/* The grid hides whole if no site is left; the way home and the
                WhatsApp button below stay. */}
            <StudioShowcaseSection className="wk-body" aria-label={P.title}>
              <div className="wrap">
                <StudioShowcaseGrid sites={sites} rescue={rescue} />
              </div>
            </StudioShowcaseSection>
            <div className="wk-end">
              <div className="wrap">
                <div className="wk-foot">
                  <a className="btn btn-line btn-sm" href="/">
                    {P.back}
                  </a>
                  <a className="btn btn-acc btn-sm" href={STUDIO_WHATSAPP_URL}>
                    {P.cta}
                  </a>
                </div>
              </div>
            </div>
          </main>
        </StudioShowcaseScope>
        <StudioFooter />
        <BackToTop />
      </div>
    </StudioCurrencyProvider>
  );
}
