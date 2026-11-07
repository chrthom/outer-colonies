#!/usr/bin/env python3
"""range_probe_r13j: Range-Sensitivitaet im Frame v16 (Runde 13j, 4.11.2026).

Christophers These: 'Reichweite bringt im bisherigen Modell zu wenig, obwohl
man hiermit Ziele frueh ausschalten und Schadenshalbierung umgehen kann.'
(Phase 4 = 100 % Feuerquote, Halbierung nur wenn eigene speed + Phase <
Ziel-speed, fruehe Kills verhindern Gegenschuesse in Phase 3-1.)

Sensoren: wspec-Varianten mit range +/- 1 (und zum Vergleich dmg +/- 1)
auf FINAL-Waffen OHNE 13g-Paket, N=10k, CRN/seed 42, Frame v16 (2 Waffen
auf 2-/3-teiligen Schiffen). 412 range 4 ist Christophers konkreter Fall
(audit_r13g hatte einen Bug: range wurde nicht angewandt — hier gefixt).

Aufruf: python3 range_probe_r13j.py [N]
"""
import json
import os
import random
import sys
import time

import balancing_metric_v10 as v10
import balancing_metric_v11 as v11
import balancing_metric_v9 as v9

HERE = os.path.dirname(os.path.abspath(__file__))
N = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
TAKE_WEIGHT = 1.0

byid = {w['id']: w for w in v11.weapons}


def variant(wid, **ch):
    w = dict(byid[wid])
    w['abz'] = dict(w['abz'])
    if 'dmg' in ch:
        w['damage'] = ch['dmg']
    if 'e' in ch:
        w['energy'] = ch['e']
    if 'range' in ch:
        w['range'] = ch['range']
    if 'abz' in ch:
        w['abz'].update(ch['abz'])
    w['fire_phase'] = min(w['range'], 4)
    w['r1_col'] = v10.colony_r1(w)
    return w


SENSORS = [
    # (Label, id, Aenderungen) — range-Leiter + dmg-Vergleichspunkte
    ('343 range1', '343', dict(range=1)),
    ('343 range2 (FINAL)', '343', {}),
    ('343 range3', '343', dict(range=3)),
    ('343 range4', '343', dict(range=4)),
    ('343 dmg5 (Vergl.)', '343', dict(dmg=5)),
    ('118 range1 (FINAL)', '118', {}),
    ('118 range2', '118', dict(range=2)),
    ('118 range3', '118', dict(range=3)),
    ('125 range1 (FINAL)', '125', {}),
    ('125 range2', '125', dict(range=2)),
    ('125 dmg15 (Vergl.)', '125', dict(dmg=15)),
    ('237 range1 (FINAL)', '237', {}),
    ('237 range2', '237', dict(range=2)),
    ('405 range3 (FINAL)', '405', {}),
    ('405 range4', '405', dict(range=4)),
    ('412 range3 (FINAL)', '412', {}),
    ('412 range4', '412', dict(range=4)),
    ('412 range4+dmg12', '412', dict(range=4, dmg=12, abz={'pd': 6})),
    ('150 range2 (FINAL)', '150', {}),
    ('150 range3', '150', dict(range=3)),
]

specs = [(lbl, wid, variant(wid, **ch)) for lbl, wid, ch in SENSORS]
acc = {lbl: dict(out=0.0, take=0.0, col=0.0, loot=0.0) for lbl, _, _ in specs}
cpools = [(cs, p) for cs, p in v9.COLONY]
cptot = sum(p for _, p in cpools)

random.seed(42)
t0 = time.time()
for b in range(N):
    w, att, deff, raid = v11.draw_battle()
    pool_cards, _ = v11.pools[random.choices(
        range(len(v11.pools)), weights=v11.pprob)[0]]
    colpool = None
    if raid:
        colpool = cpools[random.choices(
            range(len(cpools)), weights=[p / cptot for _, p in cpools])[0]][0]
    fire = [[[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
             for _ in range(3)] for _ in (0, 1)]
    wspec_fire = [[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
                  for _ in range(3)]
    order = (0, 1) if b % 2 == 0 else (1, 0)
    take0, dealt0, dead0, _, col0, eq0, loot0 = v11.battle(
        w, att, deff, pool_cards, fire, order, raid=raid, colpool=colpool)
    base = dict(out=dealt0, take=-TAKE_WEIGHT * take0, col=-col0, loot=loot0)
    for lbl, wid, sp in specs:
        t1, d1, dd0, _, c1, e1, l1 = v11.battle(
            w, att, deff, pool_cards, fire, order, raid=raid,
            wspec=sp, wspec_fire=wspec_fire, colpool=colpool)
        for k, v in dict(out=d1, take=-TAKE_WEIGHT * t1, col=-c1,
                         loot=l1).items():
            acc[lbl][k] += v - base[k]
    if (b + 1) % 2500 == 0:
        print(f'  {b + 1}/{N} ({time.time() - t0:.0f}s)', flush=True)

print(f'\nRange-Sensitivitaet im Frame v16 (N={N}, FINAL ohne 13g-Paket):')
print(f'{"Sensor":22} {"r":>2} {"units":>6} {"score":>6} {"gain":>5}')
rows = []
for lbl, wid, sp in specs:
    a = acc[lbl]
    units = v11.weapon_units(sp)
    gain = sum(a.values()) / N / 3
    score = gain / units
    rows.append(dict(label=lbl, id=wid, score=round(score, 3),
                     units=round(units, 2), gain=round(gain, 2)))
    print(f'{lbl:22} {sp["rarity"]:>2} {units:6.2f} {score:6.2f} '
          f'{gain:5.2f}')
with open(os.path.join(HERE, 'range_probe_r13j.json'), 'w',
          encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=1)
