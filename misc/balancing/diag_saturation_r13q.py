#!/usr/bin/env python3
"""Saettigungs-Diagnose 13q (Christophers Beschluss 4.11.2026,
Vorbedingung fuer die Entscheidung Referenz-Bewaffnung vs. Effizienz-
Normierung vs. getrennte Karten-Kurve).

Frage: Wie viel der Waffe/Karte-Lcke (Karten-Mediane 3,12/0,82/0,67/
3,19/2,59 vs. Waffen 4,77/4,99/6,09/6,54/7,23) ist ein NACHFRAGE-
Artefakt (Defense-Karten koennen nur den eingehenden Schaden ~8-12
je Gefecht verhindern, Waffen haben ~60 HP Flotte + 50 Kolonie als
Nachfragepool)?

Messung (Flotten-Frame wie check10 run_fleet, Verteidigerrolle Seite 0,
gepaarte CRN je Karte eigener seed-42-Strom):

Teil 1 — Nachfrage-Verteilung (Baseline, N1=3000, seed 42):
  je Gefecht take0 bei M=1, M=2, M=3 (M = dmg_scale der Seite-1-
  Umgebungsbewaffnung) + HP-Pool der Seite-0-Flotte -> Prozentile,
  Auslastung des HP-Pools, Verlauf der Nachfrage selbst.

Teil 2 — Elastizitaet je Statkarte (19 Karten, N2=1000 je Karte,
seed 42 je Karte):
  je Gefecht: Basis-Gefecht ohne Karte bei M=1/2/3, Gefecht mit Karte
  (1x je Schiff, /3) bei M=1/2/3, Gefecht mit Karte n_inst-Platzierung
  (2 Kopien auf 3-teiligem Schiff, 4 Platzierungen, /4, Christophers
  13q-Beschluss) bei M=1/2.
  je Karte: verhinderter Schaden prevented(M), Wert-Gain gain(M) je
  Platzierung, Kanal-Zerlegung (dOut/dTake/dCol/dLoot), Elastizitaet
  gain(2)/gain(1) bzw. gain(3)/gain(2), Anteil Gefechte ohne
  Verhinderung, n_inst-Effekt je Kopie.

Interpretation:
  gain(M) ~ linear steigend -> Karten sind NACHFRAGE-limitiert
  (Normierung/Referenz-Bewaffnung gerechtfertigt);
  gain(M) flach -> Karten sind KAPAZITAETS-limitiert (Lcke echt,
  getrennte Kurve).

Aufruf: python3 diag_saturation_r13q.py [N2]  (Default 1000, resume-
faehig via diag_sat_ckpt_r13q.json)
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
N2 = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
N1 = 3000
MS = (1.0, 2.0, 3.0)
HP_STATIC = v11.HP_STATIC
CKPT = os.path.join(HERE, 'diag_sat_ckpt_r13q.json')
OUT = os.path.join(HERE, 'diag_saturation_r13q.json')

cpools = [(cs, p) for cs, p in v9.COLONY]
cptot = sum(p for _, p in cpools)
cpw = [p / cptot for _, p in cpools]


def draw_fleet_battle():
    """Gefechtszug im Flotten-Frame (wie check10 run_fleet)."""
    w, att, deff, raid = v11.draw_battle()
    pool_cards, _ = v11.pools[random.choices(
        range(len(v11.pools)), weights=v11.pprob)[0]]
    colpool = None
    if raid:
        colpool = cpools[random.choices(
            range(len(cpools)), weights=cpw)[0]][0]
    fire = [[[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
             for _ in range(3)] for _ in (0, 1)]
    return w, att, deff, raid, pool_cards, colpool, fire


def acc0(r):
    """Wert-Konto Seite 0 (Sicht Verteidiger): out - take - col + loot."""
    return r['dealt0'] - r['taken0'] - r['colony'] + r['loot0']


def run_b(w, att, deff, pool_cards, fire, order, raid, colpool,
          m=1.0, spec=None, spec_n_inst=False):
    return v11.battle(w, att, deff, pool_cards, fire, order, raid=raid,
                      colpool=colpool, dmg_scale=(1.0, float(m)),
                      spec=spec, spec_side=0, spec_n_inst=spec_n_inst,
                      ret='full')


# ============ Teil 1: Nachfrage-Verteilung (Baseline) ==============
def teil1():
    random.seed(42)
    take = {m: [] for m in MS}
    pools_hp = []
    raid_n = 0
    for i in range(N1):
        w, att, deff, raid, pool_cards, colpool, fire = draw_fleet_battle()
        order = (0, 1) if i % 2 == 0 else (1, 0)
        pools_hp.append(sum(b['hp'] for b in deff))
        if raid:
            raid_n += 1
        for m in MS:
            r = run_b(w, att, deff, pool_cards, fire, order, raid, colpool,
                      m=m)
            take[m].append(r['taken0'])
    out = dict(n=N1, raid_share=raid_n / N1,
               hp_pool_median=round(statistics.median(pools_hp), 1))
    for m in MS:
        xs = take[m]
        qs = statistics.quantiles(xs, n=20) if len(set(xs)) > 1 else xs
        out[f'take0_M{int(m)}'] = dict(
            mean=round(statistics.mean(xs), 2),
            p10=round(statistics.quantiles(xs, n=10)[0], 2),
            p25=round(statistics.quantiles(xs, n=4)[0], 2),
            median=round(statistics.median(xs), 2),
            p75=round(statistics.quantiles(xs, n=4)[2], 2),
            p90=round(statistics.quantiles(xs, n=10)[-1], 2),
            zero_share=round(sum(1 for x in xs if x == 0) / len(xs), 3))
    out['take0_M2/M1'] = round(statistics.mean(take[2.0]) /
                               max(statistics.mean(take[1.0]), 0.01), 2)
    out['take0_M3/M1'] = round(statistics.mean(take[3.0]) /
                               max(statistics.mean(take[1.0]), 0.01), 2)
    return out


# ============ Teil 2: Elastizitaet je Statkarte ====================
def teil2_card(c, n):
    """Eigener seed-42-Strom je Karte; returns dict mit Mittelwerten."""
    random.seed(42)
    acc = dict(
        take_b={m: 0.0 for m in MS},
        prev={m: 0.0 for m in MS},       # verhinderter Schaden
        prev0={m: 0 for m in MS},       # Gefechte ohne Verhinderung
        gain={m: 0.0 for m in MS},       # Wert-Gain (1x-Platzierung)
        dout={m: 0.0 for m in MS}, dtake={m: 0.0 for m in MS},
        dcol={m: 0.0 for m in MS}, dloot={m: 0.0 for m in MS},
        gain_ni={1.0: 0.0, 2.0: 0.0},    # n_inst-Platzierung (Beschluss)
        prev_ni={1.0: 0.0, 2.0: 0.0})
    for i in range(n):
        w, att, deff, raid, pool_cards, colpool, fire = draw_fleet_battle()
        order = (0, 1) if i % 2 == 0 else (1, 0)
        for m in MS:
            rb = run_b(w, att, deff, pool_cards, fire, order, raid, colpool,
                       m=m)
            rc = run_b(w, att, deff, pool_cards, fire, order, raid, colpool,
                       m=m, spec=c)
            acc['take_b'][m] += rb['taken0']
            p = rb['taken0'] - rc['taken0']
            acc['prev'][m] += p
            acc['prev0'][m] += 1 if p <= 1e-9 else 0
            g = acc0(rc) - acc0(rb)
            acc['gain'][m] += g
            acc['dout'][m] += rc['dealt0'] - rb['dealt0']
            acc['dtake'][m] += rc['taken0'] - rb['taken0']
            acc['dcol'][m] += rc['colony'] - rb['colony']
            acc['dloot'][m] += rc['loot0'] - rb['loot0']
        for m in (1.0, 2.0):
            rb = run_b(w, att, deff, pool_cards, fire, order, raid, colpool,
                       m=m)
            rc = run_b(w, att, deff, pool_cards, fire, order, raid, colpool,
                       m=m, spec=c, spec_n_inst=True)
            acc['gain_ni'][m] += acc0(rc) - acc0(rb)
            acc['prev_ni'][m] += rb['taken0'] - rc['taken0']
    for k in ('take_b', 'prev', 'gain', 'dout', 'dtake', 'dcol', 'dloot'):
        acc[k] = {str(m): round(v / n, 3) for m, v in acc[k].items()}
    acc['gain_ni'] = {str(m): round(v / n, 3) for m, v in acc['gain_ni'].items()}
    acc['prev_ni'] = {str(m): round(v / n, 3) for m, v in acc['prev_ni'].items()}
    acc['prev0'] = {str(m): round(v / n, 3) for m, v in acc['prev0'].items()}
    return acc


def main():
    t0 = time.time()
    done = {}
    if os.path.exists(CKPT):
        done = json.load(open(CKPT, encoding='utf-8'))
    if 'teil1' not in done:
        done['teil1'] = teil1()
        print('Teil 1 (Nachfrage-Verteilung):', json.dumps(done['teil1'],
                                                           ensure_ascii=False))
    cards = v11.cards
    for idx, c in enumerate(cards):
        if c['id'] in done.get('cards', {}):
            continue
        acc = teil2_card(c, N2)
        done.setdefault('cards', {})[c['id']] = dict(
            title=c['title'], rarity=c['rarity'], units=c['units'],
            hp=c['hp'], speed=c['speed'],
            added=[(a['type'], a['points']) for a in c.get('added', [])],
            cond=c.get('cond'), n=N2, **acc)
        json.dump(done, open(CKPT, 'w', encoding='utf-8'))
        g1 = acc['gain']['1.0'] / 3
        g2 = acc['gain']['2.0'] / 3
        print(f'  Karte {idx + 1}/19: {c["id"]} {c["title"][:26]} '
              f'gain/P M1 {g1:.2f} M2 {g2:.2f} '
              f'(ni/Kopie {acc["gain_ni"]["1.0"] / 4:.2f}) '
              f'({time.time() - t0:.0f}s)', flush=True)
    # ---- Auswertung ----
    rows = []
    for c in cards:
        d = done['cards'][c['id']]
        units = c['units']
        g1, g2, g3 = (d['gain']['1.0'] / 3, d['gain']['2.0'] / 3,
                      d['gain']['3.0'] / 3)
        sc = [(g + HP_STATIC * c['hp']) / units for g in (g1, g2, g3)]
        rows.append(dict(
            id=c['id'], title=c['title'], rarity=c['rarity'],
            typ=(c['added'][0]['type'] if c.get('added')
                 else ('hp' if c.get('hp') else 'speed')),
            units=units,
            take_b1=d['take_b']['1.0'],
            prev1=d['prev']['1.0'], prev2=d['prev']['2.0'],
            prev3=d['prev']['3.0'],
            prev0_share=d['prev0']['1.0'],
            gain1=round(g1, 2), gain2=round(g2, 2), gain3=round(g3, 2),
            elast21=(round(g2 / g1, 2) if g1 > 0.05 else None),
            elast32=(round(g3 / g2, 2) if g2 > 0.05 else None),
            score1=round(sc[0], 2), score2=round(sc[1], 2),
            score3=round(sc[2], 2),
            gain_ni1_kopie=round(d['gain_ni']['1.0'] / 4, 2),
            gain_ni2_kopie=round(d['gain_ni']['2.0'] / 4, 2),
            dout1=d['dout']['1.0'], dtake1=d['dtake']['1.0'],
            dcol1=d['dcol']['1.0'], dloot1=d['dloot']['1.0'],
            prev_ni1=d['prev_ni']['1.0']))
    json.dump(dict(teil1=done['teil1'], cards=rows, n=N2,
                   hp_static=HP_STATIC),
              open(OUT, 'w', encoding='utf-8'), ensure_ascii=False,
              indent=1)
    print(f'\n=== Saettigungs-Diagnose 13q (N2={N2} je Karte, '
          f'Teil 1 N1={N1}) ===')
    t1 = done['teil1']
    print(f'Nachfrage (Baseline take0 je Gefecht): '
          f'M1 mean {t1["take0_M1"]["mean"]} / median '
          f'{t1["take0_M1"]["median"]} / Zero {t1["take0_M1"]["zero_share"]}, '
          f'M2 x{t1["take0_M2/M1"]}, M3 x{t1["take0_M3/M1"]} '
          f'(HP-Pool Seite 0: {t1["hp_pool_median"]})')
    print('Karte                    Typ    rar g/P M1  M2   M3  '
          'el21 el32 prev1 p0    ni/K M1')
    for r in rows:
        print(f'{r["id"]} {r["title"][:22]:22} {r["typ"]:6} r{r["rarity"]} '
              f'{r["gain1"]:5.2f} {r["gain2"]:5.2f} {r["gain3"]:5.2f} '
              f'{str(r["elast21"]):>4} {str(r["elast32"]):>4} '
              f'{r["prev1"]:5.2f} {r["prev0_share"]:.2f} '
              f'{r["gain_ni1_kopie"]:5.2f}')
    print(f'Gesamtzeit {time.time() - t0:.0f}s; Output: {OUT}')


if __name__ == '__main__':
    main()
