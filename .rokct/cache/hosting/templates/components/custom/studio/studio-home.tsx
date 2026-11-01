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

// The ROKCT studio home: a studio proof sheet. One 12-column ledger grid,
// section titles in a tall condensed display face, running text in a text
// serif, labels and figures in a grotesk. Every piece of work is framed as a
// proof with crop marks. Server component; the interactive parts are in
// studio-client.tsx, every word in studio-copy.ts, the tokens in studio.css.

import "./studio.css";

import { Fragment } from "react";

import { BackToTop } from "@/components/custom/back-to-top";
import { SiteCredit } from "@/components/custom/site-credit";

import {
  StudioCopyNumber,
  StudioCurrencyBar,
  StudioCurrencyProvider,
  StudioDeal,
  StudioDesignTabs,
  StudioDealAlt,
  StudioHeader,
  StudioPrice,
} from "./studio-client";
import {
  STUDIO_CONTACT,
  STUDIO_DESIGN_CASES,
  STUDIO_DESIGN_HEAD,
  STUDIO_DESIGN_STEPS,
  STUDIO_FOOTER,
  STUDIO_HERO,
  STUDIO_MARK_COPY,
  STUDIO_MARKS_ROKCT,
  STUDIO_PRICE_ROWS,
  STUDIO_PRICES_HEAD,
  STUDIO_PROCESS,
  STUDIO_SCHEME_LABEL,
  STUDIO_SCHEMES,
  STUDIO_SERVICES,
  STUDIO_SERVICES_HEAD,
  STUDIO_WHATSAPP_DISPLAY,
  STUDIO_WHATSAPP_URL,
  STUDIO_WORK_HEAD,
  studioDesignImage,
  studioSchemeVars,
  studioWhatsApp,
  type StudioDesignCase,
  type StudioMarkSet,
  type StudioServicePrice,
} from "./studio-copy";
import { StudioShowcaseRow, StudioShowcaseScope, StudioShowcaseSection, type ShowcaseBacks } from "./studio-showcase-client";
import { SHOWCASE_HOME_COUNT, SHOWCASE_PAGE_HREF, type ShowcaseSite } from "./studio-showcase";
import { StudioSketchSheet } from "./studio-sketch";
import { isStudioShotSite, studioShotSrc, type StudioShotSiteId } from "./studio-shots";

function WhatsAppGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3 4.4c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.3s1 2.7 1.1 2.9c.2.2 2 3.1 4.9 4.2 2.4.9 2.9.8 3.4.7.5 0 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3l-.6-.3-2-1c-.3-.1-.5-.2-.7.2l-.9 1.2c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.4 0-.5L10 8.7c-.2-.5-.4-.5-.6-.5H9z" />
    </svg>
  );
}

function SectionHead({ kicker, title, aside }: { kicker: string; title: string; aside: string }) {
  return (
    <div className="sh">
      <div>
        <p className="kick">{kicker}</p>
        <h2 className="disp">{title}</h2>
      </div>
      <p className="sm">{aside}</p>
    </div>
  );
}

// A proof of a live site (hosting_sdk 1.6.0): the site's own picture of its
// first screen in each theme, through /studio/shots/ (studio-shots.ts), and
// following the page's theme like the design options do. The route serves
// the committed picture until the site has a good live one.
function ShotImages({ site, kind, alt, width, height, eager }: { site: StudioShotSiteId; kind: "desktop" | "phone"; alt: string; width: number; height: number; eager?: boolean }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size proof, served as-is */}
      <img className="th-l" src={studioShotSrc(site, `${kind}-light.webp`)} alt={alt} width={width} height={height} loading={eager ? "eager" : "lazy"} decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size proof, served as-is */}
      <img className="th-d" src={studioShotSrc(site, `${kind}-dark.webp`)} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
    </>
  );
}

function DeskProof({
  site,
  alt,
  url,
  caption,
  side,
  eager,
}: {
  site: StudioShotSiteId;
  alt: string;
  url: string;
  caption: string;
  side: string;
  eager?: boolean;
}) {
  return (
    <figure className="proof desk">
      <div className="shot" data-url={url}>
        <ShotImages site={site} kind="desktop" alt={alt} width={1200} height={833} eager={eager} />
        <span className="cm" aria-hidden="true" />
      </div>
      <figcaption>
        <b>{caption}</b>
        <span>{side}</span>
      </figcaption>
    </figure>
  );
}

