#!/usr/bin/env python3
"""diag_v25b_r13t: v25b - Hullen-Benchmark (50 Hullen inkl. Stationen)
im Kampagnen-Frame v2 (Runde v25b, 9.11.2026).

Wahrung v25: Score = Delta-Kriegsbilanz (gamma=1: hp + col + ctrl +
dealt, Marker) je Platzierung / units. Hullen-units (H1-Konvention,
Christophers Entscheidung 8.11.2026): 1 + |E<0| + T(n), T(n) =
0/0,3/0,5 je Groesse (1-/2-/3-teilig); T(n)-Entscheidung fuer den
Kampagnen-Frame OFFEN (Christophers Beschluss ausstehend) -> beide
Varianten ausgewiesen: score_t (mit T(n)) und score_not (ohne;
T(n) ist reiner Divisor).

Methodik hspec (H1, diag_hullspec_h1_r13t.py) auf Kampagnen-Basis:
- bewertete Hulle ersetzt GROESSENERHALTEND ein Schiff der Flotte 0
  (Spin-Rotation ueber die Slots mit parts == n); spec_build erzwingt
  Xs Basis-Kombinatorik (Combo-Gewicht = Bottleneck min-rw), X setzt
  seine Position (fixed) bzw. Index 0 (Sektion mit Wiederholung).
- b_tot / E-Budget EINGEFROREN vom Baseline-Draw (Sockel-Angebot
  wirkt endogen ueber die Platzierung); Loadout-Neuzug der Flotte 0
  mit GLEICHEM Seed (Aenderungen nur am/ab Spec-Slot).
- Stationen (Orbitaler Aussenposten n1, Raumstation n2, Sternbasis
  n3, eff. Speed 0): Bewertung ueber BEIDE Serien (Christophers
  Klarstellung 9.11.): sie nehmen NIE an Missions-/Angriffs-Gefechten
  teil (isMissionReady speed > 0, card_stack.ts - weder Missionar,
  Raid-Angreifer noch Abfaenger), nur als Raid-Verteidiger; in der
  Missions-Serie entsteht damit endogen der reine Negativbeitrag.
- fire je Gefecht frisch je SCHIFF via Split-RNG (idx, k, Seite,
  uid) statt Flotten-RNG (v25-Konzept) -> CRN-Identitaet der
  Nicht-Spec-Schiffe auch bei Waffenzahl-Aenderungen.

Frame: H1j-Frame v2 exakt (2 getrennte Serien 50/50, persistente
Flotten 3-5 Schiffe je Seite, Bestueckung fix, Ende: Flotte leer /
Kolonie >= 50 (Raid) / |Control| >= 15 (Mission), Cap 24, Reparatur
vor eigenem Angreifergefecht, POOL auf #795-Zustand). Basis = reiner
Zufalls-Frame OHNE erzwungenen Kreuzer; Delta gegen Basis-Kampagne
derselben Zelle (perfekte CRN-Paarung, Seed 42).

Kursreferenz vorab NEU gemessen im #795-Frame (diag_campaign2,
N=2000): 1 sp ~= 24,4 HP (gamma=1, hp70-Anker; alt 25,5 pre-#795).

Checkpoint alle 25 Zellen. NIEMALS importieren (Top-Level-Messloop)!"""
import itertools
import json
import os
import random

import balancing_metric_v9 as v9
import balancing_metric_v10 as v10
import balancing_metric_v11 as v11

HERE = os.path.dirname(os.path.abspath(__file__))
CKPT_PATH = os.path.join(HERE, 'diag_v25b_ckpt_r13t.json')
OUT_PATH = os.path.join(HERE, 'diag_v25b_r13t.json')
N = int(os.environ.get('HULL_N', '3000'))
CKPT_EVERY = 25
CTRL_W = v11.CTRL_W
COLONY_HP = v11.COLONY_HP
PHASES = v11.PHASES

# --------------- #795-ZIELZUSTANDS-CHECK (VOR Messloop) -------------------
# Diese Runde misst im v25-Frame: cards.csv mit den #795-Energy-Dosen
# (109/126/161/223/304, s. diag_anchor_live_r13i.py), Hullen aber VOR
# den 17 Hullen-Dosen der Runden v25l-o (diese Baseline lief pre-Dosis;
# erst ab v25l steht der Dosen-Stand in der csv). Gegen die Ist-csv
# (pre-#795) oder die dosierte csv (post-v25l) ist der Messframe
# veraendert - der Lauf ueberschreibt das gepaarte Referenz-JSON (REF-
# Basis der Folgerunden) still mit abweichenden Daten. Deshalb VOR der
# Messung beides assertieren: Energy-Dosen AN, Hullen-Dosen AUS - genau
# der csv-Stand, gegen den diese Baseline gemessen wurde.
import csv as _csv_795


def _e_abs_795(v):
    """Energie-Feld der csv als |int| ('' und '0' zaehlen als 0)."""
    v = (v or '').strip()
    return abs(int(v)) if v not in ('', '0') else 0


