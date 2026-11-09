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
// contact block's copy-the-number button, the "how we design" case tabs and
// the intake form that sends the brief, with any add-ons, on WhatsApp.
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
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { HeaderAuthSlot } from "@/components/custom/header-auth-slot";

import {
  STUDIO_CONTACT,
  STUDIO_ADDONS,
  STUDIO_CURRENCY_NOTE,
  STUDIO_HERO,
  STUDIO_USD_PER_ZAR_FIXED,
  STUDIO_INTAKE_FORM,
  STUDIO_NAV,
  STUDIO_WHATSAPP_DISPLAY,
  STUDIO_WHATSAPP_URL,
  studioDeal,
  studioIntakeLines,
  studioMoney,
  studioIntakeNote,
  studioPrice,
  type StudioAddonId,
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

// 1.20.7: one context carries the chosen currency AND the live rate, so
// every price (hero, rows, deal, order stepper) reads the same figures.
const CurrencyContext = createContext<{ cur: StudioCurrency; setCur: (c: StudioCurrency) => void; usdPerZar: number; live: boolean }>({
  cur: "ZAR",
  setCur: () => {},
  usdPerZar: STUDIO_USD_PER_ZAR_FIXED,
  live: false,
});

/** The visitor's currency (1.19.0: the order stepper's live price reads it). */
export function useStudioCurrency() {
  return useContext(CurrencyContext);
}

export function StudioCurrencyProvider({ children }: { children: ReactNode }) {
  const [cur, setState] = useState<StudioCurrency>("ZAR");
  const [rate, setRate] = useState({ usdPerZar: STUDIO_USD_PER_ZAR_FIXED, live: false });
  useEffect(() => {
    const saved = readSaved();
    if (saved) setState(saved);
    // Our own route answers the IP default and the server-fetched rate;
    // on any failure the fixed rate and rand stay.
    let gone = false;
    fetch("/api/studio/currency")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { cur?: unknown; usdPerZar?: unknown; live?: unknown } | null) => {
        if (gone || !d) return;
        if (typeof d.usdPerZar === "number" && Number.isFinite(d.usdPerZar) && d.usdPerZar > 0) {
          setRate({ usdPerZar: d.usdPerZar, live: d.live === true });
        }
        if (!saved && (d.cur === "ZAR" || d.cur === "USD")) setState(d.cur);
      })
      .catch(() => {});
    return () => {
      gone = true;
    };
  }, []);
  const setCur = (c: StudioCurrency) => {
    setState(c);
    try {
      window.localStorage.setItem(KEY, c);
    } catch {
      /* private window: the choice lasts this visit only */
    }
  };
  return <CurrencyContext.Provider value={{ cur, setCur, ...rate }}>{children}</CurrencyContext.Provider>;
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
  const { cur, usdPerZar } = useContext(CurrencyContext);
  return <Tag className={className}>{studioPrice(usd, fmt, cur, usdPerZar)}</Tag>;
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
  const { cur, usdPerZar } = useContext(CurrencyContext);
  return <Tag className={className}>{studioDeal(k, cur, usdPerZar)}</Tag>;
}

/** The deal's figure in the other currency, beside the shown one. */
export function StudioDealAlt({ k }: { k: StudioDealKey }) {
  const { cur, usdPerZar } = useContext(CurrencyContext);
  return <>{studioDeal(k, cur === "ZAR" ? "USD" : "ZAR", usdPerZar)}</>;
}

