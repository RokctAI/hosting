# Changelog

## 1.10.0

* The ROKCT card flips to the logo sketches (Ray: "studio showcase can
  flip as it has logo and im seeing polaris and still its not how i
  wanted"; "you know that thing we do with logo where you get 4 logos and
  you choose one, we can even mock a brief for each site"; then, on the
  first render: "I thought of 4 logos all drawn by hand on a plane divided
  by 4 like a cross. Then on the side a selected logo nolonger hand
  drawn"; then "let the drawings be rough like a scratchpad"). Versioned 1.10.0, not 1.9.0, because hardware#55 (open) claims
  1.9.0.
* "Our work" gains a ROKCT card and it leads the row (three tabs: ROKCT,
  Polaris, Supacharge). Its front is the studio's own home page as proofs
  (new `public/studio/work/studio-desktop.webp` and `studio-phone.webp`,
  shot from the composed shell; `studio` now carries the work files in
  `studio-shots.ts`).
* Its back (`MarkBack` in `studio-home.tsx`): the example brief in one
  line, then the hero - one gridded scratchpad page (new
  `studio-sketch.tsx`, new install) split into four by a quick pen cross,
  a rough pen doodle in each quarter: A a condensed wordmark whose O is an
  orbit (a softer lowercase try struck out), B a nose cone with a
  porthole (a literal rocket crossed out), C the ROKCT R (traced over the
  mark's own path, circled and ticked in the accent, "yes!"), D a round
  seal (a square badge struck out). Beside it (below on a phone) the
  picked mark as the clean final vector, at full size and at avatar sizes,
  then why it won. All vector: every line is two or three jittered,
  bowed, overshooting pen passes (generated once with a fixed seed and
  committed as path data), scribbled hatching clipped to the shapes and a
  light noise filter for the pen's edge; notes are in Caveat 500 (new
  `fonts/caveat-500.woff2`, SIL OFL 1.1, `fonts/OFL-caveat.txt`, loaded in
  `studio-fonts.ts` as `--font-st-hand`). Ink is currentColor and the
  paper a token, so the sheet follows light and dark. The card says the
  brief is an example and that A, B and D were sketched for the page.
* The final is the real ROKCT mark, verbatim: `public/studio/logo/
  rokct-r.svg` is RokctAI_frontend `public/images/logo.svg` (identical to
  shared-workflows `.github/assets/logo.svg`), drawn as a CSS mask in the
  panel's ink. New `StudioMarkSet`, `STUDIO_MARK_COPY` and
  `STUDIO_MARKS_ROKCT` in `studio-copy.ts`; `StudioCase` gains `marks`.
* Polaris comes off the flip: its card no longer turns, and its logo files
  (`polaris-star.svg`, `polaris-p.svg`, `polaris-splash.webp`) left
  `public/studio/logo/`. Supacharge's logo-process back is unchanged.
* Phone frames are thinner everywhere (Ray: "Mobile frames be thinner
  everywhere"): 4px of bezel instead of 10, radius 26/22 so the corners
  stay concentric - the hero and every portfolio card.
* The flip is base_sdk's FlipCard as before: click or tap, Enter / Space,
  Escape to turn back, a crossfade under reduced motion.
* test: `tests/test_studio_marks.py`; `test_studio_schemes.py` follows the
  new back and drops the Polaris star check; `test_studio_shots.py`
  counts the studio's work proofs.

## 1.8.0

* Each case in its own colours (Ray: the "how we design" tabs did not
  show each case's colour scheme). Before, every panel drew with the
  studio's own oxblood tokens and the cases carried no colours at all.
  New `STUDIO_SCHEMES` in `studio-copy.ts`: each brand's colours in light
  and dark, from its own code - Polaris from polaris_sdk 1.8.0
  `polaris-theme.css` (lime on forest), Supacharge from lms_sdk 1.39.0
  `lms-theme.css` (orange #ff6600 on #101010), South River from
  southriver-web `data/theme.json` (#e4333b) with the label's deep red
  and the river blue from its renders, ROKCT from `studio.css`. Each
  panel carries `.cs` and its scheme as `--cl-*` / `--cd-*` properties
  (`studioSchemeVars`); `.cs` re-points the studio tokens, so the panel's
  paper, brief card, rules, type, accent, the mock browser frame, the
  "Picked" badge and the buttons wear the case's colours, and the rest of
  the page keeps the studio's. The tab marker and number take the active
  case's accent, with a colour transition (off under reduced motion).
  Every text pair is AA (4.5:1) in both modes; where the brand pair is
  not (white on Supacharge orange 2.9:1, white on #e4333b 4.3:1) labels
  on the orange are ink and the red fills use the label's deeper #c40019.
* The brief shows the brand's swatches ("Their colours": name and hex),
  and the verdict a "Start a brief like this" WhatsApp button in the
  case's accent.
* The portfolio is one row (Ray: "give it tabs ... so the portfolio
  becomes one row"). New `StudioWorkTabs` in `studio-client.tsx`: a
  tablist over a sideways scroll-snap track of full-width cards, after
  lms_sdk's card deck (native touch and trackpad swipes, `scroll-snap-stop:
  always`, hidden scrollbar, the next card's edge on a phone; arrows and
  the tab keys on a desktop). It moves on every 8 s with a progress bar on
  the active tab, paused while hovered, focused, off screen or the page is
  hidden, never under reduced motion, and stopped for good by a tab, an
  arrow, a swipe or a flip; a Pause / Play button is always there. The
  track is `aria-live="off"` while it runs and "polite" once stopped;
  hidden cards are `inert`. Each card wears its case's scheme.
  `StudioCase` gains `tab`, `sector` and `logo`.
* The portfolio card flips to the logo process (Ray). The card is
  base_sdk's `FlipCard` (>= 1.58.0; the Supacharge tutor card's flip,
  moved to base), `layout="stack"`, hover-intent 450 ms, a crossfade under
  reduced motion. The front is the case as it was; the back lists only
  the stages that have real material, from the client's own repos, under
  `public/studio/logo/` (new install). Polaris: versions (the four-point
  star of polaris_sdk 1.7.0, dropped at Ray's word, and the ember P on a
  horizon line), the one chosen (the P) and in use (the app's opening
  screen). Supacharge: the one chosen (the wordmark and the S) and in use
  (the store feature graphic). No sketch exists for either, so none is
  shown; a case with no stage does not flip.
* Needs base_sdk >= 1.58.0 (`components/custom/flip-card.tsx` in
  `requires`).
* test: `tests/test_studio_schemes.py` (schemes, AA in both modes, the
  row's tab and auto-advance rules, the flip, real logo files only);
  `test_studio_shots.py` accepts versions from 1.6.0 up.

## 1.7.0

* The studio home has the "Back to top" button (Ray, 2026-10-31: "every
  app shell need the button to go up"). `studio-home.tsx` mounts base_sdk
  1.56.0's `<BackToTop />` inside the `.st` root, so base's root button
  steps aside on this page.
* The button is the studio's own (Ray, 2026-10-31: the button must not
  look the same on every site; each home SDK sets its own style). New
  `components/custom/landing/hosting-back-to-top.ts` registers a
  `BackToTopConfig` at base_sdk 1.56.0's
  `// @rokct-sdk-back-to-top-style-start` marker, so the studio home and
  every other route of the hosting shell (sign-in, the rPanel) read it:
  a rounded square with the proof sheet's crisp 3px corners and the
  1.5px ink outline of its `.btn`, the ink arrow on the `--bg` paper,
  the `--acc` / `--acc-ink` fill on hover, the `--acc-text` focus ring,
  the sheet's `--shadow` and a quiet 200ms ease. Outside `.st` each value
  falls back to base's shadcn token, so the sign-in page's button is an
  ink arrow on the page ground instead of the yellow-on-white (1.6:1) the
  token default drew there.
* fix: `studio.css`'s `.st button` reset skipped the button
  (`:where(:not([data-back-to-top]))`, same weight for every other
  button). The reset outranked the button's utility classes, so the
  button drew transparent, borderless and in plain text colour (a bare
  white arrow over the Starter price card in dark mode at 390). The
  `--back-to-top-*` mapping in `studio.css` gives way to the registered
  style.
* Needs base_sdk >= 1.56.0. The hosting block's `requires` lists
  `components/custom/back-to-top.tsx`, `landing/back-to-top-style.ts` and
  `landing/back-to-top.ts`.
* test: `tests/test_studio_back_to_top.py`.

## 1.6.0

* Live site shots (Ray, 2026-10-31: the studio's pictures of each client
  site come automatically from that site's latest good build). Each shell
  repo's "Site shots" workflow photographs its own first screen after a
  health gate and commits the set to its `site-shots` branch; base_sdk
  1.55.0 serves it from the site itself at `/site-shots/`. The studio asks
  each client's live site through the new static route
  `app/studio/shots/[site]/[file]/route.ts` (regenerated at most hourly).
  The manifest must name the client's repo, and each image must be a WebP
  of the listed size, length and SHA-256. A failed regeneration throws, so
  the last good picture stays. Before the first good one (at build), and
  always for a site with no known address, the route serves the committed
  picture under `public/studio/`.
* Only the picked option of each "How we design" case and the "Our work"
  and hero proofs are live. Options A and B stay fixed. The live proofs
  follow the page's theme (`.th-l` / `.th-d`, as the options already did).
* The sites are in `components/custom/studio/studio-shots.ts`
  (`STUDIO_SHOT_SITES`). Supacharge reads from https://supacharge.school.
  Polaris, South River and the studio itself have no address set yet:
  Polaris's public address is not recorded anywhere (its main serves the
  v3 landing since polaris_sdk 1.8.0); southriver-web main has no home
  page; the hosting shell has no domain. Set `STUDIO_SHOTS_ORIGIN_<SITE>` (`POLARIS`, `SUPACHARGE`,
  `SOUTHRIVER`, `STUDIO`) on a deployment to set an address, or `off` to
  turn a site's live pictures off.
* `StudioCase` gains `site`. `DeskProof` and `PhoneProof` take a `site`
  instead of a `src`.
* Needs base_sdk >= 1.55.0. The manifest's `requires` now lists base's
  `components/custom/landing/site-shots.ts` and the site credit files
  (base_sdk >= 1.54.0) the footer has drawn since 1.5.1.
* test: `tests/test_studio_shots.py`. The stray
  `tests/__pycache__/*.pyc` is gone and `__pycache__/` is ignored.

## 1.5.2

* "How we design" (Ray's review): every option A, B and C is one of our
  own finished proposals in the client's identity. No option is a bare
  shell, a near-duplicate or a frame caught mid-animation, and each
  caption names its direction's idea (see 1.5.0 for the four cases). The
  footnote says every option is a working page our team built and
  rendered.
* The hero and "Our work" proofs show Polaris v3 and Supacharge with its
  milestone pill folded.
* The footer's copyright names the studio as its brand is set: the studio
  passes `siteName={STUDIO_FOOTER.siteName}` ("ROKCT") to `SiteCredit`,
  because the host's `PLATFORM_NAME` is "Rokct". The line reads "© 2026
  ROKCT · Built with ♥ by ROKCT · Prices in US dollars, shown in rand at
  R18.50". The footer test follows.

## 1.5.1

* The studio footer's fine line reads `© <year> <site name> · Built with ♥
  by ROKCT · Prices in US dollars, shown in rand at R18.50` (Ray,
  2026-10-31: "all site will be copyright sitename then built with love
  (as heart) by ROKCT") instead of "© 2026 ROKCT INTELLIGENCE (PTY) LTD ·
  ...". The copyright and credit are base_sdk 1.54.0's `SiteCredit`
  (`@/components/custom/site-credit`): the site's name is the host's
  `PLATFORM_NAME`, the year the current one, the heart a `role="img"`
  named "love", in the studio's own `.fine` type and middle dot.
  `STUDIO_FOOTER.legal` becomes `STUDIO_FOOTER.prices` (the note alone).
  Needs base_sdk >= 1.54.0.
* test: `tests/test_studio_footer.py`, the first tests for this half.

## 1.5.0

* The studio home gains a "How we design" section (`#design`), between
  the work and the prices, built after Ray's note that the site renders
  could show the design process "as options", the way the logo service
  hands over four logos to choose from. A four-step rail (the brief comes
  in, three options, you pick one, we build it) sits over one tab per
  project: Polaris, South River, Supacharge and the studio itself. Each
  tab shows an example brief (client, what they sell, who to, the ask),
  stamped "Example brief" and footnoted as written for the page; options
  A, B and C as proofs, with the picked one in crop marks, an accent ring
  and a "Picked" tag; and one line on why it won.
* Every option is one of our own proposals to the client: a finished
  direction in that client's identity, never a bare shell or template
  page, and never a frame caught mid-animation. Each is a render of a
  working page's first screen, cropped to the top viewport and saved as an
  800 x 500 WebP in light and dark under
  `templates/public/studio/process/`, installed to `public/studio/process/`
  (a new install entry). The picked option is always the site that was
  built.
  * Polaris: calculator first (v1), an itemised statement, and product
    first (v3, picked).
  * South River: range first (the first round), the river-blue poster, and
    the label-red poster (picked).
  * Supacharge: session first, a type poster ("Taught twice."), and
    outcome first (the live site, picked; its milestone pill shown folded).
  * ROKCT: offer first (v1), editorial (v2), and the proof sheet (v3,
    picked).
* The "Our work" and hero proofs show the current sites: Polaris v3
  instead of a v2 frame caught mid-way through its rotating headline, and
  Supacharge with its milestone pill in the folded state a still image
  should show. The Polaris case copy and alt text describe the v3 first
  screen.
* The tabs are `StudioDesignTabs` in `studio-client.tsx`: a WAI-ARIA
  tablist (arrow keys, Home and End) over server-rendered panels, so the
  first case reads without script. The copy is in `studio-copy.ts`
  (`STUDIO_DESIGN_*`), the layout in `studio.css` (`.dz-*`, `.brief`,
  `.opt`, `.verdict`). On a phone the tabs sit two by two and the picked
  option leads, full width, above the other two.
* No price changed.

## 1.4.0

* `/` is now the ROKCT studio home ("Your brand, taken seriously."), built
  from the v3 design Ray approved on 2026-10-31 ("build").
  `templates/app/page.tsx` renders it instead of redirecting to
  `/landing`; the control-site plans storefront stays at base_sdk's
  composed `/landing`. The page ships as installs under
  `components/custom/studio/`: `studio-home.tsx` (server component: the
  hero, six services with their prices, two portfolio proofs, the price
  table, the five phases with a sample status page and the refund rule,
  the ten intake questions, the WhatsApp contact block and the footer),
  `studio-client.tsx` (the currency every price reads, the header's
  scroll rule, theme switch, currency pill and phone menu, and the
  copy-the-number button), `studio-copy.ts` (every word and price on the
  page) and `studio.css` (light and dark tokens and the layout, scoped to
  `.st`; dark follows the shell's next-themes class; all motion off under
  `prefers-reduced-motion`).
* Three faces through `next/font`, loaded in `studio-fonts.ts`:
  Newsreader for running text and Hanken Grotesk for labels from
  `next/font/google`, and Big Shoulders Display for titles and figures from
  `next/font/local`, shipped as its four OFL woff2 weights under
  `components/custom/studio/fonts/` with the licence beside it, because
  `next/font/google` only carries the newer optical-size Big Shoulders
  family, whose widths differ from the Display cut.
* The website and brand bundle carries Ray's advert deal (Ray 2026-10-30,
  `website-service/offer-and-intake.md`): R8,500 is the normal price,
  shown struck through, and R2,500 is the offer price, with the R6,000
  saving beside it and free lifetime hosting for the first 1,000
  businesses. The deal shows in both the services ledger and the price
  table. It is set in rand. Outside South Africa the rule is Ray's "dollar
  is fine for outsiders": each rand figure is converted once at the fixed
  R18.50 = $1 and rounded to whole dollars ($459 struck through, $135),
  and the saving is normal minus offer in the shown currency ($324), so
  the three figures always add up. The earlier $700, $499 and
  R2,500-in-dollars figures are superseded.
* Every other price is set in US dollars and shown in rand first at the
  same fixed R18.50 = $1 (no live rate), with the other currency beside
  each figure: business plans $100, $250 and $500 (Ray approved). The
  starter kit, pitch decks, design and print, and social post packs are
  priced on WhatsApp; the starter kit's proposed $120 is not confirmed.
  A ZAR/USD switch in the header and above the price table changes every
  price at once; the choice is kept in localStorage, wrapped in try/catch.
* Contact copy says the team replies in office hours, with no times.
* It replaces the website-service landing (`components/custom/website-service/`)
  that this version carried while it was still a draft; that landing was
  never released, so nothing composed ever installed it.
* WhatsApp is +27 15 000 6069 throughout, with a prefilled message per
  service.
* The portfolio proofs (Polaris and Supacharge, desktop and phone) are
  WebP files under `templates/public/studio/work/`, installed to
  `public/studio/work/`.
* The manifest declares `next-themes` ^0.4.6, the version the hosting
  shell already pins, because the theme switch calls `useTheme()`.

## 1.3.1

* fix(icons): the rpanel pages, nav, server header, status badge and toast
  import their icons from `@remixicon/react` instead of lucide-react and
  @radix-ui/react-icons. The seven injected nav entries name the `Ri*`
  components. The manifest declares `@remixicon/react` ^4.6.0 in place of
  lucide-react.

## 1.3.0

* The frappe half joins: `hosting/frappe` now carries the rPanel hosting
  backend, moved from RokctAI/rPanel's `rpanel/hosting` module (Ray,
  2026-09-26: "it belong there. hosting and rpanel become app shell repos" /
  "one for frappe another for nexxtjs"). It has a `manifest.json`
  (module `Hosting`, version 1.3.0) declaring the scheduler events, the
  `update-ecosystem` bench command, the Workspace fixture filter and the
  Python dependencies; the 21 doctypes under `doctype/`; the server managers,
  reports and tasks under `src/`; and the former `rpanel/tests/` under
  `tests/`. Module paths use `{app_name}.hosting.…`, which resolves to
  `rpanel.hosting.…` in the rPanel shell. See `hosting/frappe/README.md`.
* The Next.js half is unchanged. The version moves so both halves of the SDK
  share one version.

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
