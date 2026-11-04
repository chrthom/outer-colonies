#!/usr/bin/env python3
"""role_probe_r13m (Christophers Rollen-Fix, 4.11.2026): Die bewertete
Waffe wird je Gefecht in BEIDEN Rollen gemessen (Seite 0 = Verteidiger,
Seite 1 = Raid-Angreifer inkl. R1-Kolonie-Logik mit Verheerend (Kolonie)
= x2); Score = 50/50-Rollenmittel. Konten aus Sicht der jeweiligen
bewerteten Seite: Seite 0 = out - take - col + loot; Seite 1 = out -
take + col (Beute) + loot.

Diese Probe misst die Differenz Verteidiger- vs. Angreiferrolle fuer die
6 Kolonie-Killer-Waffen (150/167/224/318/405/422), hohe-r1_col-Waffen
(302/409/420/424/101/304/106/136/127) und 2 Referenzen (234/180) —
alles FINAL, im neuen Frame n1+c3+shift0. N=10k, CRN seed 42.
Ergebnis: role_probe_r13m.json + stdout.
"""
import json
import os
import random
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import balancing_metric_v11 as v11
import balancing_metric_v10 as v10
import balancing_metric_v9 as v9

N = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
T = dict(v11.TARGETS_V14)
TAKE_WEIGHT = 1.0

IDS = ['150', '167', '224', '318', '405', '422',
       '302', '409', '420', '424', '101', '304', '106', '136', '127',
       '234', '180']
byid = {w['id']: w for w in v11.weapons}
SPECS = [(wid, dict(byid[wid])) for wid in IDS]   # FINAL, keine Kopie noetig

acc = {wid: [0.0, 0.0] for wid, _ in SPECS}   # [gain0, gain1]
base0 = base1 = 0.0
raid_n = 0
t0 = time.time()

cpools = [(cs, p) for cs, p in v9.COLONY]
cptot = sum(p for _, p in cpools)

random.seed(42)
for b in range(N):
    w, att, deff, raid = v11.draw_battle()
    pool_cards, _ = v11.pools[random.choices(
        range(len(v11.pools)), weights=v11.pprob)[0]]
    colpool = None
    if raid:
        raid_n += 1
        colpool = cpools[random.choices(
            range(len(cpools)), weights=[p / cptot for _, p in cpools])[0]][0]
    fire = [[[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
             for _ in range(3)] for _ in (0, 1)]
    wspec_fire = [[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
                  for _ in range(3)]
    order = (0, 1) if b % 2 == 0 else (1, 0)
    r = v11.battle(w, att, deff, pool_cards, fire, order, raid=raid,
                   colpool=colpool, ret='full')
    # Konten beider Seiten (Baseline)
    b0 = r['dealt0'] - TAKE_WEIGHT * r['taken0'] - r['colony'] + r['loot0']
    b1 = r['dealt1'] - TAKE_WEIGHT * r['taken1'] + r['colony'] + r['loot1']
    base0 += b0
    base1 += b1
    for wid, sp in SPECS:
        r0 = v11.battle(w, att, deff, pool_cards, fire, order, raid=raid,
                        wspec=sp, wspec_fire=wspec_fire, colpool=colpool,
                        wspec_side=0, ret='full')
        r1 = v11.battle(w, att, deff, pool_cards, fire, order, raid=raid,
                        wspec=sp, wspec_fire=wspec_fire, colpool=colpool,
                        wspec_side=1, ret='full')
        g0 = (r0['dealt0'] - TAKE_WEIGHT * r0['taken0'] - r0['colony']
              + r0['loot0']) - b0
        g1 = (r1['dealt1'] - TAKE_WEIGHT * r1['taken1'] + r1['colony']
              + r1['loot1']) - b1
        acc[wid][0] += g0
        acc[wid][1] += g1
    if (b + 1) % 2000 == 0:
        print(f'  {b + 1}/{N} ({time.time() - t0:.0f}s)', flush=True)

rows = []
for wid, sp in SPECS:
    units = v11.weapon_units(sp)
    s0 = acc[wid][0] / N / 3 / units
    s1 = acc[wid][1] / N / 3 / units
    sm = (s0 + s1) / 2
    r = sp['rarity']
    rows.append(dict(
        id=wid, title=sp['title'], rarity=r,
        killer=sp.get('colony_killer', False),
        r1_col=round(sp.get('r1_col') or 0.0, 2),
        score0=round(s0, 3), score1=round(s1, 3), score_mean=round(sm, 3),
        delta0=round(s0 - T[r], 2), delta1=round(s1 - T[r], 2),
        delta_mean=round(sm - T[r], 2)))
out = dict(n=N, raid_share=round(raid_n / N, 3), baseline0=round(base0 / N, 2),
           baseline1=round(base1 / N, 2), targets=T, rows=rows)
json.dump(out, open(os.path.join(HERE, 'role_probe_r13m.json'), 'w',
                    encoding='utf-8'), ensure_ascii=False, indent=1)

print(f"\nRollen-Probe (N={N}, Raid-Anteil {out['raid_share']:.1%}, "
      f"Frame n1+c3+shift0)")
print(f"Baseline-Konto: Seite 0 {out['baseline0']} / Seite 1 {out['baseline1']}")
print(f"{'id':>4} {'Titel':24} {'kill':4} {'r1col':>6} "
      f"{'Vert.':>7} {'Ang.':>7} {'Mittel':>7} {'D0':>6} {'D1':>6} {'DM':>6}")
for r_ in rows:
    print(f"{r_['id']:>4} {r_['title'][:24]:24} "
          f"{'x2' if r_['killer'] else '-':4} {r_['r1_col']:6.1f} "
          f"{r_['score0']:7.2f} {r_['score1']:7.2f} {r_['score_mean']:7.2f} "
          f"{r_['delta0']:+6.2f} {r_['delta1']:+6.2f} {r_['delta_mean']:+6.2f}")
