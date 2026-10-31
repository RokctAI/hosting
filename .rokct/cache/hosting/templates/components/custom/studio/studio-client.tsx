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
// rule on scroll, the theme switch, the currency pill, the phone menu) and
// the contact block's copy-the-number button.
"use client";

import { useTheme } from "next-themes";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

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

export function StudioHeader() {
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
        <a className="mark" href="#top" aria-label="ROKCT, home">
          ROKCT
          <i aria-hidden="true" />
        </a>
        <nav className="nav" aria-label="Sections">
          {STUDIO_NAV.map((n) => (
            <a key={n.href} href={n.href}>
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
          <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
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
