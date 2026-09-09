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

// The hosting storefront's features section, registered in base_sdk's
// page-sections registry (components/custom/landing/page-sections.ts): what
// the hosting plans include, one card per inclusion, copy from
// landing/hosting-page-sections.ts. Colours route through the shell's
// theme tokens (primary, zinc surfaces), never a literal brand colour.

import React from "react";

import { HOSTING_PAGE_SECTIONS } from "@/components/custom/landing/hosting-page-sections";
import type { PageSectionMeta } from "@/components/custom/landing/page-sections";

export function HostingFeaturesSection({ id }: { id?: string }) {
  const config = HOSTING_PAGE_SECTIONS.features;
  if (config.items.length === 0) return null;

  return (
    <section id={id} className="w-full bg-white py-16 dark:bg-black md:py-24">
      <div className="container mx-auto flex max-w-6xl flex-col gap-12 px-4 xl:px-0">
        <div className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-balance text-[32px] font-extrabold leading-[1.1] tracking-tight text-zinc-900 dark:text-white md:text-[48px]">
            {config.heading}
          </h2>
          <p className="max-w-2xl text-lg font-medium text-zinc-600 dark:text-zinc-400 md:text-xl">
            {config.blurb}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {config.items.map((feature) => (
            <div
              key={feature.id}
              className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition-colors hover:border-primary dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="h-1.5 w-10 rounded-full bg-primary" aria-hidden="true" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {feature.name}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const meta: PageSectionMeta = {
  order: 40,
  nav: [{ id: "features", label: "Features" }],
};

export default HostingFeaturesSection;
