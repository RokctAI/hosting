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

export interface StudioCase {
  desk: { src: string; alt: string; url: string; caption: string };
  phone: { src: string; alt: string };
  kicker: string;
  title: string;
  body: string;
  made: string;
  look: string;
}

export const STUDIO_WORK_HEAD = {
  kicker: "Our work",
  title: "Built by our team. Live on the web.",
  aside:
    "Shown as they render on a desktop and a phone. Every site gets its own colour, type and layout, chosen for that business.",
};

export const STUDIO_CASES: StudioCase[] = [
  {
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
  },
  {
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
  },
];

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
  id: string;
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
