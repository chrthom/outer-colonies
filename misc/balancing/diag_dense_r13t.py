#!/usr/bin/env python3
"""diag_dense_r13t: Bestueckungsquote hoch -> 2P/1P-Schild-Vorteil?

Christophers These: Der Nicht-Deaktivierungs-Bonus von
2-Schildpunkten entfaltet sich v. a. bei dichteren Gefechten.
Test: Kartenbudget B auf Maximum (b_hi = volle Sockelauslastung,
CRN bleibt erhalten, da die Wuerfelzahl nicht veraendert wird),
dann (a) Schild-Treffer-Dichte je Phasen-Schiff-Zelle neu zaehlen,
(b) 170 (1P) vs. 140 (2P) TAKE-Gain erneut messen (N=2000, seed 42).
"""
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'diag_random_r13t.py'),
           encoding='utf-8').read()
marker = '# ---------------- Messung mit Checkpoint'
defs = src[:src.index(marker)]

BUD = ("b_tot = rng.randint(b_lo, b_hi) if b_hi > b_lo else b_lo")
BUD_FULL = ("b_tot = rng.randint(b_lo, b_hi) if b_hi > b_lo else b_lo\n"
            "    b_tot = b_hi")
PH = 'for p in PHASES:'
PH_Z = ('for p in PHASES:\n'
        '        if HIT: HITS.append(dict(HIT)); HIT.clear()')
HALV = 'halved = sh[\'s\'] + p < tgt[\'s\']'
ZAHL = ('halved = sh[\'s\'] + p < tgt[\'s\']\n'
        '                    if (w.get(\'abz\') or {}).get(\'shield\'):'
        ' HIT[(1 - u, tgt_i)] = HIT.get((1 - u, tgt_i), 0) + 1')
ENDE = ('    for u in (0, 1):\n'
        '        dead[u] = sum(1 for sh in fleet[u] if sh[\'dead\'])')
ENDE_Z = ('    if HIT: HITS.append(dict(HIT)); HIT.clear()\n'
          '    for u in (0, 1):\n'
          '        dead[u] = sum(1 for sh in fleet[u] if sh[\'dead\'])')


def build(full=False, count=False):
    d = defs
    if full:
        assert BUD in d
        d = d.replace(BUD, BUD_FULL, 1)
    if count:
        assert PH in d and HALV in d and ENDE in d
        d = d.replace(PH, PH_Z, 1)
        d = d.replace(HALV, ZAHL, 1)
        d = d.replace(ENDE, ENDE_Z, 1)
    G = {'__name__': 'r13t_defs',
         '__file__': os.path.abspath(os.path.join(
             HERE, 'diag_random_r13t.py')),
         'HIT': {}, 'HITS': []}
    exec(compile(d, 'r13t_defs', 'exec'), G)
    return G


def run(G, spec, N=2000):
    battle_r, draw = G['battle_r'], G['draw_random_battle']
    acc_side, blank = G['acc_side'], G['blank']
    acc = blank()
    accn = [0, 0]
    fill = sock = 0
    for it in range(N):
        sc = draw(random)
        fill += sum(len(s['weapons']) + len(s['cards'])
                    for s in sc['att'] + sc['deff'])
        sock += sum(sum(s['build']['socks'].values())
                    for s in sc['att'] + sc['deff'])
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
    return acc, accn, fill, sock


KS = ('out', 'take', 'col', 'loot', 'prevent')
v11 = build()['v11']
C170 = [c for c in v11.cards if c['id'] == '170'][0]
C140 = [c for c in v11.cards if c['id'] == '140'][0]

# --- Referenz: normales Budget (nur TAKE-Gains) ---
R = {}
for label, spec in (('170_1P', C170), ('140_2P', C140)):
    random.seed(42)
    acc, accn, fl, sk = run(build(), spec)
    tk = (acc[0]['take'] / accn[0] + acc[1]['take'] / accn[1]) / 2
    R[label] = tk
    print('%s: TAKE-Gain %.3f (Bestueckung %.1f%%)'
          % (label, tk, 100 * fl / sk))
print('  Verhaeltnis 2P/1P: %.2fx' % (R['140_2P'] / R['170_1P']))

# --- Volles Budget: Dichte + TAKE-Gains ---
random.seed(42)
G = build(full=True, count=True)
battle_r, draw, HITS = G['battle_r'], G['draw_random_battle'], G['HITS']
fill = sock = 0
for it in range(2000):
    sc = draw(random)
    fill += sum(len(s['weapons']) + len(s['cards'])
                for s in sc['att'] + sc['deff'])
    sock += sum(sum(s['build']['socks'].values())
                for s in sc['att'] + sc['deff'])
    battle_r(sc)
print()
print('VOLLES BUDGET: Bestueckungsgrad %.1f%% (vorher ~33%%)'
      % (100 * fill / sock))
dist = {}
cells = 0
for ph in HITS:
    for k, v in ph.items():
        cells += 1
        dist[v] = dist.get(v, 0) + 1
for v in sorted(dist):
    print('  %d Schild-Treffer: %d Zellen (%.1f%%)'
          % (v, dist[v], 100 * dist[v] / cells))
ge2 = sum(v for k, v in dist.items() if k >= 2)
print('  Zellen mit >=2 Treffern: %.1f%% (vorher 29.8%%)'
      % (100 * ge2 / cells))

RF = {}
for label, spec in (('170_1P', C170), ('140_2P', C140)):
    random.seed(42)
    acc, accn, fl, sk = run(build(full=True), spec)
    tk = (acc[0]['take'] / accn[0] + acc[1]['take'] / accn[1]) / 2
    RF[label] = tk
    print('%s volles Budget: TAKE-Gain %.3f' % (label, tk))
print('  Verhaeltnis 2P/1P bei vollem Budget: %.2fx (vorher %.2fx)'
      % (RF['140_2P'] / RF['170_1P'], R['140_2P'] / R['170_1P']))
