"""Runde 13f: Tausch-Suche gegen Zielkurve v15 (2,3/2,5/2,8/3,1/3,4).

Constraints (Christophers Vorgaben):
- editionsrein (Edition = 1. Ziffer der ID; Waffen/Karten-Kreuz erlaubt)
- max. 2 Rarity-Level Sprung je Karte
- R0-Karten werden nie getauscht
- 125 Plasmakanone nicht auf r5 (Christophers S2-Ablehnung)
Toleranz: fixierter Outlier danach |Delta| <= 0,35; Partner darf durch den
Tausch nicht zum Outlier werden (|Delta| <= 0,5).
"""
import json

T = {1: 2.3, 2: 2.5, 3: 2.8, 4: 3.1, 5: 3.4}

items = []
for x in json.load(open('frame_calibration.json'))['weapons']:
    items.append(dict(id=str(x['id']), title=x['title'], r=int(x['rarity']),
                      score=x['score'], typ='W'))
for x in json.load(open('defense_v11.json')):
    items.append(dict(id=str(x['id']), title=x['title'], r=int(x['rarity']),
                      score=x['score'], typ='K'))

# R0 raus (Christophers Vorgabe) + Sanity
items = [it for it in items if 1 <= it['r'] <= 5]
for it in items:
    it['ed'] = it['id'][0]
    it['d'] = it['score'] - T[it['r']]
outliers = [it for it in items if abs(it['d']) > 0.5]
print(f'{len(items)} Objekte (R0 gefiltert), {len(outliers)} Outlier |d|>0,5:')
for it in sorted(outliers, key=lambda x: -x['d']):
    print(f"  {it['id']:4} {it['title'][:24]:24} r{it['r']} {it['typ']} "
          f"Score {it['score']:5.2f}  d {it['d']:+5.2f}")

TABU = {('125', 5)}  # Plasmakanone nicht als r5 (S2)

def ok_after(a, r_new):
    if (a['id'], r_new) in TABU:
        return None
    return a['score'] - T[r_new]

pairs = []
for a in outliers:
    for b in items:
        if b['id'] == a['id'] or b['ed'] != a['ed']:
            continue
        if not (1 <= abs(a['r'] - b['r']) <= 2):
            continue
        # a uebernimmt b's Rarity, b uebernimmt a's Rarity
        da = ok_after(a, b['r'])
        db = ok_after(b, a['r'])
        if da is None or db is None:
            continue
        if abs(da) <= 0.35 and abs(db) <= 0.5:
            fixed = 1 + (abs(b['d']) > 0.5)
            pairs.append((fixed, -(abs(da) + abs(db)), a, b, da, db))
pairs.sort(key=lambda p: (p[0], p[1]), reverse=True)

print(f'\n{len(pairs)} qualifizierende Paare (fixierter Outlier |d|<=0,35, Partner bleibt |d|<=0,5).')
print('\n=== Disjunktes Greedy-Set ===')
used = set(); chosen = []
for fixed, q, a, b, da, db in pairs:
    if a['id'] in used or b['id'] in used:
        continue
    used |= {a['id'], b['id']}
    chosen.append((a, b, da, db))
for a, b, da, db in chosen:
    print(f"  {a['id']:4} {a['title'][:22]:22} r{a['r']}->{b['r']} ({a['typ']})  d {a['d']:+.2f} -> {da:+.2f}")
    print(f"  {b['id']:4} {b['title'][:22]:22} r{b['r']}->{a['r']} ({b['typ']})  d {b['d']:+.2f} -> {db:+.2f}")
    print()

rest = [it for it in outliers if it['id'] not in used]
print('=== Rest-Outlier nach Tausch-Set (Wertepaket 13g) ===')
for it in sorted(rest, key=lambda x: -x['d']):
    print(f"  {it['id']:4} {it['title'][:24]:24} r{it['r']} {it['typ']} "
          f"Score {it['score']:5.2f}  d {it['d']:+5.2f}")

print('\n=== Alle qualifizierenden Paare (auch nicht gewaehlte, fuer Alternativen) ===')
for fixed, q, a, b, da, db in pairs[:25]:
    print(f"  {a['id']}({a['typ']} r{a['r']}->{b['r']}) <-> {b['id']}({b['typ']} r{b['r']}->{a['r']}) "
          f"E{a['ed']} fixe {fixed} Qual {q:.2f} -> {da:+.2f}/{db:+.2f}")
