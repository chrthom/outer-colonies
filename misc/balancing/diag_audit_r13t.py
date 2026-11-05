#!/usr/bin/env python3
"""diag_audit_r13t: Frame-Audit Zufallsgefechte (Runde 13t, 5.11.2026).

KEINE Wertmessung: Christophers Auftrag "Erst Erklaerung, Frame pruefen,
Buff/Nerf last resort". Instrumentierte Kopie der Sonde v2 mit Zaehlern:
- Missions-Ausduennung: wie oft fehlen Abfaenger, wie viel ctrl faellt?
- Speed-Karten (161/109/537/434): Angriffe auf den Traeger, halved-
  Schwellen (diff = tgt_s - (att_s + Phase)), Traeger-Output/UEberleben.
- Feuerraten je Waffe (r3/r4-Referenz: 127/412 vs. 6 r4-Waffen).

Christophers Beschluss (freie Eingabe, 5.11.2026):
- Sonde bauen, NUR M1 (dmg_scale entfaellt).
- KEINE Unterscheidung Duell/Flottenkampf mehr — EIN Gefechtstyp.
- Spiegel-Faktor = ANZAHL KARTEN (beide Flotten gleich viele Karten,
  nicht gespiegelte Schiffe), regelkonform zusammengesetzt.
- Score je Karte: Schadens-Output, zusaetzliche HP, verhinderter/
  halbierter Schaden (Konten wie 13q-Forts.), geteilt durch Kosten
  (Sockel + Energie = units, wie gehabt).
- Schwer einsetzbare Karten (Bedingungen) werden nur im Einsatz
  bewertet -> akzeptierte Outlier (Christophers Beschluss).

Frame-Aenderungen gegen 13q/13r:
1. Umgebungs-Loadouts JE SCHIFF statt 1 Waffentyp + abstraktem
   Defense-Pool: rarity-gewichtete Ziehung aus allen 69 FINAL-Karten
   (50 Waffen + 19 Statkarten), Platzierung nur auf freie, typ-
   passende Sockel (Waffen: v11.WREQ; Statkarten: cards.csv socket_
   Spalten, Betrag = Anzahl). Bunte Umgebungen = Christophers
   Waffen-Mix-Punkt.
2. Flotten UNABHAENGIG gezogen (kein Spiegel): att = draw_fleet(
   MISSION_TYPES), deff = draw_fleet(RAID_TYPES im Raid sonst
   MISSION_TYPES), je 1x 1-/2-/3-teilig (6 Huellen-Karten je Seite).
3. Kartenbudget B je Gefecht (uniform 11..17); Ausruestungszahl
   E = B - 6 BEIDERSEITS gleich -> gleiche Kartenzahl (Christophers
   Spiegel-Faktor; Huellen-Sektionen zaehlen als Karten).
4. n_inst-Verdopplung ENTFaELLT: jede gezogene Karte ist EINE
   Instanz (Stacks entstehen nur durch real gezogene 2. Karte,
   Christophers 13l-Design-Punkt). Bewertete Karte: 1 Platzierung
   -> Score = gain/N/units (statt /3, Skala verschiebt sich,
   v21-Neuankerung geplant).
5. M=1 (keine dmg_scale), col_rule='always' + no_colony-Ausnahme
   (13r-Beschluss), cond der BEWERTETEN Karte gestrichen (13r);
   Umgebung: gezogen = platziert (Einsatz-Annahme).
6. Energie-Budget der Schiffe ist in cards.csv nicht modelliert
   (Huellen-energy leer) -> Energie bleibt NUR Kostenbestandteil,
   keine Regel-Kraenkung (dokumentierte Frame-Grenze).
7. Koloniezonen-Defense bleibt abstrakt (cpools wie gehabt).

Deltamessung (Messkern bleibt): je Gefecht 1 Baseline + je bewerteter
Karte beide Rollen (Seite 0/1) auf IDENTISCHER Umgebung (CRN, Szenario
vor Messung gecacht). Konten: Sicht 0 = out - take - col + loot,
Sicht 1 = out - take + col + loot; Score = (Rollenmittel-gain +
HP_STATIC x hp) / units. Checkpoint/Resume alle CKPT_EVERY Gefechte.

Kennzahlen: Baseline, Nachfrage-Median (M1!), Bestueckungsgrad,
Mediane je Raritaet (Waffen/Karten), Spearman vs. v20-Scores,
Top/Bottom, Speed-/Bedingungs-Karten.
"""
import json
import os
import random

