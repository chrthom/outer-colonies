#!/usr/bin/env python3
"""frame_probe_r13l (Christophers Frame-Challenge, 4.11.2026):

Warum sind Torpedos von "stark unterbewertet" auf "stark ueberbewertet"
geflippt? Code-Review-Befunde (siehe balancing.md Runde 13l):
  (1) singles feuern korrekt NUR in fire_phase (1 Phase, 1 Muenze je
      Traeger) — Torpedos greifen je Schiff nach wie vor nur 1x an.
  (2) Frame v16 feuert die bewertete Karte (wspec) auf 2-/3-teiligen
      Schiffen mit n_inst=2 INSTANZEN — d.h. die Einzelkarte erhaelt
      den Stack-Bonus (Innerhalb einer Phase bleibt eine verbrauchte
      Defense-Karte bis zum Phasenende deaktiviert: Instanz 1 opfert
      sich der PD, Instanz 2 trifft frei). Torpedo-Stacks sind aber
      nach Christophers Design WOLKT (Combo), nicht Kartenwert.
  (3) POOL_SHIFT=0.25 (13e) senkt die PD-Rate 46,4->~34 % — PD ist die
      Torpedo-Gegenwaffe; der Shift kann den Flip mitverursachen.

Szenarien (CLI): sq (v16-Status quo) | n1 (bewertete Karte 1x,
Gefechtswaffe weiter n_inst — Christophers Option "jedes Schiff hat nur
1x die ausgewaehlte Waffe, grosse Schiffe zusaetzlich eine repraesentative
andere") | c3 (nur 3-teilige Schiffe 2 Waffen, 2-teilige 1) | shift0
(PD-Anteil zurueck auf Original-Verteilung) | v412 (412-Varianten im
sq-Frame: Pz-Abzug 2/3, Reichweite 4, r4-Tausch-Sicht + 409-Partner).

CRN seed 42, N=10k Default, Mini-Cache je Szenario (Fortsetzung nach
Timeout einfach durch erneuten Aufruf). Waffen: 10 FINAL-Torpedos +
4 FINAL-Dauerfeuer-Referenzen. Validierung: sq-Scores muessen zu
frame_calibration.json (Runde 13j/13k-Messung) passen.
"""
import importlib.util
import json
import os
import random
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import balancing_metric_v11 as v0   # Referenz (Zielkurve, FINAL-Waffen)
import balancing_metric_v10 as v10
import balancing_metric_v9 as v9

SCEN = sys.argv[1] if len(sys.argv) > 1 else 'sq'
N = int(sys.argv[2]) if len(sys.argv) > 2 else 10000
T = dict(v0.TARGETS_V14)           # Zielkurve v17: 7,8/8,0/8,4/9,0/9,8

# --- Patches (jeder String muss EXAKT 1x vorkommen) ---
WSEP_1 = '                        for _inst in range(sh[\'n_inst\']):'
PATCHES = {
    'sq': [],
    'n1': [(WSEP_1, WSEP_1.replace("range(sh['n_inst'])", 'range(1)'))],
    'c3': [('n_inst=(1 if b[\'parts\'] == 1 else 2)',
            'n_inst=(2 if b[\'parts\'] == 3 else 1)')],
    'shift0': [('POOL_SHIFT = 0.25', 'POOL_SHIFT = 0.0')],
    'v412': [],
}
PATCHES['n1shift0'] = PATCHES['n1'] + PATCHES['shift0']
PATCHES['n1c3'] = PATCHES['n1'] + PATCHES['c3']
assert SCEN in PATCHES, f'unbekanntes Szenario {SCEN}'


