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

// The studio order form (hosting_sdk 1.18.0): the intake questions, the
// logo and photo uploads, the outside-the-special choices and the terms
// box, posted as multipart to /api/studio/order. The server checks
// everything again; this side only saves a round trip. Any failure (SMTP
// not set up, a send that failed, a bad answer, a network error, a reply
// that is not JSON) shows a plain message and a WhatsApp button carrying
// the order's gist, and the answers stay in the form for another try.
"use client";

import { useRef, useState, type FormEvent } from "react";

import { studioWhatsApp } from "./studio-copy";
import {
  STUDIO_ORDER_ACCEPT,
  STUDIO_ORDER_API,
  STUDIO_ORDER_COPY,
  STUDIO_ORDER_FIELDS,
  STUDIO_ORDER_FILE_TYPES,
  STUDIO_ORDER_FLAGS,
  STUDIO_ORDER_MAX_BYTES,
  STUDIO_ORDER_MAX_FILES,
  STUDIO_ORDER_MESSAGES,
  STUDIO_ORDER_PAGES,
  STUDIO_ORDER_SERVICES,
  STUDIO_ORDER_TRAP,
  type StudioOrderField,
} from "./studio-order";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "ok"; ref: string; ack: boolean }
  | { kind: "fail"; message: string; whatsapp: string; errors: Record<string, string> };

const C = STUDIO_ORDER_COPY;
const FIELD = Object.fromEntries(STUDIO_ORDER_FIELDS.map((f) => [f.name, f])) as Record<string, StudioOrderField>;
const FLAG = Object.fromEntries(STUDIO_ORDER_FLAGS.map((f) => [f.name, f.label])) as Record<string, string>;

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
    required: f.required,
    maxLength: f.max,
    placeholder: f.placeholder,
    "aria-invalid": err ? true : undefined,
    "aria-describedby": err || f.hint ? `${id}-note` : undefined,
  };
  return (
    <div className={f.kind === "textarea" ? "of-f of-wide" : "of-f"}>
      <label htmlFor={id}>
        {f.label}
        {f.required ? <em aria-hidden="true"> *</em> : null}
      </label>
      {f.kind === "select" ? (
        <select {...common} defaultValue={STUDIO_ORDER_SERVICES[0]}>
          {STUDIO_ORDER_SERVICES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ) : f.kind === "textarea" ? (
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

export function StudioOrderForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.kind === "fail" ? state.errors : {};

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const files = [...form.getAll("logo"), ...form.getAll("photos")].filter((v): v is File => v instanceof File && v.size > 0);
    const wa = gist(form);
    const total = files.reduce((n, f) => n + f.size, 0);
    if (files.length > STUDIO_ORDER_MAX_FILES || total > STUDIO_ORDER_MAX_BYTES) {
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
      let body: { ok?: boolean; ref?: string; ack?: boolean; message?: string; whatsapp?: string; errors?: Record<string, string> } = {};
      try {
        body = await res.json();
      } catch {
        body = {};
      }
      if (res.ok && body.ok) {
        setState({ kind: "ok", ref: body.ref ?? "", ack: body.ack !== false });
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
  return (
    <form ref={formRef} className="of" onSubmit={onSubmit} encType="multipart/form-data" noValidate={false}>
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

      <fieldset className="of-set">
        <legend className="kick">You and your order</legend>
        <div className="of-grid">
          <Field name="service" errors={errors} />
          <Field name="name" errors={errors} />
          <Field name="email" errors={errors} />
          <Field name="phone" errors={errors} />
        </div>
      </fieldset>

      <fieldset className="of-set">
        <legend className="kick">Your business</legend>
        <div className="of-grid">
          <Field name="business" errors={errors} />
          <Field name="sells" errors={errors} />
          <Field name="area" errors={errors} />
          <Field name="colour" errors={errors} />
          <Field name="likes" errors={errors} />
        </div>
      </fieldset>

      <fieldset className="of-set">
        <legend className="kick">Logo and photos</legend>
        <div className="of-grid">
          <div className="of-f">
            <label htmlFor="of-logo">Your logo</label>
            <input id="of-logo" type="file" name="logo" accept={STUDIO_ORDER_ACCEPT} multiple />
            <Flag name="noLogo" />
            <Flag name="designLogo" />
          </div>
          <div className="of-f">
            <label htmlFor="of-photos">Photos you can supply</label>
            <input id="of-photos" type="file" name="photos" accept={STUDIO_ORDER_ACCEPT} multiple />
            <Flag name="stockPhotos" />
          </div>
        </div>
        <small className={errors.files ? "of-err" : "fine"}>{errors.files || C.filesHint}</small>
      </fieldset>

      <fieldset className="of-set">
        <legend className="kick">Your site</legend>
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
          <Field name="siteContact" errors={errors} />
          <Field name="asks" errors={errors} />
          <Field name="notes" errors={errors} />
        </div>
      </fieldset>

      <fieldset className="of-set">
        <legend className="kick">Anything more?</legend>
        <Flag name="wantShop" />
        <Flag name="wantApp" />
        <p className="fine">{C.outsideSpecial}</p>
      </fieldset>

      <div className="of-end">
        <label className="of-check">
          <input type="checkbox" name="terms" value="yes" required aria-invalid={errors.terms ? true : undefined} />
          <span>
            I have read and accept the terms. <em aria-hidden="true">*</em>
          </span>
        </label>
        {errors.terms ? <small className="of-err">{errors.terms}</small> : null}
        <button className="btn btn-acc" type="submit" disabled={sending} aria-busy={sending}>
          {sending ? C.sending : C.submit}
        </button>
      </div>
    </form>
  );
}
