#!/usr/bin/env python3
"""diag_pd2_r13t: PD-Isolationstest (Runde 13t, 5.11.2026).

Christophers Challenge: PD-Dichte MUSS Torpedos treffen (pd-Abzuege
4..14, Punktabwehr-Enge). Befund: Umgebungs-PD-Waffen zahlten ihre
def_pts NIE in side_pd (Frame-Bug) — NOPD-A/B war deshalb blind.

Drei CRN-identische Varianten (N=2000, seed 42, Sonde v3-Definitionen):
- Z0: Ist-Zustand (Umfeld-PD unbezahlt).
- Z1: Umgebungs-PD-Waffen zahlen def_pts in side_pd (src='w').
- Z2: Z1 + bewertete Waffe ignoriert NUR Waffen-PD (src='w' points=0)
  -> Z2-Z1 = isolierter direkter PD-Abfang auf die bewertete Waffe.

Bewertet: 8 Torpedos + 6 Kontrollen (pd-None-Waffen, duerfen in Z2
kaum wandern). PDSTAT = Waffen-PD-Punkte-Pool-Dichte.
"""
import json
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_PATH = os.path.join(HERE, 'diag_pd2_r13t.json')
N = 2000

BASE_SRC = open(os.path.join(HERE, 'diag_random_r13t.py'),
                encoding='utf-8').read()
MARK = '# ---------------- Messung mit Checkpoint'
DEFS = BASE_SRC[:BASE_SRC.index(MARK)]

TORP = ['554', '136', '127', '412', '216', '318', '101', '304']
CTRL = ['207', '209', '118', '310', '409', '125']
EVAL_IDS = TORP + CTRL


def make_G(z1=False, z2=False):
    s = DEFS
    assert 'PDSTAT' not in s
    s = s.replace(
        "PAY = []   # (side, ship_idx, def_types) der bewerteten Waffe",
        "PAY = []   # (side, ship_idx, def_types) der bewerteten Waffe\n"
        "PDSTAT = dict(pts=0, n=0)")
    if z1:
        old = """                    else:
                        cards.append(dict(a))
            fl.append(dict(hp=hp, s=b['s'] + s['sp_add'],"""
        new = """                    else:
                        cards.append(dict(a))
            # Z1-Fix: Umgebungs-PD-Waffen zahlen def_pts in side_pd
            # (Frame-Bug r13t: fehlte komplett, Christophers These).
            for w in s['weapons']:
                if w.get('def_pts', 0) > 0:
                    for t, pts in w['def_types'].items():
                        side_pd[u].append((dict(
                            type=t, points=pts, used=False,
                            recharge=v9.RECHARGE[t], src='w'), i))
                        PDSTAT['pts'] += pts
                        PDSTAT['n'] += 1
            fl.append(dict(hp=hp, s=b['s'] + s['sp_add'],"""
        assert s.count(old) == 1, 'Z1-Anker nicht eindeutig'
        s = s.replace(old, new)
    if z2:
        old = ("tgt['s'] else base\n"
               "                        pool = tgt['cards'] "
               "+ [c for c, _ in e_pd]")
        new = ("tgt['s'] else base\n"
               "                        pool = tgt['cards'] "
               "+ [(dict(c, points=0) if c.get('src') == 'w'\n"
               "                            else c) for c, _ in e_pd]")
        assert s.count(old) == 1, 'Z2-Anker nicht eindeutig'
        s = s.replace(old, new)
    G = {'__name__': 'r13t_defs',
         '__file__': os.path.abspath(os.path.join(
             HERE, 'diag_random_r13t.py'))}
    exec(compile(s, 'r13t_defs', 'exec'), G)
    return G


def run(G):
    v11 = G['v11']
    battle_r = G['battle_r']
    draw_random_battle = G['draw_random_battle']
    acc_side = G['acc_side']
    ws_map = {w['id']: w for w in v11.weapons}
    ws = [dict(ws_map[i]) for i in EVAL_IDS]
    acc = {wid: G['blank']() for wid in EVAL_IDS}
    accn = {wid: [0, 0] for wid in EVAL_IDS}
    for it in range(N):
        sc = draw_random_battle(random)
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
    return acc, accn, ws


def score_of(acc, n, units):
    g = [(acc[s]['out'] + acc[s]['take'] + acc[s]['col']
          + acc[s]['loot']) / n[s] for s in (0, 1) if n[s] > 0]
    return (sum(g) / len(g)) / units


res = {}
for name, z1, z2 in (('Z0', False, False), ('Z1', True, False),
                     ('Z2', True, True)):
    G = make_G(z1, z2)
    random.seed(42)
    acc, accn, ws = run(G)
    scores = {}
    for x in ws:
        u = G['v11'].weapon_units(x)
        scores[x['id']] = round(
            score_of(acc[x['id']], accn[x['id']], u), 2)
    res[name] = dict(scores=scores,
                     pd_pts=G['PDSTAT'] if 'PDSTAT' in G else None)
    print('%s fertig' % name)

json.dump(res, open(OUT_PATH, 'w', encoding='utf-8'), indent=1)

names = {w['id']: w['title'] for w in
         [dict(w) for w in __import__(
             'balancing_metric_v11').weapons]}
print()
print('=== PD-Isolation (N=%d, seed 42, Sonde v3) ===' % N)
print(f"{'ID':4s} {'Name':24s} {'r':>2s} {'Grp':>5s} "
      f"{'Z0':>6s} {'Z1':>6s} {'Z2':>6s} {'Z1-Z0':>7s} {'Z2-Z1':>7s}")
import balancing_metric_v11 as v11
rmap = {w['id']: w['rarity'] for w in v11.weapons}
for wid in EVAL_IDS:
    z0, z1, z2 = (res[x]['scores'][wid] for x in ('Z0', 'Z1', 'Z2'))
    print(f"{wid:4s} {names[wid][:24]:24s} {rmap[wid]:2d} "
          f"{'Torp' if wid in TORP else 'Ktrl':>5s} "
          f"{z0:6.2f} {z1:6.2f} {z2:6.2f} {z1 - z0:+7.2f} "
          f"{z2 - z1:+7.2f}")
for grp, ids in (('Torpedos', TORP), ('Kontrollen', CTRL)):
    for a, b in (('Z1', 'Z0'), ('Z2', 'Z1')):
        ds = [res[a]['scores'][i] - res[b]['scores'][i] for i in ids]
        print('%s: Mittel %s-%s %+.2f (%+.1f%%)'
              % (grp, a, b, sum(ds) / len(ds),
                 100 * sum(ds) / len(ds)
                 / max(0.01, sum(abs(res[b]['scores'][i])
                                 for i in ids) / len(ids))))
print('PDSTAT Z1:', res['Z1']['pd_pts'])
print('-> %s geschrieben' % os.path.basename(OUT_PATH))
