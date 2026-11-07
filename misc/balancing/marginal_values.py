#!/usr/bin/env python3
"""Marginalwerte synthetischer Defensivkarten (v10-Maschinerie, FINAL-Waffenfeld).
Basis-Chassis: 1x Omega-Sockel, E0 -> 0,7 Einheiten. Score = verhindert / 0,7."""
import sys
import balancing_metric_v10 as v10
import balancing_metric_v9 as v9

UNITS = 0.7

def setup():
    weapons = v10.load_attackers(final=True)
    for w in weapons:
        w['r1_col'] = v10.colony_r1(w)
    wtot = sum(v10.RARITY_W[w['rarity']] for w in weapons)
    pools = []
    for cards, prob in v9.SHIP:
        tot = {'pd': 0, 'shield': 0, 'armour': 0}
        for c in cards:
            tot[c['type']] += c['points']
        pools.append((cards, prob, tot))
    T0 = {}
    for i, w in enumerate(weapons):
        for j, (cards, _, _) in enumerate(pools):
            T0[(i, j)] = v10.ship_taken(w, cards, 0.0, 0, w['r1_col'])
    return weapons, wtot, pools, T0

def prevented(spec, weapons, wtot, pools, T0):
    added = spec['added']
    hp = spec.get('hp', 0)
    dsum = sum(prob for _, prob, _ in pools)
    prev = 0.0
    for i, w in enumerate(weapons):
        ww = v10.RARITY_W[w['rarity']] / wtot
        for j, (cards, prob, _) in enumerate(pools):
            t1 = v10.ship_taken(w, cards + added, 0.0, hp, w['r1_col'])
            prev += ww * (prob / dsum) * (T0[(i, j)] - t1)
    return prev

def spec(name, pts=None, t=None, recharge='phase', hp=0):
    added = ([{'type': t, 'points': pts, 'recharge': recharge}] if pts else [])
    return dict(name=name, added=added, hp=hp)

SPECS = [
    ('S1', spec('S1', 1, 'shield')),
    ('S2', spec('S2', 2, 'shield')),
    ('S3', spec('S3', 3, 'shield')),
    ('S4', spec('S4', 4, 'shield')),
    ('P1', spec('P1', 1, 'armour', 'never')),
    ('P2', spec('P2', 2, 'armour', 'never')),
    ('P3', spec('P3', 3, 'armour', 'never')),
    ('P4', spec('P4', 4, 'armour', 'never')),
    ('PD1', spec('PD1', 1, 'pd')),
    ('PD2', spec('PD2', 2, 'pd')),
    ('PD3', spec('PD3', 3, 'pd')),
    ('S1u', spec('S1u', 1, 'shield', 'attack')),
    ('P1u', spec('P1u', 1, 'armour', 'attack')),
    ('PD1u', spec('PD1u', 1, 'pd', 'attack')),
]

if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'points'
    weapons, wtot, pools, T0 = setup()
    print(f"{'Karte':<6} {'verhindert':>10} {'Score':>7}")
    for name, sp in SPECS:
        p = prevented(sp, weapons, wtot, pools, T0)
        print(f"{name:<6} {p:10.3f} {p/UNITS:7.2f}", flush=True)
