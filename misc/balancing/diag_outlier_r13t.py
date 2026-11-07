# diag_outlier_r13t.py — Gesamt-Outlier-Analyse gegen Christophers
# GEMEINSAME Zielkurve v23c (Beschluss 6.11.2026, Runde 13t):
#   r1 1,6 / r2 1,9 / r3 2,3 / r4 2,9 / r5 3,6
# EINE Kurve fuer Waffen UND Statkarten (Faktor-2-Lücke als zu
# schliessendes Balancing-Ziel). Outlier-Kriterium |Delta| > 0,6
# (Christophers Beschluss 6.11.2026: ±1,0 -> ±0,5 -> ±0,6 final;
# Rarity-Tausch verworfen).
# Waffen: v23b-Offizialmessung (diag_random_v23_r13t.json).
# Statkarten: HP_STATIC-1,0-Recompute aus dem v23b-Checkpoint
# (gleiche Kontokanaele, nur Formelterm geaendert — kein Re-Run).
# Achtung: KEIN Import-Schutz — nie importieren! CWD = knowledge-Ordner.

import json
import statistics as st

import balancing_metric_v11 as v11

THRESH = 0.6          # Grenzwert (Christophers Beschluss: >±0,6 final)
TARGETS = {1: 1.6, 2: 1.9, 3: 2.3, 4: 2.9, 5: 3.6}   # Zielkurve v23c

d = json.load(open('diag_random_v23_r13t.json'))
ck = json.load(open('diag_random_ckpt_v23_r13t.json'))

rows = []
for w in d['weapons']:
    if w['score'] is not None:
        rows.append(dict(id=w['id'], title=w['title'], rarity=w['rarity'],
                         kind='W', score=w['score']))
for c in v11.cards:
    if c['id'] not in ck['accC']:
        continue
    acc, n = ck['accC'][c['id']], ck['accCn'][c['id']]
    if not (n[0] + n[1]):
        continue
    g = [(acc[s]['out'] + acc[s]['take'] + acc[s]['col']
          + acc[s]['loot'] + acc[s]['prevent']) / n[s]
         for s in (0, 1) if n[s] > 0]
    gain = sum(g) / len(g)
    rows.append(dict(id=c['id'], title=c['title'], rarity=c['rarity'],
                     kind='S',
                     score=(gain + v11.HP_STATIC * c['hp'])
                           / (c['units'] + 1.0)))
for r in rows:
    r['delta'] = r['score'] - TARGETS[r['rarity']]

print('=== Zielkurve v23c (Christophers Beschluss 6.11.2026):'
      ' 1,6/1,9/2,3/2,9/3,6 — Waffen UND Statkarten ===')
print()
for rar in range(1, 6):
    sub = sorted([x for x in rows if x['rarity'] == rar],
                 key=lambda x: -x['score'])
    wm = st.median([x['score'] for x in sub if x['kind'] == 'W'] or [0])
    print('r%d (Ziel %.1f) | Waffen-Median %.2f | %d Waffen + %d Statkarten'
          % (rar, TARGETS[rar], wm,
             sum(1 for x in sub if x['kind'] == 'W'),
             sum(1 for x in sub if x['kind'] == 'S')))
    for x in sub:
        if abs(x['delta']) > THRESH:
            flag = 'OUTLIER '
        elif abs(x['delta']) > THRESH * 0.8:
            flag = 'knapp    '
        else:
            flag = '         '
        print('  %s %s %-26s %6.2f  Delta %+5.2f'
              % (flag, x['id'], x['title'][:26], x['score'], x['delta']))
    print()

out = sorted([x for x in rows if abs(x['delta']) > THRESH],
             key=lambda x: -x['delta'])
print('=== OUTLIER |Delta| > %.1f: %d von %d Karten ==='
      % (THRESH, len(out), len(rows)))
for x in out:
    print('%-4s %-26s r%d %-9s Score %6.2f  Ziel %.1f  Delta %+5.2f'
          % (x['id'], x['title'][:26], x['rarity'],
             'Waffe' if x['kind'] == 'W' else 'Statkarte',
             x['score'], TARGETS[x['rarity']], x['delta']))
print()
knapp = sorted([x for x in rows if THRESH * 0.8 < abs(x['delta']) <= THRESH],
               key=lambda x: -abs(x['delta']))
print('=== Knapp im Band (%.2f < |Delta| <= %.1f): %d ==='
      % (THRESH * 0.8, THRESH, len(knapp)))
for x in knapp:
    print('%-4s %-26s r%d %-9s Score %6.2f  Delta %+5.2f'
          % (x['id'], x['title'][:26], x['rarity'],
             'Waffe' if x['kind'] == 'W' else 'Statkarte',
             x['score'], x['delta']))
