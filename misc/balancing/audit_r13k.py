#!/usr/bin/env python3
"""audit_r13k: Nerf-/Kosten-Paket fuer die 19 Ueber-Waffen gegen Zielkurve
v17 (Christophers Beschluesse Runde 13j Fortsetzung, 4.11.2026):
Kurve 7,8/8,0/8,4/9,0/9,8, Abweichler-Grenzwert |D| > 1,0, zunaechst nur
die Ueber-Waffen, T1-Tausch (151<->127) ZURUECKGENOMMEN (151 bleibt r2,
127 bleibt r3). ALLE Varianten sind wspec-Kopien auf FINAL-Basis — nichts
wird in-place gepatcht, kein Wert ist beschlossen; N=10k, Common Random
Numbers, seed 42 wie Kalibrierung.

Darstellungsregel (Christopher, 4.11.2026): Jede Vergleichstabelle zeigt
je Waffe die URSPRUENGLICHEN Werte (cards.csv, ungetunt), die FINAL-Werte
(Stand der Beschluesse Runden 1-3) und den VORSCHLAG (Varianten-Werte).

Systematik: Singles/Torpedos erhalten als Standard-Hebel Energie +1
(Kostenhebel statt Wirkungsreduktion; pd = dmg/2 bleibt gewahrt, soweit
nicht explizit angepasst). Bei 555/216 wird die Torpedo-Klassenregel
pd = dmg/2 mit auf den Zielwert gezogen. 344/179 (units 0,7, X-Switch)
erhalten drei Hebel-Optionen: Sockelkosten normal (0,7->1,0), E +1,
Reichweite -1.

Aufruf: python3 audit_r13k.py [N]   (Default 10000)
Ergebnis: audit_r13k.json + stdout-Tabelle
"""
import csv
import json
import os
import random
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import balancing_metric_v10 as v10
import balancing_metric_v11 as v11
import balancing_metric_v9 as v9

HERE = os.path.dirname(os.path.abspath(__file__))
N = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
TAKE_WEIGHT = 1.0
T = dict(v11.TARGETS_V14)     # Zielkurve v17: 7,8/8,0/8,4/9,0/9,8

# --- Urspruengliche Werte aus cards.csv (Darstellungsregel 13k) ---
CSVP = os.path.join(HERE, 'cards.csv')
if not os.path.exists(CSVP):
    CSVP = os.path.join(HERE, '..', 'cards.csv')   # im Repo: misc/balancing/


def _val(x):
    x = (x or '').strip()
    if not x:
        return None
    if x.upper() == 'X':
        return 'X'
    try:
        return abs(int(x))
    except ValueError:
        return x


ORIG = {}
with open(CSVP, encoding='utf-8') as f:
    for row in csv.DictReader(f, delimiter=';', quotechar='"'):
        ORIG[row['id']] = dict(dmg=_val(row.get('damage')),
                               e=_val(row.get('energy')),
                               pd=_val(row.get('damage_abm')),
                               sa=_val(row.get('damage_shield')),
                               pa=_val(row.get('damage_armour')))

byid = {w['id']: w for w in v11.weapons}
UP = ['412', '136', '127', '207', '344', '179', '554', '555', '216',
      '101', '304', '209', '167', '422', '166', '151', '438', '180', '223']


def apply(w, ch):
    if 'dmg' in ch:
        w['damage'] = ch['dmg']
    if 'e' in ch:
        w['energy'] = ch['e']
    if 'range' in ch:
        w['range'] = ch['range']
    if 'socket' in ch:
        w['socket_cost'] = ch['socket']
    if 'abz' in ch:
        w['abz'].update(ch['abz'])
    w['fire_phase'] = min(w['range'], 4)
    w['r1_col'] = v10.colony_r1(w)


def variant(wid, **ch):
    w = dict(byid[wid])
    w['abz'] = dict(w['abz'])
    apply(w, ch)
    return w


