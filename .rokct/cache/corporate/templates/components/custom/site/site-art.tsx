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


// A local-data site's drawn art (corporate_sdk 1.4.0), in SVG so the page
// carries its pictures with nothing to fetch: a PET bottle (500 ml or the
// taller 1.25 litre) wearing a label drawn from data - a name and a
// sub-line, or the site's own label art image (data names its public
// path) - plus the type wordmark, a round stamp, a wave edge, the step
// glyphs and the WhatsApp glyph, and SiteArtView, which draws a data
// SiteArt (a bottle, or the site's own image file). Server-safe: no hooks,
// no browser APIs, so the client order form can use it too. Every gradient
// id is prefixed with the instance `id`, so several bottles share a page.
import React from "react";

import type { SiteArt, SiteLabel, SiteStepIcon } from "@/lib/site-data/kinds";

export type SiteBottleSize = "500 ml" | "1.25 L";

function bodyPath(extra: number) {
  const b = 496 + extra;
  return `M86 48 H134 V82 C134 104 192 112 192 164 V${b} C192 ${b + 42} 180 ${b + 74} 150 ${b + 90} Q110 ${b + 104} 70 ${b + 90} C40 ${b + 74} 28 ${b + 42} 28 ${b} V164 C28 112 86 104 86 82 Z`;
}

const LABEL_SHAPE = "M20 250 Q110 262 200 250 V404 Q110 416 20 404 Z";


/** A label drawn from data: the name large in the display face, a rule, the sub-line, the small print. */
function LabelFace({ label, size }: { label: SiteLabel; size: SiteBottleSize }) {
  const fg = label.fg ?? "#1d1416";
  const name = label.name ?? "";
  const len = name.length;
  const nameSize = len > 14 ? 15 : len > 11 ? 18 : len > 8 ? 22 : 26;
  // A heavy display face runs about 0.8em a capital: squeeze anything wider
  // than the 136 units of label the bottle shows.
  const fit = nameSize * 0.8 * len > 136 ? { textLength: 136, lengthAdjust: "spacingAndGlyphs" as const } : {};
  return (
    <>
      <text
        x="110"
        y="318"
        textAnchor="middle"
        fontFamily="var(--cs-font-display-stack)"
        fontWeight="900"
        style={{ fontStyle: "var(--cs-display-style)" }}
        fontSize={nameSize}
        fill={fg}
        {...fit}
      >
        {name.toUpperCase()}
      </text>
      <line x1="62" y1="332" x2="158" y2="332" stroke={fg} strokeOpacity="0.5" strokeWidth="1" />
      {label.sub && (
        <text x="110" y="352" textAnchor="middle" fontFamily="var(--cs-font-sans-stack)" fontWeight="600" fontSize="12" fill={fg} opacity="0.85">
          {label.sub}
        </text>
      )}
      {label.footer && (
        <text
          x="110"
          y="390"
          textAnchor="middle"
          fontFamily="var(--cs-font-sans-stack)"
          fontWeight="500"
          fontSize="7"
          letterSpacing="0.06em"
          fill={fg}
          opacity="0.6"
        >
          {`${label.footer} · ${size}`.toUpperCase()}
        </text>
      )}
    </>
  );
}

/**
 * A PET bottle wearing `label`: a 500 ml bottle, or the taller 1.25 litre.
 * The label is drawn from its name and sub-line, or, when it names an
 * `art` image, that image laid over the label's ground.
 */
