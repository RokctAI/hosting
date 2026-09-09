"use client";

/**
 * Host-owned merchant navigation seam. Named in base_sdk's manifest
 * `requires` and rendered by its `components/custom/app-sidebar.tsx` for
 * the seller/moderator roles.
 *
 * merchants_sdk is not in this shell's composer.json, so there is no
 * merchant surface to link to and this renders nothing. Composing
 * merchants_sdk overwrites this file with the real nav.
 */
export function MerchantNav() {
  return null;
}

export default MerchantNav;
