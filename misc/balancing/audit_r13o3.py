#!/usr/bin/env python3
"""audit_r13o: Frische Varianten-Runde gegen Zielkurve v18 (Christophers
Beschluesse Runde 13n, 4.11.2026): 13k-Paket VERWORFEN (frame-relativ),
gemeinsame Runde fuer ALLE 24 Outlier gegen v18 = 4,7/5,0/5,8/6,6/7,4 —
9 Ueber-Waffen (344/136/179/127/207/555/347/554/166) und 15 Unter-Waffen
(401/106/234/168/339/340/441/181/318/424/420/440/224/125/237).

Gesamt-Frame (check10): Flottenkampf (draw_battle 3+3, gepaart CRN ueber
alle Varianten) + 1v1-Spiegelduell (je Variante eigener seed-42-Strom,
Trager nach Sockel-Kompatibilitaet), je Frame Rollenmittel (Verteidiger +
Raid-Angreifer inkl. Kolonie-Logik), Score = 50/50 Frame-Mittel,
gain/N/3 bzw. /1, geteilt durch units der VARIANTE (E/Sockel-Aenderungen
verschieben die Einsatzkosten). N=10k je Messung, CRN seed 42.

ALLES Varianten sind wspec-Kopien auf FINAL-Basis — nichts in-place
gepatcht, kein Wert beschlossen. Dreispalten-Darstellungsregel:
URSPRUENGLICH (cards.csv) -> FINAL -> VORSCHLAG (Variante).

Varianten-Systematik:
- Ueber-Waffen: Sockel normal (sc 0,7->1,0) fuer die Billig-Sockel
  (344/179/166/207), dmg-/pd-Stufen (Torpedos mit Klassenregel pd=dmg/2,
  Praezedenz "ok gerundet"), Abzugs-Schaerfung, E+1 als Kostenhebel.
- Unter-Waffen: dmg-Stufen, E-Senkung (Energiefresser 401/106), Reichweite
  +1 (Dauerfeuer r1 — Range ist im sauberen Frame ein starker Hebel,
  13j), Sockel 0,5 (237), SAbz-Senkung (224: SAbz 8 = X-wirkungslos).

Aufruf: python3 audit_r13o.py [N]   (Default 10000, Fortsetzung via
checkpoints moeglich)
Ergebnis: audit_r13o.json + stdout-Dreispalte
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
T = dict(v11.TARGETS_V14)     # v18: 4,7/5,0/5,8/6,6/7,4
CKPT_F = os.path.join(HERE, 'audit_r13o3_ckpt_fleet.json')
CKPT_D = os.path.join(HERE, 'audit_r13o3_ckpt_duel.json')

CSVP = os.path.join(HERE, 'cards.csv')
if not os.path.exists(CSVP):
    CSVP = os.path.join(HERE, '..', 'cards.csv')


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
                               rng=_val(row.get('range')),
                               pd=_val(row.get('damage_abm')),
                               sa=_val(row.get('damage_shield')),
                               pa=_val(row.get('damage_armour')),
                               sc=_val(row.get('socket_cost')))

byid = {w['id']: w for w in v11.weapons}


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


# --- Messliste: (Label, Waffen-ID, Aenderungen) ---
SPEC = [
    ('I', '401', dict(e=1, dmg=32)),
    ('J', '401', dict(e=1, dmg=33)),
    ('K', '401', dict(e=2, dmg=38)),
]
specs = [(lbl, wid, variant(wid, **ch)) for lbl, wid, ch in SPEC]

cpools = [(cs, p) for cs, p in v9.COLONY]
cptot = sum(p for _, p in cpools)


def acc_side(r, side):
    if side == 0:
        return dict(out=r['dealt0'], take=-TAKE_WEIGHT * r['taken0'],
                    col=-r['colony'], loot=r['loot0'])
    return dict(out=r['dealt1'], take=-TAKE_WEIGHT * r['taken1'],
                col=+r['colony'], loot=r['loot1'])


def total(a):
    return a['out'] + a['take'] + a['col'] + a['loot']


# ============ Frame A: Flotte (gepaart CRN, Rollenmittel) ============
def run_fleet():
    acc = {(lbl, wid): [dict(out=0.0, take=0.0, col=0.0, loot=0.0)
                        for _ in (0, 1)] for lbl, wid, _ in specs}
    start = 0
    random.seed(42)
    if os.path.exists(CKPT_F):
        ck = json.load(open(CKPT_F, encoding='utf-8'))
        start = ck['iter']
        acc = {tuple(k.split('|')): v for k, v in ck['acc'].items()}
        random.setstate((3, tuple(ck['rng']), None))
        print(f'Resume Flotte bei {start}/{N}')
    t0 = time.time()
    for b in range(start, N):
        w, att, deff, raid = v11.draw_battle()
        pool_cards, _ = v11.pools[random.choices(
            range(len(v11.pools)), weights=v11.pprob)[0]]
        colpool = None
        if raid:
            colpool = cpools[random.choices(
                range(len(cpools)),
                weights=[p / cptot for _, p in cpools])[0]][0]
        fire = [[[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
                 for _ in range(3)] for _ in (0, 1)]
        wspec_fire = [[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
                      for _ in range(3)]
        order = (0, 1) if b % 2 == 0 else (1, 0)
        r = v11.battle(w, att, deff, pool_cards, fire, order, raid=raid,
                       colpool=colpool, ret='full')
        a0, a1 = acc_side(r, 0), acc_side(r, 1)
        for i, (lbl, wid, sp) in enumerate(specs):
            r0 = v11.battle(w, att, deff, pool_cards, fire, order, raid=raid,
                            wspec=sp, wspec_fire=wspec_fire, colpool=colpool,
                            wspec_side=0, ret='full')
            m = acc_side(r0, 0)
            for k in m:
                acc[(lbl, wid)][0][k] += m[k] - a0[k]
            r1 = v11.battle(w, att, deff, pool_cards, fire, order, raid=raid,
                            wspec=sp, wspec_fire=wspec_fire, colpool=colpool,
                            wspec_side=1, ret='full')
            m = acc_side(r1, 1)
            for k in m:
                acc[(lbl, wid)][1][k] += m[k] - a1[k]
        if (b + 1) % 500 == 0 or b + 1 == N:
            state = random.getstate()
            json.dump(dict(iter=b + 1,
                           acc={f'{k[0]}|{k[1]}': v for k, v in acc.items()},
                           rng=list(state[1])),
                      open(CKPT_F, 'w', encoding='utf-8'))
            print(f'  Flotte {b + 1}/{N} ({time.time() - t0:.0f}s)', flush=True)
    return acc


# ============ Frame B: Duell (je Variante eigener Strom) ============
def draw_duel_build(spec):
    cands, weights = [], []
    for b in v11.ALL_BUILDS:
        if b['s'] < 1 or not v11.compatible(spec, b):
            continue
        cands.append(b)
        weights.append(v11.TYPE_BEST[(b['parts'], b['type'])] * b['w'])
    return random.choices(cands, weights=weights)[0]


def duel_one(sp, n):
    random.seed(42)
    acc = [dict(out=0.0, take=0.0, col=0.0, loot=0.0) for _ in (0, 1)]
    ws = v11.weapons
    for i in range(n):
        b = draw_duel_build(sp)
        while True:
            w2 = ws[random.choices(v11.widx, weights=v11.wweights)[0]]
            if v11.compatible(w2, b):
                break
        raid = random.random() < 0.5
        colpool = None
        if raid:
            colpool = cpools[random.choices(
                range(len(cpools)),
                weights=[p / cptot for _, p in cpools])[0]][0]
        pool_cards, _ = v11.pools[random.choices(
            range(len(v11.pools)), weights=v11.pprob)[0]]
        fire = [[[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]]
                for _ in (0, 1)]
        wf = [[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]]
        order = (0, 1) if i % 2 == 0 else (1, 0)
        kw = dict(wspec=sp, wspec_fire=wf)
        r = v11.battle(w2, [b], [b], pool_cards, fire, order, raid=raid,
                       colpool=colpool, ret='full')
        a0, a1 = acc_side(r, 0), acc_side(r, 1)
        r0 = v11.battle(w2, [b], [b], pool_cards, fire, order, raid=raid,
                        colpool=colpool, wspec_side=0, ret='full', **kw)
        r1 = v11.battle(w2, [b], [b], pool_cards, fire, order, raid=raid,
                        colpool=colpool, wspec_side=1, ret='full', **kw)
        for k in a0:
            acc[0][k] += acc_side(r0, 0)[k] - a0[k]
            acc[1][k] += acc_side(r1, 1)[k] - a1[k]
    return acc


def run_duel(n):
    done = {}
    if os.path.exists(CKPT_D):
        done = json.load(open(CKPT_D, encoding='utf-8'))
    t0 = time.time()
    for idx, (lbl, wid, sp) in enumerate(specs):
        key = f'{lbl}|{wid}'
        if key in done:
            continue
        done[key] = duel_one(sp, n)
        json.dump(done, open(CKPT_D, 'w', encoding='utf-8'))
        print(f'  Duell {idx + 1}/{len(specs)}: {key} '
              f'({time.time() - t0:.0f}s)', flush=True)
    return done


accF = run_fleet()
accD = run_duel(N)

# ============ Auswertung ============
rows = []
for lbl, wid, sp in specs:
    units = v11.weapon_units(sp)
    rar = byid[wid]['rarity']
    f0 = total(accF[(lbl, wid)][0]) / N / 3
    f1 = total(accF[(lbl, wid)][1]) / N / 3
    d0 = total(accD[f'{lbl}|{wid}'][0]) / N / 1
    d1 = total(accD[f'{lbl}|{wid}'][1]) / N / 1
    fm, dm = (f0 + f1) / 2 / units, (d0 + d1) / 2 / units
    k = (fm + dm) / 2
    rows.append(dict(label=lbl, id=wid, title=byid[wid]['title'], rarity=rar,
                     orig=ORIG.get(wid), final=dict(
                         dmg=byid[wid]['damage'], e=byid[wid]['energy'],
                         rng=byid[wid]['range'],
                         pd=byid[wid]['abz'].get('pd'),
                         sa=byid[wid]['abz'].get('shield'),
                         pa=byid[wid]['abz'].get('armour'),
                         sc=byid[wid]['socket_cost']),
                     units=round(units, 2),
                     fleet=round(fm, 2), duel=round(dm, 2),
                     score=round(k, 2),
                     delta=round(k - T[rar], 2),
                     final_score=next(x['score'] for x in json.load(
                         open(os.path.join(HERE, 'frame_calibration.json'),
                              encoding='utf-8'))['weapons']
                         if x['id'] == wid)))

json.dump(dict(n=N, targets_v18=T, rows=rows),
          open(os.path.join(HERE, 'audit_r13o3.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)

print(f'\n=== Runde 13o: Varianten gegen v18 {T} (N={N}, '
      f'Gesamt-Frame Flotte+Duell, Rollenmittel) ===')
cur = None
for r in rows:
    if r['id'] != cur:
        cur = r['id']
        o, fi = r['orig'], r['final']
        print(f"\n{r['id']} r{r['rarity']} {r['title']} | FINAL-Score "
              f"{r['final_score']:.2f}, Ziel v18 {T[r['rarity']]:.1f}")
        print(f"  ORIG: dmg {o['dmg']} E {o['e']} range {o['rng']} "
              f"pd {o['pd']} SAbz {o['sa']} PzAbz {o['pa']} Sockel {o['sc']}")
        print(f"  FINAL: dmg {fi['dmg']} E {fi['e']} range {fi['rng']} "
              f"pd {fi['pd']} SAbz {fi['sa']} PzAbz {fi['pa']} Sockel {fi['sc']}")
    sp = next(x for x in specs if x[0] == r['label'] and x[1] == cur)
    ch = SPEC[[i for i, s in enumerate(SPEC)
               if s[0] == r['label'] and s[1] == cur][0]][2]
    print(f"  {r['label']}: {ch} -> {r['score']:.2f} "
          f"(D {r['delta']:+.2f}, Fl {r['fleet']:.2f}/Du {r['duel']:.2f}, "
          f"units {r['units']})")