import balancing_metric_v9 as v9
import balancing_metric_v10 as v10
import balancing_metric_v11 as v11

HERE = os.path.dirname(os.path.abspath(__file__))
CKPT_PATH = os.path.join(HERE, 'diag_audit_ckpt_r13t.json')
OUT_PATH = os.path.join(HERE, 'diag_audit_r13t.json')
N = 2000
CKPT_EVERY = 50
HP_STATIC = v11.HP_STATIC
CTRL_W = v11.CTRL_W
COLONY_HP = v11.COLONY_HP
PHASES = v11.PHASES

# --- Karten-Pools mit Sockelbedarf ------------------------------------
# Waffen: v11.WREQ ({'d':1} etc.); Statkarten: socket-Spalten (Betrag).
ws = [w for w in v11.weapons
      if str(w['id']) in ('127', '412', '207', '209', '310', '107', '405', '409')]
ws_byid = {w['id']: w for w in ws}
cs = [c for c in v11.cards
      if str(c['id']) in ('161', '109', '537', '434')]
cs_byid = {c['id']: c for c in cs}

# Statkarten-Sockelbedarf aus cards.csv
import csv


def _creq():
    req = {}
    with open(v9.CARDS_CSV, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter=';', quotechar='"'):
            if r['id'] in cs_byid:
                d = {}
                for t in ('a', 'b', 'd', 'e', 'f', 'g'):
                    v = v9.num(r['socket_' + t])
                    if isinstance(v, int) and v != 0:
                        d[t] = abs(v)
                req[r['id']] = d
    return req


CREQ = _creq()

POOL = ([dict(w, kind='w', req=v11.WREQ.get(w['id'], {})) for w in ws]
        + [dict(c, kind='c', req=CREQ.get(c['id'], {})) for c in cs])
# rarity-Gewicht je Pool-Karte
TOT = sum(v10.RARITY_W[p['rarity']] for p in POOL)
PPROB = [v10.RARITY_W[p['rarity']] / TOT for p in POOL]

cpools = [(cpl, p) for cpl, p in v9.COLONY]
cptot = sum(p for _, p in cpools)

STAT = dict(n=0, hulls_per_side=6, equip_min=5, equip_max=11)


def draw_random_fleet(types_by_n, rng):
    """Christophers Varianz-Auftrag (5.11.2026): Flottengroesse
    UNABHAENGIG 1..3 Schiffe je Seite, Schiffsgröße je Schiff
    uniform 1..3 Sektionen (Huellen-Karten 1..9), Typ zweistufig
    wie v11 (TYPE_BEST x Build-Gewicht). Ungleich grosse Flotten
    entstehen endogen (kleinere Flotte -> mehr Ausruestung, die
    Karten-SUMME bleibt ueber B gleich)."""
    fleet = []
    for _ in range(rng.randint(1, 3)):
        n = rng.randint(1, 3)
        types = types_by_n[n]
        t = rng.choices(types, weights=[v11.TYPE_BEST[(n, t)]
                                        for t in types])[0]
        bl = v11.BUILDS_BY[(n, t)]
        fleet.append(rng.choices(bl, weights=[b['w'] for b in bl])[0])
    return fleet


def free_socks(build):
    return dict(build['socks'])


def place(card_req, free):
    """Platziert Bedarf auf freie Sockel; True wenn moeglich."""
    for t, n in card_req.items():
        if free.get(t, 0) < n:
            return False
    for t, n in card_req.items():
        free[t] -= n
    return True


