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

// The hosting storefront's hero copy, for base_sdk's hero-copy registry
// (components/custom/landing/hero-copy.ts, base_sdk >= 1.6.0): this
// product's words laid over HERO_CONFIG field by field.
//
// Every phrase is lifted from the hosting plan fixtures
// (hosting/frappe/src/fixtures/Subscription_Plan/*.json): the three things
// every plan is sized by - website deployments, managed databases, NVMe
// storage - cycle as the headline, and the trust line states the two facts
// all six plans share (trial_period_days: 14; billing_cycle Monthly or
// Yearly). No user counts, no adoption claims: the sources carry none.
//
// The hero frame renders "<text> <verb> <suffix>"; the suffix carries the
// connective, so each word's verb is empty. There is no input on this hero
// (hosting-hero-form.tsx renders two calls to action instead), so the
// placeholders are empty and the rokctapp store badges are turned off.

import type { HeroCopy } from "@/components/custom/landing/hero-copy";

const HOSTING_HERO_COPY: HeroCopy = {
  headlineWords: [
    { text: "Website deployments", verb: "" },
    { text: "Managed databases", verb: "" },
    { text: "NVMe storage", verb: "" },
  ],
  headlineSuffix: "on one hosting plan",
  // No input on this hero (hosting-hero-form.tsx), so nothing to type into it.
  placeholders: [],
  backgroundImage: "",
  // Rendered by hosting-hero-form.tsx under its calls to action.
  trustLine: ["14-day trial on every plan", "Billed monthly or yearly"],
  // No store badges: the product is bought on this page, not in a store.
  badges: [],
};

export default HOSTING_HERO_COPY;
