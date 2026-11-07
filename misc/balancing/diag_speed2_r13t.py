#!/usr/bin/env python3
"""diag_speed2_r13t: Kanal-Delta des halbed-Effekts (V1 vs. V3).

Zerlegt Christophers Speed-Elemente weiter: Der A/B
(V1 normal vs. V3 halbed-OFF, Karte 161, CRN, N=2000, seed 42)
je KONTOKANAL und je Sicht -> zeigt, wie viel vom halved-Wert
auf Angriffs-Richtung (out) vs. Verteidigungs-Richtung (take)
und auf die Missionskanale (loot/prevent) entfaellt.
"""
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'diag_random_r13t.py'),
           encoding='utf-8').read()
marker = '# ---------------- Messung mit Checkpoint'
defs = src[:src.index(marker)]

HALV = 'halved = sh[\'s\'] + p < tgt[\'s\']'
HALV_OFF = 'halved = False'


def build(no_halv=False):
    d = defs
    if no_halv:
        assert HALV in d
        d = d.replace(HALV, HALV_OFF)
    G = {'__name__': 'r13t_defs',
         '__file__': os.path.abspath(os.path.join(
             HERE, 'diag_random_r13t.py'))}
    exec(compile(d, 'r13t_defs', 'exec'), G)
    return G


def run_channels(G, spec, N=2000):
    battle_r, draw = G['battle_r'], G['draw_random_battle']
    acc_side, blank = G['acc_side'], G['blank']
    acc = blank()
    accn = [0, 0]
    for it in range(N):
        sc = draw(random)
        r0 = battle_r(sc)
        a0, a1 = acc_side(r0, 0), acc_side(r0, 1)
        for side in (0, 1):
            r = battle_r(sc, spin=it % 3, spec=dict(spec),
                         spec_side=side)
            if r is None:
                continue
            accn[side] += 1
            a = acc_side(r, side)
            m = {k: a[k] - (a0 if side == 0 else a1)[k] for k in a}
            for k in m:
                acc[side][k] += m[k]
    return acc, accn


random.seed(42)
v11 = build()['v11']
C161 = [c for c in v11.cards if c['id'] == '161'][0]

res = {}
for name, no_halv in (('V1', False), ('V3', True)):
    G = build(no_halv=no_halv)
    acc, accn = run_channels(G, C161)
    res[name] = (acc, accn)

KS = ('out', 'take', 'col', 'loot', 'prevent')
print('halbed-Effekt je Kanal (161, V1-V3, N=2000):')
for side in (0, 1):
    a1, n1 = res['V1']
    a3, n3 = res['V3']
    print(' Sicht %d (%s):' % (side,
          'Missionar/deff' if side == 0 else 'Abfaenger/att'))
    for k in KS:
        d = a1[side][k] / n1[side] - a3[side][k] / n3[side]
        print('   %-7s %+.3f' % (k, d))
    tot = sum(a1[side][k] / n1[side] - a3[side][k] / n3[side]
              for k in KS)
    print('   SUMME   %+.3f' % tot)
