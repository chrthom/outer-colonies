#!/usr/bin/env python3
"""diag_speed5_r13t: Trager-Zahler fuer die +1-sp-Kippquote (161) im
v23-ZIELSZENARIO (Christophers Beschluesse 6.11.2026):
- Draw-v2: JEDES Schiff >= 1 Pflichtwaffe (Re-draw bis anlegbar),
  Budget-Re-draw, minimales Budget = Huellen + Schiffe je Seite
- Flotte 1-4 Schiffe (statt 1-3), Budgetverteilung uniform
- v22->=-Regel wie gehabt, N=2000, seed 42, CRN.

Vergleich mit diag_speed4_r13t.py (Ist-Zustand 1-3/Uniform-Draw):
Steigt die Kippquote/Ersparnis mit der Gefechtsdichte?
Achtung: KEIN Import-Schutz — nie importieren! CWD = knowledge-Ordner.
"""
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'diag_random_r13t.py'),
           encoding='utf-8').read()
marker = '# ---------------- Messung mit Checkpoint'
defs = src[:src.index(marker)]

PLACE = "s['cards'].append(dict(spec))"
PLACE_SI = "s['cards'].append(dict(spec)); SI['owner'] = (spec_side, i)"
PAY0 = '    pay = []'
PAY_SI = '    pay = []\n    SI.clear()'
HALVD = ('halved = sh[\'s\'] + p <= tgt[\'s\']\n'
         '                    d = v9.half(base) if halved else base')
HALVD_Z = ('halved = sh[\'s\'] + p <= tgt[\'s\']\n'
           '                    d = v9.half(base) if halved else base\n'
           '                    if SI and len(own) > i and (u, i) =='
           ' SI[\'owner\']:\n'
           '                        CNT[\'from\'] += 1\n'
           '                        if halved:\n'
           '                            CNT[\'from_halv\'] += 1\n'
           '                        elif tgt[\'s\'] - sh[\'s\'] == p:\n'
           '                            CNT[\'from_resc\'] += 1\n'
           '                            CNT[\'from_gain\'] +='
           ' d - v9.half(base)\n'
           '                    if SI and (1 - u, tgt_i) =='
           ' SI[\'owner\']:\n'
           '                        CNT[\'on\'] += 1\n'
           '                        if halved:\n'
           '                            CNT[\'on_halv\'] += 1\n'
           '                            CNT[\'on_saved\'] += base - d\n'
           '                        if tgt[\'s\'] - sh[\'s\'] == p + 1:\n'
           '                            CNT[\'on_new\'] += 1\n'
           '                            CNT[\'on_new_saved\'] += base - d')

REMAP = "        fire_l[1] = [fire_l[1][old] for old, _ in kept]"
REMAP_SI = ('        fire_l[1] = [fire_l[1][old] for old, _ in kept]\n'
            '        if SI and SI[\'owner\'] and SI[\'owner\'][0] == 1:\n'
            '            SI[\'owner\'] = ((1, remap[SI[\'owner\'][1]])\n'
            '                           if SI[\'owner\'][1] in remap'
            ' else None)')

d = defs
assert PLACE in d and PAY0 in d and HALVD in d and REMAP in d
d = d.replace(PLACE, PLACE_SI, 1)
d = d.replace(PAY0, PAY_SI, 1)
d = d.replace(HALVD, HALVD_Z, 1)
d = d.replace(REMAP, REMAP_SI, 1)

G = {'__name__': 'r13t_defs',
     '__file__': os.path.abspath(os.path.join(
         HERE, 'diag_random_r13t.py')),
     'SI': {}, 'CNT': dict.fromkeys(
         ('from', 'from_halv', 'from_resc', 'from_gain', 'on',
          'on_halv', 'on_saved', 'on_new', 'on_new_saved'), 0)}
exec(compile(d, 'r13t_defs', 'exec'), G)

battle_r, acc_side, blank = G['battle_r'], G['acc_side'], G['blank']
v11, v10 = G['v11'], G['v10']
PHASES = G['PHASES']
POOL, PPROB, place = G['POOL'], G['PPROB'], G['place']
WPIDX = [i for i, p in enumerate(POOL) if p['kind'] == 'w']
_WPT = sum(PPROB[i] for i in WPIDX)
WPPROB = [PPROB[i] / _WPT for i in WPIDX]
NMAX = 5   # Christophers Beschluss: Flotte 1-5 (v23b, 6.11.2026)

C161 = [c for c in v11.cards if c['id'] == '161'][0]


def can_place(req, free):
    return all(free.get(t, 0) >= n for t, n in req.items())


