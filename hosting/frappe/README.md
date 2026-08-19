# Hosting SDK — frappe

The frappe half of the hosting SDK. It starts fixtures-only: the hosting
Subscription Plan and Item fixtures live under `src/fixtures/`. The rest of the
hosting module code joins here as rpanel is broken into SDK form.

Fixtures under `src/fixtures/` are picked up by control's fixture-loader union
once the hosting module is composed or the SDK is installed.