export function Bottle({
  id,
  label,
  size = "500 ml",
  height = 560,
  cap,
  className,
  style,
}: {
  id: string;
  label: SiteLabel;
  size?: SiteBottleSize;
  height?: number;
  cap?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const extra = size === "1.25 L" ? 90 : 0;
  const vbH = 620 + extra;
  const body = bodyPath(extra);
  const w = (height * 240) / vbH;
  const capFill = cap ?? "#ffffff";
  const name = label.name ?? "";
  const ribsLow = [448, 468, 488].map((y) => y + extra);
  return (
    <svg
      width={w}
      height={height}
      viewBox={`0 0 240 ${vbH}`}
      role="img"
      aria-label={`${size} bottle labelled ${name}`}
      className={className}
      style={style}
    >
      <defs>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6fbfd" />
          <stop offset="0.4" stopColor="#dcedf3" />
          <stop offset="1" stopColor="#a9d2e2" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="0.18" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.86" stopColor="#1b2a33" stopOpacity="0.12" />
          <stop offset="1" stopColor="#1b2a33" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={`${id}-lab`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.2" />
          <stop offset="0.2" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.85" stopColor="#000" stopOpacity="0.1" />
          <stop offset="1" stopColor="#000" stopOpacity="0.34" />
        </linearGradient>
        <linearGradient id={`${id}-cap`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id={`${id}-drop`} cx="0.35" cy="0.3" r="0.7">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#5a8396" stopOpacity="0.25" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <path d={body} />
        </clipPath>
        <filter id={`${id}-blur`} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      <ellipse cx="112" cy={604 + extra} rx="78" ry="9" fill="#1a0508" opacity="0.35" filter={`url(#${id}-blur)`} />

      <rect x="78" y="2" width="64" height="38" rx="7" fill={capFill} />
      <rect x="78" y="2" width="64" height="38" rx="7" fill={`url(#${id}-cap)`} />
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={i} x1={85 + i * 6.3} y1="8" x2={85 + i * 6.3} y2="34" stroke="#000" strokeOpacity="0.12" strokeWidth="1.4" />
      ))}
      <rect x="80" y="40" width="60" height="9" rx="3" fill={capFill} opacity="0.85" />

      <path d={body} fill={`url(#${id}-water)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {[176, 194, 212].map((y) => (
          <path key={y} d={`M20 ${y} Q110 ${y + 7} 200 ${y}`} fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="2" />
        ))}
        {[180, 198, 216].map((y) => (
          <path key={y} d={`M20 ${y} Q110 ${y + 7} 200 ${y}`} fill="none" stroke="#1b2a33" strokeOpacity="0.1" strokeWidth="1.5" />
        ))}
        {ribsLow.map((y) => (
          <path key={y} d={`M20 ${y} Q110 ${y + 7} 200 ${y}`} fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" />
        ))}
        {ribsLow.map((y) => (
          <path key={`s${y}`} d={`M20 ${y + 4} Q110 ${y + 11} 200 ${y + 4}`} fill="none" stroke="#1b2a33" strokeOpacity="0.1" strokeWidth="1.5" />
        ))}

        <path d={LABEL_SHAPE} fill={label.bg} />
        {label.art ? (
          <image href={label.art} x="34" y="256" width="151.2" height="126" preserveAspectRatio="xMidYMid meet" />
        ) : (
          <LabelFace label={label} size={size} />
        )}
        <path d={LABEL_SHAPE} fill={`url(#${id}-lab)`} />

        <path d={body} fill={`url(#${id}-sheen)`} />
        <rect x="44" y="128" width="12" height={440 + extra} rx="6" fill="#fff" opacity="0.32" />
        <rect x="176" y="150" width="4" height={400 + extra} rx="2" fill="#1b2a33" opacity="0.14" />
      </g>

      {[
        [58, 150, 5],
        [160, 140, 4],
        [70, 226, 3.5],
        [150, 232, 6],
        [48, 430 + extra, 4],
        [172, 420 + extra, 3.5],
        [100, 520 + extra, 5],
        [140, 548 + extra, 3],
        [62, 560 + extra, 4.5],
        [120, 110, 3],
      ].map(([cx, cy, r], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={`url(#${id}-drop)`} className="cs-drop" style={{ animationDelay: `${i * 0.7}s` }} />
      ))}
    </svg>
  );
}

/** The site's wordmark as type: a heavy lead word (with its mark) over a light rest. */
export function Wordmark({ wordmark, name, className }: { wordmark: { lead: string; mark?: string; rest?: string }; name: string; className?: string }) {
  return (
    <span className={`cs-wordmark ${className ?? ""}`} aria-label={name} role="img">
      <b aria-hidden="true">
        {wordmark.lead}
        {wordmark.mark && <sup>{wordmark.mark}</sup>}
      </b>
      {wordmark.rest && <span aria-hidden="true">{wordmark.rest}</span>}
    </span>
  );
}

/** A round "stamp" with text around the rim: the site's mark of origin. */
export function Stamp({ id, lines, size = 150, center = "" }: { id: string; lines: readonly string[]; size?: number; center?: string }) {
  const text = lines.join("  ·  ") + "  ·  ";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className="cs-stamp" aria-label={lines.join(", ")} role="img">
      <defs>
        <path id={`${id}-ring`} d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0" />
      </defs>
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="100" cy="100" r="54" fill="currentColor" />
      <text fontFamily="var(--cs-font-display-stack)" fontWeight="800" fontSize="14" letterSpacing="0.12em" fill="currentColor">
        <textPath href={`#${id}-ring`} startOffset="0">
          {text.toUpperCase()}
        </textPath>
      </text>
      <text x="100" y="113" textAnchor="middle" fontFamily="var(--cs-font-display-stack)" style={{ fontStyle: "var(--cs-display-style)" }} fontWeight="900" fontSize="36" fill="var(--cs-on-brand)">
        {center}
      </text>
    </svg>
  );
}

/** A soft wave edge, used between bands. */
export function Wave({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 40 C240 90 480 -10 720 40 C960 90 1200 -10 1440 40 V80 H0 Z" fill="currentColor" />
    </svg>
  );
}


/** The glyph a step names (data: steps[].icon), else one by position. */
export function StepGlyph({ icon, n }: { icon?: SiteStepIcon; n: number }) {
  const common = { width: 36, height: 36, viewBox: "0 0 36 36", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  const which: SiteStepIcon = icon ?? (["upload", "label", "truck"] as const)[n % 3];
  if (which === "upload")
    return (
      <svg {...common}>
        <path d="M18 24V8m0 0-5 5m5-5 5 5" />
        <path d="M6 22v5a3 3 0 0 0 3 3h18a3 3 0 0 0 3-3v-5" />
      </svg>
    );
  if (which === "label")
    return (
      <svg {...common}>
        <rect x="5" y="9" width="26" height="18" rx="3" />
        <path d="M10 15h16M10 20h9" />
      </svg>
    );
  if (which === "chat")
    return (
      <svg {...common}>
        <path d="M6 8h24v15H14l-6 5v-5H6z" />
        <path d="M11 14h14M11 18h9" />
      </svg>
    );
  if (which === "star")
    return (
      <svg {...common}>
        <path d="m18 5 3.9 8 8.6 1.2-6.2 6 1.5 8.6L18 24.7l-7.8 4.1 1.5-8.6-6.2-6 8.6-1.2z" />
      </svg>
    );
  if (which === "check")
    return (
      <svg {...common}>
        <circle cx="18" cy="18" r="13" />
        <path d="m12 18 4 4 8-8" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M4 10h16v13H4zM20 15h7l5 5v3h-12z" />
      <circle cx="10" cy="28" r="2.5" />
      <circle cx="26" cy="28" r="2.5" />
    </svg>
  );
}

export function WhatsAppGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 1 1-4.2 15.3l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3 4.4c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.3s1 2.7 1.1 2.9c.2.2 2 3.1 4.9 4.2 2.4.9 2.9.8 3.4.7.5 0 1.7-.7 1.9-1.3.2-.7.2-1.2.2-1.3l-.6-.3-2-1c-.3-.1-.5-.2-.7.2l-.9 1.2c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.4 0-.5L10 8.7c-.2-.5-.4-.5-.6-.5H9z" />
    </svg>
  );
}

/** A data picture at a height: the drawn bottle, or the site's own image file. */
export function SiteArtView({ art, id, height, className }: { art: SiteArt; id: string; height: number; className?: string }) {
  if (art.kind === "bottle") {
    return <Bottle id={id} label={art.label} size={art.size} cap={art.cap} height={height} className={className} />;
  }
  const w = art.width && art.height ? Math.round((height * art.width) / art.height) : undefined;
  // eslint-disable-next-line @next/next/no-img-element -- a site's own art file, drawn at its declared size
  return <img src={art.src} alt={art.alt} width={w} height={height} className={`cs-art-img ${className ?? ""}`} />;
}
