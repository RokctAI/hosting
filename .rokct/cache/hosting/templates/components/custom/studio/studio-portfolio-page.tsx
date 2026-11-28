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

// /portfolio and /portfolio/print (hosting_sdk 1.27.0): the CORTEX tender
// portfolio (studio-portfolio.ts has the data and the rules). Server
// components; the studio's tokens and faces (studio.css, studio-fonts.ts).
// A section with nothing in it is not drawn (no fake work).

import "./studio.css";
import "./studio-portfolio.css";

import type { ReactNode } from "react";

import { BackToTop } from "@/components/custom/back-to-top";
import { tx } from "@/app/lib/i18n/phrases";

import { StudioCurrencyProvider, StudioHeader } from "./studio-client";
import { StudioFooter } from "./studio-home";
import {
  PORTFOLIO_COPY as C,
  PORTFOLIO_COMPANY,
  PORTFOLIO_HREF,
  PORTFOLIO_SHARED,
  portfolioDate,
  portfolioHost,
  type Portfolio,
} from "./studio-portfolio";

function Meta({ p }: { p: Portfolio }) {
  if (!p.version) return <p className="pf-meta">{tx(C.noVersion)}</p>;
  return (
    <p className="pf-meta" data-portfolio-version={p.version}>
      <span>
        {tx(C.version)} {p.version}
      </span>
      <span>
        {tx(C.updated)} {portfolioDate(p.date)}
      </span>
      {p.pdf ? (
        <a href={p.pdf} download>
          {tx(C.pdf)}
        </a>
      ) : null}
    </p>
  );
}

function Label({ n, title, aside }: { n: string; title: string; aside?: string }) {
  return (
    <div className="pf-lab">
      <span>
        {n} · {tx(title)}
      </span>
      {aside ? <span>{aside}</span> : null}
    </div>
  );
}

