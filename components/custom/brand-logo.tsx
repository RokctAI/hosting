"use client";

/**
 * Host-owned logo seam. Named in base_sdk's and auth_sdk's manifest
 * `requires`; rendered by base_sdk's landing header and hero.
 *
 * NEUTRAL BY DESIGN — and asset-free. This shell ships no logo file and no
 * product imagery (the home SDK registers what the product looks like, and
 * base_sdk >= 1.17.0 draws the favicon itself from the domain's first
 * letter when no icon is registered), so the mark here is the platform
 * initial on the theme's primary colour - `bg-primary` /
 * `text-primary-foreground` from app/globals.css, never a literal brand
 * colour. Every prop of rokctai_frontend's richer component is accepted so
 * SDK callers type-check unchanged.
 */
import { PLATFORM_NAME } from "@/app/config/platform";

export function BrandLogo({
  width = 24,
  height = 24,
  className,
  variant = "auto",
  showBadge = false,
  isCircle = false,
  priority = false,
}: {
  width?: number;
  height?: number;
  className?: string;
  variant?: "auto" | "light" | "dark" | "inverted";
  showBadge?: boolean;
  isCircle?: boolean;
  priority?: boolean;
}) {
  // Accepted for API parity with the SDK's callers; this shell has no image
  // asset, theme variants or beta badge to switch on.
  void variant;
  void showBadge;
  void priority;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-primary font-bold text-primary-foreground ${
        isCircle ? "rounded-full" : "rounded-[5px]"
      } ${className || ""}`}
      style={{
        width,
        height,
        minWidth: width,
        minHeight: height,
        fontSize: Math.round(height * 0.55),
        lineHeight: 1,
      }}
      aria-label={PLATFORM_NAME}
    >
      {PLATFORM_NAME.charAt(0)}
    </div>
  );
}

export default BrandLogo;
