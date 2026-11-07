#!/usr/bin/env python3
"""diag_diff_r13t: halbed-diff-Verteilung je Phase (Christophers Spiegel-These).

Christophers Erwartung: Fuer jedes Waffenpaar (X schiesst auf Y in
Phase p) gilt fuer den Gegenschuss diff' = -D - p (mit D = Y.s - X.s),
d.h. die Verteilung je Phase muesste um -p gespiegelt sein -
sofern beide Schiffe in Phase p feuern koennen und D symmetrisch
verteilt ist. Gemessen war eine starke Asymmetrie (55,9% diff<=-2).

Hier: diff je PHASE getrennt + D-Verteilung (Speed-Unterschied) +
Anteil der Schuesse mit gleich schnellen Schiffen (D=0).
"""
import os
import random
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'diag_random_r13t.py'),
           encoding='utf-8').read()
marker = '# ---------------- Messung mit Checkpoint'
defs = src[:src.index(marker)]

HALV = 'halved = sh[\'s\'] + p < tgt[\'s\']'
HALV_CNT = ('halved = sh[\'s\'] + p < tgt[\'s\']\n'
            '                    CNT[\'shots\'] += 1\n'
            '                    if halved: CNT[\'halv\'] += 1\n'
            '                    _D = tgt[\'s\'] - sh[\'s\']\n'
            '                    CNT[\'p%d_d%d\' % (p, _D)] ='
            ' CNT.get(\'p%d_d%d\' % (p, _D), 0) + 1\n'
            '                    CNT[\'D%d\' % _D] ='
            ' CNT.get(\'D%d\' % _D, 0) + 1')

G = {'__name__': 'r13t_defs',
     '__file__': os.path.abspath(os.path.join(
         HERE, 'diag_random_r13t.py')),
     'CNT': dict(shots=0, halv=0)}
d = defs
assert HALV in d
d = d.replace(HALV, HALV_CNT, 1)
exec(compile(d, 'r13t_defs', 'exec'), G)

battle_r, draw = G['battle_r'], G['draw_random_battle']
random.seed(42)
for it in range(2000):
    sc = draw(random)
    battle_r(sc)

c = G['CNT']
sh = c['shots']
print('Schuesse gesamt %d, halbiert %d (%.1f%%)'
      % (sh, c['halv'], 100 * c['halv'] / sh))
print()
print('D-Verteilung (D = Zielspeed - Angreiferspeed, ueber alle Phasen):')
for k in sorted((k for k in c if k.startswith('D') and not
                 k.startswith('D%d' % -100)),
                key=lambda t: int(t[1:])):
    print('  D=%3s: %6d (%5.1f%%)' % (k[1:], c[k], 100 * c[k] / sh))
print()
print('diff-Verteilung JE PHASE (diff = D - p; halved wenn diff >= 1):')
per = defaultdict(dict)
for k, v in c.items():
    if k.startswith('p') and '_d' in k:
        p, dd = k[1:].split('_d')
        per[int(p)][int(dd)] = v
for p in sorted(per):
    tot = sum(per[p].values())
    print('  Phase %d (%d Schuesse):' % (p, tot))
    for dd in sorted(per[p]):
        print('    diff %3d: %6d (%5.1f%%)'
              % (dd, per[p][dd], 100 * per[p][dd] / tot))
    # Spiegel-Check: N(d) vs N(-2p-d)
    asym = []
    for dd in sorted(per[p]):
        mir = per[p].get(-2 * p - dd)
        if mir is not None and abs(per[p][dd] - mir) > 0:
            asym.append((dd, per[p][dd], mir))
    print('    Spiegel N(d) vs N(-2p-d):',
          ', '.join('d=%d:%d/%d' % t for t in asym)
          if asym else 'keine Paare ungleich')
