#!/usr/bin/env python3
"""diag_ctrl_r13t: Ausduennungs-Out-Delta + Control-Simulationsfrage.

Christophers Fragen:
1. Der out-Malus -0,31 der Ionenschubduesen (Sicht 0) kommt
   angeblich aus der Abfang-Ausduennung -> Kanal-Delta
   V1 (normal) vs. V2 (Ausduennung OFF) je Kanal.
2. "Die Kombination aus Speed und Control wuerde diesen Wert
   deutlich erhoehen" -> Simulation: ctrl_add-Pfad in battle_r
   gebaut (Statkarten mit control wirken auf sh['ctrl']), dann
   fiktive Karten gemesen (Raw-Gain, N=2000, seed 42, CRN):
   - C161:  sp 1 (reale Karte, Referenz)
   - CTRL2: control 2 (fiktiv)
   - BOTH:  sp 1 + control 2 (fiktiv, Interaktion = BOTH - C161 - CTRL2)
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
S0 = 'hp_add=0, sp_add=0))'
S0C = 'hp_add=0, sp_add=0, ctrl_add=0))'
SPADD = "s['sp_add'] += spec['speed']"
SPADD_C = ("s['sp_add'] += spec['speed']\n"
           "                    s['ctrl_add'] += spec.get('control', 0)")
CTRL = 'ctrl=b[\'ctrl\'],'
CTRL_C = "ctrl=b['ctrl'] + s['ctrl_add'],"


def build(no_aus=False, ctrl=False):
    d = defs
    if no_aus:
        assert AUS in d
        d = d.replace(AUS, AUS_OFF)
    if ctrl:
        assert S0 in d and SPADD in d and CTRL in d
        d = d.replace(S0, S0C)
        d = d.replace(SPADD, SPADD_C, 1)
        d = d.replace(CTRL, CTRL_C, 1)
    G = {'__name__': 'r13t_defs',
         '__file__': os.path.abspath(os.path.join(
             HERE, 'diag_random_r13t.py'))}
    exec(compile(d, 'r13t_defs', 'exec'), G)
    return G


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


KS = ('out', 'take', 'col', 'loot', 'prevent')


def gain(acc, n, side):
    return sum(acc[side][k] for k in KS) / n[side]


# --- Teil 1: Ausduennungs-Kanaldelta (161) ---
res = {}
for label, no_aus in (('V1', False), ('V2_aus_off', True)):
    random.seed(42)
    G = build(no_aus=no_aus)
    C161 = [c for c in G['v11'].cards if c['id'] == '161'][0]
    res[label] = run(G, C161)
print('Ausduennungs-Effekt je Kanal (161, V1 - V2_aus_off, N=2000):')
for side in (0, 1):
    a1, n1 = res['V1']
    a2, n2 = res['V2_aus_off']
    row = ['%-7s %+.3f' % (k, a1[side][k] / n1[side]
                           - a2[side][k] / n2[side]) for k in KS]
    print('  Sicht %d: %s' % (side, '  '.join(row)))

# --- Teil 2: Control-Simulation ---
random.seed(42)
G = build(ctrl=True)
v11 = G['v11']
C161 = [c for c in v11.cards if c['id'] == '161'][0]
CTRL2 = dict(C161, speed=0, control=2)
BOTH = dict(C161, control=2)

R = {}
for label, spec in (('C161_sp1', C161), ('CTRL2', CTRL2),
                    ('BOTH_sp1_ctrl2', BOTH)):
    random.seed(42)
    acc, accn = run(G, spec)
    R[label] = (acc, accn)
    g0 = gain(acc, accn, 0)
    g1 = gain(acc, accn, 1)
    print('%s: Raw-Gain %.3f (Sicht 0 %.3f / Sicht 1 %.3f, n=%d/%d)'
          % (label, (g0 + g1) / 2, g0, g1, accn[0], accn[1]))

g161 = (gain(*R['C161_sp1'], 0) + gain(*R['C161_sp1'], 1)) / 2
gctrl = (gain(*R['CTRL2'], 0) + gain(*R['CTRL2'], 1)) / 2
gboth = (gain(*R['BOTH_sp1_ctrl2'], 0) + gain(*R['BOTH_sp1_ctrl2'], 1)) / 2
print()
print('Interaktion Speed x Control: BOTH - C161 - CTRL2 = %+.3f'
      % (gboth - g161 - gctrl))
print('  (0 = additiv, > 0 = Synergie wie Christophers These)')
for label in ('C161_sp1', 'CTRL2', 'BOTH_sp1_ctrl2'):
    acc, n = R[label]
    l0 = acc[0]['loot'] / n[0]
    p1 = acc[1]['prevent'] / n[1]
    print('  %s: loot(Sicht0) %+.3f prevent(Sicht1) %+.3f'
          % (label, l0, p1))
