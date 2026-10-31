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

import {
  StudioCopyNumber,
  StudioCurrencyBar,
  StudioCurrencyProvider,
  StudioDeal,
  StudioDealAlt,
  StudioHeader,
  StudioPrice,
} from "./studio-client";
import {
  STUDIO_CASES,
  STUDIO_CONTACT,
  STUDIO_FOOTER,
  STUDIO_HERO,
  STUDIO_IMAGES,
  STUDIO_PRICE_ROWS,
  STUDIO_PRICES_HEAD,
  STUDIO_PROCESS,
  STUDIO_SERVICES,
  STUDIO_SERVICES_HEAD,
  STUDIO_WHATSAPP_DISPLAY,
  STUDIO_WHATSAPP_URL,
  STUDIO_WORK_HEAD,
  studioWhatsApp,
  type StudioServicePrice,
} from "./studio-copy";

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

function DeskProof({
  src,
  alt,
  url,
  caption,
  side,
  eager,
}: {
  src: string;
  alt: string;
  url: string;
  caption: string;
  side: string;
  eager?: boolean;
}) {
  return (
    <figure className="proof desk">
      <div className="shot" data-url={url}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size proof, served as-is */}
        <img src={src} alt={alt} width={1200} height={833} loading={eager ? "eager" : "lazy"} decoding="async" />
        <span className="cm" aria-hidden="true" />
      </div>
      <figcaption>
        <b>{caption}</b>
        <span>{side}</span>
      </figcaption>
    </figure>
  );
}

function PhoneProof({ src, alt, caption, side, eager }: { src: string; alt: string; caption: string; side: string; eager?: boolean }) {
  return (
    <figure className="proof phone">
      <div className="shot">
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixed-size proof, served as-is */}
        <img src={src} alt={alt} width={560} height={1149} loading={eager ? "eager" : "lazy"} decoding="async" />
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

export function StudioHome({ fontClassName }: { fontClassName: string }) {
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
                src={STUDIO_IMAGES.polarisDesk}
                alt="Polaris: a lender's website with the loan calculator on the home page, on a desktop"
                url="polaris · public site and loan calculator"
                caption="Our work · Polaris"
                side="Proof · desktop"
                eager
              />
              <PhoneProof
                src={STUDIO_IMAGES.supaPhone}
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
          <section className="sec" id="work">
            <div className="wrap">
              <SectionHead {...STUDIO_WORK_HEAD} />
              {STUDIO_CASES.map((c) => (
                <article className="case" key={c.kicker}>
                  <DeskProof {...c.desk} side="Proof · desktop" />
                  <PhoneProof {...c.phone} caption="Phone" side="390" />
                  <div className="case-text">
                    <div>
                      <p className="kick">{c.kicker}</p>
                      <h3>{c.title}</h3>
                    </div>
                    <div>
                      <p>{c.body}</p>
                      <dl className="spec">
                        <dt>Made</dt>
                        <dd>{c.made}</dd>
                        <dt>Look</dt>
                        <dd>{c.look}</dd>
                      </dl>
                    </div>
                  </div>
                </article>
              ))}
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
              <span className="fine">{STUDIO_FOOTER.legal}</span>
            </div>
          </div>
        </footer>
      </div>
    </StudioCurrencyProvider>
  );
}
