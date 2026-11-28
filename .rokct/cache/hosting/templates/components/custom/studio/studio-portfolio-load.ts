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

// Reads the tender portfolio (hosting_sdk 1.27.0), server side, at build
// time, from the shell-owned `portfolio/` folder beside `showcase/` (the
// same seam studio-showcase-load.ts uses). Until the weekly robot has
// written a first version, the page shows the current showcase cards,
// unversioned, so it is never empty. Nothing here throws.

import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { PORTFOLIO_DIR, PORTFOLIO_MAX_BYTES, buildPortfolio, parsePrint, parseSnapshot, type Portfolio } from "./studio-portfolio";
import { loadShowcase } from "./studio-showcase-load";

function readSmall(p: string): string | null {
  try {
    if (statSync(p).size > PORTFOLIO_MAX_BYTES) return null;
    return readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

export function loadPortfolio(root: string = process.cwd()): Portfolio {
  const dir = join(root, PORTFOLIO_DIR);
  let print = parsePrint(null);
  const printText = readSmall(join(dir, "print.json"));
  if (printText) {
    try {
      print = parsePrint(JSON.parse(printText));
    } catch {
      /* a broken print.json shows no print work */
    }
  }
  const snap = parseSnapshot(readSmall(join(dir, "current.json")), print);
  if (snap) return snap;
  console.warn("[studio] portfolio/current.json: missing or invalid; /portfolio shows the current cards unversioned");
  const { sites } = loadShowcase(root);
  return buildPortfolio({ version: null, date: null, changes: [], sites, print });
}
