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

// The ROKCT card's back in the portfolio row with its floating logos
// (hosting_sdk 1.12.0), after the prototype Ray approved ("Floating Logo
// Concept"). When the card has turned, the card stays the same size; the
// four sketches and the final R lift off the sheet and grow a little in
// place, the red pen circle is drawn around C while it is big (then the
// tick), and they settle back. The faded sheet under them shows without
// its red ring while they are up; the ring comes back about half a second
// after they land.
//
//   * The sheet is a committed picture (public/studio/lift/), one per theme,
//     each with a copy that has no red ring ("-nored"). Wide screens show
//     the whole logo page (the brief, the four sketches, the final and why
//     it won); phones show the sketch sheet beside the final mark.
//   * Every drawing is its own cut-out picture laid exactly on its spot in
//     the sheet (`LIFT_SHEET` / `LIFT_SKETCHES`, in % of the sheet), with
//     its own grow factor `k`. The client (studio-showcase-client.tsx) puts
//     `lift` on the card once the turn has ended, after nudging each layer
//     a little away from the sheet's middle and back inside the row.
//   * The pen ring and tick are SVG strokes over cut-out C in the sheet's
//     own pixel coordinates, drawn with a dash offset (pathLength 1).
//   * prefers-reduced-motion: nothing lifts and the sheet shows complete.
//
// Server component; no state. The pictures were cut from the prototype's
// sheets (the cut feathers each drawing on the paper colour and un-mixes
// the paper from its edge, so it sits on either theme).

import { STUDIO_MARK_COPY, type StudioMarkSet } from "./studio-copy";

/** Where the back's pictures live (installed at public/studio/lift/). */
export const LIFT_DIR = "/studio/lift";

/** One drawing's cut-out: its key, its box in % of the sheet, and how much it grows. */
export interface LiftLayer {
  key: string;
  x: number;
  y: number;
  w: number;
  h: number;
  k: number;
}

/** The wide back: the whole logo page (1200 x 824); A to D and the final R. */
export const LIFT_SHEET: readonly LiftLayer[] = [
  { key: "a", x: 4.5, y: 25.73, w: 23.5, h: 12.38, k: 1.5 },
  { key: "b", x: 35.08, y: 21.36, w: 14.42, h: 22.33, k: 1.6 },
  { key: "c", x: 5.5, y: 54.85, w: 23.67, h: 31.55, k: 1.5 },
  { key: "d", x: 33.75, y: 58.86, w: 17.08, h: 24.88, k: 1.55 },
  { key: "r", x: 70.92, y: 25.12, w: 14.5, h: 24.51, k: 1.8 },
];

/** The phone back: the sketch sheet alone (588 x 592); A to D. */
export const LIFT_SKETCHES: readonly LiftLayer[] = [
  { key: "a", x: 3.4, y: 17.69, w: 43.54, h: 14.97, k: 1.5 },
  { key: "b", x: 61.22, y: 10.54, w: 24.15, h: 29.59, k: 1.6 },
  { key: "c", x: 4.08, y: 51.02, w: 45.58, h: 45.58, k: 1.5 },
  { key: "d", x: 60.37, y: 57.99, w: 30.95, h: 34.35, k: 1.55 },
];

/** The final mark's grow factor on the phone back. */
export const LIFT_MARK_K = 1.4;

interface Pen {
  viewBox: string;
  width: number;
  ring: string;
  tick: string;
}

