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

// The copy of the hosting storefront's two landing sections
// (components/custom/hosting-features-section.tsx and
// hosting-pricing-section.tsx), in one place the way lms-landing-config.ts
// holds Supacharge's. Every claim here is lifted from the hosting plan seed
// records the Frappe half of this SDK carries
// (hosting/frappe/src/fixtures/Subscription_Plan/*.json - six plans: Basic,
// Pro and Enterprise, each Monthly and Yearly) and from that half's README;
// no figure, feature or support promise appears that a fixture does not
// state, and the live prices are never written here - the pricing section
// renders the rows the control site returns.
//
// The plan tiers are named in the FEATURES copy only because the fixtures
// name them; nothing here filters or looks plans up by name or id - the
// plans query (landing/hosting-plans-query.ts) selects by `plan_category`.

export interface HostingFeature {
  /** Stable key. */
  id: string;
  name: string;
  text: string;
}

export interface HostingPricingLabels {
  select: (plan: string) => string;
  trial: (days: number) => string;
  monthly: string;
  yearly: string;
  perMonth: string;
  perYear: string;
}

export interface HostingPageSectionsConfig {
  features: {
    heading: string;
    blurb: string;
    items: HostingFeature[];
  };
  pricing: {
    heading: string;
    blurb: string;
    labels: HostingPricingLabels;
  };
}

export const HOSTING_PAGE_SECTIONS: HostingPageSectionsConfig = {
  features: {
    heading: "What the plans include",
    blurb:
      "Three plans - Basic, Pro and Enterprise - billed monthly or yearly in USD, each sized by website deployments, managed databases and NVMe storage.",
    items: [
      {
        id: "websites",
        name: "Website deployments",
        text: "1 on Basic, 10 on Pro, 100 on Enterprise.",
      },
      {
        id: "databases",
        name: "Managed databases",
        text: "5 on Basic, 20 on Pro, 200 on Enterprise.",
      },
      {
        id: "storage",
        name: "NVMe storage",
        text: "10GB on Basic, 50GB on Pro, 500GB on Enterprise, where it is a dedicated storage tier.",
      },
      {
        id: "ssl",
        name: "Free SSL certificates",
        text: "Included with Hosting Basic.",
      },
      {
        id: "rpanel",
        name: "Advanced RPanel access",
        text: "Included with Hosting Pro.",
      },
      {
        id: "frappe-tenancy",
        name: "Frappe Tenancy support",
        text: "Included with Hosting Enterprise.",
      },
      {
        id: "support",
        name: "Support",
        text: "Priority support response on Hosting Pro (Yearly); 24/7 enterprise support on Hosting Enterprise (Yearly).",
      },
      {
        id: "trial",
        name: "14-day trial",
        text: "Every plan starts with a 14-day trial period.",
      },
    ],
  },
  pricing: {
    heading: "Pricing",
    blurb: "Basic, Pro and Enterprise, billed monthly or yearly. Prices in USD.",
    labels: {
      select: (plan) => `Select ${plan}`,
      trial: (days) => `Start ${days}-day trial`,
      monthly: "Monthly",
      yearly: "Yearly",
      perMonth: "/ month",
      perYear: "/ year",
    },
  },
};
