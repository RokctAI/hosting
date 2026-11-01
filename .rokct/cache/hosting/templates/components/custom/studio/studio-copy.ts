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

// Every word and every price the ROKCT studio home shows, in one place.
// Prices are set in US dollars and shown in rand at a FIXED rate (no live
// rate), so the figure a visitor sees is the figure they pay.

export const STUDIO_WHATSAPP_DISPLAY = "+27 15 000 6069";
const WA = "https://wa.me/27150006069?text=";
export const studioWhatsApp = (text = "Hi ROKCT") => WA + encodeURIComponent(text);
export const STUDIO_WHATSAPP_URL = studioWhatsApp();

// ---- Currency -----------------------------------------------------------
export const STUDIO_ZAR_PER_USD = 18.5;
export type StudioCurrency = "ZAR" | "USD";
export type StudioPriceFormat = "main" | "from" | "alt" | "about";

// Thousands are grouped with a narrow no-break space (R12 950), the South
// African style, so a figure never breaks across lines.
function zar(usd: number): string {
  return groupZar(Math.round(usd * STUDIO_ZAR_PER_USD));
}
function dollars(usd: number): string {
  return "$" + usd.toLocaleString("en-US");
}

/** `main` is the figure in the chosen currency, `alt` the other one beside it. */
export function studioPrice(usd: number, fmt: StudioPriceFormat, cur: StudioCurrency): string {
  const main = cur === "ZAR" ? zar(usd) : dollars(usd);
  const alt = cur === "ZAR" ? dollars(usd) : zar(usd);
  if (fmt === "main") return main;
  if (fmt === "from") return "from " + main;
  if (fmt === "about") return "about " + alt;
  return alt;
}

// The website and brand bundle is Ray's advert deal, set in RAND (Ray,
// 30 Oct, website-service/offer-and-intake.md): R8,500 is the normal price,
// shown struck through, and R2,500 is the offer, with free lifetime hosting
// for the first 1,000. Outside South Africa the dollar equivalent shows
// ("dollar is fine for outsiders"): each figure converted once at the same
// fixed rate and rounded to whole dollars, the saving taken as normal minus
// offer in the shown currency so the three numbers always add up.
export const STUDIO_DEAL_ZAR = { normal: 8500, offer: 2500 } as const;
export type StudioDealKey = "normal" | "offer" | "save";

function groupZar(n: number): string {
  return "R" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F");
}

export function studioDeal(key: StudioDealKey, cur: StudioCurrency): string {
  if (cur === "ZAR") {
    const n = key === "normal" ? STUDIO_DEAL_ZAR.normal : key === "offer" ? STUDIO_DEAL_ZAR.offer : STUDIO_DEAL_ZAR.normal - STUDIO_DEAL_ZAR.offer;
    return groupZar(n);
  }
  const normal = Math.round(STUDIO_DEAL_ZAR.normal / STUDIO_ZAR_PER_USD);
  const offer = Math.round(STUDIO_DEAL_ZAR.offer / STUDIO_ZAR_PER_USD);
  const n = key === "normal" ? normal : key === "offer" ? offer : normal - offer;
  return dollars(n);
}

export const STUDIO_CURRENCY_NOTE: Record<StudioCurrency, string> = {
  ZAR: "Showing rand. The dollar figure is beside each price.",
  USD: "Showing US dollars. The rand figure is beside each price.",
};

// ---- Page copy ----------------------------------------------------------
export const STUDIO_NAV = [
  { href: "#services", label: "Services" },
  { href: "#work", label: "Our work" },
  { href: "#prices", label: "Prices" },
  { href: "#process", label: "How it works" },
  { href: "#contact", label: "Contact" },
] as const;

export const STUDIO_HERO = {
  kicker: ["Design and hosting studio", "For small businesses", "South Africa"],
  title: ["Your brand,", "taken seriously."],
  lede: "Websites, logos, business plans, pitch decks, print and social posts for small businesses. One price agreed before we start, a render for you to approve after every phase, and our team a WhatsApp message away.",
  primary: "Message us on WhatsApp",
  secondary: "See the prices",
  hours: "our team replies in office hours, SAST",
  facts: [
    { b: "One price, before we start", t: "Paid in full up front, fixed for the job." },
    { b: "Five phases, five renders", t: "Nothing moves on until you approve." },
    { b: "A status page for your order", t: "Each phase, its due date, any blocker." },
    { b: "Free hosting for life", t: "For the first 1,000 small business owners." },
  ],
  note: {
    kicker: "Built by our team",
    text: "Two of the sites we made, as they render today. Each has its own identity. Nothing starts from a template.",
  },
};

