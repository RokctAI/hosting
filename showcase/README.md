# Showcase registry

The sites the ROKCT studio page shows, one file per site, named `<owner>__<repo>.json` (for example `RokctAI__polaris-web.json`).
Each file is that site's own card, copied verbatim from `.rokct/showcase.json` in its repo; the studio orders sites by `rank` (1 to 10, 10 is best).
Do not edit these files here. Change the card in the site's repo: its `showcase.yml` workflow (RokctAI/shared-workflows `showcase-announce.yml`) then opens one pull request per site on the branch `showcase/<owner>__<repo>`, and the site appears once that pull request is merged.
Pictures resolve as `https://raw.githubusercontent.com/<repo>/<shots.branch>/<path>`.
