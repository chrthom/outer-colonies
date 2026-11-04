#!/usr/bin/env python3
"""audit_r13i: Frame-Probe '2 Waffen auf grossen Schiffen' (Runde 13i, 4.11.2026).

Christophers Befund: Gefechte sind unrealistisch, weil jedes Schiff nur
EINE Waffe feuert. Vorschlag (einfache Variante): 2- und 3-teilige Schiffe
tragen IMMER 2 Waffen, 1-teilige 1. Umgesetzt als battle2w (Kopie von
v11.battle mit Instanz-Loop je Schiff): Gefechtswaffe UND bewertete Waffe
(wspec) feuern n_inst-mal je Feuermuenze; 2 Schuesse a dmg sind dabei NICHT
1 Schuss a 2xdmg (Abzuege/Deaktivierung wirken je Schuss).

Messung (CRN, seed 42, N=10k, FINAL-Waffen ohne 13g-Paket — Frame-Frage
isoliert): Baseline-Kennzahlen, alle 50 Waffen (Mediane je Rarity),
alle 19 Statkarten (Scores + hp-Auslastung fuer die 1:1-HP-Diskussion),
Spearman alt (frame_calibration/defense_v11) vs. neu.

Aufruf: python3 audit_r13i_frame2w.py [N]   (Default 10000)
"""
import json
import os
import random
import statistics
import sys
import time

import balancing_metric_v10 as v10
import balancing_metric_v11 as v11
import balancing_metric_v9 as v9

HERE = os.path.dirname(os.path.abspath(__file__))
N = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
TAKE_WEIGHT = 1.0
T = {0: 2.0, 1: 2.3, 2: 2.5, 3: 2.8, 4: 3.1, 5: 3.4}

PHASES = v11.PHASES
compatible = v11.compatible
CTRL_W = v11.CTRL_W
COLONY_HP = v11.COLONY_HP
weapon_units = v11.weapon_units


def n_inst_of(b):
    """Christophers einfache Regel: 1-teilig 1 Waffe, 2-/3-teilig 2 Waffen."""
    return 1 if b['parts'] == 1 else 2


