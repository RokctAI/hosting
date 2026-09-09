# Changelog

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
