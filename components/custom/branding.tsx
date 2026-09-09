"use client";

/**
 * Host-owned wordmark seam. Named in base_sdk's and auth_sdk's manifest
 * `requires`; rendered by base_sdk's landing header and hero.
 *
 * NEUTRAL BY DESIGN. It prints `PLATFORM_NAME` from `@/app/config/platform`
 * - the platform's wordmark, the same one rokctai_frontend shows - and
 * nothing else: no product name, no logo file, no colour of its own. The
 * product's name and copy are the home SDK's, registered into base_sdk's
 * site-metadata registry at compose time; this file never carries them.
 * RokctAI/rokctai_frontend's copy resolves a remote branding record
 * (name/country-code/beta badge) through a control-plane server action this
 * shell does not compose; mirroring that here would put a second, divergent
 * identity in front of visitors. Keep this file dumb.
 *
 * FITS THE BOX IT IS GIVEN. base_sdk's hero renders this wordmark at
 * `text-[76px]` inside a 250 px `overflow-hidden` box (hero.tsx, the
 * collapsing logo strip). The SDK owns that box, so the fit lives here:
 * after mount the wordmark measures the nearest ancestor that clips
 * horizontally and, only when it does not fit, scales itself down with a
 * CSS transform (origin left) to the room it has. Same font, same weight,
 * same classes — nothing changes where nothing clips (the landing header).
 */
import { useLayoutEffect, useRef, useState } from "react";

import { PLATFORM_NAME } from "@/app/config/platform";

function clippingAncestor(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node && node !== document.body) {
    const overflowX = getComputedStyle(node).overflowX;
    if (overflowX === "hidden" || overflowX === "clip") return node;
    node = node.parentElement;
  }
  return null;
}

export function Branding({
  showBadge = false,
  forceWhite = false,
  className,
}: {
  showBadge?: boolean;
  forceWhite?: boolean;
  className?: string;
}) {
  // showBadge is accepted for API parity with the SDK's callers; this shell
  // has no country-code badge to show.
  void showBadge;

  const ref = useRef<HTMLSpanElement>(null);
  // { natural: unscaled width, scale: factor that fits the clipping box }
  const [fit, setFit] = useState<{ natural: number; scale: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const clip = clippingAncestor(el);
    if (!clip) return;
    const measure = () => {
      // scrollWidth is layout width: the transform below does not move it.
      const natural = el.scrollWidth;
      const room =
        clip.getBoundingClientRect().right - el.getBoundingClientRect().left;
      if (natural > 0 && room < natural) {
        setFit({ natural, scale: Math.max(room / natural, 0) });
      } else {
        setFit(null);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(clip);
    return () => observer.disconnect();
  }, []);

  return (
    <span
      className="flex items-center gap-1.5"
      style={fit ? { width: fit.natural * fit.scale } : undefined}
    >
      <span
        ref={ref}
        className={`${className || "text-2xl"} inline-block whitespace-nowrap font-sans font-bold tracking-tight leading-none ${
          forceWhite ? "text-white" : "text-black dark:text-white"
        }`}
        style={
          fit
            ? {
                transform: `scale(${fit.scale})`,
                transformOrigin: "left center",
              }
            : undefined
        }
      >
        {PLATFORM_NAME}
      </span>
    </span>
  );
}

export default Branding;
