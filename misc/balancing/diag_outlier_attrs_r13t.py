# diag_outlier_attrs_r13t.py — Anhang zur Gesamt-Outlier-Analyse
# (Zielkurve v23c, |Delta|>0,5, 30 Karten):
#   1. Relevante Karten-Attribute je Outlier (cards.csv + units aus
#      v10/v11-Preismodell: Sockel + Energie, e_cost = 1+0,7*(E-1)).
#   2. Rarity-Tausch-Check (Christophers Auftrag 6.11.2026): Verschiebung
#      um max. 1 Raritaetsstufe innerhalb derselben Edition — Delta
#      gegen das neue Zielband bei Score-Invarianz (Naeherung: Ziehungs-
#      haeufigkeit aendert nur das Umfeld, nicht den Rollen-Score;
#      Rest-Effekt in der Variablen-Runde messbar).
#      ACHTUNG Erst-Interpretation (EINZEL-Tausch): Christophers
#      Korrektur 6.11.2026 — richtig ist PAAR-Tausch (zwei Karten einer
#      Edition tauschen Raritaet UND ID), siehe diag_swap_r13t.py.
# Achtung: KEIN Import-Schutz — nie importieren! CWD = knowledge-Ordner.

import csv
import json

import balancing_metric_v11 as v11

TARGETS = {1: 1.6, 2: 1.9, 3: 2.3, 4: 2.9, 5: 3.6}   # Zielkurve v23c
THRESH = 0.5

d = json.load(open('diag_random_v23_r13t.json'))
ck = json.load(open('diag_random_ckpt_v23_r13t.json'))
CSV = {r['id']: r for r in csv.DictReader(open('cards.csv', newline='',
         encoding='utf-8'), delimiter=';', quotechar='"')}


def socks(cid):
    return ','.join(t + '=' + CSV[cid]['socket_' + t]
                    for t in 'abdefg' if CSV[cid]['socket_' + t])


def gain_of(acc, n):
    g = [(acc[s]['out'] + acc[s]['take'] + acc[s]['col']
          + acc[s]['loot'] + acc[s]['prevent']) / n[s]
         for s in (0, 1) if n[s] > 0]
    return sum(g) / len(g)


print('=== 1) Waffen-Outlier: Attribute (v23b-Score, Ziel v23c) ===')
print('%-4s %-22s r  sc   d   units | dmg abm SAb PzA TAb rng E sock'
      % ('id', 'titel'))
for w in d['weapons']:
    if w['score'] is None:
        continue
    delta = w['score'] - TARGETS[w['rarity']]
    if abs(delta) <= THRESH:
        continue
    r = CSV[w['id']]
    print('%-4s %-22s r%d %4.2f %+4.2f %4.2f | %3s %3s %3s %3s %3s %3s %2s %s'
          % (w['id'], w['title'][:22], w['rarity'], w['score'], delta,
             v11.weapon_units([x for x in v11.weapons
                               if x['id'] == w['id']][0]),
             r['damage'] or '-', r['abm'] or '-', r['damage_shield'] or '-',
             r['damage_armour'] or '-', r['damage_abm'] or '-',
             r['range'] or '-', r['energy'] or '-', socks(w['id'])))
print()
print('=== 2) Statkarten-Outlier: Attribute (HP_STATIC 1,0) ===')
print('%-4s %-22s r  sc   d   units | arm shl pd hp  spd E sock'
      % ('id', 'titel'))
for c in v11.cards:
    if c['id'] not in ck['accC']:
        continue
    acc, n = ck['accC'][c['id']], ck['accCn'][c['id']]
    if not (n[0] + n[1]):
        continue
    g = gain_of(acc, n)
    sc = (g + v11.HP_STATIC * c['hp']) / (c['units'] + 1.0)
    delta = sc - TARGETS[c['rarity']]
    if abs(delta) <= THRESH:
        continue
    print('%-4s %-22s r%d %4.2f %+4.2f %4.2f | %3s %3s %2s %+3d %+3d %2s %s'
          % (c['id'], c['title'][:22], c['rarity'], sc, delta, c['units'],
             c['pts']['armour'], c['pts']['shield'], c['pts']['pd'],
             c['hp'], c['speed'], CSV[c['id']]['energy'] or '-',
             socks(c['id'])))
print()
print('=== 3) Rarity-Tausch-Check (max ±1 Stufe, gleiche Edition;'
      ' Score-invariant) ===')
rows = []
for w in d['weapons']:
    if w['score'] is not None and abs(w['score'] - TARGETS[w['rarity']]) > THRESH:
        rows.append((w['id'], w['title'], 'W', w['rarity'], w['score'],
                     CSV[w['id']]['edition']))
for c in v11.cards:
    if c['id'] not in ck['accC']:
        continue
    acc, n = ck['accC'][c['id']], ck['accCn'][c['id']]
    if not (n[0] + n[1]):
        continue
    sc = (gain_of(acc, n) + v11.HP_STATIC * c['hp']) / (c['units'] + 1.0)
    if abs(sc - TARGETS[c['rarity']]) > THRESH:
        rows.append((c['id'], c['title'], 'S', c['rarity'], sc,
                     CSV[c['id']]['edition']))
print('%-4s %-22s typ r  sc   edition | Delta je Zielband'
      % ('id', 'titel'))
for (cid, title, kind, rar, sc, ed) in sorted(rows, key=lambda x: x[3]):
    parts = []
    for nr in (rar - 1, rar + 1):
        if 1 <= nr <= 5:
            dd = sc - TARGETS[nr]
            parts.append('r%d: %+0.2f%s' % (nr, dd,
                         ' IM BAND' if abs(dd) <= THRESH else ''))
    print('%-4s %-22s %-3s r%d %4.2f ed%s | %s'
          % (cid, title[:22], kind, rar, sc, ed, ' | '.join(parts)))
