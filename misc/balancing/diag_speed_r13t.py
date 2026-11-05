#!/usr/bin/env python3
"""diag_speed_r13t: Element-Verifikation Speed + Schild-Treffer-Dichte.

Christophers Fragen (5.11.2026):
1. Wirken wirklich ALLE Speed-Elemente im Frame? Isoliert per A/B
   (bewertet NUR Karte 161 Ionenschubduesen, sp+1, r1):
   - V1: normal (Referenz)
   - V2: Abfang-Ausduennung OFF (12c-Filter entfernt)
   - V3: halved OFF (Speed-Schwelle nie kippen)
   - V4: beide OFF
   Deltas = Beitraege der Einzelelemente auf den 161-Score.
2. Wie viele schildabzugs-relevante Angriffe treffen je Ziel-Schiff
   je PHASE (Baseline V1)? Dichte entscheidet, ob 2-Schildpunkte
   (nie deaktiviert bei dmg < Reduktion) ueberproportional wirken
   koennen (Christophers Flottenkampf-These).
"""
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))

src = open(os.path.join(HERE, 'diag_random_r13t.py'),
           encoding='utf-8').read()
marker = '# ---------------- Messung mit Checkpoint'
defs = src[:src.index(marker)]

AUS = ('kept = [(i, sh) for i, sh in enumerate(fleet[1])\n'
       '                if sh[\'s\'] >= s0min]')
AUS_OFF = 'kept = list(enumerate(fleet[1]))'
HALV = 'halved = sh[\'s\'] + p < tgt[\'s\']'
HALV_OFF = 'halved = False'
PH = 'for p in PHASES:'
PH_Z = ('for p in PHASES:\n'
        '        if HIT: HITS.append(dict(HIT)); HIT.clear()')
ZAHL = ('halved = sh[\'s\'] + p < tgt[\'s\']\n'
        '                    if (w.get(\'abz\') or {}).get(\'shield\'):'
        ' HIT[(1 - u, tgt_i)] = HIT.get((1 - u, tgt_i), 0) + 1')
ENDE = ('    for u in (0, 1):\n'
        '        dead[u] = sum(1 for sh in fleet[u] if sh[\'dead\'])')
ENDE_Z = ('    if HIT: HITS.append(dict(HIT)); HIT.clear()\n'
          '    for u in (0, 1):\n'
          '        dead[u] = sum(1 for sh in fleet[u] if sh[\'dead\'])')


def build(no_aus=False, no_halv=False, count=False):
    d = defs
    if no_aus:
        assert AUS in d
        d = d.replace(AUS, AUS_OFF)
    if no_halv:
        assert HALV in d
        d = d.replace(HALV, HALV_OFF)
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


def score_of(acc, n, hp=0, units=1):
    if sum(n) == 0:
        return None
    g = [(acc[s]['out'] + acc[s]['take'] + acc[s]['col']
          + acc[s]['loot'] + acc[s]['prevent']) / n[s]
         for s in (0, 1) if n[s] > 0]
    return (sum(g) / len(g) + 0.5 * hp) / units


def run(G, spec, N=2000):
    battle_r = G['battle_r']
    draw = G['draw_random_battle']
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

V = {}
for name, kw in (('V1_normal', {}),
                 ('V2_aus_off', dict(no_aus=True)),
                 ('V3_halv_off', dict(no_halv=True)),
                 ('V4_beide_off', dict(no_aus=True, no_halv=True))):
    G = build(**kw)
    acc, accn = run(G, C161)
    s = score_of(acc, accn, hp=C161.get('hp', 0),
                 units=C161.get('units', 1))
    V[name] = s
    print('%s: 161-Score %.3f (n=%d/%d)' % (name, s, accn[0], accn[1]))

print()
print('=== Speed-Element-Beitraege auf 161-Score ===')
print('Ausduennung (12c)     : V1-V2 = %+.3f'
      % (V['V1_normal'] - V['V2_aus_off']))
print('halbed-Schwelle       : V1-V3 = %+.3f'
      % (V['V1_normal'] - V['V3_halv_off']))
print('beide zusammen        : V1-V4 = %+.3f'
      % (V['V1_normal'] - V['V4_beide_off']))

print()
G = build(count=True)
HITS = G['HITS']
battle_r, draw = G['battle_r'], G['draw_random_battle']
random.seed(42)
n_ph_ship = 0
dist = {}
for it in range(2000):
    sc = draw(random)
    battle_r(sc)
for ph in G['HITS']:
    for k, v in ph.items():
        n_ph_ship += 1
        dist[v] = dist.get(v, 0) + 1
print('=== Schild-Treffer-Dichte (Baseline, N=2000) ===')
print('Phasen-Schiff-Zellen mit >=1 schildabzugs-Angriff: %d' % n_ph_ship)
for v in sorted(dist):
    print('  %d Treffer: %d Zellen (%.1f%%)' % (v, dist[v],
          100 * dist[v] / max(1, n_ph_ship)))
tot = sum(k * v for k, v in dist.items())
print('  im Schnitt %.2f Schild-Angriffe je betroffener Zelle'
      % (tot / max(1, n_ph_ship)))
ge2 = sum(v for k, v in dist.items() if k >= 2)
print('  Zellen mit >=2 Treffern (2P-Karte koennte ueber 1P hinaus'
      ' wirken): %.1f%%' % (100 * ge2 / max(1, n_ph_ship)))
