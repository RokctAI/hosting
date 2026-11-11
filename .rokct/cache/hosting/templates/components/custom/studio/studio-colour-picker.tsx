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

// The order form's brand colours step (hosting_sdk 1.20.7; Ray, 2026-11-09;
// 1.21.4: by role, Primary needed, Secondary/Accent optional, two extras).
// Rules in studio-shades.ts. A client types a colour in words or hex; the
// field shows five shades, lightest to darkest laid right-to-left; picking one
// collapses the row into a chip in that shade (tap it to pick again), and a
// new empty field asks for the next colour, up to five. Three are needed.
// The chosen hex values post as one `colour` field ("#aabbcc, #...").
// Every swatch and chip is a real button: Tab, Enter and Space work.
// 1.21.4 (Ray): tapping a picked colour's chip opens the shade panel
// (StudioShadePanel): nine tints to shades of that hue, a saturation and
// brightness square, a hue slider and a hex box, for any exact colour.
"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

import {
  STUDIO_COLOUR_ROLES,
  STUDIO_COLOURS_MAX,
  studioColourBase,
  studioColourSystem,
  studioFormatColourRoles,
  studioHexToHsv,
  studioHsvToHex,
  studioShades,
  studioTints,
} from "./studio-shades";
import type { StudioColourPick, StudioColourRoleName } from "./studio-shades";

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * 1.21.4: the shade panel for one picked colour, design-software style.
 * The square is saturation (left to right) by brightness (top to bottom);
 * drag or tap it, or focus it and use the arrow keys (Shift for big steps).
 * The hue slider is a native range input. The hex box takes any #rrggbb.
 */
export function StudioShadePanel({
  hex,
  label,
  onChange,
  onDone,
  onRetype,
}: {
  hex: string;
  label: string;
  onChange: (hex: string) => void;
  onDone: () => void;
  onRetype: () => void;
}) {
  const id = useId();
  const [hsv, setHsv] = useState<[number, number, number]>(() => studioHexToHsv(hex));
  const [text, setText] = useState(hex);
  const [tintsOf] = useState(hex);
  const sq = useRef<HTMLDivElement>(null);
  const [h, s, v] = hsv;

  // Keep the box and hsv in step when the colour changes from outside it.
  useEffect(() => {
    setText(hex);
    setHsv((cur) => (studioHsvToHex(...cur) === hex ? cur : studioHexToHsv(hex)));
  }, [hex]);

  function pick(next: [number, number, number]) {
    setHsv(next);
    onChange(studioHsvToHex(...next));
  }

  function fromPointer(e: PointerEvent<HTMLDivElement>) {
    const r = sq.current!.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    pick([h, x, 1 - y]);
  }

  function onSquareKey(e: KeyboardEvent<HTMLDivElement>) {
    const d = e.shiftKey ? 0.1 : 0.01;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    pick([h, Math.min(1, Math.max(0, s + m[0])), Math.min(1, Math.max(0, v + m[1]))]);
  }

  const tints = studioTints(tintsOf);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  return (
    <div className="sp-panel" role="group" aria-label={`${label}: pick a shade`}>
      <div className="sp-tints" role="group" aria-label="Tints and shades, lightest to darkest">
        {tints.map((t, k) => (
          <button
            type="button"
            key={t + k}
            className={t === hex ? "sp-tint on" : "sp-tint"}
            style={{ background: t }}
            aria-pressed={t === hex}
            aria-label={`Tint ${k + 1} of 9${k === 0 ? ", lightest" : k === 8 ? ", darkest" : ""}: ${t}`}
            onClick={() => pick(studioHexToHsv(t))}
          />
        ))}
      </div>
      <div
        ref={sq}
        className="sp-sv"
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness. Left and right for saturation, up and down for brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(s * 100)}
        aria-valuetext={`Saturation ${pct(s)}, brightness ${pct(v)}, ${studioHsvToHex(h, s, v)}`}
        style={{ background: `linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,hsl(${Math.round(h)} 100% 50%))` }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          e.currentTarget.focus();
          fromPointer(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e);
        }}
        onKeyDown={onSquareKey}
      >
        <i className="sp-dot" style={{ left: pct(s), top: pct(1 - v), background: hex }} aria-hidden="true" />
      </div>
      <input
        type="range"
        className="sp-hue"
        min={0}
        max={359}
        step={1}
        value={Math.round(h)}
        aria-label="Hue"
        aria-valuetext={`Hue ${Math.round(h)} degrees`}
        onChange={(e) => pick([Number(e.target.value), s, v])}
      />
      <div className="sp-hexrow">
        <span className="sp-now" style={{ background: hex }} aria-hidden="true" />
        <label htmlFor={`${id}-hex`} className="sp-hexl">Hex</label>
        <input
          id={`${id}-hex`}
          className="sp-hex num"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          value={text}
          aria-invalid={HEX.test(text.trim()) ? undefined : true}
          onChange={(e) => {
            setText(e.target.value);
            const t = e.target.value.trim();
            if (/^#?[0-9a-f]{6}$/i.test(t)) {
              const x = studioColourBase(t)!;
              setHsv(studioHexToHsv(x));
              onChange(x);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const x = HEX.test(text.trim()) ? studioColourBase(text) : null;
              if (x) {
                setHsv(studioHexToHsv(x));
                onChange(x);
              }
            }
          }}
        />
        <button type="button" className="sp-done" onClick={onDone}>
          Done
        </button>
      </div>
      <button type="button" className="sp-retype" onClick={onRetype}>
        Type a different colour
      </button>
    </div>
  );
}

