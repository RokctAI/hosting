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

// The hosting storefront's plans query, for base_sdk's plans-query registry
// (components/custom/landing/plans-query.ts, base_sdk >= 1.9.0): the
// platform's `Subscription Plan` catalog, HOSTING plans only.
//
// Ray, 2026-09-09: hosting is "a seperate frontend for rokctapp, but it
// points to control site. just hosting focused and filter subscriptions to
// show only hosting related" - and rokctapp's own storefront filters those
// same plans OUT (agent_sdk 1.10.0, agent-plans-query.ts). One control
// backend serves several storefront shells and each shell's home SDK
// filters the shared catalog by `plan_category`; no plan is named or
// numbered here, the category is the one the hosting plan fixtures spell
// (hosting/frappe/src/fixtures/Subscription_Plan/*.json: "Hosting").
//
// The query is base's generic default (LANDING_CONFIG.plansQuery: the same
// doctype, fields and order) with ONE filter laid over it, so a field base
// adds later reaches the pricing section without an edit here. The filter
// runs on the server: only the hosting rows are ever fetched. A host whose
// landing-config.ts sets `plansQuery` to null prefetches no plans at all,
// and this module honours that by exporting null too.
//
// Registered with one line at // @rokct-sdk-plans-query-start through this
// SDK's manifest integrations. loadLandingPlansQuery() answers the FIRST
// registered entry that loads; as the home SDK this one is the only line
// the composer injects there.

import {
  LANDING_CONFIG,
  type LandingPlansQuery,
} from "@/components/custom/landing/landing-config";

/** The category, as the platform's plan fixtures spell it. */
const HOSTING_CATEGORY = "Hosting";

/** A `frappe.client.get_list` filter row: [fieldname, operator, value]. */
type PlanFilter = [string, string, string];

const ONLY_HOSTING: PlanFilter = ["plan_category", "=", HOSTING_CATEGORY];

/**
 * Lays the hosting filter over whatever `filters` the generic payload
 * already carries: appended to a list, added to a map keyed by fieldname,
 * or the sole filter when there are none.
 */
function onlyHosting(payload: Record<string, unknown>): Record<string, unknown> {
  const existing = payload.filters;
  if (Array.isArray(existing)) {
    return { ...payload, filters: [...existing, ONLY_HOSTING] };
  }
  if (existing && typeof existing === "object") {
    return {
      ...payload,
      filters: {
        ...(existing as Record<string, unknown>),
        [ONLY_HOSTING[0]]: [ONLY_HOSTING[1], ONLY_HOSTING[2]],
      },
    };
  }
  return { ...payload, filters: [ONLY_HOSTING] };
}

const generic = LANDING_CONFIG.plansQuery;

const HOSTING_PLANS_QUERY: LandingPlansQuery | null = generic
  ? { cmd: generic.cmd, payload: onlyHosting(generic.payload) }
  : null;

export default HOSTING_PLANS_QUERY;
