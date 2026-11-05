#!/usr/bin/env python3
"""diag_speed4_r13t: Trager-Zahler fuer die +1-sp-Kippquote (161, v22).

Christophers Fragen (6.11.2026):
- In wie viel Prozent der Faelle wird durch +1 Speed HAEUFIGER
  halbiert? (Anteil der Schuesse auf den Traeger, die durch die
  Karte neu an der Kante kippen: D == p+1)
- Wie oft ist der Traeger ueberhaupt Ziel (Zielfokus erster
  lebender Gegner)? Wie viel Schaden erspart das Kippen je Gefecht?
- Angriffsrichtung: Schuesse VOM Traeger, die durch +1 sp NICHT
  mehr halbiert werden (D == p): zusaetzlicher Output.

Patch: spec-Placement merkt Traeger in SI; Zahler nach der
halved/d-Zeile. CRN, N=2000, seed 42, v22->=-Regel.
"""
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'diag_random_r13t.py'),
           encoding='utf-8').read()
marker = '# ---------------- Messung mit Checkpoint'
defs = src[:src.index(marker)]

PLACE = "s['cards'].append(dict(spec))"
PLACE_SI = "s['cards'].append(dict(spec)); SI['owner'] = (spec_side, i)"
PAY0 = '    pay = []'
PAY_SI = '    pay = []\n    SI.clear()'
HALVD = ('halved = sh[\'s\'] + p <= tgt[\'s\']\n'
         '                    d = v9.half(base) if halved else base')
HALVD_Z = ('halved = sh[\'s\'] + p <= tgt[\'s\']\n'
           '                    d = v9.half(base) if halved else base\n'
           '                    if SI and len(own) > i and (u, i) =='
           ' SI[\'owner\']:\n'
           '                        CNT[\'from\'] += 1\n'
           '                        if halved:\n'
           '                            CNT[\'from_halv\'] += 1\n'
           '                        elif tgt[\'s\'] - sh[\'s\'] == p:\n'
           '                            CNT[\'from_resc\'] += 1\n'
           '                            CNT[\'from_gain\'] +='
           ' d - v9.half(base)\n'
           '                    if SI and (1 - u, tgt_i) =='
           ' SI[\'owner\']:\n'
           '                        CNT[\'on\'] += 1\n'
           '                        if halved:\n'
           '                            CNT[\'on_halv\'] += 1\n'
           '                            CNT[\'on_saved\'] += base - d\n'
           '                        if tgt[\'s\'] - sh[\'s\'] == p + 1:\n'
           '                            CNT[\'on_new\'] += 1\n'
           '                            CNT[\'on_new_saved\'] += base - d')

REMAP = "        fire_l[1] = [fire_l[1][old] for old, _ in kept]"
REMAP_SI = ('        fire_l[1] = [fire_l[1][old] for old, _ in kept]\n'
            '        if SI and SI[\'owner\'] and SI[\'owner\'][0] == 1:\n'
            '            SI[\'owner\'] = ((1, remap[SI[\'owner\'][1]])\n'
            '                           if SI[\'owner\'][1] in remap'
            ' else None)')

d = defs
assert PLACE in d and PAY0 in d and HALVD in d and REMAP in d
d = d.replace(PLACE, PLACE_SI, 1)
d = d.replace(PAY0, PAY_SI, 1)
d = d.replace(HALVD, HALVD_Z, 1)
d = d.replace(REMAP, REMAP_SI, 1)

G = {'__name__': 'r13t_defs',
     '__file__': os.path.abspath(os.path.join(
         HERE, 'diag_random_r13t.py')),
     'SI': {}, 'CNT': dict.fromkeys(
         ('from', 'from_halv', 'from_resc', 'from_gain', 'on',
          'on_halv', 'on_saved', 'on_new', 'on_new_saved'), 0)}
exec(compile(d, 'r13t_defs', 'exec'), G)

battle_r, draw = G['battle_r'], G['draw_random_battle']
acc_side, blank = G['acc_side'], G['blank']
v11 = G['v11']
C161 = [c for c in v11.cards if c['id'] == '161'][0]

KS = ('out', 'take', 'col', 'loot', 'prevent')
acc = blank()
accn = [0, 0]
random.seed(42)
N = 2000
ships_seen = 0
for it in range(N):
    sc = draw(random)
    ships_seen += len(sc['att']) + len(sc['deff'])
    r0 = battle_r(sc)
    a0, a1 = acc_side(r0, 0), acc_side(r0, 1)
    for side in (0, 1):
        r = battle_r(sc, spin=it % 3, spec=dict(C161),
                     spec_side=side)
        if r is None:
            continue
        accn[side] += 1
        a = acc_side(r, side)
        m = {k: a[k] - (a0 if side == 0 else a1)[k] for k in a}
        for k in m:
            acc[side][k] += m[k]

c = G['CNT']
pl = accn[0] + accn[1]
print('Platzierungen: %d (Schiffe je Gefecht im Schnitt %.2f)'
      % (pl, ships_seen / N))
print('Schuesse auf den Traeger: %d -> %.2f je Platzierung'
      % (c['on'], c['on'] / pl))
print('  davon halbiert: %d (%.1f%% der Traeger-Schuesse)'
      % (c['on_halv'], 100 * c['on_halv'] / max(1, c['on'])))
print('  NEU gekippt durch +1 sp (D == p+1): %d = %.1f%% der'
      ' Traeger-Schuesse, Ersparnis %.2f Schaden je Platzierung'
      % (c['on_new'], 100 * c['on_new'] / max(1, c['on']),
         c['on_new_saved'] / pl))
print('  gesamt Ersparnis durch Halbed auf dem Traeger: %.2f'
      ' Schaden je Platzierung' % (c['on_saved'] / pl))
print('Schuesse VOM Traeger: %d -> %.2f je Platzierung'
      % (c['from'], c['from'] / pl))
print('  halbiert: %d (%.1f%%)' % (c['from_halv'],
      100 * c['from_halv'] / max(1, c['from'])))
print('  durch +1 sp GERETTET (D == p, nicht mehr halbiert):'
      ' %d, zusaetzlicher Output %.2f je Platzierung'
      % (c['from_resc'], c['from_gain'] / pl))
print()
print('Kontroll-Kanaele (161, diese Messung):')
for side in (0, 1):
    print('  Sicht %d: take %+.3f  Bilanz(out+take) %+.3f'
          % (side, acc[side]['take'] / accn[side],
             (acc[side]['out'] + acc[side]['take']) / accn[side]))
