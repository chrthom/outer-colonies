# Misc

Development utilities, tools and documentation for Outer Colonies.

| Path | Contents |
| --- | --- |
| `dev-loop.md` | Design and runbook of the AI agent development loop on GitHub Actions |
| `cards/` | Card data pipeline: GIMP extraction (`process_cards.py`, `card_bulk_analyze.sh`), image processing (`card_bulk_rename.sh`, `card_bulk_resize.sh`), the extracted card data (`cards.csv`) and the manual text corrections log |
| `balancing/` | Simulation-based card balancing toolkit (see [balancing/README.md](balancing/README.md)) |
| `icons/` | Source icons and the generated `outer-colonies-icons` font for the website (see [icons/README.md](icons/README.md)) |
| `lore/` | Story and lore drafts for the website |
| `database/` | MariaDB schema definition (`outercolonies.sql`) |
| `release/` | Release and versioning scripts used by the root `package.json` (`release.sh`, `version.sh`) |