def draw_loadout_v2(fleet, e, rng):
    """Draw-v2: Pflichtwaffe je Schiff + Budget-Re-draw
    (Christophers Vorgaben 6.11.2026)."""
    free = {}
    ships = []
    for b in fleet:
        free[id(b)] = dict(b['socks'])
        ships.append(dict(build=b, weapons=[], cards=[], pdc=[],
                          hp_add=0, sp_add=0))
    placed = 0
    noweap = 0
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
            noweap += 1
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
    return ships, noweap


def fleet_v2(rng):
    fleet = []
    for _ in range(rng.randint(1, NMAX)):
        n = rng.randint(1, 3)
        types = v11.MISSION_TYPES[n]
        t = rng.choices(types, weights=[v11.TYPE_BEST[(n, t)]
                                        for t in types])[0]
        bl = v11.BUILDS_BY[(n, t)]
        fleet.append(rng.choices(bl, weights=[b['w'] for b in bl])[0])
    return fleet


def battle_v2(rng):
    """Zielszenario: Draw-v2, Flotte 1-4, Budget uniform
    (b_lo angehoben um Pflichtwaffen zu gewaehrleisten)."""
    att_b = fleet_v2(rng)
    raid = rng.random() < 0.5
    deff_b = fleet_v2(rng)
    h0 = sum(b['parts'] for b in deff_b)
    h1 = sum(b['parts'] for b in att_b)
    s0 = sum(sum(b['socks'].values()) for b in deff_b)
    s1 = sum(sum(b['socks'].values()) for b in att_b)
    b_lo = max(max(h0, h1) + len(deff_b),
               max(h0, h1) + len(att_b))
    b_hi = min(h0 + s0, h1 + s1)
    b_tot = (rng.randint(b_lo, b_hi) if b_hi > b_lo else b_lo)
    att, _ = draw_loadout_v2(att_b, b_tot - h1, rng)
    deff, _ = draw_loadout_v2(deff_b, b_tot - h0, rng)

    def coins(nweap_per):
        return [[[rng.random() < v10.ATTACK_PROB[p] for p in PHASES]
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
                fire=fire, order=order, e=b_tot - h0, hulls=(h0, h1),
                socks=(s0, s1), b=b_tot)


KS = ('out', 'take', 'col', 'loot', 'prevent')
acc = blank()
accn = [0, 0]
random.seed(42)
N = 2000
ships_seen = 0
for it in range(N):
    sc = battle_v2(random)
    ships_seen += len(sc['att']) + len(sc['deff'])
    r0 = battle_r(sc)
    a0, a1 = acc_side(r0, 0), acc_side(r0, 1)
    for side in (0, 1):
        r = battle_r(sc, spin=it % 4, spec=dict(C161),
                     spec_side=side)
        if r is None:
            continue
        accn[side] += 1
        a = acc_side(r, side)
        m = {k: a[k] - (a0 if side == 0 else a1)[k] for k in a}
        for k in m:
            acc[side][k] += m[k]

c = G['CNT']
pl = accn[0] + accn[1]
print('=== 161-Trager-Kippquote im v23-ZIELSZENARIO (Draw-v2,'
      ' Flotte 1-4, N=%d, seed 42) ===' % N)
print('Platzierungen: %d (Schiffe je Gefecht im Schnitt %.2f)'
      % (pl, ships_seen / N))
print('Schuesse auf den Traeger: %d -> %.2f je Platzierung'
      % (c['on'], c['on'] / pl))
print('  davon halbiert: %d (%.1f%% der Traeger-Schuesse)'
      % (c['on_halv'], 100 * c['on_halv'] / max(1, c['on'])))
print('  NEU gekippt durch +1 sp (D == p+1): %d = %.1f%% der'
      ' Traeger-Schuesse, Ersparnis %.2f Schaden je Platzierung'
      % (c['on_new'], 100 * c['on_new'] / max(1, c['on']),
         c['on_new_saved'] / pl))
print('  gesamt Ersparnis durch Halved auf dem Traeger: %.2f'
      ' Schaden je Platzierung' % (c['on_saved'] / pl))
print('Schuesse VOM Traeger: %d -> %.2f je Platzierung'
      % (c['from'], c['from'] / pl))
print('  halbiert: %d (%.1f%%)' % (c['from_halv'],
      100 * c['from_halv'] / max(1, c['from'])))
print('  durch +1 sp GERETTET (D == p, nicht mehr halbiert):'
      ' %d, zusaetzlicher Output %.2f je Platzierung'
      % (c['from_resc'], c['from_gain'] / pl))
print()
print('Kontroll-Kanaele (161, diese Messung):')
for side in (0, 1):
    print('  Sicht %d: take %+.3f  Bilanz(out+take) %+.3f'
          % (side, acc[side]['take'] / accn[side],
             (acc[side]['out'] + acc[side]['take']) / accn[side]))
