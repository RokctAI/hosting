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


"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  Database,
  Folder,
  Globe,
  HardDrive,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { HOSTING_ROLES } from "@/components/custom/rpanel/roles";

interface RPanelNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
}

// Entries below are appended by the Rokct SDK installer
// (sdk_installer_base.py update_integrations()): hosting_sdk's manifest
// declares one item per rpanel page, inserted on a new line immediately
// after the marker comment. Do not remove or reformat the marker.
const rpanelNavItems: RPanelNavItem[] = [
  // @rokct-sdk-control-nav-start
];

/**
 * Keeps the icon imports and HOSTING_ROLES referenced before the installer
 * fills the array (the injected entries use them).
 */
void [Clock, Database, Folder, Globe, HardDrive, Mail, ShieldCheck];
void HOSTING_ROLES;

/** The nav items a user with these roles may see. */
export function visibleRPanelNavItems(userRoles: string[]): RPanelNavItem[] {
  return rpanelNavItems.filter(
    (item) =>
      !item.roles ||
      item.roles.length === 0 ||
      item.roles.some((role) => userRoles.includes(role)),
  );
}

export function RPanelNav({
  userRoles,
  mobile = false,
}: {
  userRoles: string[];
  mobile?: boolean;
}) {
  const pathname = usePathname();
  const items = visibleRPanelNavItems(userRoles);

  return (
    <nav
      className={
        mobile
          ? "flex gap-1 overflow-x-auto px-4 py-2 text-sm font-medium"
          : "grid items-start gap-1 px-2 text-sm font-medium lg:px-4"
      }
    >
      {items.map((item) => {
        const active =
          item.href === "/handson/control/rpanel"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
              active ? "bg-muted text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
