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

// The portfolio row and the /work grid (hosting_sdk 1.11.0), after the
// prototype Ray approved ("Phones at rest. Desktop on hover."):
//
//   * Every site is a phone. On a wide screen the row drifts left; every
//     few seconds the card nearest the middle grows into the desktop site
//     on its own - at the SAME height as the phones, only the width grows -
//     and a card with a logo back (ROKCT) then turns over to it.
//   * Pointing at, focusing or tapping a card grows it too. A grown card
//     with a back turns over on a click, tap, Enter or Space: base_sdk's
//     FlipCard, the studio's portfolio flip since 1.8.0, controlled here.
//   * The corner icon (Remixicon external-link-line) opens the live site in
//     a new tab. It sits beside the card, not in it, and the row ignores
//     it: pointing at it, focusing it or clicking it never grows or turns
//     the card.
//   * A site is drawn only once its phone AND desktop pictures have both
//     loaded; if either fails, the site leaves the row (and the grid) and
//     the rest close up. If every site leaves, the built-in list (bundled
//     pictures) stands in; with none, the whole section hides
//     (StudioShowcaseScope / StudioShowcaseSection).
//   * prefers-reduced-motion: no drift, no automatic turns, short
//     crossfades. A "Pause the motion" button stops it for anyone.
//   * On a phone the row is a native swipe row with scroll snapping; a tap
//     grows a card to the screen's width.
//   * 1.12.0, the floating logos (Ray approved "Floating Logo Concept"):
//     once a card has turned to its logo back, `lift` goes on the card and
//     the back's drawings (studio-showcase-lift.tsx) lift and grow in place
//     while the card keeps its size; turning back first lets them settle
//     (LIFT_BACK), then turns. Reduced motion: nothing lifts.
//
// The row's last card is "See more": the full ranked list at /work.
"use client";

import { RiArrowRightLine, RiExternalLinkLine, RiPauseLine, RiPlayLine, RiRepeat2Line } from "@remixicon/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { FLIP_DURATION_MS, FlipCard } from "@/components/custom/flip-card";

import {
  STUDIO_SHOWCASE_COPY as T,
  showcaseHost,
  showcaseIsHost,
  showcaseMoreCount,
  showcasePhase,
  visibleShowcase,
  type ShotStatus,
  type ShowcaseLogoBack,
  type ShowcaseSite,
} from "./studio-showcase";

/** The backs a card can turn to, rendered on the server (studio-home.tsx). */
export type ShowcaseBacks = Partial<Record<ShowcaseLogoBack, ReactNode>>;

/** px per second the row drifts at. */
const SPEED = 26;
/** How many copies of the set the rail carries, so the loop never shows its seam. */
const COPIES = 4;
/** How long the pictures may take before the row shows what has loaded. */
const READY_MS = 6000;
/** The drawings lift once the turn has ended... */
const LIFT_AFTER = FLIP_DURATION_MS + 60;
/** ...and settle back for this long before the card turns back. */
const LIFT_BACK = 700;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function probe(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im.naturalWidth > 0);
    im.onerror = () => resolve(false);
    im.src = src;
  });
}

/**
 * Checks every site's two pictures in the browser. `ready` turns true once
 * all have answered (or after READY_MS); a site that answers later joins
 * then. `fail` is for an <img> that errors after the check. The answers
 * belong to one list: a new list (the stand-in) starts unchecked.
 */