/** The red pen around C, in the full sheet's pixels (the box cut-out C covers). */
const PEN_SHEET: Pen = {
  viewBox: "66 452 284 260",
  width: 2.8,
  ring: "M208.2 470.9C210.1 471.3 215.9 472.1 219.7 473.1C223.5 474.1 227.2 475.3 230.9 476.7C234.6 478.1 238.1 479.6 241.7 481.2C245.2 482.8 248.7 484.5 252.2 486.3C255.7 488.1 259.2 489.9 262.6 491.9C266 493.9 269.4 496 272.6 498.4C275.8 500.8 278.9 503.5 281.7 506.3C284.4 509.2 287 512.3 289.3 515.6C291.6 518.8 293.5 522.3 295.4 525.8C297.2 529.3 298.7 533 300.2 536.6C301.7 540.3 303 544 304.2 547.7C305.5 551.4 306.6 555.1 307.6 558.9C308.6 562.6 309.5 566.5 310.1 570.3C310.7 574.2 311.1 578.1 311.2 582C311.3 585.9 311.1 589.8 310.8 593.7C310.4 597.5 309.8 601.4 309 605.2C308.3 609 307.4 612.8 306.4 616.5C305.4 620.3 304.4 624 303.1 627.7C301.8 631.5 300.5 635.2 298.9 638.8C297.2 642.3 295.4 645.9 293.3 649.2C291.1 652.5 288.7 655.7 286 658.6C283.3 661.5 280.3 664.2 277.3 666.6C274.2 669.1 270.9 671.3 267.6 673.4C264.3 675.6 260.9 677.5 257.5 679.4C254.1 681.4 250.7 683.2 247.2 684.9C243.7 686.7 240.2 688.4 236.5 689.9C232.9 691.4 229.2 692.7 225.4 693.8C221.6 694.9 217.6 695.7 213.7 696.3C209.8 696.8 205.8 697.1 201.8 697.2C197.8 697.2 193.8 697.1 189.8 696.8C185.8 696.5 181.8 696.1 177.8 695.5C173.9 694.9 169.9 694.2 165.9 693.3C162 692.4 158.1 691.3 154.3 689.9C150.5 688.5 146.7 686.8 143.1 684.8C139.6 682.9 136.2 680.6 132.9 678.1C129.7 675.7 126.7 672.9 123.8 670.2C120.9 667.4 118.2 664.4 115.4 661.5C112.7 658.6 110.1 655.6 107.5 652.5C105 649.5 102.4 646.4 100 643.2C97.6 640 95.2 636.8 93.1 633.3C91 629.9 89 626.3 87.4 622.6C85.8 618.9 84.4 615 83.3 611.2C82.3 607.3 81.5 603.3 80.9 599.3C80.3 595.3 79.9 591.3 79.7 587.3C79.4 583.3 79.3 579.3 79.4 575.3C79.5 571.3 79.7 567.3 80.2 563.3C80.7 559.3 81.4 555.3 82.4 551.4C83.4 547.6 84.7 543.7 86.3 540.1C87.8 536.4 89.7 532.8 91.7 529.4C93.7 526 96 522.7 98.2 519.4C100.5 516.2 102.9 513 105.3 509.9C107.7 506.8 110.1 503.7 112.7 500.6C115.3 497.6 117.9 494.6 120.8 491.8C123.6 488.9 126.7 486.2 129.9 483.8C133.1 481.4 136.6 479.2 140.2 477.3C143.8 475.4 147.6 473.8 151.5 472.5C155.3 471.1 159.3 470.1 163.2 469.1C167.2 468.2 171.2 467.5 175.2 466.9C179.2 466.2 183.3 465.7 187.3 465.4C191.4 465.2 195.5 465 199.6 465.1C203.7 465.2 207.8 465.6 211.8 466.2C215.8 466.8 219.9 467.8 223.8 468.9C227.7 470 231.6 471.4 235.4 472.9C239.2 474.4 242.9 476.1 246.6 477.8C250.3 479.6 254 481.4 257.6 483.3C261.2 485.2 264.9 487.2 268.4 489.4C271.9 491.6 275.4 494 278.6 496.6C281.8 499.2 286.2 503.8 287.7 505.2",
  tick: "M275 481 L291 498 L320 456",
};

