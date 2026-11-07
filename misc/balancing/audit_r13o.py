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
CKPT_F = os.path.join(HERE, 'audit_r13o_ckpt_fleet.json')
CKPT_D = os.path.join(HERE, 'audit_r13o_ckpt_duel.json')

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
    # ================= UEBER-Waffen (9) =================
    # 344 Fokuslaser r1 +2,21 (units 0,7)
    ('A', '344', dict(socket=1.0)),
    ('B', '344', dict(socket=1.0, abz={'shield': 3})),
    ('C', '344', dict(socket=1.0, dmg=3)),
    # 136 Plasmatorpedos r2 +2,13 (dmg 10/pd 5, Klassenregel)
    ('A', '136', dict(dmg=8, abz={'pd': 4})),
    ('B', '136', dict(dmg=7, abz={'pd': 4})),
    ('C', '136', dict(e=1, dmg=12, abz={'pd': 6})),
    ('D', '136', dict(dmg=9)),
    # 179 Pulskanone r1 +2,12 (units 0,7)
    ('A', '179', dict(socket=1.0)),
    ('B', '179', dict(socket=1.0, abz={'armour': 3})),
    ('C', '179', dict(socket=1.0, dmg=3)),
    # 127 Protontorpedos r3 +1,99 (dmg 14/pd 6/SAbz 10)
    ('A', '127', dict(dmg=11, abz={'pd': 5})),
    ('B', '127', dict(dmg=12, abz={'pd': 6})),
    ('C', '127', dict(dmg=13, abz={'pd': 6})),
    ('D', '127', dict(e=1, dmg=16, abz={'pd': 8})),
    # 207 Materiedesintegrator r4 +1,66 (units 0,7, dmg 3)
    ('A', '207', dict(socket=1.0)),
    ('B', '207', dict(socket=1.0, abz={'armour': 3})),
    ('C', '207', dict(socket=1.0, dmg=2)),
    # 555 Penetrator-Torpedos r1 +1,42 (dmg 8/pd 2 — Klassenregel-Verletzung)
    ('A', '555', dict(dmg=7, abz={'pd': 4})),
    ('B', '555', dict(dmg=6, abz={'pd': 3})),
    ('C', '555', dict(dmg=7, abz={'pd': 3})),
    # 347 Impulslaser r1 +1,40 (dmg 5/SAbz X/pa 3)
    ('A', '347', dict(dmg=4)),
    ('B', '347', dict(dmg=3)),
    ('C', '347', dict(dmg=4, abz={'armour': 4})),
    # 554 Pegasus-Torpedos r1 +1,29 (dmg 9/pd 4, Regel 4,5)
    ('A', '554', dict(dmg=8, abz={'pd': 4})),
    ('B', '554', dict(dmg=7, abz={'pd': 4})),
    ('C', '554', dict(dmg=8, abz={'pd': 5})),
    # 166 Laserkanone r1 +1,12 (units 0,7, dmg 3)
    ('A', '166', dict(socket=1.0)),
    ('B', '166', dict(dmg=2)),
    ('C', '166', dict(socket=1.0, dmg=2)),
    # ================= UNTER-Waffen (15) =================
    # 401 Guillotine r5 -3,02 (dmg 30/E 3, units 4,1)
    ('A', '401', dict(e=2)),
    ('B', '401', dict(e=1)),
    ('C', '401', dict(e=2, dmg=32)),
    ('D', '401', dict(e=1, dmg=34)),
    # 106 Tachyonlanze r5 -2,78 (dmg 11/E 4, units 4,8)
    ('A', '106', dict(e=3)),
    ('B', '106', dict(e=2)),
    ('C', '106', dict(e=3, dmg=12)),
    ('D', '106', dict(e=2, dmg=13)),
    # 234 Punktabwehrlaser r1 -2,58 (dmg 3, range 1, SAbz X)
    ('A', '234', dict(dmg=4)),
    ('B', '234', dict(dmg=5)),
    ('C', '234', dict(dmg=4, range=2)),
    ('D', '234', dict(range=2)),
    # 168 Automatikkanone r1 -2,28 (dmg 3, range 1, pa X)
    ('A', '168', dict(dmg=5)),
    ('B', '168', dict(dmg=6)),
    ('C', '168', dict(dmg=4, range=2)),
    ('D', '168', dict(range=2)),
    # 339 Gatling r1 -2,28 (dmg 3, range 1, pa X)
    ('A', '339', dict(dmg=5)),
    ('B', '339', dict(dmg=6)),
    ('C', '339', dict(dmg=4, range=2)),
    ('D', '339', dict(range=2)),
    # 340 Abfangraketenwerfer r1 -2,00 (dmg 7/pd 3/pa 3, range 1)
    ('A', '340', dict(dmg=10)),
    ('B', '340', dict(dmg=12)),
    ('C', '340', dict(dmg=14)),
    ('D', '340', dict(dmg=9, range=2)),
    # 441 Flechette-Werfer r1 -1,59 (dmg 4, range 1, pa X)
    ('A', '441', dict(dmg=6)),
    ('B', '441', dict(dmg=5)),
    ('C', '441', dict(dmg=5, range=2)),
    # 181 Flugabwehrkanone r1 -1,55 (dmg 4, range 1, pa 4)
    ('A', '181', dict(dmg=6)),
    ('B', '181', dict(dmg=5)),
    ('C', '181', dict(dmg=5, range=2)),
    # 318 Nova-Torpedos r3 -1,51 (dmg 14/pd 7, Killer)
    ('A', '318', dict(dmg=16, abz={'pd': 8})),
    ('B', '318', dict(dmg=17, abz={'pd': 8})),
    ('C', '318', dict(dmg=18, abz={'pd': 9})),
    # 424 Sturmgeschuetz r2 -1,50 (dmg 12/E 1/pa 5, range 1)
    ('A', '424', dict(dmg=14)),
    ('B', '424', dict(dmg=15)),
    ('C', '424', dict(dmg=16)),
    ('D', '424', dict(dmg=14, abz={'armour': 4})),
    # 420 Donnerkanone r2 -1,21 (dmg 13/E 1/pa 5, range 1)
    ('A', '420', dict(dmg=14)),
    ('B', '420', dict(dmg=15)),
    ('C', '420', dict(dmg=16)),
    ('D', '420', dict(dmg=15, abz={'armour': 4})),
    # 440 Impulskanone r1 -1,13 (dmg 2/SAbz X/pa 2, range 2)
    ('A', '440', dict(dmg=3)),
    ('B', '440', dict(dmg=3, abz={'armour': 1})),
    ('C', '440', dict(dmg=4)),
    # 224 Bergbaulaser r2 -1,07 (dmg 8/SAbz 8 = X gegen Schild, Killer)
    ('A', '224', dict(abz={'shield': 4})),
    ('B', '224', dict(dmg=10)),
    ('C', '224', dict(dmg=10, abz={'shield': 4})),
    ('D', '224', dict(dmg=10, abz={'shield': 5})),
    # 125 Plasmakanone r3 -1,07 (dmg 17/SAbz 7, range 1)
    ('A', '125', dict(dmg=19)),
    ('B', '125', dict(dmg=20)),
    ('C', '125', dict(dmg=18)),
    ('D', '125', dict(dmg=19, abz={'shield': 6})),
    # 237 Mini-Railgun r1 -1,06 (dmg 1, range 3, pa X)
    ('A', '237', dict(socket=0.5)),
    ('B', '237', dict(dmg=2)),
    ('C', '237', dict(dmg=2, socket=1.0)),
    ('D', '237', dict(dmg=2, socket=0.5)),
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
          open(os.path.join(HERE, 'audit_r13o.json'), 'w', encoding='utf-8'),
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
