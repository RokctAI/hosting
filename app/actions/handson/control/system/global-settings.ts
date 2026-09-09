"use server";

/**
 * Host-owned control-plane settings seam. Named in base_sdk's manifest
 * `requires`; read by the SDK-installed team switcher, beta toggle and
 * admin general-settings page.
 *
 * RokctAI/rokctai_frontend's copy delegates to
 * `@/app/services/control/global_settings`, a service auth_sdk installs at
 * compose time. That service is composed output, not part of the committed
 * tree, and this file is host-owned (no SDK installs over it), so it cannot
 * import it and stay buildable on the bare shell: the seam answers with the
 * platform defaults and reports toggles as unavailable rather than
 * pretending they applied. The storefront never reads these toggles.
 */
export interface GlobalSettings {
  isBetaMode: boolean;
  isDebugMode: boolean;
}

export interface GlobalSettingsToggleResult {
  success: boolean;
  isBetaMode?: boolean;
  isDebugMode?: boolean;
  error?: string;
}

const DEFAULTS: GlobalSettings = { isBetaMode: false, isDebugMode: false };

const NO_CONTROL_PLANE =
  "Control-plane settings toggles are not wired in this shell.";

export async function getGlobalSettings(): Promise<GlobalSettings> {
  return { ...DEFAULTS };
}

export async function toggleBetaMode(): Promise<GlobalSettingsToggleResult> {
  return { success: false, error: NO_CONTROL_PLANE };
}

export async function toggleDebugMode(): Promise<GlobalSettingsToggleResult> {
  return { success: false, error: NO_CONTROL_PLANE };
}