# --- Messliste: A = Erst-Vorschlag, B/C = Alternativen ---
SPEC = [
    # Torpedo-/Single-Block (E+1-Systematik, Klassenregel pd=dmg/2)
    ('A', '412', dict(e=1)),                                  # E 0->1
    ('B', '412', dict(e=1, dmg=10, abz={'pd': 5})),          # + dmg-Anhebung
    ('A', '136', dict(e=1)),
    ('B', '136', dict(e=1, dmg=11)),
    ('A', '127', dict(e=1, abz={'pd': 7})),                   # + Klassenregel
    ('B', '127', dict(e=1, dmg=12)),                          # 12/6 = Regel
    ('C', '127', dict(e=1)),
    ('A', '207', dict(e=1)),
    ('B', '207', dict(e=1, dmg=4)),                           # falls zu tief
    ('A', '554', dict(e=1)),
    ('B', '554', dict(e=1, dmg=10, abz={'pd': 5})),           # 10/5 = Regel
    ('A', '555', dict(e=1, abz={'pd': 4})),                   # Klassenregel
    ('B', '555', dict(dmg=7, abz={'pd': 4})),                 # ohne E
    ('C', '555', dict(e=1)),
    ('A', '216', dict(e=1, abz={'pd': 4})),                   # Klassenregel
    ('B', '216', dict(dmg=7, abz={'pd': 4})),
    ('C', '216', dict(e=1)),
    ('A', '101', dict(e=2)),                                  # E 1->2
    ('B', '101', dict(e=2, dmg=30, abz={'pd': 15})),
    ('A', '304', dict(e=2)),
    ('A', '167', dict(e=1, dmg=8, abz={'pd': 4})),
    ('B', '167', dict(dmg=8, abz={'pd': 4})),                 # ohne E
    ('C', '167', dict(e=1)),
    ('A', '422', dict(e=1, dmg=6, abz={'pd': 3})),
    ('B', '422', dict(dmg=6, abz={'pd': 3})),                 # ohne E
    # multi-Waffen (dmg-Hebel; 209 mit T2-Plan r4->r5 gegen beide Kurven)
    ('A', '209', dict(dmg=3)),
    ('B', '209', dict(dmg=3, e=1)),
    ('A', '166', dict(dmg=2)),
    ('B', '166', dict(e=1)),
    ('A', '151', dict(dmg=3)),
    ('A', '438', dict(dmg=2)),
    ('A', '180', dict(dmg=1)),
    ('A', '223', dict(dmg=3)),
    # 344/179: drei Hebel-Optionen (units 0,7, X-Switch)
    ('A', '344', dict(socket=1.0)),                           # Sockel normal
    ('B', '344', dict(e=1)),
    ('C', '344', dict(range=2)),
    ('A', '179', dict(socket=1.0)),
    ('B', '179', dict(e=1)),
    ('C', '179', dict(range=2)),
    # --- Feinvarianten (2. Durchgang): Abzugshebel statt grober dmg-
    #     Stufen, wo der Grenzwert 1,0 zwischen zwei dmg-Werten liegt ---
    ('D', '127', dict(e=1, dmg=16, abz={'pd': 8})),           # 16/8 = Regel
    ('E', '127', dict(dmg=10, abz={'pd': 5})),                # ohne E
    ('D', '554', dict(e=1, dmg=12, abz={'pd': 6})),           # 12/6 = Regel
    ('D', '216', dict(abz={'pd': 4})),                        # nur Klassenregel
    ('D', '422', dict(dmg=7, abz={'pd': 3})),                # ohne E
    ('D', '166', dict(dmg=2, abz={'shield': 3})),             # X-Revert (CSV)
    ('D', '151', dict(dmg=3, abz={'armour': 2})),
    ('E', '151', dict(dmg=3, abz={'armour': 3})),
    ('D', '438', dict(dmg=2, abz={'shield': 2})),
    ('E', '438', dict(dmg=3, abz={'shield': 0})),
    ('D', '180', dict(dmg=2, abz={'armour': 1})),
    ('D', '223', dict(dmg=3, abz={'armour': 1})),
    ('E', '223', dict(dmg=4, abz={'armour': 0})),
    # --- 3. Durchgang: letzte Feinvarianten fuer Grenzfaelle ---
    ('F', '127', dict(e=1, dmg=16, abz={'pd': 7})),           # pd -1 (staerker)
    ('E', '216', dict(dmg=7, abz={'pd': 3})),                 # 7/3 gerundet
    ('F', '180', dict(dmg=2, abz={'armour': 3})),             # Pz-Abzug +1
    ('F', '438', dict(dmg=2, abz={'shield': 0})),            # ohne S-Abzug
]
specs = [(lbl, wid, variant(wid, **ch)) for lbl, wid, ch in SPEC]

old = {r['id']: r for r in json.load(
    open(os.path.join(HERE, 'frame_calibration.json'), encoding='utf-8'))
    ['weapons'] if 'id' in r}

