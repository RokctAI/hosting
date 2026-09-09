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

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The one primitive in this directory that is NOT a verbatim mirror of
 * RokctAI/rokctai_frontend's copy. That copy overlays an `AiTextHelper`
 * button on every textarea, which POSTs to `/api/ai/text` and `/api/ai/quota`
 * — routes agent_sdk owns and this shell does not compose, so mirroring it
 * would ship a button that 404s on every composed admin form. `enableAi` is
 * kept in the prop type so callers written against that copy still type-check;
 * it is ignored here. Restore the overlay if agent_sdk is ever composed in.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  enableAi?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, enableAi, ...props }, ref) => {
    void enableAi;

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
