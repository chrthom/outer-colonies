#!/usr/bin/env python3
"""diag_speed3_r13t: Speed-Element-Isolation unter der v22->=-Regel.

Christophers Wunsch (6.11.2026): Speed-Karten mit der >=-Regel
nochmal auf die Bestandteile runterbrechen. A/B je Karte (CRN,
N=2000, seed 42) auf Basis der v22-Sonde (>=-halved):

- V1: normal (>=-Regel)          -> Referenz-Raw-Gain
- V2: Abfang-Ausduennung OFF     -> V1-V2 = Ausduennungs-Beitrag
- V3: halbed OFF                 -> V1-V3 = halved-Beitrag
- V4: beide OFF                  -> V1-V4 = Gesamteffekt der Mechanik

Zusaetzlich Kanal-Deltas V1-V3 (halved je Kanal) und V1-V2
(Ausduennung je Kanal), Sichten paarweise als Gefechtsbilanz.

Aufruf: python3 diag_speed3_r13t.py <karten-id>   (Default 161)
"""
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'diag_random_r13t.py'),
           encoding='utf-8').read()
marker = '# ---------------- Messung mit Checkpoint'
defs = src[:src.index(marker)]

HALV = 'halved = sh[\'s\'] + p <= tgt[\'s\']'      # v22-Zeile
HALV_OFF = 'halved = False'
AUS = ('kept = [(i, sh) for i, sh in enumerate(fleet[1])\n'
       '                if sh[\'s\'] >= s0min]')
AUS_OFF = 'kept = list(enumerate(fleet[1]))'


def build(no_aus=False, no_halv=False):
    d = defs
    if no_halv:
        assert HALV in d, 'halved-Anchor fehlt'
        d = d.replace(HALV, HALV_OFF, 1)
    if no_aus:
        assert AUS in d, 'Ausduennungs-Anchor fehlt'
        d = d.replace(AUS, AUS_OFF)
    G = {'__name__': 'r13t_defs',
         '__file__': os.path.abspath(os.path.join(
             HERE, 'diag_random_r13t.py'))}
    exec(compile(d, 'r13t_defs', 'exec'), G)
    return G


KS = ('out', 'take', 'col', 'loot', 'prevent')


def run(G, spec, N=2000):
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


def gain(acc, n):
    per = [sum(acc[s][k] for k in KS) / n[s] for s in (0, 1) if n[s] > 0]
    return sum(per) / len(per)


cid = sys.argv[1] if len(sys.argv) > 1 else '161'
G = build()
card = [c for c in G['v11'].cards if c['id'] == cid][0]
print('Karte %s %s (sp %s, hp %s, units %s), >=-Regel (v22):'
      % (cid, card['title'], card.get('speed'), card.get('hp'),
         card.get('units')))

R = {}
for label, na, nh in (('V1_normal', False, False),
                      ('V2_aus_off', True, False),
                      ('V3_halv_off', False, True),
                      ('V4_beide_off', True, True)):
    random.seed(42)
    acc, accn = run(build(no_aus=na, no_halv=nh), card)
    R[label] = (acc, accn)
    print('%s: Raw-Gain %.3f (n=%d/%d)'
          % (label, gain(acc, accn), accn[0], accn[1]))

print()
print('=== Element-Beitraege (Raw-Gain) ===')
print('halved-Schwelle (>=):   V1-V3 = %+.3f'
      % (gain(*R['V1_normal']) - gain(*R['V3_halv_off'])))
print('Abfang-Ausduennung:     V1-V2 = %+.3f'
      % (gain(*R['V1_normal']) - gain(*R['V2_aus_off'])))
print('beide zusammen:         V1-V4 = %+.3f'
      % (gain(*R['V1_normal']) - gain(*R['V4_beide_off'])))

print()
print('=== halbed-Beitrag je Kanal (V1 - V3) ===')
for side in (0, 1):
    a1, n1 = R['V1_normal']
    a3, n3 = R['V3_halv_off']
    row = ['%s %+.3f' % (k, a1[side][k] / n1[side]
                        - a3[side][k] / n3[side]) for k in KS]
    bil = ((a1[side]['out'] + a1[side]['take']) / n1[side]
           - (a3[side]['out'] + a3[side]['take']) / n3[side])
    print('  Sicht %d: %s  BILANZ(out+take) %+.3f' % (side, ' '.join(row), bil))

print()
print('=== Ausduennungs-Beitrag je Kanal (V1 - V2) ===')
for side in (0, 1):
    a1, n1 = R['V1_normal']
    a2, n2 = R['V2_aus_off']
    row = ['%s %+.3f' % (k, a1[side][k] / n1[side]
                        - a2[side][k] / n2[side]) for k in KS]
    bil = ((a1[side]['out'] + a1[side]['take']) / n1[side]
           - (a2[side]['out'] + a2[side]['take']) / n2[side])
    print('  Sicht %d: %s  BILANZ(out+take) %+.3f' % (side, ' '.join(row), bil))
