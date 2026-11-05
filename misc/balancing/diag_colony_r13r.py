#!/usr/bin/env python3
"""diag_colony_r13r: Christophers Kolonie-These (4.11.2026).

Frage: 'Warum ist der Koloniewert bei allen Karten ~0? Beim Raid als
Verteidiger sollten hier regelmaessig Minuspunkte sein.'

Messung (gepaart, seed 42): N Raids (nur Raid-Gefechte, 13q-Frame mit
DMG_SCALE=(2,2)), Kolonie-Konto absolut + Differenz durch je 1
Statkarte (171 staerkste Panzerung, 140 Schild, 537 Speed) auf Seite 0.

Output: P(Kolonieangriff im Raid), Ø Kolonie-Marker je Raid (mit/ohne
Karte), Anteil der Raids, in denen die Karte den Kolonieschaden bewegt
(±), und die Richtung des Effekts."""
import random

import balancing_metric_v9 as v9
import balancing_metric_v10 as v10
import balancing_metric_v11 as v11

N = 2000
DMG_SCALE = (2.0, 2.0)
cpools = [(cs, p) for cs, p in v9.COLONY]
cptot = sum(p for _, p in cpools)
cs_byid = {c['id']: c for c in v11.cards}

random.seed(42)
stats = {cid: dict(moved=0, up=0, down=0, dcol=0.0) for cid in ('171', '140', '537')}
n_raid = n_col = 0
col_sum = 0.0
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
    r0 = v11.battle(w, att, deff, pool_cards, fire, order, raid=True,
                    colpool=colpool, dmg_scale=DMG_SCALE, ret='full')
    n_raid += 1
    col = r0['colony']
    if col > 0:
        n_col += 1
    col_sum += col
    for cid in ('171', '140', '537'):
        rc = v11.battle(w, att, deff, pool_cards, fire, order, raid=True,
                        colpool=colpool, dmg_scale=DMG_SCALE,
                        spec=cs_byid[cid], spec_side=0, spec_n_inst=True,
                        ret='full')
        d = rc['colony'] - col
        st = stats[cid]
        if d != 0:
            st['moved'] += 1
            (st.__setitem__('up', st['up'] + 1) if d > 0
             else st.__setitem__('down', st['down'] + 1))
        st['dcol'] += d

print(f'Raids: {n_raid} | P(Kolonieangriff, colony>0): {n_col / n_raid:.1%}')
print(f'Ø Kolonie-Marker je Raid (Seite 0, absolut): {col_sum / n_raid:.3f}')
print(f'Ø je Gefecht ueber alle (x0,5 Raid-Anteil): {col_sum / n_raid / 2:.3f}')
for cid, st in stats.items():
    c = cs_byid[cid]
    print(f"Karte {cid} {c['title'][:24]}: Raids mit Kolonie-Delta {st['moved']:.1%} "
          f"(mehr Schaden {st['up']} / weniger {st['down']}), "
          f"Ø Delta je Raid {st['dcol'] / n_raid:+.3f}")
