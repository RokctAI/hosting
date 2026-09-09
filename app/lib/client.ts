import "server-only";

/**
 * Host-owned PaaS client seam. Named in base_sdk's manifest `requires` and
 * imported by its admin content/settings actions, which use exactly one
 * method on what it returns: `client.call({ method, args })`.
 *
 * Mirrors RokctAI/rokctai_frontend's `app/lib/client.ts` — same
 * `frappe-js-sdk` client, same siteName -> URL derivation, same
 * "Unauthorized" on a session-less request — with two differences forced by
 * what this shell composes:
 *
 *   1. Credentials come from the host session seam `@/app/lib/session`
 *      (which base_sdk documents and auth_sdk installs at compose time)
 *      instead of auth_sdk's `@/app/(auth)/actions` and `@/db`, which are
 *      composed output and not in the committed tree.
 *   2. The returned value is a thin adapter exposing `call({ method, args })`,
 *      the shape base_sdk's actions call, over `FrappeCall.post`.
 *
 * Keep this file free of imports from composed SDK trees: it is committed on
 * the bare shell, where `next build` must stay green with nothing composed.
 */
import { FrappeApp } from "frappe-js-sdk";

import { getFrappeClient } from "@/lib/frappe";
import { getCurrentSession } from "@/app/lib/session";

export interface PaaSCallOptions {
  /** Dotted Frappe method path, e.g. "frappe.client.get_list". */
  method: string;
  args?: Record<string, unknown>;
}

export interface PaaSClient {
  /** The underlying frappe-js-sdk app, for callers that need more. */
  app: FrappeApp;
  call<T = any>(options: PaaSCallOptions): Promise<T>;
}

interface SessionUserCredentials {
  apiKey?: string | null;
  apiSecret?: string | null;
  siteName?: string | null;
}

function adapt(app: FrappeApp): PaaSClient {
  return {
    app,
    call<T = any>({ method, args }: PaaSCallOptions): Promise<T> {
      return app.call().post<T>(method, args);
    },
  };
}

async function requireUser(): Promise<SessionUserCredentials> {
  const session = (await getCurrentSession()) as {
    user?: SessionUserCredentials | null;
  } | null;
  if (!session || !session.user) throw new Error("Unauthorized");
  return session.user;
}

export async function getPaaSClient(): Promise<PaaSClient> {
  const { apiKey, apiSecret, siteName } = await requireUser();

  // Ensure siteName is a full URL if present.
  let url = siteName ?? undefined;
  if (siteName && !siteName.startsWith("http")) {
    url = siteName.includes("localhost")
      ? `http://${siteName}`
      : `https://${siteName}`;
  }

  // When url is undefined, getFrappeClient falls back to
  // process.env.NEXT_PUBLIC_FRAPPE_URL.
  return adapt(
    getFrappeClient({
      apiKey: apiKey ?? undefined,
      apiSecret: apiSecret ?? undefined,
      url,
    }),
  );
}

export async function getControlClient(): Promise<PaaSClient> {
  const { apiKey, apiSecret } = await requireUser();
  // siteName is deliberately ignored: the control plane is the default URL.
  return adapt(
    getFrappeClient({
      apiKey: apiKey ?? undefined,
      apiSecret: apiSecret ?? undefined,
    }),
  );
}

export default getPaaSClient;
export const getClient = getPaaSClient;
