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

// `/portfolio/print` (hosting_sdk 1.27.0): the A4 twin of /portfolio. The
// weekly robot (shared-workflows portfolio-weekly.yml) prints it to the
// version PDF that /portfolio's "Download PDF" opens. Not indexed.

import type { Metadata } from "next";

import { studioFontClassName } from "@/components/custom/studio/studio-fonts";
import { StudioPortfolioPrint } from "@/components/custom/studio/studio-portfolio-page";
import { loadPortfolio } from "@/components/custom/studio/studio-portfolio-load";

export const metadata: Metadata = {
  title: { absolute: "Portfolio · CORTEX" },
  robots: { index: false, follow: false },
};

export default function Page() {
  return <StudioPortfolioPrint fontClassName={studioFontClassName} portfolio={loadPortfolio()} />;
}
