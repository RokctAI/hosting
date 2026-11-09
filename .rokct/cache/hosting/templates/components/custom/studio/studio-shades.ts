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

// The brand colour shade picker (hosting_sdk 1.20.7; Ray, 2026-11-09). No
// shade picker existed in the studio before this; this is the one place its
// rules live (the order form's StudioColourPicker draws it).
//
// A client types a colour in plain words ("blue", "maroon", "forest green")
// or as a hex code. It maps to a base colour through the brand names below,
// then every CSS named colour; the five shades are that hue and saturation
// at fixed HSL lightness steps, lightest to darkest. The order needs 3 to 5
// colours (a colour system), sent as hex. Pure: no DOM.

export const STUDIO_COLOURS_MIN = 3;
export const STUDIO_COLOURS_MAX = 5;
/** HSL lightness of the five shades, lightest first. */
export const STUDIO_SHADE_LIGHTNESS = [0.85, 0.7, 0.55, 0.4, 0.25] as const;

// Plain words people use that CSS doesn't name (or names differently).
const BRAND_NAMES: Record<string, string> = {
  burgundy: "#800020", wine: "#722f37", oxblood: "#4a0000", mustard: "#e1ad01", ochre: "#cc7722",
  rust: "#b7410e", terracotta: "#e2725b", mint: "#98ff98", sage: "#9caf88", olivegreen: "#556b2f",
  emerald: "#50c878", jade: "#00a86b", forest: "#228b22", bottlegreen: "#006a4e", teal: "#008080",
  petrol: "#005f6a", babyblue: "#89cff0", skyblue: "#87ceeb", royalblue: "#4169e1", cobalt: "#0047ab",
  denim: "#1560bd", charcoal: "#36454f", slate: "#708090", cream: "#fffdd0", sand: "#c2b280",
  taupe: "#483c32", mocha: "#967969", caramel: "#c68e17", copper: "#b87333", bronze: "#cd7f32",
  rosegold: "#b76e79", blush: "#de5d83", peach: "#ffcba4", coral: "#ff7f50", lilac: "#c8a2c8",
  mauve: "#e0b0ff", lavender: "#b57edc", plum: "#8e4585", aubergine: "#3d0734", magenta: "#ff00ff",
  fuchsia: "#ff00ff", lime: "#32cd32", neon: "#39ff14", grey: "#808080", gray: "#808080",
};