/** The same pen on the sketch sheet's pixels. */
const PEN_SKETCHES: Pen = {
  viewBox: "24 302 268 268",
  width: 2.6,
  ring: "M169.4 343.2C171.2 343.7 176.5 345.1 179.9 346.3C183.3 347.6 186.7 349.1 189.9 350.7C193.2 352.3 196.4 354 199.5 355.9C202.7 357.7 205.7 359.5 208.8 361.5C211.9 363.5 215 365.5 217.9 367.6C220.9 369.8 223.9 372.1 226.6 374.6C229.3 377.1 231.9 379.8 234.2 382.7C236.6 385.6 238.6 388.7 240.5 391.9C242.3 395.2 243.8 398.6 245.2 402C246.5 405.4 247.6 408.9 248.7 412.4C249.7 415.9 250.6 419.4 251.5 423C252.3 426.5 253 430 253.6 433.6C254.2 437.2 254.6 440.8 254.9 444.4C255.1 448 255.1 451.7 254.9 455.3C254.6 458.9 254.1 462.5 253.4 466C252.8 469.6 251.8 473 250.8 476.5C249.8 479.9 248.6 483.3 247.4 486.7C246.1 490.1 244.8 493.5 243.3 496.8C241.8 500.1 240.3 503.4 238.4 506.5C236.6 509.7 234.6 512.8 232.3 515.6C230.1 518.5 227.5 521.2 224.8 523.6C222.1 526.1 219.1 528.3 216 530.3C212.9 532.3 209.7 534 206.5 535.6C203.2 537.3 199.9 538.8 196.6 540.2C193.3 541.7 190 543.1 186.6 544.4C183.2 545.6 179.8 546.9 176.3 547.9C172.8 548.9 169.2 549.9 165.6 550.5C162 551.1 158.3 551.5 154.6 551.7C150.9 551.8 147.2 551.7 143.5 551.4C139.8 551.1 136.1 550.6 132.4 550C128.8 549.3 125.1 548.6 121.5 547.7C117.9 546.8 114.3 545.8 110.7 544.5C107.2 543.3 103.6 541.9 100.2 540.3C96.8 538.6 93.5 536.8 90.4 534.6C87.3 532.5 84.3 530 81.5 527.5C78.8 524.9 76.2 522.1 73.8 519.3C71.3 516.4 69.1 513.5 66.8 510.5C64.6 507.6 62.4 504.6 60.3 501.5C58.2 498.5 56.1 495.4 54.2 492.2C52.2 489 50.3 485.8 48.6 482.4C47 479.1 45.5 475.6 44.3 472C43.2 468.5 42.3 464.8 41.6 461.1C41 457.4 40.6 453.7 40.4 449.9C40.2 446.2 40.2 442.5 40.3 438.8C40.5 435 40.7 431.3 41.2 427.6C41.6 423.9 42.1 420.2 43 416.6C43.8 413 44.8 409.4 46 405.9C47.3 402.4 48.9 399 50.6 395.8C52.4 392.5 54.5 389.4 56.6 386.4C58.8 383.4 61.1 380.6 63.5 377.8C65.9 375 68.4 372.4 70.9 369.7C73.4 367 75.9 364.4 78.5 361.8C81.2 359.3 83.9 356.7 86.8 354.4C89.7 352 92.7 349.8 95.9 347.9C99.2 345.9 102.6 344.2 106.1 342.8C109.5 341.4 113.2 340.3 116.9 339.4C120.5 338.5 124.3 337.9 128.1 337.4C131.8 336.9 135.6 336.6 139.3 336.4C143.1 336.2 146.9 336.2 150.7 336.3C154.4 336.4 158.3 336.6 162 337.1C165.8 337.6 169.5 338.2 173.2 339.2C176.9 340.2 180.5 341.4 184.1 342.8C187.6 344.2 191 345.9 194.4 347.6C197.8 349.3 201.1 351.2 204.4 353.2C207.6 355.1 210.9 357.1 214 359.2C217.2 361.3 220.4 363.5 223.5 365.9C226.5 368.2 229.5 370.7 232.3 373.4C235 376.2 238.6 380.8 239.9 382.2",
  tick: "M221.6 351 L236.5 366.7 L263.4 327.8",
};

const src = (name: string, theme: "light" | "dark", nored = false) => `${LIFT_DIR}/rokct-${name}-${theme}${nored ? "-nored" : ""}.webp`;

function PenMarks({ pen }: { pen: Pen }) {
  return (
    <svg className="sr-pen" viewBox={pen.viewBox} preserveAspectRatio="none" aria-hidden="true" focusable="false" style={{ ["--sw" as string]: String(pen.width) }}>
      <path className="sr-pen-ring" pathLength={1} d={pen.ring} />
      <path className="sr-pen-tick" pathLength={1} d={pen.tick} />
    </svg>
  );
}

