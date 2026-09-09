/**
 * Host-owned utility seam. Named in base_sdk's manifest `requires`
 * (core/base/nextjs/manifest.json) and imported by every `components/ui/*`
 * primitive in this shell.
 *
 * This is the narrow half of RokctAI/rokctai_frontend's `lib/utils.ts`:
 * byte-for-byte the same `cn()` (clsx + tailwind-merge), without that
 * shell's chat/AI helpers, which pull in `ai` and `@/db/schema` — neither
 * of which this shell composes. Widen it only when a composed SDK actually
 * imports another symbol from `@/lib/utils`.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
