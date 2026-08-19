# hosting — accepted brief

> Copied verbatim from https://github.com/RokctAI/factory/issues/130 at spawn time. Do not edit: this is the
> record of what was accepted. Decisions taken while building belong in
> `.rokct/decision_log.md`.

**One line:** Shell for the hosting product.

## Rationale

The shell for the hosting product. Note: rpanel stays a standalone product — it is not this shell.

Same thin-shell contract as the other shells: one-line `.rokct/config/app_type` naming its composer.json template in The-Rokct-Protocol `core/utils/frappe/composer/`. See [The-Rokct-Protocol PR #253](https://github.com/RokctAI/The-Rokct-Protocol/pull/253).

No app code beyond that marker at creation.

Refiled from https://github.com/RokctAI/factory/issues/126 (prose body the spawn parser could not read).
