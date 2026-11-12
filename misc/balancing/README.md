# Balancing Toolkit

Simulation-based balancing toolkit for the equipment cards of Outer Colonies. State: **round 13t / balancing v23i** (Nov 5, 2026); this snapshot adds the **infrastructure balancing round I1** (Nov 7-8, 2026) and the **v25 balancing rounds** (equipment re-pricing, hulls and stations, Nov 9-11, 2026). All combat mechanics are verified against the server code (defense cascade and reactivation, ranges, halving rule, mission/raid, colony attack). The complete round log with every decision and result is [balancing.md](balancing.md) (German); the pending `cards.csv` implementation of v23i **and** the infrastructure card changes (paired rarity swaps and price buffs) are consolidated in issue #795 (issue #815 was closed as its duplicate).

## Contents

| File | Purpose |
| --- | --- |
| `balancing_metric_v9.py` | Card data loader (same-folder `cards.csv`, `../cards.csv` or `../cards/cards.csv`), weapon field and deployment cost model; v25a frame (Nov 9, 2026): the metric FINAL overrides are dropped because `cards.csv` carries the #795 target state — only the five X deductions (157/166/179/344/347) remain as overrides |
| `balancing_metric_v10.py` | Stat-card loader (socket/energy costs, defense pools) and FINAL overrides |
| `balancing_metric_v11.py` | Fleet battle engine (value frame v3) and FINAL stat-card overrides (`v11.weapons` is authoritative); H1 speed-sum fix (Nov 8, 2026): ship speed = SUM of section speeds per `profile.combine()` (was max/heck speed — historical v23g/v23i measurements predate the fix) |
| `diag_random_r13t.py` | Random-battle probe, frame v23d: single battle type, per-ship rarity-weighted loadouts from all 69 FINAL cards, card-count mirror factor |
| `diag_random_v23_r13t.json` | Reference probe run (v23 frame), used for the ranking comparison (Spearman) of the v23 series |
| `frame_calibration.json` | Target-curve anchor data read by the probe |
| `diag_v23i_r13t.py` | Current full measurement (v23i value set on frame v23d) |
| `diag_v23i_r13t.json` | v23i results: medians per rarity, outliers vs. target curve |
| `diag_infra_r13i.py` / `.json` | Infrastructure combat-track measurement (round I1): colony-zone defense cards (156/169/448/238/345) and the 239 control spec placed marginally into the random-battle probe (N=10000, CRN) |
| `diag_infra_prices_r13i.py` / `.json` | Infrastructure pricing model v9 (round I1, economy track): analytic prices for actions, extra draws, energy and hand limit; dual 50/50 ship/colony cost profiles, π_play 0.75, ALPHA_E 0.25 (I1z path A) |
| `diag_infra_sweep_r13i.py` / `.json` | Regulator sensitivity sweep: colony energy course × planetary surcharge (cross-anchor law, α-independent); re-runs the pricing script per variant |
| `diag_infra_curve_r13i.py` / `.json` | Curve anchoring + outlier detection for the post-swap target state (projection of issue #815): re-runs the pricing model with the decided buffs (230 E−1, 219 E−2/Ψ−1), remaps tiers to the swap structure; anchor medians T1 0.280 / T2 0.505 at ALPHA_E 0.25 (I1x anchor at α 0.5: 0.310/0.505 — the decided curve 0.3/0.5 covers both) |
| `diag_infra_outlier_r13i.py` / `.json` | Lever measurement for the over-outliers (rounds I1y/I1z): single-card levers (energy costs, hand limit) and the global ALPHA_E regulator against the fixed target curve T1 0.3 / T2 0.5 with a relative band of ±50 %; path A decided: ALPHA_E 0.25 model default, 172 stays +2, 448/156/183 deliberate tier tops |
| `diag_infra_effect_r13i.py` / `.json` | Effect levers for the classic outlier round (I1aa): M2 trigger variants for 333/435 (discipline count, π_M2, draw 2), action levers for 413 (speed clause, place-independence), the PD report for 169 and capacity/α scenarios for 105 — no price levers, all four cases are on-band or progression questions |
| `diag_infra_final_r13i.py` / `.json` | Post-swap final verification (rounds I1ab/I1ac, Nov 11, 2026): re-executes the pricing model v9 with **pinned anchors** (c_ex 1.65, PV_equip 3.145 — PV_equip is derived from the current csv and would drift to 2.907 under the v25 re-pricing), applies the #815 buff overrides (230 E−1, 219 E−2/Ψ−1) and the tier remap; cross-validated against the post-swap `cards.csv` (26 objects rarity-synced). Anchor reproduced exactly: T1 0.280 / T2 0.505 = 1.80× |
| `diag_anchor_live_r13i.py` / `.json` | Anchor live analysis (round I1ad, Nov 11, 2026): re-executes the final verification **without the anchor pin** (c_ex/PV_equip derived live from the current csv — PV_equip 2.907, −7.57 %) as the robustness proof behind the I1ad pin decision: consumers deflate almost uniformly, E-producers stay constant, live anchors T1 0.280 / T2 0.466 = 1.66× — the rounded curve 0.3/0.5 and every band decision hold, so the pin is kept (option A); effect analysis only, no application |
| `diag_v25a_r13t.py` … `diag_v25k_r13t.py` (+ `.json`, `diag_v25b_groups.py`, `diag_v25c_*.py`, `diag_v25d_anchor.py`, `diag_v25f/g_analysis.py`, `diag_v25h_allcards.py`, `diag_v25j_eval.py`) | v25 equipment re-pricing rounds (Nov 9-10, 2026): v25a baseline frame on the #795 target state (metric overrides → csv), v25b first hull/station measurement (the paired baseline of the whole hull series), v25c currency/scenario analyses, v25d anchor check, v25e/g/h/i dose rounds, v25j/k revised dose rounds (436-sp/348-g corrections) |
| `diag_v25l/m/n/o_r13t.py` / `.json` | v25 hull & station dose rounds (Nov 10-11, 2026), CRN-paired against the v25b baseline: v25l full target-state run N=3000 (frame-shift finding), v25m/n hull dose rounds (221/226/306/308/315, 134 e+1), v25o station round with per-mode scores `score_m`/`score_r` (mission/raid split) and **P_Ψ = +2.0 per f-socket for all hulls including stations**; 102 Sternbasis dose A1B2D1E3 → A2B2D2E3. Ship medians comp: r1 −0.34 / r2 +1.45 / r3 −0.21 / r4 +4.20 (r1 −2.26 without P_Ψ, target −2) |
| `balancing.md`, `KNOWLEDGE.md` | Round log and project knowledge entrypoint (German) |

## Running

```bash
python3 diag_v23i_r13t.py     # full v23i measurement; env DIAG_N sets N (default 10000), seed 42, common random numbers; note: overwrites diag_v23i_r13t.json
python3 diag_random_r13t.py   # bare probe; note: overwrites diag_random_v23_r13t.json and its checkpoint
python3 diag_infra_prices_r13i.py  # infrastructure pricing model v9 (analytic, fast, no simulation)
python3 diag_infra_sweep_r13i.py   # regulator sweep (re-runs the pricing script per variant)
python3 diag_infra_curve_r13i.py   # curve anchor + outliers in the post-swap target state (projection of issue #815)
python3 diag_infra_outlier_r13i.py # lever measurement for the over-outliers against the fixed curve 0.3/0.5 (round I1y)
python3 diag_infra_effect_r13i.py  # effect levers for the classic outliers 333/435, 413, 169, 105 (round I1aa)
python3 diag_infra_r13i.py         # infrastructure combat-track measurement (battle sim, N=10000, checkpoint diag_infra_ckpt_r13i.json)
python3 diag_infra_final_r13i.py   # post-swap final verification with pinned anchors (fast, re-executes the pricing source)
python3 diag_anchor_live_r13i.py    # anchor live analysis: final verification without the pin (robustness proof for the I1ad decision; overwrites diag_anchor_live_r13i.json)
python3 diag_v25o_r13t.py          # v25 hull & station measurement with mode split; env HULL_N sets the cell count (default 3000), two-block runs via HULL_N=1500 then HULL_N=3000 (resume); overwrites diag_v25o_r13t.json and its checkpoint
```

Requirements: Python 3, no third-party dependencies. Needs `../cards/cards.csv` (i.e. `misc/cards/cards.csv`; a `cards.csv` next to the scripts or `../cards.csv` also works), plus `diag_random_r13t.py`, `frame_calibration.json` and the three `balancing_metric_*.py` modules in the same directory. The v25 scripts additionally require the **#795 target-state `cards.csv`** (the v25 rounds measure against the target state; the metric FINAL overrides were dropped accordingly). `diag_v23i_r13t.py` does **not** import the probe (it has no `__main__` guard): it loads the probe source up to the measurement section via `exec` with an isolated namespace. Checkpoint/resume every 2000 battles (`diag_v23i_ckpt_r13t.json`); delete the checkpoint for a fresh run.

## Model (frame v23d)

- **Battle:** one battle type (mission 50 % / raid 50 %); fleets drawn independently with **1–5 ships per side** (v23b playtest density), each ship 1–3 hull sections (sections count as cards); both sides always receive the same number of equipment cards (mirror factor = card count); unequal fleets arise endogenously (smaller fleet → more equipment).
- **Loadouts (Draw-v2):** every ship first draws **one mandatory weapon** (rarity-weighted, re-drawn until placeable, cap 300 draws; < 1 % of builds stay weaponless), then cards up to a per-battle equipment budget E derived from hulls and sockets (b_lo/b_hi); draw from all 69 FINAL cards (50 weapons + 19 stat cards), placed only on free, type-matching sockets.
- **Value frame v3 (bilateral difference):** gain = dealt − taken ± colony + mission loot, measured for the card under test in both roles (defender / raid attacker) on identical battle scenes (paired via common random numbers).
- **Score:** (role-averaged gain + 1.0 × hp) / (units + 1); units = socket costs (first socket 1.0 normal / 0.7 cheap, further sockets 0.7 / 0.5) + energy cost (0 if energy < 1, else 1 + 0.7 × (energy − 1)).
- **Halving rule:** the probe halves an attack if `attacker speed + phase range <= target speed` — **ties included** (decided >= rule, halved rate 25.8 % vs. 14.0 % under strict `<`). The server implements `<=` as well since #813 (#812 completed): probe and server now match (rounds up, before reductions).
- **Target curve v23g:** r1 1.5 / r2 1.7 / r3 2.0 / r4 2.5 / r5 3.0, tolerance band ±0.5, one shared curve for weapons and stat cards.
- Conditionally usable cards are valued by deployment only → deliberate outliers (v23i: 9 remaining, only open case: 163).

## Infrastructure balancing (round I1)

- **Scope:** 33 infrastructure cards (editions 1–4, R0–R2) reduced to 25 evaluation objects (r0 twins share one object each); R3–R5 (413/114/105) are evaluated in the same model but deliberately not re-balanced; edition 5 is out of scope.
- **Two-track model:** track K (combat infra: colony defense 156/169/448/238/345, control 239) is measured marginally inside the random-battle probe (colony-zone slots, raid cells only); track W (economy: actions, extra draws, energy, hand limit) is priced analytically from the v23i measurement anchors (exchange rate c_ex = 1.65, PV_equip 3.145).
- **Cost model v9:** units = 1 (static play cost) + energy + sockets on ships; non-planetary cards are scored as **dual profiles 50/50 ship/colony** (ship: full socket costs, energy course 1.0/0.7; colony: sockets free, cheaper energy course 0.5/0.3); planetary cards pay the surcharge P_planetar = 1.5. Energy producers do not pay energy costs (production is the gain), damped by **ALPHA_E = 0.25** (decided I1z path A, was 0.5).
- **Draw pricing:** extra draws are worth π_play × PV_DECK with **π_play = 0.75** (decided in I1w, was 0.5; playtest anchor: share of extra draws that turn into an extra play before game end).
- **Result (v9, π 0.75, α 0.25, pre-swap):** tier medians T1 (R0+R1) 0.412 / T2 (R2) 0.329 — the tier inversion is resolved off-model via **paired rarity swaps** (448+183+164 → R2, 333+435+154 → R1, 320 ⇄ 413) plus price buffs on 230 (E−1) and 219 (E−1, Ψ−1); tracked in issue #815. Expected post-swap state: T1 0.280 / T2 0.505 = 1.80× (at α 0.5: 0.310/0.505 = 1.63×).
- **Curve (decided I1x/I1y, fixed):** target curve **0.3 / 0.5** with a relative band of ±50 % (T1 0.15–0.45, T2 0.25–0.75). Post-swap anchors: T1 0.280 / T2 0.505 at ALPHA_E 0.25 (I1x at α 0.5: 0.310/0.505) — the rounded curve covers both, so the anchor is regulator-robust. Remaining outliers are deliberate: 172 +0.286 (I1p), 345 −0.150 (known flag), and the T2 tops 448/156/183 (price levers exhausted, I1y); 145 is in band at α 0.25. Outliers and lever measurements are tracked in `diag_infra_curve_r13i.json` and `diag_infra_outlier_r13i.json`. The classic outlier round (effect levers, no price levers) for 333/435, 413, 169 and 105 is measured in `diag_infra_effect_r13i.json`.
- **Regulators (all per playtest):** π_play (0.75), ALPHA_E (0.25, I1z path A), colony energy course (0.5/0.3), P_planetar (1.5); `diag_infra_sweep_r13i.py` maps their interaction space (cross-anchor law: Kraftwerk == Atomreaktor ⇔ P_planetar = E1 + 4·SUB − 1, α-independent, parity 0.412 at α 0.25).

## v25 balancing rounds (Nov 9-11, 2026)

- **Frame v25a:** the measurement basis moves from metric FINAL overrides to the **#795 target-state `cards.csv`** (17 rarity swaps, ring adjustment 171/125/140, equipment target values). Only the five X deductions (157/166/179/344/347) remain as metric overrides; `v9.FINAL` is trimmed accordingly.
- **Equipment re-pricing (v25a-v25k):** dose rounds on the paired CRN frame; the final ship medians (composite incl. P_Ψ) are r1 −0.34 / r2 +1.45 / r3 −0.21 / r4 +4.20 against the ship target curve r1 −2 / r2 −0.5 / r3 +2 / r4 +6 (r1 sits at −2.26 without P_Ψ, i.e. practically on target).
- **Hulls & stations (v25b, v25l-o):** 17 cumulative hull doses in `cards.csv` (16 ships + 102 Sternbasis A2B2D2E3), no hull swaps; each round is CRN-paired against the v25b baseline (`ref_score_t`) and the previous round (`ref25n_score_t` in v25o). **P_Ψ = +2.0 per f-socket** applies to all hulls including stations (decision Nov 11, 2026).
- **Mode split (v25o):** every row carries `score_m`/`score_r` (mission-only/raid-only) in addition to `score_t`. Station scores are dominated by type (outpost/raumstation/sternbasis), not rarity; the station sockets are a **design decision** (the player chooses the loadout — the measured absorption disadvantage of stations with few usable sockets is an artifact of the draw-v2 budget freeze, verified via the mode split: 228's lead is mission-driven).
- **Chain integrity:** each round's script + JSON is the paired reference of the next round (REF columns), so the full chain v25a…v25o is kept in this directory; checkpoints and run logs are not.

## Conventions

- All measurement scripts use seed 42 with common random numbers (paired measurements, regression-neutral card swaps).
- Scripts evaluate the **FINAL dicts** (v23i target values), not the `cards.csv` status quo; `cards.csv` is only the data basis for names, sockets and rarities. Since the v25a frame (Nov 9, 2026) this is inverted for the v25 chain: `cards.csv` carries the #795 target state and the metric FINAL overrides are dropped (except the five X deductions) — the v23 series scripts and JSONs predate this frame.
- Superseded round artifacts (audit and probe scripts, checkpoints, run logs, `cards.pre_*.csv` backups, earlier measurement JSONs such as v23f/g/h) are intentionally not kept in this directory; all of their results are documented in [balancing.md](balancing.md). Exception: the v25 round chain (v25a…v25o) is kept in full — each round's script + JSON is the paired reference baseline (REF columns) of the next round.
- The infrastructure scripts follow the same conventions: `diag_infra_r13i.py` loads the probe source the same way `diag_v23i_r13t.py` does; `diag_infra_sweep_r13i.py` re-executes `diag_infra_prices_r13i.py` with overridden regulators (its output never touches the pricing JSON).
- Script comments are in German (working copies from the German-first project); this README follows the repository convention (English).