def draw_loadout(fleet, e, rng):
    """Zieht E Ausruestungskarten (rarity-gewichtet) auf freie,
    typpassende Sockel; bis zu 20*e Zuege, danach weniger platziert."""
    free = {}
    ships = []
    for b in fleet:
        free[id(b)] = free_socks(b)
        ships.append(dict(build=b, weapons=[], cards=[], pdc=[],
                          hp_add=0, sp_add=0))
    placed = 0
    tries = 0
    while placed < e and tries < 60 * e:
        tries += 1
        card = POOL[rng.choices(range(len(POOL)), weights=PPROB)[0]]
        cands = list(range(len(ships)))
        rng.shuffle(cands)
        for i in cands:
            b = fleet[i]
            if place(card['req'], free[id(b)]):
                s = ships[i]
                if card['kind'] == 'w':
                    s['weapons'].append(dict(card))
                elif card['id'] in card.get('added', []) or True:
                    # Statkarte: pts -> Defense/PD, hp/speed -> Schiff
                    s['cards'].append(dict(card))
                    s['hp_add'] += card['hp']
                    s['sp_add'] += card['speed']
                placed += 1
                break
    return ships


def draw_random_battle(rng):
    """Alles Zufaellige eines Gefechts (Szenario, konsumiert rng).

    Karten-Summen-Spiegel (Christophers Vorgabe): B = Gesamtzahl
    Karten je Seite (Huellen-Sektionen + platzierte Ausruestung)
    uniform aus [max(H0,H1), min(H0+S0, H1+S1)] -> Bestueckungsgrad
    variiert endogen ~20..80+ %, ungleiche Gefechte entstehen
    (kleinere Flotte mit hoeherer Bestueckung)."""
    att_b = draw_random_fleet(v11.MISSION_TYPES, rng)
    raid = rng.random() < 0.5
    deff_b = draw_random_fleet(v11.RAID_TYPES if raid
                               else v11.MISSION_TYPES, rng)
    h0 = sum(b['parts'] for b in deff_b)
    h1 = sum(b['parts'] for b in att_b)
    s0 = sum(sum(b['socks'].values()) for b in deff_b)
    s1 = sum(sum(b['socks'].values()) for b in att_b)
    b_lo = max(h0, h1)
    b_hi = min(h0 + s0, h1 + s1)
    b_tot = rng.randint(b_lo, b_hi) if b_hi > b_lo else b_lo
    e0 = b_tot - h0
    e1 = b_tot - h1
    att = draw_loadout(att_b, e1, rng)
    deff = draw_loadout(deff_b, e0, rng)

    def coins(nweap_per):
        return [[[rng.random() < v10.ATTACK_PROB[p] for p in PHASES]
                 for _ in range(n)] for n in nweap_per]
    fire = [coins([len(s['weapons']) for s in deff]),
            coins([len(s['weapons']) for s in att])]
    wf = [[[rng.random() < v10.ATTACK_PROB[p] for p in PHASES]
           for _ in range(len(x))] for x in (deff, att)]
    colpool = None
    if raid:
        colpool = cpools[rng.choices(
            range(len(cpools)),
            weights=[p / cptot for _, p in cpools])[0]][0]
    order = (0, 1) if rng.random() < 0.5 else (1, 0)
    return dict(att=att, deff=deff, raid=raid, colpool=colpool,
                fire=fire, wf=wf, order=order, e=e0, hulls=(h0, h1),
                socks=(s0, s1), b=b_tot)


def sock_free(build, weapons, cards, extra_req=None):
    """Freie Sockel nach Loadout (fuer bewertete Karte)."""
    free = dict(build['socks'])
    for w in weapons:
        for t, n in w['req'].items():
            free[t] = free.get(t, 0) - n
    for c in cards:
        for t, n in c['req'].items():
            free[t] = free.get(t, 0) - n
    return free


PAY = []   # (side, ship_idx, def_types) der bewerteten Waffe


