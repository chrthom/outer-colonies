#!/usr/bin/env python3
"""check9: Gemeinsamer Kalibrierungsrahmen (Kurven-Verankerung, 3.11.2026).

Christophers Ziel: Waffen und Nicht-Waffen GLEICHWERTIG, gemeinsame
Zielkurve. Dazu werden ALLE 50 FINAL-Waffen im SELBEN v11-Flotten-Frame
gemessen wie die 19 Statkarten: je Gefecht bekommt jedes Verteidiger-
Schiff 1 zusaetzliche Instanz der bewerteten Waffe (abstrakt ohne
Sockel-Check, analog zur Karten-Platzierung), Wert = Rahmen-v3-Konto-
Gewinn (Output - Gegner-Output/taken - Kolonie + Missionslohn) / 3
(Karten-Platzierung) / Einsatzkosten v3. Gepaarte Zuege (Common Random
Numbers). Karten-Schleife inkl. Abfang-Ausduennung (Runde 12c, Credit
entfallen); Waffen unberuehrt (kein Speed-Bonus).

Zusaetzlich: Sanitaet der Feuerquote (E[Angriffe] je Waffe vs. v9-k=1,59),
Rang-Korrelation der Waffen-Scores gegen v9-FINAL und Aufschluesselung
des Wert-Gewinns nach Konten (out/take/col/loot) fuer die Transparenz.

Aufruf: python3 check9_frame_calibration.py [N]   (Default 3000)
Ergebnis: frame_calibration.json
"""
import json
import os
import random
import statistics
import sys
import time

import balancing_metric_v10 as v10
import balancing_metric_v11 as v11
import balancing_metric_v9 as v9

HERE = os.path.dirname(os.path.abspath(__file__))
N = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
TAKE_WEIGHT = 1.0   # Rahmen v3: Gegner-Output (taken) mit Gewicht 1.0

V9_SCORES = {w['id']: w['scored'] for w in json.load(
    open(os.path.join(HERE, 'weapons_v9_final.json'), encoding='utf-8'))}

cpools = [(cs, p) for cs, p in v9.COLONY]
cptot = sum(p for _, p in cpools)


def e_attacks(w):
    if w['single']:
        return v10.ATTACK_PROB[min(w['range'], 4)]
    return sum(v10.ATTACK_PROB[p] for p in (4, 3, 2, 1) if p <= w['range'])


def spearman(xs, ys):
    def ranks(v):
        order = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        i = 0
        while i < len(v):
            j = i
            while j + 1 < len(v) and v[order[j + 1]] == v[order[i]]:
                j += 1
            avg = (i + j) / 2 + 1
            for k in range(i, j + 1):
                r[order[k]] = avg
            i = j + 1
        return r
    rx, ry = ranks(xs), ranks(ys)
    mx, my = sum(rx) / len(rx), sum(ry) / len(ry)
    cov = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    vx = sum((a - mx) ** 2 for a in rx) ** 0.5
    vy = sum((b - my) ** 2 for b in ry) ** 0.5
    return cov / (vx * vy)


def accounts(dealt, taken, colony, loot):
    """Wert-Konto zerlegt in Beitraege (Vorzeichen: mehr = mehr Wert)."""
    return dict(out=dealt, take=-TAKE_WEIGHT * taken, col=-colony, loot=loot)


# --- Sanitaet 1: Feuerquote vs v9-k ---
ws = v11.weapons
wtot = sum(v10.RARITY_W[w['rarity']] for w in ws)
e_att = sum(e_attacks(w) * v10.RARITY_W[w['rarity']] for w in ws) / wtot
print(f'E[Angriffe je Waffe/Gefecht] rarity-gewichtet: {e_att:.2f} '
      f'(v9-Joint-k-Referenz 1,59; Spanne '
      f'{min(e_attacks(w) for w in ws):.2f}-{max(e_attacks(w) for w in ws):.2f})')

# --- Gemeinsamer Frame ---
random.seed(42)
acc_w = {w['id']: dict(out=0.0, take=0.0, col=0.0, loot=0.0) for w in ws}
acc_c = {c['id']: dict(out=0.0, take=0.0, col=0.0, loot=0.0) for c in v11.cards}
loot0s, n_mission = 0.0, 0
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
    if not raid:
        loot0s += loot0
        n_mission += 1
    base = accounts(dealt0, take0, col0, loot0)
    for w2 in ws:
        t1, d1, dd0, _, c1, e1, l1 = v11.battle(
            w, att, deff, pool_cards, fire, order, raid=raid,
            wspec=w2, wspec_fire=wspec_fire, colpool=colpool)
        for k, v in accounts(d1, t1, c1, l1).items():
            acc_w[w2['id']][k] += v - base[k]
    for c in v11.cards:
        t1, d1, dd0, _, c1, e1, l1 = v11.battle(
            w, att, deff, pool_cards, fire, order, raid=raid,
            spec=c, colpool=colpool)
        for k, v in accounts(d1, t1, c1, l1).items():
            acc_c[c['id']][k] += v - base[k]
    if (b + 1) % 500 == 0:
        print(f'  {b + 1}/{N} Gefechte ({time.time() - t0:.0f}s)', flush=True)