function Layer({ set, l, i }: { set: "sheet" | "sketches"; l: LiftLayer; i: number }) {
  const pos = {
    ["--x" as string]: `${l.x}%`,
    ["--y" as string]: `${l.y}%`,
    ["--w" as string]: `${l.w}%`,
    ["--h" as string]: `${l.h}%`,
    ["--i" as string]: String(i),
    ["--k" as string]: String(l.k),
  };
  return (
    <span className="sr-lg" style={pos}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a committed cut-out, laid over the sheet at its own pixel box */}
      <img className="th-l" src={src(`lift-${set}-${l.key}`, "light")} alt="" loading="lazy" decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element -- a committed cut-out, laid over the sheet at its own pixel box */}
      <img className="th-d" src={src(`lift-${set}-${l.key}`, "dark")} alt="" loading="lazy" decoding="async" />
      {l.key === "c" && <PenMarks pen={set === "sheet" ? PEN_SHEET : PEN_SKETCHES} />}
    </span>
  );
}

/** A sheet in both themes, each with and without its red ring (`nr`: shown while the drawings are up). */
function Sheet({ name, alt, width, height }: { name: string; alt: string; width: number; height: number }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- a committed render of the logo sheet */}
      <img className="th-l" src={src(name, "light")} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element -- a committed render of the logo sheet */}
      <img className="th-d" src={src(name, "dark")} alt="" width={width} height={height} loading="lazy" decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element -- the same sheet without its red ring */}
      <img className="th-l sr-nr" src={src(name, "light", true)} alt="" width={width} height={height} loading="lazy" decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element -- the same sheet without its red ring */}
      <img className="th-d sr-nr" src={src(name, "dark", true)} alt="" width={width} height={height} loading="lazy" decoding="async" />
    </>
  );
}

/**
 * The ROKCT logo back: the wide sheet with its lifting layers (`.sr-lb-w`,
 * shown on the desktop row) and the phone back (`.sr-lb-m`: the sketch
 * sheet with its layers, the final mark and why it won). CSS shows one.
 */
export function ShowcaseLiftBack({ m }: { m: StudioMarkSet }) {
  const letter = m.chosen.toUpperCase();
  const picked = m.options.find((o) => o.key === m.chosen);
  const notes = m.options.map((o) => `${o.key.toUpperCase()}, ${o.name}: ${o.note}`).join(" ");
  const mark = { ["--mk" as string]: `url("${m.final.src}")` };
  return (
    <div className="sr-lb">
      <div className="sr-lb-w">
        <div className="sr-lb-sheet">
          <Sheet name="logo-sheet" alt={STUDIO_MARK_COPY.liftSheetAlt(notes)} width={1200} height={824} />
        </div>
        <div className="sr-lifts" aria-hidden="true">
          <div className="sr-lsheet">
            {LIFT_SHEET.map((l, i) => (
              <Layer key={l.key} set="sheet" l={l} i={i} />
            ))}
          </div>
        </div>
      </div>
      <div className="sr-lb-m">
        <div className="sr-sk">
          <Sheet name="logo-sketches" alt={STUDIO_MARK_COPY.liftSketchesAlt(notes)} width={588} height={592} />
          {LIFT_SKETCHES.map((l, i) => (
            <Layer key={l.key} set="sketches" l={l} i={i} />
          ))}
        </div>
        <div className="sr-mk-fin">
          <span className="mk-av sr-mk-av sr-lg" style={{ ["--i" as string]: String(LIFT_SKETCHES.length), ["--k" as string]: String(LIFT_MARK_K) }}>
            <span className="mk-mark" role="img" aria-label={m.final.alt} style={mark} />
          </span>
          <span className="sr-mk-k">
            {letter} · {picked ? picked.name : STUDIO_MARK_COPY.final}
          </span>
          <p>{STUDIO_MARK_COPY.picked}</p>
        </div>
      </div>
    </div>
  );
}