def battle2w(w, att, deff, pool_cards, fire, order, spec=None, ship=None,
             raid=False, spread=False, wspec=None, wspec_fire=None,
             colpool=None):
    """Kopie von v11.battle mit Waffen-Instanzen je Schiff (Runde 13i)."""
    colony = 0.0
    fleet = []
    fleet_pd = {}
    for side, builds in ((0, deff), (1, att)):
        ships = []
        side_pd = []
        for i, b in enumerate(builds):
            cpool = [dict(c) for c in pool_cards]
            s_bonus = 0
            ship_hp = b['hp']
            if side == 0 and spec is not None and (ship is None or i == ship):
                bad = (spec['cond'] == 'no_shield'
                       and any(c['type'] == 'shield' for c in cpool)) or \
                      (spec['cond'] == 'need_shield'
                       and not any(c['type'] == 'shield' for c in cpool))
                if not bad:
                    ship_hp += spec['hp']
                    s_bonus = spec['speed']
                    for c in spec['added']:
                        if c['type'] == 'pd':
                            side_pd.append((dict(c), i))
                        else:
                            cpool.append(dict(c))
            pds = [(dict(c), i) for c in cpool if c['type'] == 'pd']
            side_pd.extend(pds)
            cards_nopd = [dict(c) for c in cpool if c['type'] != 'pd']
            ships.append(dict(cards=cards_nopd, taken=0.0, dead=False,
                              hp=ship_hp, s=b['s'] + s_bonus,
                              ctrl=b['ctrl'], n_inst=n_inst_of(b),
                              carrier=compatible(w, b)))
        fleet.append(ships)
        fleet_pd[side] = side_pd
    if not raid:
        s0min = min(sh['s'] for sh in fleet[0])
        kept = [(i, sh) for i, sh in enumerate(fleet[1]) if sh['s'] >= s0min]
        if not kept:
            own_c = sum(b['ctrl'] for b in deff)
            return 0.0, 0.0, 0, 0, 0.0, 0.0, CTRL_W * own_c
        remap = {old: new for new, (old, _) in enumerate(kept)}
        fleet[1] = [sh for _, sh in kept]
        fleet_pd[1] = [(c, remap[oi]) for c, oi in fleet_pd[1]
                       if oi in remap]
    dealt = [0.0, 0.0]
    for p in PHASES:
        for u in order:
            own, enemy = fleet[u], fleet[1 - u]
            e_pd = [(c, oi) for c, oi in fleet_pd[1 - u]
                    if not enemy[oi]['dead']]
            for i, sh in enumerate(own):
                if sh['dead'] or not sh['carrier']:
                    continue
                if w['single']:
                    if p != w['fire_phase'] or not fire[u][i][p - 1]:
                        continue
                elif p > w['range'] or not fire[u][i][p - 1]:
                    continue
                col_shot = False
                for _inst in range(sh['n_inst']):
                    if spread:
                        tgt_i = i if not enemy[i]['dead'] else next(
                            (j for j, e in enumerate(enemy) if not e['dead']),
                            None)
                    else:
                        tgt_i = next((j for j, e in enumerate(enemy)
                                      if not e['dead']), None)
                    if tgt_i is None:
                        break
                    tgt = enemy[tgt_i]
                    base = max(0, w['damage']
                               - (6 * tgt['s'] if w['id'] == '401' else 0))
                    halved = sh['s'] + p < tgt['s']
                    d = v9.half(base) if halved else base
                    if raid and u == 1 and p == 1 and w['r1_col'] > d:
                        if colpool is not None and colony < COLONY_HP:
                            cd = v9.resolve_attack(
                                w, [dict(c) for c in colpool], w['damage']) \
                                * (2 if w['colony_killer'] else 1)
                            colony = min(COLONY_HP, colony + cd)
                        col_shot = True
                        continue
                    pool = tgt['cards'] + [c for c, _ in e_pd]
                    dmg = v9.resolve_attack(w, pool, d)
                    tgt['taken'] += dmg
                    dealt[u] += dmg
                    if tgt['taken'] >= tgt['hp']:
                        tgt['dead'] = True
                if col_shot:
                    continue
                # bewertete Waffe (Kalibrierungs-Frame): auch n_inst Instanzen
                if u == 0 and wspec is not None and not sh['dead']:
                    ok = (p == wspec['fire_phase']) if wspec['single'] \
                        else (p <= wspec['range'])
                    if ok and wspec_fire[i][p - 1]:
                        for _inst in range(sh['n_inst']):
                            tgt_i = next((j for j, e in enumerate(enemy)
                                          if not e['dead']), None)
                            if tgt_i is None:
                                break
                            tgt = enemy[tgt_i]
                            base = max(0, wspec['damage']
                                       - (6 * tgt['s']
                                          if wspec['id'] == '401' else 0))
                            d = v9.half(base) if sh['s'] + p < tgt['s'] \
                                else base
                            pool = tgt['cards'] + [c for c, _ in e_pd]
                            dmg = v9.resolve_attack(wspec, pool, d)
                            tgt['taken'] += dmg
                            dealt[0] += dmg
                            if tgt['taken'] >= tgt['hp']:
                                tgt['dead'] = True
        for side in (0, 1):
            for sh in fleet[side]:
                if not sh['dead']:
                    for c in sh['cards']:
                        if c['recharge'] in ('phase', 'attack'):
                            c['used'] = False
            for c, oi in fleet_pd[side]:
                if not fleet[side][oi]['dead']:
                    if c['recharge'] in ('phase', 'attack'):
                        c['used'] = False
    dead = [sum(1 for s in fleet[u] if s['dead']) for u in (0, 1)]
    taken = sum(s['taken'] for s in fleet[0])
    eq = weapon_units(w) * sum(1 for sh in fleet[0]
                               if sh['dead'] and sh['carrier'])
    if raid:
        loot = 0.0
    else:
        own_c = sum(sh['ctrl'] for sh in fleet[0] if not sh['dead'])
        enemy_c = sum(sh['ctrl'] for sh in fleet[1] if not sh['dead'])
        loot = CTRL_W * max(0.0, own_c - enemy_c)
    return taken, dealt[0], dead[0], dead[1], colony, eq, loot


