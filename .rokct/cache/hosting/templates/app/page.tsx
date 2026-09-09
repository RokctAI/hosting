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

// The page that serves `/` in a shell whose home SDK is hosting_sdk. Same
// role as lms_sdk's app/page.tsx for Supacharge and agent_sdk's
// app/(chat)/page.tsx for rokctapp: the home SDK owns the root route (Ray,
// 2026-09-03: each home SDK holds its own landing page). This product is a
// storefront on the control site and nothing more - rpanel stays a
// standalone product (hosting/docs/spec.md), so there is no signed-in home
// to send a visitor to - and every visitor goes to base_sdk's composed
// landing at /landing. Installed on the shell's own app/page.tsx so the
// composer overwrites the shell's holding page, the way base_sdk's host
// files overwrite the shell copies; a shell that is NOT composed keeps its
// own `/`.

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Page() {
  redirect("/landing");
}