/**
 * 1.20.8: the colour-system preview (intake question 5). 1.21.4: shown as
 * soon as the Primary is picked, with every chosen role together as a
 * swatch, and a small sample page drawn in them (a missing Secondary or
 * Accent falls back to a tint of, or the, Primary).
 */
export function StudioColourPreview({ colours }: { colours: StudioColourPick[] }) {
  const sys = studioColourSystem(colours);
  if (!sys) return null;
  const by = (r: string) => sys.find((x) => x.role === r);
  const main = by("Primary")!, bg = by("Background")!, text = by("Text")!;
  const second = by("Secondary") ?? { hex: bg.hex, ink: bg.ink };
  const accent = by("Accent") ?? main;
  return (
    <div className="cs" aria-label="Preview of your colour system">
      <p className="kick">Your colour system, a first look</p>
      <ul className="cs-sw">
        {sys.map((r) => (
          <li key={r.role} style={{ background: r.hex, color: r.ink }}>
            <b>{r.role}</b>
            <span className="num">{r.hex}</span>
          </li>
        ))}
      </ul>
      <div className="cs-page" style={{ background: bg.hex, color: text.hex }}>
        <div className="cs-bar" style={{ background: main.hex, color: main.ink }}>
          <b>Your business</b>
          <span>Home · About · Contact</span>
        </div>
        <div className="cs-body">
          <p className="cs-h" style={{ color: text.hex }}>A heading in your colours</p>
          <p className="cs-p">Body text sits on the background tint.</p>
          <span className="cs-btn" style={{ background: accent.hex, color: accent.ink }}>Call to action</span>
          <span className="cs-card" style={{ background: second.hex, color: second.ink, border: "1px solid rgba(0,0,0,.08)" }}>A card in your secondary colour</span>
        </div>
      </div>
      <small className="fine">A rough preview. Your designer refines it into the full colour system in phase 2.</small>
    </div>
  );
}

// 1.21.4 (Ray, "primary, secondary, etc"): one slot per role. Primary is
// needed; Secondary and Accent are optional and always shown; "+ Add another
// colour" adds Extra 1 and Extra 2.
interface Slot {
  role: StudioColourRoleName;
  text: string;
  base: string | null;
  hex: string | null;
  open: boolean;
}

const slot = (role: StudioColourRoleName): Slot => ({ role, text: "", base: null, hex: null, open: false });
const HINT: Partial<Record<StudioColourRoleName, string>> = {
  Primary: "Your main brand colour, e.g. blue, maroon or #1a73e8",
  Secondary: "Optional, a supporting colour",
  Accent: "Optional, for buttons and highlights",
};

