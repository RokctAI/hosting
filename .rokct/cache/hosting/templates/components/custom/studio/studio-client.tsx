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
// contact block's copy-the-number button, the "how we design" case tabs
// and (1.8.0) the portfolio row: tabs over one big flip card per case.
"use client";

import { useTheme } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { FlipCard } from "@/components/custom/flip-card";

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

/** How long each portfolio case stays before the row moves on (the tab's progress bar). */
export const STUDIO_WORK_ADVANCE_MS = 8000;

function Chevron({ back }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={back ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

/**
 * The portfolio row (1.8.0, Ray: "give it tabs, matching the how-it-works
 * section, so the portfolio becomes one row"). A tablist over a sideways
 * scroll-snap track of full-width cards, one per case; each card is base
 * _sdk's FlipCard (the Supacharge tutor card's flip) with the case on the
 * front and its logo process on the back.
 *
 * The row follows lms_sdk's card deck (landing/lms-card-deck.tsx): the
 * track is the browser's own scroller, so touch, trackpad and two-finger
 * swipes are native; scroll snapping with `scroll-snap-stop: always` lands
 * on one card; the arrows and the tab keys move a card at a time on a
 * desktop; the scrollbar is hidden. On a phone the next card's edge shows.
 *
 * It moves on by itself, one case every STUDIO_WORK_ADVANCE_MS, the active
 * tab's bar filling as the time runs. The bar is a CSS animation and its
 * `animationend` is the timer, so pausing the animation pauses the timer:
 * it pauses while the row is hovered or holds focus, while it is off
 * screen and while the page is hidden. It never starts under
 * prefers-reduced-motion. It stops for good once the visitor takes over -
 * a tab, an arrow, a swipe, a flip - and the Pause button stops it too
 * (Play starts it again). While it runs the track is `aria-live="off"`;
 * once stopped, "polite", so a change the visitor made is read out.
 */
export function StudioWorkTabs({
  tabs,
  cards,
  schemes,
  labels,
}: {
  tabs: { id: string; label: string; sub: string }[];
  cards: { front: ReactNode; back: ReactNode | null; flipLabel: string; flipBackLabel: string }[];
  schemes: Record<string, string>[];
  labels: { label: string; previous: string; next: string; pause: string; play: string; hint: string };
}) {
  const n = tabs.length;
  const [active, setActive] = useState(0);
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const programmatic = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gesture = useRef(false);
  const activeRef = useRef(0);
  activeRef.current = active;

  // Auto-advance starts only for a visitor who has not asked for less motion.
  useEffect(() => {
    const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!rm?.matches) setRunning(true);
    const onChange = () => {
      if (rm?.matches) setRunning(false);
    };
    rm?.addEventListener("change", onChange);
    return () => rm?.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver((entries) => setVisible(entries.some((e) => e.isIntersecting)), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setPageHidden(document.visibilityState === "hidden");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(
    () => () => {
      if (programmatic.current) clearTimeout(programmatic.current);
    },
    [],
  );

  const stop = useCallback(() => setRunning(false), []);

  /** Scrolls the track to card `i` (no state change; the caller sets `active`). */
  const scrollToCard = useCallback((i: number) => {
    const el = track.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (programmatic.current) clearTimeout(programmatic.current);
    programmatic.current = setTimeout(() => {
      programmatic.current = null;
    }, reduce ? 50 : 800);
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  }, []);

  const show = useCallback(
    (i: number) => {
      const next = ((i % n) + n) % n;
      setActive(next);
      scrollToCard(next);
    },
    [n, scrollToCard],
  );

  const advance = () => {
    show(activeRef.current + 1);
    setCycle((c) => c + 1);
  };

  /** Which card the track rests on, after a swipe or a scroll. */
  const onScroll = () => {
    if (programmatic.current) return;
    const el = track.current;
    if (!el) return;
    const left = el.getBoundingClientRect().left;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    Array.from(el.children).forEach((child, i) => {
      const d = Math.abs((child as HTMLElement).getBoundingClientRect().left - left);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    if (gesture.current) stop();
    if (nearest !== activeRef.current) setActive(nearest);
  };

  const onKey = (e: KeyboardEvent) => {
    let to: number | null = null;
    if (e.key === "ArrowRight") to = active + 1;
    else if (e.key === "ArrowLeft") to = active - 1;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = n - 1;
    if (to === null) return;
    e.preventDefault();
    stop();
    const next = ((to % n) + n) % n;
    show(next);
    tabRefs.current[next]?.focus();
  };

  const paused = hovered || focused || !visible || pageHidden;
  const progress = running && n > 1;

  return (
    <div
      ref={root}
      className={`pf${progress ? " pf-run" : ""}`}
      data-paused={paused ? "true" : "false"}
      style={{ ...(schemes[active] as CSSProperties), ["--pf-ms" as string]: `${STUDIO_WORK_ADVANCE_MS}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="pf-bar">
        <div className="dz-tabs pf-tabs" role="tablist" aria-label={labels.label} onKeyDown={onKey}>
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`pf-tab-${t.id}`}
              aria-controls={`pf-panel-${t.id}`}
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              onClick={() => {
                stop();
                show(i);
              }}
            >
              <span className="dz-ti">{String(i + 1).padStart(2, "0")}</span>
              <span className="dz-tl">{t.label}</span>
              <span className="dz-ts">{t.sub}</span>
              {progress && i === active && (
                <span key={`${active}-${cycle}`} className="pf-prog" aria-hidden="true" onAnimationEnd={advance} />
              )}
            </button>
          ))}
        </div>
        <div className="pf-ctl">
          <button type="button" className="pf-btn" aria-label={labels.previous} onClick={() => { stop(); show(active - 1); }}>
            <Chevron back />
          </button>
          <button
            type="button"
            className="pf-btn"
            aria-label={running ? labels.pause : labels.play}
            aria-pressed={!running}
            onClick={() => {
              if (running) stop();
              else {
                setRunning(true);
                setCycle((c) => c + 1);
              }
            }}
          >
            {running ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
            )}
          </button>
          <button type="button" className="pf-btn" aria-label={labels.next} onClick={() => { stop(); show(active + 1); }}>
            <Chevron />
          </button>
        </div>
      </div>
      <div
        ref={track}
        className="pf-track"
        aria-live={running ? "off" : "polite"}
        onScroll={onScroll}
        onPointerDown={() => {
          gesture.current = true;
        }}
        onTouchStart={() => {
          gesture.current = true;
        }}
        onWheel={(e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) gesture.current = true;
        }}
        onPointerUp={() => {
          // A tap is not a swipe: only scrolling while the finger was down counts.
          setTimeout(() => {
            gesture.current = false;
          }, 600);
        }}
      >
        {cards.map((c, i) => (
          <div
            key={tabs[i].id}
            role="tabpanel"
            id={`pf-panel-${tabs[i].id}`}
            aria-labelledby={`pf-tab-${tabs[i].id}`}
            className="pf-slide cs"
            data-case={tabs[i].id}
            style={schemes[i] as CSSProperties}
            inert={i !== active}
          >
            {c.back ? (
              <FlipCard
                front={c.front}
                back={c.back}
                flipLabel={c.flipLabel}
                flipBackLabel={c.flipBackLabel}
                layout="stack"
                hoverDelayMs={450}
                ringClassName="pf-ring"
                className="pf-card"
                data-card={tabs[i].id}
                onFlip={stop}
              />
            ) : (
              <div className="pf-card">{c.front}</div>
            )}
          </div>
        ))}
      </div>
      {n > 1 && <p className="fine pf-hint">{labels.hint}</p>}
    </div>
  );
}
