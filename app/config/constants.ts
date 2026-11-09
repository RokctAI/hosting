/**
 * Host-owned platform constants seam. Named in auth_sdk's manifest
 * `requires`; read by its `components/custom/auth-form.tsx`
 * (`PLATFORM_NAME`, `VOUCHER_OFFSET_Y`) and re-exported wholesale by
 * `app/config/platform.ts`, the way RokctAI/rokctai_frontend's copy is.
 *
 * 2026-11-09 (Ray): this site's own name is "CORTEX" (capitals, Ray: "CORTEX NOT Cortex") everywhere, auth
 * pages included (auth_sdk's login heading prints "Welcome to
 * {PLATFORM_NAME}" and reads only this constant; hosting_sdk >= 1.20.7
 * names the site CORTEX in its header, footer and metadata), so
 * PLATFORM_NAME is "CORTEX". The history below is why it was "Rokct".
 *
 * Deliberately NEUTRAL (until 2026-11-09). `PLATFORM_NAME` is the PLATFORM's wordmark, the
 * same value rokctai_frontend's copy of this file carries: Ray,
 * 2026-09-09, hosting is "a seperate frontend for rokctapp, but it points
 * to control site", so the header and hero wordmark base_sdk renders
 * through `components/custom/branding.tsx` is the platform's, not a
 * product's. Everything the PRODUCT is called - the <title>, the site
 * name, the description, the cards - is the home SDK's (hosting_sdk's
 * `components/custom/landing/hosting-site-metadata.ts`, registered into
 * base_sdk's site-metadata registry at compose time). No product copy
 * lives in this shell.
 *
 * The layout numbers keep rokctai_frontend's values: nothing in this shell
 * renders the country superscript they position (the neutral branding
 * prints the plain wordmark), so they are here only so SDK code that
 * imports them by name resolves.
 */
export const PLATFORM_NAME = "CORTEX";
export const LEGAL_COMPANY_NAME = "ROKCT INTELLIGENCE (PTY) LTD";

/**
 * UI Configuration for the "Use Voucher" banner.
 */
export const VOUCHER_OFFSET_Y = "6";

/**
 * Branding Configuration for the Country Code.
 * Centralize all "Position" adjustments here:
 */
export const BRANDING_COUNTRY_INDEX = PLATFORM_NAME.length; // Insertion position (0=prefix, name length=suffix)
export const BRANDING_COUNTRY_Y_OFFSET = "-0.2em"; // Sits at cap-height, not above
export const BRANDING_COUNTRY_SCALE = "0.28em"; // Noticeably small superscript