export const STUDIO_IMAGES = {
  polarisDesk: "/studio/work/polaris-desktop.webp",
  polarisPhone: "/studio/work/polaris-phone.webp",
  supaDesk: "/studio/work/supacharge-desktop.webp",
  supaPhone: "/studio/work/supacharge-phone.webp",
} as const;

export type StudioServicePrice =
  | { kind: "deal"; unit: string }
  | { kind: "fixed"; usd: number; about?: boolean; unit: string }
  | { kind: "from"; usd: number; unit: string }
  | { kind: "quoted"; unit: string };

export interface StudioService {
  name: string;
  flag?: string;
  body: string;
  includes?: string[];
  tiers?: { t: string; usd: number; d: string }[];
  ask: { label: string; text: string };
  price: StudioServicePrice;
}

export const STUDIO_SERVICES_HEAD = {
  kicker: "What we make",
  title: "Six things a small business needs. Done for you.",
  aside:
    "You answer a short form. Our team does the rest, and you approve the result at each step. Prices are shown in rand for South Africa, with the dollar figure beside.",
  foot: "Free lifetime hosting is for the first 1,000 small business owners, for the life of the site, under fair use. Your domain name is yours: you register it and pay its yearly renewal, and we never hold it for you.",
};

export const STUDIO_SERVICES: StudioService[] = [
  {
    name: "Website and brand",
    flag: "Free lifetime hosting · first 1,000",
    body: "A finished business website and the logo and brand to go with it. Four pages, every word written for you from your answers, a WhatsApp button on every page, laid out for phones, tablets and computers.",
    includes: [
      "Logo, colours and type",
      "Home, about, services, contact",
      "Copy written from your answers",
      "Hosting free for life, for the first 1,000",
    ],
    ask: { label: "Ask about a website", text: "Hi ROKCT, I'm asking about a website and brand" },
    price: { kind: "deal", unit: "once-off" },
  },
  {
    name: "Business plans",
    body: "A plan a bank, funder or investor can read, written by our team from a ten-question intake. Where an answer is missing we use a figure typical for your kind of business and label it clearly in the plan.",
    tiers: [
      { t: "Starter", usd: 100, d: "One-page plan and a 12-month cash view." },
      { t: "Standard", usd: 250, d: "Full plan, financial tables, funding-ready layout." },
      { t: "Premium", usd: 500, d: "Full plan, a pitch deck and one round of revisions." },
    ],
    ask: { label: "Ask about a plan", text: "Hi ROKCT, I'm asking about a business plan" },
    price: { kind: "from", usd: 100, unit: "three tiers" },
  },
  {
    name: "Business starter kit",
    body: "Everything a new business needs on day one, built from the same colour and logo answers as the website bundle.",
    includes: ["Logo and letterhead", "Quote template", "Invoice template", "Priced per kit on WhatsApp"],
    ask: { label: "Ask about the kit", text: "Hi ROKCT, I'm asking about the starter kit" },
    price: { kind: "quoted", unit: "per kit" },
  },
  {
    name: "Pitch decks",
    body: "The slides that get you the meeting and carry you through it, written and designed in your brand from the same intake as the business plan. Included in the Premium plan.",
    includes: [
      "Story, slides and speaker notes",
      "Your brand throughout",
      "Delivered as slides and PDF",
      "Priced per deck on WhatsApp",
    ],
    ask: { label: "Ask about a deck", text: "Hi ROKCT, I'm asking about a pitch deck" },
    price: { kind: "quoted", unit: "per deck" },
  },
  {
    name: "Design and print",
    body: "Flyers, posters, banners, menus, labels and business cards: designed, proofed by you, and made ready for print.",
    includes: [
      "Print-ready artwork",
      "A proof before anything prints",
      "Sizes to the printer's spec",
      "Priced per job on WhatsApp",
    ],
    ask: { label: "Ask about print", text: "Hi ROKCT, I'm asking about design and print" },
    price: { kind: "quoted", unit: "per job" },
  },
  {
    name: "Social post packs",
    body: "A month of posts in your brand, written and designed, ready to put up, with a calendar of what goes out when.",
    includes: [
      "Posts and captions written for you",
      "Square, story and landscape sizes",
      "A posting calendar",
      "Priced per pack on WhatsApp",
    ],
    ask: { label: "Ask about a pack", text: "Hi ROKCT, I'm asking about a social post pack" },
    price: { kind: "quoted", unit: "per pack" },
  },
];