# --- Messung (Struktur wie check9, gleiche CRN) ---
ws = v11.weapons
old_w = {r['id']: r for r in json.load(
    open(os.path.join(HERE, 'frame_calibration.json'), encoding='utf-8'))
    ['weapons']}
old_c = {r['id']: r for r in json.load(
    open(os.path.join(HERE, 'defense_v11.json'), encoding='utf-8'))}
cards = v11.cards
cpools = [(cs, p) for cs, p in v9.COLONY]
cptot = sum(p for _, p in cpools)

acc_w = {w['id']: dict(out=0.0, take=0.0, col=0.0, loot=0.0) for w in ws}
acc_c = {c['id']: dict(out=0.0, take=0.0, col=0.0, loot=0.0) for c in cards}
take0s = dealt0s = col0s = loot0s = 0.0
losses = wipes0 = wipes1 = dead0s = dead1s = 0.0
n_mission = 0

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
    fire = [[[random.random() < v10.ATTACK_PROB[p] for p in PHASES]
             for _ in range(3)] for _ in (0, 1)]
    wspec_fire = [[random.random() < v10.ATTACK_PROB[p] for p in PHASES]
                  for _ in range(3)]
    order = (0, 1) if b % 2 == 0 else (1, 0)
    take0, dealt0, dead0, dead1, col0, eq0, loot0 = battle2w(
        w, att, deff, pool_cards, fire, order, raid=raid, colpool=colpool)
    take0s += take0
    dealt0s += dealt0
    col0s += col0
    losses += 1 if dead0 >= 1 else 0
    dead0s += dead0
    dead1s += dead1
    wipes0 += 1 if dead0 == 3 else 0
    wipes1 += 1 if dead1 == 3 else 0
    if not raid:
        loot0s += loot0
        n_mission += 1
    base = dict(out=dealt0, take=-TAKE_WEIGHT * take0, col=-col0, loot=loot0)
    for w2 in ws:
        t1, d1, dd0, _, c1, e1, l1 = battle2w(
            w, att, deff, pool_cards, fire, order, raid=raid,
            wspec=w2, wspec_fire=wspec_fire, colpool=colpool)
        for k, v in dict(out=d1, take=-TAKE_WEIGHT * t1, col=-c1,
                         loot=l1).items():
            acc_w[w2['id']][k] += v - base[k]
    for c in cards:
        ship = None  # SPEC_ALL3: Karte je Schiff
        t1, d1, dd0, _, c1, e1, l1 = battle2w(
            w, att, deff, pool_cards, fire, order,
            spec=c, ship=ship, raid=raid, colpool=colpool)
        for k, v in dict(out=d1, take=-TAKE_WEIGHT * t1, col=-c1,
                         loot=l1).items():
            acc_c[c['id']][k] += v - base[k]
    if (b + 1) % 2000 == 0:
        print(f'  {b + 1}/{N} Gefechte ({time.time() - t0:.0f}s)', flush=True)

print(f'2W-Baseline: taken {take0s / N:.2f} / dealt {dealt0s / N:.2f} / '
      f'col {col0s / N:.2f} / loot {loot0s / max(1, n_mission):.2f} / '
      f'Verlustrate {losses / N:.1%} / dead0 {dead0s / N:.2f} '
      f'dead1 {dead1s / N:.2f} / Wipes V {wipes0 / N:.1%} A {wipes1 / N:.1%}')


def score_of(acc, units, n=N):
    gain = sum(acc.values()) / n / 3
    return gain, gain / units


