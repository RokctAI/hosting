"use server";

/**
 * Host-owned merchants seam. Named in base_sdk's manifest `requires` (the
 * documented base <-> merchants cycle) and imported by the SDK-installed
 * admin general-settings page, which lists shops in a Select.
 *
 * merchants_sdk is not in this shell's composer.json, so there are no shops
 * to list: an empty list is the honest answer and the page renders an empty
 * Select. Composing merchants_sdk overwrites this file with the real action.
 */
export interface Shop {
  id?: string | number;
  [extra: string]: unknown;
}

export async function getShops(): Promise<Shop[]> {
  return [];
}