// ---- The portfolio card's back: the logo process (1.8.0) ----------------
// Ray: the portfolio card flips to show how the logo was made, in four
// stages - the versions considered, the one chosen, the hand-drawn sketch,
// the final logo in use - "to show the process, not just the result".
// STRICT: real material only. Every picture here is a file from the
// client's own repo (or the studio's record of it), copied as it is; a
// stage with no real material is left out, never filled with a stand-in,
// and a case with no stage at all does not flip.
//
//   polaris     versions: the four-point north star the first landing drew
//               (corporate polaris_sdk 1.7.0, landing/polaris-star.tsx,
//               gold #f2c94c; removed in 1.7.1 at Ray's word, "polaris no
//               star please") and the ember P on a horizon line (the polaris
//               app, assets/svgs/brand_logo_rounded.svg). Chosen: that P.
//               In use: the app's opening screen (assets/images/splash.png).
//               No sketch is in any repo.
//   supacharge  chosen: the wordmark (supacharge marketing/brand/
//               supacharge-wordmark.png) and the S mark (the app's
//               notification icon). In use: the store feature graphic
//               (marketing/tour/store/feature-graphic.png). No other
//               versions and no sketch are in any repo.

export type StudioLogoStageKind = "versions" | "chosen" | "sketch" | "use";