def battle_r(sc, spin=0, spec=None, spec_side=0, wspec=None, wf=None):
    """Gefecht im Zufalls-Frame. Seite 0 = deff (Verteidiger),
    Seite 1 = att (Raid-Angreifer). spin = deterministische Trager-
    Rotation der bewerteten Karte (CRN-sicher, kein random im
    Gefecht). Rueckgabe full-Konten."""
    # deep-enough Kopie der Schiffs-Loadouts
    def cp_list(lst):
        return [dict(s, weapons=[dict(w) for w in s['weapons']],
                     cards=[dict(c) for c in s['cards']])
                for s in lst]
    sides = [cp_list(sc['deff']), cp_list(sc['att'])]
    raid = sc['raid']
    colpool = sc['colpool']
    pay = list(PAY)
    PAY.clear()
    colony = 0.0
    dealt = [0.0, 0.0]
    taken = [0.0, 0.0]
    dead = [0, 0]
    loot = [0.0, 0.0]
    spec_owner = -1
    dbg = dict(n_fire=0, halved=0, shots=0, shot_dmg=0.0, shot_hal=0,
               att_car=0, hal_car=0, diff_hist={}, car_filt=0,
               car_phases=0, car_dealt=0.0, car_taken=0.0,
               def_n=0, def_kept=0, no_int=0)

    # bewertete Karte platzieren (Einsatz-Annahme, cond gestrichen 13r)
    if spec is not None or wspec is not None:
        card = spec if spec is not None else wspec
        req = card['req'] if 'req' in card else (
            v11.WREQ.get(card['id'], {}) if wspec is not None
            else CREQ.get(card['id'], {}))
        side = sides[spec_side]
        order_i = list(range(len(side)))
        order_i = order_i[spin % len(side):] + order_i[:spin % len(side)]
        placed = False
        wspec_owner = -1
        for i in order_i:
            free = sock_free(side[i]['build'], side[i]['weapons'],
                             side[i]['cards'])
            if place(req, dict(free)):
                s = side[i]
                if spec is not None:
                    s['cards'].append(dict(spec))
                    s['hp_add'] += spec['hp']
                    s['sp_add'] += spec['speed']
                    spec_owner = i
                else:
                    s['wspec'] = dict(wspec)   # separat: eigene Muenzen-
                    # Schleife (wf), NICHT in weapons (fire-Indizes)
                    wspec_owner = i
                placed = True
                break
        if not placed:
            return None   # bewertete Karte nicht regelkonform platzierbar
        # --- 13p-PD-Bezahlung (Christophers Beschluss 4.11.): die
        # bewertete WAFFE zahlt ihre Defensivpunkte (abm u. a.) je
        # Traeger-Schiff in den Flotten-Defense-Pool (recharge 'phase'
        # = PerRound, Prioritaet via v9.RECHARGE; Runde-13t-Fix: war in
        # der Sonde v1 versehentlich NICHT uebernommen -> 234/168/339
        # verloren ihre PD-Wirkung komplett, Christophers Nachfrage
        # 5.11.2026 entlarvte es). ---
        if wspec is not None and wspec.get('def_pts', 0) > 0:
            PAY.append((spec_side, wspec_owner, wspec['def_types']))

    # Flotte aufbauen
    fleet = []
    side_pd = [[], []]
    for u, lst in enumerate(sides):
        fl = []
        for (ps, poi, dtypes) in pay:
            if ps == u:
                for t, pts in dtypes.items():
                    side_pd[u].append((dict(type=t, points=pts,
                                            used=False,
                                            recharge=v9.RECHARGE[t]),
                                       poi))
        for i, s in enumerate(lst):
            b = s['build']
            hp = b['hp'] + s['hp_add']
            cards = []
            for c in s['cards']:
                for a in c.get('added', []):
                    if a['type'] == 'pd':
                        side_pd[u].append((dict(a), i))
                    else:
                        cards.append(dict(a))
            fl.append(dict(hp=hp, s=b['s'] + s['sp_add'],
                           ctrl=b['ctrl'], dead=False, taken=0.0,
                           cards=cards, weapons=s['weapons']))
        fleet.append(fl)

    fire_l = [list(sc['fire'][0]), list(sc['fire'][1])]
    # Missions-Abfang-Ausduennung (12c): Angreifer mit speed < s0min
    # kommen nicht mit; ohne Abfaenger: kein Gefecht, volle Kontrolle.
    if not raid:
        s0min = min(sh['s'] for sh in fleet[0])
        kept = [(i, sh) for i, sh in enumerate(fleet[1])
                if sh['s'] >= s0min]
        if not kept:
            loot[0] = CTRL_W * sum(sh['ctrl'] for sh in fleet[0])
            dbg['no_int'] = 1
            dbg['def_n'] = len(sides[1])
            dbg['def_kept'] = 0
            return dict(taken0=0.0, taken1=0.0, dealt0=0.0, dealt1=0.0,
                        dead0=0, dead1=0, colony=0.0,
                        loot0=loot[0], loot1=0.0, dbg=dbg)
        remap = {old: new for new, (old, _) in enumerate(kept)}
        fleet[1] = [sh for _, sh in kept]
        side_pd[1] = [(c, remap[oi]) for c, oi in side_pd[1]
                      if oi in remap]
        fire_l[1] = [fire_l[1][old] for old, _ in kept]
        dbg['def_n'] = len(sides[1])
        dbg['def_kept'] = len(fleet[1])
        if spec is not None and spec_side == 1 and spec_owner >= 0:
            if spec_owner in remap:
                spec_owner = remap[spec_owner]
            else:
                dbg['car_filt'] = 1
                spec_owner = -1

    for p in PHASES:
        for u in sc['order']:
            own, enemy = fleet[u], fleet[1 - u]
            e_pd = [(c, oi) for c, oi in side_pd[1 - u]
                    if not enemy[oi]['dead']]
            for i, sh in enumerate(own):
                if sh['dead']:
                    continue
                for k, w in enumerate(sh['weapons']):
                    if w['single']:
                        if p != w['fire_phase'] \
                                or not fire_l[u][i][k][4 - p]:
                            continue
                    elif p > w['range'] \
                            or not fire_l[u][i][k][4 - p]:
                        continue
                    tgt_i = next((j for j, e in enumerate(enemy)
                                  if not e['dead']), None)
                    if tgt_i is None:
                        break
                    tgt = enemy[tgt_i]
                    base = max(0, w['damage']
                               - (6 * tgt['s'] if w['id'] == '401' else 0))
                    halved = sh['s'] + p < tgt['s']
                    d = v9.half(base) if halved else base
                    dbg['n_fire'] += 1
                    if halved:
                        dbg['halved'] += 1
                    if spec is not None and spec_owner >= 0:
                        if u != spec_side and tgt_i == spec_owner:
                            dbg['att_car'] += 1
                            if halved:
                                dbg['hal_car'] += 1
                            dd = tgt['s'] - (sh['s'] + p)
                            dbg['diff_hist'][dd] = \
                                dbg['diff_hist'].get(dd, 0) + 1
                    pool = tgt['cards'] + [c for c, _ in e_pd]
                    # --- R1-Kolonie-Zielwahl: 13r 'always' + Ausnahme ---
                    col_dec = False
                    if raid and u == 1 and p == 1 and w['r1_col'] > 0 \
                            and colpool is not None and colony < COLONY_HP:
                        col_dec = True
                    if col_dec:
                        cd = v9.resolve_attack(
                            w, [dict(c) for c in colpool], w['damage']) \
                            * (2 if w['colony_killer'] else 1)
                        colony = min(COLONY_HP, colony + cd)
                        continue
                    dmg = v9.resolve_attack(w, pool, d)
                    tgt['taken'] += dmg
                    dealt[u] += dmg
                    if spec is not None and spec_owner >= 0:
                        if u != spec_side and tgt_i == spec_owner:
                            dbg['car_taken'] += dmg
                        elif u == spec_side and i == spec_owner:
                            dbg['car_dealt'] += dmg
                    if tgt['taken'] >= tgt['hp']:
                        tgt['dead'] = True
            # bewertete Waffe (Delta) eigene Schleife je Phase
            if wspec is not None and u == spec_side:
                for i, sh in enumerate(own):
                    if sh['dead']:
                        continue
                    ok = (p == wspec['fire_phase']) if wspec['single'] \
                        else (p <= wspec['range'])
                    if ok and wf[i][4 - p]:
                        tgt_i = next((j for j, e in enumerate(enemy)
                                      if not e['dead']), None)
                        if tgt_i is None:
                            continue
                        tgt = enemy[tgt_i]
                        base = max(0, wspec['damage']
                                   - (6 * tgt['s']
                                      if wspec['id'] == '401' else 0))
                        halv_w = sh['s'] + p < tgt['s']
                        d = v9.half(base) if halv_w else base
                        dbg['shots'] += 1
                        if halv_w:
                            dbg['shot_hal'] += 1
                        pool = tgt['cards'] + [c for c, _ in e_pd]
                        col_dec = False
                        if raid and u == 1 and p == 1 \
                                and wspec['r1_col'] > 0 \
                                and colpool is not None \
                                and colony < COLONY_HP:
                            col_dec = True
                        if col_dec:
                            cd = v9.resolve_attack(
                                wspec, [dict(c) for c in colpool],
                                wspec['damage']) \
                                * (2 if wspec['colony_killer'] else 1)
                            colony = min(COLONY_HP, colony + cd)
                            continue
                        dmg = v9.resolve_attack(wspec, pool, d)
                        tgt['taken'] += dmg
                        dealt[u] += dmg
                        dbg['shot_dmg'] += dmg
                        if tgt['taken'] >= tgt['hp']:
                            tgt['dead'] = True
        if spec is not None and spec_owner >= 0 \
                and not fleet[spec_side][spec_owner]['dead']:
            dbg['car_phases'] += 1
        # Recharge PerRound/phase
        for side in (0, 1):
            for sh in fleet[side]:
                if not sh['dead']:
                    for c in sh['cards']:
                        if c['recharge'] in ('phase', 'attack'):
                            c['used'] = False
            for c, oi in side_pd[side]:
                if not fleet[side][oi]['dead'] and c['recharge'] in (
                        'phase', 'attack'):
                    c['used'] = False

    for u in (0, 1):
        dead[u] = sum(1 for sh in fleet[u] if sh['dead'])
        taken[u] = sum(sh['taken'] for sh in fleet[u])
    if not raid:
        loot[0] = CTRL_W * max(0, sum(
            sh['ctrl'] for sh in fleet[0] if not sh['dead'])
            - sum(sh['ctrl'] for sh in fleet[1] if not sh['dead']))
    return dict(taken0=taken[0], taken1=taken[1], dealt0=dealt[0],
                dealt1=dealt[1], dead0=dead[0], dead1=dead[1],
                colony=colony, loot0=loot[0], loot1=loot[1], dbg=dbg)


