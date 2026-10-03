# Changelog

## 1.2.0

* The rpanel control pages now compose into the HOSTING web app shell, not
  RokctAI_frontend (Ray, 2026-09-26: "rokctai_frontend loses hosting sdk.
  hosting web app shell gets it"). The `app_type.rokctapp` block is removed;
  its installs move into `app_type.hosting`, beside the storefront, and the
  templates move from `templates/rokctapp/` to `templates/rpanel/` (the old
  folder was named after a persona this SDK no longer declares).
* What the hosting shell lacked for those pages ships with them:
  * `app/services/control/base.ts` - `ControlBaseService` and
    `routeControlCmd` (the `control:rpanel.*` cmd routing), the same surface
    as RokctAI_frontend's host-owned copy but built on base_sdk's
    `platformCall` pinned to the control site, because the shell has no
    `app/lib/gateway-rpc.ts` and its `getControlClient()` returns a
    `{ app, call }` adapter rather than a FrappeApp;
  * `app/handson/control/rpanel/layout.tsx` - the frame: signed-out visitors
    go to `/login` (auth_sdk's middleware already gates `/handson/*`), users
    without a hosting role (`Hosting Client`, `System Manager`,
    `Administrator`) get an access-restricted page, everyone else the nav and
    the toaster;
  * `components/custom/nav/rpanel-nav.tsx` - the nav, carrying the
    `// @rokct-sdk-control-nav-start` marker the seven Hosting entries are
    injected at (they targeted rokctapp's `app/handson/layout.tsx` before);
    `components/custom/rpanel/roles.ts` holds `HOSTING_ROLES`;
  * `components/ui/toast.tsx`, `components/ui/use-toast.ts` (copied from
    RokctAI_frontend) and `components/custom/rpanel/rpanel-toaster.tsx`, so
    the pages' `useToast()` calls render; `@radix-ui/react-toast` is added to
    the dependencies.
* Page fixes the hosting shell's type-check surfaced (the same code fails
  `tsc` in RokctAI_frontend too):
  * the backups and cron pages read `success`/`websites` straight off
    `getClientWebsites()`, which wraps the rpanel reply in `{ message }`, so
    their website pickers never filled; they now unwrap `message` first;
  * the website page rendered `<RPanelNav />` twice with its import commented
    out; those elements go (the rpanel layout draws the nav);
  * the website logs page drops its unused `getControlClient` import (a
    server module pulled into a client page).
* The manifest's `about` and `app_type` notes are rewritten for the new home.
* `install.py` is unchanged.

## 1.1.0

* The rpanel control panel moves here from RokctAI_frontend (Ray,
  2026-09-26 20:22Z: "everything rpanel/hosting from frontend need to move
  to that hosting/nextjs/"). A new `app_type.rokctapp` block installs, into a
  host whose `.rokct/config/app_type` reads `rokctapp`:
  * `app/handson/control/rpanel/**` - the Hosting dashboard, websites
    (and a website's files and logs), databases, emails, FTP, backups and
    cron pages;
  * `app/actions/handson/control/rpanel/**` - their server actions;
  * `app/services/control/rpanel/**` - the control-plane services
    (extending the host's `app/services/control/base.ts`);
  * `components/custom/rpanel/**` - the server-info header, stat card and
    status badge.
  The templates live under `templates/rokctapp/` at their host paths, so
  `strip_unused_role_folders()` drops them from a hosting-shell cache. The
  seven Hosting sidebar entries are injected at the host's
  `// @rokct-sdk-control-nav-start` marker in `app/handson/layout.tsx`.
  The files are byte-identical to RokctAI_frontend at #183's head.
* The storefront moves from the top level into `app_type.hosting`, unchanged
  (same templates, integrations and requires). The hosting shell's marker
  reads `hosting`, so its compose is identical; a rokctapp host no longer
  receives the storefront's `app/page.tsx` or landing sections.
* `manage-email.ts` and `manage-ftp.ts` re-synced to #183's head after its
  review fix (4f72250): a `success: false` reply from rpanel is now treated as
  a failure. The manifest's `about` now says the SDK also carries the rpanel
  control pages for rokctapp hosts.
* `install.py` is unchanged.

## 1.0.1

* `hosting-header-menu.ts` declares `brand: { logo: "none" }` (base_sdk
  1.21.0's `HeaderMenu.brand`): the home SDK declares whether the header
  shows a logo (Ray, 2026-09-09), and hosting has no icon yet, so the header
  draws no image and the wordmark alone is the logo. `wordmark` stays at its
  default.
* base_sdk floor raised to 1.21.0, the version that added the field; against
  an older base the compose fails to type-check. `install.py` is unchanged.

## 1.0.0

* First release: the Next.js half of the hosting product, the home SDK of
  the hosting shell (RokctAI/hosting). Ray, 2026-09-09: hosting is "a
  seperate frontend for rokctapp, but it points to control site. just
  hosting focused and filter subscriptions to show only hosting related";
  rokctapp's own storefront filters those same plans out (agent_sdk 1.10.0).
  hosting/docs/spec.md keeps rpanel a standalone product, so this SDK is a
  storefront on the control site and nothing more.
  * `templates/app/page.tsx` owns `/` the way lms_sdk's does for Supacharge:
    every visitor is redirected to base_sdk's composed landing at `/landing`
    (there is no signed-in home to send anyone to).
  * `components/custom/landing/hosting-plans-query.ts` registers at
    `// @rokct-sdk-plans-query-start`: `LANDING_CONFIG.plansQuery` with one
    filter laid over its payload, `["plan_category", "=", "Hosting"]`, the
    inclusive mirror of agent_sdk's `agent-plans-query.ts`. No plan id or
    name is in the filter; the category is the one the plan fixtures spell.
  * `hosting-hero-copy.ts` (`// @rokct-sdk-hero-copy-start`) and
    `hosting-hero-form.tsx` (`// @rokct-sdk-hero-form-start`): the headline
    cycles the three things every plan is sized by - website deployments,
    managed databases, NVMe storage - and the body is two calls to action
    with no input, the sign-up and the pricing section, since the base hero
    draws no call to action without a registered body.
  * `hosting-features-section.tsx` and `hosting-pricing-section.tsx`
    (`// @rokct-sdk-page-sections-start`, copy in
    `landing/hosting-page-sections.ts`): what the plans include, one card
    per inclusion from the plan fixtures, and the live plan rows the control
    site returns (name, price, term, trial, feature lines, a sign-up button
    per plan). The pricing section declares `meta.renders` over the
    prefetched rows so it and its Pricing nav stop drop together when there
    are none.
  * `hosting-header-menu.ts` (`// @rokct-sdk-header-menu-start`): two
    anchors, `features` and `pricing`, resolved against the page's live nav.
    No groups; no actions, because base's header already draws Log in and
    Sign up.
  * `hosting-site-metadata.ts` (`// @rokct-sdk-site-metadata-start`): the
    title, tagline, description and keywords, every figure a plan fixture
    fact. It declares its own shape rather than importing base's, as lms
    and agent do, and registers no `icon`, so base_sdk >= 1.17.0's generated
    letter favicon applies.
  * Every word rendered comes from `hosting/frappe/src/fixtures` (the six
    Hosting Subscription Plan records and their Items) or
    `hosting/frappe/README.md`; colours route through the shell's theme
    tokens, never a literal brand colour.
  * base_sdk floor 1.19.0 (the home_sdk composer, protocol #390, and the
    base that shipped with it); auth_sdk composes before this SDK because
    the landing's sign-up and login links are its routes.