export interface StudioLogoPicture {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

export interface StudioLogoStage {
  kind: StudioLogoStageKind;
  pictures: StudioLogoPicture[];
}

/** The four stages in the order the back reads them; a case lists only the ones it has. */
export const STUDIO_LOGO_STAGES: { kind: StudioLogoStageKind; label: string }[] = [
  { kind: "versions", label: "The versions we weighed" },
  { kind: "chosen", label: "The one chosen" },
  { kind: "sketch", label: "The sketch" },
  { kind: "use", label: "In use" },
];

export const STUDIO_LOGO_COPY = {
  kicker: "The logo, start to finish",
  turn: "See the logo process",
  back: "Back to the site",
  flip: (name: string) => `${name}: turn the card to see how the logo was made`,
  flipBack: (name: string) => `${name}: turn the card back to the site`,
};

export interface StudioCase {
  /** The site whose live pictures the proofs show (studio-shots.ts); `src` is the committed fallback. */
  site: "polaris" | "supacharge";
  /** The portfolio tab (1.8.0): its name and the line under it. */
  tab: string;
  sector: string;
  desk: { src: string; alt: string; url: string; caption: string };
  phone: { src: string; alt: string };
  kicker: string;
  title: string;
  body: string;
  made: string;
  look: string;
  /** The back of the card: the logo stages that have real material. Empty, the card does not flip. */
  logo: StudioLogoStage[];
}

/** The portfolio row's words (1.8.0): the tablist, its controls and the swipe hint. */
export const STUDIO_WORK_TABS = {
  label: "Our work",
  previous: "Previous site",
  next: "Next site",
  pause: "Pause the slideshow",
  play: "Play the slideshow",
  hint: "Swipe for the next site",
};

export const STUDIO_WORK_HEAD = {
  kicker: "Our work",
  title: "Built by our team. Live on the web.",
  aside:
    "Shown as they render on a desktop and a phone. Every site gets its own colour, type and layout, chosen for that business.",
};

export const STUDIO_CASES: StudioCase[] = [
  {
    site: "polaris",
    tab: "Polaris",
    sector: "Lender",
    desk: {
      src: STUDIO_IMAGES.polarisDesk,
      alt: "Polaris home page on a desktop: 'The full cost, shown before you apply' beside step one of the loan application",
      url: "polaris · home",
      caption: "Polaris · Home",
    },
    phone: { src: STUDIO_IMAGES.polarisPhone, alt: "Polaris home page on a phone" },
    kicker: "Polaris · Lender",
    title: "A loan with the full cost on the page before anyone applies.",
    body: "A short-term lender's public site. The first screen puts the full cost in the headline, with step one of the application beside it; the calculator below itemises the amount, the term, the interest, the fees and the total to repay, each under the ceiling the National Credit Act sets. Light and dark themes and a single green accent, every figure in tabular numerals.",
    made: "Public website, loan calculator, phone and desktop layouts, light and dark themes",
    look: "Light and dark themes, one accent, a display serif for the headlines",
    logo: [
      {
        kind: "versions",
        pictures: [
          { src: "/studio/logo/polaris-star.svg", alt: "A gold four-point star", caption: "A north star, in gold. On the first landing; dropped at the client's word.", width: 96, height: 96 },
          { src: "/studio/logo/polaris-p.svg", alt: "An ember P standing on a pale horizon line, on a pine-green tile", caption: "A P on a horizon line, ember on pine.", width: 108, height: 108 },
        ],
      },
      {
        kind: "chosen",
        pictures: [
          { src: "/studio/logo/polaris-p.svg", alt: "The Polaris mark: an ember P on a horizon line, on a pine-green tile", caption: "The P on the horizon: the app icon and the mark.", width: 108, height: 108 },
        ],
      },
      {
        kind: "use",
        pictures: [
          { src: "/studio/logo/polaris-splash.webp", alt: "The Polaris app's opening screen: the P mark above the name and 'Loans with clear terms'", caption: "The app's opening screen.", width: 480, height: 1037 },
        ],
      },
    ],
  },
  {
    site: "supacharge",
    tab: "Supacharge",
    sector: "Learning app",
    desk: {
      src: STUDIO_IMAGES.supaDesk,
      alt: "Supacharge home page on a desktop: 'Pass with confidence', with store download buttons",
      url: "supacharge.school",
      caption: "Supacharge · Home",
    },
    phone: { src: STUDIO_IMAGES.supaPhone, alt: "Supacharge home page on a phone" },
    kicker: "Supacharge · Learning app",
    title: "A site that sends learners to the app store in one screen.",
    body: "The public site for a South African learning app. The home page carries the brand's black and orange, the accelerator milestone, the download buttons for every store, and an explanation of how a lesson runs in two teaching styles.",
    made: "Public website, phone and desktop layouts, light and dark themes",
    look: "Black ground, the brand's orange, a heavy italic display face",
    logo: [
      {
        kind: "chosen",
        pictures: [
          { src: "/studio/logo/supacharge-wordmark.webp", alt: "The Supacharge wordmark in heavy white italic", caption: "The wordmark.", width: 660, height: 124 },
          { src: "/studio/logo/supacharge-s.webp", alt: "The Supacharge S mark in white", caption: "The S, for the app's small spaces.", width: 108, height: 108 },
        ],
      },
      {
        kind: "use",
        pictures: [
          { src: "/studio/logo/supacharge-feature.webp", alt: "The Supacharge store graphic: the wordmark over 'Your tutor is one tap away', beside two phones on an orange disc", caption: "The app store feature graphic.", width: 1024, height: 500 },
        ],
      },
    ],
  },
];

// ---- Case colour schemes (1.8.0) ----------------------------------------
// Ray: each tab of "How we design" (and, since the same release, each
// portfolio tab) shows that client's own colour scheme. A case's panel
// re-themes the studio tokens it draws with (studio.css `.cs`) from the
// scheme below, in light and dark; the rest of the page keeps the studio's
// own look. The swatches are the brand's colours exactly as its own code
// sets them; the tokens are those colours, nudged only where a text pair
// would miss WCAG AA (4.5:1). tests/test_studio_schemes.py checks every
// text pair in both modes.
//
//   polaris     polaris_sdk 1.8.0 landing/polaris-theme.css (--px-*): lime
//               #b8e05a on forest #07130f, brass #e3ae45 for "pending".
//   supacharge  lms_sdk 1.39.0 landing/lms-theme.css (--sc-*): the app's
//               orange #ff6600 on #101010 (dark) / #ececef (light), teal
//               --sc-lit #17a398. White on #ff6600 is 2.9:1, so labels on
//               the orange are ink, and orange text on light is #ad4300.
//   southriver  southriver-web data/theme.json `primary` #e4333b (the
//               label red), the label's deeper red and the river blue as
//               the picked (C) and River poster (B) renders print them.
//               White on #e4333b is 4.3:1, so fills use the deeper #c40019.
//   studio      this page's own tokens (studio.css): oxblood #8C1A2D.

export interface StudioSchemeTokens {
  bg: string;
  card: string;
  ink: string;
  ink2: string;
  ink3: string;
  rule: string;
  rule2: string;
  acc: string;
  accDeep: string;
  accInk: string;
  accText: string;
  frame: string;
}

export interface StudioScheme {
  /** Where the colours come from, for the record. */
  source: string;
  /** The brand's own colours, shown as chips in the brief. */
  swatches: { name: string; hex: string }[];
  light: StudioSchemeTokens;
  dark: StudioSchemeTokens;
}

export type StudioSchemeId = "polaris" | "southriver" | "supacharge" | "studio";

export const STUDIO_SCHEMES: Record<StudioSchemeId, StudioScheme> = {
  polaris: {
    source: "polaris_sdk 1.8.0, landing/polaris-theme.css",
    swatches: [
      { name: "Lime", hex: "#b8e05a" },
      { name: "Forest", hex: "#07130f" },
      { name: "Brass", hex: "#e3ae45" },
      { name: "Mist", hex: "#f7f9f5" },
    ],
    light: { bg: "#f7f9f5", card: "#ffffff", ink: "#15201b", ink2: "#5b6660", ink3: "#6b7570", rule: "#d6ddd6", rule2: "#b9c4bb", acc: "#b8e05a", accDeep: "#a9d444", accInk: "#13200a", accText: "#4e7a12", frame: "#15201b" },
    dark: { bg: "#07130f", card: "#0b1f1a", ink: "#f3f8f4", ink2: "#9db8ae", ink3: "#7f9e92", rule: "#1a3f35", rule2: "#255548", acc: "#b8e05a", accDeep: "#c8ea78", accInk: "#13200a", accText: "#b8e05a", frame: "#020806" },
  },
  southriver: {
    source: "southriver-web data/theme.json (primary), the label as the picked render prints it",
    swatches: [
      { name: "Label red", hex: "#e4333b" },
      { name: "Deep red", hex: "#c40019" },
      { name: "River blue", hex: "#064171" },
      { name: "Bottle white", hex: "#fbf7f4" },
    ],
    light: { bg: "#fbf7f4", card: "#ffffff", ink: "#1c1214", ink2: "#5e5153", ink3: "#74676a", rule: "#eadcd8", rule2: "#d6c2bd", acc: "#c40019", accDeep: "#a30015", accInk: "#ffffff", accText: "#b5001a", frame: "#064171" },
    dark: { bg: "#120b0b", card: "#1d1212", ink: "#f6efed", ink2: "#c4b5b3", ink3: "#9c8b89", rule: "#3a2524", rule2: "#4d3230", acc: "#c40019", accDeep: "#d0021f", accInk: "#ffffff", accText: "#ff6b72", frame: "#04223b" },
  },
  supacharge: {
    source: "lms_sdk 1.39.0, landing/lms-theme.css",
    swatches: [
      { name: "Supacharge orange", hex: "#ff6600" },
      { name: "Night", hex: "#101010" },
      { name: "Teal", hex: "#17a398" },
      { name: "Cloud", hex: "#ececef" },
    ],
    light: { bg: "#ececef", card: "#f9f9fb", ink: "#1b1b20", ink2: "#5b5b62", ink3: "#66666e", rule: "#d9d9de", rule2: "#c4c4cb", acc: "#ff6600", accDeep: "#e65c00", accInk: "#1b1b20", accText: "#ad4300", frame: "#1b1b20" },
    dark: { bg: "#101010", card: "#1c1c1c", ink: "#ffffff", ink2: "#a3a3a3", ink3: "#8c8c8c", rule: "#2e2e2e", rule2: "#3d3d3d", acc: "#ff6600", accDeep: "#ff7a1f", accInk: "#101010", accText: "#ff6600", frame: "#000000" },
  },
  studio: {
    source: "this page's own tokens, studio.css",
    swatches: [
      { name: "Oxblood", hex: "#8c1a2d" },
      { name: "Ink", hex: "#17161b" },
      { name: "Paper", hex: "#f2f1ed" },
      { name: "Rose", hex: "#f2818f" },
    ],
    light: { bg: "#faf9f6", card: "#f2f1ed", ink: "#17161b", ink2: "#55545c", ink3: "#6e6d75", rule: "#d5d4cd", rule2: "#bfbeb6", acc: "#8c1a2d", accDeep: "#6b1122", accInk: "#fbedef", accText: "#8c1a2d", frame: "#1b1a1f" },
    dark: { bg: "#1b1a20", card: "#131216", ink: "#efede7", ink2: "#aeaca6", ink3: "#8f8d96", rule: "#2b2a31", rule2: "#3b3a42", acc: "#7c1526", accDeep: "#5e0f1d", accInk: "#fbedef", accText: "#f2818f", frame: "#050507" },
  },
};

const SCHEME_VARS: [keyof StudioSchemeTokens, string][] = [
  ["bg", "bg"],
  ["card", "card"],
  ["ink", "ink"],
  ["ink2", "ink-2"],
  ["ink3", "ink-3"],
  ["rule", "rule"],
  ["rule2", "rule-2"],
  ["acc", "acc"],
  ["accDeep", "acc-deep"],
  ["accInk", "acc-ink"],
  ["accText", "acc-text"],
  ["frame", "frame"],
];

/**
 * A scheme as inline custom properties: `--cl-<token>` (light) and
 * `--cd-<token>` (dark). studio.css `.cs` maps them onto the studio tokens
 * for the theme the page is in.
 */
export function studioSchemeVars(id: StudioSchemeId): Record<string, string> {
  const s = STUDIO_SCHEMES[id];
  const out: Record<string, string> = {};
  for (const [k, name] of SCHEME_VARS) {
    out[`--cl-${name}`] = s.light[k];
    out[`--cd-${name}`] = s.dark[k];
  }
  return out;
}

export const STUDIO_SCHEME_LABEL = "Their colours";

// ---- How we design ------------------------------------------------------
// The studio's design process shown the way a logo job runs: a brief comes
// in, the client sees three options side by side, picks one, and we build
// it. Each case is a real project. Every option is a finished direction in
// that client's own identity, shown as a render of a working page's first
// screen (light and dark, under public/studio/process/); the picked one is
// the site that was built. No option is a bare shell or a template page.
// The briefs are EXAMPLES written for this page, and the page says so.
export const STUDIO_DESIGN_HEAD = {
  kicker: "How we design",
  title: "You see three. You choose one.",
  aside:
    "It works like choosing a logo. A brief comes in, our team puts three directions side by side, you pick one, and we build the one you picked. Here is how it went on four real sites.",
  foot: "The briefs are examples, written for this page to show how a job starts. Every option is a working page our team built and rendered; the picked one is the site we went on to build.",
};

export const STUDIO_DESIGN_STEPS = [
  { h: "The brief comes in", p: "Your answers, turned into one page." },
  { h: "Three options", p: "Three directions for the first screen, side by side." },
  { h: "You pick one", p: "Tell us which, and why, on WhatsApp." },
  { h: "We build it", p: "The direction you picked becomes the real site." },
] as const;

export interface StudioDesignOption {
  key: "a" | "b" | "c";
  name: string;
  alt: string;
}

export interface StudioDesignCase {
  id: StudioSchemeId;
  tab: string;
  sector: string;
  brief: { client: string; sells: string; to: string; ask: string };
  options: StudioDesignOption[];
  chosen: "a" | "b" | "c";
  why: string;
}

/** Thumbnail path for one option in one theme. */
export const studioDesignImage = (id: string, o: StudioDesignOption, theme: "light" | "dark") =>
  `/studio/process/${id}-${o.key}-${theme}.webp`;

export const STUDIO_DESIGN_CASES: StudioDesignCase[] = [
  {
    id: "polaris",
    tab: "Polaris",
    sector: "Online lender",
    brief: {
      client: "Polaris, an online short-term lender",
      sells: "Loans from R500 to R8\u202F000, repaid over one to six months, applied for online.",
      to: "Working people short for the rent, the car or a tight month.",
      ask: "Show the full cost before anyone applies, and feel as steady as a bank.",
    },
    options: [
      { key: "a", name: "Calculator first", alt: "Option A for Polaris: a centred serif headline over the loan calculator, with a green italic line" },
      { key: "b", name: "Itemised statement", alt: "Option B for Polaris: 'Four lines. Nothing else to pay.' beside a dark statement of every fee on a R3 000 loan" },
      { key: "c", name: "Product first", alt: "Option C for Polaris: 'The full cost, shown before you apply' beside a loan application that checks affordability" },
    ],
    chosen: "c",
    why: "It answers the brief in one screen: the full cost is the headline, and the affordability check sits beside it before anyone applies.",
  },
  {
    id: "southriver",
    tab: "South River",
    sector: "Bottled water",
    brief: {
      client: "South River, a water bottler in Musina, Limpopo",
      sells: "Private-label bottled water: 500 ml bottles with the customer's logo on the label, by the case.",
      to: "Shops, spazas, offices, weddings and events. Orders come in on WhatsApp.",
      ask: "Make it plain in one screen that your logo can go on our bottle, and send every order to WhatsApp.",
    },
    options: [
      { key: "a", name: "Range first", alt: "Option A for South River: 'Water for the road, purified and bottled in Musina' over the three bottle sizes, on pale blue" },
      { key: "b", name: "River poster", alt: "Option B for South River: 'Your brand on every bottle' in tall yellow and white capitals on deep river blue, a bottle wearing the client's label" },
      { key: "c", name: "Label poster", alt: "Option C for South River: 'Your brand on every bottle' in heavy italic capitals on the red of South River's own label, with two bottles" },
    ],
    chosen: "c",
    why: "It wears the red of South River's own label, so the site and the bottle read as one brand, and every claim on it comes from that label: alkaline, pH 8, bottled in Musina since 2021.",
  },
  {
    id: "supacharge",
    tab: "Supacharge",
    sector: "Online school",
    brief: {
      client: "Supacharge, an online school",
      sells: "Lessons online with its tutors, term by term, with a focus on Grade\u00A0R to\u00A03.",
      to: "Parents of young learners across South Africa.",
      ask: "Feel like a school parents can trust, and get families into the app from the first screen.",
    },
    options: [
      { key: "a", name: "Session first", alt: "Option A for Supacharge: 'One lesson. Two ways to get it.' beside a card of tonight's session: the expert, the break, the simplifier" },
      { key: "b", name: "Type poster", alt: "Option B for Supacharge: 'Taught twice.' in giant italic capitals on full-bleed orange, with the three store buttons" },
      { key: "c", name: "Outcome first", alt: "Option C for Supacharge: 'Pass with confidence' over an orange glow, with the three store buttons" },
    ],
    chosen: "c",
    why: "It leads with the outcome parents want and keeps every store button in the first screen, so a family goes from the headline to the app in one tap.",
  },
  {
    id: "studio",
    tab: "ROKCT",
    sector: "Our own studio",
    brief: {
      client: "ROKCT, our own design and hosting studio",
      sells: "Websites, logos, business plans, pitch decks, print and social posts.",
      to: "Small business owners in South Africa, most of whom reach us on WhatsApp.",
      ask: "Look like a studio worth paying, and put the prices on the page.",
    },
    options: [
      { key: "a", name: "Offer first", alt: "Option A for ROKCT: 'Your brand, taken seriously.' in heavy black type with a yellow highlight, beside the website deal card" },
      { key: "b", name: "Editorial", alt: "Option B for ROKCT: 'Your brand, taken seriously.' in a heavy grotesk on cream, with a serif lede" },
      { key: "c", name: "Proof sheet", alt: "Option C for ROKCT: 'Your brand, taken seriously.' in tall condensed capitals, with an oxblood button" },
    ],
    chosen: "c",
    why: "The tall type carries the confidence the brief asked for, and the price table sits on the page in rand, with the dollar beside it.",
  },
];

export const STUDIO_PRICES_HEAD = {
  kicker: "Prices",
  title: "Set in dollars. Shown in your money.",
  aside:
    "Prices are set in US dollars and shown in rand for South Africa at a fixed R18.50 to the dollar, so the figure you see here is the figure you pay. The website deal is set in rand.",
  foot: "A quoted service is priced on WhatsApp before any work starts, and the price does not move once agreed. Every job is paid in full before work begins; the refund rule is below.",
};

export interface StudioPriceRow {
  name: string;
  tag?: string;
  what: string;
  price: StudioServicePrice;
  lead?: boolean;
}

export const STUDIO_PRICE_ROWS: StudioPriceRow[] = [
  {
    name: "Website and brand bundle",
    tag: "Free lifetime hosting · first 1,000 owners",
    what: "Logo and brand, four-page website, copy written for you, hosted for life.",
    price: { kind: "deal", unit: "once-off" },
    lead: true,
  },
  { name: "Business plan · Starter", what: "One-page plan and a 12-month cash view.", price: { kind: "fixed", usd: 100, unit: "" } },
  {
    name: "Business plan · Standard",
    what: "Full plan for a small business, financial tables, funding-ready layout.",
    price: { kind: "fixed", usd: 250, unit: "" },
  },
  {
    name: "Business plan · Premium",
    what: "Full plan, a pitch deck and one round of revisions.",
    price: { kind: "fixed", usd: 500, unit: "" },
  },
  {
    name: "Business starter kit",
    what: "Logo, letterhead, quote template and invoice template.",
    price: { kind: "quoted", unit: "per kit" },
  },
  { name: "Pitch deck", what: "Written and designed in your brand, as slides and PDF.", price: { kind: "quoted", unit: "per deck" } },
  {
    name: "Design and print",
    what: "Flyers, posters, banners, menus, labels, business cards.",
    price: { kind: "quoted", unit: "per job" },
  },
  { name: "Social post pack", what: "A month of posts, captions and a calendar.", price: { kind: "quoted", unit: "per pack" } },
];

export const STUDIO_PROCESS = {
  kicker: "How it works",
  title: "You pay once. We work in five phases. You approve every render.",
  aside:
    "Each phase ends in something you can see. We send it, you approve it, and only then does the next phase start. Your status page shows where the order stands.",
  phases: [
    { h: "Brief confirmed", p: "You fill in the form. We turn your answers into a one-page brief and send it back.", out: "The brief, approved by you" },
    { h: "Colour system and logo", p: "Your brand colour becomes a full colour system, and the logo takes shape.", out: "A render to approve" },
    { h: "Page designs", p: "Every page, designed and written, shown as it will look on a phone and a computer.", out: "A render to approve" },
    { h: "Site build", p: "The real site, built and working, on a preview address for you to click through.", out: "A preview to approve" },
    { h: "Launch", p: "The site goes live on your domain. Hosting is ours to run; the domain stays yours.", out: "Your site, live" },
  ],
  status: {
    title: "Your order status",
    tag: "Sample page",
    lines: [
      { state: "done", t: "Brief confirmed", s: "Phase 1", label: "Approved" },
      { state: "done", t: "Colour system and logo", s: "Phase 2 · render sent and approved", label: "Approved" },
      { state: "now", t: "Page designs", s: "Phase 3 · due date shown here", label: "In progress" },
      { state: "", t: "Site build preview", s: "Phase 4", label: "Next" },
      { state: "", t: "Launch", s: "Phase 5", label: "Next" },
    ],
    blocker: {
      b: "Waiting for your photos.",
      t: "The due date moves until we have them. Send them on WhatsApp and the clock starts again.",
    },
  },
  refund: {
    kicker: "The refund rule",
    big: "If we miss the due date of your first render, you get a full refund.",
    small: "The first render is the phase 2 colour system and logo. Its due date is on your status page from the day you pay.",
  },
  terms: [
    { b: "Payment", t: "You pay the full price before work starts. No deposit split." },
    { b: "Due dates", t: "Set per order and shown on your status page, phase by phase." },
    {
      b: "Your delays",
      t: "If we are waiting on you for a logo, an answer or an approval, the due date moves and no refund is due. You see it as a blocker.",
    },
    { b: "Domain", t: "The domain name is yours. You pay its yearly renewal. We never hold it." },
    { b: "Hosting", t: "Free for the life of the site for the first 1,000 small business owners, under fair use." },
  ],
  intake: {
    kicker: "What we ask you",
    title: "Ten answers. About two minutes. We never ask twice.",
    text: "If an answer is missing we make a sensible choice for your kind of business and show it to you in the render.",
    questions: [
      "Business name",
      "What you sell, in one sentence",
      "Town or area you serve",
      'Your logo, or "I don\'t have one"',
      "Your brand colour",
      "Three websites you like",
      "Pages you want",
      "Phone, WhatsApp and email",
      'Photos, or "need stock photos"',
      "What customers always ask you",
    ],
  },
};

export const STUDIO_CONTACT = {
  kicker: "Contact",
  title: "Start on WhatsApp.",
  lede: "Send your business name and what you need. Our team replies in office hours.",
  note: "WhatsApp, text or voice note. Save the number as ROKCT.",
  primary: "Message us on WhatsApp",
  copy: "Copy the number",
  copied: "Copied",
  selected: "Selected: press copy",
};

export const STUDIO_FOOTER = {
  about:
    "A design and hosting studio for small businesses: websites, logos and brands, business plans, pitch decks, print and social posts, made by our team and approved by you at every phase.",
  motto: "Your brand, taken seriously.",
  // The copyright and credit come from base_sdk's SiteCredit (1.5.1, Ray,
  // 2026-10-31: "all site will be copyright sitename then built with love
  // (as heart) by ROKCT"); this is the note the fine line carries after it.
  prices: "Prices in US dollars, shown in rand at R18.50",
  // The copyright names the brand as it is set, in capitals. The host's
  // PLATFORM_NAME is "Rokct", so the studio passes its own name (1.5.2).
  siteName: "ROKCT",
};
