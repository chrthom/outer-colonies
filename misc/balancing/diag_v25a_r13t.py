#!/usr/bin/env python3
"""diag_v25a_r13t: v25a-PILOT - Waffen (50) + Statkarten (19) +
Reparaturkarten (325/104) im Kampagnen-Frame v2 (Runde v25a,
9.11.2026).

Wahrung v25: Score = Delta-Kriegsbilanz (gamma=1: hp + col + ctrl
+ dealt, Marker) je Platzierung / units (units = 1 + |E<0| aus
cards.csv). Methodik r13t: bewertete Karte ZUSAETZLICH auf
Trager-Slot (r13t-Spin-Rotation ueber die bewertete Seite 0,
Sockel-Anforderung geprueft, Opportunitaetskosten ueber freie
Sockel, kein Budget-Draw), Waffen via wspec-Marker (feuert als
ERSTE der Phase vom Trager, NICHT in weapons -> fire-Indizes und
CRN unveraendert), Statkarten/Reparatur persistent in Trager-cards
(hp_add/sp_add beim Serien-Start gebucht, Reparatur uber rep_of).

Frame: H1j-Frame v2 exakt (2 getrennte Serien 50/50, persistente
Flotten 3-5 Schiffe je Seite, Bestueckung fix, Ende: Flotte leer /
Kolonie >= 50 (Raid) / |Control| >= 15 (Mission), Cap 24,
Reparatur vor eigenem Angreifergefecht). Basis = reiner
Zufalls-Frame OHNE erzwungenen Kreuzer (der war H1j-Hullen-spezifisch);
Delta gegen Basis-Kampagne derselben Zelle (perfekte CRN-Paarung).

Neu ggU. Reparatur-Vorschau (H1j-Forts.): 325/104 jetzt MIT
Sockel-Anforderung {'e': 1} wie alle anderen Karten
(Methodik-Einheitlichkeit v25a) -> Scores nicht direkt mit der
Vorschau vergleichbar.

Pilot: N=200 (env HULL_N), SE-Diagnose der Raritaets-Mediane via
Bootstrap (B=200) ueber die Zell-Rohdaten; daraus N-Empfehlung
(SE-Skalierung ~1/sqrt(N)). Checkpoint alle 25 Zellen.
Niemals importieren (Top-Level-Messloop)!"""
import json
import os
import random

import balancing_metric_v9 as v9
import balancing_metric_v10 as v10
import balancing_metric_v11 as v11

HERE = os.path.dirname(os.path.abspath(__file__))
CKPT_PATH = os.path.join(HERE, 'diag_v25a_ckpt_r13t.json')
OUT_PATH = os.path.join(HERE, 'diag_v25a_r13t.json')
N = int(os.environ.get('HULL_N', '200'))
CKPT_EVERY = 25
CTRL_W = v11.CTRL_W
COLONY_HP = v11.COLONY_HP
PHASES = v11.PHASES

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


# ============ v25a: Bewertungsobjekte (71) ==========================
CARD_CSV = {}
with open(v9.CARDS_CSV, newline='', encoding='utf-8') as _f:
    import csv as _csv2
    for _r in _csv2.DictReader(_f, delimiter=';', quotechar='"'):
        CARD_CSV[_r['id']] = _r


def _csv_energy(cid):
    e = CARD_CSV[cid].get('energy', '')
    return int(e) if e and e.lstrip('-').isdigit() else 0


def _sock_req(cid):
    d = {}
    for t in ('a', 'b', 'd', 'e', 'f', 'g'):
        v = v9.num(CARD_CSV[cid].get('socket_' + t, ''))
        if isinstance(v, int) and v != 0:
            d[t] = abs(v)
    return d


OBJEKTE = []
for w in v11.weapons:
    X = dict(w)
    X['oid'] = 'w' + w['id']
    X['kind'] = 'w'
    X['req'] = dict(v11.WREQ.get(w['id'], {}))
    X['card'] = dict(w)
    X['units'] = 1 + max(0, -_csv_energy(w['id']))
    OBJEKTE.append(X)
