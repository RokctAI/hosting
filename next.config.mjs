/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compose-time configuration for the SDKs this shell composes.
  //
  // `env` entries are inlined into the bundle at build time, which is what
  // makes this file the right place for a switch that is a PROPERTY OF THIS
  // SHELL rather than of a deployment: it is committed, it needs nothing set
  // in the Vercel project, and it cannot drift between environments.
  //
  // It is also the only durable place for one. An SDK-installed file is
  // rewritten by every compose - `scripts/compose.sh`
  // reconcile_tracked_host_files() spells out that even for a path this repo
  // tracks, "compose installs the SDK copy over it at build time" - and
  // composer.json is re-materialised from the registry template. next.config.mjs
  // is host-owned and installed by nobody, so it survives.
  env: {
    // auth_sdk >= 1.6.0: which tenant link the credentials flow uses.
    //
    // Unset (the default) means "database": login looks the user's tenant
    // site up in the local Postgres store auth_sdk installs, and register
    // writes a row there and reads its administrator keys from the
    // GlobalSettings table. That store is a MULTI-TENANCY feature - it maps a
    // user to the base URL they came from - and a deployment serving many
    // tenant backends needs it. rokctai_frontend is one and keeps it.
    //
    // The hosting shell points at exactly ONE backend - the control site
    // (Ray, 2026-09-09: "it points to control site"), which it knows from
    // ROKCT_BASE_URL / NEXT_PUBLIC_ROKCT_BASE_URL - so there is nothing for
    // a database to tell it and nothing about one user that another
    // deployment would need to look up. "single-tenant" selects
    // app/(auth)/tenant-link-single.ts, which imports neither @/db nor
    // drizzle nor postgres: login and register open no database connection at
    // all, and POSTGRES_URL is not a variable this project needs.
    //
    // Until 1.6.0 the site lookup sat inside the try/catch whose catch
    // returns null, so with no POSTGRES_URL set every login failed as
    // "Invalid credentials!" while the real cause - no database - was only a
    // server log line. There is now no connection to fail.
    ROKCT_TENANT_LINK: "single-tenant",
  },
};

export default nextConfig;
