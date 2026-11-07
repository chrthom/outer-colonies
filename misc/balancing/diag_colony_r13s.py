#!/usr/bin/env python3
"""diag_colony_r13s: Regel-Vergleich der R1-Kolonie-Zielwahl (Runde 13r).

Christopher: 'Im Raid auf R1 ist der Angriff auf die Kolonie haeufig die
bessere Wahl.' Analyse- Fakten (13r): effektiver Kolonieschaden 18,1 vs.
Schiffsschaden 17,3 (vor Overkill), am Schiff gehen 38 % durch Overkill
verloren -> rational ist die Kolonie ~1,7x besser; der Frame vergleicht
aber 0,7x0,7x18,1 = 8,9 (r1_col doppelt diskontiert, NACH Kolonie-Defense)
gegen 17,3 BRUTTO (VOR Schiff-Defense) -> Kolonie gewinnt fast nie.

battle() hat col_rule (13r): 'std' = bisher (regressionsneutral),
'eff' = rationaler Vergleich des NUTZBAREN Schadens (Kolonie-Effektiv
ohne 0,7, Schiff nach Defense auf Rest-HP gedeckelt), 'always' = R1 im
Raid immer Kolonie (Obergrenze).

Messung (gepaart, seed 42): N Raids (13q-Frame DMG_SCALE=(2,2)), je
Regel: P(Raid mit Kolonieangriff), O Kolonie-Marker je Raid, Baseline-
Konten; Kolonie-Deltas je Karte (537 Speed, 171 Panzerung, 184 hp,
Seite 0 Verteidiger, spec_n_inst) und je Waffe (224/405 Kolonie-Killer,
106 Nicht-Killer, wspec Seite 1 Raid-Angreifer). Alle Regeln auf
IDENTISCHEN Szenarien (Zuege gecacht vor der Messung) -> Differenzen
rein regelbedingt. 'std' muss die r13r-Werte reproduzieren
(P=0,4 %, O 0,175 je Raid)."""
import random

import balancing_metric_v9 as v9
import balancing_metric_v10 as v10
import balancing_metric_v11 as v11

N = 2000
DMG_SCALE = (2.0, 2.0)
RULES = ('std', 'eff', 'always')
CARDS = ('537', '171', '184')      # Speed, Panzerung, HP (Seite 0)
WEAPONS = ('224', '405', '106')    # Killer, Killer, Nicht-Killer (Seite 1)

cpools = [(cs, p) for cs, p in v9.COLONY]
cptot = sum(p for _, p in cpools)
cs_byid = {c['id']: c for c in v11.cards}
ws_byid = {w['id']: w for w in v11.weapons}

# --- Phase 1: Szenarien ziehen (cache; gleiche fuer alle Regeln) ---
random.seed(42)
wf_rng = random.Random(123)   # separater Strom: Hauptstrom == r13r
scen = []
for i in range(N):
    while True:
        w, att, deff, raid = v11.draw_battle()
        if raid:
            break
    pool_cards, _ = v11.pools[random.choices(
        range(len(v11.pools)), weights=v11.pprob)[0]]
    colpool = cpools[random.choices(
        range(len(cpools)), weights=[p / cptot for _, p in cpools])[0]][0]
    fire = [[[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
             for _ in range(3)] for _ in (0, 1)]
    order = (0, 1) if i % 2 == 0 else (1, 0)
    wfire = [[wf_rng.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
             for _ in range(3)]   # separater Strom: Sequenz == r13r
    scen.append((w, att, deff, pool_cards, colpool, fire, wfire, order))

# --- Phase 2: Messung je Regel ---
print(f'N={N} Raids, DMG_SCALE={DMG_SCALE}, seed 42, gepaart')
hdr = (f"{'rule':8} {'P(colAtk)':>9} {'col/Raid':>8} {'col|Atk':>7} "
       f"{'taken0':>7} {'taken1':>7} {'dead0':>6} {'dead1':>6}")
res = {}
for rule in RULES:
    n_col = 0
    col_sum = 0.0
    tk0 = tk1 = d0 = d1 = 0.0
    kc = {cid: dict(moved=0, dcol=0.0) for cid in CARDS}
    kw = {wid: dict(moved=0, dcol=0.0) for wid in WEAPONS}
    for (w, att, deff, pool_cards, colpool, fire, wfire, order) in scen:
        r0 = v11.battle(w, att, deff, pool_cards, fire, order, raid=True,
                        colpool=colpool, dmg_scale=DMG_SCALE, ret='full',
                        col_rule=rule)
        col = r0['colony']
        if col > 0:
            n_col += 1
        col_sum += col
        tk0 += r0['taken0']; tk1 += r0['taken1']
        d0 += r0['dead0']; d1 += r0['dead1']
        for cid in CARDS:
            rc = v11.battle(w, att, deff, pool_cards, fire, order,
                            raid=True, colpool=colpool,
                            dmg_scale=DMG_SCALE, spec=cs_byid[cid],
                            spec_side=0, spec_n_inst=True, ret='full',
                            col_rule=rule)
            d = rc['colony'] - col
            if d != 0:
                kc[cid]['moved'] += 1
            kc[cid]['dcol'] += d
        for wid in WEAPONS:
            rw = v11.battle(w, att, deff, pool_cards, fire, order,
                            raid=True, colpool=colpool,
                            dmg_scale=DMG_SCALE, wspec=ws_byid[wid],
                            wspec_fire=wfire, wspec_side=1,
                            ret='full', col_rule=rule)
            d = rw['colony'] - col
            if d != 0:
                kw[wid]['moved'] += 1
            kw[wid]['dcol'] += d
    res[rule] = dict(n_col=n_col, col_sum=col_sum, tk0=tk0, tk1=tk1,
                     d0=d0, d1=d1, kc=kc, kw=kw)
    print('\n' + '=' * 70)
    print(f"REGEL {rule!r}")
    print(hdr)
    print(f"{rule:8} {n_col / N:>9.1%} {col_sum / N:>8.3f} "
          f"{col_sum / max(1, n_col):>7.2f} {tk0 / N:>7.2f} {tk1 / N:>7.2f} "
          f"{d0 / N:>6.2f} {d1 / N:>6.2f}")
    print('  Karten (Seite 0 Verteidiger; dcol < 0 = weniger Kolonieschaden):')
    for cid in CARDS:
        st = kc[cid]
        print(f"    {cid} {cs_byid[cid].get("name", "?")[:22]:22} "
              f"moved {st['moved'] / N:>5.1%}  dcol/Raid {st['dcol'] / N:>+7.3f}")
    print('  Waffen (Seite 1 Raid-Angreifer; dcol > 0 = mehr Kolonie-Beute):')
    for wid in WEAPONS:
        st = kw[wid]
        nm = ws_byid[wid].get("name", "?")[:22]
        kl = 'x2' if ws_byid[wid]['colony_killer'] else '  '
        print(f"    {wid} {nm:22} {kl} moved {st['moved'] / N:>5.1%}"
              f"  dcol/Raid {st['dcol'] / N:>+7.3f}")
