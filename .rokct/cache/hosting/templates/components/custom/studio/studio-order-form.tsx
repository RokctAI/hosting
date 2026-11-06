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
// and the package has a fixed price, studio-pay.ts sends the browser to
// PayFast. Any failure shows a plain message and a WhatsApp button, and the
// answers stay in the form.
"use client";

import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiLockLine,
  RiMailSendLine,
  RiShieldCheckLine,
} from "@remixicon/react";
import { useMemo, useRef, useState, type FormEvent } from "react";

import { useStudioCurrency } from "./studio-client";
import { STUDIO_ADDONS, STUDIO_DEAL_ZAR, STUDIO_PRICE_ROWS, studioAddonZar, studioMoney, studioOrderZar, studioRowZar, studioWhatsApp } from "./studio-copy";
import {
  STUDIO_ORDER_ACCEPT,
  STUDIO_DOMAIN_API,
  STUDIO_DOMAIN_CHECK_NOTE,
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
  studioCleanDomain,
  studioDomainEnding,
  type StudioDomainCheck,
  type StudioOrderField,
  type StudioOrderTerm,
} from "./studio-order";
import { studioPay, studioPayConfig } from "./studio-pay";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "ok"; ref: string; ack: boolean }
  | { kind: "fail"; message: string; whatsapp: string; errors: Record<string, string> };

const C = STUDIO_ORDER_COPY;
const FIELD = Object.fromEntries(STUDIO_ORDER_FIELDS.map((f) => [f.name, f])) as Record<string, StudioOrderField>;
const FLAG = Object.fromEntries(STUDIO_ORDER_FLAGS.map((f) => [f.name, f.label])) as Record<string, string>;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const STUDIO_ORDER_STEPS = [
  { title: "Package", lede: "Pick what you are ordering. Prices are once-off." },
  { title: "Add-ons", lede: "Add what you need. The total updates as you go." },
  { title: "Your business", lede: "Only the starred answers are needed. We fill any gap sensibly and show you in the render." },
  { title: "Contact", lede: "Where we send your brief, your copy and the terms." },
  { title: "Review and pay", lede: "Check your order, then send it." },
] as const;
// The answers each step checks before Next.
const STEP_REQUIRED: readonly string[][] = [["service"], [], ["business", "sells"], ["name", "email"], ["terms"]];

const PAY = studioPayConfig();