/** The hero kicker's currency item: "Rand prices" or "Dollar prices", following the picker. */
export function StudioHeroCurrency() {
  const { cur } = useContext(CurrencyContext);
  return <>{STUDIO_HERO.prices[cur]}</>;
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

// 1.16.0: the Log in / Sign up pair is drawn by whatever SDK fills base's
// header auth slot (base_sdk >= 1.60.0; auth_sdk registers it), in the
// studio's own classes: a quiet link and a line pill on the bar (both hide
// with the bar's other buttons below 980px; the pill also steps aside up to
// 1099px so the section links stay on one line), plain menu rows in the
// phone menu. Nothing registered, nothing drawn.
const STUDIO_AUTH_BAR = { login: "hd-login", signup: "btn btn-line btn-sm hd-signup" };
const STUDIO_AUTH_MENU = { login: "mnav-auth", signup: "mnav-auth" };

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
        <a className="mark" href="/" aria-label="CORTEX, home">
          CORTEX
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
          <HeaderAuthSlot variant="bar" classes={STUDIO_AUTH_BAR} />
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
        <HeaderAuthSlot variant="panel" classes={STUDIO_AUTH_MENU} onNavigate={() => setOpen(false)} />
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

/**
 * The intake form under the ten questions (1.9.0). The special is the
 * website and brand bundle; an online shop and a mobile app are optional
 * add-ons outside it, each a real checkbox with its label, quoted
 * separately. 1.20.7 (Ray): the logo is not in the special but a discounted
 * add-on (its price shown, the normal one struck through, in the visitor's
 * currency), and the brief is sent by EMAIL to /api/studio/brief, never to
 * WhatsApp. A failure shows a plain message; nothing falls back to WhatsApp.
 */
export function StudioIntakeForm() {
  const F = STUDIO_INTAKE_FORM;
  const { cur, usdPerZar } = useContext(CurrencyContext);
  const [picked, setPicked] = useState<StudioAddonId[]>([]);
  const [logo, setLogo] = useState(false);
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "sending" } | { kind: "fail"; message: string } | { kind: "ok"; addons: StudioAddonId[]; logo: boolean }
  >({ kind: "idle" });
  const toggle = (id: StudioAddonId, on: boolean) =>
    setPicked((p) => F.addons.items.map((a) => a.id).filter((x) => (x === id ? on : p.includes(x))));
  const note = studioIntakeNote(picked);
  const logoAddon = STUDIO_ADDONS.find((a) => a.name === "designLogo");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState({ kind: "fail", message: F.errors.contact });
      return;
    }
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/studio/brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: String(data.get("phone") ?? ""),
          addons: picked,
          logo,
          company_url: String(data.get("company_url") ?? ""),
        }),
      });
      let body: { ok?: boolean; message?: string } = {};
      try {
        body = await res.json();
      } catch {
        body = {};
      }
      if (res.ok && body.ok) {
        setState({ kind: "ok", addons: picked, logo });
        return;
      }
      setState({ kind: "fail", message: body.message || F.errors.failed });
    } catch {
      setState({ kind: "fail", message: F.errors.failed });
    }
  }

  if (state.kind === "ok") {
    return (
      <div className="ik ik-done" role="status" aria-live="polite">
        <p className="kick">{F.done.kicker}</p>
        <p className="ik-dt">{F.done.title}</p>
        <ul className="ik-sum">
          {studioIntakeLines(state.addons).map((l) => (
            <li key={l}>{l}</li>
          ))}
          {state.logo && <li>{F.logo.line}</li>}
        </ul>
        {state.addons.length > 0 && <p className="ik-dn">{studioIntakeNote(state.addons)}</p>}
        <p className="sm">{F.done.text}</p>
      </div>
    );
  }

  return (
    <form className="ik" onSubmit={onSubmit} noValidate aria-label="Start your brief">
      <div className="ik-special">
        <p className="kick">{F.special.kicker}</p>
        <p className="ik-sn">
          <b>{F.special.name}</b>
          <span className="ik-sp">
            <span className="vh">Special price </span>
            <StudioDeal k="offer" as="b" />
            <span className="vh">, normally </span>
            <StudioDeal k="normal" as="s" />
          </span>
        </p>
        <p className="sm">{F.special.covers}</p>
      </div>

      <fieldset className="ik-add">
        <legend>
          {F.addons.legend}
          <span>{F.addons.hint}</span>
        </legend>
        <label className="ik-opt">
          <input type="checkbox" checked={logo} onChange={(e) => setLogo(e.target.checked)} />
          <span className="ik-t">
            <b>
              {F.logo.name}{" "}
              {logoAddon?.wasZar ? <s>{studioMoney(logoAddon.wasZar, cur, usdPerZar)}</s> : null}{" "}
              {logoAddon?.zar ? <>{studioMoney(logoAddon.zar, cur, usdPerZar)}</> : null}
            </b>
            <span>{F.logo.benefit}</span>
          </span>
        </label>
        {F.addons.items.map((a) => (
          <label className="ik-opt" key={a.id}>
            <input
              type="checkbox"
              checked={picked.includes(a.id)}
              onChange={(e) => toggle(a.id, e.target.checked)}
              aria-describedby="ik-quoted"
            />
            <span className="ik-t">
              <b>{a.name}</b>
              <span>{a.benefit}</span>
            </span>
          </label>
        ))}
        <p className="fine ik-q" id="ik-quoted">
          {F.addons.quoted}
        </p>
      </fieldset>

      <p className={note ? "ik-note on" : "ik-note"} role="status" aria-live="polite">
        {note}
      </p>

      <div className="ik-who">
        <label>
          {F.contact.name}
          <input type="text" name="name" autoComplete="name" maxLength={120} />
        </label>
        <label>
          {F.contact.email}
          <input type="email" name="email" autoComplete="email" maxLength={200} />
        </label>
        <label>
          {F.contact.phone}
          <input type="tel" name="phone" autoComplete="tel" maxLength={40} />
        </label>
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px" }}>
          <input type="text" name="company_url" tabIndex={-1} autoComplete="off" />
        </div>
      </div>

      {state.kind === "fail" && (
        <p className="ik-err" role="alert">
          {state.message}
        </p>
      )}

      <div className="ik-go">
        <button className="btn btn-acc" type="submit" aria-busy={state.kind === "sending"}>
          {state.kind === "sending" ? F.sending : F.submit}
        </button>
        <span className="fine">{F.submitNote}</span>
      </div>
    </form>
  );
}
