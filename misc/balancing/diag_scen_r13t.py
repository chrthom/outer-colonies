# diag_scen_r13t.py — Szenario-Dichte-Analyse (Christophers Einwand
# 6.11.2026: "1,24x beschossen und 6,01 Schaden pro Gefecht ist VIEL
# niedriger als die Spielrealitaet; Sockelauslastung erhoehen oder
# Gefechte groesser machen (1-4 Schiffe?) — in Summe mehr Karten pro
# Gefecht"). Reine BASELINE-Messung (battle_r ohne bewertete Karte)
# je Szenario-Variante: Flottengroesse und Kartenbudget-Verteilung
# sind die zwei Hebel in draw_random_battle.
#   - Flotte: rng.randint(1, NMAX) Schiffe je Seite (Ist: 1..3)
#   - Budget: b_tot = b_lo + q*(b_hi-b_lo), q ~ U(q_lo, q_hi)
#     (Ist: q ~ U(0,1) via randint; Spiegel B bleibt gewahrt)
# Achtung: DIESES Skript hat KEINEN Import-Schutz — nie importieren!
# Die v22-Sonde wird per exec-Technik (bis Checkpoint-Marker) gebunden.
# CWD muss der knowledge-Ordner sein (cards.csv). N=2000, seed 42 je Variante.

import os
import random
import sys

N = 2000
VARIANTS = [
    #  name     nmax  q_lo  q_hi
    ('S0',        3,  0.0,  1.0),   # Status quo (Validierung vs. v22)
    ('S1',        4,  0.0,  1.0),   # nur Flotte 1-4
    ('S2',        3,  0.5,  1.0),   # nur Budget obere Haelfte
    ('S2b',       3,  0.75, 1.0),   # Budget obere Viertel
    ('S3',        3,  1.0,  1.0),   # volle Bestueckung (Extrem)
    ('S4',        4,  0.5,  1.0),   # Flotte 1-4 + obere Haelfte
    ('S4b',       4,  0.75, 1.0),   # Flotte 1-4 + oberes Viertel
    ('S5',        4,  1.0,  1.0),   # Flotte 1-4 + voll (Maximal)
]

src = open('diag_random_r13t.py', encoding='utf-8').read()
G = {'__name__': 'r13t_defs',
     '__file__': os.path.abspath('diag_random_r13t.py')}
exec(src[:src.index('# ---------------- Messung mit Checkpoint')], G)

battle_r = G['battle_r']
v11 = G['v11']
PHASES = G['PHASES']
POOL = G['POOL']
PPROB = G['PPROB']
place = G['place']
# Waffenpool fuer Christophers Pflichtwaffe (jedes Schiff >= 1 Waffe,
# 6.11.2026: "in Realitaet nimmt niemals ein Schiff ohne Waffe teil")
WPIDX = [i for i, p in enumerate(POOL) if p['kind'] == 'w']
_WPT = sum(PPROB[i] for i in WPIDX)
WPPROB = [PPROB[i] / _WPT for i in WPIDX]


def can_place(req, free):
    return all(free.get(t, 0) >= n for t, n in req.items())


def draw_loadout_v2(fleet, e, rng):
    """v2 (Christophers Vorgaben 6.11.2026):
    (1) JEDES Schiff bekommt zunaechst 1 Pflichtwaffe (rarity-gewichtet,
        re-draw bis anlegbar, Sanity-Deckel 300 Zuege je Schiff);
    (2) danach bis e eingesetzte Karten gesamt (Pflichtwaffen zaehlen
        mit), nicht-anlegbare Zuege verfallen nicht (Re-draw),
        Sanity-Deckel 60*e Zuege wie bisher."""
    free = {}
    ships = []
    for b in fleet:
        free[id(b)] = dict(b['socks'])
        ships.append(dict(build=b, weapons=[], cards=[], pdc=[],
                          hp_add=0, sp_add=0))
    stats = dict(noweap=0, capped=0)
    placed = 0
    for i, b in enumerate(fleet):
        ok = False
        for _ in range(300):
            w = POOL[rng.choices(WPIDX, weights=WPPROB)[0]]
            if can_place(w['req'], free[id(b)]):
                place(w['req'], free[id(b)])
                ships[i]['weapons'].append(dict(w))
                placed += 1
                ok = True
                break
        if not ok:
            stats['noweap'] += 1   # kein Build kann diese Waffe tragen
    tries = 0
    while placed < e and tries < 60 * e:
        tries += 1
        card = POOL[rng.choices(range(len(POOL)), weights=PPROB)[0]]
        cands = list(range(len(ships)))
        rng.shuffle(cands)
        for i in cands:
            b = fleet[i]
            if can_place(card['req'], free[id(b)]):
                place(card['req'], free[id(b)])
                s = ships[i]
                if card['kind'] == 'w':
                    s['weapons'].append(dict(card))
                else:
                    s['cards'].append(dict(card))
                    s['hp_add'] += card['hp']
                    s['sp_add'] += card['speed']
                placed += 1
                break
    if tries >= 60 * e and placed < e:
        stats['capped'] += 1
    return ships, stats


def fleet_variant(rng, nmax, types_by_n):
    """Kopie von draw_random_fleet mit parametrisierter Flottengroesse."""
    fleet = []
    for _ in range(rng.randint(1, nmax)):
        n = rng.randint(1, 3)
        types = types_by_n[n]
        t = rng.choices(types, weights=[v11.TYPE_BEST[(n, t)]
                                        for t in types])[0]
        bl = v11.BUILDS_BY[(n, t)]
        fleet.append(rng.choices(bl, weights=[b['w'] for b in bl])[0])
    return fleet


