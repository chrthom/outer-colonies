# Balancing Toolkit

Simulation-based balancing toolkit for the equipment cards of Outer Colonies. State: **round 13t / balancing v23i** (Nov 5, 2026). All combat mechanics are verified against the server code (defense cascade and reactivation, ranges, halving rule, mission/raid, colony attack). The complete round log with every decision and result is [balancing.md](balancing.md) (German); the pending `cards.csv` implementation of v23i is tracked in issue #795.

## Contents

| File | Purpose |
| --- | --- |
| `balancing_metric_v9.py` | Card data loader (`../cards.csv`), weapon field and FINAL weapon overrides (v23i target values), deployment cost model |
| `balancing_metric_v10.py` | Stat-card loader (socket/energy costs, defense pools) and FINAL overrides |
| `balancing_metric_v11.py` | Fleet battle engine (value frame v3) and FINAL stat-card overrides (`v11.weapons` is authoritative) |
| `diag_random_r13t.py` | Random-battle probe, frame v23d: single battle type, per-ship rarity-weighted loadouts from all 69 FINAL cards, card-count mirror factor |
| `diag_random_v23_r13t.json` | Reference probe run (v23 frame), used for the ranking comparison (Spearman) of the v23 series |
| `frame_calibration.json` | Target-curve anchor data read by the probe |
| `diag_v23i_r13t.py` | Current full measurement (v23i value set on frame v23d) |
| `diag_v23i_r13t.json` | v23i results: medians per rarity, outliers vs. target curve |
| `balancing.md`, `KNOWLEDGE.md` | Round log and project knowledge entrypoint (German) |

## Running

```bash
python3 diag_v23i_r13t.py     # full v23i measurement; env DIAG_N sets N (default 10000), seed 42, common random numbers; note: overwrites diag_v23i_r13t.json
python3 diag_random_r13t.py   # bare probe; note: overwrites diag_random_v23_r13t.json and its checkpoint
```

Requirements: Python 3, no third-party dependencies. Needs `../cards.csv` (i.e. `misc/cards.csv`; a `cards.csv` next to the scripts also works), plus `diag_random_r13t.py`, `frame_calibration.json` and the three `balancing_metric_*.py` modules in the same directory. `diag_v23i_r13t.py` does **not** import the probe (it has no `__main__` guard): it loads the probe source up to the measurement section via `exec` with an isolated namespace. Checkpoint/resume every 2000 battles (`diag_v23i_ckpt_r13t.json`); delete the checkpoint for a fresh run.

## Model (frame v23d)

- **Battle:** one battle type (mission 50 % / raid 50 %); fleets drawn independently with **1–5 ships per side** (v23b playtest density), each ship 1–3 hull sections (sections count as cards); both sides always receive the same number of equipment cards (mirror factor = card count); unequal fleets arise endogenously (smaller fleet → more equipment).
- **Loadouts (Draw-v2):** every ship first draws **one mandatory weapon** (rarity-weighted, re-drawn until placeable, cap 300 draws; < 1 % of builds stay weaponless), then cards up to a per-battle equipment budget E derived from hulls and sockets (b_lo/b_hi); draw from all 69 FINAL cards (50 weapons + 19 stat cards), placed only on free, type-matching sockets.
- **Value frame v3 (bilateral difference):** gain = dealt − taken ± colony + mission loot, measured for the card under test in both roles (defender / raid attacker) on identical battle scenes (paired via common random numbers).
- **Score:** (role-averaged gain + 1.0 × hp) / (units + 1); units = socket costs (first socket 1.0 normal / 0.7 cheap, further sockets 0.7 / 0.5) + energy cost (0 if energy < 1, else 1 + 0.7 × (energy − 1)).
- **Halving rule:** the probe halves an attack if `attacker speed + phase range <= target speed` — **ties included** (decided >= rule, halved rate 25.8 % vs. 14.0 % under strict `<`). The server implements `<=` as well since #813 (#812 completed): probe and server now match (rounds up, before reductions).
- **Target curve v23g:** r1 1.5 / r2 1.7 / r3 2.0 / r4 2.5 / r5 3.0, tolerance band ±0.5, one shared curve for weapons and stat cards.
- Conditionally usable cards are valued by deployment only → deliberate outliers (v23i: 9 remaining, only open case: 163).

## Conventions

- All measurement scripts use seed 42 with common random numbers (paired measurements, regression-neutral card swaps).
- Scripts evaluate the **FINAL dicts** (v23i target values), not the `cards.csv` status quo; `cards.csv` is only the data basis for names, sockets and rarities.
- Superseded round artifacts (audit and probe scripts, checkpoints, earlier measurement JSONs such as v23f/g/h) are intentionally not kept in this directory; all of their results are documented in [balancing.md](balancing.md).
- Script comments are in German (working copies from the German-first project); this README follows the repository convention (English).