// Every CSS named colour (CSS Color Module Level 4).
const CSS_NAMES: Record<string, string> = {
  aliceblue: "#f0f8ff", antiquewhite: "#faebd7", aqua: "#00ffff", aquamarine: "#7fffd4", azure: "#f0ffff",
  beige: "#f5f5dc", bisque: "#ffe4c4", black: "#000000", blanchedalmond: "#ffebcd", blue: "#0000ff",
  blueviolet: "#8a2be2", brown: "#a52a2a", burlywood: "#deb887", cadetblue: "#5f9ea0", chartreuse: "#7fff00",
  chocolate: "#d2691e", coral: "#ff7f50", cornflowerblue: "#6495ed", cornsilk: "#fff8dc", crimson: "#dc143c",
  cyan: "#00ffff", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkgray: "#a9a9a9",
  darkgreen: "#006400", darkgrey: "#a9a9a9", darkkhaki: "#bdb76b", darkmagenta: "#8b008b", darkolivegreen: "#556b2f",
  darkorange: "#ff8c00", darkorchid: "#9932cc", darkred: "#8b0000", darksalmon: "#e9967a", darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", darkturquoise: "#00ced1", darkviolet: "#9400d3",
  deeppink: "#ff1493", deepskyblue: "#00bfff", dimgray: "#696969", dimgrey: "#696969", dodgerblue: "#1e90ff",
  firebrick: "#b22222", floralwhite: "#fffaf0", forestgreen: "#228b22", fuchsia: "#ff00ff", gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff", gold: "#ffd700", goldenrod: "#daa520", gray: "#808080", green: "#008000",
  greenyellow: "#adff2f", grey: "#808080", honeydew: "#f0fff0", hotpink: "#ff69b4", indianred: "#cd5c5c",
  indigo: "#4b0082", ivory: "#fffff0", khaki: "#f0e68c", lavender: "#e6e6fa", lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00", lemonchiffon: "#fffacd", lightblue: "#add8e6", lightcoral: "#f08080", lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2", lightgray: "#d3d3d3", lightgreen: "#90ee90", lightgrey: "#d3d3d3", lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", lightskyblue: "#87cefa", lightslategray: "#778899", lightslategrey: "#778899",
  lightsteelblue: "#b0c4de", lightyellow: "#ffffe0", lime: "#00ff00", limegreen: "#32cd32", linen: "#faf0e6",
  magenta: "#ff00ff", maroon: "#800000", mediumaquamarine: "#66cdaa", mediumblue: "#0000cd", mediumorchid: "#ba55d3",
  mediumpurple: "#9370db", mediumseagreen: "#3cb371", mediumslateblue: "#7b68ee", mediumspringgreen: "#00fa9a", mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585", midnightblue: "#191970", mintcream: "#f5fffa", mistyrose: "#ffe4e1", moccasin: "#ffe4b5",
  navajowhite: "#ffdead", navy: "#000080", oldlace: "#fdf5e6", olive: "#808000", olivedrab: "#6b8e23",
  orange: "#ffa500", orangered: "#ff4500", orchid: "#da70d6", palegoldenrod: "#eee8aa", palegreen: "#98fb98",
  paleturquoise: "#afeeee", palevioletred: "#db7093", papayawhip: "#ffefd5", peachpuff: "#ffdab9", peru: "#cd853f",
  pink: "#ffc0cb", plum: "#dda0dd", powderblue: "#b0e0e6", purple: "#800080", rebeccapurple: "#663399",
  red: "#ff0000", rosybrown: "#bc8f8f", royalblue: "#4169e1", saddlebrown: "#8b4513", salmon: "#fa8072",
  sandybrown: "#f4a460", seagreen: "#2e8b57", seashell: "#fff5ee", sienna: "#a0522d", silver: "#c0c0c0",
  skyblue: "#87ceeb", slateblue: "#6a5acd", slategray: "#708090", slategrey: "#708090", snow: "#fffafa",
  springgreen: "#00ff7f", steelblue: "#4682b4", tan: "#d2b48c", teal: "#008080", thistle: "#d8bfd8",
  tomato: "#ff6347", turquoise: "#40e0d0", violet: "#ee82ee", wheat: "#f5deb3", white: "#ffffff",
  whitesmoke: "#f5f5f5", yellow: "#ffff00", yellowgreen: "#9acd32",
};

/** A typed colour (words or hex) as a #rrggbb base, or null when unknown. */
export function studioColourBase(input: string): string | null {
  const raw = (input || "").trim().toLowerCase();
  if (!raw) return null;
  const hex = raw.replace(/^#/, "");
  if (/^[0-9a-f]{6}$/.test(hex)) return `#${hex}`;
  if (/^[0-9a-f]{3}$/.test(hex)) return `#${hex.split("").map((c) => c + c).join("")}`;
  const key = raw.replace(/[^a-z]/g, "");
  return BRAND_NAMES[key] ?? CSS_NAMES[key] ?? null;
}

function toHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Five shades of a #rrggbb base, lightest to darkest (HSL lightness steps). */
export function studioShades(base: string): string[] {
  const [h, s] = toHsl(base);
  return STUDIO_SHADE_LIGHTNESS.map((l) => fromHsl(h, s, l));
}

/** The chosen colours from the form's value ("#aabbcc, #..."): valid hex only, at most five. */
export function studioParseColours(value: string): string[] {
  return (value || "")
    .split(/[\s,]+/)
    .map((v) => v.trim().toLowerCase())
    .filter((v) => /^#[0-9a-f]{6}$/.test(v))
    .slice(0, STUDIO_COLOURS_MAX);
}

export const STUDIO_COLOURS_ERROR = `Pick at least ${STUDIO_COLOURS_MIN} brand colours (up to ${STUDIO_COLOURS_MAX}) so we can build your colour system.`;
