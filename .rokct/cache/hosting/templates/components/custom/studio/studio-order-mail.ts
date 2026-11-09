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

// The two emails one order sends (hosting_sdk 1.18.0), built as plain data
// so the route hands them to the transport and the tests read them:
//
//   * the ORDER, to the orders address: every answer, every file attached,
//     Reply-To the client so a reply reaches them;
//   * the ACKNOWLEDGEMENT, to the client: thanks, what they ordered, the
//     24-hour first render or a full refund, the Terms, and that replies and
//     extra files go to the orders address (Reply-To it).
//
// No figure for a phase is printed unless every step value is set in
// studio-order-config.ts (the slot); until then that block is left out.
// Pure: no transport, no environment, no network.

import { STUDIO_ADDONS, studioOrderZar } from "./studio-copy";
import { STUDIO_BANK, STUDIO_PAY_COPY } from "./studio-pay";
import { studioStepValues } from "./studio-order-config";
import {
  STUDIO_ORDER_DOMAIN,
  STUDIO_DOMAIN_CHECK_NOTE,
  STUDIO_DOMAIN_CHECK_TEXT,
  STUDIO_ORDER_FIELDS,
  STUDIO_ORDER_FLAGS,
  STUDIO_ORDER_PHASES,
  STUDIO_ORDER_PROMISE,
  studioOrderTerms,
  type StudioOrder,
} from "./studio-order";

export interface StudioMailAttachment {
  filename: string;
  contentType: string;
  content: Uint8Array;
}

export interface StudioMail {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
  attachments: StudioMailAttachment[];
}