def spearman(a, b_):
    ra = {k: r for r, k in enumerate(sorted(a, key=a.get), 1)}
    rb = {k: r for r, k in enumerate(sorted(b_, key=b_.get), 1)}
    ks = list(ra)
    mx = sum(ra[k] for k in ks) / len(ks)
    my = sum(rb[k] for k in ks) / len(ks)
    cov = sum((ra[k] - mx) * (rb[k] - my) for k in ks)
    vx = sum((ra[k] - mx) ** 2 for k in ks) ** 0.5
    vy = sum((rb[k] - my) ** 2 for k in ks) ** 0.5
    return cov / (vx * vy)


rows_w = []
for w2 in ws:
    g, s = score_of(acc_w[w2['id']], weapon_units(w2))
    rows_w.append(dict(id=w2['id'], title=w2['title'], rarity=w2['rarity'],
                       units=round(weapon_units(w2), 2), gain=round(g, 3),
                       score=round(s, 3),
                       old_score=old_w[w2['id']]['score']))

med_w = {}
for r in (1, 2, 3, 4, 5):
    g = [x['score'] for x in rows_w if x['rarity'] == r]
    med_w[r] = round(statistics.median(g), 2)
    print(f'  Waffen-Median r{r}: {med_w[r]:.2f} '
          f'(v15 {T[r]:.1f}, alt {statistics.median([x["old_score"] for x in rows_w if x["rarity"] == r]):.2f})')
sw = spearman({x['id']: x['score'] for x in rows_w},
              {x['id']: x['old_score'] for x in rows_w})
print(f'Spearman Waffen 2W vs. Frame alt: {sw:+.2f}')

rows_c = []
for c in cards:
    g, s = score_of(acc_c[c['id']], c['units'])
    o = old_c[c['id']]
    rows_c.append(dict(id=c['id'], title=o['title'], rarity=o['rarity'],
                       units=c['units'], hp=c.get('hp', 0),
                       gain=round(g, 3), score=round(s, 3),
                       delta=round(s - T[o['rarity']], 2),
                       old_gain=round(o['gain'], 3),
                       old_score=round(o['score'], 3)))
med_c = {}
for r in (1, 2, 3, 4, 5):
    g = [x['score'] for x in rows_c if x['rarity'] == r]
    if g:
        med_c[r] = round(statistics.median(g), 2)
        print(f'  Karten-Median r{r}: {med_c[r]:.2f} (alt '
              f'{statistics.median([x["old_score"] for x in rows_c if x["rarity"] == r]):.2f})')
sc = spearman({x['id']: x['score'] for x in rows_c},
              {x['id']: x['old_score'] for x in rows_c})
print(f'Spearman Karten 2W vs. Frame alt: {sc:+.2f}')

print(f"\n{'id':>4} {'Titel':24} r  hp  gain_neu score_neu (gain_alt score_alt) "
      f"statisch 1:1_neu")
for x in sorted(rows_c, key=lambda r: (r['rarity'], r['id'])):
    s11 = (x['gain'] + x['hp']) / x['units'] if x['hp'] else x['score']
    mark = ' *' if x['hp'] else ''
    print(f"{x['id']:>4} {x['title'][:24]:24} {x['rarity']} {x['hp']:+} "
          f"{x['gain']:7.2f} {x['score']:8.2f}  ({x['old_gain']:6.2f} "
          f"{x['old_score']:5.2f}) {s11:9.2f}{mark}  d={x['delta']:+.2f}")

out = dict(n=N, baseline=dict(taken=round(take0s / N, 2),
                               dealt=round(dealt0s / N, 2),
                               loss_rate=round(losses / N, 3),
                               dead0=round(dead0s / N, 2),
                               dead1=round(dead1s / N, 2),
                               wipes0=round(wipes0 / N, 3),
                               wipes1=round(wipes1 / N, 3)),
           med_w=med_w, med_c=med_c, spearman_w=round(sw, 2),
           spearman_c=round(sc, 2), weapons=rows_w, cards=rows_c)
with open(os.path.join(HERE, 'audit_r13i.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print('\nErgebnis: audit_r13i.json')