for c in v11.cards:
    X = dict(c)
    X['oid'] = 'c' + c['id']
    X['kind'] = 'c'
    X['req'] = dict(CREQ.get(c['id'], {}))
    X['card'] = dict(c)
    X['units'] = 1 + max(0, -_csv_energy(c['id']))
    OBJEKTE.append(X)
for _cid in ('325', '104'):
    X = dict(oid='c' + _cid, kind='c', id=_cid,
             title=CARD_CSV[_cid]['title'],
             rarity=int(CARD_CSV[_cid]['rarity']),
             units=1 + max(0, -_csv_energy(_cid)),
             req=_sock_req(_cid),
             card=dict(id=int(_cid), title=CARD_CSV[_cid]['title'],
                       hp=0, speed=0, added=[], pts=0))
    OBJEKTE.append(X)
assert len(OBJEKTE) == 71, len(OBJEKTE)


def pick_carrier(sc0, X, it):
    """r13t-Trager-Rotation: Spin ueber die bewertete Seite 0; das
    erste Schiff mit freien Sockeln fuer die bewertete Karte traegt
    sie die ganze Serie (persistente Anbindung, Tragertod = Karte
    verloren, wie im echten Spiel). Nicht platzierbar -> Objekt
    zaehlt in dieser Zelle nicht (n_pl je Objekt)."""
    fleet = sc0['deff']
    n = len(fleet)
    order_i = list(range(n))
    order_i = order_i[it % n:] + order_i[:it % n]
    for i in order_i:
        sh = fleet[i]
        free = sock_free(sh['build'], sh['weapons'], sh['cards'])
        if place(X['req'], free):
            return i
    return None



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
    fire = [coins([len(sh['weapons']) for sh in deff], s(4)),
            coins([len(sh['weapons']) for sh in att], s(5))]
    wf = [[[s(6).random() < v10.ATTACK_PROB[p] for p in PHASES]
           for _ in deff],
          [[s(7).random() < v10.ATTACK_PROB[p] for p in PHASES]
           for _ in att]]
    order = (0, 1) if b_rng.random() < 0.5 else (1, 0)
    return dict(att=att, deff=deff, raid=False, colpool=None,
                fire=fire, wf=wf, order=order, e=b_tot - h0,
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
# wenn sie als bewertete Karte platziert werden.
REPAIR = {325: 2.0, 104: 10.0}


def rep_of(loadout):
    return sum(REPAIR.get(c.get('id'), 0.0) for c in loadout['cards'])


def coins_for(fleet, rng):
    return [[[rng.random() < v10.ATTACK_PROB[p] for p in PHASES]
             for _ in range(len(sh['weapons']))] for sh in fleet]


def campaign_mode(idx, sc0, X, slot, mode, side=0):
    """Eine Kampagne im Modus 'mission' (NUR Missionen) oder
    'raid' (NUR Raids); Angreifer/Verteidiger wechseln je Gefecht
    (Christophers H1j-Rotation). Kanal-Rueckgabe getrennt, GAMMA
    steckt erst in der Auswertung."""
    # v25a: X = None -> Basis-Kampagne (reiner Zufalls-Frame);
    # sonst: bewertete Karte persistent auf Trager-Slot
    if X is None:
        sc = sc0
    else:
        sh = sc0['deff'][slot]
        if X['kind'] == 'w':
            neu = dict(sh, weapons=list(sh['weapons']),
                       cards=list(sh['cards']),
                       pdc=list(sh.get('pdc', [])))
            neu['wspec'] = X['card']
        else:
            neu = dict(sh,
                       cards=list(sh['cards']) + [dict(X['card'])],
                       weapons=list(sh['weapons']),
                       pdc=list(sh.get('pdc', [])))
            neu['hp_add'] = sh.get('hp_add', 0) + X['card'].get('hp', 0)
            neu['sp_add'] = sh.get('sp_add', 0) + X['card'].get('speed', 0)
        deff = [dict(s2) for s2 in sc0['deff']]
        deff[slot] = neu
        sc = dict(sc0, deff=deff)
    ships = [[dict(orig=s, cum=0.0, dead=False, repair=rep_of(s))
              for s in sc['deff']],
             [dict(orig=s, cum=0.0, dead=False, repair=rep_of(s))
              for s in sc0['att']]]
    col = [0.0, 0.0]      # kumulierter Kolonieschaden je Seite
    kum = 0.0             # Control-Differenz in PUNKTEN (Sicht A)
    dealt = [0.0, 0.0]    # kumulierter verursachter Schaden je Seite
    pools = [draw_colpool(idx, 0), draw_colpool(idx, 1)]
    nb = 0
    end_reason = 'cap'

    def upd(flst, rl, km):
        # km: None (ungefiltert, Index passt) | dict old->new | list
        if isinstance(km, dict):
            inv = {v: k for k, v in km.items()}
            pairs = [(inv[i], r) for i, r in enumerate(rl)]
        else:
            pairs = list(enumerate(rl))
        for oi, (tk, dead) in pairs:
            flst[oi]['cum'] += tk
            if dead:
                flst[oi]['dead'] = True

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
        off = 0 if k % 2 == 0 else 1   # offensive Seite:
        # Mission: Missionar (m), Raid: Angreifer - beide wechseln
        # mit derselben Paritaet
        for st in ships[off]:
            if st['repair'] > 0 and st['cum'] > 0:
                st['cum'] = max(0.0, st['cum'] - st['repair'])
        # persistente Bestueckung: cum als negativer hp_add
        lo = [[dict(st['orig'],
                    hp_add=st['orig'].get('hp_add', 0.0) - st['cum'])
               for st in fl] for fl in ships]
        fireX = [coins_for(lo[0], random.Random(
                     1_000_003 * idx + 7919 * k + 2)),
                 coins_for(lo[1], random.Random(
                     1_000_003 * idx + 7919 * k + 3))]
        wfx = []
        for sd in (0, 1):
            _wr = random.Random(1_000_003 * idx + 7919 * k + 17 + sd)
            wfx.append([[_wr.random() < v10.ATTACK_PROB[p]
                         for p in PHASES] for _ in lo[sd]])
        order = (0, 1) if random.Random(
            1_000_003 * idx + 7919 * k + 5).random() < 0.5 else (1, 0)
        if mode == 'mission':
            m = 0 if k % 2 == 0 else 1    # Missionar wechselt
            a = 1 - m                     # fleet[0] = Missionar!
            sc_k = dict(deff=lo[m], att=lo[a], raid=False,
                        colpool=None,
                        fire=[fireX[m], fireX[a]],
                        order=order,
                        e=0, hulls=(0, 0), socks=(0, 0), b=0,
                        fleets=([], []))
            r = battle_r(sc_k, wf=wfx[0])
            gain = (r['ctrl_alive0'] if r['no_intercept']
                    else max(0.0, r['ctrl_alive0'] - r['ctrl_alive1']))
            kum += gain if m == 0 else -gain
            dealt[m] += r['dealt0']
            dealt[a] += r['dealt1']
            upd(ships[m], r['rest0'], None)
            upd(ships[a], r['rest1'], r['kmap'])
        else:
            attacker = 0 if k % 2 == 0 else 1
            d = 1 - attacker
            sc_k = dict(deff=lo[d], att=lo[attacker], raid=True,
                        colpool=pools[d],
                        fire=[fireX[d], fireX[attacker]],

                        order=order, e=0, hulls=(0, 0), socks=(0, 0),
                        b=0, fleets=([], []))
            r = battle_r(sc_k, wf=wfx[0], col_start=col[d])
            col[d] = r['colony']
            dealt[d] += r['dealt0']
            dealt[attacker] += r['dealt1']
            upd(ships[d], r['rest0'], None)
            upd(ships[attacker], r['rest1'], r['kmap'])
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


acc = {X['oid']: obj_blank() for X in OBJEKTE}
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
        rb = campaign_mode(it, sc0, None, None, mode)
        bruns[mode] = rb
        bacc['hp'] += 0.5 * rb['hp']
        bacc['col'] += 0.5 * rb['col']
        bacc['ctrl'] += 0.5 * rb['ctrl']
        bacc['dealt'] += 0.5 * rb['dealt']
        bacc['nb'][mode] += rb['nb']
        bacc['end'][mode][rb['end']] += 1
    bacc['n'] += 1   # Zellen-Zaehler (SERIEN zaehlen doppelt s.o.)
    for X in OBJEKTE:
        slot = pick_carrier(sc0, X, it)
        if slot is None:
            continue
        d = acc[X['oid']]
        d['n_pl'] += 1
        cellm = 0.0
        for mode in MODES:
            r = campaign_mode(it, sc0, X, slot, mode)
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

# ---------------- Auswertung: v25a-Pilot ----------------
bn = max(1, bacc['n'])
base_stats = dict(
    n=bacc['n'],
    o_gefechte={m: round(bacc['nb'][m] / bn, 2) for m in MODES},
    end_dist={m: {k: round(v / bn, 3)
                  for k, v in bacc['end'][m].items()} for m in MODES},
    o_hp=round(bacc['hp'] / bn, 2), o_dealt=round(bacc['dealt'] / bn, 2),
    o_col=round(bacc['col'] / bn, 2), o_ctrl=round(bacc['ctrl'] / bn, 2))

rows = []
for X in OBJEKTE:
    d = acc[X['oid']]
    n = max(1, d['n_pl'])
    m = (d['hp'] + d['col'] + d['ctrl'] + d['dealt']) / n
    rows.append(dict(
        oid=X['oid'], id=X['id'], title=X['title'], kind=X['kind'],
        rarity=X['rarity'], units=X['units'], n_pl=d['n_pl'],
        d_hp=round(d['hp'] / n, 3), d_col=round(d['col'] / n, 3),
        d_ctrl=round(d['ctrl'] / n, 3), d_dealt=round(d['dealt'] / n, 3),
        margin=round(m, 3), score=round(m / X['units'], 3)))


def _median(v):
    s = sorted(v)
    k = len(s)
    return (s[k // 2] if k % 2 else 0.5 * (s[k // 2 - 1] + s[k // 2]))


BOOT = 200


def boot_se(objs):
    """SE des Raritaets-Medians via Bootstrap ueber Zell-Rohdaten."""
    rng = random.Random(20261109)
    meds = []
    for _ in range(BOOT):
        m = []
        for row, cells, units in objs:
            k = len(cells)
            if k == 0:
                continue
            ms = sum(cells[rng.randrange(k)] for _ in range(k)) / k
            m.append(ms / units)
        if m:
            meds.append(_median(m))
    if len(meds) < 2:
        return None
    mu = sum(meds) / len(meds)
    return (sum((x - mu) ** 2 for x in meds) / len(meds)) ** 0.5


gruppen = {}
for kind in ('w', 'c'):
    for rar in (0, 1, 2, 3, 4, 5):
        objs = [(r, acc[r['oid']]['cells'], r['units'])
                for r in rows
                if r['kind'] == kind and r['rarity'] == rar
                and r['n_pl'] > 0]
        if not objs:
            continue
        meds = [r['score'] for r, _, _ in objs]
        se = boot_se(objs)
        g = dict(n_objekte=len(objs), n_pl_min=min(r['n_pl'] for r, _, _ in objs),
                 median=round(_median(meds), 3), se=None if se is None else round(se, 3))
        # N-Empfehlung auf SE <= 5% des Medians (relativ, da die
        # Marker-Skala >> r13t-Skala ist; Skalierung ~1/sqrt(N))
        if se is not None and se > 0 and abs(g['median']) > 0.001:
            ziel = 0.05 * abs(g['median'])
            g['se_rel_pct'] = round(100 * se / abs(g['median']), 1)
            g['n_fuer_se5pct'] = int(round(bacc['n'] * (se / ziel) ** 2))
        gruppen['%s_r%d' % (kind, rar)] = g

frame = (
    'v25a-PILOT (9.11.2026): 71 Objekte (50 Waffen + 19 Statkarten + '
    '2 Reparatur 325/104) im Kampagnen-Frame v2 (H1j: 2 getrennte '
    'Serien 50/50 Mission/Raid, persistente Flotten 3-5 Schiffe je '
    'Seite, Bestueckung fix, Ende: Flotte leer / Kolonie >= 50 (Raid) '
    '/ |Control| >= 15 (Mission), Cap 24, Reparatur vor eigenem '
    'Angreifergefecht, gamma=1). Wahrung: Score = '
    'Delta-Kriegsbilanz (hp + col + ctrl + dealt) je Platzierung / '
    'units (units = 1 + |E<0|, cards.csv). Methodik r13t: bewertete '
    ' Karte ZUSAETZLICH auf Trager-Slot (Spin-Rotation ueber Seite '
    '0, Sockel-Anforderung geprueft, kein Budget-Draw, opportunistisch '
    'ueber freie Sockel), Waffe als wspec-Marker (feuert ERSTE je '
    'Phase vom Trager, nicht in weapons, CRN-identisch), Statkarte/ '
    'Reparatur persistent in Trager-cards mit hp_add/sp_add. Basis '
    '= reiner Zufalls-Frame (KEIN erzwungener Kreuzer-Slot - der war '
    'H1j-Hullen-spezifisch), Delta gegen Basis-Kampagne derselben '
    'Zelle. Referenzkurs: 1 sp = 25,5 HP am Kreuzer (H1j-Forts. 3). '
    'Neu ggU. Reparatur-Vorschau: 325/104 MIT Sockel-Anforderung.')

vereinfachungen = [
    'bewertete Karte zusaetzlich ohne Budget-Erhoeung (Opportunitaet '
    'ueber freie Sockel, wie r13t-Einzelgefecht)',
    'Umgebung kann dieselbe Karte ziehen (Doppelung wie r13t, '
    'statistisch ueber Zellen gemittelt)',
    'kein Re-Draw der bewerteten Seite (perfekte CRN-Paarung zur '
    'Basis-Kampagne)',
    'Tragertod = Karte verloren fuer die Restserie (wie echtes Spiel)',
    'gamma=1 fix (Beschluss H1j-Forts. 1); Kanalzerlegung in der '
    'Auswertung',
    'Taktikkarten (v25d) zurueckgestellt; Kampf-Infra (v25c) folgt',
    'SE-Diagnose: Bootstrap B=200 ueber Zell-Rohdaten je Objekt, '
    'Median je Raritaet je Kartengruppe (w/c getrennt)',
]

out = dict(frame=frame, N=N, n_zellen=bacc['n'], base=base_stats,
           rows=rows, gruppen=gruppen, vereinfachungen=vereinfachungen)
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(out, f, indent=1, ensure_ascii=False)

print('Basis: n=%d | Gefechte mission=%.2f raid=%.2f'
      % (bacc['n'], bacc['nb']['mission'] / bn, bacc['nb']['raid'] / bn))
print('  mission end=%s' % {k: round(v / bn, 3)
                            for k, v in bacc['end']['mission'].items()})
print('  raid    end=%s' % {k: round(v / bn, 3)
                            for k, v in bacc['end']['raid'].items()})
print('Objekt-Scores (gerundet 3):')
for r in sorted(rows, key=lambda x: -x['score'])[:10]:
    print('  %-6s r%-2d %-30s units %.1f n_pl %4d score %+7.3f'
          % (r['id'], r['rarity'], r['title'][:30], r['units'],
             r['n_pl'], r['score']))
print('... bottom:')
for r in sorted(rows, key=lambda x: x['score'])[:5]:
    print('  %-6s r%-2d %-30s units %.1f n_pl %4d score %+7.3f'
          % (r['id'], r['rarity'], r['title'][:30], r['units'],
             r['n_pl'], r['score']))
print('Raritaets-Mediane + Bootstrap-SE (B=%d):' % BOOT)
for g, v in gruppen.items():
    print('  %-6s n=%d median %+.3f se %s%s'
          % (g, v['n_objekte'], v['median'],
             ('%.3f' % v['se']) if v['se'] is not None else '-',
             (' | SE %.1f%% vom Median | N fuer SE 5%%: %d'
              % (v.get('se_rel_pct', 0), v['n_fuer_se5pct']))
             if 'n_fuer_se5pct' in v else ''))
print('JSON ->', OUT_PATH)