def acc_side(r, s):
    """Konto je Sicht (wie check10): Sicht 0 = out - take - col + loot,
    Sicht 1 = out - take + col + loot."""
    if s == 0:
        return dict(out=r['dealt0'], take=-r['taken0'], col=-r['colony'],
                    loot=r['loot0'])
    return dict(out=r['dealt1'], take=-r['taken1'], col=r['colony'],
                loot=r['loot1'])


def total(a):
    return a['out'] + a['take'] + a['col'] + a['loot']


def blank():
    return [dict(out=0.0, take=0.0, col=0.0, loot=0.0) for _ in (0, 1)]


# ---------------- Messung mit Checkpoint ----------------
random.seed(42)
start = 0
base = dict(tk0=0.0, tk1=0.0, d0=0.0, d1=0.0, dt0=0.0, dl1=0.0,
            col=0.0, loot0=0.0, raid_n=0, equip=0, nsock=0, nfill=0,
            hulls=0, ships=0, b=0, unequal=0, eq_gap=0.0)
accW = {w['id']: blank() for w in ws}
accC = {c['id']: blank() for c in cs}
accWn = {w['id']: [0, 0] for w in ws}
accCn = {c['id']: [0, 0] for c in cs}
placedW = {w['id']: [0, 0] for w in ws}
placedC = {c['id']: [0, 0] for c in cs}
DB0 = dict(n_fire=0, halved=0, shots=0, shot_dmg=0.0, shot_hal=0,
           att_car=0, hal_car=0, diff_hist={}, car_filt=0,
           car_phases=0, car_dealt=0.0, car_taken=0.0,
           def_n=0, def_kept=0, no_int=0)