export function useShotStatus(sites: ShowcaseSite[]) {
  const key = sites.map((s) => `${s.repo} ${s.phone} ${s.desktop}`).join("|");
  type St = { key: string; status: Record<string, ShotStatus>; ready: boolean };
  const [st, setSt] = useState<St>({ key, status: {}, ready: false });
  const cur: St = st.key === key ? st : { key, status: {}, ready: false };
  const mark = useCallback(
    (k: string, repo: string, v: ShotStatus) =>
      setSt((p) => {
        const b: St = p.key === k ? p : { key: k, status: {}, ready: false };
        return b.status[repo] === v || b.status[repo] === "fail" ? b : { ...b, status: { ...b.status, [repo]: v } };
      }),
    [],
  );
  useEffect(() => {
    let live = true;
    const done = () => setSt((p) => (p.key === key ? (p.ready ? p : { ...p, ready: true }) : { key, status: {}, ready: true }));
    const checks = sites.map((s) =>
      Promise.all([probe(s.phone), probe(s.desktop)]).then((oks) => {
        if (live) mark(key, s.repo, oks.every(Boolean) ? "ok" : "fail");
      }),
    );
    const t = setTimeout(() => live && done(), READY_MS);
    void Promise.all(checks).then(() => {
      if (!live) return;
      clearTimeout(t);
      done();
    });
    return () => {
      live = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` is the sites' identity
  }, [key]);
  const fail = useCallback((repo: string) => mark(key, repo, "fail"), [key, mark]);
  return { status: cur.status, ready: cur.ready, fail };
}

/** A showcase block's state, shared with the section around it and its count. */
const ShowcaseScope = createContext<{
  gone: boolean;
  count: number | null;
  report: (gone: boolean, count: number | null) => void;
} | null>(null);

/**
 * Wraps the part of a page that hangs on the showcase (the home page's
 * work section; /work's count and grid). The row or grid inside reports
 * whether anything is left to show.
 */
export function StudioShowcaseScope({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ gone: boolean; count: number | null }>({ gone: false, count: null });
  const report = useCallback(
    (gone: boolean, count: number | null) =>
      setState((p) => (p.gone === gone && p.count === count ? p : { gone, count })),
    [],
  );
  const value = useMemo(() => ({ ...state, report }), [state, report]);
  return <ShowcaseScope.Provider value={value}>{children}</ShowcaseScope.Provider>;
}

/** A <section> that hides, frame and all, when its showcase has nothing left. */
export function StudioShowcaseSection({
  children,
  ...rest
}: { children: ReactNode; id?: string; className?: string; "aria-label"?: string }) {
  const gone = useContext(ShowcaseScope)?.gone ?? false;
  return (
    <section {...rest} data-showcase="" hidden={gone || undefined}>
      {children}
    </section>
  );
}

/** "N sites": the number the visitor actually sees, once the checks are in. */
export function StudioShowcaseCount({ initial, className }: { initial: number; className?: string }) {
  const scope = useContext(ShowcaseScope);
  if (scope?.gone) return null;
  return <p className={className}>{T.page.count(scope?.count ?? initial)}</p>;
}

/**
 * The list a row or grid draws: the given sites, or `rescue` (the built-in
 * list, bundled pictures) once every given site has dropped; `gone` when
 * neither has anything left, reported to the StudioShowcaseScope.
 */
function useShowcaseList(sites: ShowcaseSite[], rescue: ShowcaseSite[]) {
  const [rescued, setRescued] = useState(false);
  const list = rescued ? rescue : sites;
  const { status, ready, fail } = useShotStatus(list);
  const shown = visibleShowcase(list, status, ready);
  const phase = showcasePhase(shown.length, ready, rescued, rescue.length);
  useEffect(() => {
    if (phase === "rescue") setRescued(true);
  }, [phase]);
  const gone = phase === "gone";
  const report = useContext(ShowcaseScope)?.report;
  useEffect(() => {
    report?.(gone, ready ? shown.length : null);
  }, [report, gone, ready, shown.length]);
  return { list, shown, ready, fail, rescued, gone };
}

function useMedia(query: string): boolean {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const on = () => setM(mql.matches);
    on();
    mql.addEventListener("change", on);
    return () => mql.removeEventListener("change", on);
  }, [query]);
  return m;
}

/** The host the page is served from, after hydration (null on the server). */
function useHost(): string | null {
  const [host, setHost] = useState<string | null>(null);
  useEffect(() => setHost(window.location.host), []);
  return host;
}

/**
 * The live-site link in a card's corner. It belongs to no card gesture.
 * None on the card for the site the visitor is already on: the card the
 * loader marked `own` (the shell's own repo, from config), or whose live
 * address is this page's host.
 */
export function ShowcaseExtLink({ site, interactive = true, className = "sr-ext" }: { site: ShowcaseSite; interactive?: boolean; className?: string }) {
  const host = useHost();
  if (site.own || showcaseIsHost(site.url, host)) return null;
  return (
    <a
      className={className}
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={T.open(site.name)}
      title={T.openTitle(site.name)}
      tabIndex={interactive ? undefined : -1}
    >
      <RiExternalLinkLine size={15} aria-hidden="true" />
    </a>
  );
}

function Front({ site, onError, flips }: { site: ShowcaseSite; onError: () => void; flips: boolean }) {
  return (
    <div className="sr-dev">
      <div className="sr-bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>{showcaseHost(site.url)}</span>
      </div>
      <div className="sr-screen">
        {/* eslint-disable-next-line @next/next/no-img-element -- the site's own shot, served as-is from its shots branch */}
        <img className="sr-ph" src={site.phone} alt={T.phoneAlt(site.name)} width={560} height={1149} decoding="async" onError={onError} />
        {/* eslint-disable-next-line @next/next/no-img-element -- the site's own shot, served as-is from its shots branch */}
        <img className="sr-dk" src={site.desktop} alt={T.desktopAlt(site.name)} width={1200} height={833} decoding="async" onError={onError} />
      </div>
      {flips && (
        <span className="sr-turn" aria-hidden="true">
          <RiRepeat2Line size={14} />
          {T.turn}
        </span>
      )}
    </div>
  );
}

function Back({ site, body }: { site: ShowcaseSite; body: ReactNode }) {
  return (
    <div className="sr-back">
      <div className="sr-back-h">
        <p>
          {T.logoKicker}
          <b>{site.name}</b>
        </p>
        <span className="sr-turn" aria-hidden="true">
          <RiRepeat2Line size={14} />
          {T.back}
        </span>
      </div>
      <div className="sr-back-b">{body}</div>
    </div>
  );
}

/**
 * Before the drawings lift, each is nudged a little away from the sheet's
 * middle (so they spread out as they grow) and, near the edge of the band
 * the row shows, back inside it so none grows off screen.
 */
function placeLifts(card: HTMLElement, mobile: boolean, band: { l: number; r: number }) {
  const spread = mobile ? 0.22 : 0.3;
  const margin = mobile ? 4 : 12;
  const boxEl = card.querySelector(mobile ? ".sr-sk" : ".sr-lsheet");
  if (!boxEl) return;
  const box = boxEl.getBoundingClientRect();
  const scx = box.left + box.width / 2;
  const scy = box.top + box.height / 2;
  card.querySelectorAll<HTMLElement>(mobile ? ".sr-lb-m .sr-lg" : ".sr-lb-w .sr-lg").forEach((el) => {
    const b = el.getBoundingClientRect();
    if (!b.width || parseFloat(getComputedStyle(el).scale) > 1.01) return; // still settling: keep its place
    const k0 = parseFloat(el.style.getPropertyValue("--k")) || 1.5;
    const k = mobile ? 1 + (k0 - 1) * 0.8 : k0;
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    const mark = el.classList.contains("mk-av");
    let dx = mark ? 0 : (cx - scx) * spread;
    const dy = mark ? 0 : (cy - scy) * spread;
    const half = (b.width * k) / 2;
    const lo = band.l + margin;
    const hi = band.r - margin;
    if (cx + dx + half > hi) dx = hi - half - cx;
    if (cx + dx - half < lo) dx = lo + half - cx;
    el.style.setProperty("--dx", `${dx.toFixed(1)}px`);
    el.style.setProperty("--dy", `${dy.toFixed(1)}px`);
  });
}

/**
 * One row's turned card and its lifted drawings. `turn(g, true)` turns the
 * card and, once the turn has ended, lifts; `turn(g, false)` lets a lifted
 * card's drawings settle for LIFT_BACK, then turns it back. `reset()` drops
 * both at once (the card shrank or the row was rebuilt).
 */
function useTurn(find: (g: number) => HTMLElement | null, mobile: () => boolean, band: () => { l: number; r: number }, reduce: () => boolean) {
  const [flipped, setFlipped] = useState<number | null>(null);
  const [lifted, setLifted] = useState<number | null>(null);
  const s = useRef({ flipped: null as number | null, lifted: null as number | null, t: 0 as ReturnType<typeof setTimeout> | 0 });
  const clear = () => {
    if (s.current.t) clearTimeout(s.current.t);
    s.current.t = 0;
  };
  const put = (f: number | null, l: number | null) => {
    s.current.flipped = f;
    s.current.lifted = l;
    setFlipped(f);
    setLifted(l);
  };
  const reset = useCallback(() => {
    clear();
    put(null, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads refs only
  }, []);
  const turn = useCallback((g: number, on: boolean) => {
    const S = s.current;
    clear();
    if (on) {
      put(g, null);
      if (reduce()) return;
      S.t = setTimeout(() => {
        S.t = 0;
        if (S.flipped !== g) return;
        const card = find(g);
        if (card) placeLifts(card, mobile(), band());
        put(g, g);
      }, LIFT_AFTER);
    } else if (S.lifted === g) {
      put(g, null);
      S.t = setTimeout(() => {
        S.t = 0;
        if (S.flipped === g && S.lifted === null) put(null, null);
      }, LIFT_BACK);
    } else put(null, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads refs and stable getters only
  }, []);
  useEffect(() => clear, []);
  return { flipped, lifted, turn, reset };
}

type Item = { more: false; site: ShowcaseSite } | { more: true };

interface CardProps {
  item: Item;
  g: number;
  interactive: boolean;
  big: boolean;
  flipped: boolean;
  /** 1.12.0: the back's drawings are lifted. */
  lifted: boolean;
  dim: boolean;
  backs: ShowcaseBacks;
  total: number;
  moreHref: string;
  onFlipRequest: (g: number, next: boolean) => void;
  onError: (repo: string) => void;
}

function Card(props: CardProps) {
  // The rail's copies (the loop) answer the pointer like the real cards but
  // are hidden from assistive tech and out of the tab order; FlipCard's own
  // tab stop is taken out here, after it renders.
  const ref = useRef<HTMLLIElement>(null);
  const { interactive } = props;
  useEffect(() => {
    ref.current?.querySelectorAll<HTMLElement>('[role="button"]').forEach((el) => {
      el.tabIndex = interactive ? 0 : -1;
    });
  });
  return <CardBody {...props} liRef={ref} />;
}

function CardBody({ item, g, interactive, big, flipped, lifted, dim, backs, total, moreHref, onFlipRequest, onError, liRef }: CardProps & { liRef: RefObject<HTMLLIElement | null> }) {
  if (item.more) {
    return (
      <li ref={liRef} className="sr-card sr-more" data-g={g} data-more="true" aria-hidden={interactive ? undefined : true}>
        <a className="sr-more-in" href={moreHref} tabIndex={interactive ? undefined : -1}>
          <span className="sr-more-k">{T.more}</span>
          <span className="sr-more-n">{T.moreSub(total)}</span>
          <span className="sr-more-go" aria-hidden="true">
            <RiArrowRightLine size={20} />
          </span>
        </a>
      </li>
    );
  }
  const { site } = item;
  const body = site.logoBack ? backs[site.logoBack] : undefined;
  const flips = body !== undefined;
  const cls = `sr-card${big ? " big" : ""}${flipped ? " flipped" : ""}${lifted ? " lift" : ""}${dim ? " dim" : ""}`;
  const label = `${site.name}, ${site.kind}. ${site.tagline}`;
  const err = () => onError(site.repo);
  return (
    <li
      ref={liRef}
      className={cls}
      data-g={g}
      data-site={site.repo}
      data-flips={flips ? "true" : undefined}
      role="group"
      aria-roledescription={T.roleDescription}
      aria-label={interactive ? label : undefined}
      aria-hidden={interactive ? undefined : true}
      tabIndex={interactive && !flips ? 0 : undefined}
    >
      {flips ? (
        <FlipCard
          className="sr-flip"
          ringClassName="sr-ring"
          layout="fill"
          flipped={flipped}
          onFlippedChange={(next) => onFlipRequest(g, next)}
          flipLabel={`${site.name}: ${T.turn}`}
          flipBackLabel={`${site.name}: ${T.back}`}
          front={<Front site={site} onError={err} flips />}
          back={big || flipped ? <Back site={site} body={body} /> : null}
        />
      ) : (
        <div className="sr-flip">
          <Front site={site} onError={err} flips={false} />
        </div>
      )}
      <ShowcaseExtLink site={site} interactive={interactive} />
      <p className="sr-cap">
        <b>{site.name}</b> · <span>{site.kind}</span>
        <em>{site.tagline}</em>
      </p>
    </li>
  );
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * The home page's row: the top sites (already cut to SHOWCASE_HOME_COUNT by
 * the caller) and a "See more" card to `moreHref`. `total` is the length of
 * the whole list, for the See more card's line.
 */
export function StudioShowcaseRow({
  sites,
  total: givenTotal,
  backs,
  moreHref,
  rescue = [],
}: {
  sites: ShowcaseSite[];
  total: number;
  backs: ShowcaseBacks;
  moreHref: string;
  /** The stand-in if every site drops (showcaseRescueList), already cut to the row's length. */
  rescue?: ShowcaseSite[];
}) {
  const { list, shown, ready, fail, rescued } = useShowcaseList(sites, rescue);
  // A card that dropped out is not counted on See more (1.12.0).
  const total = showcaseMoreCount(givenTotal, list.length, shown.length, rescued, rescue.length);
  const items: Item[] = [...shown.map((site) => ({ more: false as const, site })), { more: true as const }];
  const showKey = shown.map((s) => s.repo).join(",");

  const mobile = useMedia("(max-width: 699.98px)");
  const reduce = useMedia("(prefers-reduced-motion: reduce)");
  const fine = useMedia("(hover: hover) and (pointer: fine)");

  const [reps, setReps] = useState(1);
  const [big, setBig] = useState<number | null>(null);
  const [mBig, setMBig] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  const stage = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLUListElement>(null);
  const probeEl = useRef<HTMLDivElement>(null);
  const mrow = useRef<HTMLUListElement>(null);

  // The turned card and its lifted drawings, one per row.
  const isReduce = () => r.current.reduce;
  const desk = useTurn(
    (g) => rail.current?.querySelector<HTMLElement>(`li[data-g="${g}"]`) ?? null,
    () => false,
    () => {
      const b = stage.current?.getBoundingClientRect();
      return b ? { l: b.left, r: b.left + r.current.stageW } : { l: 0, r: window.innerWidth };
    },
    isReduce,
  );
  const phone = useTurn(
    (g) => mrow.current?.querySelector<HTMLElement>(`li[data-g="${g}"]`) ?? null,
    () => true,
    () => ({ l: 0, r: document.documentElement.clientWidth }),
    isReduce,
  );
  const { flipped, lifted, turn: setFlip, reset: unturn } = desk;
  const { flipped: mFlipped, lifted: mLifted, turn: setMFlip, reset: mUnturn } = phone;

  // Everything the animation loop reads lives in refs, so a frame never waits on React.
  const r = useRef({
    x: 0,
    v: 0,
    xGoal: null as number | null,
    last: 0,
    pw: 196,
    gap: 30,
    setW: 1,
    stageW: 1440,
    big: null as number | null,
    mBig: null as number | null,
    hovering: false,
    focusing: false,
    paused: false,
    reduce: false,
    mobile: false,
    fine: false,
    autoHold: false,
    autoCard: null as number | null,
    lastAuto: null as string | null,
    gen: 0,
    leaveT: 0 as ReturnType<typeof setTimeout> | 0,
    setLen: 1,
    shownLen: 0,
  });
  r.current.paused = paused;
  r.current.reduce = reduce;
  r.current.mobile = mobile;
  r.current.fine = fine;

  const setLen = items.length * reps;
  const motionOK = () => !r.current.reduce && !r.current.paused && !r.current.mobile;

  const measure = useCallback(() => {
    const s = stage.current;
    if (!s) return;
    const cs = getComputedStyle(s);
    const R = r.current;
    R.pw = parseFloat(cs.getPropertyValue("--pw")) || 196;
    R.gap = parseFloat(cs.getPropertyValue("--gap")) || 30;
    R.setW = Math.max(1, R.setLen) * (R.pw + R.gap);
    R.stageW = s.clientWidth || R.stageW;
  }, []);

  const setShift = (px: number) => rail.current?.style.setProperty("--shift", `${px}px`);

  const shrink = useCallback(
    (keepShift = false) => {
      r.current.big = null;
      setBig(null);
      unturn();
      if (!keepShift) setShift(0);
    },
    [unturn],
  );

  const grow = useCallback(
    (g: number) => {
      const R = r.current;
      if (R.big === g) return;
      measure();
      R.big = g;
      setBig(g);
      unturn();
      const dw = probeEl.current?.getBoundingClientRect().width || 600;
      setShift(-(dw - R.pw) / 2);
    },
    [measure, unturn],
  );

  const cancelAuto = useCallback(() => {
    const R = r.current;
    R.gen++;
    R.autoHold = false;
    if (R.autoCard !== null && R.autoCard === R.big && !R.hovering && !R.focusing) shrink();
    R.autoCard = null;
  }, [shrink]);

  // Rebuild: the shown sites or the repeat count changed.
  useIsoLayoutEffect(() => {
    const R = r.current;
    R.setLen = setLen;
    R.shownLen = shown.length;
    R.gen++;
    R.autoHold = false;
    R.autoCard = null;
    R.hovering = false;
    R.focusing = false;
    R.lastAuto = null;
    R.big = null;
    R.mBig = null;
    setBig(null);
    unturn();
    setMBig(null);
    mUnturn();
    setShift(0);
    measure();
    R.x = R.setW + R.gap;
    R.xGoal = null;
    R.v = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild on the list and the repeat count only
  }, [showKey, reps]);

  // Repeat the set until one set is wider than the stage.
  useEffect(() => {
    const onResize = () => {
      measure();
      const R = r.current;
      const need = Math.max(1, Math.ceil(Math.max(R.stageW, 1200) / (items.length * (R.pw + R.gap))));
      setReps((cur) => (need > cur ? need : cur));
      if (R.x < R.setW * 0.5 || R.x > 2 * R.setW) R.x = R.setW + R.gap;
      const m = mrow.current;
      if (m) {
        const pad = parseFloat(getComputedStyle(m).paddingLeft || "16") || 16;
        m.style.setProperty("--mdw", `${Math.min(560, document.documentElement.clientWidth - 2 * pad)}px`);
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [items.length, measure]);

  // A phone/desktop switch closes whatever is open.
  useEffect(() => {
    if (r.current.big !== null) shrink();
    r.current.mBig = null;
    setMBig(null);
    mUnturn();
  }, [mobile, shrink, mUnturn]);

  // The drift.
  useEffect(() => {
    let raf = 0;
    const R = r.current;
    R.last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - R.last) / 1000);
      R.last = now;
      if (!R.mobile && track.current) {
        const want = motionOK() && !R.hovering && !R.focusing && R.big === null && !R.autoHold ? SPEED : 0;
        if (R.xGoal !== null) {
          R.x += (R.xGoal - R.x) * Math.min(1, dt * 7);
          R.v = 0;
          if (Math.abs(R.xGoal - R.x) < 0.5) {
            R.x = R.xGoal;
            R.xGoal = null;
          }
        } else {
          R.v += (want - R.v) * Math.min(1, dt * 2.2);
          R.x += R.v * dt;
        }
        // Wrap only while nothing is open, so the jump is never seen.
        if (R.big === null && R.xGoal === null) {
          if (R.x >= 2 * R.setW) R.x -= R.setW;
          else if (R.x < R.setW * 0.5) R.x += R.setW;
        }
        track.current.style.transform = `translate3d(${(-R.x).toFixed(2)}px,0,0)`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads refs only
  }, []);

  // The automatic turn: the card nearest the middle grows, turns if it has a back.
  useEffect(() => {
    let alive = true;
    const R = r.current;
    const nearest = (): HTMLElement | null => {
      const s = stage.current;
      const ul = rail.current;
      if (!s || !ul) return null;
      const mid = s.getBoundingClientRect().left + R.stageW / 2;
      let best: HTMLElement | null = null;
      let d = Infinity;
      ul.querySelectorAll<HTMLElement>("li[data-site]").forEach((c) => {
        if (c.dataset.site === R.lastAuto && R.shownLen > 1) return; // take turns
        const b = c.getBoundingClientRect();
        const dd = Math.abs(b.left + b.width / 2 - mid);
        if (dd < d) {
          d = dd;
          best = c;
        }
      });
      return best;
    };
    (async () => {
      while (alive) {
        const g0 = R.gen;
        await sleep(4200);
        if (!alive) return;
        if (g0 !== R.gen) continue;
        if (!motionOK() || R.hovering || R.focusing || R.big !== null || document.hidden || R.shownLen === 0) continue;
        R.autoHold = true; // ease the row to a stop first
        await sleep(900);
        if (!alive) return;
        if (g0 !== R.gen) continue;
        const card = nearest();
        const s = stage.current;
        if (!card || !s) {
          R.autoHold = false;
          continue;
        }
        R.xGoal = R.x + (card.getBoundingClientRect().left + R.pw / 2) - (s.getBoundingClientRect().left + R.stageW / 2);
        await sleep(450);
        if (!alive) return;
        if (g0 !== R.gen) continue;
        const g = Number(card.dataset.g);
        const flips = card.dataset.flips === "true";
        R.autoCard = g;
        R.lastAuto = card.dataset.site ?? null;
        grow(g);
        await sleep(flips ? 2400 : 3000);
        if (!alive) return;
        if (g0 !== R.gen) continue;
        if (flips) {
          setFlip(g, true);
          await sleep(3800);
          if (!alive) return;
          if (g0 !== R.gen) continue;
          setFlip(g, false); // the drawings settle first, then the card turns back
          await sleep(R.reduce ? 1100 : 1100 + LIFT_BACK);
          if (!alive) return;
          if (g0 !== R.gen) continue;
        }
        shrink();
        R.autoCard = null;
        await sleep(700);
        if (!alive) return;
        if (g0 !== R.gen) continue;
        R.autoHold = false;
      }
    })();
    return () => {
      alive = false;
      R.gen++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads refs only
  }, [grow, shrink, setFlip]);

  useEffect(() => {
    if (paused || reduce) cancelAuto();
  }, [paused, reduce, cancelAuto]);

  // ---- the desktop row: point, focus, tap ---------------------------------
  const cardOf = (t: EventTarget | null): HTMLElement | null =>
    t instanceof Element ? (t.closest("li[data-g]") as HTMLElement | null) : null;
  const onExt = (t: EventTarget | null) => t instanceof Element && !!t.closest(".sr-ext");

  const onPointerOver = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const card = cardOf(e.target);
    if (!card || card.dataset.more) return;
    const R = r.current;
    if (R.leaveT) clearTimeout(R.leaveT);
    R.hovering = true; // the row holds still under the pointer
    if (onExt(e.target)) return; // the live-site link never grows the card
    const g = Number(card.dataset.g);
    if (R.big !== g) {
      cancelAuto();
      grow(g);
    } else if (R.autoCard === g) {
      R.gen++; // the visitor takes over the open card
      R.autoHold = false;
      R.autoCard = null;
    }
  };
  const onStageLeave = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const R = r.current;
    if (R.leaveT) clearTimeout(R.leaveT);
    R.leaveT = setTimeout(() => {
      R.hovering = false;
      if (!R.focusing && R.big !== null) shrink();
    }, 140);
  };
  const onPointerOut = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const R = r.current;
    const from = cardOf(e.target);
    const to = cardOf(e.relatedTarget);
    if (from && from !== to && Number(from.dataset.g) === R.big) {
      if (R.leaveT) clearTimeout(R.leaveT);
      const g = R.big;
      R.leaveT = setTimeout(() => {
        if (R.big === g && !R.focusing) shrink();
      }, 260);
    }
  };
  const onRailClick = (e: MouseEvent) => {
    const card = cardOf(e.target);
    if (!card || card.dataset.more || onExt(e.target)) return;
    if (card.dataset.flips) return; // FlipCard asks through onFlipRequest
    const R = r.current;
    if (R.fine) return;
    // A touch screen wide enough for the row: a tap opens or closes.
    const g = Number(card.dataset.g);
    cancelAuto();
    if (R.big === g) {
      R.hovering = false;
      shrink();
    } else {
      R.hovering = true;
      grow(g);
    }
  };
  const onRailFocus = (e: FocusEvent) => {
    const card = cardOf(e.target);
    if (!card || card.dataset.more || onExt(e.target)) return;
    if (!(e.target as Element).matches(":focus-visible")) return; // a click is not keyboard focus
    const R = r.current;
    R.focusing = true;
    cancelAuto();
    const g = Number(card.dataset.g);
    if (R.big !== g) {
      grow(g);
      measure();
      R.xGoal = R.gap + g * (R.pw + R.gap) + R.pw / 2 - R.stageW / 2; // centre it
    }
  };
  const onRailBlur = (e: FocusEvent) => {
    const to = e.relatedTarget instanceof Element ? e.relatedTarget.closest("li[data-site]") : null;
    if (to && rail.current?.contains(to)) return;
    const R = r.current;
    R.focusing = false;
    if (!R.hovering && R.big !== null) shrink();
  };
  const onRailKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    const card = cardOf(e.target);
    if (!card) return;
    r.current.focusing = false;
    shrink();
    (e.target as HTMLElement).blur?.();
  };
  // FlipCard's click / Enter / Space: a small card grows first, a grown one turns.
  const onFlipRequest = (g: number, next: boolean) => {
    const R = r.current;
    if (R.big !== g) {
      cancelAuto();
      R.hovering = !R.fine;
      grow(g);
      return;
    }
    if (R.autoCard === g) {
      R.gen++;
      R.autoHold = false;
      R.autoCard = null;
    }
    setFlip(g, next);
  };

  // ---- phones: the swipe row, tap to open ---------------------------------
  const mOpen = (g: number, on: boolean) => {
    const R = r.current;
    R.mBig = on ? g : R.mBig === g ? null : R.mBig;
    setMBig(R.mBig);
    mUnturn();
    if (!on) return;
    setTimeout(() => {
      const ul = mrow.current;
      const card = ul?.querySelector<HTMLElement>(`li[data-g="${g}"]`);
      if (!ul || !card) return;
      const a = card.getBoundingClientRect();
      const b = ul.getBoundingClientRect();
      ul.scrollBy({ left: a.left + a.width / 2 - (b.left + b.width / 2), behavior: r.current.reduce ? "auto" : "smooth" });
    }, 620);
  };
  const onMClick = (e: MouseEvent) => {
    const card = cardOf(e.target);
    if (!card || card.dataset.more || onExt(e.target) || card.dataset.flips) return;
    const g = Number(card.dataset.g);
    mOpen(g, r.current.mBig !== g);
  };
  const onMKey = (e: KeyboardEvent) => {
    const card = cardOf(e.target);
    if (!card || e.target !== card) return;
    const g = Number(card.dataset.g);
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      mOpen(g, r.current.mBig !== g);
    } else if (e.key === "Escape") mOpen(g, false);
  };
  const onMFlipRequest = (g: number, next: boolean) => {
    if (r.current.mBig !== g) {
      mOpen(g, true);
      return;
    }
    setMFlip(g, next);
  };

  const rows: { item: Item; g: number; interactive: boolean }[] = [];
  for (let c = 0; c < COPIES; c++) {
    for (let k = 0; k < setLen; k++) {
      const i = k % items.length;
      rows.push({ item: items[i], g: c * setLen + k, interactive: c === 1 && k < items.length });
    }
  }
  const none = shown.length === 0 && ready;

  return (
    <div className="sr" data-ready={ready ? "true" : undefined} hidden={none}>
      <section
        ref={stage}
        className={`sr-stage${big !== null ? " has-big" : ""}`}
        aria-label={T.rowLabel}
        onPointerLeave={onStageLeave}
      >
        <div ref={track} className="sr-track">
          <ul
            ref={rail}
            className="sr-rail"
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            onClick={onRailClick}
            onFocus={onRailFocus}
            onBlur={onRailBlur}
            onKeyDown={onRailKey}
          >
            {rows.map(({ item, g, interactive }) => (
              <Card
                key={g}
                item={item}
                g={g}
                interactive={interactive}
                big={big === g}
                flipped={flipped === g}
                lifted={lifted === g}
                dim={big !== null && big !== g}
                backs={backs}
                total={total}
                moreHref={moreHref}
                onFlipRequest={onFlipRequest}
                onError={fail}
              />
            ))}
          </ul>
        </div>
        <div ref={probeEl} className="sr-probe" aria-hidden="true" />
      </section>

      <div className="sr-ctl">
        <button type="button" className="sr-chip sr-pause" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? <RiPlayLine size={13} aria-hidden="true" /> : <RiPauseLine size={13} aria-hidden="true" />}
          <span>{paused ? T.play : T.pause}</span>
        </button>
        <a className="sr-chip" href={moreHref}>
          <span>{T.allWork}</span>
          <RiArrowRightLine size={13} aria-hidden="true" />
        </a>
      </div>

      <ul ref={mrow} className="sr-m" aria-label={T.rowLabelPhone} onClick={onMClick} onKeyDown={onMKey}>
        {items.map((item, g) => (
          <Card
            key={g}
            item={item}
            g={g}
            interactive
            big={mBig === g}
            flipped={mFlipped === g}
            lifted={mLifted === g}
            dim={false}
            backs={backs}
            total={total}
            moreHref={moreHref}
            onFlipRequest={onMFlipRequest}
            onError={fail}
          />
        ))}
      </ul>
    </div>
  );
}

/**
 * /work: every site, ranked, as a grid. Each item shows the desktop and
 * phone pictures under the same rule as the row (both must load or the
 * item leaves the grid), the corner link, the name, the kind and the line.
 * The pictures are not lazy: the check has already fetched every one.
 */
export function StudioShowcaseGrid({ sites, rescue = [] }: { sites: ShowcaseSite[]; rescue?: ShowcaseSite[] }) {
  const { shown, ready, fail, gone } = useShowcaseList(sites, rescue);
  return (
    <ol className="wk-grid" data-ready={ready ? "true" : undefined} hidden={gone || undefined}>
      {shown.map((site, i) => (
        <li key={site.repo} className="wk-item" data-site={site.repo}>
          <div className="wk-shots">
            <div className="wk-desk">
              <div className="sr-bar" aria-hidden="true">
                <i />
                <i />
                <i />
                <span>{showcaseHost(site.url)}</span>
              </div>
              <div className="wk-desk-s">
                {/* eslint-disable-next-line @next/next/no-img-element -- the site's own shot, served as-is from its shots branch */}
                <img src={site.desktop} alt={T.desktopAlt(site.name)} width={1200} height={833} decoding="async" onError={() => fail(site.repo)} />
              </div>
            </div>
            <div className="wk-phone">
              {/* eslint-disable-next-line @next/next/no-img-element -- the site's own shot, served as-is from its shots branch */}
              <img src={site.phone} alt={T.phoneAlt(site.name)} width={560} height={1149} decoding="async" onError={() => fail(site.repo)} />
            </div>
            <ShowcaseExtLink site={site} className="sr-ext wk-ext" />
          </div>
          <div className="wk-meta">
            <span className="wk-n num">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h2 className="wk-name">{site.name}</h2>
              <p className="wk-kind">{site.kind}</p>
            </div>
            <p className="wk-tag">{site.tagline}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