export interface StudioOrderMails {
  order: StudioMail;
  ack: StudioMail;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function oneLine(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim();
}

function groupZar(n: number): string {
  return "R" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Every answer as [label, value] pairs, in the form's order; missing ones say so. */
export function studioOrderRows(order: StudioOrder): [string, string][] {
  const rows: [string, string][] = [];
  const val = order as unknown as Record<string, unknown>;
  for (const f of STUDIO_ORDER_FIELDS) {
    if (f.name === "pagesOther") {
      const pages = [...order.pages];
      if (order.pagesOther) pages.push(`Other: ${order.pagesOther}`);
      rows.push(["Pages you want", pages.length ? pages.join(", ") : "Not given"]);
      continue;
    }
    if (f.name === "domain") {
      const d = order.hasDomain;
      rows.push([STUDIO_ORDER_DOMAIN.rowLabel, d === "yes" ? "Yes" : d === "no" ? "No, needs one" : "Not given"]);
      if (d === "no") rows.push(["Domain", STUDIO_ORDER_DOMAIN.needsOne]);
    }
    if (f.name === "wantedDomain") {
      if (order.hasDomain === "no") {
        rows.push([f.label, order.wantedDomain || "Not given"]);
        rows.push([
          STUDIO_ORDER_DOMAIN.checkLabel,
          `${STUDIO_DOMAIN_CHECK_TEXT[order.domainCheck || "unknown"]}. ${STUDIO_DOMAIN_CHECK_NOTE}`,
        ]);
      }
      continue;
    }
    if ((f.name === "domain" || f.name === "registrar") && order.hasDomain !== "yes") continue;
    const v = typeof val[f.name] === "string" ? (val[f.name] as string) : "";
    rows.push([f.label, v || "Not given"]);
  }
  for (const fl of STUDIO_ORDER_FLAGS) rows.push([fl.label, order.flags[fl.name] ? "Yes" : "No"]);
  // 1.20.7: the price lines, worked out here from the order (never trusted
  // from the browser), in rand: the amount charged. The logo add-on shows
  // its normal price struck as "normally".
  const picked = STUDIO_ADDONS.filter((a) => order.flags[a.name]);
  for (const a of picked) {
    const z = a.zar ?? null;
    if (z !== null) rows.push([`Price: ${a.label}`, `${groupZar(z)}${a.wasZar ? ` (normally ${groupZar(a.wasZar)})` : ""}`]);
  }
  const charged = studioOrderZar(order.service, picked.map((a) => a.name));
  rows.push(["Total charged (ZAR)", charged === null ? "Quoted" : groupZar(charged)]);
  rows.push(["Files", order.files.length ? order.files.map((f) => `${f.name} (${f.field})`).join(", ") : "None attached"]);
  return rows;
}

const INK = "#17161B";
const MUTED = "#55545C";
const ACC = "#8C1A2D";
const RULE = "#D5D4CD";

function htmlShell(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head><body style="margin:0;background:#F2F1ED;color:${INK};font:16px/1.55 Georgia,'Times New Roman',serif"><div style="max-width:640px;margin:0 auto;padding:28px 20px">${body}<p style="margin:32px 0 0;font:13px/1.5 Arial,sans-serif;color:${MUTED}">CORTEX · Your brand, taken seriously.</p></div></body></html>`;
}

function htmlTable(rows: [string, string][]): string {
  const tr = rows
    .map(
      ([k, v]) =>
        `<tr><th align="left" valign="top" style="padding:8px 12px 8px 0;border-bottom:1px solid ${RULE};font:600 13px/1.4 Arial,sans-serif;color:${MUTED};width:38%">${esc(k)}</th><td valign="top" style="padding:8px 0;border-bottom:1px solid ${RULE};white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse">${tr}</table>`;
}

function h(text: string): string {
  return `<h2 style="margin:28px 0 10px;font:700 13px/1.3 Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${ACC}">${esc(text)}</h2>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 12px">${esc(text)}</p>`;
}

/** Builds both emails for one checked order. */
export function buildStudioOrderMails(
  order: StudioOrder,
  attachments: StudioMailAttachment[],
  cfg: { from: string; ordersEmail: string },
  ref: string,
  stepValues: readonly (number | null)[] | undefined = undefined,
  /** 1.20.7: how to pay, both options: the bank account number (or null) and the card link (or null when off). */
  pay: { account: string | null; cardUrl: string | null } = { account: null, cardUrl: null },
): StudioOrderMails {
  const rows = studioOrderRows(order);
  const who = oneLine(order.name);
  const biz = oneLine(order.business);
  const service = oneLine(order.service);
  const terms = studioOrderTerms(cfg.ordersEmail);
  const values = stepValues === undefined ? studioStepValues() : studioStepValues(stepValues);

  // ---- The order, to the studio --------------------------------------------
  const orderSubject = `New order ${ref}: ${service} for ${biz}`;
  const orderText = [
    `New CORTEX order ${ref}`,
    "",
    ...rows.map(([k, v]) => `${k}:\n  ${v.replace(/\n/g, "\n  ")}`),
    "",
    `Reply to this email to reach ${who} at ${order.email}.`,
  ].join("\n");
  const orderHtml = htmlShell(
    orderSubject,
    `<p style="margin:0 0 6px;font:600 12px/1.3 Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${ACC}">New order · ${esc(ref)}</p>` +
      `<h1 style="margin:0 0 18px;font:700 26px/1.2 Arial,sans-serif">${esc(service)} for ${esc(biz)}</h1>` +
      htmlTable(rows) +
      `<p style="margin:18px 0 0;font:14px/1.5 Arial,sans-serif;color:${MUTED}">Reply to this email to reach ${esc(who)} at ${esc(order.email)}. ${attachments.length} file(s) attached.</p>`,
  );

  // 1.20.7: both payment options, with the order reference as the payment
  // reference; the amount is the rand total worked out from the order.
  const P = STUDIO_PAY_COPY;
  const due = studioOrderZar(order.service, STUDIO_ADDONS.filter((x) => order.flags[x.name]).map((x) => x.name));
  const payLines = [
    due === null ? "Amount: quoted by our team before you pay." : `Amount: ${groupZar(due)} (ZAR).`,
    `${P.bankTitle}: ${STUDIO_BANK.holder}, ${STUDIO_BANK.bank}, branch ${STUDIO_BANK.branch}, account ${pay.account ?? "(our team emails you the number)"}. Reference: ${ref}.`,
    pay.cardUrl && due !== null ? `${P.cardTitle}: pay securely with PayFast at ${pay.cardUrl}` : `${P.cardTitle}: ${P.cardSoon}`,
  ];

  // ---- The acknowledgement, to the client -----------------------------------
  const ackSubject = `Thank you, we have your order (${ref}) · CORTEX`;
  const mine = rows.filter(([k]) => k !== "Your email");
  const valueLines = values ? STUDIO_ORDER_PHASES.map((ph, i) => `${i + 1}. ${ph}: ${groupZar(values[i])}`) : [];
  const ackText = [
    `Hi ${who},`,
    "",
    `Thank you for your order. We have everything you sent, and your reference is ${ref}.`,
    "",
    "WHAT YOU ORDERED",
    `${service} for ${biz}.`,
    ...mine.map(([k, v]) => `${k}: ${v.replace(/\n/g, " ")}`),
    "",
    "WHAT HAPPENS NEXT",
    "We turn your answers into a one-page brief and send it back for you to confirm. Pay the full price (how to pay is below) before work starts.",
    STUDIO_ORDER_PROMISE,
    "",
    ...(values ? ["WHAT EACH PHASE IS WORTH", ...valueLines, ""] : []),
    "THE TERMS",
    ...terms.map((t, i) => `${i + 1}. ${t.b}: ${t.t}`),
    "",
    "HOW TO PAY",
    ...payLines,
    "",
    "REPLIES AND EXTRA FILES",
    `Reply to this email, or send replies and extra files (logos, photos) to ${cfg.ordersEmail}, with your reference ${ref}.`,
    "",
    "CORTEX",
    "Your brand, taken seriously.",
  ].join("\n");
  const ackHtml = htmlShell(
    ackSubject,
    `<p style="margin:0 0 6px;font:600 12px/1.3 Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${ACC}">Order received · ${esc(ref)}</p>` +
      `<h1 style="margin:0 0 18px;font:700 28px/1.15 Arial,sans-serif">Thank you, ${esc(who)}.</h1>` +
      p(`Thank you for your order. We have everything you sent, and your reference is ${ref}.`) +
      h("What you ordered") +
      `<p style="margin:0 0 12px;font-weight:700">${esc(service)} for ${esc(biz)}</p>` +
      htmlTable(mine) +
      h("What happens next") +
      p("We turn your answers into a one-page brief and send it back for you to confirm. Pay the full price (how to pay is below) before work starts.") +
      `<p style="margin:0 0 12px;padding:14px 16px;border-left:3px solid ${ACC};background:#FAF9F6;font-weight:700">${esc(STUDIO_ORDER_PROMISE)}</p>` +
      // @studio-step-values-slot: printed only when every value is set in config.
      (values ? h("What each phase is worth") + `<ol style="margin:0 0 12px;padding-left:20px">${valueLines.map((l) => `<li>${esc(l.replace(/^\d+\. /, ""))}</li>`).join("")}</ol>` : "") +
      h("The terms") +
      `<ol style="margin:0 0 12px;padding-left:20px">${terms.map((t) => `<li style="margin:0 0 8px"><b>${esc(t.b)}:</b> ${esc(t.t)}</li>`).join("")}</ol>` +
      h("How to pay") +
      payLines.map((l) => p(l)).join("") +
      h("Replies and extra files") +
      p(`Reply to this email, or send replies and extra files (logos, photos) to ${cfg.ordersEmail}, with your reference ${ref}.`),
  );

  return {
    order: {
      from: cfg.from,
      to: cfg.ordersEmail,
      replyTo: order.email,
      subject: oneLine(orderSubject),
      text: orderText,
      html: orderHtml,
      attachments,
    },
    ack: {
      from: cfg.from,
      to: order.email,
      replyTo: cfg.ordersEmail,
      subject: oneLine(ackSubject),
      text: ackText,
      html: ackHtml,
      attachments: [],
    },
  };
}

// ---- The home page brief (1.20.7) -------------------------------------------
// Ray: the home page form sends by email, like /order. One mail to the
// orders address (Reply-To the visitor) and a copy to the visitor.
export interface StudioBrief {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export function buildStudioBriefMails(brief: StudioBrief, cfg: { from: string; ordersEmail: string }, ref: string): StudioOrderMails {
  const who = oneLine(brief.name);
  const rows: [string, string][] = [
    ["Name", who],
    ["Email", oneLine(brief.email)],
    ["Phone", oneLine(brief.phone) || "Not given"],
    ["Brief", brief.message],
  ];
  const subject = `New brief ${ref} from ${who}`;
  const order: StudioMail = {
    from: cfg.from,
    to: cfg.ordersEmail,
    replyTo: oneLine(brief.email),
    subject,
    text: [`New CORTEX brief ${ref}`, "", ...rows.map(([k, v]) => `${k}:\n  ${v.replace(/\n/g, "\n  ")}`)].join("\n"),
    html: htmlShell(subject, h(`New brief · ${ref}`) + htmlTable(rows)),
    attachments: [],
  };
  const ackSubject = `Thank you, we have your brief (${ref}) · CORTEX`;
  const ack: StudioMail = {
    from: cfg.from,
    to: oneLine(brief.email),
    replyTo: cfg.ordersEmail,
    subject: ackSubject,
    text: [`Hi ${who},`, "", `Thank you. We have your brief, reference ${ref}:`, "", brief.message, "", "Our team replies with the ten questions in office hours.", "", "CORTEX", "Your brand, taken seriously."].join("\n"),
    html: htmlShell(ackSubject, p(`Hi ${who},`) + p(`Thank you. We have your brief, reference ${ref}:`) + htmlTable([["Brief", brief.message]]) + p("Our team replies with the ten questions in office hours.")),
    attachments: [],
  };
  return { order, ack };
}