ENERGY_DOSE_795 = {   # id -> #795-Zielenergie (abs) der csv-getragenen Dosen
    '109': 1, '126': 1, '161': 0, '223': 2, '304': 1,
}
HULL_PRE_DOSE = {     # id -> hp/socks VOR den Hullen-Dosen (Runden v25l-o)
    '329': dict(hp=7, socks={'b': 2, 'e': 1, 'g': 1}),
    '131': dict(hp=7, socks={'e': 2}),
    '134': dict(hp=9, socks={'b': 1, 'e': 2, 'g': 1}),
    '436': dict(hp=8, socks={'b': 1, 'e': 2}),
    '120': dict(hp=13, socks={'a': 1, 'd': 1, 'e': 1}),
    '116': dict(hp=9, socks={'a': 1, 'b': 1, 'e': 1}),
    '117': dict(hp=9, socks={'d': 2, 'e': 1}),
    '308': dict(hp=10, socks={'a': 2, 'b': 2, 'e': 1}),
    '348': dict(hp=5, socks={'b': 1, 'e': 1, 'g': 1}),
    '315': dict(hp=11, socks={'b': 1, 'e': 3}),
    '121': dict(hp=9, socks={'b': 2, 'e': 1}),
    '326': dict(hp=12, socks={'a': 2, 'e': 1, 'f': 1}),
    '327': dict(hp=8, socks={'e': 2, 'f': 1, 'g': 1}),
    '221': dict(hp=8, socks={'a': 2, 'e': 1, 'f': 1}),
    '226': dict(hp=7, socks={'e': 1, 'f': 1}),
    '306': dict(hp=15, socks={'b': 1, 'e': 1}),
    '102': dict(hp=17, socks={'a': 1, 'b': 2, 'd': 1, 'e': 3}),
}
_rows_795 = {}
with open(v9.CARDS_CSV, newline='', encoding='utf-8') as _f_795:
    for _r_795 in _csv_795.DictReader(_f_795, delimiter=';', quotechar='"'):
        _rows_795[_r_795['id']] = _r_795
for _cid_795, _want_795 in ENERGY_DOSE_795.items():
    _got_795 = _e_abs_795(_rows_795.get(_cid_795, {}).get('energy'))
    assert _got_795 == _want_795, (
        'csv nicht im #795-Zielzustand (Energie-Dosis)', _cid_795,
        _got_795, _want_795)
for _cid_795, _soll_795 in HULL_PRE_DOSE.items():
    _r_795 = _rows_795.get(_cid_795)
    assert _r_795 is not None, ('csv-Hulle fehlt', _cid_795)
    _socks_795 = {}
    for _c_795 in ('socket_a', 'socket_b', 'socket_d', 'socket_e',
                   'socket_f', 'socket_g'):
        _v_795 = _r_795[_c_795]
        if _v_795 and _v_795.lstrip('-').isdigit() and int(_v_795) > 0:
            _socks_795[_c_795.replace('socket_', '')] = int(_v_795)
    assert int(_r_795['hp']) == _soll_795['hp'] \
        and _socks_795 == _soll_795['socks'], (
        'csv nicht im pre-Dosis-Hullen-Zustand (v25l-o-Dosen draussen)',
        _cid_795, int(_r_795['hp']), _socks_795)

# ============ kopiert aus diag_random_r13t.py (Stand 8.11.2026) ===========
# --- Karten-Pools mit Sockelbedarf ------------------------------------
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
# Waffenpool fuer Draw-v2-Pflichtwaffe (Christophers Vorgabe 5.11.2026)
WPIDX = [i for i, p in enumerate(POOL) if p['kind'] == 'w']
_WPT = sum(PPROB[i] for i in WPIDX)
WPPROB = [PPROB[i] / _WPT for i in WPIDX]

cpools = [(cpl, p) for cpl, p in v9.COLONY]
cptot = sum(p for _, p in cpools)


