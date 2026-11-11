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

// The Pay step's details that only appear after an order is sent
// (hosting_sdk 1.21.4), worked out on the server by the order route: the
// account number (STUDIO_BANK_ACCOUNT), the PayShap ID (STUDIO_PAYSHAP_ID),
// the Capitec Pay Me QR image (STUDIO_CAPITEC_QR_URL), and two QR codes as
// SVG from the `qrcode` package: "Scan to copy bank details" (plain text,
// studioBankQrText) and "Scan to pay by card" (this order's PayFast link).
// No account, no bank QR; PayFast off, no card QR. Server only.

import QRCode from "qrcode";

import { studioBankQrText } from "./studio-pay";
import { studioBankAccount, studioBankSwift, studioCapitecQrUrl, studioPayshapId } from "./studio-payfast";

export interface StudioPayAfterSend {
  account: string | null;
  swift: string;
  payshap: string | null;
  capitecQr: string | null;
  /** SVG: the bank details as plain text, or null without an account number. */
  qrBank: string | null;
  /** SVG: this order's card link, or null when PayFast is off. */
  qrCard: string | null;
}

function svg(text: string): Promise<string> {
  return QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#17161bff", light: "#ffffffff" } });
}

export async function studioPayAfterSend(ref: string, amountZar: number | null, cardUrl: string | null): Promise<StudioPayAfterSend> {
  const account = studioBankAccount();
  const swift = studioBankSwift();
  const out: StudioPayAfterSend = { account, swift, payshap: studioPayshapId(), capitecQr: studioCapitecQrUrl(), qrBank: null, qrCard: null };
  try {
    [out.qrBank, out.qrCard] = await Promise.all([
      account ? svg(studioBankQrText({ account, swift, amountZar, ref })) : null,
      cardUrl ? svg(cardUrl) : null,
    ]);
  } catch {
    // A QR that fails to draw is left out; the details still show.
  }
  return out;
}
