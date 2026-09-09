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

"use client";

// The hosting storefront's pricing section, registered in base_sdk's
// page-sections registry (components/custom/landing/page-sections.ts). It
// renders the plan rows the page prefetched through this SDK's plans query
// (landing/hosting-plans-query.ts: the control site's Subscription Plan
// catalog, `plan_category` Hosting) - name, price, term, trial and, when the
// row carries them, its feature lines - and never a price of its own.
//
// It turns itself down through meta.renders when there are no rows (the
// control site unreachable, or no hosting plan seeded), so the host drops
// both the section and its "Pricing" nav stop together and the header's
// anchor never points at nothing (base_sdk >= 1.11.0). A plan's button goes
// to LANDING_CONFIG.planSignupUrl(plan_name), the host's sign-up with the
// plan named, as the other storefronts do.

import React, { useMemo, useState } from "react";
import Link from "next/link";

import type { LandingPlan } from "@/app/actions/base/landing";
import { HOSTING_PAGE_SECTIONS } from "@/components/custom/landing/hosting-page-sections";
import { LANDING_CONFIG } from "@/components/custom/landing/landing-config";
import type {
  PageSectionMeta,
  PageSectionProps,
} from "@/components/custom/landing/page-sections";

const isYearly = (interval?: string) =>
  ["year", "yearly"].includes((interval ?? "").toLowerCase());

const isMonthly = (interval?: string) =>
  ["month", "monthly"].includes((interval ?? "").toLowerCase());

/** "Hosting Pro (Monthly)" -> "Hosting Pro": the term is shown separately. */
function cleanPlanName(name: unknown): string {
  if (typeof name !== "string" || !name) return "Plan";
  return (
    name
      .replace(/\s*\(.*\)\s*/, "")
      .replace(/\s*(Monthly|Yearly)\s*/i, "")
      .trim() || "Plan"
  );
}

function formatPrice(cost: number, currency?: string): string {
  const code = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: Number.isInteger(cost) ? 0 : 2,
    }).format(cost);
  } catch {
    return `${code} ${cost}`;
  }
}

const showsPricing = (plans: LandingPlan[]) => plans.length > 0;

export function HostingPricingSection({ id, plans }: PageSectionProps) {
  const config = HOSTING_PAGE_SECTIONS.pricing;
  const { labels } = config;
  const [isAnnual, setIsAnnual] = useState(false);

  const hasYearly = useMemo(
    () => plans.some((plan) => isYearly(plan.billing_interval)),
    [plans],
  );
  const hasMonthly = useMemo(
    () => plans.some((plan) => isMonthly(plan.billing_interval)),
    [plans],
  );
  const hasSwitch = hasYearly && hasMonthly;

  const displayedPlans = useMemo(
    () =>
      plans
        .filter(
          (plan) =>
            !hasSwitch ||
            (!isYearly(plan.billing_interval) && !isMonthly(plan.billing_interval)) ||
            isYearly(plan.billing_interval) === isAnnual,
        )
        .sort((a, b) => (a.cost || 0) - (b.cost || 0)),
    [plans, hasSwitch, isAnnual],
  );

  if (!showsPricing(plans)) return null;

  const term = (plan: LandingPlan) =>
    isYearly(plan.billing_interval)
      ? labels.perYear
      : isMonthly(plan.billing_interval)
        ? labels.perMonth
        : "";

  const buttonLabel = (plan: LandingPlan, baseName: string) =>
    plan.trial_period_days && plan.trial_period_days > 0
      ? labels.trial(plan.trial_period_days)
      : labels.select(baseName);

  return (
    <section id={id} className="w-full bg-zinc-50 py-16 dark:bg-zinc-950 md:py-24">
      <div className="container mx-auto flex max-w-6xl flex-col gap-12 px-4 xl:px-0">
        <div className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-balance text-[32px] font-extrabold leading-[1.1] tracking-tight text-zinc-900 dark:text-white md:text-[48px]">
            {config.heading}
          </h2>
          <p className="max-w-2xl text-lg font-medium text-zinc-600 dark:text-zinc-400 md:text-xl">
            {config.blurb}
          </p>
          {hasSwitch && (
            <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <span>{labels.monthly}</span>
              <input
                type="checkbox"
                checked={isAnnual}
                onChange={() => setIsAnnual((v) => !v)}
                className="peer sr-only"
              />
              <span className="relative h-5 w-10 rounded-full bg-zinc-300 transition-colors after:absolute after:left-[2px] after:top-[2px] after:size-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-5 dark:bg-zinc-700" />
              <span>{labels.yearly}</span>
            </label>
          )}
        </div>

        <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayedPlans.map((plan) => {
            const baseName = cleanPlanName(plan.plan_name);
            const features = Array.isArray(plan.features) ? plan.features : [];
            return (
              <div
                key={plan.name ?? plan.plan_name}
                className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-primary dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {baseName}
                  </h3>
                  <p className="flex items-baseline gap-1 text-zinc-900 dark:text-white">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {formatPrice(plan.cost || 0, plan.currency)}
                    </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {term(plan)}
                    </span>
                  </p>
                </div>
                {features.length > 0 && (
                  <ul className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href={LANDING_CONFIG.planSignupUrl(plan.plan_name)}
                  className="mt-auto inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {buttonLabel(plan, baseName)}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const meta: PageSectionMeta = {
  order: 60,
  nav: [{ id: "pricing", label: "Pricing" }],
  renders: ({ plans }) => showsPricing(plans),
};

export default HostingPricingSection;