function gist(form: FormData): string {
  const s = (k: string) => String(form.get(k) ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
  const parts = ["Hi ROKCT, I tried the order form."];
  if (s("service")) parts.push(`I'd like: ${s("service")}.`);
  if (s("business")) parts.push(`Business: ${s("business")}.`);
  if (s("name")) parts.push(`My name: ${s("name")}.`);
  return studioWhatsApp(parts.join(" "));
}

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
  const { cur } = useStudioCurrency();
  const row = STUDIO_PRICE_ROWS.find((r) => r.name === service);
  const base = studioRowZar(row);
  const total = studioOrderZar(service, addons);
  const picked = STUDIO_ADDONS.filter((a) => addons.includes(a.name));
  const totalText = total === null ? "Quoted" : studioMoney(total, cur);
  return (
    <>
      <div className="os-card" aria-live="polite">
        <p className="kick">Your order</p>
        <ul className="os-lines">
          <li>
            <span>{service || "No package yet"}</span>
            <b className="num">{base === null ? "Quoted" : studioMoney(base, cur)}</b>
          </li>
          {picked.map((a) => {
            const z = studioAddonZar(a, row);
            return (
              <li key={a.name}>
                <span>{a.label}</span>
                <b className="num">{z === 0 ? "Included" : `+ ${studioMoney(z, cur)}`}</b>
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
            Step {step + 1} of {STUDIO_ORDER_STEPS.length} · {picked.length ? `${picked.length} add-on${picked.length > 1 ? "s" : ""}` : "Total"}
          </small>
          <b className="num">{totalText}</b>
        </div>
        <span className="os-bar-tag">Forever hosting</span>
      </div>
    </>
  );
}

export function StudioOrderForm({ terms, promise }: { terms: StudioOrderTerm[]; promise: string }) {
  const { cur } = useStudioCurrency();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [step, setStep] = useState(0);
  const [service, setService] = useState(STUDIO_PRICE_ROWS[0].name);
  const [addons, setAddons] = useState<string[]>([]);
  const [hasDomain, setHasDomain] = useState<"" | "yes" | "no">("");
  // The availability check of the wanted domain: the name it was for, and its result.
  const [domainCheck, setDomainCheck] = useState<{ name: string; result: StudioDomainCheck | "checking" } | null>(null);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [review, setReview] = useState<[string, string][]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const errors = state.kind === "fail" ? { ...state.errors, ...stepErrors } : stepErrors;
  const row = STUDIO_PRICE_ROWS.find((r) => r.name === service);
  const total = studioOrderZar(service, addons);
  const totalText = total === null ? "Quoted" : studioMoney(total, cur);
  const canPay = PAY.enabled && total !== null && total > 0;
  const keyTerms = useMemo(() => terms.filter((t) => /cancel/i.test(t.b)), [terms]);

  function check(i: number): Record<string, string> {
    const form = formRef.current;
    if (!form) return {};
    const data = new FormData(form);
    const out: Record<string, string> = {};
    for (const name of STEP_REQUIRED[i]) {
      const v = String(data.get(name) ?? "").trim();
      if (!v) out[name] = name === "terms" ? "Please accept the terms to send your order." : "Needed to start your brief.";
      else if (name === "email" && !EMAIL.test(v)) out[name] = "That email doesn't look right.";
    }
    // The domain step: "Yes" needs the domain itself, "No" the name wanted; .co.za or .com only.
    if (i === 2) {
      const answer = data.get(STUDIO_ORDER_DOMAIN.name);
      const field = answer === "yes" ? "domain" : answer === "no" ? "wantedDomain" : "";
      const typed = field ? String(data.get(field) ?? "").trim() : "";
      if (field && !typed) out[field] = answer === "yes" ? "Needed: the domain you have." : "Needed: the name you want.";
      else if (field && !studioDomainEnding(studioCleanDomain(typed))) out[field] = STUDIO_DOMAIN_ENDING_ERROR;
    }
    return out;
  }

  // Asks the server whether the wanted name is free. A failed check is
  // "unknown" and never stops the order.
  async function checkWanted(raw: string) {
    const name = studioCleanDomain(raw);
    if (!name || !studioDomainEnding(name)) {
      setDomainCheck(null);
      return;
    }
    if (domainCheck?.name === name && domainCheck.result !== "checking") return;
    setDomainCheck({ name, result: "checking" });
    let result: StudioDomainCheck = "unknown";
    try {
      const res = await fetch(`${STUDIO_DOMAIN_API}?name=${encodeURIComponent(name)}`, { cache: "no-store" });
      const body = (await res.json()) as { result?: string };
      if (body.result === "available" || body.result === "taken") result = body.result;
    } catch {
      result = "unknown";
    }
    setDomainCheck((cur) => (cur?.name === name ? { name, result } : cur));
  }

  function go(to: number) {
    setStep(to);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function next() {
    const errs = check(step);
    setStepErrors(errs);
    if (Object.keys(errs).length) {
      const first = formRef.current?.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`);
      first?.focus();
      return;
    }
    if (step === STUDIO_ORDER_STEPS.length - 2 && formRef.current) {
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
              s(STUDIO_ORDER_DOMAIN.name) === "yes"
                ? [s("domain"), s("registrar") && `registered at ${s("registrar")}`].filter(Boolean).join(", ")
                : s(STUDIO_ORDER_DOMAIN.name) === "no"
                  ? [
                      `You want ${s("wantedDomain")}`,
                      domainCheck && domainCheck.result !== "checking" ? STUDIO_DOMAIN_CHECK_TEXT[domainCheck.result] : "",
                    ]
                      .filter(Boolean)
                      .join(": ")
                  : "",
            ],
            ["Name", s("name")],
            ["Email", s("email")],
            ["WhatsApp", s("phone")],
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
    if (step < STUDIO_ORDER_STEPS.length - 1) return next();
    const errs = check(step);
    setStepErrors(errs);
    if (Object.keys(errs).length) return;
    const form = new FormData(e.currentTarget);
    form.set("total", total === null ? "Quoted" : `R${total} (${studioMoney(total, cur)} shown)`);
    const files = [...form.getAll("logo"), ...form.getAll("photos")].filter((v): v is File => v instanceof File && v.size > 0);
    const wa = gist(form);
    const size = files.reduce((n, f) => n + f.size, 0);
    if (files.length > STUDIO_ORDER_MAX_FILES || size > STUDIO_ORDER_MAX_BYTES) {
      setState({ kind: "fail", message: STUDIO_ORDER_MESSAGES.tooLarge, whatsapp: wa, errors: { files: C.filesHint } });
      return;
    }
    if (files.some((f) => !(f.type in STUDIO_ORDER_FILE_TYPES))) {
      setState({ kind: "fail", message: STUDIO_ORDER_MESSAGES.invalid, whatsapp: wa, errors: { files: "Pictures or PDF only" } });
      return;
    }
    setState({ kind: "sending" });
    try {
      const res = await fetch(STUDIO_ORDER_API, { method: "POST", body: form });
      let body: { ok?: boolean; ref?: string; ack?: boolean; message?: string; errors?: Record<string, string> } = {};
      try {
        body = await res.json();
      } catch {
        body = {};
      }
      if (res.ok && body.ok) {
        const ref = body.ref ?? "";
        if (canPay && total !== null) {
          studioPay({
            amountZar: total,
            itemName: `ROKCT ${service}`,
            ref,
            email: String(form.get("email") ?? ""),
            name: String(form.get("name") ?? ""),
            pageUrl: `${window.location.origin}${window.location.pathname}`,
          });
          return;
        }
        setState({ kind: "ok", ref, ack: body.ack !== false });
        formRef.current?.reset();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setState({
        kind: "fail",
        message: body.message || (res.status === 413 ? STUDIO_ORDER_MESSAGES.tooLarge : STUDIO_ORDER_MESSAGES.sendFailed),
        whatsapp: wa,
        errors: body.errors ?? {},
      });
    } catch {
      setState({ kind: "fail", message: STUDIO_ORDER_MESSAGES.sendFailed, whatsapp: wa, errors: {} });
    }
  }

  if (state.kind === "ok") {
    return (
      <div className="of-done" role="status">
        <p className="kick">{C.okRef}</p>
        <p className="of-ref num">{state.ref}</p>
        <h2 className="disp of-done-h">{C.okTitle}</h2>
        <p className="lede">{state.ack ? C.okText : C.okNoAck}</p>
      </div>
    );
  }

  const sending = state.kind === "sending";
  const last = STUDIO_ORDER_STEPS.length - 1;
  const S = STUDIO_ORDER_STEPS[step];
  return (
    <div className="od-g">
      <div className="od-main" ref={topRef}>
        <ol className="op-rail" aria-label="Order progress">
          {STUDIO_ORDER_STEPS.map((st, i) => (
            <li key={st.title} className={i === step ? "on" : i < step ? "done" : undefined} aria-current={i === step ? "step" : undefined}>
              <button type="button" disabled={i >= step} onClick={() => go(i)}>
                <span className="op-dot num">{i < step ? <RiCheckLine size={14} aria-hidden="true" /> : i + 1}</span>
                <span className="op-t">{st.title}</span>
              </button>
            </li>
          ))}
        </ol>
        <div className="op-bar" aria-hidden="true">
          <i style={{ width: `${((step + 1) / STUDIO_ORDER_STEPS.length) * 100}%` }} />
        </div>

        <form ref={formRef} className="of" onSubmit={onSubmit} encType="multipart/form-data" noValidate>
          <div className="op-head">
            <p className="kick num">
              Step {step + 1} of {STUDIO_ORDER_STEPS.length}
            </p>
            <h2 className="disp op-h">{S.title}</h2>
            <p className="sm">{S.lede}</p>
          </div>

          {state.kind === "fail" ? (
            <div className="of-fail" role="alert">
              <p>{state.message}</p>
              <a className="btn btn-acc btn-sm" href={state.whatsapp}>
                {C.failWhatsApp}
              </a>
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
                      {r.price.kind === "deal" ? <s>{studioMoney(STUDIO_DEAL_ZAR.normal, cur)}</s> : null}
                      <b>{z === null ? "Quoted" : studioMoney(z, cur)}</b>
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
                      <b>{z === 0 ? "Included" : `+ ${studioMoney(z, cur)}`}</b>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="of-grid">
              <div className="of-f">
                <label htmlFor="of-logo">Your logo, if you have one</label>
                <input id="of-logo" type="file" name="logo" accept={STUDIO_ORDER_ACCEPT} multiple />
                <Flag name="noLogo" />
              </div>
              <div className="of-f">
                <label htmlFor="of-photos">Photos you can supply</label>
                <input id="of-photos" type="file" name="photos" accept={STUDIO_ORDER_ACCEPT} multiple />
              </div>
            </div>
            <small className={errors.files ? "of-err" : "fine"}>{errors.files || C.filesHint}</small>
            <div className="op-more">
              <Flag name="wantShop" />
              <Flag name="wantApp" />
              <p className="fine">{C.outsideSpecial}</p>
            </div>
          </fieldset>

          <fieldset className="of-set op-step" hidden={step !== 2}>
            <legend className="sr-only">Your business</legend>
            <div className="of-grid">
              <Field name="business" errors={errors} />
              <Field name="sells" errors={errors} />
              <Field name="area" errors={errors} />
              <Field name="colour" errors={errors} />
            </div>
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
            <div className="of-f of-wide of-domain" role="radiogroup" aria-labelledby="of-hasDomain-q">
              <p id="of-hasDomain-q">{STUDIO_ORDER_DOMAIN.question}</p>
              {STUDIO_ORDER_DOMAIN.options.map((o) => (
                <label className="of-check" key={o.value}>
                  <input
                    type="radio"
                    name={STUDIO_ORDER_DOMAIN.name}
                    value={o.value}
                    checked={hasDomain === o.value}
                    onChange={() => setHasDomain(o.value)}
                  />
                  <span>{o.label}</span>
                </label>
              ))}
              {errors[STUDIO_ORDER_DOMAIN.name] ? <small className="of-err">{errors[STUDIO_ORDER_DOMAIN.name]}</small> : null}
            </div>
            {/* Stays mounted when hidden, like every step; the server drops these unless "Yes". */}
            <div className="of-grid" hidden={hasDomain !== "yes"}>
              <Field name="domain" errors={errors} />
              <Field name="registrar" errors={errors} />
            </div>
            <div className="of-grid" hidden={hasDomain !== "no"} onBlur={(e) => {
                const t = e.target as HTMLInputElement;
                if (t.name === "wantedDomain") void checkWanted(t.value);
              }}>
              <Field name="wantedDomain" errors={errors} />
            </div>
            <input
              type="hidden"
              name="domainCheck"
              value={domainCheck && domainCheck.result !== "checking" ? domainCheck.result : ""}
            />
            <p className="fine" role="status" aria-live="polite">
              {hasDomain === "no" && domainCheck
                ? `${domainCheck.name}: ${domainCheck.result === "checking" ? "checking..." : STUDIO_DOMAIN_CHECK_TEXT[domainCheck.result]}. ${STUDIO_DOMAIN_CHECK_NOTE} `
                : ""}
              {hasDomain === "no" ? STUDIO_ORDER_DOMAIN.needsOne : hasDomain === "yes" ? STUDIO_ORDER_DOMAIN.hasOne : ""}
            </p>
            <div className="of-grid">
              <Field name="likes" errors={errors} />
              <Field name="asks" errors={errors} />
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

          <fieldset className="of-set op-step" hidden={step !== last}>
            <legend className="sr-only">Review and pay</legend>
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
            <label className="of-check">
              <input type="checkbox" name="terms" value="yes" aria-invalid={errors.terms ? true : undefined} />
              <span>
                I have read and accept the terms. <em aria-hidden="true">*</em>
              </span>
            </label>
            {errors.terms ? <small className="of-err">{errors.terms}</small> : null}
            <p className="fine">
              {canPay
                ? "We email your order to our team first, then take you to PayFast to pay securely."
                : total === null
                  ? "We email your order to our team and send you a quote before any payment."
                  : "We email your order to our team and send you payment details."}
            </p>
          </fieldset>

          <div className="op-nav">
            {step > 0 ? (
              <button type="button" className="btn btn-line" onClick={() => go(step - 1)}>
                <RiArrowLeftLine size={18} aria-hidden="true" />
                Back
              </button>
            ) : (
              <span />
            )}
            {step < last ? (
              <button type="submit" className="btn btn-ink">
                Next: {STUDIO_ORDER_STEPS[step + 1].title}
                <RiArrowRightLine size={18} aria-hidden="true" />
              </button>
            ) : (
              <button className="btn btn-acc" type="submit" disabled={sending} aria-busy={sending}>
                {canPay ? <RiLockLine size={18} aria-hidden="true" /> : <RiMailSendLine size={18} aria-hidden="true" />}
                {sending ? C.sending : canPay ? `Pay ${totalText} with PayFast` : C.submit}
              </button>
            )}
          </div>
        </form>
      </div>
      <aside className="od-side">
        <StudioOrderSummary service={service} addons={addons} step={step} />
      </aside>
    </div>
  );
}
