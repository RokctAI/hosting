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

// The hosting storefront's hero body, for base_sdk's hero-form registry
// (components/custom/landing/hero-form.ts, base_sdk >= 1.7.0). The base
// hero is a frame whose body the home SDK injects (Ray, 2026-09-08); with
// nothing registered it renders no call to action at all, and the trust
// line it carries is only drawn beside store badges this product has none
// of. So, as lms-hero-form.tsx does for Supacharge, this body is two calls
// to action and no input: the sign-up the header also carries, and the
// pricing section on this page.
//
// The two buttons route through the shell's theme tokens (bg-primary /
// text-primary-foreground and the border token), never a literal colour,
// so the storefront wears whatever primary the host sets.

import React from "react";
import Link from "next/link";

import type { HeroFormProps } from "@/components/custom/landing/hero-form";

const PRICING_ANCHOR = "#pricing";

export default function HostingHeroForm({ hero, signupUrl }: HeroFormProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
        <Link
          href={signupUrl}
          className="inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
        >
          Start your 14-day trial
        </Link>
        <a
          href={PRICING_ANCHOR}
          className="inline-flex w-full items-center justify-center rounded-full border border-zinc-300 px-8 py-3 text-base font-semibold text-zinc-900 transition-colors hover:border-primary hover:text-primary dark:border-zinc-700 dark:text-white sm:w-auto"
        >
          See pricing
        </a>
      </div>

      {hero.trustLine.length > 0 && (
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {hero.trustLine.join(" · ")}
        </p>
      )}
    </div>
  );
}
