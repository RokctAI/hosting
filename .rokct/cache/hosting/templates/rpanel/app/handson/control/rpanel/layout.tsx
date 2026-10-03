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


import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/app/lib/session";
import { Button } from "@/components/ui/button";
import { RPanelNav } from "@/components/custom/nav/rpanel-nav";
import { HOSTING_ROLES } from "@/components/custom/rpanel/roles";
import { RPanelToaster } from "@/components/custom/rpanel/rpanel-toaster";

/**
 * The hosting shell's frame for the rpanel control pages
 * (/handson/control/rpanel/**). The shell has no /handson layout of its own
 * (RokctAI_frontend's app/handson/layout.tsx is not here), so this SDK ships
 * one scoped to the rpanel routes: auth_sdk's middleware already sends a
 * signed-out visitor to /login for /handson/*; this layout also gates on the
 * hosting roles and renders the nav (components/custom/nav/rpanel-nav.tsx,
 * filled at its // @rokct-sdk-control-nav-start marker) and the toaster the
 * pages' useToast() calls render into.
 */
export default async function RPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/login");

  const userRoles: string[] = (session.user as any)?.roles || [];
  const allowed = HOSTING_ROLES.some((role) => userRoles.includes(role));

  if (!allowed) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold">Access Restricted</h1>
          <p className="text-muted-foreground">
            Your account does not have access to the hosting control panel.
          </p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center border-b px-4 font-semibold lg:h-[60px] lg:px-6">
          <Link href="/handson/control/rpanel">Hosting Control</Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <RPanelNav userRoles={userRoles} />
        </div>
      </aside>
      <div className="flex w-full flex-col">
        <header className="sticky top-0 z-30 border-b bg-background md:hidden">
          <div className="px-4 pt-3 font-semibold">Hosting Control</div>
          <RPanelNav userRoles={userRoles} mobile />
        </header>
        <main className="flex-1 p-4 sm:px-6 md:p-8">{children}</main>
      </div>
      <RPanelToaster />
    </div>
  );
}