def dbg_add(acc, d):
    for k, v in d.items():
        if k == 'diff_hist':
            for kk, vv in v.items():
                acc['diff_hist'][kk] = acc['diff_hist'].get(kk, 0) + vv
        else:
            acc[k] += v


accDbgC = {c['id']: [dict(DB0, diff_hist={}), dict(DB0, diff_hist={})]
           for c in cs}
accDbgW = {w['id']: [dict(DB0, diff_hist={}), dict(DB0, diff_hist={})]
           for w in ws}
M = dict(mission=0, no_int=0, def_n=0, def_kept=0, loot=0.0,
         loot_pos=0, g_fire=0, g_halved=0)

if os.path.exists(CKPT_PATH):
    ck = json.load(open(CKPT_PATH, encoding='utf-8'))
    start = ck['iter']
    base.update(ck['base'])
    accW.update(ck['accW'])
    if 'accDbgC' in ck:
        accDbgC.update(ck['accDbgC'])
        accDbgW.update(ck['accDbgW'])
        M.update(ck['M'])
    accC.update(ck['accC'])
    accWn.update(ck['accWn'])
    accCn.update(ck['accCn'])
    placedW.update(ck['placedW'])
    placedC.update(ck['placedC'])
    print(f'Resume bei Gefecht {start}/{N}')

