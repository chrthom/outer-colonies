#!/usr/bin/env python3
"""diag_v25b_groups.py (9.11.2026): Gruppen-Auswertung des v25b-
Huellen-Benchmarks fuer Christophers T(n)- und Kurven-Entscheidung:
Mediane je Teiligkeit n (T(n)-Gruppen), je Schiffstyp, je Seltenheit
(Schiffe vs. Stationen getrennt) und je (Seltenheit x n) mit Spannen.
Basis: diag_v25b_r13t.json (N=3000). 'Anzahl Karten' = Teiligkeit n
(1-/2-/3-teilige Schiffe); Schiffe = normale Hullen, Stationen =
Build-Speed-0-Hullen (Orbitaler Aussenposten, Raumstation, Sternbasis).
"""
import json
import statistics as st

HERE = '/home/user/knowledge/outer-colonies'
d = json.load(open(HERE + '/diag_v25b_r13t.json', encoding='utf-8'))
rows = d['rows']
ships = [r for r in rows if not r['station']]
stats = [r for r in rows if r['station']]


def med(vals):
    return st.median(vals) if vals else None


def fmt(g):
    if g is None:
        return '   --  '
    return f'{g:+7.2f}'


def line(label, grp):
    if not grp:
        print(f'{label:34} N  0  (keine)')
        return
    n = len(grp)
    t = med([r['score_t'] for r in grp])
    no = med([r['score_not'] for r in grp])
    span = (min(r['score_t'] for r in grp), max(r['score_t'] for r in grp))
    print(f'{label:34} N{len(grp):3}  med score_t {fmt(t)}  '
          f'score_not {fmt(no)}  Spanne score_t [{span[0]:+6.2f} .. {span[1]:+6.2f}]')


print('=== je Teiligkeit n ("Anzahl Karten") ===')
for n in (1, 2, 3):
    line(f'Schiffe n{n}', [r for r in ships if r['n'] == n])
    line(f'Stationen n{n}', [r for r in stats if r['n'] == n])
print()
print('=== je Schiffstyp (nur Schiffe) ===')
typs = sorted({r['base'] for r in ships})
for t in typs:
    grp = [r for r in ships if r['base'] == t]
    nn = sorted({r['n'] for r in grp})
    line(f'{t} (n{",".join(map(str, nn))})', grp)
print()
print('=== je Seltenheit (Schiffe vs. Stationen) ===')
for r_ in range(6):
    line(f'Schiffe r{r_}', [r for r in ships if r['rarity'] == r_])
    line(f'Stationen r{r_}', [r for r in stats if r['rarity'] == r_])
print()
print('=== je (Seltenheit x Teiligkeit), nur Schiffe ===')
for r_ in range(6):
    for n in (1, 2, 3):
        grp = [r for r in ships if r['rarity'] == r_ and r['n'] == n]
        if grp:
            line(f'Schiffe r{r_} n{n}', grp)
print()
print('=== alle Stationen je Typ ===')
for t in sorted({r['base'] for r in stats}):
    grp = [r for r in stats if r['base'] == t]
    ids = sorted(int(r['id']) for r in grp)
    line(f'{t} {ids}', grp)
