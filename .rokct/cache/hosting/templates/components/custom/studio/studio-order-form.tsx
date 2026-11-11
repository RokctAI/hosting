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

// The studio order form (hosting_sdk 1.19.0, Ray 2026-11-02): a five-step
// stepper - package, add-ons, business, contact, review and pay - one step
// at a time with Back/Next, a progress rail and a check on each step. The
// live price (StudioOrderSummary) reads only studio-copy.ts and follows the
// package and add-ons as they change: a sticky card on desktop, a bar at
// the bottom on mobile. Every step stays mounted (hidden), so the one
// multipart POST to /api/studio/order still carries every answer and file;
// the server checks everything again. The order email always goes first,
// so we have the details before any payment; then, when PayFast is set up
// and the package has a fixed price, the payment step posts to our pay
// route, which signs and forwards to PayFast. Any failure shows a plain
// message, and the answers stay in the form.
//
// 1.21.2 (Ray): three stages - Details (package, add-ons, business,
// contact), Review (a summary and "I accept the terms", linking /terms) and
// Pay (the PayFast and bank-transfer step). Pay opens only once the terms
// are accepted and the order email has gone (with its CX reference). Prices
// in rand only. One domain box, checked as the client types (debounced,
// server-side RDAP); a registered name asks "I already own this domain".
// No shop or app checkboxes.
//
// 1.20.8: logo new or redesign (with the current logo for a redesign), a
// photo quality warning, the colour-system preview (in the picker), the
// ten business plan questions for a plan order, (the app upsell's
// questions were dropped in 1.21.2).
"use client";

import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiLockLine,
  RiMailSendLine,
  RiShieldCheckLine,
} from "@remixicon/react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { useStudioCurrency } from "./studio-client";
import { StudioColourPicker } from "./studio-colour-picker";
import { STUDIO_COLOURS_ERROR, studioParseColourRoles } from "./studio-shades";
import { STUDIO_ADDONS, STUDIO_DEAL_ZAR, STUDIO_PRICE_ROWS, studioAddonZar, studioMoney, studioOrderZar, studioRowZar } from "./studio-copy";
import {
  STUDIO_ORDER_ACCEPT,
  STUDIO_DOMAIN_API,
  STUDIO_DOMAIN_CHECK_TEXT,
  STUDIO_DOMAIN_ENDING_ERROR,
  STUDIO_ORDER_API,
  STUDIO_ORDER_COPY,
  STUDIO_ORDER_DOMAIN,
  STUDIO_ORDER_FIELDS,
  STUDIO_ORDER_FILE_TYPES,
  STUDIO_ORDER_FLAGS,
  STUDIO_ORDER_MAX_BYTES,
  STUDIO_ORDER_MAX_FILES,
  STUDIO_ORDER_MESSAGES,
  STUDIO_ORDER_PAGES,
  STUDIO_ORDER_TRAP,
  STUDIO_ORDER_LOGO,
  STUDIO_PLAN_FIELDS,
  STUDIO_PLAN_FOR,
  STUDIO_PLAN_TYPES,
  STUDIO_STATUS_HREF,
  studioIsPlan,
  studioPhotoWarning,
  studioPlanQuestions,
  studioCleanDomain,
  studioDomainEnding,
  type StudioDomainCheck,
  type StudioOrderField,
  type StudioOrderTerm,
} from "./studio-order";
import { STUDIO_BANK, STUDIO_PAY_API, STUDIO_PAY_COPY } from "./studio-pay";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "ok"; ref: string; ack: boolean; total: number | null; card: StudioCardPost; info: StudioPayAfterSendInfo }
  | { kind: "fail"; message: string; errors: Record<string, string> };

const C = STUDIO_ORDER_COPY;
const FIELD = Object.fromEntries([...STUDIO_ORDER_FIELDS, ...STUDIO_PLAN_FIELDS].map((f) => [f.name, f])) as Record<string, StudioOrderField>;

/** 1.20.8: what the card button posts to our pay route (name and email never go in a URL). */
export interface StudioCardPost {
  ref: string;
  service: string;
  addons: string;
  name: string;
  email: string;
}

/** A picture's size in pixels, or null when the browser cannot read it. */
async function measure(f: File): Promise<{ width: number; height: number } | null> {
  try {
    const bmp = await createImageBitmap(f);
    const out = { width: bmp.width, height: bmp.height };
    bmp.close();
    return out;
  } catch {
    return null;
  }
}