for it in range(start, N):
    sc = draw_random_battle(random)
    r0 = battle_r(sc)
    d0 = r0['dbg']
    M['g_fire'] += d0['n_fire']
    M['g_halved'] += d0['halved']
    if not sc['raid']:
        M['mission'] += 1
        M['no_int'] += d0['no_int']
        if not d0['no_int']:
            M['def_n'] += d0['def_n']
            M['def_kept'] += d0['def_kept']
        M['loot'] += r0['loot0']
        if r0['loot0'] > 0:
            M['loot_pos'] += 1
    base['tk0'] += r0['taken0']; base['tk1'] += r0['taken1']
    base['dt0'] += r0['dealt0']; base['dl1'] += r0['dealt1']
    base['d0'] += r0['dead0']; base['d1'] += r0['dead1']
    base['col'] += r0['colony']; base['loot0'] += r0['loot0']
    base['raid_n'] += 1 if sc['raid'] else 0
    p0 = sum(len(s['weapons']) + len(s['cards']) for s in sc['deff'])
    p1 = sum(len(s['weapons']) + len(s['cards']) for s in sc['att'])
    base['equip'] += p0 + p1
    base['hulls'] += sc['hulls'][0] + sc['hulls'][1]
    base['ships'] += len(sc['att']) + len(sc['deff'])
    base['b'] += sc['b']
    if sc['hulls'][0] != sc['hulls'][1]:
        base['unequal'] += 1
    base['eq_gap'] += abs((p0 + sc['hulls'][0]) - (p1 + sc['hulls'][1]))
    for s in sc['att'] + sc['deff']:
        base['nsock'] += sum(s['build']['socks'].values())
        base['nfill'] += len(s['weapons']) + len(s['cards'])
    a0, a1 = acc_side(r0, 0), acc_side(r0, 1)
    for x in ws:
        for side in (0, 1):
            r = battle_r(sc, spin=it % 3, wspec=x,
                             wf=sc['wf'][side], spec_side=side)
            if r is None:
                continue
            placedW[x['id']][side] += 1
            accWn[x['id']][side] += 1
            dbg_add(accDbgW[x['id']][side], r['dbg'])
            a = acc_side(r, side)
            m = {k: a[k] - (a0 if side == 0 else a1)[k] for k in a}
            for k in m:
                accW[x['id']][side][k] += m[k]
    for x in cs:
        for side in (0, 1):
            r = battle_r(sc, spin=it % 3, spec=dict(x),
                             spec_side=side)
            if r is None:
                continue
            placedC[x['id']][side] += 1
            accCn[x['id']][side] += 1
            dbg_add(accDbgC[x['id']][side], r['dbg'])
            a = acc_side(r, side)
            m = {k: a[k] - (a0 if side == 0 else a1)[k] for k in a}
            for k in m:
                accC[x['id']][side][k] += m[k]
    if (it + 1) % CKPT_EVERY == 0 or it == N - 1:
        json.dump(dict(iter=it + 1, base=base, accW=accW, accC=accC,
                       accWn=accWn, accCn=accCn, placedW=placedW,
                       placedC=placedC, accDbgC=accDbgC,
                       accDbgW=accDbgW, M=M),
                  open(CKPT_PATH, 'w', encoding='utf-8'))
        print(f'Gefecht {it + 1}/{N} (Checkpoint)', flush=True)

