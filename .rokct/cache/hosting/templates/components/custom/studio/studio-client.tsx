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

// The interactive parts of the studio home: the currency every price reads
// (rand first, the visitor's switch kept in localStorage), the header (its
// rule on scroll, the theme switch, the currency pill, the phone menu), the
// contact block's copy-the-number button and the "how we design" case
// tabs. The portfolio row (1.8.0's tabs over flip cards) gave way in 1.11.0
// to the phones row in studio-showcase-client.tsx.
"use client";

import { useTheme } from "next-themes";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import {
  STUDIO_CONTACT,
  STUDIO_CURRENCY_NOTE,
  STUDIO_NAV,
  STUDIO_WHATSAPP_DISPLAY,
  STUDIO_WHATSAPP_URL,
  studioDeal,
  studioPrice,
  type StudioCurrency,
  type StudioDealKey,
  type StudioPriceFormat,
} from "./studio-copy";

const KEY = "rokct-cur";

function readSaved(): StudioCurrency | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "USD" || v === "ZAR" ? v : null;
  } catch {
    return null;
  }
}

const CurrencyContext = createContext<{ cur: StudioCurrency; setCur: (c: StudioCurrency) => void }>({
  cur: "ZAR",
  setCur: () => {},
});

export function StudioCurrencyProvider({ children }: { children: ReactNode }) {
  const [cur, setState] = useState<StudioCurrency>("ZAR");
  useEffect(() => {
    const saved = readSaved();
    if (saved) setState(saved);
  }, []);
  const setCur = (c: StudioCurrency) => {
    setState(c);
    try {
      window.localStorage.setItem(KEY, c);
    } catch {
      /* private window: the choice lasts this visit only */
    }
  };
  return <CurrencyContext.Provider value={{ cur, setCur }}>{children}</CurrencyContext.Provider>;
}

/** One price, in the visitor's currency (`main`, `from`) or the other one (`alt`, `about`). */
export function StudioPrice({
  usd,
  fmt,
  as: Tag = "span",
  className,
}: {
  usd: number;
  fmt: StudioPriceFormat;
  as?: "b" | "span" | "small";
  className?: string;
}) {
  const { cur } = useContext(CurrencyContext);
  return <Tag className={className}>{studioPrice(usd, fmt, cur)}</Tag>;
}

/** One figure of the website deal (normal, offer or saving) in the visitor's currency. */
export function StudioDeal({
  k,
  as: Tag = "span",
  className,
}: {
  k: StudioDealKey;
  as?: "b" | "span" | "small" | "s";
  className?: string;
}) {
  const { cur } = useContext(CurrencyContext);
  return <Tag className={className}>{studioDeal(k, cur)}</Tag>;
}

/** The deal's figure in the other currency, beside the shown one. */
export function StudioDealAlt({ k }: { k: StudioDealKey }) {
  const { cur } = useContext(CurrencyContext);
  return <>{studioDeal(k, cur === "ZAR" ? "USD" : "ZAR")}</>;
}

export function StudioCurrencyBar() {
  const { cur, setCur } = useContext(CurrencyContext);
  return (
    <div className="curbar">
      <div className="seg" role="group" aria-label="Currency">
        <button type="button" aria-pressed={cur === "ZAR"} onClick={() => setCur("ZAR")}>
          Rand · R
        </button>
        <button type="button" aria-pressed={cur === "USD"} onClick={() => setCur("USD")}>
          Dollars · $
        </button>
      </div>
      <span className="fine">{STUDIO_CURRENCY_NOTE[cur]}</span>
    </div>
  );
}

function SunMoon() {
  return (
    <>
      <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
      </svg>
      <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
      </svg>
    </>
  );
}

/**
 * The studio header. `base` prefixes the section anchors: "" on the home
 * page, "/" on another studio page (1.11.0's /work), so "Prices" there
 * goes to /#prices. A page link ("/work", 1.14.0's Portfolio) is used as
 * is, and marked as the current page where `current` names it.
 */
export function navHref(href: string, base: string): string {
  return href.startsWith("/") ? href : `${base}${href}`;
}