export function StudioColourPicker({ error }: { error?: string }) {
  const id = useId();
  const [slots, setSlots] = useState<Slot[]>(() => STUDIO_COLOUR_ROLES.slice(0, 3).map(slot));
  const chosen: StudioColourPick[] = slots.filter((s) => s.hex).map((s) => ({ role: s.role, hex: s.hex! }));

  function set(i: number, patch: Partial<Slot>) {
    setSlots((all) => all.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }

  function remove(i: number) {
    // Primary, Secondary and Accent clear; an extra goes, and later extras renumber.
    setSlots((all) => {
      if (i < 3) return all.map((s, j) => (j === i ? slot(s.role) : s));
      return all.filter((_, j) => j !== i).map((s, j) => (j < 3 ? s : { ...s, role: STUDIO_COLOUR_ROLES[j] }));
    });
  }

  const note = error || (chosen.some((c) => c.role === "Primary") ? `${chosen.length} of up to ${STUDIO_COLOURS_MAX} picked` : "Pick your primary colour to start");
  return (
    <div className="of-f of-wide sp" role="group" aria-labelledby={`${id}-l`} aria-describedby={`${id}-n`}>
      <span className="sp-label" id={`${id}-l`}>
        Your brand colours<em aria-hidden="true"> *</em>
      </span>
      <input type="hidden" name="colour" value={studioFormatColourRoles(chosen)} />
      {slots.map((s, i) => {
        const roleId = `${id}-r${i}`;
        const head = (
          <span className="sp-role" id={roleId}>
            {s.role}
            {s.role === "Primary" ? <em aria-hidden="true"> *</em> : <small> optional</small>}
          </span>
        );
        if (s.hex) {
          return (
            <div className="sp-pick" key={s.role}>
              {head}
              <div className="sp-row">
                <button
                  type="button"
                  className="sp-chip"
                  style={{ background: s.hex }}
                  onClick={() => set(i, { open: !s.open })}
                  aria-expanded={s.open}
                  aria-label={`${s.role}: ${s.hex}. ${s.open ? "Close shades" : "More shades"}`}
                >
                  <span>{s.hex}</span>
                  <em className="sp-more" aria-hidden="true">{s.open ? "Close" : "More shades"}</em>
                </button>
                <button type="button" className="sp-x" onClick={() => remove(i)} aria-label={`Remove ${s.role} colour`}>
                  ×
                </button>
              </div>
              {s.open ? (
                <StudioShadePanel
                  hex={s.hex}
                  label={s.role}
                  onChange={(hex) => set(i, { hex })}
                  onDone={() => set(i, { open: false })}
                  onRetype={() => set(i, { hex: null, open: false })}
                />
              ) : null}
            </div>
          );
        }
        const shades = s.base ? studioShades(s.base) : [];
        return (
          <div className="sp-pick" key={s.role}>
            {head}
            <div className="sp-row">
              <div className="sp-field">
                <input
                  id={`${id}-${i}`}
                  type="text"
                  value={s.text}
                  maxLength={40}
                  placeholder={HINT[s.role] ?? "Optional, another colour"}
                  aria-labelledby={roleId}
                  aria-describedby={`${id}-h`}
                  aria-invalid={s.text && !s.base ? true : undefined}
                  onChange={(e) => set(i, { text: e.target.value, base: studioColourBase(e.target.value) })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.preventDefault();
                  }}
                />
                {shades.length ? (
                  <div className="sp-shades" role="group" aria-label={`Shades of ${s.text.trim()}, lightest to darkest`}>
                    {shades.map((h, k) => (
                      <button
                        type="button"
                        key={h + k}
                        className="sp-sw"
                        style={{ background: h }}
                        aria-label={`Shade ${k + 1} of 5${k === 0 ? ", lightest" : k === 4 ? ", darkest" : ""}: ${h}`}
                        onClick={() => set(i, { hex: h, open: false })}
                      />
                    ))}
                  </div>
                ) : s.text ? (
                  <small className="fine">We don&apos;t know that colour yet. Try a plain name or a hex code.</small>
                ) : null}
              </div>
              {i >= 3 ? (
                <button type="button" className="sp-x" onClick={() => remove(i)} aria-label={`Remove ${s.role}`}>
                  ×
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
      {slots.length < STUDIO_COLOURS_MAX ? (
        <button type="button" className="sp-add" onClick={() => setSlots((all) => [...all, slot(STUDIO_COLOUR_ROLES[all.length])])}>
          + Add another colour
        </button>
      ) : null}
      <small id={`${id}-h`} className="fine">Type a colour, pick a shade, then tap it for more shades or any exact colour.</small>
      <small id={`${id}-n`} className={error ? "of-err" : "fine"} aria-live="polite">
        {note}
      </small>
      <StudioColourPreview colours={chosen} />
    </div>
  );
}