export function StudioPortfolio({ fontClassName, portfolio: p }: { fontClassName: string; portfolio: Portfolio }) {
  return (
    <StudioCurrencyProvider>
      <div id="top" className={`st ${fontClassName}`}>
        <StudioHeader base="/" current={PORTFOLIO_HREF} />
        <main className="pf">
          <div className="wrap">
            <header className="pf-head">
              <p className="kick">{tx(C.kicker)}</p>
              <h1 className="disp pf-h1">{tx(C.heading)}</h1>
              <p className="lede">{tx(C.lede)}</p>
              <Meta p={p} />
            </header>

            <section aria-label={tx(C.shared.title)}>
              <Label n={C.shared.n} title={C.shared.title} aside={tx(C.shared.note)} />
              <ul className="pf-shared">
                {PORTFOLIO_SHARED.map((s) => (
                  <li key={s.title}>
                    <b>{tx(s.title)}</b>
                    <span>{tx(s.line)}</span>
                  </li>
                ))}
              </ul>
            </section>

            {p.websites.length > 0 ? (
              <section aria-label={tx(C.websites.title)}>
                <Label n={C.websites.n} title={C.websites.title} aside={String(p.websites.length)} />
                {p.websites.map((s) => (
                  <article className="pf-case" key={s.repo}>
                    <figure className="pf-shots">
                      <img className="pf-desk" src={s.desktop} alt={s.name} loading="lazy" />
                      <img className="pf-phone" src={s.phone} alt="" loading="lazy" />
                    </figure>
                    <div className="pf-text">
                      <p className="kick quiet">{tx(s.kind)}</p>
                      <h2 className="disp">{s.name}</h2>
                      <p className="pf-tag">{s.tagline}</p>
                      {s.features.length > 0 ? (
                        <ul className="pf-feat">
                          {s.features.map((f) => (
                            <li key={f}>{f}</li>
                          ))}
                        </ul>
                      ) : null}
                      {s.award ? <p className="pf-award">{s.award.label}{s.award.detail ? ` · ${s.award.detail}` : ""}</p> : null}
                      <a className="pf-url" href={s.url}>
                        {portfolioHost(s.url)}
                      </a>
                    </div>
                  </article>
                ))}
              </section>
            ) : null}

            {p.apps.length > 0 ? (
              <section aria-label={tx(C.apps.title)}>
                <Label n={C.apps.n} title={C.apps.title} aside={String(p.apps.length)} />
                <ul className="pf-apps">
                  {p.apps.map((a) => (
                    <li key={`${a.client}-${a.name}`}>
                      <img src={a.phone} alt={a.name} loading="lazy" />
                      <b>{a.name}</b>
                      <span>
                        {tx(C.forClient)} {a.client}
                      </span>
                      {a.store ? <a href={a.store}>{tx(C.store)}</a> : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {p.logos.length > 0 ? (
              <section aria-label={tx(C.brand.title)}>
                <Label n={C.brand.n} title={C.brand.title} aside={String(p.logos.length)} />
                <ul className="pf-logos">
                  {p.logos.map((l) => (
                    <li key={l.client}>
                      <span className="pf-mark">
                        <img src={l.light} alt={l.client} loading="lazy" />
                      </span>
                      <b>{l.client}</b>
                      <span>{tx(l.kind)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {p.print.length > 0 ? (
              <section aria-label={tx(C.print.title)}>
                <Label n={C.print.n} title={C.print.title} aside={String(p.print.length)} />
                <ul className="pf-print">
                  {p.print.map((x) => (
                    <li key={`${x.client}-${x.title}`}>
                      <img src={x.image} alt={x.title} loading="lazy" />
                      <b>{x.title}</b>
                      <span>
                        {x.client} · {x.line}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {p.version && p.changes.length > 0 ? (
              <section className="pf-changes" aria-label={tx(C.changes)}>
                <p className="kick quiet">{tx(C.changes)}</p>
                <ul>
                  {p.changes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            <p className="pf-copy">
              {PORTFOLIO_COMPANY.legal} · {PORTFOLIO_COMPANY.reg}. {tx(C.copyright)}
            </p>
          </div>
        </main>
        <StudioFooter />
        <BackToTop />
      </div>
    </StudioCurrencyProvider>
  );
}

/** A4 pages for the PDF: cover, shared, one page per website, then apps, brand and print. */
export function StudioPortfolioPrint({ fontClassName, portfolio: p }: { fontClassName: string; portfolio: Portfolio }) {
  const foot = p.version ? `${tx(C.version)} ${p.version} · ${tx(C.updated)} ${portfolioDate(p.date)}` : tx(C.noVersion);
  const pages: { key: string; kick: string; body: ReactNode }[] = [];
  pages.push({
    key: "cover",
    kick: "",
    body: (
      <div className="pp-cover">
        <p className="pp-brand"><span className="pp-word">CORTEX<span className="pp-agency">AGENCY</span><small>.co</small></span></p>
        <h1 className="disp">{tx(C.title)}</h1>
        <p className="pp-line">{tx(C.cover.line)}</p>
        <p className="pp-by">{tx(C.cover.by)}</p>
      </div>
    ),
  });
  // Who is bidding: the registered company, then the live work a reader can open.
  pages.push({
    key: "company",
    kick: tx(C.company.title),
    body: (
      <>
        <h2 className="disp pp-h">{tx(C.company.title)}</h2>
        <dl className="pp-co">
          <dt>{tx(C.company.legal)}</dt>
          <dd>{PORTFOLIO_COMPANY.legal}</dd>
          <dt>{tx(C.company.trading)}</dt>
          <dd>{PORTFOLIO_COMPANY.trading}</dd>
          <dt>{tx(C.company.reg)}</dt>
          <dd>{PORTFOLIO_COMPANY.reg}</dd>
          <dt>{tx(C.company.bbbee)}</dt>
          <dd>{tx(PORTFOLIO_COMPANY.bbbee)}</dd>
          <dt>{tx(C.company.services)}</dt>
          <dd>{tx(C.company.servicesLine)}</dd>
        </dl>
        <h4 className="pp-sub">{tx(C.company.refs)}</h4>
        <p className="pp-kind">{tx(C.company.refsNote)}</p>
        <ul className="pp-sectors">
          {p.websites.map((s) => (
            <li key={s.repo}>
              <b>{s.name}</b>
              <span>{portfolioHost(s.url)}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  });
  // A tender reader's first question: how much work, for whom. Counted
  // from the version's own cards, never typed in.
  pages.push({
    key: "glance",
    kick: tx(C.glance.title),
    body: (
      <>
        <h2 className="disp pp-h">{tx(C.glance.title)}</h2>
        <ul className="pp-stats">
          <li>
            <b>{p.websites.length}</b>
            <span>{tx(C.websites.title)}</span>
          </li>
          <li>
            <b>{p.apps.length}</b>
            <span>{tx(C.apps.title)}</span>
          </li>
          <li>
            <b>{p.sites.length}</b>
            <span>{tx(C.glance.clients)}</span>
          </li>
        </ul>
        <h4 className="pp-sub">{tx(C.glance.sectors)}</h4>
        <ul className="pp-sectors">
          {p.sites.map((s) => (
            <li key={s.repo}>
              <b>{s.name}</b>
              <span>{tx(s.kind)}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  });
  pages.push({
    key: "shared",
    kick: tx(C.shared.title),
    body: (
      <>
        <h2 className="disp pp-h">{tx(C.sharedPage)}</h2>
        <ul className="pp-shared">
          {PORTFOLIO_SHARED.map((s) => (
            <li key={s.title}>
              <b>{tx(s.title)}</b>
              <span>{tx(s.line)}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  });
  for (const s of p.websites) {
    pages.push({
      key: s.repo,
      kick: tx(C.websites.title),
      body: (
        <>
          <h2 className="disp pp-h">{s.name}</h2>
          <p className="pp-kind">
            {tx(s.kind)} · {portfolioHost(s.url)}
          </p>
          <div className="pp-shots">
            <img className="pp-desk" src={s.desktop} alt={s.name} />
            <img className="pp-phone" src={s.phone} alt="" />
          </div>
          <p className="pp-tag">{s.tagline}</p>
          {s.features.length > 0 ? (
            <ul className="pp-feat">
              {s.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          ) : null}
        </>
      ),
    });
  }
  const grid = (key: string, title: string, items: { k: string; img: string; name: string; sub: string }[], logos = false) => {
    if (items.length === 0) return;
    pages.push({
      key,
      kick: tx(title),
      body: (
        <>
          <h2 className="disp pp-h">{tx(title)}</h2>
          <ul className={logos ? "pp-logos" : "pp-apps"}>
            {items.map((x) => (
              <li key={x.k}>
                <span className="pp-pic">
                  <img src={x.img} alt={x.name} />
                </span>
                <b>{x.name}</b>
                <small>{x.sub}</small>
              </li>
            ))}
          </ul>
        </>
      ),
    });
  };
  grid("apps", C.apps.title, p.apps.map((a) => ({ k: `${a.client}-${a.name}`, img: a.phone, name: a.name, sub: a.client })));
  grid("brand", C.brand.title, p.logos.map((l) => ({ k: l.client, img: l.light, name: l.client, sub: tx(l.kind) })), true);
  grid("print", C.print.title, p.print.map((x) => ({ k: `${x.client}-${x.title}`, img: x.image, name: x.title, sub: x.client })));
  return (
    <div className={`st pp ${fontClassName}`} data-portfolio-version={p.version ?? undefined}>
      {pages.map((pg, i) => (
        <section className="pp-page" key={pg.key}>
          <div className="pp-top">
            <span>
              <span className="pp-word">CORTEX<span className="pp-agency">AGENCY</span><small>.co</small></span> · {tx(C.title)}
            </span>
            <span>{pg.kick}</span>
          </div>
          {pg.body}
          <div className="pp-foot">
            <span>{foot}</span>
            <span>{tx(C.copyright)}</span>
            <span>
              {tx(C.pages)} {i + 1}
            </span>
          </div>
        </section>
      ))}
    </div>
  );
}
