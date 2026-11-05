# diag_swap_r13t.py — Paar-Tausch-Check (Christophers Korrektur
# 6.11.2026; Ergebnis VOM CHRISTOPHER VERWORFEN — alle Tausch-Optionen
# abgelehnt, Outlier-Analyse laeuft mit reinen Attribut-Hebeln und
# Grenzwert |Delta|>0,6 weiter; siehe diag_outlier_r13t.py).
# Historische Dokumentation:
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


def gain_of(acc, n):
    g = [(acc[s]['out'] + acc[s]['take'] + acc[s]['col']
          + acc[s]['loot'] + acc[s]['prevent']) / n[s]
         for s in (0, 1) if n[s] > 0]
    return sum(g) / len(g)


cards = {}
for w in d['weapons']:
    if w['score'] is not None:
        cards[w['id']] = dict(id=w['id'], title=w['title'], kind='W',
                              rar=w['rarity'], sc=w['score'],
                              ed=CSV[w['id']]['edition'])
for c in v11.cards:
    if c['id'] not in ck['accC']:
        continue
    acc, n = ck['accC'][c['id']], ck['accCn'][c['id']]
    if not (n[0] + n[1]):
        continue
    sc = (gain_of(acc, n) + v11.HP_STATIC * c['hp']) / (c['units'] + 1.0)
    cards[c['id']] = dict(id=c['id'], title=c['title'], kind='S',
                          rar=c['rarity'], sc=sc,
                          ed=CSV[c['id']]['edition'])
for x in cards.values():
    x['delta'] = x['sc'] - TARGETS[x['rar']]

outliers = {k: v for k, v in cards.items() if abs(v['delta']) > THRESH}
print('Paar-Suche: %d Outlier, %d Partnerpool (alle FINAL-Karten)'
      % (len(outliers), len(cards)))
print()
print('=== Beste Paar-Tausch-Option je Outlier (beide im Band nachher) ===')
found, none = [], []
for oid, o in sorted(outliers.items(), key=lambda kv: -abs(kv[1]['delta'])):
    best = None
    for pid, p in cards.items():
        if pid == oid or p['ed'] != o['ed'] or abs(p['rar'] - o['rar']) != 1:
            continue
        d_o = o['sc'] - TARGETS[p['rar']]   # Outlier uebernimmt Raritaet des Partners
        d_p = p['sc'] - TARGETS[o['rar']]   # Partner uebernimmt Raritaet des Outliers
        if abs(d_o) <= THRESH and abs(d_p) <= THRESH:
            key = max(abs(d_o), abs(d_p))
            if best is None or key < best[0]:
                best = (key, p, d_o, d_p)
    if best:
        _, p, d_o, d_p = best
        found.append(oid)
        print('%-4s %-24s r%d ed%s sc %5.2f (d %+0.2f)  <->  '
              '%-4s %-22s r%d sc %5.2f (d %+0.2f)  | nachher:'
              ' Outlier r%d d %+0.2f, Partner r%d d %+0.2f'
              % (oid, o['title'][:24], o['rar'], o['ed'], o['sc'],
                 o['delta'], p['id'], p['title'][:22], p['rar'], p['sc'],
                 p['delta'], p['rar'], d_o, o['rar'], d_p))
    else:
        none.append(oid)
print()
print('=== KEIN gueltiger Paar-Partner (Attribut-Hebel noetig): %d ==='
      % len(none))
for oid in none:
    o = outliers[oid]
    print('%-4s %-24s r%d ed%s sc %5.2f (d %+0.2f)'
          % (oid, o['title'][:24], o['rar'], o['ed'], o['sc'], o['delta']))
print()
print('Zusammenfassung: %d von %d Outliern per Paar-Tausch loesbar,'
      ' %d nur per Attribut-Hebel.'
      % (len(found), len(outliers), len(none)))