def draw_random_fleet(types_by_n, rng, nmin=1, nmax=5):
    """Christophers Varianz-Auftrag (5.11.2026): Flottengroesse
    UNABHAENGIG 1..5 Schiffe je Seite (v23b; urspruenglich 1..3,
    Zwischenschritt 1..4), Schiffsgröße je Schiff
    uniform 1..3 Sektionen (Huellen-Karten 1..9), Typ zweistufig
    wie v11 (TYPE_BEST x Build-Gewicht). Ungleich grosse Flotten
    entstehen endogen (kleinere Flotte -> mehr Ausruestung, die
    Karten-SUMME bleibt ueber B gleich)."""
    fleet = []
    for _ in range(rng.randint(nmin, nmax)):   # v23b: 1-5; Kampagne: 3-5
        # (Christophers Beschluss 5.11.2026: Playtest-Dichte — Tote/
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
    """Draw-v2 (Christophers Vorgaben 5.11.2026):
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
    # 8.11.2026 Frame-Bug #5 (13t-Serie): free nach INDEX schluesseln,
    # nicht nach id(b) — draw_random_fleet liefert Build-Dicts als
    # Objektreferenzen; bei Aliasing (2 Slots ziehen denselben Build,
    # 13% der Flotten) teilten sich Schiffe EINEN Sockel-Pool und
    # wurden unterbestueckt (Bestueckungsgrad 41.7% -> 42.3% im A/B).
    for i, b in enumerate(fleet):
        free[i] = free_socks(b)
        ships.append(dict(build=b, weapons=[], cards=[], pdc=[],
                          hp_add=0, sp_add=0))
    placed = 0
    for i in range(len(fleet)):
        for _ in range(300):
            w = POOL[rng.choices(WPIDX, weights=WPPROB)[0]]
            if all(free[i].get(t, 0) >= n
                   for t, n in w['req'].items()):
                place(w['req'], free[i])
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
            if place(card['req'], free[i]):
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




def battle_r(sc, wf=None, ispec_col=None, col_start=0.0):
    """Gefecht im Zufalls-Frame. Seite 0 = deff (Verteidiger),
    Seite 1 = att (Raid-Angreifer). spin = deterministische Trager-
    Rotation der bewerteten Karte (CRN-sicher, kein random im
    Gefecht). Rueckgabe full-Konten.
    I1-ispec (6.11.2026, Infrastruktur Spur K): ispec_col = bewertete
    Kolonie-Defensiv-Karte ({type,points,recharge}), angelegt an die
    Koloniezone von Seite 0 (planetar, Sockel entfallen an der Kolonie);
    nur in Raid-Zellen aktiv (Mission: colpool None, Karte sitzt
    wirkungslos, Zaehlung bleibt — Koedersystem-Präzedenz).
    Umgebungs-Abstraktion wie cpools: frische Kopie je Angriff, keine
    Verbrauchs-/Deaktivierungs-Semantik (dokumentierte Frame-Grenze).
    Default ohne ispec_col bit-identisch (optionaler Parameter)."""
    # deep-enough Kopie der Schiffs-Loadouts
    def cp_list(lst):
        return [dict(s, weapons=[dict(w) for w in s['weapons']],
                     cards=[dict(c) for c in s['cards']])
                for s in lst]
    sides = [cp_list(sc['deff']), cp_list(sc['att'])]
    raid = sc['raid']
    colpool = sc['colpool']
    # I1-ispec: bewertete Kolonie-Defensiv-Karte an Koloniezone Seite 0
    if ispec_col is not None and colpool is not None:
        colpool = list(colpool) + [dict(ispec_col)]
    # 13p-PD-Bezahlung der bewerteten Waffe (LOKAL je battle_r-Aufruf,
    # v5-Fix 5.11.2026: PAY war global und wurde VOR dem eigenen Append
    # gelesen -> eigene Zahlung landete erst im NAECHSTEN battle_r-Aufruf
    # (Cross-Kontamination zwischen Messzellen, TAKE der bewerteten
    # PD-Waffen -0,00, r0-Baselines des Folgeschachts verfaelscht;
    # entlarvt durch Christophers PD-Gutschrift-Nachfrage 5.11.2026).
    pay = []
    colony = col_start
    dealt = [0.0, 0.0]
    taken = [0.0, 0.0]
    dead = [0, 0]
    loot = [0.0, 0.0]

    # v25a: Die bewertete Karte sitzt PERSISTENT im Ship-Dict des
    # Traegers (Kampagnen-Persistenz; Platzierung + Sockelpruefung
    # erfolgten beim Serien-Start via pick_carrier):
    # - Statkarte/Reparatur: in s['cards'] (+ hp_add/sp_add bereits
    #   beim Serien-Start gebucht) -> volle Umgebungs-Semantik
    #   (Defense-Pool, resolve_attack, recharge).
    # - Waffe: s['wspec']-Marker (feuert separat als ERSTE der Phase,
    #   NICHT in weapons -> fire-Indizes unveraendert, CRN-identisch
    #   zur Basis-Kampagne; Munzen via wf-Parameter je Schiff).
    wspec = None
    spec_side = 0
    wspec_owner = -1
    for u in (0, 1):
        for i, s in enumerate(sides[u]):
            if 'wspec' in s:
                wspec = s['wspec']
                spec_side = u
                wspec_owner = i
    # --- 13p-PD-Bezahlung (Christophers Beschluss 4.11.): die
    # bewertete WAFFE zahlt ihre Defensivpunkte (abm u. a.) je
    # Traeger-Schiff in den Flotten-Defense-Pool (recharge 'phase'
    # = PerRound, Prioritaet via v9.RECHARGE). ---
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
                           ctrl=b['ctrl'] + s.get('ctrl_add', 0),
                           dead=False, taken=0.0,
                           cards=cards, weapons=s['weapons']))
        fleet.append(fl)

    fire_l = [list(sc['fire'][0]), list(sc['fire'][1])]
    kmap = list(range(len(sides[1])))   # Original-Index je filtered[1]
    # Missions-Abfang-Ausduennung (12c): Angreifer mit speed < s0min
    # kommen nicht mit; ohne Abfaenger: kein Gefecht, volle Kontrolle.
    if not raid:
        s0min = min(sh['s'] for sh in fleet[0])
        kept = [(i, sh) for i, sh in enumerate(fleet[1])
                if sh['s'] >= s0min]
        if not kept:
            loot[0] = CTRL_W * sum(sh['ctrl'] for sh in fleet[0])
            return dict(
                taken0=0.0, taken1=0.0, dealt0=0.0, dealt1=0.0,
                dead0=0, dead1=0, colony=col_start,
                loot0=loot[0], loot1=0.0,
                rest0=[(sh['taken'], sh['dead']) for sh in fleet[0]],
                rest1=[(sh['taken'], sh['dead']) for sh in fleet[1]],
                ctrl_alive0=sum(sh['ctrl'] for sh in fleet[0]
                               if not sh['dead']),
                ctrl_alive1=sum(sh['ctrl'] for sh in fleet[1]
                                if not sh['dead']),
                kmap=None, no_intercept=True)
        remap = {old: new for new, (old, _) in enumerate(kept)}
        kmap = remap
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
        # v23d (Christophers Beschluss 5.11.2026): die bewertete Waffe
        # feuert als ERSTE der Phase, VOR allen Umgebungsschuessen
        # (vorher eigene Schleife NACH den Umgebungswaffen) — bei Abzug X
        # bleibt die Defense-Karte aktiv, und die Umgebungsschuesse
        # derselben Phase treffen dann auf die aktive Karte (Christophers
        # X-Semantik wird damit metrisch wirksam). Ausserdem >=-Fix im
        # wspec-Pfad: die v22->=-Umstellung war hier uebersehen worden
        # (alte >-Regel "<" statt "<=" — bewertete Waffen seit v22 zu
        # selten halbiert, Scores leicht ueberhoeht).
        if wspec is not None:
            own, enemy = fleet[spec_side], fleet[1 - spec_side]
            e_pd = [(c, oi) for c, oi in side_pd[1 - spec_side]
                    if not enemy[oi]['dead']]
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
                    d = v9.half(base) if sh['s'] + p <= tgt['s'] else base
                    pool = tgt['cards'] + [c for c, _ in e_pd]
                    col_dec = False
                    if raid and spec_side == 1 and p == 1 \
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
                    dealt[spec_side] += dmg
                    if tgt['taken'] >= tgt['hp']:
                        tgt['dead'] = True
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
                colony=colony, loot0=loot[0], loot1=loot[1],
                rest0=[(sh['taken'], sh['dead']) for sh in fleet[0]],
                rest1=[(sh['taken'], sh['dead']) for sh in fleet[1]],
                ctrl_alive0=sum(sh['ctrl'] for sh in fleet[0]
                               if not sh['dead']),
                ctrl_alive1=sum(sh['ctrl'] for sh in fleet[1]
                                if not sh['dead']),
                kmap=kmap, no_intercept=False)




# ---------------- v25b: Bewertungsobjekte = 50 Hullen ----------------
def load_hulls():
    """50 Hullen-Karten aus cards.csv (wie v11.ship_builds-Filter, plus
    id/rarity/E: die v11-Builds behalten keine Karten-Identitaet).
    Kopiert aus diag_hullspec_h1_r13t.py (Stand 8.11.2026)."""
    hs = []
    with open(v9.CARDS_CSV, newline='', encoding='utf-8') as f:
        import csv as _csv
        for r in _csv.DictReader(f, delimiter=';', quotechar='"'):
            if not (r['implemented'] == 'yes' and r['type'] == 'hull'
                    and r['rarity'] and int(r['hp'] or 0) > 0):
                continue
            e = int(r['energy']) if (r['energy']
                                     and r['energy'].lstrip('-').isdigit()) else 0
            hs.append(dict(
                id=r['id'], title=r['title'], tags=r['tags'],
                rarity=int(r['rarity']), hp=int(r['hp']),
                ctrl=int(r['control']) if r['control'] else 0,
                speed=int(r['speed']) if r['speed'] else 0,
                rw=v11.RW[int(r['rarity'])], socks=v11._socks(r),
                energy=-e if e < 0 else 0))
    return hs


HULLS = load_hulls()
for X in HULLS:
    if X['tags'].startswith('Komponenten'):
        X['base'] = X['title'].split(' (')[0].strip()
        X['pos'] = (X['title'].split('(')[-1].rstrip(')').strip()
                    if '(' in X['title'] else None)
    else:
        X['base'] = X['title']
        X['pos'] = None

_parts = {}
for X in HULLS:
    if X['tags'].startswith('Komponenten'):
        _parts.setdefault(X['base'], []).append(X)
BASES = {}
for base, cards in _parts.items():
    inner = cards[0]['tags']
    inner = inner[inner.index('(') + 1:inner.rindex(')')]
    if 'Sektion' in inner:
        n = int(inner.split('x')[0].strip())
        combos = list(itertools.combinations_with_replacement(cards, n))
        BASES[base] = dict(n=n, kind='sec', combos=combos,
                           weights=[min(c['rw'] for c in cmb)
                                    for cmb in combos])
    else:
        req = [p.strip() for p in inner.split(',')]
        by_part = {}
        for c in cards:
            by_part.setdefault(c['pos'], []).append(c)
        combos = list(itertools.product(*[by_part[p] for p in req]))
        BASES[base] = dict(n=len(req), kind='fixed', req=req, combos=combos,
                           weights=[min(c['rw'] for c in cmb)
                                    for cmb in combos])
for X in HULLS:
    if X['pos'] is None and not X['tags'].startswith('Komponenten'):
        X['n'] = 1
    else:
        X['n'] = BASES[X['base']]['n']
    # H1-Kosten FIXIERT (Christophers Entscheidung 8.11.2026):
    # units = 1 + |E| + T(n), T(n) = 0 / 0,3 / 0,5 je Groesse.
    # T(n)-Behalt-Entscheidung fuer den Kampagnen-Frame OFFEN ->
    # beide Varianten ausgewiesen (T(n) ist reiner Divisor).
    X['units_t'] = round(1.0 + X['energy']
                         + {1: 0.0, 2: 0.3, 3: 0.5}[X['n']], 4)
    X['units_not'] = round(1.0 + X['energy'], 4)
    X['station'] = X['base'] not in v11.MISSION_TYPES[X['n']]


def pick_slot(sc0, n, it):
    """Groessenerhaltender Slot: Schiffe mit parts == n, spin-rotiert
    (Seite 0, wie v25a-Bewertung)."""
    cands = [i for i, sh in enumerate(sc0['deff'])
             if sh['build']['parts'] == n]
    if not cands:
        return None
    return cands[it % len(cands)]


def spec_build(X, idx):
    """Erzwungener Build: Combo aus Xs Basis-Kombinatorik (Gewicht =
    Bottleneck min-rw, statistisch identisch zu v11s gemergten Builds),
    X ersetzt seine Position (fixed) bzw. Index 0 (Sektion mit
    Wiederholung); Einteiler: Build = X selbst. Speed = SUMME (Fix).
    Kopiert aus diag_hullspec_h1_r13t.py, Seite 0 fix (v25a-Konvention)."""
    rng = random.Random(1_000_003 * idx + 97 * int(X['id']) + 11)
    if not X['tags'].startswith('Komponenten'):
        return dict(hp=X['hp'], s=X['speed'], parts=1,
                    socks=dict(X['socks']), w=X['rw'],
                    type=X['base'], ctrl=X['ctrl'])
    B = BASES[X['base']]
    cmb = list(rng.choices(B['combos'], weights=B['weights'])[0])
    if B['kind'] == 'fixed':
        cmb[B['req'].index(X['pos'])] = X
    else:
        cmb[0] = X
    socks = {}
    for c in cmb:
        for t, k in c['socks'].items():
            socks[t] = socks.get(t, 0) + k
    return dict(hp=sum(c['hp'] for c in cmb),
                s=sum(c['speed'] for c in cmb),
                parts=B['n'], socks=socks,
                w=min(c['rw'] for c in cmb), type=X['base'],
                ctrl=sum(c['ctrl'] for c in cmb))


def make_variant(idx, sc0, build, slot):
    """Varianten-Startzustand: Spec-Build ersetzt Flotte-0-Slot;
    b_tot/E-Budget EINGEFROREN (H1-Spiegel-B-Prinzip), Loadout-Neuzug
    mit GLEICHEM Seed (Aenderungen nur am/ab Spec-Slot, Bug-#5-Fix:
    free nach INDEX); Seite 1 unangetastet (CRN-identisch)."""
    fleet_b = list(sc0['fleets'][0])
    fleet_b[slot] = build
    deff_v = draw_loadout(fleet_b, sc0['e'],
                          random.Random(1_000_003 * idx + 2))
    for i_, s_ in enumerate(deff_v):
        s_['uid'] = i_
    att = [dict(s) for s in sc0['att']]
    return dict(sc0, deff=deff_v, att=att)

# ---------------- Kampagnen-Helfer ----------------
def make_campaign_battle(idx):
    """Startzustand je idx: BEIDE Flotten aus MISSION_TYPES (Kampagne
    hat Rotation M,M,R,R statt Raid-Muenze; Stationen nicht bewertet).
    CRN-Seeds analog make_battle: s(1) fleets, s(10) budget,
    s(2)/s(3) Loadouts, s(4)..s(7) fire/wf dummy fuer spec_scenario."""
    def s(k):
        return random.Random(1_000_003 * idx + k)
    fleet_rng, b_rng = s(1), s(10)
    # Christophers Vorgabe 9.11.2026 (Kampagnen): 3-5 Schiffe je
    # Seite — 1-Schiff-Kampagnen degenerieren unter Persistenz
    # (ein Tod = Serie vorbei), Kleingefechte entstehen mit
    # fortschreitender Kampagne ohnehin endogen
    deff_b = draw_random_fleet(v11.MISSION_TYPES, fleet_rng, 3, 5)
    att_b = draw_random_fleet(v11.MISSION_TYPES, fleet_rng, 3, 5)
    h0 = sum(b['parts'] for b in deff_b)
    h1 = sum(b['parts'] for b in att_b)
    s0 = sum(sum(b['socks'].values()) for b in deff_b)
    s1 = sum(sum(b['socks'].values()) for b in att_b)
    b_lo = max(h0, h1) + max(len(deff_b), len(att_b))
    b_hi = min(h0 + s0, h1 + s1)
    b_tot = b_rng.randint(b_lo, b_hi) if b_hi > b_lo else b_lo
    deff = draw_loadout(deff_b, b_tot - h0, s(2))
    att = draw_loadout(att_b, b_tot - h1, s(3))

    def coins(nweap_per, rng):
        return [[[rng.random() < v10.ATTACK_PROB[p] for p in PHASES]
                 for _ in range(n)] for n in nweap_per]
    # v25b: fire/wf/order zieht campaign_mode je Gefecht frisch
    # (per-Ship-Split-RNG) -> Start-Coins hier unnoetig; uid-Tags
    # fuer die stabilen per-Ship-Muenz-Stroeme.
    for i_, s_ in enumerate(deff):
        s_['uid'] = i_
    for i_, s_ in enumerate(att):
        s_['uid'] = i_
    return dict(att=att, deff=deff, raid=False, colpool=None,
                fire=None, wf=None, order=None, e=b_tot - h0,
                hulls=(h0, h1), socks=(s0, s1), b=b_tot,
                fleets=(deff_b, att_b))


def draw_colpool(idx, which):
    """Kolonie-Defensivpool je Seite (A=0, B=1), fix je Serie."""
    rng = random.Random(1_000_003 * idx + 11 + which)
    return cpools[rng.choices(range(len(cpools)),
                              weights=[p / cptot for _, p in cpools])[0]][0]


# Reparaturkarten (servercode equipment_util_cards.ts verifiziert:
# Card104 Reparaturnaniten repairDamage 10, Card325
# Selbstreparierender Torso repairDamage 2; Regel: repariert das
# Schiff vor dem eigenen Angreifergefecht, NICHT vor dem
# Verteidigergefecht - Christophers Vorgabe 9.11.2026). Beide sind
# NICHT im Umgebungs-POOL (v9.FINAL 34 Karten), d.h. wirken nur,

REPAIR = {325: 2.0, 104: 10.0}


def rep_of(loadout):
    # v25c: Variante kann kartenlokalen 'rep'-Override tragen
    # (325rep4: 4.0; 104full: inf -> ALLEN Schaden jede Runde
    #  reparieren, Christophers Regel-Aenderung 9.11.2026)
    tot = 0.0
    for c in loadout['cards']:
        if isinstance(c, dict) and 'rep' in c:
            tot += c['rep']
        else:
            tot += REPAIR.get(c.get('id'), 0.0)
    return tot



def campaign_mode(idx, sc0, mode):
    """Eine Kampagne im Modus 'mission' (NUR Missionen) oder
    'raid' (NUR Raids); Angreifer/Verteidiger wechseln je Gefecht
    (Christophers H1j-Rotation). Kanal-Rueckgabe getrennt, GAMMA
    steckt erst in der Auswertung.

    v25b-Aenderungen ggU. v25a/v25e:
    - Keine bewertete Karte/Waffe: der Varianten-Zustand steckt schon
      in sc0['deff'] (make_variant).
    - fire je Gefecht frisch je SCHIFF via Split-RNG (idx, k, Seite,
      uid) statt Flotten-RNG (v25-Konzept) -> CRN-Identitaet der
      Nicht-Spec-Schiffe auch bei Waffenzahl-Aenderungen.
    - Stationen (eff. Speed 0): nie Missionar/Raid-Angreifer/
      Abfaenger (isMissionReady speed > 0); nur Raid-Verteidiger.
      In der Missions-Serie nie im Gefecht -> endogener
      Negativbeitrag (Christophers Klarstellung 9.11.)."""
    ships = [[dict(orig=s, cum=0.0, dead=False, repair=rep_of(s),
                   uid=s['uid']) for s in sc0['deff']],
             [dict(orig=s, cum=0.0, dead=False, repair=rep_of(s),
                   uid=s['uid']) for s in sc0['att']]]
    col = [0.0, 0.0]
    kum = 0.0
    dealt = [0.0, 0.0]
    pools = [draw_colpool(idx, 0), draw_colpool(idx, 1)]
    nb = 0
    end_reason = 'cap'

    # Stations-Filter: NUR Build-Speed 0 (Stationen). Ausruestungs-
    # verlangsamte Schiffe (eff. Speed 0 via sp-1-Karten) bleiben im
    # v25a-Verhalten (reiten mit und kaempfen; Baseline-Kontinuitaet
    # zu v25a/v25e, keine leeren Flotten moeglich: Flotte 0 hat im
    # Stations-Fall >= 2 normale Schiffe, Flotte 1 nie Build-Speed 0).

    def fire_coins(lo_side, off):
        out = []
        for sh in lo_side:
            # v25b-Fix: Seed ueber RUNDEN-Index k statt Gefechts-
            # zaehler nb (nb kann zwischen baseline und variante
            # divergieren, wenn in einer Runde allow_m/allow_att leer
            # ist und die Runde geskippt wird -> CRN-Paarung bricht;
            # k ist deterministisch, CRN bleibt zellgepaart)
            rng = random.Random(1_000_003 * idx + 7919 * k
                                + off + 71 * sh['uid'])
            out.append([[rng.random() < v10.ATTACK_PROB[p] for p in PHASES]
                        for _ in sh['weapons']])
        return out

    def upd2(flst, rl, idx_map, kmap=None):
        """rl: (taken, dead) je Gefechts-Schiffsindex; idx_map:
        Gefechtslisten-Index -> persistenter Flottenindex; kmap
        (dict): battle-Duennung {att-Listen-Index: duenn-Index}."""
        if kmap is None:
            pairs = [(idx_map[bi], r) for bi, r in enumerate(rl)]
        else:
            inv = {v: k for k, v in kmap.items()}
            pairs = [(idx_map[inv[bi]], r) for bi, r in enumerate(rl)]
        for pi, (tk, dead) in pairs:
            flst[pi]['cum'] += tk
            if dead:
                flst[pi]['dead'] = True

    for k in range(24):
        if not ships[0] or not ships[1]:
            end_reason = 'fleet_dead'
            break
        if mode == 'raid' and (col[0] >= COLONY_HP
                               or col[1] >= COLONY_HP):
            end_reason = 'colony'
            break
        if mode == 'mission' and abs(kum) >= 15:
            end_reason = 'control'
            break
        # Reparatur VOR dem eigenen Angreifergefecht (offensive
        # Seite der Gefecht-Rolle), nicht vor dem Verteidigergefecht
        off = 0 if k % 2 == 0 else 1
        for st in ships[off]:
            if st['repair'] > 0 and st['cum'] > 0:
                st['cum'] = max(0.0, st['cum'] - st['repair'])
        # persistente Bestueckung: cum als negativer hp_add
        lo = [[dict(st['orig'],
                    hp_add=st['orig'].get('hp_add', 0.0) - st['cum'])
               for st in fl] for fl in ships]
        order = (0, 1) if random.Random(
            1_000_003 * idx + 7919 * k + 5).random() < 0.5 else (1, 0)
        if mode == 'mission':
            m = 0 if k % 2 == 0 else 1    # Missionar wechselt
            a = 1 - m                     # Abfaenger-Flotte
            # Stationen koennen weder Missionar noch Abfaenger
            allow_m = [i for i, s in enumerate(lo[m])
                       if s['build']['s'] >= 1]
            allow_a = [i for i, s in enumerate(lo[a])
                       if s['build']['s'] >= 1]
            # v25b-Fix (leerer Missions-Fleet-Edge-Case): Missionar-
            # Flotte hat keine einsatzbereiten Schiffe mehr (nur noch
            # Stationen am Leben) -> kein Gefecht, kein Missionslohn
            # diese Runde; kein nb-Increment (CRN-Stabilitaet, s.
            # fire_coins-Fix). allow_a leer ist kein Crash-Fall:
            # battle_r liefert den no_intercept-Zweig (Missionar
            # bekommt vollen Control-Gewinn ohne Gefecht).
            if not allow_m:
                continue
            fire_m = [fire_coins([lo[m][i] for i in allow_m], 402),
                      fire_coins([lo[a][i] for i in allow_a], 403)]
            sc_k = dict(deff=[lo[m][i] for i in allow_m],
                        att=[lo[a][i] for i in allow_a],
                        raid=False, colpool=None,
                        fire=fire_m,
                        order=order,
                        e=0, hulls=(0, 0), socks=(0, 0), b=0,
                        fleets=([], []))
            r = battle_r(sc_k)
            gain = (r['ctrl_alive0'] if r['no_intercept']
                    else max(0.0, r['ctrl_alive0'] - r['ctrl_alive1']))
            kum += gain if m == 0 else -gain
            dealt[m] += r['dealt0']
            dealt[a] += r['dealt1']
            upd2(ships[m], r['rest0'], allow_m)
            km = r['kmap'] if isinstance(r['kmap'], dict) else None
            upd2(ships[a], r['rest1'], allow_a, km)
        else:
            attacker = 0 if k % 2 == 0 else 1
            d = 1 - attacker
            # Raid-Angreifer muessen flugbereit sein; Verteidiger
            # darf Stationen enthalten (Kolonie-Verteidiger-Pfad)
            allow_att = [i for i, s in enumerate(lo[attacker])
                         if s['build']['s'] >= 1]
            # v25b-Fix (defensiv, analog Missions-Zweig): Angreifer-
            # Flotte ohne einsatzbereite Schiffe -> kein Raid-Gefecht
            # diese Runde (sollte laut Stations-Verteilung nicht
            # vorkommen, aber deterministisch statt Crash)
            if not allow_att:
                continue
            allow_d = list(range(len(lo[d])))
            fire_r = [fire_coins([lo[d][i] for i in allow_d],
                                 402 if d == 0 else 403),
                      fire_coins([lo[attacker][i] for i in allow_att],
                                 403 if attacker == 1 else 402)]
            sc_k = dict(deff=[lo[d][i] for i in allow_d],
                        att=[lo[attacker][i] for i in allow_att],
                        raid=True, colpool=pools[d],
                        fire=fire_r,
                        order=order, e=0, hulls=(0, 0), socks=(0, 0),
                        b=0, fleets=([], []))
            r = battle_r(sc_k, col_start=col[d])
            col[d] = r['colony']
            dealt[d] += r['dealt0']
            dealt[attacker] += r['dealt1']
            upd2(ships[d], r['rest0'], allow_d)
            upd2(ships[attacker], r['rest1'], allow_att)
        nb += 1
        ships[0] = [st for st in ships[0] if not st['dead']]
        ships[1] = [st for st in ships[1] if not st['dead']]

    def resthp(fl):
        return sum(st['orig']['build']['hp']
                   + st['orig'].get('hp_add', 0.0) - st['cum']
                   for st in fl)
    hpA, hpB = resthp(ships[0]), resthp(ships[1])
    return dict(
        hp=hpA - hpB,
        col=(col[1] - col[0]) if mode == 'raid' else 0.0,
        ctrl=CTRL_W * kum if mode == 'mission' else 0.0,
        dealt=dealt[0] - dealt[1],
        nb=nb, end=end_reason, mode=mode,
        n_alive=(len(ships[0]), len(ships[1])))


# ---------------- Messung mit Checkpoint ----------------
random.seed(42)
start = 0
MODES = ('mission', 'raid')


def obj_blank():
    return dict(n_pl=0, hp=0.0, col=0.0, ctrl=0.0, dealt=0.0, cells=[])


acc = {X['id']: obj_blank() for X in HULLS}
bacc = dict(n=0, hp=0.0, col=0.0, ctrl=0.0, dealt=0.0,
            nb={'mission': 0.0, 'raid': 0.0},
            end={'mission': dict(fleet_dead=0, colony=0, control=0, cap=0),
                 'raid': dict(fleet_dead=0, colony=0, control=0, cap=0)})

if os.path.exists(CKPT_PATH):
    ck = json.load(open(CKPT_PATH, encoding='utf-8'))
    start = ck['iter']
    acc.update(ck['acc'])
    bacc.update(ck['bacc'])
    print(f'Resume bei Zelle {start}/{N}')

for it in range(start, N):
    sc0 = make_campaign_battle(it)
    bruns = {}
    for mode in MODES:
        rb = campaign_mode(it, sc0, mode)
        bruns[mode] = rb
        bacc['hp'] += 0.5 * rb['hp']
        bacc['col'] += 0.5 * rb['col']
        bacc['ctrl'] += 0.5 * rb['ctrl']
        bacc['dealt'] += 0.5 * rb['dealt']
        bacc['nb'][mode] += rb['nb']
        bacc['end'][mode][rb['end']] += 1
    bacc['n'] += 1
    for X in HULLS:
        slot = pick_slot(sc0, X['n'], it)
        if slot is None:
            continue
        build = spec_build(X, it)
        scv = make_variant(it, sc0, build, slot)
        d = acc[X['id']]
        d['n_pl'] += 1
        cellm = 0.0
        for mode in MODES:
            r = campaign_mode(it, scv, mode)
            rb = bruns[mode]
            dh = r['hp'] - rb['hp']
            dc = r['col'] - rb['col']
            dk = r['ctrl'] - rb['ctrl']
            dd = r['dealt'] - rb['dealt']
            d['hp'] += 0.5 * dh
            d['col'] += 0.5 * dc
            d['ctrl'] += 0.5 * dk
            d['dealt'] += 0.5 * dd
            cellm += 0.5 * (dh + dc + dk + dd)
        d['cells'].append(cellm)
    if (it + 1) % CKPT_EVERY == 0 or it == N - 1:
        with open(CKPT_PATH + '.tmp', 'w', encoding='utf-8') as f:
            json.dump(dict(iter=it + 1, acc=acc, bacc=bacc), f)
        os.replace(CKPT_PATH + '.tmp', CKPT_PATH)
        print(f'Zelle {it + 1}/{N} (Checkpoint)', flush=True)

# ---------------- Auswertung ----------------
import statistics as _st
bn = max(1, bacc['n'])
base_stats = dict(
    n=bacc['n'],
    o_gefechte={m: round(bacc['nb'][m] / bn, 2) for m in MODES},
    end_dist={m: {k: round(v / bn, 3)
                  for k, v in bacc['end'][m].items()} for m in MODES},
    o_hp=round(bacc['hp'] / bn, 2), o_dealt=round(bacc['dealt'] / bn, 2),
    o_col=round(bacc['col'] / bn, 2), o_ctrl=round(bacc['ctrl'] / bn, 2))

rows = []
for X in HULLS:
    d = acc[X['id']]
    n = max(1, d['n_pl'])
    m = (d['hp'] + d['col'] + d['ctrl'] + d['dealt']) / n
    cells = d['cells']
    se = _st.stdev(cells) / (len(cells) ** 0.5) if len(cells) > 1 else None
    rows.append(dict(
        id=X['id'], title=X['title'], base=X['base'], pos=X['pos'],
        n=X['n'], rarity=X['rarity'], hp=X['hp'], speed=X['speed'],
        energy=X['energy'], station=X['station'],
        units_t=X['units_t'], units_not=X['units_not'], n_pl=d['n_pl'],
        d_hp=round(d['hp'] / n, 3), d_col=round(d['col'] / n, 3),
        d_ctrl=round(d['ctrl'] / n, 3), d_dealt=round(d['dealt'] / n, 3),
        margin=round(m, 3),
        score_t=round(m / X['units_t'], 3),
        score_not=round(m / X['units_not'], 3),
        se_margin=round(se, 3) if se else None))

frame = ('v25b-Hullen-Benchmark (9.11.2026): 50 Hullen inkl. Stationen '
         'im Kampagnen-Frame v2 (H1j exakt: 2 Serien 50/50, 3-5-Schiff-'
         'Flotten, gamma=1, Score = Delta-Kriegsbilanz je Platzierung / '
         'units). hspec-Methodik: groessenerhaltender Slot auf Flotte 0 '
         '(Spin), spec_build erzwingt Xs Basis-Combo, b_tot/E eingefroren, '
         'Loadout-Neuzug mit gleichem Seed. Stationen ueber BEIDE Serien '
         '(nie Missionar/Raid-Angreifer/Abfaenger, nur Raid-Verteidiger; '
         'Missions-Serie = endogener Negativbeitrag). fire per-ship '
         'Split-RNG (uid). T(n)-Entscheidung offen: score_t (T(n) = '
         '0/0,3/0,5) und score_not (ohne T(n)) beide ausgewiesen. '
         'Kursreferenz #795-Frame vorab neu gemessen: 1 sp = 24,4 HP '
         '(gamma=1, hp70-Anker, diag_campaign2 N=2000).')

out = dict(frame=frame, N=N, n_zellen=bacc['n'], base=base_stats, rows=rows)
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=1, ensure_ascii=False)

print('Basis: n=%d | Gefechte mission=%.2f raid=%.2f'
      % (bacc['n'], bacc['nb']['mission'] / bn, bacc['nb']['raid'] / bn))
print('Hulle                     Typ                  r  n  n_pl   margin   score_t  score_not    SE')
for r in sorted(rows, key=lambda x: -x['score_t']):
    print('  %-22s %-20s r%d %d %5d %+9.2f %+9.2f %+9.2f %6.2f'
          % (r['title'][:22], r['base'][:20], r['rarity'], r['n'],
             r['n_pl'], r['margin'], r['score_t'], r['score_not'],
             r['se_margin'] or 0))
for key, lab in (('score_t', 'MIT T(n)'), ('score_not', 'OHNE T(n)')):
    print('Mediane je Raritaet (%s):' % lab)
    for rar in range(0, 6):
        vals = [r[key] for r in rows if r['rarity'] == rar]
        if vals:
            print('  r%d: %.2f (N %d)' % (rar, _st.median(vals), len(vals)))
print('JSON ->', OUT_PATH)
