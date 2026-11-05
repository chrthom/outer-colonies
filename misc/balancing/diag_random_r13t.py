#!/usr/bin/env python3
"""diag_random_r13t: Christophers Zufallsgefechte-Sonde (Runde 13t, 5.11.2026).

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
CKPT_PATH = os.path.join(HERE, 'diag_random_ckpt_v23_r13t.json')
OUT_PATH = os.path.join(HERE, 'diag_random_v23_r13t.json')
N = 10000   # v23-Ankuerung (Christophers Beschluesse 6.11.2026):
            # v22-Frame (>=-Regel) + Spielkosten +1 auf ALLE Karten +
            # Draw-v2 (Pflichtwaffe je Schiff, Re-draw, b_lo-Fix) +
            # Flotte 1-4 Schiffe; Offizialmessung N=10k, seed 42
CKPT_EVERY = 50
HP_STATIC = v11.HP_STATIC
CTRL_W = v11.CTRL_W
COLONY_HP = v11.COLONY_HP
PHASES = v11.PHASES

# --- Karten-Pools mit Sockelbedarf ------------------------------------
# Waffen: v11.WREQ ({'d':1} etc.); Statkarten: socket-Spalten (Betrag).
ws = v11.weapons
ws_byid = {w['id']: w for w in ws}
cs = v11.cards
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
# Waffenpool fuer Draw-v2-Pflichtwaffe (Christophers Vorgabe 6.11.2026)
WPIDX = [i for i, p in enumerate(POOL) if p['kind'] == 'w']
_WPT = sum(PPROB[i] for i in WPIDX)
WPPROB = [PPROB[i] / _WPT for i in WPIDX]

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
    for _ in range(rng.randint(1, 5)):   # v23b: Flotte 1-5 Schiffe
        # (Christophers Beschluss 6.11.2026: Playtest-Dichte — Tote/
        # Schaden/Angriffe je Schiff lagen bei 1-4 noch unter der
        # wahrgenommenen Spielrealitaet)
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
    """Draw-v2 (Christophers Vorgaben 6.11.2026):
    (1) JEDES Schiff bekommt zunaechst 1 PFLICHTWAFFE (rarity-gewichtet
        aus dem Waffenpool, Re-draw bis anlegbar, Sanity-Deckel 300
        Zuege) — "in Realitaet nimmt niemals ein Schiff ohne Waffe an
        einem Gefecht teil". Builds, die keine POOL-Waffe tragen
        koennen (<1 %), bleiben waffenlos.
    (2) danach bis E eingesetzte Karten gesamt (Pflichtwaffen zaehlen
        mit), nicht-anlegbare Zuege verfallen NICHT (Re-draw im Sinne
        "Karte bleibt auf der Hand, naechste Karte"), Sanity-Deckel
        60*e Zuege wie bisher."""
    free = {}
    ships = []
    for b in fleet:
        free[id(b)] = free_socks(b)
        ships.append(dict(build=b, weapons=[], cards=[], pdc=[],
                          hp_add=0, sp_add=0))
    placed = 0
    for i in range(len(fleet)):
        for _ in range(300):
            w = POOL[rng.choices(WPIDX, weights=WPPROB)[0]]
            if all(free[id(fleet[i])].get(t, 0) >= n
                   for t, n in w['req'].items()):
                place(w['req'], free[id(fleet[i])])
                ships[i]['weapons'].append(dict(w))
                placed += 1
                break
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
                else:
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
    # v23 (6.11.2026): b_lo um max. Schiffe je Seite angehoben, damit
    # jede Seite die Pflichtwaffen (Huellen + je Schiff 1 Waffe) tragen
    # kann — Spiegel B bleibt gewahrt (b_tot identisch fuer beide Seiten)
    b_lo = max(h0, h1) + max(len(deff_b), len(att_b))
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
    # 13p-PD-Bezahlung der bewerteten Waffe (LOKAL je battle_r-Aufruf,
    # v5-Fix 5.11.2026: PAY war global und wurde VOR dem eigenen Append
    # gelesen -> eigene Zahlung landete erst im NAECHSTEN battle_r-Aufruf
    # (Cross-Kontamination zwischen Messzellen, TAKE der bewerteten
    # PD-Waffen -0,00, r0-Baselines des Folgeschachts verfaelscht;
    # entlarvt durch Christophers PD-Gutschrift-Nachfrage 5.11.2026).
    pay = []
    colony = 0.0
    dealt = [0.0, 0.0]
    taken = [0.0, 0.0]
    dead = [0, 0]
    loot = [0.0, 0.0]

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
            pay.append((spec_side, wspec_owner, wspec['def_types']))

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
            # v4-Z1 (5.11.2026, Christophers PD-These, Beschluss nach
            # Isolationstest diag_pd2_r13t): Umgebungs-PD-Waffen
            # zahlen ihre def_pts in side_pd — fehlte komplett (Frame-
            # Bug: 32% der Umgebungswaffen sind PD, wirkungslos; ohne
            # Fix ueberhoeht es Torpedo-Scores um ~44% relativ).
            for w in s['weapons']:
                if w.get('def_pts', 0) > 0:
                    for t, pts in w['def_types'].items():
                        side_pd[u].append((dict(
                            type=t, points=pts, used=False,
                            recharge=v9.RECHARGE[t]), i))
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
            return dict(taken0=0.0, taken1=0.0, dealt0=0.0, dealt1=0.0,
                        dead0=0, dead1=0, colony=0.0,
                        loot0=loot[0], loot1=0.0)
        remap = {old: new for new, (old, _) in enumerate(kept)}
        fleet[1] = [sh for _, sh in kept]
        side_pd[1] = [(c, remap[oi]) for c, oi in side_pd[1]
                      if oi in remap]
        fire_l[1] = [fire_l[1][old] for old, _ in kept]
        if wspec is not None and spec_side == 1 \
                and wspec_owner >= 0:
            # v3: Traeger-Index nachfuehren; rausgefilterter Traeger
            # = Waffe kaempft nicht mit (gemessen wie gezogen).
            wspec_owner = remap.get(wspec_owner, -1)

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
                    # v22 (Christophers Beschluss 5.11.2026): halved
                    # >=-Regel statt > (Spielmechanik: Zielspeed >=
                    # Angreiferspeed + Phase) — halved-Rate 14,0 -> 25,8 %
                    halved = sh['s'] + p <= tgt['s']
                    d = v9.half(base) if halved else base
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
                    if tgt['taken'] >= tgt['hp']:
                        tgt['dead'] = True
            # bewertete Waffe (Delta) eigene Schleife je Phase.
            # v3-Fix (5.11.2026, Christophers 13l-Design-Punkt): die
            # bewertete Waffe feuert NUR vom Traeger-Schiff (1 Instanz)
            # — v2 feuerte je Schiff mit eigener Muenze (ueberhoeht die
            # Waffen-Scores um E[Schiffe je Seite] ~2x gegenueber Karten,
            # die korrekt 1 Platzierung messen).
            if wspec is not None and u == spec_side:
                for i, sh in enumerate(own):
                    if i != wspec_owner or sh['dead']:
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
                        d = v9.half(base) if sh['s'] + p < tgt['s'] else base
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
                        if tgt['taken'] >= tgt['hp']:
                            tgt['dead'] = True
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
                colony=colony, loot0=loot[0], loot1=loot[1])


def acc_side(r, s):
    """Konto je Sicht. Sicht 0 = out - take - col + loot (+prevent 0).
    Sicht 1 = out - take + col + prevent: v4-Abfaenger-Konto
    (Christophers Beschluss 5.11.2026) — prevent = -loot0 = der
    Missionsloot, den die bewertete Karte dem Gegner VERHINDERT hat
    (bei Raid loot0=0). Schliesst die Missions-Asymmetrie: vorher
    zahlte nur der Missionar (+loot), Teilnahme des Abfaengers wurde
    mit mehr eigennem Schaden (take<0) bestraft."""
    if s == 0:
        return dict(out=r['dealt0'], take=-r['taken0'], col=-r['colony'],
                    loot=r['loot0'], prevent=0.0)
    return dict(out=r['dealt1'], take=-r['taken1'], col=r['colony'],
                loot=0.0, prevent=-r['loot0'])


def total(a):
    return a['out'] + a['take'] + a['col'] + a['loot']


def blank():
    return [dict(out=0.0, take=0.0, col=0.0, loot=0.0, prevent=0.0)
            for _ in (0, 1)]


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

if os.path.exists(CKPT_PATH):
    ck = json.load(open(CKPT_PATH, encoding='utf-8'))
    start = ck['iter']
    base.update(ck['base'])
    accW.update(ck['accW'])
    accC.update(ck['accC'])
    accWn.update(ck['accWn'])
    accCn.update(ck['accCn'])
    placedW.update(ck['placedW'])
    placedC.update(ck['placedC'])
    print(f'Resume bei Gefecht {start}/{N}')

for it in range(start, N):
    sc = draw_random_battle(random)
    r0 = battle_r(sc)
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
            a = acc_side(r, side)
            m = {k: a[k] - (a0 if side == 0 else a1)[k] for k in a}
            for k in m:
                accC[x['id']][side][k] += m[k]
    if (it + 1) % CKPT_EVERY == 0 or it == N - 1:
        # v23-Robustheitsfix (6.11.2026): with-Block statt offenem
        # Handler — ohne explizites close blieb der letzte Checkpoint
        # im Datei-Buffer und wurde bei Timeout-Kill abgeschnitten
        with open(CKPT_PATH, 'w', encoding='utf-8') as f:
            json.dump(dict(iter=it + 1, base=base, accW=accW, accC=accC,
                           accWn=accWn, accCn=accCn, placedW=placedW,
                           placedC=placedC), f)
        print(f'Gefecht {it + 1}/{N} (Checkpoint)', flush=True)

# ---------------- Auswertung ----------------
def score_of(acc, n, card, hp=0, units=None):
    if sum(n) == 0:
        return None
    if units is None:
        units = card['units']
    g = [(acc[s]['out'] + acc[s]['take'] + acc[s]['col']
          + acc[s]['loot'] + acc[s]['prevent']) / n[s]
         for s in (0, 1) if n[s] > 0]
    gain = sum(g) / len(g)
    # v23-Spielkosten (Christophers Beschluss 6.11.2026): statische
    # Kosten +1 auf ALLE Karten (Waffen UND Statkarten) — das Ausspielen
    # kostet die Karte selbst (1 Karte pro Typ pro Zug); ersetzt den
    # frueheren 0,5-Floor in weapon_units (raw+1 >= 1 immer).
    return (gain + HP_STATIC * hp) / (units + 1.0)


rows_w, rows_c = [], []
for x in ws:
    n_pl = [accWn[x['id']][s] for s in (0, 1)]
    sc_ = score_of(accW[x['id']], accWn[x['id']], x,
                    units=v11.weapon_units(x))
    rows_w.append(dict(id=x['id'], title=x['title'], rarity=x['rarity'],
                        score=round(sc_, 2) if sc_ is not None else None,
                        n_pl=n_pl))
for x in cs:
    sc_ = score_of(accC[x['id']], accCn[x['id']], x, hp=x['hp'])
    rows_c.append(dict(id=x['id'], title=x['title'], rarity=x['rarity'],
                       score=round(sc_, 2) if sc_ is not None else None))

# v20-Referenz
fc = json.load(open(os.path.join(HERE, 'frame_calibration.json'),
                    encoding='utf-8'))
v20 = {r['id']: r['score'] for r in fc['weapons']}
v20c = {r['id']: r['score'] for r in fc['cards']}


def spearman(a, b):
    import statistics
    pairs = [(x, y) for x, y in zip(a, b) if x is not None and y is not None]
    if len(pairs) < 3:
        return None
    def rank(v):
        s = sorted(range(len(v)), key=lambda i: v[i])
        r = [0] * len(v)
        i = 0
        while i < len(s):
            j = i
            while j + 1 < len(s) and v[s[j + 1]] == v[s[i]]:
                j += 1
            for k in range(i, j + 1):
                r[s[k]] = (i + j) / 2
            i = j + 1
        return r
    rx, ry = rank([p[0] for p in pairs]), rank([p[1] for p in pairs])
    mx, my = statistics.mean(rx), statistics.mean(ry)
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    den = (sum((a - mx) ** 2 for a in rx) ** 0.5
           * sum((b - my) ** 2 for b in ry) ** 0.5)
    return num / den if den else None


sw = spearman([r['score'] for r in rows_w],
              [v20.get(r['id']) for r in rows_w])
sc_r = spearman([r['score'] for r in rows_c],
                [v20c.get(r['id']) for r in rows_c])

med = {}
for rar in (1, 2, 3, 4, 5):
    wv = sorted(r['score'] for r in rows_w if r['rarity'] == rar
                and r['score'] is not None)
    cv = sorted(r['score'] for r in rows_c if r['rarity'] == rar
                and r['score'] is not None)
    med[rar] = dict(
        weapons=round(wv[len(wv) // 2], 2) if wv else None,
        cards=round(cv[len(cv) // 2], 2) if cv else None)

n_taken = []
out = dict(frame='v23: random battles (r13t probe v6, >=-halved, '
                 'Spielkosten +1 auf alle Karten, Draw-v2 '
                 '(Pflichtwaffe/Re-draw/b_lo-Fix), Flotte 1-5, '
                 'HP_STATIC 1.0), '
                 'card-count mirror, one battle type, col_rule always',
           n=N, baseline=dict(
               taken0=round(base['tk0'] / N, 2),
               taken1=round(base['tk1'] / N, 2),
               dealt0=round(base['dt0'] / N, 2),
               dealt1=round(base['dl1'] / N, 2),
               dead0=round(base['d0'] / N, 2),
               dead1=round(base['d1'] / N, 2),
               colony=round(base['col'] / N, 3),
               loot0=round(base['loot0'] / N, 2),
               raid_share=round(base['raid_n'] / N, 3),
               equip_per_side=round(base['equip'] / (2 * N), 2),
               fill_ratio=round(base['nfill'] / max(1, base['nsock']), 3),
               ships_per_side=round(base['ships'] / (2 * N), 2),
               hulls_per_side=round(base['hulls'] / (2 * N), 2),
               cards_b_per_side=round(base['b'] / N, 2),
               unequal_share=round(base['unequal'] / N, 3),
               cards_gap_avg=round(base['eq_gap'] / N, 3)),
           medians=med, spearman=dict(weapons_v20=round(sw, 3) if sw
                                      else None,
                                      cards_v20=round(sc_r, 3) if sc_r
                                      else None),
           weapons=rows_w, cards=rows_c)
# v23-Robustheitsfix (6.11.2026): with-Block statt offenem Handler
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

print(f"\n=== Zufallsgefechte-Sonde r13t (N={N}, M1, Kartenbudget-Spiegel, "
      f"1 Gefechtstyp) ===")
print(f"Baseline: taken0 {out['baseline']['taken0']:.2f} / taken1 "
      f"{out['baseline']['taken1']:.2f} / colony "
      f"{out['baseline']['colony']:.3f} / loot0 "
      f"{out['baseline']['loot0']:.2f} / Raid "
      f"{out['baseline']['raid_share']:.1%}")
print(f"Loadout: Ausruestung je Seite {out['baseline']['equip_per_side']:.2f}"
      f" Karten, Bestueckungsgrad {out['baseline']['fill_ratio']:.0%}"
      f" der Sockel, Schiffe {out['baseline']['ships_per_side']:.2f}"
      f"/Huellen {out['baseline']['hulls_per_side']:.2f}"
      f"/Karten gesamt {out['baseline']['cards_b_per_side']:.2f} je Seite")
print(f"Ungleiche Gefechte (Huellen ungleich): "
      f"{out['baseline']['unequal_share']:.1%}, "
      f"Karten-Differenz je Gefecht (Verwurf-Rest): "
      f"{out['baseline']['cards_gap_avg']:.3f}")
print(f"Mediane je Raritaet (Waffen / Karten):")
for rar in (1, 2, 3, 4, 5):
    print(f"  r{rar}: {med[rar]['weapons']} / {med[rar]['cards']}")
print(f"Spearman vs. v20: Waffen {sw:+.2f}, Karten {sc_r:+.2f}")
print('\nTop/Bottom Waffen:')
for r in sorted((r for r in rows_w if r['score'] is not None),
                key=lambda r: -r['score'])[:6]:
    print(f"  {r['id']:>3} r{r['rarity']} {r['title'][:24]:24} {r['score']:6.2f}")
for r in sorted((r for r in rows_w if r['score'] is not None),
                key=lambda r: r['score'])[:6]:
    print(f"  {r['id']:>3} r{r['rarity']} {r['title'][:24]:24} {r['score']:6.2f}")
print('\nKarten (alle):')
for r in sorted((r for r in rows_c if r['score'] is not None),
                key=lambda r: -r['score']):
    print(f"  {r['id']:>3} r{r['rarity']} {r['title'][:24]:24} {r['score']:6.2f}")
print(f"-> {os.path.basename(OUT_PATH)} geschrieben")