# ---------------- Auswertung ----------------
mi = M['mission']
print('=== AUDIT r13t: Baseline-Gefechte (N=%d, seed 42) ===' % N)
print('Missionen: %d, Raids: %d' % (mi, N - mi))
print('Alle Schuesse: %d, davon halved (Ziel-Abzug): %d (%.2f%%)'
      % (M['g_fire'], M['g_halved'], 100 * M['g_halved'] / max(1, M['g_fire'])))
print()
print('--- Missions-Ausduennung (Christophers Ueberlegenheits-These) ---')
print('Missionen ohne Abfaenger (volle Beute, kein Gefecht): %d (%.1f%%)'
      % (M['no_int'], 100 * M['no_int'] / max(1, mi)))
wi = mi - M['no_int']
print('Missionen mit Abfaenger: %d' % wi)
if wi:
    print('  Abfaenger-Schiffe: Ø %.2f vor -> %.2f nach Ausduennung '
          '(%.1f%% entfernt)'
          % (M['def_n'] / wi, M['def_kept'] / wi,
             100 * (1 - M['def_kept'] / M['def_n'])))
print('Missionsloot: Ø %.2f je Mission, Anteil Missionen mit loot>0: %.1f%%'
      % (M['loot'] / max(1, mi), 100 * M['loot_pos'] / max(1, mi)))
print()
print('--- Score-Zerlegung je Karte/Sicht (Konten je Platzierung) ---')
print('Sicht 0 = Missionar/Kolo-Verteidiger, Sicht 1 = Abfaenger/Raid-Angreifer')
for x in cs:
    cid = x['id']
    print('%s %s:' % (cid, x['title']))
    for side in (0, 1):
        n = accCn[cid][side]
        if n == 0:
            continue
        acc = accC[cid][side]
        m = {k: acc[s][k] / n for k in ('out', 'take', 'col', 'loot')
             for s in []}
        o = acc['out'] / n
        t = acc['take'] / n
        co = acc['col'] / n
        lo = acc['loot'] / n
        db = accDbgC[cid][side]
        print('  Sicht %d (n=%d): OUT %+.3f TAKE %+.3f COL %+.3f LOOT %+.3f'
              % (side, n, o, t, co, lo))
        print('    Traeger: Angriffe auf Traeger %.2f/Platz, halved davon '
              '%.2f, durch Ausduennung raus %d, Phasen ueberlebt %.2f, '
              'Traeger-OUT %.2f, Traeger-TAKEN %.2f'
              % (db['att_car'] / n, db['hal_car'] / n, db['car_filt'],
                 db['car_phases'] / n, db['car_dealt'] / n,
                 db['car_taken'] / n))
    dh = {}
    for side in (0, 1):
        for k, v in accDbgC[cid][side]['diff_hist'].items():
            dh[k] = dh.get(k, 0) + v
    tot = sum(dh.values())
    if tot:
        ks = ' '.join('%d:%d' % (k, dh[k]) for k in sorted(dh))
        print('    diff-Histogramm (tgt_s-(att_s+Phase)): %s | diff=0: '
              '%.1f%% von Tragerangriffen (gerettete Volltreffer)'
              % (ks, 100 * dh.get(0, 0) / tot))
    print()
print('--- Feuerraten je Waffe/Sicht (r3/r4-Referenz) ---')
for x in ws:
    wid = x['id']
    for side in (0, 1):
        n = accWn[wid][side]
        if n == 0:
            continue
        db = accDbgW[wid][side]
        acc = accW[wid][side]
        print('%s %s r%d Sicht %d (n=%d): Schuesse/Platz %.2f, '
              'Schaden/Platz %.2f, halved %.1f%% | OUT-Delta %+.2f'
              % (wid, x['title'][:24], x['rarity'], side, n,
                 db['shots'] / n, db['shot_dmg'] / n,
                 100 * db['shot_hal'] / max(1, db['shots']),
                 (acc['out']) / n))
    print()
json.dump(dict(N=N, M=M), open(OUT_PATH, 'w', encoding='utf-8'))
print('-> %s geschrieben' % os.path.basename(OUT_PATH))
