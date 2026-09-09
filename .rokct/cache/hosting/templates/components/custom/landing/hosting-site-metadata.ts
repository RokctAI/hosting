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

// The hosting storefront's site metadata, for base_sdk's site-metadata
// registry (components/custom/landing/site-metadata.ts, base_sdk >= 1.15.0):
// the <title>, description and social-card facts the host layout, the
// landing page and the generated Open Graph / Twitter image read from ONE
// registered module.
//
// The shape is written out here rather than imported from base's file, as
// lms-site-metadata.ts and agent-site-metadata.ts do: an `import type` of a
// module that is not on disk is a compile error, and the registry checks the
// default export structurally when it loads this module.
//
// No `icon`: the SDK ships no icon file, so base_sdk >= 1.17.0 draws the
// fallback favicon (the domain's first letter) itself. No `still`, no `logo`,
// no `ogImage`: there is no hosting artwork in the sources, and base's
// generated card draws the tagline on its own. No `url`: the storefront's
// host is not fixed in any source yet; base falls back to the shell's
// NEXT_PUBLIC_SITE_URL. Every number in the description is a plan fixture
// fact (max_websites 1..100, max_databases 5..200, max_storage 10..500,
// trial_period_days 14, currency USD).

/** The subset of base_sdk >= 1.15.0's SiteMetadataCopy this module fills. */
export interface HostingSiteMetadata {
  title: string;
  description: string;
  tagline: string;
  siteName?: string;
  url?: string;
  keywords?: string[];
  /** A ready-made png/jpg preview; none here, base generates one. */
  ogImage?: string;
  /** Asset path drawn into the generated preview image; none here. */
  logo?: string;
  locale?: string;
}

const HOSTING_SITE_METADATA: HostingSiteMetadata = {
  siteName: "Rokct Hosting",
  title: "Rokct Hosting — website deployments, managed databases, NVMe storage",
  tagline: "Website deployments, managed databases and NVMe storage on one plan",
  description:
    "Hosting plans from Rokct: Basic, Pro and Enterprise, billed monthly or yearly in USD, with 1 to 100 website deployments, 5 to 200 managed databases, 10GB to 500GB of NVMe storage and a 14-day trial on every plan.",
  keywords: ["hosting", "website deployment", "managed databases", "NVMe storage", "Rokct"],
  locale: "en_ZA",
};

export default HOSTING_SITE_METADATA;
