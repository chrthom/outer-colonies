#!/usr/bin/env python3
"""diag_pd_r13t: PD-Dichte-A/B im Zufalls-Frame (Runde 13t, 5.11.2026).

Christophers These: rarity-gewichtete Umgebung ist PD-lastig (42% der
r1-Waffen sind PD, gewichtet 32,8% des POOL) und nerft pd-anfaellige
Waffen (Torpedos: pd-Abzug 2..14) gegen pd-None-Waffen (z.B. 207)
systematisch.

A/B-Design (Frame-Audit, KEINE Wertmessung):
- FULL: Original-POOL (PD-Waffen enthalten).
- NOPD: PD-Waffen (def_pts>0) aus dem Umgebungs-POOL entfernt,
  Gewichte neu normiert. Statkarten (inkl. 341 Kodersystem-PD)
  bleiben, um NUR den PD-Waffen-Dichte-Effekt zu isolieren.
- Gleiche bewertete Waffen in beiden Varianten, CRN seed 42,
  N=2000. Score je Waffe = Rollenmittel-gain / weapon_units
  (wie Sonde v2).
- Ausserdem: tatsaechlich platzierte PD-Waffen-Dichte (FULL),
  da Sockel-Zwang Zuege verwirft.

Definitionen werden aus diag_random_r13t.py per exec geladen
(dessen Mess-Teil NICHT ausgefuehrt; Import-Unfall vermieden).
"""
import json
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PATH = os.path.join(HERE, 'diag_pd_r13t.json')
N = 2000

src = open(os.path.join(HERE, 'diag_random_r13t.py'),
           encoding='utf-8').read()
marker = '# ---------------- Messung mit Checkpoint'
defs = src[:src.index(marker)]
G = {'__name__': 'r13t_defs',
     '__file__': os.path.abspath(os.path.join(HERE,
                                               'diag_random_r13t.py'))}
exec(compile(defs, 'r13t_defs', 'exec'), G)

v11 = G['v11']
battle_r = G['battle_r']
draw_random_battle = G['draw_random_battle']
acc_side = G['acc_side']
POOL = G['POOL']
PPROB = G['PPROB']

# bewertete Waffen: Torpedos vs. Nicht-Torpedos ueber Raritaeten
TORP = ['554', '136', '127', '412', '216', '318', '101', '304']
NON = ['118', '125', '107', '207', '209', '310', '405', '409',
       '303', '203']
EVAL_IDS = TORP + NON
ws_map = {w['id']: w for w in v11.weapons}
ws = [dict(ws_map[i]) for i in EVAL_IDS]

POOL_N = [p for p in POOL
          if not (p['kind'] == 'w' and p.get('def_pts', 0) > 0)]
PPROB_N = ([v11 and G['v10'].RARITY_W[p['rarity']] for p in POOL_N])
PPROB_N = [G['v10'].RARITY_W[p['rarity']] / sum(PPROB_N) for p in POOL_N]


def run(pool, pprob):
    G['POOL'] = pool
    G['PPROB'] = pprob
    acc = {wid: G['blank']() for wid in EVAL_IDS}
    accn = {wid: [0, 0] for wid in EVAL_IDS}
    pd_stats = dict(n_w=0, n_pd=0)
    for it in range(N):
        sc = draw_random_battle(random)
        for s in sc['att'] + sc['deff']:
            for w in s['weapons']:
                pd_stats['n_w'] += 1
                if w.get('def_pts', 0) > 0:
                    pd_stats['n_pd'] += 1
        r0 = battle_r(sc)
        a0, a1 = acc_side(r0, 0), acc_side(r0, 1)
        for x in ws:
            for side in (0, 1):
                r = battle_r(sc, spin=it % 3, wspec=dict(x),
                             wf=sc['wf'][side], spec_side=side)
                if r is None:
                    continue
                accn[x['id']][side] += 1
                a = acc_side(r, side)
                base = a0 if side == 0 else a1
                for k in a:
                    acc[x['id']][side][k] += a[k] - base[k]
    return acc, accn, pd_stats


def score_of(acc, n, units):
    g = [(acc[s]['out'] + acc[s]['take'] + acc[s]['col']
          + acc[s]['loot']) / n[s] for s in (0, 1) if n[s] > 0]
    return (sum(g) / len(g)) / units


random.seed(42)
accF, accnF, pdF = run(POOL, PPROB)
random.seed(42)
accN, accnN, pdN = run(POOL_N, PPROB_N)

rows = []
for x in ws:
    wid = x['id']
    u = v11.weapon_units(x)
    sf = score_of(accF[wid], accnF[wid], u)
    sn = score_of(accN[wid], accnN[wid], u)
    rows.append(dict(id=wid, title=x['title'], rarity=x['rarity'],
                     torp=wid in TORP, score_full=round(sf, 2),
                     score_nopd=round(sn, 2),
                     delta_pct=round(100 * (sn - sf) / abs(sf), 1)))
res = dict(N=N, pd_full=dict(placed=pdF['n_w'],
                             pd_share=round(pdF['n_pd']
                                            / max(1, pdF['n_w']), 3)),
           rows=rows)
json.dump(res, open(OUT_PATH, 'w', encoding='utf-8'), indent=1)

print('=== PD-Dichte-A/B (N=%d, seed 42) ===' % N)
print('FULL: platzierte Umgebungs-Waffen %d, davon PD %.1f%%'
      % (pdF['n_w'], 100 * pdF['n_pd'] / max(1, pdF['n_w'])))
print('NOPD: platzierte Umgebungs-Waffen %d (PD entfernt)'
      % pdN['n_w'])
print()
print(f"{'ID':4s} {'Name':26s} {'r':>2s} {'Typ':>5s} "
      f"{'FULL':>6s} {'NOPD':>6s} {'Delta%':>7s}")
for r in sorted(rows, key=lambda r: -r['delta_pct']):
    print(f"{r['id']:4s} {r['title'][:26]:26s} {r['rarity']:2d} "
          f"{'Torp' if r['torp'] else '-':>5s} "
          f"{r['score_full']:6.2f} {r['score_nopd']:6.2f} "
          f"{r['delta_pct']:+7.1f}")
tg = [r['delta_pct'] for r in rows if r['torp']]
ng = [r['delta_pct'] for r in rows if not r['torp']]
print()
print('Mittel Delta%%: Torpedos %+.1f | Nicht-Torpedos %+.1f'
      % (sum(tg) / len(tg), sum(ng) / len(ng)))
print('-> %s geschrieben' % os.path.basename(OUT_PATH))
