# Copyright 2026 ROKCT INTELLIGENCE (PTY) LTD
"""hosting_sdk 1.27.0: the tender portfolio is installed and reachable."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDIO = ROOT / "templates/components/custom/studio"


def test_manifest_installs_every_portfolio_file():
    m = json.loads((ROOT / "manifest.json").read_text())
    tos = {i["to"] for i in m["app_type"]["hosting"]["installs"]}
    for p in ["app/portfolio/page.tsx", "app/portfolio/print/page.tsx",
              "components/custom/studio/studio-portfolio.ts",
              "components/custom/studio/studio-portfolio-load.ts",
              "components/custom/studio/studio-portfolio-page.tsx",
              "components/custom/studio/studio-portfolio.css"]:
        assert p in tos, p
        assert (ROOT / "templates" / p).is_file(), p


def test_work_links_to_portfolio():
    assert "href={PORTFOLIO_HREF}" in (STUDIO / "studio-work.tsx").read_text()


def test_print_page_carries_version_for_the_robot():
    assert "data-portfolio-version" in (STUDIO / "studio-portfolio-page.tsx").read_text()


def test_afrikaans_for_every_portfolio_phrase():
    af = json.loads((ROOT / "templates/app/lib/i18n/sdk/hosting.json").read_text())["af"]["__phrases"]
    for p in ["Real work for real clients.", "Every client gets this", "Last updated from live data on", "Download PDF"]:
        assert p in af, p
