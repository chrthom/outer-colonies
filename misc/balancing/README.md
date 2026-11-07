# Balancing Toolkit

Simulation-based balancing toolkit for the equipment cards of Outer Colonies. State: **round 13t / balancing v23i** (Nov 5, 2026); this snapshot adds the **infrastructure balancing round I1** (Nov 7, 2026). All combat mechanics are verified against the server code (defense cascade and reactivation, ranges, halving rule, mission/raid, colony attack). The complete round log with every decision and result is [balancing.md](balancing.md) (German); the pending `cards.csv` implementation of v23i is tracked in issue #795, the infrastructure card changes (paired rarity swaps and price buffs) in issue #815.

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
| `diag_infra_r13i.py` / `.json` | Infrastructure combat-track measurement (round I1): colony-zone defense cards (156/169/448/238/345) and the 239 control spec placed marginally into the random-battle probe (N=10000, CRN) |
| `diag_infra_prices_r13i.py` / `.json` | Infrastructure pricing model v9 (round I1, economy track): analytic prices for actions, extra draws, energy and hand limit; dual 50/50 ship/colony cost profiles, π_play 0.75 |
| `diag_infra_sweep_r13i.py` / `.json` | Regulator sensitivity sweep: colony energy course × planetary surcharge (cross-anchor law); re-runs the pricing script per variant |
| `diag_infra_curve_r13i.py` / `.json` | Curve anchoring + outlier detection for the post-swap target state (projection of issue #815): re-runs the pricing model with the decided buffs (230 E−1, 219 E−2/Ψ−1), remaps tiers to the swap structure, anchor medians T1 0.310 / T2 0.505 |
| `balancing.md`, `KNOWLEDGE.md` | Round log and project knowledge entrypoint (German) |

## Running

```bash
python3 diag_v23i_r13t.py     # full v23i measurement; env DIAG_N sets N (default 10000), seed 42, common random numbers
python3 diag_random_r13t.py   # bare probe; note: overwrites diag_random_v23_r13t.json and its checkpoint
python3 diag_infra_prices_r13i.py  # infrastructure pricing model v9 (analytic, fast, no simulation)
python3 diag_infra_sweep_r13i.py   # regulator sweep (re-runs the pricing script per variant)
python3 diag_infra_curve_r13i.py   # curve anchor + outliers in the post-swap target state (projection of issue #815)
python3 diag_infra_r13i.py         # infrastructure combat-track measurement (battle sim, N=10000, checkpoint diag_infra_ckpt_r13i.json)
```

Requirements: Python 3, no third-party dependencies. Needs `../cards.csv` (i.e. `misc/cards.csv`; a `cards.csv` next to the scripts also works), plus `diag_random_r13t.py`, `frame_calibration.json` and the three `balancing_metric_*.py` modules in the same directory. `diag_v23i_r13t.py` does **not** import the probe (it has no `__main__` guard): it loads the probe source up to the measurement section via `exec` with an isolated namespace. Checkpoint/resume every 2000 battles (`diag_v23i_ckpt_r13t.json`); delete the checkpoint for a fresh run.

## Model (frame v23d)

- **Battle:** one battle type (mission 50 % / raid 50 %); fleets drawn independently with **1–5 ships per side** (v23b playtest density), each ship 1–3 hull sections (sections count as cards); both sides always receive the same number of equipment cards (mirror factor = card count); unequal fleets arise endogenously (smaller fleet → more equipment).
- **Loadouts (Draw-v2):** every ship first draws **one mandatory weapon** (rarity-weighted, re-drawn until placeable, cap 300 draws; < 1 % of builds stay weaponless), then cards up to a per-battle equipment budget E derived from hulls and sockets (b_lo/b_hi); draw from all 69 FINAL cards (50 weapons + 19 stat cards), placed only on free, type-matching sockets.
- **Value frame v3 (bilateral difference):** gain = dealt − taken ± colony + mission loot, measured for the card under test in both roles (defender / raid attacker) on identical battle scenes (paired via common random numbers).
- **Score:** (role-averaged gain + 1.0 × hp) / (units + 1); units = socket costs (first socket 1.0 normal / 0.7 cheap, further sockets 0.7 / 0.5) + energy cost (0 if energy < 1, else 1 + 0.7 × (energy − 1)).
- **Halving rule:** the probe halves an attack if `attacker speed + phase range <= target speed` — **ties included** (decided >= rule, halved rate 25.8 % vs. 14.0 % under strict `<`). The server still implements strict `<` (rounds up, before reductions); the `<=` server change and rules-page wording are tracked in issue #812.
- **Target curve v23g:** r1 1.5 / r2 1.7 / r3 2.0 / r4 2.5 / r5 3.0, tolerance band ±0.5, one shared curve for weapons and stat cards.
- Conditionally usable cards are valued by deployment only → deliberate outliers (v23i: 9 remaining, only open case: 163).

## Infrastructure balancing (round I1)

- **Scope:** 33 infrastructure cards (editions 1–4, R0–R2) reduced to 25 evaluation objects (r0 twins share one object each); R3–R5 (413/114/105) are evaluated in the same model but deliberately not re-balanced; edition 5 is out of scope.
- **Two-track model:** track K (combat infra: colony defense 156/169/448/238/345, control 239) is measured marginally inside the random-battle probe (colony-zone slots, raid cells only); track W (economy: actions, extra draws, energy, hand limit) is priced analytically from the v23i measurement anchors (exchange rate c_ex = 1.65, PV_equip 3.145).
- **Cost model v9:** units = 1 (static play cost) + energy + sockets on ships; non-planetary cards are scored as **dual profiles 50/50 ship/colony** (ship: full socket costs, energy course 1.0/0.7; colony: sockets free, cheaper energy course 0.5/0.3); planetary cards pay the surcharge P_planetar = 1.5. Energy producers do not pay energy costs (production is the gain), damped by ALPHA_E = 0.5.
- **Draw pricing:** extra draws are worth π_play × PV_DECK with **π_play = 0.75** (decided in I1w, was 0.5; playtest anchor: share of extra draws that turn into an extra play before game end).
- **Result (v9, π 0.75, pre-swap):** tier medians T1 (R0+R1) 0.566 / T2 (R2) 0.329 — the tier inversion is resolved off-model via **paired rarity swaps** (448+183+164 → R2, 333+435+154 → R1, 320 ⇄ 413) plus price buffs on 230 (E−1) and 219 (E−1, Ψ−1); tracked in issue #815. Expected post-swap state: T1 0.310 / T2 0.505 = 1.63×.
- **Curve anchor (I1x, projection of #815):** post-swap tier medians T1 0.310 / T2 0.505 (validated against the I1w documentation to three decimals); outliers vs. the anchor are tracked in `diag_infra_curve_r13i.json` (relative band ±50 % of the tier median recommended, absolute ±0.5 kept as reference).
- **Regulators (all per playtest):** π_play, ALPHA_E, colony energy course, P_planetar; `diag_infra_sweep_r13i.py` maps their interaction space (cross-anchor law: Kraftwerk == Atomreaktor ⇔ P_planetar = E1 + 4·SUB − 1).

## Conventions

- All measurement scripts use seed 42 with common random numbers (paired measurements, regression-neutral card swaps).
- Scripts evaluate the **FINAL dicts** (v23i target values), not the `cards.csv` status quo; `cards.csv` is only the data basis for names, sockets and rarities.
- Superseded round artifacts (audit and probe scripts, checkpoints, earlier measurement JSONs such as v23f/g/h) are intentionally not kept in this directory; all of their results are documented in [balancing.md](balancing.md).
- The infrastructure scripts follow the same conventions: `diag_infra_r13i.py` loads the probe source the same way `diag_v23i_r13t.py` does; `diag_infra_sweep_r13i.py` re-executes `diag_infra_prices_r13i.py` with overridden regulators (its output never touches the pricing JSON).
- Script comments are in German (working copies from the German-first project); this README follows the repository convention (English).
