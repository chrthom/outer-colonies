# diag_hpstatic_r13t.py — HP_STATIC-Umstellung 0,5 -> 1,0 (Christophers
# Beschluss 6.11.2026, Runde 13t, nach der Faktor-2-Analyse):
# Statkarten-Scores aus dem v23b-Checkpoint NEU berechnet, ohne Re-Run
# (die Kontokanaele accC sind im Checkpoint gespeichert; nur der
# HP-Zuschlag in der Score-Formel aendert sich). Waffen unbeeinflusst
# (score_of ohne hp). Achtung: KEIN Import-Schutz — nie importieren!
# CWD = knowledge-Ordner (v11-Import + Checkpoint-Pfade).

import json
import statistics as st

import balancing_metric_v11 as v11

d = json.load(open('diag_random_v23_r13t.json'))
ck = json.load(open('diag_random_ckpt_v23_r13t.json'))

HP_OLD, HP_NEW = 0.5, 1.0

rows = []
for c in v11.cards:
    id_ = c['id']
    if id_ not in ck['accC']:
        continue
    acc, n = ck['accC'][id_], ck['accCn'][id_]
    if not (n[0] + n[1]):
        continue
    g = [(acc[s]['out'] + acc[s]['take'] + acc[s]['col']
          + acc[s]['loot'] + acc[s]['prevent']) / n[s]
         for s in (0, 1) if n[s] > 0]
    gain = sum(g) / len(g)
    u1 = c['units'] + 1.0
    old = (gain + HP_OLD * c['hp']) / u1
    new = (gain + HP_NEW * c['hp']) / u1
    rows.append(dict(id=id_, title=c['title'], rarity=c['rarity'],
                     hp=c['hp'], gain=gain, old=old, new=new))

print('=== HP_STATIC 0,5 -> 1,0: Statkarten-Scores (v23b-ckpt, N=10k) ===')
print('%-4s %-26s r  hp   gain  alt   neu  delta')
for x in sorted(rows, key=lambda r: (r['rarity'], -r['new'])):
    mark = '' if abs(x['new'] - x['old']) < 0.005 else ' *'
    print('%-4s %-26s %d %+3d %6.2f %5.2f %5.2f %+5.2f%s'
          % (x['id'], x['title'][:26], x['rarity'], x['hp'], x['gain'],
             x['old'], x['new'], x['new'] - x['old'], mark))
print()
print('=== Karten-Mediane je Raritaet alt vs. neu | Waffen-Ratio ===')
for r in range(1, 6):
    wm = d['medians'][str(r)]['weapons']
    co = [x['old'] for x in rows if x['rarity'] == r]
    cn = [x['new'] for x in rows if x['rarity'] == r]
    if co and cn:
        print('r%d: Karten alt %.2f -> neu %.2f | Waffen %.2f |'
              ' Ratio %.2f -> %.2f'
              % (r, st.median(co), st.median(cn), wm,
                 st.median(co) / wm, st.median(cn) / wm))
print()
ch = [x for x in rows if x['id'] in ('184', '449', '240', '434')]
print('=== Problemkarten der Faktor-2-Analyse ===')
for x in sorted(ch, key=lambda r: -abs(r['new'] - r['old'])):
    print('%-4s %-26s hp %+d: alt %.2f -> neu %.2f (%+.2f)'
          % (x['id'], x['title'][:26], x['hp'], x['old'], x['new'],
             x['new'] - x['old']))