def battle_variant(rng, nmax, q_lo, q_hi):
    """Kopie von draw_random_battle mit Flotten-/Budget-Parametern."""
    att_b = fleet_variant(rng, nmax, v11.MISSION_TYPES)
    raid = rng.random() < 0.5
    deff_b = fleet_variant(rng, nmax, v11.RAID_TYPES if raid
                           else v11.MISSION_TYPES)
    h0 = sum(b['parts'] for b in deff_b)
    h1 = sum(b['parts'] for b in att_b)
    s0 = sum(sum(b['socks'].values()) for b in deff_b)
    s1 = sum(sum(b['socks'].values()) for b in att_b)
    b_lo = max(h0, h1)
    # Christophers Pflichtwaffen-Vorgabe: minimales Budget = Huellen +
    # je Schiff 1 Waffe, sonst koennte Seite mit mehr Hullen keine
    # Pflichtwaffe fuer alle Schiffe haben
    b_lo = max(b_lo + len(deff_b), b_lo + len(att_b))
    b_hi = min(h0 + s0, h1 + s1)
    if b_hi > b_lo:
        b_tot = round(b_lo + rng.uniform(q_lo, q_hi) * (b_hi - b_lo))
        b_tot = min(max(b_tot, b_lo), b_hi)
    else:
        b_tot = b_lo
    e0 = b_tot - h0
    e1 = b_tot - h1
    att, st1 = draw_loadout_v2(att_b, e1, rng)
    deff, st0 = draw_loadout_v2(deff_b, e0, rng)

    def coins(nweap_per):
        return [[[rng.random() < G['v10'].ATTACK_PROB[p] for p in PHASES]
                 for _ in range(n)] for n in nweap_per]
    fire = [coins([len(s['weapons']) for s in deff]),
            coins([len(s['weapons']) for s in att])]
    colpool = None
    if raid:
        colpool = G['cpools'][rng.choices(
            range(len(G['cpools'])),
            weights=[p / G['cptot'] for _, p in G['cpools']])[0]][0]
    order = (0, 1) if rng.random() < 0.5 else (1, 0)
    return dict(att=att, deff=deff, raid=raid, colpool=colpool,
                fire=fire, order=order, e=e0, hulls=(h0, h1),
                socks=(s0, s1), b=b_tot,
                stats=dict(noweap=st0['noweap'] + st1['noweap'],
                           capped=st0['capped'] + st1['capped']))


def count_shots(sc):
    """Feuerbereite Schuesse je Gefecht (Coin=True + in Reichweite/
    Feuerphase), vor Ausduennung/Tod — Dichte-Marker."""
    total = 0
    for u, lst in enumerate((sc['deff'], sc['att'])):
        for i, s in enumerate(lst):
            for k, w in enumerate(s['weapons']):
                if w['single']:
                    ok_p = [w['fire_phase']]
                else:
                    ok_p = [p for p in PHASES if p <= w['range']]
                for p in ok_p:
                    if sc['fire'][u][i][k][4 - p]:
                        total += 1
    return total


sel = [v for v in VARIANTS
       if not sys.argv[1:] or v[0] in sys.argv[1:]]
for name, nmax, q_lo, q_hi in sel:
    random.seed(42)
    a = dict(tk0=0.0, tk1=0.0, d0=0, d1=0, col=0.0, loot0=0.0, raid=0,
             ships=0, hulls=0, equip=0, nsock=0, weap=0, cards=0, b=0,
             shots=0, unequal=0, noweap=0, capped=0)
    for _ in range(N):
        sc = battle_variant(random, nmax, q_lo, q_hi)
        r = battle_r(sc)
        a['noweap'] += sc['stats']['noweap']
        a['capped'] += sc['stats']['capped']
        a['tk0'] += r['taken0']; a['tk1'] += r['taken1']
        a['d0'] += r['dead0']; a['d1'] += r['dead1']
        a['col'] += r['colony']; a['loot0'] += r['loot0']
        a['raid'] += 1 if sc['raid'] else 0
        a['ships'] += len(sc['att']) + len(sc['deff'])
        a['hulls'] += sc['hulls'][0] + sc['hulls'][1]
        a['b'] += sc['b']
        if sc['hulls'][0] != sc['hulls'][1]:
            a['unequal'] += 1
        for s in sc['att'] + sc['deff']:
            a['equip'] += len(s['weapons']) + len(s['cards'])
            a['weap'] += len(s['weapons'])
            a['cards'] += len(s['cards'])
            a['nsock'] += sum(s['build']['socks'].values())
        a['shots'] += count_shots(sc)
    sh = a['ships'] / (2 * N)
    print(f'{name}: Schiffe/Seite {sh:.2f} | Hulls/Seite {a["hulls"]/(2*N):.2f}'
          f' | equip/Seite {a["equip"]/(2*N):.2f} (Waffen {a["weap"]/(2*N):.2f}'
          f' + Stat {a["cards"]/(2*N):.2f})'
          f' | fill {a["equip"]/a["nsock"]*100:.1f} %'
          f' | B/Seite {a["b"]/N:.2f}'
          f' | Schaden/S.0 {a["tk0"]/N:.2f} S.1 {a["tk1"]/N:.2f}'
          f' | tot S.0 {a["d0"]/N:.2f} S.1 {a["d1"]/N:.2f}'
          f' | Schuesse/Gef {a["shots"]/N:.2f} je Schiff {a["shots"]/a["ships"]:.2f}'
          f' | Raid {a["raid"]/N*100:.0f} % | ungleich {a["unequal"]/N*100:.0f} %'
          f' | loot0 {a["loot0"]/N:.2f}'
          f' | waffenlose Schiffe {a["noweap"]/(2*N):.3f}'
          f' | capped {a["capped"]/(2*N)*100:.1f} %', flush=True)
