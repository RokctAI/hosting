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

// The order form's brand colours step (hosting_sdk 1.20.7; Ray, 2026-11-09).
// Rules in studio-shades.ts. A client types a colour in words or hex; the
// field shows five shades, lightest to darkest laid right-to-left; picking one
// collapses the row into a chip in that shade (tap it to pick again), and a
// new empty field asks for the next colour, up to five. Three are needed.
// The chosen hex values post as one `colour` field ("#aabbcc, #...").
// Every swatch and chip is a real button: Tab, Enter and Space work.
"use client";

import { useId, useState } from "react";

import { STUDIO_COLOURS_MAX, STUDIO_COLOURS_MIN, studioColourBase, studioShades } from "./studio-shades";

interface Slot {
  text: string;
  base: string | null;
  hex: string | null;
  open: boolean;
}

const empty = (): Slot => ({ text: "", base: null, hex: null, open: false });

export function StudioColourPicker({ error }: { error?: string }) {
  const id = useId();
  const [slots, setSlots] = useState<Slot[]>([empty()]);
  const chosen = slots.map((s) => s.hex).filter((h): h is string => !!h);

  function set(i: number, patch: Partial<Slot>) {
    setSlots((all) => {
      const next = all.map((s, j) => (j === i ? { ...s, ...patch } : s));
      // A colour picked in the last slot opens a new empty one, up to five.
      const last = next[next.length - 1];
      if (last.hex && next.length < STUDIO_COLOURS_MAX) next.push(empty());
      return next;
    });
  }

  function remove(i: number) {
    setSlots((all) => {
      const next = all.filter((_, j) => j !== i);
      const last = next[next.length - 1];
      if (!last || (last.hex && next.length < STUDIO_COLOURS_MAX)) next.push(empty());
      return next;
    });
  }

  const note = error || `${chosen.length} of at least ${STUDIO_COLOURS_MIN} picked · up to ${STUDIO_COLOURS_MAX}`;
  return (
    <div className="of-f of-wide sp" role="group" aria-labelledby={`${id}-l`} aria-describedby={`${id}-n`}>
      <span className="sp-label" id={`${id}-l`}>
        Your brand colours<em aria-hidden="true"> *</em>
      </span>
      <input type="hidden" name="colour" value={chosen.join(", ")} />
      {slots.map((s, i) => {
        const n = i + 1;
        if (s.hex && !s.open) {
          return (
            <div className="sp-row" key={i}>
              <button
                type="button"
                className="sp-chip"
                style={{ background: s.hex }}
                onClick={() => set(i, { open: true })}
                aria-label={`Colour ${n}: ${s.hex}. Change shade`}
              >
                <span>{s.hex}</span>
              </button>
              <button type="button" className="sp-x" onClick={() => remove(i)} aria-label={`Remove colour ${n}`}>
                ×
              </button>
            </div>
          );
        }
        const shades = s.base ? studioShades(s.base) : [];
        return (
          <div className="sp-row" key={i}>
            <div className="sp-field">
              <input
                id={`${id}-${i}`}
                type="text"
                value={s.text}
                maxLength={40}
                placeholder={i === 0 ? "e.g. blue, maroon, forest green or #1a73e8" : "Next colour"}
                aria-label={`Colour ${n}, in words or a hex code`}
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
                      className={h === s.hex ? "sp-sw on" : "sp-sw"}
                      style={{ background: h }}
                      aria-pressed={h === s.hex}
                      aria-label={`Shade ${k + 1} of 5${k === 0 ? ", lightest" : k === 4 ? ", darkest" : ""}: ${h}`}
                      onClick={() => set(i, { hex: h, open: false })}
                    />
                  ))}
                </div>
              ) : s.text ? (
                <small className="fine">We don&apos;t know that colour yet. Try a plain name or a hex code.</small>
              ) : null}
            </div>
          </div>
        );
      })}
      <small id={`${id}-n`} className={error ? "of-err" : "fine"} aria-live="polite">
        {note}
      </small>
    </div>
  );
}