LOOT_INT = loot0s / max(1, n_mission)   # Ø Missionslohn im abgefangenen Gefecht


def total(acc):
    return sum(acc.values())


rows_w = [dict(id=w['id'], title=w['title'], rarity=w['rarity'],
               units=v11.weapon_units(w),
               gain=round(total(acc_w[w['id']]) / N / 3, 3),
               out=round(acc_w[w['id']]['out'] / N / 3, 3),
               take=round(acc_w[w['id']]['take'] / N / 3, 3),
               col=round(acc_w[w['id']]['col'] / N / 3, 3),
               loot=round(acc_w[w['id']]['loot'] / N / 3, 3),
               score=round(total(acc_w[w['id']]) / N / 3 / v11.weapon_units(w), 3),
               v9=V9_SCORES.get(w['id']), e_att=round(e_attacks(w), 2))
          for w in ws]
rows_c = [dict(id=c['id'], title=c['title'], rarity=c['rarity'],
               units=c['units'],
               gain=round(total(acc_c[c['id']]) / N / 3, 3),
               out=round(acc_c[c['id']]['out'] / N / 3, 3),
               take=round(acc_c[c['id']]['take'] / N / 3, 3),
               col=round(acc_c[c['id']]['col'] / N / 3, 3),
               loot=round(acc_c[c['id']]['loot'] / N / 3, 3),
               score=round(total(acc_c[c['id']]) / N / 3 / c['units'], 3))
          for c in v11.cards]

print(f'\n=== Gemeinsamer v11-Rahmen v3 (N={N}), Wert = Konto-Gewinn/3 je Einheiten ===')
print('Waffen je Raritaet (Median) vs v9-FINAL vs Statkarten:')
targets = {}
for rar in (1, 2, 3, 4, 5):
    gw = [r for r in rows_w if r['rarity'] == rar]
    gc = [r for r in rows_c if r['rarity'] == rar]
    mw = statistics.median(r['score'] for r in gw) if gw else None
    mc = statistics.median(r['score'] for r in gc) if gc else None
    v9m = statistics.median(r['v9'] for r in gw) if gw else None
    lam = (mw / mc) if (mw and mc) else None
    targets[rar] = round(mw, 2) if mw else None
    print(f'  r{rar}: Waffen v11 {mw:.2f} (n={len(gw)}, v9-FINAL {v9m:.2f}, '
          f'λ_v9/v11 {v9m / mw:.1f}x) | Statkarten v11 {mc:.2f} (n={len(gc)}) '
          f'| Lücke Waffe/Karte {lam:.1f}x')

rho = spearman([r['score'] for r in rows_w], [r['v9'] for r in rows_w])
print(f'Spearman-Rangkorrelation Waffen v11-Frame vs v9-FINAL: {rho:+.2f}')
print('\nTop/Bottom 5 Waffen im v11-Frame:')
for r in sorted(rows_w, key=lambda x: -x['score'])[:5]:
    print(f"  {r['id']:>3} r{r['rarity']} {r['title'][:22]:<22} "
          f"v11 {r['score']:5.2f} (v9 {r['v9']:5.2f}, E[Ang] {r['e_att']:.2f})")
for r in sorted(rows_w, key=lambda x: x['score'])[:5]:
    print(f"  {r['id']:>3} r{r['rarity']} {r['title'][:22]:<22} "
          f"v11 {r['score']:5.2f} (v9 {r['v9']:5.2f}, E[Ang] {r['e_att']:.2f})")

# Konto-Aufschluesselung (Median je Seite, zur Transparenz)
print(f'\nØ Missionslohn im abgefangenen Gefecht (Baseline): {LOOT_INT:.2f} Marker'
      f' | ohne Abfang (volle Flotten-Kontrolle): {v11.LOOT_NO_INTERCEPT:.2f}'
      f' (E[Flotten-Kontrolle] {v11.E_FLEET_CTRL:.2f})')
print('Konto-Aufschluesselung des Wert-Gewinns/3 (Mediane):')
for label, rows in (('Waffen', rows_w), ('Statkarten', rows_c)):
    for k, lab in (('out', 'Output'), ('take', 'Verhinderung (taken)'),
                   ('col', 'Kolonie'), ('loot', 'Missionslohn')):
        print(f'  {label:<10} {lab:<13} {statistics.median(r[k] for r in rows):+.3f}')

print(f'\nVorschlag TARGETS_V14 (Messung; r5 offiziell = Trend 3,55): {targets}')
json.dump(dict(n=N, e_attacks=e_att, take_weight=TAKE_WEIGHT,
               ctrl_w=v11.CTRL_W,
               loot_intercept=round(LOOT_INT, 3),
               loot_no_intercept=round(v11.LOOT_NO_INTERCEPT, 3),
               e_fleet_ctrl=round(v11.E_FLEET_CTRL, 3),
               targets_v14=targets, weapons=rows_w, cards=rows_c),
          open(os.path.join(HERE, 'frame_calibration.json'), 'w',
               encoding='utf-8'), ensure_ascii=False, indent=1)
print('-> frame_calibration.json geschrieben')