export function StudioHeader({ base = "", current }: { base?: string; current?: string }) {
  const { cur, setCur } = useContext(CurrencyContext);
  const { resolvedTheme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={scrolled ? "hd on" : "hd"}>
      <div className="wrap hd-in">
        <a className="mark" href="/" aria-label="ROKCT, home">
          ROKCT
          <i aria-hidden="true" />
        </a>
        <nav className="nav" aria-label="Sections">
          {STUDIO_NAV.map((n) => (
            <a key={n.href} href={navHref(n.href, base)} aria-current={n.href === current ? "page" : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hd-r">
          <button
            className="pill"
            type="button"
            aria-label={`Switch currency, now showing ${cur === "ZAR" ? "rand" : "dollars"}`}
            onClick={() => setCur(cur === "ZAR" ? "USD" : "ZAR")}
          >
            <b>{cur === "ZAR" ? "R" : "$"}</b> {cur}
          </button>
          <button
            className="pill ic"
            type="button"
            aria-label="Switch between light and dark"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <SunMoon />
          </button>
          <a className="btn btn-ink btn-sm" href={STUDIO_WHATSAPP_URL}>
            WhatsApp us
          </a>
          <button
            className="pill ic burger"
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </button>
        </div>
      </div>
      <div className={open ? "mnav wrap open" : "mnav wrap"}>
        {STUDIO_NAV.map((n) => (
          <a key={n.href} href={navHref(n.href, base)} aria-current={n.href === current ? "page" : undefined} onClick={() => setOpen(false)}>
            {n.href === "#contact" ? `${n.label} · ${STUDIO_WHATSAPP_DISPLAY}` : n.label}
          </a>
        ))}
      </div>
    </header>
  );
}

export function StudioCopyNumber() {
  const [label, setLabel] = useState<string>(STUDIO_CONTACT.copy);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const select = () => {
    const el = document.querySelector(".st .bignum");
    const sel = window.getSelection();
    if (el && sel) {
      const r = document.createRange();
      r.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(r);
    }
    setLabel(STUDIO_CONTACT.selected);
  };
  const copy = () => {
    const done = () => {
      setLabel(STUDIO_CONTACT.copied);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setLabel(STUDIO_CONTACT.copy), 1800);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(STUDIO_WHATSAPP_DISPLAY).then(done, select);
    } else {
      select();
    }
  };
  return (
    <button className="btn btn-line" type="button" onClick={copy}>
      {label}
    </button>
  );
}

/**
 * The "how we design" case switcher: an ARIA tablist over server-rendered
 * panels. Every panel is in the HTML; the inactive ones carry `hidden`, so
 * the first case reads without script. Arrow keys, Home and End move between
 * tabs, as the WAI-ARIA tabs pattern asks.
 *
 * 1.8.0: each panel wears its case's colour scheme (`schemes[i]`, the
 * `--cl-*` / `--cd-*` properties studio-copy.ts's studioSchemeVars builds;
 * studio.css `.cs` maps them onto the studio tokens), and the tab row's
 * marker takes the active case's accent.
 */
export function StudioDesignTabs({
  tabs,
  panels,
  schemes,
}: {
  tabs: { id: string; label: string; sub: string }[];
  panels: ReactNode[];
  schemes: Record<string, string>[];
}) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const go = (i: number) => {
    const n = (i + tabs.length) % tabs.length;
    setActive(n);
    refs.current[n]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(active + 1);
    else if (e.key === "ArrowLeft") go(active - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(tabs.length - 1);
    else return;
    e.preventDefault();
  };
  return (
    <div className="dz" data-case={tabs[active].id} style={schemes[active] as CSSProperties}>
      <div className="dz-tabs" role="tablist" aria-label="Projects" onKeyDown={onKey}>
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`dz-tab-${t.id}`}
            aria-controls={`dz-panel-${t.id}`}
            aria-selected={i === active}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
          >
            <span className="dz-ti">{String(i + 1).padStart(2, "0")}</span>
            <span className="dz-tl">{t.label}</span>
            <span className="dz-ts">{t.sub}</span>
          </button>
        ))}
      </div>
      {panels.map((p, i) => (
        <div
          key={tabs[i].id}
          role="tabpanel"
          id={`dz-panel-${tabs[i].id}`}
          aria-labelledby={`dz-tab-${tabs[i].id}`}
          hidden={i !== active}
          tabIndex={0}
          className="dz-panel cs"
          data-case={tabs[i].id}
          style={schemes[i] as CSSProperties}
        >
          {p}
        </div>
      ))}
    </div>
  );
}