function Choice({ name, options, value, onPick }: { name: string; options: readonly { value: string; label: string }[]; value?: string; onPick?: (v: string) => void }) {
  return (
    <div className="of-radios">
      {options.map((o) => (
        <label className="of-check" key={o.value}>
          <input
            type="radio"
            name={name}
            value={o.value}
            {...(onPick ? { checked: value === o.value, onChange: () => onPick(o.value) } : {})}
          />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function SelectField({ name, options, errors }: { name: string; options: readonly string[]; errors: Record<string, string> }) {
  const f = FIELD[name];
  const id = `of-${name}`;
  return (
    <div className="of-f">
      <label htmlFor={id}>{f.label}</label>
      <select id={id} name={name} defaultValue="">
        <option value="">Not sure / skip</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {errors[name] ? <small className="of-err">{errors[name]}</small> : null}
    </div>
  );
}
const FLAG = Object.fromEntries(STUDIO_ORDER_FLAGS.map((f) => [f.name, f.label])) as Record<string, string>;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 1.21.2 (Ray): the three stages the client sees. */
export const STUDIO_ORDER_STAGES = [
  { title: "Details", lede: "" },
  { title: "Review", lede: "Check your order and accept the terms. Then we email your order and you pay." },
  { title: "Pay", lede: "" },
] as const;
/** The parts of Details, one at a time (steps 0-3); Review is step 4, Pay step 5. */
export const STUDIO_ORDER_STEPS = [
  { title: "Package", lede: "Pick what you are ordering. Prices are once-off, in rand." },
  { title: "Add-ons", lede: "Add what you need. The total updates as you go." },
  { title: "Your business", lede: "Only the starred answers are needed. We fill any gap sensibly and show you in the render." },
  { title: "Contact", lede: "Where we send your brief, your copy and the terms." },
  { title: "Review", lede: "Check your order and accept the terms. Then we email your order and you pay." },
  { title: "Pay", lede: "" },
] as const;
const DETAILS = 4;
const REVIEW = 4;
const PAY = 5;
const stageOf = (step: number) => (step < DETAILS ? 0 : step === REVIEW ? 1 : 2);
// The answers each step checks before Next.
const STEP_REQUIRED: readonly string[][] = [["service"], [], ["business", "sells"], ["name", "email"], ["terms"], []];
/** Wait this long after the last key before asking whether a domain is registered. */
const DOMAIN_DEBOUNCE_MS = 600;


function Field({ name, errors }: { name: string; errors: Record<string, string> }) {
  const f = FIELD[name];
  const id = `of-${name}`;
  const err = errors[name];
  const common = {
    id,
    name,
    maxLength: f.max,
    placeholder: f.placeholder,
    "aria-required": f.required ? true : undefined,
    "aria-invalid": err ? true : undefined,
    "aria-describedby": err || f.hint ? `${id}-note` : undefined,
  };
  return (
    <div className={f.kind === "textarea" ? "of-f of-wide" : "of-f"}>
      <label htmlFor={id}>
        {f.label}
        {f.required ? <em aria-hidden="true"> *</em> : null}
      </label>
      {f.kind === "textarea" ? (
        <textarea {...common} rows={3} />
      ) : (
        <input {...common} type={f.kind} autoComplete={name === "email" ? "email" : name === "name" ? "name" : name === "phone" ? "tel" : undefined} />
      )}
      {err || f.hint ? (
        <small id={`${id}-note`} className={err ? "of-err" : "fine"}>
          {err || f.hint}
        </small>
      ) : null}
    </div>
  );
}

function Flag({ name }: { name: string }) {
  return (
    <label className="of-check">
      <input type="checkbox" name={name} value="yes" />
      <span>{FLAG[name]}</span>
    </label>
  );
}

/** The live price: a sticky card on desktop, a bottom bar on mobile. */
export function StudioOrderSummary({ service, addons, step }: { service: string; addons: string[]; step: number }) {
  const { cur, usdPerZar } = useStudioCurrency();
  const row = STUDIO_PRICE_ROWS.find((r) => r.name === service);
  const stage = STUDIO_ORDER_STAGES[stageOf(step)].title;
  const base = studioRowZar(row);
  const total = studioOrderZar(service, addons);
  const picked = STUDIO_ADDONS.filter((a) => addons.includes(a.name));
  const totalText = total === null ? "Quoted" : studioMoney(total, cur, usdPerZar);
  return (
    <>
      <div className="os-card" aria-live="polite">
        <p className="kick">Your order</p>
        <ul className="os-lines">
          <li>
            <span>{service || "No package yet"}</span>
            <b className="num">{base === null ? "Quoted" : studioMoney(base, cur, usdPerZar)}</b>
          </li>
          {picked.map((a) => {
            const z = studioAddonZar(a, row);
            return (
              <li key={a.name}>
                <span>{a.label}</span>
                {a.wasZar ? <s className="num">{studioMoney(a.wasZar, cur, usdPerZar)}</s> : null}
                <b className="num">{z === 0 ? "Included" : `+ ${studioMoney(z, cur, usdPerZar)}`}</b>
              </li>
            );
          })}
          {row?.price.kind === "deal" ? (
            <li className="os-free">
              <span>Forever hosting</span>
              <b>Free</b>
            </li>
          ) : null}
        </ul>
        <div className="os-total">
          <span>Total, once-off</span>
          <b className="num disp">{totalText}</b>
        </div>
        <p className="fine">
          {total === null ? "We send you a quote before any payment." : "No monthly fee. Hosting lasts as long as your site is with us."}
        </p>
      </div>
      <div className="os-bar" aria-hidden="true" data-rokct-floating="">
        <div>
          <small>
            {stage} · {picked.length ? `${picked.length} add-on${picked.length > 1 ? "s" : ""}` : "Total"}
          </small>
          <b className="num">{totalText}</b>
        </div>
        <span className="os-bar-tag">Forever hosting</span>
      </div>
    </>
  );
}

/** What the payment step can offer, decided on the server (1.20.7). */
export interface StudioOrderPayOptions {
  /** PayFast settings are present; otherwise card is "coming soon". */
  card: boolean;
}

/**
 * 1.21.4: what the order route returns once the order is sent (never on
 * the page before): the account number, PayShap ID, Capitec Pay Me QR image
 * URL, and the two QR codes as SVG markup (from `qrcode`, on the server).
 */
export interface StudioPayAfterSendInfo {
  account: string | null;
  swift?: string;
  payshap: string | null;
  capitecQr: string | null;
  qrBank: string | null;
  qrCard: string | null;
}

const NO_PAY_INFO: StudioPayAfterSendInfo = { account: null, payshap: null, capitecQr: null, qrBank: null, qrCard: null };

function Copy({ value, what }: { value: string; what: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-line btn-sm pay-copy"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(
          () => setDone(true),
          () => setDone(false),
        );
      }}
      aria-label={`Copy ${what} ${value}`}
    >
      {done ? STUDIO_PAY_COPY.copied : STUDIO_PAY_COPY.copy}
    </button>
  );
}

function Qr({ svg, label, caption }: { svg: string; label: string; caption: string }) {
  return (
    <figure className="pay-qr">
      <div className="pay-qr-img" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption className="fine">{caption}</figcaption>
    </figure>
  );
}

/**
 * The payment step shown once the order is sent: bank transfer and card.
 * 1.21.4 (Ray, "make it look nicer. that card payment be a card"): an
 * amount summary on top, then two option cards side by side (stacked on a
 * phone). "Pay by card" is drawn as a bank card (chip, CORTEX wordmark,
 * masked number, Visa · Mastercard, the amount) with its pay button and a
 * "Scan to pay by card" QR; "Bank transfer (EFT)" leads with PayShap when
 * set, then the CX reference and each bank detail with its own copy button,
 * a "Scan to copy bank details" QR and the Capitec Pay Me QR when set.
 */
export function StudioPayStep({ refCode, total, card, pay, info = NO_PAY_INFO }: { refCode: string; total: number | null; card: StudioCardPost; pay: StudioOrderPayOptions; info?: StudioPayAfterSendInfo }) {
  const P = STUDIO_PAY_COPY;
  const cardOn = pay.card && total !== null && total > 0;
  const amount = total !== null ? `R${total.toLocaleString("en-ZA")}` : null;
  const rows: [string, string | null, boolean][] = [
    [P.holder, STUDIO_BANK.holder, false],
    [P.bank, STUDIO_BANK.bank, false],
    [P.branch, STUDIO_BANK.branch, true],
    [P.swift, info.swift ?? STUDIO_BANK.swift, true],
    [P.account, info.account, true],
    [P.amount, total !== null ? String(total) : null, true],
  ];
  return (
    <section className="pay" aria-labelledby="pay-h">
      <div className="pay-top">
        <div>
          <h3 id="pay-h" className="disp">{P.title}</h3>
          <p className="sm">{P.lede}</p>
        </div>
        {amount ? (
          <p className="pay-amt">
            <span>{P.amount}</span>
            <b className="num">{amount}</b>
          </p>
        ) : null}
      </div>
      <div className="pay-g">
        <div className="pay-opt pay-opt-card">
          <h4>{P.cardTitle}</h4>
          <div className="pay-cc" aria-hidden="true">
            <div className="pay-cc-top">
              <span className="pay-cc-chip" />
              <b className="pay-cc-mark">CORTEX</b>
            </div>
            <span className="pay-cc-num num">•••• •••• •••• ••••</span>
            <div className="pay-cc-foot">
              <span>{P.cardBrands}</span>
              {amount ? <b className="num">{amount}</b> : null}
            </div>
          </div>
          {cardOn ? (
            <form method="post" action={STUDIO_PAY_API}>
              {Object.entries(card).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <button type="submit" className="btn btn-acc pay-go">
                <RiLockLine size={18} aria-hidden="true" />
                {P.cardButton(amount!)}
              </button>
              <p className="fine">{P.cardNote}</p>
              {info.qrCard ? <Qr svg={info.qrCard} label={P.cardQrLabel} caption={P.cardQr} /> : null}
            </form>
          ) : (
            <p className="sm">{P.cardSoon}</p>
          )}
        </div>
        <div className="pay-opt pay-opt-bank">
          <h4>{P.bankTitle}</h4>
          {info.payshap ? (
            <div className="pay-shap">
              <b>{P.payshapTitle}</b>
              <div className="pay-ref">
                <span className="num">{info.payshap}</span> <Copy value={info.payshap} what="PayShap ID" />
              </div>
              <small>{P.payshapRef(refCode)}</small>
            </div>
          ) : null}
          <div className="pay-refbox">
            <span>{P.reference}</span>
            <div className="pay-ref">
              <b className="num">{refCode}</b> <Copy value={refCode} what="payment reference" />
            </div>
          </div>
          <dl className="pay-dl">
            {rows.map(([k, v, num]) => (
              <div className="pay-row" key={k}>
                <dt>{k}</dt>
                <dd className={num ? "num" : undefined}>{v === null ? (k === P.account ? P.accountMissing : "") : k === P.amount ? amount : v}</dd>
                <dd className="pay-row-c">{v !== null ? <Copy value={v} what={k.toLowerCase()} /> : null}</dd>
              </div>
            ))}
          </dl>
          <p className="fine">{P.bankNote}</p>
          {info.qrBank || info.capitecQr ? (
            <div className="pay-qrs">
              {info.qrBank ? <Qr svg={info.qrBank} label={P.bankQrLabel} caption={P.bankQr} /> : null}
              {info.capitecQr ? (
                <figure className="pay-qr">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="pay-qr-img" src={info.capitecQr} alt={P.capitecQrAlt} width={112} height={112} />
                  <figcaption className="fine">{P.capitecQr}</figcaption>
                </figure>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function StudioOrderForm({ terms, promise, pay = { card: false } }: { terms: StudioOrderTerm[]; promise: string; pay?: StudioOrderPayOptions }) {
  const { cur, usdPerZar } = useStudioCurrency();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [step, setStep] = useState(0);
  const [service, setService] = useState(STUDIO_PRICE_ROWS[0].name);
  const [addons, setAddons] = useState<string[]>([]);
  const [hasDomain, setHasDomain] = useState<"" | "yes" | "no">("");
  const [domainText, setDomainText] = useState("");
  const [accepted, setAccepted] = useState(false);
  // 1.20.8: logo new or redesign, the photo warnings.
  const [logoKind, setLogoKind] = useState<"" | "new" | "redesign">("");
  const [photoWarnings, setPhotoWarnings] = useState<Record<string, string[]>>({});
  const isPlan = studioIsPlan(service);
  const planQs = studioPlanQuestions(service);
  // The availability check of the typed domain: the name it was for, and its result.
  const [domainCheck, setDomainCheck] = useState<{ name: string; result: StudioDomainCheck | "checking" } | null>(null);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [review, setReview] = useState<[string, string][]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const errors = state.kind === "fail" ? { ...state.errors, ...stepErrors } : stepErrors;
  const row = STUDIO_PRICE_ROWS.find((r) => r.name === service);
  const total = studioOrderZar(service, addons);
  const totalText = total === null ? "Quoted" : studioMoney(total, cur, usdPerZar);
  const keyTerms = useMemo(() => terms.filter((t) => /cancel/i.test(t.b)), [terms]);

  function check(i: number): Record<string, string> {
    const form = formRef.current;
    if (!form) return {};
    const data = new FormData(form);
    const out: Record<string, string> = {};
    for (const name of STEP_REQUIRED[i]) {
      const v = String(data.get(name) ?? "").trim();
      if (!v) out[name] = name === "terms" ? "Please accept the terms to go on to payment." : "Needed to start your brief.";
      else if (name === "email" && !EMAIL.test(v)) out[name] = "That email doesn't look right.";
    }
    // 1.20.7 (Ray): the brand colours are required (1.21.4: the Primary).
    // 1.20.8: a redesign needs the current logo.
    if (i === 1 && addons.includes("designLogo")) {
      const kind = String(data.get(STUDIO_ORDER_LOGO.name) ?? "");
      if (kind !== "new" && kind !== "redesign") out[STUDIO_ORDER_LOGO.name] = STUDIO_ORDER_LOGO.pick;
      else if (kind === "redesign" && !data.getAll("logo").some((v) => v instanceof File && v.size > 0)) out.logo = STUDIO_ORDER_LOGO.missing;
    }
    if (i === 2 && !isPlan && !studioParseColourRoles(String(data.get("colour") ?? "")).some((p) => p.role === "Primary")) {
      out.colour = STUDIO_COLOURS_ERROR;
    }
    // 1.21.2: the domain box is optional; a typed name must be .co.za or
    // .com, and unless the check said "available", we ask whether it is
    // theirs. A failed or slow check never stops the order.
    if (i === 2 && !isPlan && domainText.trim()) {
      if (!domainName) out.domain = STUDIO_DOMAIN_ENDING_ERROR;
      else if (!domainFree && !String(data.get(STUDIO_ORDER_DOMAIN.name) ?? "")) out[STUDIO_ORDER_DOMAIN.name] = STUDIO_ORDER_DOMAIN.pickOwn;
    }
    return out;
  }

  // 1.21.2: the typed domain, checked on the server (RDAP) a moment after
  // the last key. A failed check is "unknown" and never stops the order.
  const domainName = (() => {
    const d = studioCleanDomain(domainText);
    return d && studioDomainEnding(d) ? d : "";
  })();
  const domainResult = domainCheck && domainCheck.name === domainName ? domainCheck.result : null;
  const domainFree = domainResult === "available";
  useEffect(() => {
    if (!domainName) {
      setDomainCheck(null);
      return;
    }
    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      setDomainCheck({ name: domainName, result: "checking" });
      let result: StudioDomainCheck = "unknown";
      try {
        const res = await fetch(`${STUDIO_DOMAIN_API}?name=${encodeURIComponent(domainName)}`, { cache: "no-store", signal: ctl.signal });
        const body = (await res.json()) as { result?: string };
        if (body.result === "available" || body.result === "taken") result = body.result;
      } catch {
        if (ctl.signal.aborted) return;
      }
      setDomainCheck((c) => (c?.name === domainName ? { name: domainName, result } : c));
    }, DOMAIN_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [domainName]);
  // What the order says about the domain: free means we register it.
  const ownAnswer: "" | "yes" | "no" = !domainName ? "" : domainFree ? "no" : hasDomain;

  // 1.20.8: measure each picture as it is chosen and warn (never block) on
  // a low resolution or a small, likely compressed file.
  async function onFiles(field: string, list: FileList | null) {
    const files = list ? [...list] : [];
    const out: string[] = [];
    for (const f of files) {
      const dims = f.type.startsWith("image/") && f.type !== "image/svg+xml" ? await measure(f) : null;
      const w = studioPhotoWarning({ name: f.name, type: f.type, size: f.size, width: dims?.width, height: dims?.height });
      if (w) out.push(w);
    }
    setPhotoWarnings((p) => ({ ...p, [field]: out }));
  }

  function go(to: number) {
    setStep(to);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function next() {
    const errs = check(step);
    setStepErrors(errs);
    if (Object.keys(errs).length) {
      const key = Object.keys(errs)[0];
      const first = formRef.current?.querySelector<HTMLElement>(key === "colour" ? ".sp input:not([type=hidden]), .sp button" : `[name="${key}"]`);
      first?.scrollIntoView({ block: "center" });
      first?.focus();
      return;
    }
    if (step === REVIEW - 1 && formRef.current) {
      const d = new FormData(formRef.current);
      const s = (k: string) => String(d.get(k) ?? "").trim();
      setReview(
        (
          [
            ["Business", s("business")],
            ["What you do", s("sells")],
            ["Area", s("area")],
            ["Pages", d.getAll("pages").map(String).join(", ")],
            [
              "Domain",
              ownAnswer === "yes"
                ? [`${domainName} (yours)`, s("domainManager") && `managed by ${s("domainManager")}`].filter(Boolean).join(", ")
                : ownAnswer === "no"
                  ? [`${domainName}, we register it`, domainResult && domainResult !== "checking" ? STUDIO_DOMAIN_CHECK_TEXT[domainResult] : ""]
                      .filter(Boolean)
                      .join(": ")
                  : "",
            ],
            ["Logo", addons.includes("designLogo") ? (s(STUDIO_ORDER_LOGO.name) === "redesign" ? STUDIO_ORDER_LOGO.rowText.redesign : s(STUDIO_ORDER_LOGO.name) === "new" ? STUDIO_ORDER_LOGO.rowText.new : "") : ""],
            ["Colours", isPlan ? "" : s("colour")],
            ...(isPlan ? planQs.flatMap((q) => q.fields.filter((f) => f.startsWith("plan")).map((f) => [`Q${q.n}. ${FIELD[f].label}`, s(f) || "Not given"] as [string, string])) : []),
            ["Name", s("name")],
            ["Email", s("email")],
            ["Phone", s("phone")],
          ] as [string, string][]
        ).filter(([, v]) => v),
      );
    }
    go(step + 1);
  }

  function toggleAddon(name: string) {
    setAddons((a) => (a.includes(name) ? a.filter((x) => x !== name) : [...a, name]));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < REVIEW) return next();
    if (state.kind === "ok" || step !== REVIEW) return;
    const errs = check(step);
    setStepErrors(errs);
    if (Object.keys(errs).length) return;
    // Never send without a primary brand colour: back to that step.
    const colourErr = isPlan ? undefined : check(2).colour;
    if (colourErr) {
      setStepErrors({ colour: colourErr });
      go(2);
      return;
    }
    const form = new FormData(e.currentTarget);
    form.set("total", total === null ? "Quoted" : `R${total}`);
    const files = [...form.getAll("logo"), ...form.getAll("photos")].filter((v): v is File => v instanceof File && v.size > 0);
    const size = files.reduce((n, f) => n + f.size, 0);
    if (files.length > STUDIO_ORDER_MAX_FILES || size > STUDIO_ORDER_MAX_BYTES) {
      setState({ kind: "fail", message: STUDIO_ORDER_MESSAGES.tooLarge, errors: { files: C.filesHint } });
      return;
    }
    if (files.some((f) => !(f.type in STUDIO_ORDER_FILE_TYPES))) {
      setState({ kind: "fail", message: STUDIO_ORDER_MESSAGES.invalid, errors: { files: "Pictures or PDF only" } });
      return;
    }
    setState({ kind: "sending" });
    try {
      const res = await fetch(STUDIO_ORDER_API, { method: "POST", body: form });
      let body: { ok?: boolean; ref?: string; ack?: boolean; pay?: Partial<StudioPayAfterSendInfo>; message?: string; errors?: Record<string, string> } = {};
      try {
        body = await res.json();
      } catch {
        body = {};
      }
      if (res.ok && body.ok) {
        const ref = body.ref ?? "";
        // 1.20.7: the client pays before leaving: the payment step follows.
        const card: StudioCardPost = { ref, service, addons: addons.join(","), name: String(form.get("name") ?? ""), email: String(form.get("email") ?? "") };
        setState({ kind: "ok", ref, ack: body.ack !== false, total, card, info: { ...NO_PAY_INFO, ...(body.pay ?? {}) } });
        // 1.21.2: the order is in; Pay opens (the answers are locked now).
        go(PAY);
        return;
      }
      setState({
        kind: "fail",
        message: body.message || (res.status === 413 ? STUDIO_ORDER_MESSAGES.tooLarge : STUDIO_ORDER_MESSAGES.sendFailed),
        errors: body.errors ?? {},
      });
    } catch {
      setState({ kind: "fail", message: STUDIO_ORDER_MESSAGES.sendFailed, errors: {} });
    }
  }

  const sending = state.kind === "sending";
  const sent = state.kind === "ok";
  const stage = stageOf(step);
  const S =
    step === 2 && isPlan
      ? { title: "Your plan", lede: `${planQs.length} questions for your plan. Only the business name and what it sells are needed; for anything else, we use a typical figure and label it as an assumption.` }
      : STUDIO_ORDER_STEPS[step];
  return (
    <div className="od-g">
      <div className="od-main" ref={topRef}>
        <ol className="op-rail" aria-label="Order progress">
          {STUDIO_ORDER_STAGES.map((st, i) => {
            // Details and Review can be revisited until the order is sent;
            // Pay opens only after the terms are accepted and the order sent.
            const to = i === 0 ? 0 : i === 1 ? REVIEW : PAY;
            const open = i === 2 ? sent && stage !== 2 : !sent && i < stage;
            return (
              <li key={st.title} className={i === stage ? "on" : i < stage ? "done" : undefined} aria-current={i === stage ? "step" : undefined}>
                <button type="button" disabled={!open} onClick={() => go(to)}>
                  <span className="op-dot num">{i < stage ? <RiCheckLine size={14} aria-hidden="true" /> : i + 1}</span>
                  <span className="op-t">{st.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="op-bar" aria-hidden="true">
          <i style={{ width: `${((step + 1) / STUDIO_ORDER_STEPS.length) * 100}%` }} />
        </div>

        <form ref={formRef} className="of" onSubmit={onSubmit} encType="multipart/form-data" noValidate>
          <div className="op-head">
            <p className="kick num">
              {stage === 0 ? `Details · part ${step + 1} of ${DETAILS}` : `Step ${stage + 1} of ${STUDIO_ORDER_STAGES.length}`}
            </p>
            <h2 className="disp op-h">{step === PAY ? C.okTitle : S.title}</h2>
            {step === PAY ? <p className="sm">{state.kind === "ok" && !state.ack ? C.okNoAck : C.okText}</p> : <p className="sm">{S.lede}</p>}
          </div>

          {state.kind === "fail" ? (
            <div className="of-fail" role="alert">
              <p>{state.message}</p>
            </div>
          ) : null}

          {/* Hidden from people; a bot that fills it is thanked and ignored. */}
          <div className="of-trap" aria-hidden="true">
            <label>
              Company website
              <input type="text" name={STUDIO_ORDER_TRAP} tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          <fieldset className="of-set op-step" hidden={step !== 0}>
            <legend className="sr-only">Package</legend>
            <div className="op-cards" role="radiogroup" aria-label="Package">
              {STUDIO_PRICE_ROWS.map((r) => {
                const z = studioRowZar(r);
                return (
                  <label key={r.name} className={`op-card${r.lead ? " lead" : ""}${service === r.name ? " on" : ""}`}>
                    <input type="radio" name="service" value={r.name} checked={service === r.name} onChange={() => setService(r.name)} />
                    <span className="op-card-t">
                      <b>{r.name}</b>
                      <span className="sm">{r.what}</span>
                      {r.lead ? <span className="op-tag">Forever hosting included</span> : null}
                    </span>
                    <span className="op-card-p num">
                      {r.price.kind === "deal" ? <s>{studioMoney(STUDIO_DEAL_ZAR.normal, cur, usdPerZar)}</s> : null}
                      <b>{z === null ? "Quoted" : studioMoney(z, cur, usdPerZar)}</b>
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.service ? <small className="of-err">{errors.service}</small> : null}
          </fieldset>

          <fieldset className="of-set op-step" hidden={step !== 1}>
            <legend className="sr-only">Add-ons</legend>
            <div className="op-cards">
              {STUDIO_ADDONS.map((a) => {
                const z = studioAddonZar(a, row);
                const on = addons.includes(a.name);
                if (z === 0)
                  return (
                    <div key={a.name} className="op-card op-card-inc">
                      <svg className="op-tick" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span className="op-card-t">
                        <b>{a.label}</b>
                        <span className="sm">{a.what}</span>
                      </span>
                      <span className="op-card-p num">
                        <b>Included</b>
                      </span>
                    </div>
                  );
                return (
                  <label key={a.name} className={`op-card${on ? " on" : ""}`}>
                    <input type="checkbox" name={a.name} value="yes" checked={on} onChange={() => toggleAddon(a.name)} />
                    <span className="op-card-t">
                      <b>{a.label}</b>
                      <span className="sm">{a.what}</span>
                    </span>
                    <span className="op-card-p num">
                      {a.wasZar ? <s>{studioMoney(a.wasZar, cur, usdPerZar)}</s> : null}{" "}
                      <b>{z === 0 ? "Included" : `+ ${studioMoney(z, cur, usdPerZar)}`}</b>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="of-grid">
              {addons.includes("designLogo") ? (
                <div className="of-sub of-wide" role="radiogroup" aria-labelledby="of-logoKind-q">
                  <p id="of-logoKind-q">{STUDIO_ORDER_LOGO.question}</p>
                  <Choice name={STUDIO_ORDER_LOGO.name} options={STUDIO_ORDER_LOGO.options} value={logoKind} onPick={(v) => setLogoKind(v as "new" | "redesign")} />
                  {errors[STUDIO_ORDER_LOGO.name] ? <small className="of-err">{errors[STUDIO_ORDER_LOGO.name]}</small> : null}
                </div>
              ) : null}
              <div className="of-f">
                <label htmlFor="of-logo">
                  {addons.includes("designLogo") && logoKind === "redesign" ? (
                    <>
                      {STUDIO_ORDER_LOGO.upload}
                      <em aria-hidden="true"> *</em>
                    </>
                  ) : (
                    "Your logo, if you have one"
                  )}
                </label>
                <input id="of-logo" type="file" name="logo" accept={STUDIO_ORDER_ACCEPT} multiple onChange={(e) => void onFiles("logo", e.currentTarget.files)} aria-invalid={errors.logo ? true : undefined} />
                {errors.logo ? <small className="of-err">{errors.logo}</small> : addons.includes("designLogo") && logoKind === "redesign" ? <small className="fine">{STUDIO_ORDER_LOGO.uploadHint}</small> : null}
                <Flag name="noLogo" />
              </div>
              <div className="of-f">
                <label htmlFor="of-photos">Photos you can supply</label>
                <input id="of-photos" type="file" name="photos" accept={STUDIO_ORDER_ACCEPT} multiple onChange={(e) => void onFiles("photos", e.currentTarget.files)} />
                <small className="fine">{C.photosNone}</small>
              </div>
            </div>
            {Object.values(photoWarnings).flat().length ? (
              <ul className="of-warn" role="status">
                {Object.values(photoWarnings)
                  .flat()
                  .map((w) => (
                    <li key={w}>{w}</li>
                  ))}
              </ul>
            ) : null}
            <small className={errors.files ? "of-err" : "fine"}>{errors.files || C.filesHint}</small>
          </fieldset>

          <fieldset className="of-set op-step" hidden={step !== 2}>
            <legend className="sr-only">Your business</legend>
            <div className="of-grid">
              <Field name="business" errors={errors} />
              <Field name="sells" errors={errors} />
              <Field name="area" errors={errors} />
              {isPlan ? null : <StudioColourPicker error={errors.colour} />}
            </div>
            {/* 1.20.8: a plan order asks the plan intake's questions instead of the website ones. */}
            {isPlan ? (
              <div className="of-grid of-plan">
                {planQs.flatMap((q) =>
                  q.fields
                    .filter((f) => f.startsWith("plan"))
                    .map((f) =>
                      f === "planType" ? (
                        <SelectField key={f} name={f} options={STUDIO_PLAN_TYPES} errors={errors} />
                      ) : f === "planFor" ? (
                        <SelectField key={f} name={f} options={STUDIO_PLAN_FOR} errors={errors} />
                      ) : (
                        <Field key={f} name={f} errors={errors} />
                      ),
                    ),
                )}
              </div>
            ) : null}
            <div hidden={isPlan}>
            <div className="of-pages" role="group" aria-label="Pages you want">
              {STUDIO_ORDER_PAGES.map((p) => (
                <label className="of-chip" key={p}>
                  <input type="checkbox" name="pages" value={p} />
                  <span>{p}</span>
                </label>
              ))}
            </div>
            <div className="of-grid">
              <Field name="pagesOther" errors={errors} />
            </div>
            {/* 1.21.2 (Ray): one domain box, checked as the client types. */}
            <div className="of-grid">
              <div className="of-f of-wide of-domain">
                <label htmlFor="of-domain">{FIELD.domain.label}</label>
                <div className="of-dom-row">
                  <input
                    id="of-domain"
                    name="domain"
                    type="text"
                    inputMode="url"
                    autoCapitalize="off"
                    spellCheck={false}
                    maxLength={FIELD.domain.max}
                    placeholder={FIELD.domain.placeholder}
                    value={domainText}
                    onChange={(e) => setDomainText(e.currentTarget.value)}
                    aria-invalid={errors.domain ? true : undefined}
                    aria-describedby="of-domain-note of-domain-status"
                  />
                  <span id="of-domain-status" className={`of-dom-st${domainResult ? ` is-${domainResult}` : ""}`} role="status" aria-live="polite">
                    {domainName && domainResult ? (domainResult === "checking" ? "Checking…" : STUDIO_DOMAIN_CHECK_TEXT[domainResult]) : ""}
                  </span>
                </div>
                <small id="of-domain-note" className={errors.domain ? "of-err" : "fine"}>
                  {errors.domain || FIELD.domain.hint}
                </small>
              </div>
            </div>
            <input type="hidden" name="domainCheck" value={domainResult && domainResult !== "checking" ? domainResult : ""} />
            <input type="hidden" name="wantedDomain" value={ownAnswer === "no" ? domainName : ""} />
            {domainName && domainFree ? (
              <>
                <input type="hidden" name={STUDIO_ORDER_DOMAIN.name} value="no" />
                <p className="fine">{STUDIO_ORDER_DOMAIN.needsOne}</p>
              </>
            ) : null}
            {domainName && !domainFree ? (
              <div className="of-sub of-wide" role="radiogroup" aria-labelledby="of-hasDomain-q">
                <p id="of-hasDomain-q">{STUDIO_ORDER_DOMAIN.question}</p>
                <Choice name={STUDIO_ORDER_DOMAIN.name} options={STUDIO_ORDER_DOMAIN.options} value={hasDomain} onPick={(v) => setHasDomain(v as "yes" | "no")} />
                {errors[STUDIO_ORDER_DOMAIN.name] ? <small className="of-err">{errors[STUDIO_ORDER_DOMAIN.name]}</small> : null}
                {hasDomain === "yes" ? (
                  <>
                    <Field name="domainManager" errors={errors} />
                    <small className="fine">{STUDIO_ORDER_DOMAIN.hasOne}</small>
                  </>
                ) : hasDomain === "no" ? (
                  <small className="fine">{domainResult === "taken" ? STUDIO_ORDER_DOMAIN.notTheirs : STUDIO_ORDER_DOMAIN.needsOne}</small>
                ) : null}
              </div>
            ) : null}
            <div className="of-grid">
              <Field name="likes" errors={errors} />
              <Field name="asks" errors={errors} />
            </div>
            </div>
          </fieldset>

          <fieldset className="of-set op-step" hidden={step !== 3}>
            <legend className="sr-only">Contact</legend>
            <div className="of-grid">
              <Field name="name" errors={errors} />
              <Field name="email" errors={errors} />
              <Field name="phone" errors={errors} />
              <Field name="siteContact" errors={errors} />
              <Field name="notes" errors={errors} />
            </div>
          </fieldset>

          <fieldset className="of-set op-step" hidden={step !== REVIEW} disabled={sent}>
            <legend className="sr-only">Review</legend>
            <dl className="op-review">
              <div>
                <dt>Package</dt>
                <dd>{service}</dd>
              </div>
              <div>
                <dt>Add-ons</dt>
                <dd>{STUDIO_ADDONS.filter((a) => addons.includes(a.name)).map((a) => a.label).join(", ") || "None"}</dd>
              </div>
              {review.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <div className="op-review-total">
                <dt>Total, once-off</dt>
                <dd className="num">{totalText}</dd>
              </div>
            </dl>
            <ul className="op-keys">
              <li>
                <RiShieldCheckLine size={20} aria-hidden="true" />
                <span>{promise}</span>
              </li>
              {keyTerms.map((t) => (
                <li key={t.b}>
                  <RiCheckLine size={20} aria-hidden="true" />
                  <span>
                    <b>{t.b}.</b> {t.t}
                  </span>
                </li>
              ))}
            </ul>
            <details className="op-terms">
              <summary>{C.termsTitle}</summary>
              <ol className="terms od-terms">
                {terms.map((t) => (
                  <li key={t.b}>
                    <b>{t.b}</b>
                    <span>{t.t}</span>
                  </li>
                ))}
              </ol>
              <p className="fine">{C.termsNote}</p>
            </details>
            <label className="of-check op-accept">
              <input type="checkbox" name="terms" value="yes" checked={accepted} onChange={(e) => setAccepted(e.currentTarget.checked)} aria-invalid={errors.terms ? true : undefined} />
              <span>
                I accept the{" "}
                <a href={C.termsHref} target="_blank" rel="noopener">
                  terms
                </a>
                . <em aria-hidden="true">*</em>
              </span>
            </label>
            {errors.terms ? <small className="of-err">{errors.terms}</small> : null}
            <p className="fine">
              {total === null
                  ? "We email your order to our team and send you a quote before any payment."
                  : "We email your order to our team, then you pay: bank transfer or card."}
            </p>
          </fieldset>

          {/* 1.21.2 (Ray): Pay, only after the terms are accepted and the order email has gone. */}
          <section className="op-step op-pay" hidden={step !== PAY}>
            {state.kind === "ok" ? (
              <>
                <p className="kick">{C.okRef}</p>
                <p className="of-ref num">{state.ref}</p>
                <StudioPayStep refCode={state.ref} total={state.total} card={state.card} pay={pay} info={state.info} />
                <p className="fine">
                  <a href={`${STUDIO_STATUS_HREF}?ref=${encodeURIComponent(state.ref)}`}>Your order status</a>
                </p>
              </>
            ) : null}
          </section>

          {step === PAY ? null : (
            <div className="op-nav">
              {step > 0 ? (
                <button type="button" className="btn btn-line" onClick={() => go(step - 1)}>
                  <RiArrowLeftLine size={18} aria-hidden="true" />
                  Back
                </button>
              ) : (
                <span />
              )}
              {step < REVIEW ? (
                <button type="submit" className="btn btn-ink">
                  {step === REVIEW - 1 ? "Next: Review" : `Next: ${STUDIO_ORDER_STEPS[step + 1].title}`}
                  <RiArrowRightLine size={18} aria-hidden="true" />
                </button>
              ) : (
                <button className="btn btn-acc" type="submit" disabled={sending || !accepted} aria-busy={sending}>
                  <RiMailSendLine size={18} aria-hidden="true" />
                  {sending ? C.sending : C.submit}
                </button>
              )}
            </div>
          )}
        </form>
      </div>
      <aside className="od-side">
        <StudioOrderSummary service={service} addons={addons} step={step} />
      </aside>
    </div>
  );
}