function PhoneProof({ site, alt, caption, side, eager }: { site: StudioShotSiteId; alt: string; caption: string; side: string; eager?: boolean }) {
  return (
    <figure className="proof phone">
      <div className="shot">
        <ShotImages site={site} kind="phone" alt={alt} width={560} height={1149} eager={eager} />
        <span className="cm" aria-hidden="true" />
      </div>
      <figcaption>
        <b>{caption}</b>
        <span>{side}</span>
      </figcaption>
    </figure>
  );
}

// The website deal: the normal price struck through, the offer, the saving.
function DealPrice({ unit, big }: { unit: string; big: boolean }) {
  return (
    <>
      <span className="was">
        <span className="vh">Normal price </span>
        <StudioDeal k="normal" as="s" />
      </span>
      <StudioDeal k="offer" as="b" className={big ? "pz" : undefined} />
      <small>
        <StudioDealAlt k="offer" /> · {unit}
      </small>
      <span className="save">
        Save <StudioDeal k="save" />
      </span>
    </>
  );
}

function RowPrice({ price }: { price: StudioServicePrice }) {
  if (price.kind === "deal") {
    return (
      <div className="row-price">
        <DealPrice unit={price.unit} big />
      </div>
    );
  }
  if (price.kind === "quoted") {
    return (
      <div className="row-price">
        <b className="pz q">Quoted</b>
        <small>{price.unit}</small>
      </div>
    );
  }
  return (
    <div className="row-price">
      <StudioPrice as="b" className="pz" usd={price.usd} fmt={price.kind === "from" ? "from" : "main"} />
      <small>
        <StudioPrice usd={price.usd} fmt={price.kind === "fixed" && price.about ? "about" : "alt"} /> · {price.unit}
      </small>
    </div>
  );
}

function TablePrice({ price }: { price: StudioServicePrice }) {
  if (price.kind === "deal") {
    return (
      <div className="v">
        <DealPrice unit={price.unit} big={false} />
      </div>
    );
  }
  if (price.kind === "quoted") {
    return (
      <div className="v">
        <b className="q">Quoted</b>
        <small>{price.unit}</small>
      </div>
    );
  }
  const altFmt = price.kind === "fixed" && price.about ? "about" : "alt";
  return (
    <div className="v">
      <StudioPrice as="b" usd={price.usd} fmt="main" />
      {price.unit ? (
        <small>
          <StudioPrice usd={price.usd} fmt={altFmt} /> · {price.unit}
        </small>
      ) : (
        <StudioPrice as="small" usd={price.usd} fmt={altFmt} />
      )}
    </div>
  );
}