acc = {(lbl, wid): dict(out=0.0, take=0.0, col=0.0, loot=0.0)
       for lbl, wid, _ in specs}

cpools = [(cs, p) for cs, p in v9.COLONY]
cptot = sum(p for _, p in cpools)

random.seed(42)
t0 = time.time()
for b in range(N):
    w, att, deff, raid = v11.draw_battle()
    pool_cards, _ = v11.pools[random.choices(
        range(len(v11.pools)), weights=v11.pprob)[0]]
    colpool = None
    if raid:
        colpool = cpools[random.choices(
            range(len(cpools)), weights=[p / cptot for _, p in cpools])[0]][0]
    fire = [[[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
             for _ in range(3)] for _ in (0, 1)]
    wspec_fire = [[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
                  for _ in range(3)]
    order = (0, 1) if b % 2 == 0 else (1, 0)
    take0, dealt0, dead0, _, col0, eq0, loot0 = v11.battle(
        w, att, deff, pool_cards, fire, order, raid=raid, colpool=colpool)
    base = dict(out=dealt0, take=-TAKE_WEIGHT * take0, col=-col0, loot=loot0)
    for lbl, wid, sp in specs:
        t1, d1, dd0, _, c1, e1, l1 = v11.battle(
            w, att, deff, pool_cards, fire, order, raid=raid,
            wspec=sp, wspec_fire=wspec_fire, colpool=colpool)
        for k, v in dict(out=d1, take=-TAKE_WEIGHT * t1, col=-c1,
                         loot=l1).items():
            acc[(lbl, wid)][k] += v - base[k]
    if (b + 1) % 2000 == 0:
        print(f'  {b + 1}/{N} Gefechte ({time.time() - t0:.0f}s)', flush=True)


def wvals(w):
    a = w['abz']
    return dict(dmg=w['damage'], e=w['energy'],
                pd=a.get('pd'), sa=a.get('shield'), pa=a.get('armour'),
                rng=w['range'], units=round(v11.weapon_units(w), 2))


rows = []
for lbl, wid, sp in specs:
    a = acc[(lbl, wid)]
    units = v11.weapon_units(sp)
    gain = sum(a.values()) / N / 3
    score = gain / units
    r = sp['rarity']
    o = old.get(wid, {})
    fo = byid[wid]
    rows.append(dict(
        label=lbl, id=wid, title=sp['title'], rarity=r,
        orig=ORIG.get(wid), final=wvals(fo), prop=wvals(sp),
        gain=round(gain, 3), units=round(units, 2),
        score=round(score, 3), delta=round(score - T[r], 2),
        final_score=o.get('score'),
        final_delta=(round(o['score'] - T[r], 2) if o.get('score') else None),
        delta_t2=(round(score - T[5], 2) if wid in ('209', '151', '203')
                  else None)))

rows.sort(key=lambda x: (UP.index(x['id']), x['label']))
with open(os.path.join(HERE, 'audit_r13k.json'), 'w', encoding='utf-8') as f:
    json.dump(rows, f, ensure_ascii=False, indent=1)


def _sv(x):
    return '-' if x is None else str(x)


def fmt(d):
    if not d:
        return '                '
    return (f"d{_sv(d['dmg']):>2} E{_sv(d['e']):>2} pd{_sv(d['pd']):>3} "
            f"S{_sv(d['sa']):>2} P{_sv(d['pa']):>2}")


print(f"\n13k-Varianten der {len(UP)} Ueber-Waffen (N={N}, CRN, FINAL-Basis)")
print(f"{'Var':3} {'id':>4} {'Titel':22} "
      f"{'URSPRUENGLICH':16} {'FINAL (getunt)':16} {'VORSCHLAG':16} "
      f"{'units':>5} {'score':>6} {'Dv17':>6} {'FINAL-D':>7}")
for r in rows:
    print(f"{r['label']:3} {r['id']:>4} {r['title'][:22]:22} "
          f"{fmt(r['orig']):16} {fmt(r['final']):16} {fmt(r['prop']):16} "
          f"{r['units']:5.2f} {r['score']:6.2f} {r['delta']:+6.2f} "
          f"{r['final_delta']:+7.2f}")
print(f'\nZielkurve v17: {T} | Grenzwert |D| > 1,0')
print('T2-Plan (209->r5): delta gegen r5 9,8 s. delta_t2 in audit_r13k.json')
