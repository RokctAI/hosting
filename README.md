# hosting

Shell for the hosting product: a storefront for hosting plans on the control
site. Ray, 2026-09-09: hosting is "a seperate frontend for rokctapp, but it
points to control site. just hosting focused" — rpanel stays a standalone
product ([docs/spec.md](docs/spec.md)); this shell sells the plans and
nothing more.

Spawned by [RokctAI Factory](https://github.com/rokctai/factory) from https://github.com/RokctAI/factory/issues/130.

## Status

**Composed at deploy — the SDK cache is committed, the composed output is not.**

Vercel builds this repo from a commit, so everything the build composes from
has to be in that commit. The vendored SDK cache under `.rokct/cache/` is
therefore committed and pinned by `.rokct/lock.json`, and `vercel.json`'s
`buildCommand` is `bash scripts/compose.sh && npm run build`: compose offline
from the committed cache, then build. No token, no clone and no network reach
the deploy — the model [`RokctAI/supacharge-web`](https://github.com/RokctAI/supacharge-web)
and the Dart app shells (`paas_manager`, `paas_driver`) already use.

The shell carries **no product copy and no product imagery**. Everything a
visitor reads — the hero, the features and pricing sections, the header
menu, the `<title>`, description and link-preview cards, the plans filter —
is `hosting_sdk`'s, the home SDK, registered into `base_sdk`'s landing
registries at compose time. The host layer commits only what the SDK
manifests name under `requires`: the shadcn primitives (`components/ui/*`),
`lib/utils.ts`, `app/config/*`, `app/lib/*`, the neutral `branding` /
`brand-logo` seams (the platform wordmark, the same one `rokctai_frontend`
shows) and the theme tokens in `app/globals.css`. No plan id or plan name is
written anywhere in this repo: `hosting_sdk` filters the control site's
shared catalog by category on the server.

Composing adds `/landing` (the storefront), the `/admin` and `/manager`
trees `base_sdk` owns, and the `/login`, `/register`, `/forgot-password` and
`/api/auth/[...nextauth]` routes `auth_sdk` owns; `/` is `hosting_sdk`'s
page, which sends every visitor to `/landing` (there is no signed-in home).

Nothing composed is committed. Every path an installer writes is listed in
the generated block at the end of [`.gitignore`](.gitignore). Because those
install targets are not in the tree, a bare `npm run build` without composing
first is not a supported build of this shell: run `bash scripts/compose.sh`
first (it needs nothing but the checkout). CI's
`Compose Offline + Build (Vercel parity)` job runs exactly the two commands
Vercel runs and fails if a compose changes anything committed.

The full brief lives in [docs/spec.md](docs/spec.md); the build instructions
for the agent live in [AGENTS.md](AGENTS.md).

## Stack

Next.js 16 (App Router) + React 19 + TypeScript, matching
[`RokctAI/rokctai_frontend`](https://github.com/RokctAI/rokctai_frontend)'s
versions and config style so the Next.js shells stay on one set of
conventions. The `@/*` → `./*` tsconfig path alias is the one the Next.js SDK
installer convention assumes, so composed SDK templates resolve their imports
unchanged.

The host layer adds the UI library the composed SDKs import: Radix primitives
wrapped as `components/ui/*`, `class-variance-authority`, `clsx` and
`tailwind-merge` behind `cn()`, plus `lucide-react`, `sonner`,
`react-day-picker` and `frappe-js-sdk`. Versions are pinned to the specs
`rokctai_frontend` and the SDK manifests already use.

**Tailwind is wired the way `rokctai_frontend` wires it** — the mirrored
primitives and the composed SDK pages are written in Tailwind classes
upstream. `tailwind.config.ts`, `postcss.config.mjs` and `app/globals.css`
(imported by the root layout) mirror that shell's setup on the same versions:
Tailwind v3, `darkMode: ["class"]` (driven by next-themes from the root
layout, system scheme first) and the shadcn HSL token set `components/ui/*`
reads through `hsl(var(--token))`. The content globs cover every directory an
SDK installer writes into (`app/`, `components/`, `lib/`, `hooks/`).

**Theme.** `--primary` in `app/globals.css` is `rokctai_frontend`'s value, as
a placeholder pending Ray's UI call for this product; it is the one place the
storefront's accent, the primitives and `base_sdk`'s generated favicon letter
take their colour from.

`.npmrc` sets `legacy-peer-deps=true`: `react-day-picker@8` (the version
`components/ui/calendar.tsx` and `base_sdk`'s date-range picker are written
against) declares a `date-fns` peer of `^2 || ^3`, while `base_sdk`'s manifest
declares `date-fns@^4`. The pair works — `rokctai_frontend` ships it — but
npm's strict peer resolver refuses the tree.

## Getting started

```bash
bash .rokct/bootstrap.sh   # installs the Rokct agent protocol into this repo

npm ci
bash scripts/compose.sh    # offline: composes from the committed .rokct/cache/
npm run dev                # http://localhost:3000
```

Composing is part of any build of this shell:

```bash
bash scripts/compose.sh    # offline: composes from the committed .rokct/cache/
npm run build              # what Vercel runs after it, per vercel.json
```

Other commands: `npm start` (serve the build), `npm run typecheck`.

## Configuration

Copy [`.env.example`](.env.example) to `.env.local`. Every variable this shell
reads is documented there; none is required to build.

- `ROKCT_BASE_URL` (server) / `NEXT_PUBLIC_ROKCT_BASE_URL` (public fallback)
  — the **control site**: the Frappe backend this storefront points at.
  `base_sdk`'s platform gateway reads it, and the landing's plan rows come
  through it. Unset, the landing renders without a pricing section.
- `NEXT_PUBLIC_SITE_URL` — the public origin, once this shell has a domain.
  Nothing in the code defaults it; `base_sdk` derives the canonical URL, the
  link-preview host line and the generated favicon letter from it.
- `AUTH_SECRET`, `ROKCT_ADMIN_API_KEY`, `ROKCT_ADMIN_API_SECRET` — runtime
  only, for `auth_sdk`'s composed routes. No database: `next.config.mjs`
  selects `auth_sdk`'s single-tenant link, so `POSTGRES_URL` is not a
  variable this project has.

## Composition

`.rokct/config/app_type` names the registry template
(`The-Rokct-Protocol core/utils/frappe/composer/hosting.json`) that is
canonical for this shell's Next.js composition; the composer
(`The-Rokct-Protocol core/utils/nextjs/sdk_composer.py`) materializes
`composer.json` from it on every compose, copies SDK templates into the host
and merges their npm dependencies into `package.json`. The committed
`composer.json` is the offline mirror of that template's `sdks` block — change
the registry template first, then mirror it here so the two do not drift.

The composed SDKs are `telemetry_sdk`, `base_sdk`, `auth_sdk` and
`hosting_sdk` (the home SDK: `.rokct/lock.json` flags it `home_sdk`, and the
offline compose prints `[i] home SDK: hosting_sdk`). There is deliberately no
`agent_sdk`: its integrations are unconditional and would flip the storefront
AI-first, and its plans query excludes the very plans this shell sells. The
composer does not generate the application shell itself: the host layer
listed under **Status** above is host-owned. Each host seam file says in its
own header which `requires` entry it answers and which SDK installs over it
when composed — read those before widening one.

`scripts/compose.sh` has two modes:

| mode | who runs it | what it does |
| --- | --- | --- |
| `bash scripts/compose.sh` | Vercel, CI, developers | Verifies the vendored composer and every cache entry against `.rokct/lock.json`, then runs each cached SDK's `install.py`. Offline: no git, no network, no token. |
| `bash scripts/compose.sh refresh` | a maintainer, or Actions with `MONOREPO_PAT` | Re-fetches the protocol composer and every SDK the registry template names, replaces `.rokct/cache/` wholesale, rewrites `.rokct/lock.json` (every SDK's pins and its `home_sdk` flag), the composed-output block in `.gitignore` and `package-lock.json`, and stages the cache. Commit the result to `main`; that commit is what ships the new SDK version. |

The cache is listed in `.gitignore` and committed with `git add -f`. The
ignore rule is there for one reason: the fleet linter's auto-fix runs
`prettier --write . --ignore-path .gitignore` and commits the result, and
reformatting a vendored template would change the content `.rokct/lock.json`
pins — the next deploy would then refuse to compose. `refresh` stages the
cache with `-f` for the same reason, and leaves `.rokct/cache/install_state.json`
— the installers' per-checkout record — untracked.
