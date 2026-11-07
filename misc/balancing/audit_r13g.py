#!/usr/bin/env python3
"""audit_r13g: Messung von Christophers Waffen-Paket (Runde 13g, 4.11.2026).

Paket A = Christophers Erstwahl je Waffe (in-place auf v11.weapons, wirkt
damit auch als Gefechts-Waffe im Feld). Alternativ-Varianten (157/166/409/
118/106/405/318/150) werden zusaetzlich als wspec-Kopien im selben Lauf
gemessen (Common Random Numbers, identische Gefechte wie check9 N=10k,
seed 42). Auswertung gegen die PROVISORISCHE Referenzkurve = frische
Messmediane im sauberen Frame (Runde 13j: 8,54/7,77/8,96/7,53/8,56);
Christophers Glaettung ersetzt diese Werte, sobald beschlossen.

Zusaetzlich wird die Baseline-Verlustrate gezaehlt (fuer die HP-Konto-
Diskussion Runde 13h: wie oft stirbt ueberhaupt ein Verteidiger-Schiff,
d.h. wie oft kann ein hp-Puffer ueberhaupt ausgenutzt werden).

Aufruf: python3 audit_r13g.py [N]   (Default 10000)
Ergebnis: audit_r13g.json + stdout-Tabelle
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
# Provisorische Referenz = frische Messmediane im sauberen Frame v16
# (Runde 13j, N=10k nach Muenz-/Schatten-Bugfix; Christophers Glaettung
# ersetzt diese Werte, sobald beschlossen):
T = {0: 6.5, 1: 8.54, 2: 7.77, 3: 8.96, 4: 7.53, 5: 8.56}

# --- Christophers Paket A (Runde 13g): in-place Patch der FINAL-Waffen ---
# abz-Eintraege sind UPDATES auf die bestehenden Abzuege (Basis bleibt).
PACKAGE = {
    '302': dict(dmg=55, abz={'shield': 10}),            # dmg 72->55, SAbz 6->10
    '118': dict(dmg=5),                                  # dmg 6->5
    '157': dict(dmg=6),                                  # dmg 7->6 (shield X bleibt)
    '166': dict(abz={'armour': 2}),                      # dmg 3, PzAbz 1->2 (shield X bleibt)
    '438': dict(dmg=2),                                  # dmg 3->2
    '409': dict(dmg=25, abz={'shield': 10}),             # dmg 26->25, SAbz 6->10
    '125': dict(dmg=15),                                 # dmg 17->15 (SAbz 7 bleibt)
    '343': dict(dmg=5),                                  # dmg 6->5
    '421': dict(dmg=8),                                  # dmg 9->8
    '401': dict(dmg=40),                                 # dmg 30->40
    '310': dict(e=1),                                    # E 2->1, dmg 7 (kein dmg-Buff)
    '318': dict(dmg=16, abz={'pd': 8}),                  # dmg 14->16, PDAbz 7->8 (=dmg/2)
    '405': dict(e=0),                                    # E 1->0, dmg 7
    '150': dict(dmg=14, abz={'pd': 7, 'shield': 4}),     # dmg 12->14, PD 6->7 (=dmg/2), S 4
    '106': dict(dmg=12, e=2, abz={'shield': 4}),         # dmg 11->12, E 4->2, SAbz 6->4
    '412': dict(dmg=12, abz={'pd': 6}),                  # dmg 8->12, PD 4->6 (=dmg/2)
}

byid = {w['id']: w for w in v11.weapons}


def apply(w, ch):
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


for wid, ch in PACKAGE.items():
    apply(byid[wid], ch)


def variant(wid, **ch):
    """Flache Kopie einer FINAL-Waffe mit Varianten-Aenderungen (nur wspec)."""
    w = dict(byid[wid])
    w['abz'] = dict(w['abz'])
    apply(w, ch)
    return w


# --- Messliste: Paket-Instanzen (Referenz auf gepatchte Waffen) ---
specs = [('A', w['id'], w) for w in v11.weapons if w['id'] in PACKAGE]
# --- Alternativ-Varianten (Kopien, wirken nur als wspec) ---
ALT = [
    ('B', '157', dict(dmg=5)),                          # staerkster Nerf
    ('C', '157', dict(dmg=6, abz={'armour': 2})),        # dmg 6 + PzAbz 2
    ('B', '166', dict(dmg=2, abz={'armour': 2})),       # dmg 2 + PzAbz 2
    ('B', '409', dict(dmg=25, abz={'shield': 12})),     # SAbz 12 statt 10
    ('B', '118', dict(dmg=4)),                          # staerkerer Nerf
    ('B', '106', dict(dmg=11, e=2, abz={'shield': 4})), # nur E-Reduktion
    ('B', '405', dict(dmg=8, e=1)),                     # dmg-Buff statt E-Reduktion
    ('B', '318', dict(dmg=18, abz={'pd': 9})),          # falls 16 nicht reicht
    ('B', '150', dict(dmg=16, abz={'pd': 8, 'shield': 4})),  # falls 14 nicht reicht
    ('C', '166', dict(dmg=2, abz={'armour': 1})),       # dmg 2, PzAbz zurueck auf 1
    ('E', '166', dict(dmg=3, abz={'armour': 3})),       # dmg 3, PzAbz 1->3
    ('C', '409', dict(dmg=23, abz={'shield': 10})),     # dmg 23 + SAbz 10
    ('D', '409', dict(dmg=25, abz={'shield': 10, 'armour': 2})),  # + PzAbz 2
    ('B', '310', dict(e=1, abz={'armour': 2})),         # E 1 + PzAbz 3->2
    ('C', '310', dict(e=1, abz={'armour': 1})),         # E 1 + PzAbz 3->1
    ('D', '310', dict(dmg=8, e=1)),                     # E 1 + dmg 8 (falls doch dmg)
    ('B', '347', dict(dmg=4)),                          # SAbz X ist bereits aktiv; dmg-Option
    # --- Runde 13i (Christophers Rueckfragen 4.11.2026) ---
    ('C', '318', dict(dmg=16, abz={'pd': 8, 'shield': 3, 'armour': 2})),  # Abzuege -1
    ('D', '318', dict(dmg=18, abz={'pd': 9, 'shield': 3, 'armour': 2})),  # + dmg 18
    ('B', '412', dict(range=4)),                        # Reichweite 3->4 (sonst Paket A)
    ('C', '412', dict(dmg=14, abz={'pd': 7}, range=4)),  # Reichweite 4 + dmg 14
]
for lbl, wid, ch in ALT:
    specs.append((lbl, wid, variant(wid, **ch)))

old = {r['id']: r for r in json.load(
    open(os.path.join(HERE, 'frame_calibration.json'), encoding='utf-8'))
    if 'id' in r}

acc = {(lbl, wid): dict(out=0.0, take=0.0, col=0.0, loot=0.0)
       for lbl, wid, _ in specs}

cpools = [(cs, p) for cs, p in v9.COLONY]
cptot = sum(p for _, p in cpools)

random.seed(42)
losses = dead0s = n_m = 0
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
    losses += 1 if dead0 >= 1 else 0
    dead0s += dead0
    base = dict(out=dealt0, take=-TAKE_WEIGHT * take0, col=-col0, loot=loot0)
    for lbl, wid, sp in specs:
        t1, d1, dd0, _, c1, e1, l1 = v11.battle(
            w, att, deff, pool_cards, fire, order, raid=raid,
            wspec=sp, wspec_fire=wspec_fire, colpool=colpool)
        for k, v in dict(out=d1, take=-TAKE_WEIGHT * t1, col=-c1,
                         loot=l1).items():
            acc[(lbl, wid)][k] += v - base[k]
    if (b + 1) % 2000 == 0:
        print(f'  {b + 1}/{N} Gefechte ({time.time() - t0:.0f}s)', flush=True)

print(f'Baseline: Verlustrate (>=1 totes V-Schiff) {losses / N:.1%}, '
      f'dead0/Gefecht {dead0s / N:.2f}')

rows = []
for lbl, wid, sp in specs:
    a = acc[(lbl, wid)]
    units = v11.weapon_units(sp)
    gain = sum(a.values()) / N / 3
    score = gain / units
    o = old.get(wid, {})
    row = dict(label=lbl, id=wid, title=sp['title'], rarity=sp['rarity'],
               dmg=sp['damage'], e=sp['energy'],
               abz={k: v for k, v in sp['abz'].items() if v is not None},
               range=sp['range'], single=sp['single'],
               units=round(units, 2), gain=round(gain, 3),
               score=round(score, 3), delta=round(score - T[sp['rarity']], 2),
               alt_score=o.get('score'), alt_delta=(round(
                   o['score'] - T[sp['rarity']], 2) if o.get('score') else None))
    rows.append(row)

rows.sort(key=lambda r: (r['id'], r['label']))
with open(os.path.join(HERE, 'audit_r13g.json'), 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=1)

print(f"\n{'Var':3} {'id':>4} {'Titel':24} r dmg  e  units score  dNeu  (alt: score dAlt)")
for r in rows:
    alt = f"  ({r['alt_score']:.2f} {r['alt_delta']:+.2f})" if r['alt_score'] else ''
    print(f"{r['label']:3} {r['id']:>4} {r['title'][:24]:24} {r['rarity']} "
          f"{r['dmg']:>3} {r['e']:>2} {r['units']:>5} {r['score']:6.2f} "
          f"{r['delta']:+.2f}{alt}")
print('\nReferenz (Runde 13j, provisorisch = Messmediane): '
      'r1 8,54 / r2 7,77 / r3 8,96 / r4 7,53 / r5 8,56')
