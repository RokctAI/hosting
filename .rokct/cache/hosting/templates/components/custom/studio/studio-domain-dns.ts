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

// Server only (hosting_sdk 1.20.3): the .co.za fallback for the domain
// check. ZACR offers no public RDAP that answers for .co.za, so a name that
// has nameservers is taken; no answer settles nothing.

import { promises as dns } from "node:dns";

/** NS records for `name`: true when it has some, false when none, null when unsure. */
export async function studioHasNameservers(name: string): Promise<boolean | null> {
  try {
    return (await dns.resolveNs(name)).length > 0;
  } catch (err) {
    const code = (err as { code?: string }).code;
    return code === "ENOTFOUND" || code === "ENODATA" ? false : null;
  }
}
