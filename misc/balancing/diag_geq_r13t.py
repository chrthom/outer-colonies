#!/usr/bin/env python3
"""diag_geq_r13t: halbed-Grenzfalle und >=-Regel-Variante.

Christophers Frage: Warum tritt Halbierung bei +/-1 Speed so selten
auf? Was aendert eine Spielmechanik-Aenderung von
    halved: Zielspeed > Angreiferspeed + Phase
auf
    halved: Zielspeed >= Angreiferspeed + Phase?

Messungen (CRN, N=2000, seed 42):
- A: diff-Verteilung aller Schuesse (diff = Zielspeed - Angreiferspeed
  - Phase): Anteile an der Kante (diff 0 = Ziel+1 sp kippt neu,
  diff 1 = Angreifer+1 sp rettet) + halved-Raten alt vs. >=-Regel.
- B: 161-Score normal vs. >=-Regel.
"""
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'diag_random_r13t.py'),
           encoding='utf-8').read()
marker = '# ---------------- Messung mit Checkpoint'
defs = src[:src.index(marker)]

HALV = 'halved = sh[\'s\'] + p < tgt[\'s\']'
HALV_GEQ = 'halved = sh[\'s\'] + p <= tgt[\'s\']'
HALV_CNT = ('halved = sh[\'s\'] + p < tgt[\'s\']\n'
            '                    CNT[\'shots\'] += 1\n'
            '                    if halved: CNT[\'halv\'] += 1\n'
            '                    _d = tgt[\'s\'] - sh[\'s\'] - p\n'
            '                    CNT[\'d%d\' % _d] = CNT.get(\'d%d\' % _d, 0) + 1'
            )


def build(geq=False, count=False):
    d = defs
    assert HALV in d
    if count:
        d = d.replace(HALV, HALV_CNT, 1)
    elif geq:
        d = d.replace(HALV, HALV_GEQ, 1)
    G = {'__name__': 'r13t_defs',
         '__file__': os.path.abspath(os.path.join(
             HERE, 'diag_random_r13t.py')),
         'CNT': dict(shots=0, halv=0)}
    exec(compile(d, 'r13t_defs', 'exec'), G)
    return G


def score_of(acc, n, hp=0, units=1):
    if sum(n) == 0:
        return None
    g = [(acc[s]['out'] + acc[s]['take'] + acc[s]['col']
          + acc[s]['loot'] + acc[s]['prevent']) / n[s]
         for s in (0, 1) if n[s] > 0]
    return (sum(g) / len(g) + 0.5 * hp) / units


def run(G, spec=None, N=2000, geq=False):
    battle_r, draw = G['battle_r'], G['draw_random_battle']
    acc_side, blank = G['acc_side'], G['blank']
    acc = blank()
    accn = [0, 0]
    for it in range(N):
        sc = draw(random)
        if spec is None:
            battle_r(sc)
            continue
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


# --- A: diff-Verteilung + halved-Raten, aktuelle vs. >=-Regel ---
for label, geq in (('AKTUELLE Regel (>)', False),
                   ('>=-Regel', True)):
    random.seed(42)
    G = build(geq=geq, count=True)
    run(G, None, N=2000)
    c = G['CNT']
    sh = c['shots']
    hv = c['halv']
    print('%s: Schuesse %d, halbiert %d (%.1f%%)'
          % (label, sh, hv, 100 * hv / sh))
    buckets = {}
    for k, v in c.items():
        if k.startswith('d'):
            d = int(k[1:])
            key = (d if -1 <= d <= 3 else
                   ('<-1' if d < -1 else '>3'))
            buckets[key] = buckets.get(key, 0) + v
    for key in ('<-1', -1, 0, 1, 2, 3, '>3'):
        v = buckets.get(key, 0)
        print('   diff %s: %d (%.1f%%)'
              % (key, v, 100 * v / sh))

# --- B: 161-Score normal vs. >=-Regel ---
v11 = build()['v11']
C161 = [c for c in v11.cards if c['id'] == '161'][0]
res = {}
for label, geq in (('normal', False), ('geq', True)):
    random.seed(42)
    G = build(geq=geq)
    acc, accn = run(G, spec=C161, geq=geq)
    res[label] = (acc, accn)
    s = score_of(acc, accn, units=1)   # Raw-Gain (ohne units)
    print('161 %s: Raw-Gain %.3f (n=%d/%d)'
          % (label, s, accn[0], accn[1]))
KS = ('out', 'take', 'col', 'loot', 'prevent')
print('Kanal-Delta (geq - normal) je Sicht:')
for side in (0, 1):
    a1, n1 = res['normal']
    a2, n2 = res['geq']
    row = ['%s %+.3f' % (k, a2[side][k] / n2[side]
                         - a1[side][k] / n1[side]) for k in KS]
    print('  Sicht %d: %s' % (side, '  '.join(row)))
