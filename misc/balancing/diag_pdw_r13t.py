#!/usr/bin/env python3
"""diag_pdw_r13t: PD-Gutschrift-A/B fuer Dual-Use-Waffen vs. Stat-PD.

Christophers Sicherheitsfrage: Bekommen PD-Dual-Use-Waffen den
verhinderten Schaden gutgeschrieben? v4-Befund: 341 Koedersystem
(2 pd-Punkte) realisiert TAKE 1,58, 234 Punktabwehrlaser (2 Punkte)
TAKE -0,00. 2x2-Test (je CRN, N=2000, seed 42, Sonde v4-Definitionen):

- V1: 234 normal (PD-Bezahlung aktiv)
- V2: 234 def_pts=0 (nur Offensiv, PD-Bezahlung aus)
- V3: 341 normal (added-pd 2 aktiv)
- V4: 341 added=[] (PD aus)

Score(V1)-Score(V2) = gutgeschriebener PD-Wert der WAFFE (PAY-Pfad).
Score(V3)-Score(V4) = gutgeschriebener PD-Wert der KARTE (added-Pfad).
Wenn die Differenz nur bei der Karte positiv ist, ist der PAY-Pfad
buggy; wenn beide positiv sind, ist die Buchung korrekt und der
kleine TAKE-Wert der Waffen ist real (Angriffsarmut/Konkurrenz).
"""
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))

src = open(os.path.join(HERE, 'diag_random_r13t.py'),
           encoding='utf-8').read()
marker = '# ---------------- Messung mit Checkpoint'
defs = src[:src.index(marker)]
G = {'__name__': 'r13t_defs',
     '__file__': os.path.abspath(os.path.join(
         HERE, 'diag_random_r13t.py'))}
exec(compile(defs, 'r13t_defs', 'exec'), G)

v11 = G['v11']
battle_r = G['battle_r']
draw_random_battle = G['draw_random_battle']
acc_side = G['acc_side']
blank = G['blank']


def score_of(acc, n, card, hp=0, units=None):
    """Identisch zur Sonde v4 (dort hinter dem exec-Marker)."""
    if sum(n) == 0:
        return None
    if units is None:
        units = card['units']
    g = [(acc[s]['out'] + acc[s]['take'] + acc[s]['col']
          + acc[s]['loot'] + acc[s]['prevent']) / n[s]
         for s in (0, 1) if n[s] > 0]
    gain = sum(g) / len(g)
    return (gain + 0.5 * hp) / units

W234 = [w for w in v11.weapons if w['id'] == '234'][0]
C341 = [c for c in v11.cards if c['id'] == '341'][0]
W234_nopd = dict(W234, def_pts=0, def_types={})
C341_nopd = dict(C341, added=[])


def run(wspec=None, spec=None, N=2000):
    acc = blank()
    accn = [0, 0]
    for it in range(N):
        sc = draw_random_battle(random)
        r0 = battle_r(sc)
        a0, a1 = acc_side(r0, 0), acc_side(r0, 1)
        for side in (0, 1):
            if wspec is not None:
                wf = sc['wf'][side]
                r = battle_r(sc, spin=it % 3, wspec=dict(wspec),
                             wf=wf, spec_side=side)
            else:
                r = battle_r(sc, spin=it % 3, spec=dict(spec),
                             spec_side=side)
            if r is None:
                continue
            accn[side] += 1
            a = acc_side(r, side)
            base = a0 if side == 0 else a1
            for k in a:
                acc[side][k] += a[k] - base[k]
    return acc, accn


N = 2000
res = {}
for name, kw in (('V1_w234_pd', dict(wspec=W234)),
                 ('V2_w234_nopd', dict(wspec=W234_nopd)),
                 ('V3_c341_pd', dict(spec=C341)),
                 ('V4_c341_nopd', dict(spec=C341_nopd))):
    random.seed(42)
    acc, accn = run(N=N, **kw)
    units = (v11.weapon_units(kw['wspec']) if 'wspec' in kw
             else kw['spec']['units'])
    s = score_of(acc, accn, None, units=units)
    per = {k: (acc[side][k] / accn[side]) / units
           for side in (0, 1) if accn[side] > 0
           for k in ('out', 'take', 'col', 'loot', 'prevent')}
    roll = {}
    for k in ('out', 'take', 'col', 'loot', 'prevent'):
        vals = [acc[side][k] / accn[side] / units
                for side in (0, 1) if accn[side] > 0]
        roll[k] = sum(vals) / len(vals)
    res[name] = dict(score=s, comp=roll, n=accn)
    print('%s: Score %.3f (n=%d/%d)' % (name, s, accn[0], accn[1]))

print()
d_w = res['V1_w234_pd']['score'] - res['V2_w234_nopd']['score']
d_c = res['V3_c341_pd']['score'] - res['V4_c341_nopd']['score']
print('=== PD-Gutschrift (gutgeschriebener PD-Wert) ===')
print('Waffe 234 (PAY-Pfad):   Score-PD = %+.3f' % d_w)
print('  TAKE-Kanal: pd %+.3f vs. nopd %+.3f'
      % (res['V1_w234_pd']['comp']['take'],
         res['V2_w234_nopd']['comp']['take']))
print('Karte 341 (added-Pfad): Score-PD = %+.3f' % d_c)
print('  TAKE-Kanal: pd %+.3f vs. nopd %+.3f'
      % (res['V3_c341_pd']['comp']['take'],
         res['V4_c341_nopd']['comp']['take']))
print()
if d_c > 0.3 and abs(d_w) < 0.05:
    print('BEFUND: Karte realisiert PD-Wert, Waffe NICHT -> PAY-Pfad pruefen!')
elif d_c > 0.3 and d_w > 0.05:
    print('BEFUND: Beide Pfade zahlen PD-Wert korrekt gut; '
          'Wert-Unterschied ist real.')
else:
    print('BEFUND: siehe Zahlen.')