def load_v11(repl, tag):
    src = open(os.path.join(HERE, 'balancing_metric_v11.py'),
               encoding='utf-8').read()
    for old, new in repl:
        assert src.count(old) == 1, f'Patch-String {old[:40]!r} nicht eindeutig'
        src = src.replace(old, new)
    path = os.path.join(HERE, f'_tmp_v11_{tag}.py')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(src)
    spec = importlib.util.spec_from_file_location(f'v11_{tag}', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


V = load_v11(PATCHES[SCEN], SCEN)

TORP = ['101', '127', '136', '167', '216', '304', '412', '422', '554', '555']
MULTI = ['106', '118', '224', '234']


def apply(w, ch):
    if 'dmg' in ch:
        w['damage'] = ch['dmg']
    if 'e' in ch:
        w['energy'] = ch['e']
    if 'range' in ch:
        w['range'] = ch['range']
    if 'abz' in ch:
        w['abz'].update(ch['abz'])
    w['fire_phase'] = min(w['range'], 4)
    w['r1_col'] = v10.colony_r1(w)


def variant(wid, **ch):
    w = dict({x['id']: x for x in V.weapons}[wid])
    w['abz'] = dict(w['abz'])
    apply(w, ch)
    return w


if SCEN == 'v412':
    B = dict(e=1, dmg=10, abz={'pd': 5})
    SPEC = [
        ('FIN', '412', {}),
        ('B', '412', dict(B)),
        ('B_Pz2', '412', dict(B, abz={'pd': 5, 'armour': 2})),
        ('B_Pz3', '412', dict(B, abz={'pd': 5, 'armour': 3})),
        ('B_r4', '412', dict(B, range=4)),
        ('B_r4Pz2', '412', dict(B, range=4, abz={'pd': 5, 'armour': 2})),
        ('FIN', '409', {}),                # Tauschpartner-Sicht r4 -> r3
    ]
    KEYS = TORP + MULTI
else:
    SPEC = [(wid, wid, {}) for wid in TORP + MULTI]
    KEYS = None
SPECS = [(lbl, wid, variant(wid, **ch)) for lbl, wid, ch in SPEC]

cpools = [(cs, p) for cs, p in v9.COLONY]
cptot = sum(p for _, p in cpools)

# --- Mini-Cache (Fortsetzung nach Timeout) ---
CACHE = os.path.join(HERE, f'frame_probe_r13l_{SCEN}.json.cache')
acc = {(lbl, wid): [0.0, 0.0, 0.0, 0.0] for lbl, wid, _ in SPECS}
base = dict(taken=0.0, dealt=0.0, loss=0, wipe=0, col=0.0, loot=0.0, n=0)
start = 0
if os.path.exists(CACHE):
    c = json.load(open(CACHE))
    if c.get('scen') == SCEN and c.get('n') < N:
        acc = {tuple(k.split('|')): v for k, v in c['acc'].items()}
        base = c['base']
        start = c['n']
        print(f'Cache: weiter ab Gefecht {start}', flush=True)

random.seed(42)
t0 = time.time()
for b in range(start, N):
    w, att, deff, raid = V.draw_battle()
    pool_cards, _ = V.pools[random.choices(
        range(len(V.pools)), weights=V.pprob)[0]]
    colpool = None
    if raid:
        colpool = cpools[random.choices(
            range(len(cpools)), weights=[p / cptot for _, p in cpools])[0]][0]
    fire = [[[random.random() < v10.ATTACK_PROB[p] for p in V.PHASES]
             for _ in range(3)] for _ in (0, 1)]
    wspec_fire = [[random.random() < v10.ATTACK_PROB[p] for p in V.PHASES]
                  for _ in range(3)]
    order = (0, 1) if b % 2 == 0 else (1, 0)
    t1, d1, dd0, _, c1, e1, l1 = V.battle(
        w, att, deff, pool_cards, fire, order, raid=raid, colpool=colpool)
    base['taken'] += t1
    base['dealt'] += d1
    base['col'] += c1
    base['loot'] += l1
    base['loss'] += 1 if dd0 > 0 else 0
    base['wipe'] += 1 if dd0 == 3 else 0
    base['n'] += 1
    for lbl, wid, sp in SPECS:
        t2, d2, dd2, _, c2, e2, l2 = V.battle(
            w, att, deff, pool_cards, fire, order, raid=raid,
            wspec=sp, wspec_fire=wspec_fire, colpool=colpool)
        a = acc[(lbl, wid)]
        a[0] += d2 - d1          # out
        a[1] += -(t2 - t1)       # take (negativ = gut)
        a[2] += -(c2 - c1)       # col
        a[3] += l2 - l1         # loot
    if (b + 1) % 1000 == 0 or b + 1 == N:
        json.dump(dict(scen=SCEN, n=b + 1, base=base,
                       acc={f'{l}|{w_}': v for (l, w_), v in acc.items()}),
                  open(CACHE, 'w'))
        print(f'  {b + 1}/{N} ({time.time() - t0:.0f}s)', flush=True)

rows = []
for lbl, wid, sp in SPECS:
    a = acc[(lbl, wid)]
    units = V.weapon_units(sp)
    gain = sum(a) / N / 3
    score = gain / units
    r = sp['rarity']
    row = dict(label=lbl, id=wid, title=sp['title'], rarity=r,
               score=round(score, 3), delta=round(score - T[r], 2),
               single=sp.get('single'),
               delta_alt=[round(score - T[x], 2) for x in (3, 4)]
               if wid in ('409', '412') else None)
    rows.append(row)
out = dict(scenario=SCEN, n=N,
           baseline=dict(taken=round(base['taken'] / N, 2),
                         dealt=round(base['dealt'] / N, 2),
                         loss_rate=round(base['loss'] / N, 3),
                         wipe_rate=round(base['wipe'] / N, 3),
                         colony=round(base['col'] / N, 2),
                         loot=round(base['loot'] / N, 2)),
           targets=T, rows=rows)
json.dump(out, open(os.path.join(HERE, f'frame_probe_r13l_{SCEN}.json'),
                    'w', encoding='utf-8'), ensure_ascii=False, indent=1)
os.remove(CACHE)
try:
    os.remove(os.path.join(HERE, f'_tmp_v11_{SCEN}.py'))
except OSError:
    pass
print(f"\nSzenario {SCEN} (N={N})  Baseline: taken {out['baseline']['taken']}"
      f" dealt {out['baseline']['dealt']}"
      f"  Verlust {out['baseline']['loss_rate']:.1%}"
      f"  Wipe {out['baseline']['wipe_rate']:.2%}")
print(f"{'id':>4} {'Titel':24} {'single':6} {'r':>1} {'score':>7} {'D':>7}")
for r_ in rows:
    print(f"{r_['id']:>4} {r_['title'][:24]:24} "
          f"{str(r_['single'])[:6]:6} {r_['rarity']:>1} "
          f"{r_['score']:7.2f} {r_['delta']:+7.2f}"
          + (f"  (als r3 {r_['delta_alt'][0]:+.2f} / r4 {r_['delta_alt'][1]:+.2f})"
             if r_['delta_alt'] else ''))