// A case's own colours (1.8.0): the brand's swatches, exactly as its code
// sets them, as chips under the brief. The chip names the colour; the hex
// is beside it for anyone who wants the value.
function Swatches({ id }: { id: keyof typeof STUDIO_SCHEMES }) {
  const s = STUDIO_SCHEMES[id];
  return (
    <div className="sw">
      <p className="sw-h">{STUDIO_SCHEME_LABEL}</p>
      <ul className="sw-row">
        {s.swatches.map((w) => (
          <li key={w.hex}>
            <span className="sw-chip" style={{ background: w.hex }} aria-hidden="true" />
            <span className="sw-n">{w.name}</span>
            <span className="sw-x">{w.hex.toUpperCase()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// The ROKCT card's back in the portfolio row (1.11.0): the 1.10.0 logo
// back cut to the card - the same sketch sheet (studio-sketch.tsx) and the
// picked mark as the final file (a CSS mask in the panel's ink, as in the
// .mk-* back), with the one line on why it won. The row turns the grown
// card to it; `logo_back: "rokct"` in a showcase file asks for it.
function ShowcaseMarkBack({ m }: { m: StudioMarkSet }) {
  const letter = m.chosen.toUpperCase();
  const picked = m.options.find((o) => o.key === m.chosen);
  const notes = m.options.map((o) => `${o.key.toUpperCase()}, ${o.name}: ${o.note}`).join(" ");
  const mark = { ["--mk" as string]: `url("${m.final.src}")` };
  return (
    <div className="sr-mk">
      <div className="sr-mk-sheet">
        <StudioSketchSheet title={STUDIO_MARK_COPY.sheetLabel(notes)} />
      </div>
      <div className="sr-mk-fin">
        <span className="mk-av sr-mk-av">
          <span className="mk-mark" role="img" aria-label={m.final.alt} style={mark} />
        </span>
        <span className="sr-mk-k">
          {letter} · {picked ? picked.name : STUDIO_MARK_COPY.final}
        </span>
        <p>{STUDIO_MARK_COPY.picked}</p>
      </div>
    </div>
  );
}

/** The backs a showcase card can turn to, by `logo_back` value. */
export function studioShowcaseBacks(): ShowcaseBacks {
  return { rokct: <ShowcaseMarkBack m={STUDIO_MARKS_ROKCT} /> };
}

// One "how we design" case: the example brief, the three options with the
// chosen one marked, and why it won. Each thumbnail ships in both themes and
// follows the page's theme (studio.css shows one, hides the other; a hidden
// lazy image is never fetched).
function DesignCase({ c }: { c: StudioDesignCase }) {
  const letter = c.chosen.toUpperCase();
  return (
    <>
      <div className="brief">
        <div className="brief-top">
          <span className="dz-step">
            <i>01</i> The brief
          </span>
          <span className="stamp">Example brief</span>
        </div>
        <dl className="brief-dl">
          <div>
            <dt>Client</dt>
            <dd>{c.brief.client}</dd>
          </div>
          <div>
            <dt>What they sell</dt>
            <dd>{c.brief.sells}</dd>
          </div>
          <div>
            <dt>Who to</dt>
            <dd>{c.brief.to}</dd>
          </div>
          <div className="brief-ask">
            <dt>The ask</dt>
            <dd>&ldquo;{c.brief.ask}&rdquo;</dd>
          </div>
        </dl>
        <Swatches id={c.id} />
      </div>

      <div className="opts">
        <p className="dz-step">
          <i>02</i> Three options, side by side
        </p>
        <ol className="opt-row">
          {c.options.map((o) => {
            const on = o.key === c.chosen;
            // The picked option is the built site: its live picture.
            const live = on && isStudioShotSite(c.id) ? c.id : null;
            return (
              <li key={o.key} className={on ? "opt on" : "opt"}>
                <figure>
                  <div className="proof">
                    <div className="mini">
                      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size proof, served as-is */}
                      <img className="th-l" src={live ? studioShotSrc(live, "option-light.webp") : studioDesignImage(c.id, o, "light")} alt={o.alt} width={800} height={500} loading="lazy" decoding="async" />
                      {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size proof, served as-is */}
                      <img className="th-d" src={live ? studioShotSrc(live, "option-dark.webp") : studioDesignImage(c.id, o, "dark")} alt={o.alt} width={800} height={500} loading="lazy" decoding="async" />
                    </div>
                    <span className="cm" aria-hidden="true" />
                  </div>
                  <figcaption>
                    <span className="opt-k">{o.key.toUpperCase()}</span>
                    <span className="opt-n">{o.name}</span>
                    {on && (
                      <span className="picked">
                        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
                          <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Picked
                      </span>
                    )}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="verdict">
        <p className="dz-step">
          <i>03</i> Why {letter} won
        </p>
        <p className="why">{c.why}</p>
        <p className="built">
          <span className="dz-step">
            <i>04</i> Built
          </span>
          <span className="sm">
            Option {letter} is the one our team built out, for desktop and phone, in light and dark.
          </span>
        </p>
        <p className="dz-cta">
          <a className="btn btn-acc btn-sm" href={studioWhatsApp(`Hi ROKCT, I'd like three options for my site, like the ${c.tab} brief.`)}>
            <WhatsAppGlyph />
            Start a brief like this
          </a>
        </p>
      </div>
    </>
  );
}

/** The studio footer: the mark, the line, the motto and base_sdk's site credit (also on /work). */
export function StudioFooter() {
  return (
    <footer className="ft">
      <div className="wrap ft-in">
        <div>
          <span className="mark">
            ROKCT
            <i aria-hidden="true" />
          </span>
          <p className="sm">{STUDIO_FOOTER.about}</p>
        </div>
        <div className="r">
          <span className="motto">{STUDIO_FOOTER.motto}</span>
          {/* base_sdk 1.54.0's site credit: `© <year> <PLATFORM_NAME> · Built
              with ♥ by ROKCT`, in the studio's own fine type and middle dot. */}
          <span className="fine">
            <SiteCredit as="span" siteName={STUDIO_FOOTER.siteName} /> · {STUDIO_FOOTER.prices}
          </span>
        </div>
      </div>
    </footer>
  );
}

export function StudioHome({
  fontClassName,
  showcase,
  rescue = [],
}: {
  fontClassName: string;
  showcase: ShowcaseSite[];
  /** The built-in stand-in if every showcase site drops in the browser (loadShowcase). */
  rescue?: ShowcaseSite[];
}) {
  const H = STUDIO_HERO;
  const P = STUDIO_PROCESS;
  const C = STUDIO_CONTACT;
  return (
    <StudioCurrencyProvider>
      <div id="top" className={`st ${fontClassName}`}>
        <StudioHeader />

        <main>
          {/* ---------------------------------------------------------- hero */}
          <section className="hero">
            <div className="wrap">
              <p className="kick">
                {H.kicker.map((k, i) => (
                  <Fragment key={k}>
                    {i > 0 && <>&nbsp;·&nbsp; </>}
                    {k}
                    {i < H.kicker.length - 1 && " "}
                  </Fragment>
                ))}
              </p>
              <div className="h1-wrap">
                <h1 className="disp rise">
                  {H.title.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </h1>
              </div>
              <div className="hero-g">
                <p className="lede">{H.lede}</p>
                <div className="cta">
                  <div className="cta-row">
                    <a className="btn btn-acc" href={STUDIO_WHATSAPP_URL}>
                      <WhatsAppGlyph />
                      {H.primary}
                    </a>
                    <a className="btn btn-line" href="#prices">
                      {H.secondary}
                    </a>
                  </div>
                  <p className="phone-line">
                    <b className="num">{STUDIO_WHATSAPP_DISPLAY}</b> &nbsp;·&nbsp; {H.hours}
                  </p>
                </div>
              </div>
              <ul className="facts">
                {H.facts.map((f) => (
                  <li key={f.b}>
                    <b>{f.b}</b>
                    {f.t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="wrap collage">
              <DeskProof
                site="polaris"
                alt="Polaris: a lender's website with the full cost in the headline and the loan application beside it, on a desktop"
                url="polaris · public site and loan calculator"
                caption="Our work · Polaris"
                side="Proof · desktop"
                eager
              />
              <PhoneProof
                site="supacharge"
                alt="Supacharge: a learning app's website on a phone"
                caption="Supacharge"
                side="Phone"
                eager
              />
              <div className="cnote">
                <p className="kick quiet">{H.note.kicker}</p>
                <p className="sm">{H.note.text}</p>
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------ services */}
          <section className="sec" id="services">
            <div className="wrap">
              <SectionHead {...STUDIO_SERVICES_HEAD} />
              <div className="ledger">
                {STUDIO_SERVICES.map((s) => (
                  <article className="row" key={s.name}>
                    <div className="row-name">
                      <h3>{s.name}</h3>
                      {s.flag && <span className="flag">{s.flag}</span>}
                    </div>
                    <div className="row-body">
                      <p>{s.body}</p>
                      {s.includes && (
                        <ul className="inc">
                          {s.includes.map((i) => (
                            <li key={i}>{i}</li>
                          ))}
                        </ul>
                      )}
                      {s.tiers && (
                        <div className="tiers">
                          {s.tiers.map((t) => (
                            <div className="tier" key={t.t}>
                              <span className="t">{t.t}</span>
                              <StudioPrice className="p" usd={t.usd} fmt="main" />
                              <StudioPrice className="a" usd={t.usd} fmt="alt" />
                              <span className="d">{t.d}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <a className="ask" href={studioWhatsApp(s.ask.text)}>
                        {s.ask.label} →
                      </a>
                    </div>
                    <RowPrice price={s.price} />
                  </article>
                ))}
              </div>
              <p className="fine ledger-foot">{STUDIO_SERVICES_HEAD.foot}</p>
            </div>
          </section>

          {/* ---------------------------------------------------------- work */}
          {/* 1.11.0: the phones row from the shell's ranked showcase list
              (studio-showcase.ts), the top SHOWCASE_HOME_COUNT and a "See
              more" card to /work. It replaces 1.8.0's tabs over flip cards.
              The section hides whole if no site is left to show. */}
          <StudioShowcaseScope>
            <StudioShowcaseSection className="sec" id="work">
              <div className="wrap">
                <SectionHead {...STUDIO_WORK_HEAD} />
              </div>
              <StudioShowcaseRow
                sites={showcase.slice(0, SHOWCASE_HOME_COUNT)}
                total={showcase.length}
                backs={studioShowcaseBacks()}
                moreHref={SHOWCASE_PAGE_HREF}
                rescue={rescue.slice(0, SHOWCASE_HOME_COUNT)}
              />
            </StudioShowcaseSection>
          </StudioShowcaseScope>

          {/* ------------------------------------------------- how we design */}
          <section className="sec" id="design">
            <div className="wrap">
              <SectionHead kicker={STUDIO_DESIGN_HEAD.kicker} title={STUDIO_DESIGN_HEAD.title} aside={STUDIO_DESIGN_HEAD.aside} />
              <ol className="dz-steps">
                {STUDIO_DESIGN_STEPS.map((st, i) => (
                  <li key={st.h}>
                    <span className="n">{String(i + 1).padStart(2, "0")}</span>
                    <b>{st.h}</b>
                    <span>{st.p}</span>
                  </li>
                ))}
              </ol>
              <StudioDesignTabs
                tabs={STUDIO_DESIGN_CASES.map((c) => ({ id: c.id, label: c.tab, sub: c.sector }))}
                schemes={STUDIO_DESIGN_CASES.map((c) => studioSchemeVars(c.id))}
                panels={STUDIO_DESIGN_CASES.map((c) => (
                  <DesignCase key={c.id} c={c} />
                ))}
              />
              <p className="fine ledger-foot">{STUDIO_DESIGN_HEAD.foot}</p>
            </div>
          </section>

          {/* -------------------------------------------------------- prices */}
          <section className="sec" id="prices">
            <div className="wrap">
              <SectionHead {...STUDIO_PRICES_HEAD} />
              <StudioCurrencyBar />
              <div className="pt">
                {STUDIO_PRICE_ROWS.map((r) => (
                  <div className={r.lead ? "pr lead" : "pr"} key={r.name}>
                    <div className="n">
                      {r.name}
                      {r.tag && <small>{r.tag}</small>}
                    </div>
                    <div className="w">{r.what}</div>
                    <TablePrice price={r.price} />
                  </div>
                ))}
              </div>
              <p className="fine ledger-foot">{STUDIO_PRICES_HEAD.foot}</p>
            </div>
          </section>

          {/* ------------------------------------------------------- process */}
          <section className="sec" id="process">
            <div className="wrap">
              <SectionHead kicker={P.kicker} title={P.title} aside={P.aside} />
              <ol className="phases">
                {P.phases.map((ph, i) => (
                  <li key={ph.h}>
                    <span className="n">{i + 1}</span>
                    <h3>{ph.h}</h3>
                    <p>{ph.p}</p>
                    <span className="out">
                      Ends with<b>{ph.out}</b>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="proc-g">
                <div className="status" aria-label="Sample status page">
                  <div className="top">
                    <b>{P.status.title}</b>
                    <span>{P.status.tag}</span>
                  </div>
                  {P.status.lines.map((l) => (
                    <div className={l.state ? `sline ${l.state}` : "sline"} key={l.t}>
                      <i aria-hidden="true" />
                      <span className="t">
                        {l.t}
                        <small>{l.s}</small>
                      </span>
                      <span className="s">{l.label}</span>
                    </div>
                  ))}
                  <div className="blocker">
                    <em>Blocker</em>
                    <span>
                      <b>{P.status.blocker.b}</b> {P.status.blocker.t}
                    </span>
                  </div>
                </div>
                <div className="rules">
                  <div className="refund">
                    <p className="kick">{P.refund.kicker}</p>
                    <p className="big">{P.refund.big}</p>
                    <small>{P.refund.small}</small>
                  </div>
                  <ul className="terms">
                    {P.terms.map((t) => (
                      <li key={t.b}>
                        <b>{t.b}</b>
                        <span>{t.t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="intake">
                <div>
                  <p className="kick">{P.intake.kicker}</p>
                  <h3 className="intake-h">{P.intake.title}</h3>
                  <p className="sm intake-p">{P.intake.text}</p>
                </div>
                <ol className="chips">
                  {P.intake.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ol>
              </div>
            </div>
          </section>
        </main>

        {/* ---------------------------------------------------------- contact */}
        <section className="contact" id="contact">
          <div className="wrap contact-in">
            <div>
              <p className="kick">{C.kicker}</p>
              <h2 className="disp contact-h">{C.title}</h2>
              <p className="lede">{C.lede}</p>
            </div>
            <div className="contact-r">
              <a className="bignum" href={STUDIO_WHATSAPP_URL}>
                {STUDIO_WHATSAPP_DISPLAY}
              </a>
              <p className="sm">{C.note}</p>
              <div className="cta-row">
                <a className="btn btn-acc" href={STUDIO_WHATSAPP_URL}>
                  {C.primary}
                </a>
                <StudioCopyNumber />
              </div>
            </div>
          </div>
        </section>

        <StudioFooter />
        {/* base_sdk's "Back to top" button, framed inside .st so the
            studio's registered style (../landing/hosting-back-to-top.ts)
            resolves against the studio tokens; base's root button steps
            aside here. */}
        <BackToTop />
      </div>
    </StudioCurrencyProvider>
  );
}
