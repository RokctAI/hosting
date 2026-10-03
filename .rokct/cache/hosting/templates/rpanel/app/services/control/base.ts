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


import "server-only";

import { platformCall } from "@/app/services/base/platform-gateway";

/**
 * The hosting shell's control-plane service base for the rpanel pages.
 *
 * RokctAI_frontend carries a host-owned app/services/control/base.ts that
 * goes through its own app/lib/client.ts + app/lib/gateway-rpc.ts. The
 * hosting shell has neither (its app/lib/client.ts returns a thin
 * `{ app, call }` adapter, not a FrappeApp), so this SDK ships the same
 * `ControlBaseService` / `routeControlCmd` surface built on base_sdk's
 * `platformCall` instead: one `{cmd, payload}` POST to the universal
 * platform gateway (ADR-005) on the control site, with the session's
 * credentials. The Frappe `message` envelope that `platformCall` unwraps is
 * put back, so `response?.message` consumers keep working unchanged.
 */

export interface ServiceOptions {
  headers?: Record<string, string>;
}

/**
 * Maps a cmd onto the key the control gateway actually dispatches: the
 * control app registers each rpanel endpoint under
 * `control:rpanel.<dotted.path>` (control hooks.py), so `rpanel.*` cmds are
 * sent under that key. Everything else passes through.
 */
export function routeControlCmd(cmd: string): string {
  return cmd.startsWith("rpanel.") ? `control:${cmd}` : cmd;
}

/** The control site: the hosting shell always talks to the control plane. */
function controlBaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_FRAPPE_URL || process.env.ROKCT_BASE_URL;
}

export class ControlBaseService {
  /**
   * Executes a whitelisted dotted method against the Control Plane through
   * the platform gateway. Throws on failure (the callers' try/catch is
   * their error handling), and returns `{ message }` like a Frappe reply.
   */
  public static async call(
    method: string,
    args: any = {},
    options: ServiceOptions = {},
  ): Promise<any> {
    const message = await platformCall<any>(routeControlCmd(method), args, {
      baseUrl: controlBaseUrl(),
      headers: options.headers,
      throwOnError: true,
    });
    return { message };
  }

  public static async getList(
    doctype: string,
    args: any = {},
    options: ServiceOptions = {},
  ) {
    const response = await this.call(
      "frappe.client.get_list",
      { doctype, ...args },
      options,
    );
    return response?.message ?? [];
  }

  public static async getDoc(
    doctype: string,
    name: string,
    options: ServiceOptions = {},
  ) {
    const response = await this.call(
      "frappe.client.get",
      { doctype, name },
      options,
    );
    return response?.message;
  }

  public static async insert(doc: any, options: ServiceOptions = {}) {
    const response = await this.call("frappe.client.insert", { doc }, options);
    return response?.message;
  }

  public static async update(
    doctype: string,
    name: string,
    data: any,
    options: ServiceOptions = {},
  ) {
    const response = await this.call(
      "frappe.client.set_value",
      { doctype, name, fieldname: data },
      options,
    );
    return response?.message;
  }

  public static async delete(
    doctype: string,
    name: string,
    options: ServiceOptions = {},
  ) {
    return this.call("frappe.client.delete", { doctype, name }, options);
  }
}
