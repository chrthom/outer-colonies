#!/usr/bin/env python3
"""Outer Colonies – Waffen-Balancing-Metrik v9 (Christopher, 2.11.2026).

Erweitert v8 um Reichweiten-Dynamik (alle Mechaniken gegen Server-Code verifiziert):
1. ATTACK_PROB je Reichweite: Chance, dass der Angriff in der Phase ueberhaupt
   stattfindet (R1 birgt Gefahr, nie zum Einsatz zu kommen).
2. HALF_PROB je Reichweite: Chance auf halbierten Schaden durch
   Geschwindigkeitsvorteil des Verteidigers (equipment_card.ts:44:
   target.isFlightReady && attacker.speed + range < target.speed ->
   Math.round(damage/2)). Kolonien sind nie flugbereit -> nie halbiert.
   Historischer Stand: zitiert die Pre-#813-Serverregel (striktes <);
   der Server rechnet seit #813 (7.11.2026) <= (Gleichstand wird
   halbiert). v9-HALF_PROB (und die darauf aufbauenden half_prob-
   Funktionen in v10) sind damit die historische Pre-v22-Herleitungs-
   basis, abgeloest durch das Tie-Halving der Sonde (diag_random_r13t.py).
   Herleitung aus Speed-Verteilung der 50 implementierten Huellen:
   R4 2 %, R3 10 %, R2 19 %, R1 26 % (Paar-Rechnung ueber alle Angreifer/Ziel-
   Kombinationen). Kalibrierung: R4 0 % (Christoph), R3 10 %, R2 20 %, R1 25 %.
   Zwei-Zweig-Approximation: Zweig "voller Schaden" vs. Zweig "halber Schaden"
   ((d+1)//2 wie JS Math.round), Mischung je Phase.
3. Mission vs. Raid (MISSION_SHARE 0.50 = RAID_SHARE 0.50, seit v23b; die 85/15 war die v8-Kalibrierung):
   - Mission: reines Schiffsgefecht, KEIN Angriff auf die Kolonie moeglich.
   - Raid: Gefecht gegen Verteidigerschiffe; die Kolonie ist erst ab
     Reichweite 1 angreifbar (battle.ts: Kolonie-Stacks werden bei range==1
     zugestellt). In R1 zaehlt der bessere Zielwert max(Schiff, Kolonie).
     Kolonie-Angriff: 1x je R1-Phase, Verheerend (Kolonie) x2, keine Halbierung,
     aber ATTACK_PROB[1]. Waffen mit 'Wirkungslos (Kolonie)': nur Schiffsziel.
4. Einmalverwendung: feuert genau 1x zum besten Zeitpunkt (Christoph, 2.11.):
   Maximum ueber alle moeglichen Einsatz-Reichweiten (isInRange: Waffenreich-
   weite >= Gefechtsreichweite). Gegen Schiffe ist max. Reichweite optimal
   (hoechste ATTACK_PROB, keine Halbierung); im Raid kann der R1-Kolonie-
   Angriff besser sein (z. B. 167 Nukleare Torpedos, Verheerend (Kolonie)).
5. Spezialfaelle (attackDamageBeforeReductions im Server-Code):
   - 203/401/438: Schaden 0 gegen Kolonie ('Wirkungslos (Kolonie)').
   - 401 Guillotine: damage - 6 je Zielspeedpunkt (Ø 1.3 -> 30-7.8 = 22.2
     gegen Schiffe; Kolonie: speed 0, aber ohnehin wirkungslos).
   - 224 Bergbaulaser: 0 gegen Ziele mit speed >= 3 (32 % der Huellen)
     -> Faktor 0.68 gegen Schiffe; gegen Kolonie (speed 0) voll wirksam.
6. Korrektur gegenueber v8: Abzug 0 in einer Spalte = abzugsfrei = kein
   Angriffsschritt gegen diesen Defense-Typ (Server: fromProfile == 0 ->
   Defense bleibt aktiv). v8 hat solche Karten faelschlich deaktiviert.

Datengrundlage: cards.csv im selben Ordner, uebergeordnet oder als
../cards/cards.csv (Repo-Layout: misc/balancing/ neben misc/cards/cards.csv).
Aufruf: python3 balancing_metric_v9.py [--final]  (--final = die 5 X-Abzuege 157/166/179/344/347)
"""
import csv, json, os, statistics, sys

# Datengrundlage: cards.csv im selben Ordner (Knowledge) oder uebergeordnet;
# Repo-Layout: misc/balancing/ neben misc/cards/cards.csv (../cards/cards.csv).
CARDS_CSV = next((p for p in ('cards.csv',
                              os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'cards.csv'),
                              os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'cards', 'cards.csv'))
                  if os.path.exists(p)), 'cards.csv')

# Zielkurve v9 (Christopher, 2.11.2026): Kompromiss aus fixer v8-Kurve
# (4.0/4.5/5.5/6.5/8.0) und v9-Median-Anker (~3.7/3.6/4.5/5.5/6.5)
TARGETS = {1: 4.5, 2: 4.75, 3: 5.0, 4: 6.0, 5: 6.5}  # Zielkurve je Raritaet
# Neu angekurvt (v9.3, Christopher, 2.11.2026, bestätigt nach Kostenmodell-
# Umstellung): 4,5/4,75/5,0/6,0/6,5 - streng monoton, liegt nahe an den
# FINAL-Medianen unter dem neuen Einsatzkosten-Modell (4,65/4,86/4,33/6,08/6,56;
# r3 sitzt 0,67 darunter -> r3-Torpedos brauchen Buffs). Ersetzt die Kurven

# Überlebens-Credit λ (Christopher, 3.11.2026): zunächst symmetrisch bezahlt
# mit x 1,15 geplant; nach Christophers Flottenmodell-Messung (kalibrierung_
# check6.py: Output-Gewinn = 0,70-0,78 x verhinderte Marker, kein ADDITIVER
# Bonus) Entscheidung 4 (3.11.2026): "verwerfen und auf 1,0 zurück" – der
# Überlebens-Effekt ist bereits in der prevented-Marker-Währung enthalten,
# wird nur dokumentiert. Faktor bleibt als Struktur-Schalter auf 1,0.
SURV_CREDIT = 1.0
TARGETS = {r: t * SURV_CREDIT for r, t in TARGETS.items()}
THR_BACKLOG = 0.1 * SURV_CREDIT   # -0,115
THR_WATCH = 1.0 * SURV_CREDIT     # +1,15
THR_NERF = 1.5 * SURV_CREDIT      # +1,725
# 3,75/4,0/4,5/5,5/6,5 (v9.3-Nackt-Kalibrierung) und 3,5/4,0/5,0/6,0/7,0 (v9.2).
# Dual-Use-Guthaben (Christopher, 3.11.2026): dynamisch je Defensivpunkt-Typ,
# gemessen als marginaler Verhinderungswert in v10 (synthetische Karten,
# FINAL-Waffenfeld) und wie alle Defense-Effekte auf Schiffs-Ebene x k (1,59)
# verrechnet. Kumulativ je Punkt 1/2/3; alle 10 Dual-Use-Waffen tragen nur PD.
DEF_CREDIT = {'pd':     (0.84, 1.16, 1.19),
              'shield': (2.38, 3.10, 3.33),
              'armour': (2.40, 3.65, 4.36)}
SINGLE_USE_OVERRIDE = {'554', '555'}                  # Edition 5: Code = PerBattle

# --- v9: Reichweiten-Wahrscheinlichkeiten ---
ATTACK_PROB = {4: 1.00, 3: 0.95, 2: 0.90, 1: 0.70}   # User-Vorgabe 2.11.2026
HALF_PROB =   {4: 0.00, 3: 0.10, 2: 0.20, 1: 0.25}   # Herleitung: 2/10/19/26 %

# --- Szenario-Split Mission vs. Raid (Kolonie nur im Raid, ab R1, angreifbar) ---
MISSION_SHARE = 0.50
RAID_SHARE = 0.50

# --- Spezialfaelle ---
NO_COLONY = {'203', '401', '438'}       # 'Wirkungslos (Kolonie)' (implementiert)
AVG_SPEED = 1.3                         # Ø Speed der 50 implementierten Huellen
SLOW_TARGET_FACTOR = 0.68               # 224: P(Zielspeed < 3) = 34/50

# Beschlossene Aenderungen (1.11.2026) – Stand: beschlossen, noch nicht im Repo
FINAL = {
    # v25a-Frame auf #795-Zielzustand (9.11.2026): Die Metrik-Overrides sind
    # GEFALLEN - v23c-Ruecknahmen Kategorie A/C (106/107/303/310/343/405 und
    # 125/127/167/168/203/224/234/339/340/409/420/421/424/441), #795-Ueberfuehrung
    # der Beschlusswerte in cards.csv (101/126/150/151/180/182/207/223/304/318/
    # 347/401/412/555) sowie die 302/438-Ruecknahme (csv ist Zielzustand, Issue
    # #795: 'csv is already in the target state, only the metric overrides are
    # dropped'). cards.csv traegt seit dem Patch (patch_cards_795.py) den
    # v23i-Sollzustand. Uebrig bleiben NUR die X-Abzuege (#795 §3: 'X
    # deductions 157/166/344/347 stay X'; 179 steht NICHT in dieser Liste -
    # seine X-Schalter PzAbz UND SAbz sind neue v25-Beschluesse, §1:
    # 'damage_armour -2->X AND damage_shield ->X (v25, X switch against
    # both defence types)', §7: 'Applies now to ... 179 (armour AND
    # shield)'). Die csv enthaelt dort numerische Ersatzwerte, X laesst
    # die Defense-Karte aktiv):
    '157': dict(dmg=7, e=0, abz={'shield': 'X'}),  # Plasmawerfer (SAbz 7 == dmg 7)
    '166': dict(dmg=3, e=0, abz={'shield': 'X'}),  # Laserkanone (SAbz 3 == dmg 3)
    '179': dict(dmg=2, e=0, abz={'armour': 'X', 'shield': 'X'}),  # Pulskanone (PzAbz + SAbz wirkungslos, #795 §1/§7)
    '344': dict(dmg=2, e=0, abz={'shield': 'X'}),  # Fokuslaser (SAbz 2 == dmg 2)
    '347': dict(dmg=4, e=0, abz={'shield': 'X'}),  # Impulslaser (#795: dmg 5->4)
}

def num(v):
    v = (v or '').strip()
    if v == '' or v is None: return None
    if v == 'X': return 'X'
    try: return int(v)
    except ValueError: return None

def wep_abzug(v):
    n = num(v)
    return None if n is None else ('X' if n == 'X' else abs(n))

def load_weapons():
    weapons = []
    with open(CARDS_CSV, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter=';', quotechar='"'):
            if r['implemented'] != 'yes' or r['type'] != 'equipment': continue
            dmg = num(r['damage'])
            if dmg is None or dmg == 'X': continue
            # Einsatzkosten-Sockel, TEURERER SOCKEL ZUERST; Kostenmodell v3
            # (Christopher, 3.11.2026, positional): 1. Sockel voll (Theta/Omega/
            # Delta: 0,7; normale: 1,0); weitere Sockel: normal 0,7, billig 0,5.
            socks = []
            for c in ['socket_a','socket_b','socket_d','socket_e','socket_f','socket_g']:
                v = num(r[c])
                if isinstance(v, int) and v < 0:
                    socks.extend([c in ('socket_a', 'socket_e', 'socket_g')] * -v)
            socks.sort()  # False (= normale Sockel, teurer) zuerst
            socket_cost = ((0.7 if socks[0] else 1.0) if socks else 0) \
                + sum((0.5 if s else 0.7) for s in socks[1:])
            energy = abs(num(r['energy'])) if isinstance(num(r['energy']), int) and num(r['energy']) < 0 else 0
            def_pts = sum(n for k in ('abm','shield','armour') if isinstance((n := num(r[k])), int) and n > 0)
            def_types = {}
            for col, t in (('abm', 'pd'), ('shield', 'shield'), ('armour', 'armour')):
                n = num(r[col])
                if isinstance(n, int) and n > 0: def_types[t] = n
            weapons.append({
                'id': r['id'], 'title': r['title'], 'rarity': num(r['rarity']), 'edition': r['edition'],
                'sockets': len(socks), 'socket_cost': socket_cost,
                'energy': energy, 'damage': dmg, 'range': num(r['range']) or 0,
                'single': 'Einmalige Verwendung' in (r['tags'] or '') or r['id'] in SINGLE_USE_OVERRIDE,
                'colony_killer': 'Verheerend (Kolonie)' in (r['tags'] or ''),
                'no_colony': 'Wirkungslos (Kolonie)' in (r['tags'] or '') or r['id'] in NO_COLONY,
                'abz': {'pd': wep_abzug(r['damage_abm']), 'shield': wep_abzug(r['damage_shield']), 'armour': wep_abzug(r['damage_armour'])},
                'def_pts': def_pts, 'def_types': def_types,
            })
    return weapons

# --- Kampf-Simulation (verifiziert gegen server/src: card.ts, equipment_card.ts) ---
def resolve_attack(w, cards, dmg):
    """1 Angriff: Reduktion = |Abzug| x Defensivpunkte, Reihenfolge PD->Schild->Panzerung.
    Defense deaktiviert wenn Angriffsschaden >= Reduktion, sonst Schaden 0 (Karte bleibt aktiv).
    Abzug 0/leer = abzugsfrei: kein Angriffsschritt, Defense ignoriert und bleibt aktiv."""
    for dtype in ('pd', 'shield', 'armour'):
        abz = w['abz'][dtype]
        if dmg <= 0: break
        if abz is None or abz == 0: continue  # abzugsfrei: kein Angriffsschritt gegen diesen Typ
        pool = [c for c in cards if c['type'] == dtype and c['points'] > 0 and not c.get('used', False)]
        # Server card.ts deactivationPriority (Runde 13c): PerBattle/PerRound
        # = 15 + 4*Punkte (+2 Colony-Zone, +0/+1 Kolonie-Defense), PerAttack
        # = 0 + 4*Punkte; hoechste Prioritaet zuerst (sort().pop()).
        pool.sort(key=lambda c: -((15 if c['recharge'] != 'attack' else 0) + 4 * c['points']))
        for c in pool:
            if dmg <= 0: break
            if abz == 'X': dmg = 0; break    # X: voll absorbiert, Defense bleibt aktiv
            reduction = abz * c['points']
            if dmg >= reduction:
                dmg -= reduction
                if c['recharge'] in ('never', 'phase'): c['used'] = True
            else: dmg = 0
    return dmg

def half(d):
    return (d + 1) // 2                    # JS Math.round(d/2) fuer positive ints

def base_damage(w):
    """attackDamageBeforeReductions: nur 401 hat einen Speed-Abzug."""
    return max(0, w['damage'] - (6 * AVG_SPEED if w['id'] == '401' else 0))

def phase_totals(w, cards, halved=False):
    """Gefecht 4->1: Schild/PD reaktivieren je Phase, Panzerung nie.
    Einmalverwendung greift genau 1x (in der Phase min(Reichweite, 4)).
    Liefert Erwartungsschaden je Phase fuer einen Halbierungszweig."""
    cards = [dict(c) for c in cards]
    phases = [min(w['range'], 4)] if w['single'] else [p for p in (4, 3, 2, 1) if w['range'] >= p]
    base = base_damage(w)
    out = {}
    for p in phases:
        d = half(base) if halved else base
        out[p] = resolve_attack(w, cards, d)
        for c in cards:
            if c['recharge'] in ('phase', 'attack'): c['used'] = False
    return out

def attack_once(w, cards, p):
    """Einmal-Angriff in Phase p gegen frische Verteidigung (Einmalverwendung:
    erster und einziger Angriff -> alle Defense-Karten aktiv)."""
    e = 0.0
    for halved, wgt in ((False, 1 - HALF_PROB[p]), (True, HALF_PROB[p])):
        d = half(base_damage(w)) if halved else base_damage(w)
        e += wgt * resolve_attack(w, [dict(c) for c in cards], d)
    return ATTACK_PROB[p] * e

def single_ship_best(w, cards):
    """Einmalverwendung gegen Schiffe: bester Einsatzzeitpunkt = Maximum ueber
    alle moeglichen Gefechtsreichweiten 1..min(Waffenreichweite, 4)."""
    return max((attack_once(w, cards, p) for p in range(1, min(w['range'], 4) + 1)), default=0)

def multi_ship_phases(w, cards):
    """Wiederaufladbare Waffe gegen Schiffe: Erwartungsschaden je Phase 4->1.
    Zwei-Zweig-Halbierungsmischung, Verteidigungszustand evolves je Zweig."""
    A, B = phase_totals(w, cards), phase_totals(w, cards, halved=True)
    return {p: ATTACK_PROB[p] * ((1 - HALF_PROB[p]) * A.get(p, 0) + HALF_PROB[p] * B.get(p, 0))
            for p in A}

# --- Defense-Szenarien v9.1 (Christopher, 2.11.2026): alle Permutationen aus
# den Einzelwahrscheinlichkeiten der ECHTEN Haeufigkeit der Defense-Werte auf
# den implementierten Karten (Herleitung siehe balancing.md) ---
# - Ziel-Schiff traegt min(echte Sockelzahl, SHIP_CAP=4) Ausruestungskarten;
#   Sockelverteilung der 48 echten Schiffsvarianten (Server hull_*.ts), Kappung
#   bei 4 wegen Karten-Nachschub (Starter-Deck ~21 Ausruestung auf ~7 Schiffe
#   gleichzeitig im Spiel). Sensitivitaet: Cap 3 -> P(PD) 52 %, Cap 5 -> 67 %,
#   ungekappt 75 %.
# - Je Karte Rarity-gewichtete Ziehung (Christopher, 2.11.2026): r1 doppelt so
#   haeufig wie r2, r2 doppelt so haeufig wie r3 usw. (Gewicht 2^(5-r); r0 =
#   Reihe fortgesetzt = doppelt r1). Ersetzt die Booster-Band-Gewichtung.
#   Einzelwahrscheinlichkeiten je Ausruestungs-Zug: PD1 13,7 %, PD2 9,1 %,
#   S1 5,1 %, S2 3,4 %, A1 4,8 %, A2 4,8 %, A3 0,1 % (PD dominiert: 9 der 11
#   PD-Karten sind Dual-Use-Waffen).
# - Kolonie: COLONY_DRAWS=3 Ziehungen aus dem Koloniezonen-Pool (planetare
#   Infrastruktur + Himmelskoerper, 20 Karten; PD1/PD2/S1/A1).
# - Alle Permutationen exakt enumeriert (Multinomial ueber die Zuege),
#   aggregiert nach Punktsumme je Typ mit kanonischem Pool (2er-Karten vor
#   1ern; PD ab 6, Schild/Panzerung ab 4 Punkten gekappt) - kein Tail-Verlust,
#   Summe exakt 100 %.
SHIP_CAP = 4         # Ausruestungskarten je Schiff (Sockel, Supply-Kappung)
# Bestueckungsgrad (v9.3, Christopher, 2.11.2026): nur gut zwei Drittel der
# Sockel tragen tatsaechlich eine Ausruestungskarte (Karten-Nachschub). Auf
# 0,67 kalibriert, damit ~30 % der Schiffe OHNE Defense unterwegs sind
# ("Bei Schiffen waere zu sagen, dass fast 30 % aller Schiffe im Spiel ohne
# Defense unterwegs sind", Christophers Playtest-Schaetzung).
EQUIP_FILL = 0.67    # Anteil der Sockel mit tatsaechlich gespielter Karte
COLONY_DRAWS = 3     # Koloniezonen-Karten (Orb + planetare Infrastruktur)
# Sockel je Schiffsvariante (48: 5 Korvetten, 6 1-teilige, 9 Fregatten-,
# 4 Zerstoerer-, 4 Frachter-, 12 Kreuzer-, 8 Schlachtschiff-Kombinationen):
SHIP_SOCKETS = [4]*5 + [4, 2, 2, 2, 3, 5] \
    + [b+h for b in (2, 2, 3) for h in (1, 4, 4)] \
    + [b+h for b in (2, 1) for h in (2, 3)] \
    + [b+h for b in (3, 3) for h in (2, 3)] \
    + [b+k+h for b in (2, 2) for k in (3, 1, 3) for h in (3, 4)] \
    + [b+k+h for b in (2, 4) for k in (5, 4) for h in (3, 4)]
RECHARGE = {'pd': 'phase', 'shield': 'phase', 'armour': 'never'}

def build_scenarios():
    """SHIP/COLONY-Szenarien aus der echten Defense-Haeufigkeit auf Karten."""
    from collections import Counter
    rows = [r for r in csv.DictReader(open(CARDS_CSV, newline='', encoding='utf-8'),
                                      delimiter=';', quotechar='"')
            if r['implemented'] == 'yes']
    # Rarity-Gewichtung (Christopher, 2.11.2026): r1 doppelt so haeufig wie r2,
    # r2 doppelt so haeufig wie r3 usw.; r0 = Reihe fortgesetzt (doppelt r1).
    # Ersetzt die fruehere Booster-Band-Gewichtung (6/3/1 je Band).
    RARITY_W = {0: 32, 1: 16, 2: 8, 3: 4, 4: 2, 5: 1}
    def w(r): return RARITY_W[int(r['rarity'])]
    def val(r, c):
        v = (r[c] or '').strip()
        return int(v) if v.isdigit() and int(v) > 0 else 0
    def outcomes(pool):
        """Einzelwahrscheinlichkeiten der Defense-Werte innerhalb des Pools."""
        W = sum(w(r) for r in pool)
        out = []
        for c, t in (('abm', 'pd'), ('shield', 'shield'), ('armour', 'armour')):
            for v in (1, 2, 3):
                p = sum(w(r) for r in pool if val(r, c) == v) / W
                if p: out.append((t, v, p))
        out.append(('none', 0, 1 - sum(p for _, _, p in out)))
        return out
    def enumerate_pools(out, draws):
        """Exakte Multinomial-Enumeration -> Verteilung der Kartenpools."""
        dist = {(): 1.0}
        for _ in range(draws):
            nd = {}
            for pools, p in dist.items():
                for t, v, q in out:
                    if t == 'none':
                        nd[pools] = nd.get(pools, 0.0) + p * q
                    else:
                        key = tuple(sorted(pools + ((t, v),), key=lambda x: (x[0], -x[1])))
                        nd[key] = nd.get(key, 0.0) + p * q
            dist = nd
        return dist
    def aggregate(dist):
        """Kartenpools -> Punktsummen-Tripel (PD, Schild, Panzerung)."""
        agg = {}
        for pools, p in dist.items():
            s = {'pd': 0, 'shield': 0, 'armour': 0}
            for t, v in pools:
                s[t] += v
            key = (s['pd'], s['shield'], s['armour'])
            agg[key] = agg.get(key, 0.0) + p
        return agg
    def to_cards(key):
        """Kanonischer Pool je Punktsumme: 2er-Karten vor 1ern, gekappt."""
        cards = []
        for t, total, cap in (('pd', key[0], 6), ('shield', key[1], 4), ('armour', key[2], 4)):
            n2, rest = divmod(min(total, cap), 2)
            for pts in [2]*n2 + [1]*rest:
                cards.append({'type': t, 'points': pts, 'recharge': RECHARGE[t]})
        return cards
    eq = [r for r in rows if r['type'] == 'equipment']
    # v9.3: Bestueckungsgrad anwenden - Defense-Wahrscheinlichkeiten je Sockel
    # mit EQUIP_FILL skalieren, Rest = leerer Sockel ('none'). Kolonie unskaliert.
    raw = outcomes(eq)
    dsum = sum(p for t, _, p in raw if t != 'none')
    eq_out = [(t, v, p * EQUIP_FILL) if t != 'none' else ('none', 0, 1 - dsum * EQUIP_FILL)
              for t, v, p in raw]
    capped = [min(s, SHIP_CAP) for s in SHIP_SOCKETS]
    ship = {}
    for S in sorted(set(capped)):
        weight = capped.count(S) / len(capped)
        for key, p in aggregate(enumerate_pools(eq_out, S)).items():
            ship[key] = ship.get(key, 0.0) + p * weight
    cpool = ([r for r in rows if r['type'] == 'infrastructure' and 'Planetar' in (r['tags'] or '')]
             + [r for r in rows if r['type'] == 'orb'])
    colony = aggregate(enumerate_pools(outcomes(cpool), COLONY_DRAWS))
    return ([(to_cards(k), p) for k, p in ship.items()],
            [(to_cards(k), p) for k, p in colony.items()])

SHIP, COLONY = build_scenarios()

def colony_attack(w, cards):
    """1 Angriff gegen Kolonie (Raid, R1): CK x2, keine Halbierung (nicht flugbereit)."""
    return resolve_attack(w, [dict(c) for c in cards], w['damage']) * (2 if w['colony_killer'] else 1)

def effective(w):
    wts = sum(wt for _, wt in SHIP)
    slow = SLOW_TARGET_FACTOR if w['id'] == '224' else 1.0   # 'Wirkungslos (3+ speed)'
    # --- Mission (50 %): reines Schiffsgefecht, KEIN Kolonie-Angriff moeglich ---
    if w['single']:
        # Einmalverwendung: 1 Schuss zum besten Zeitpunkt (max. Reichweite optimal)
        mission = sum(wt * single_ship_best(w, c) for c, wt in SHIP) / wts * slow
    else:
        ph = {p: 0.0 for p in (1, 2, 3, 4)}
        for c, wt in SHIP:
            for p, v in multi_ship_phases(w, c).items():
                ph[p] += wt * v
        for p in ph: ph[p] = ph[p] / wts * slow
        mission = sum(ph.values())
    # --- Raid (50 %): Kolonie erst ab R1 angreifbar, dort Zielwahl ---
    colony_avg = 0.0
    if not w['no_colony']:
        cw = sum(wt for _, wt in COLONY)
        colony_avg = sum(wt * colony_attack(w, c) for c, wt in COLONY) / cw
    r1_col = ATTACK_PROB[1] * colony_avg
    if w['single']:
        # Einmalverwendung im Raid: bester Schiffszeitpunkt ODER Kolonie in R1
        raid = max(mission, r1_col)
    else:
        # Schiffsangriff in R1 oder Kolonieangriff, je nachdem besser
        raid = sum(v for p, v in ph.items() if p >= 2) + max(ph[1], r1_col)
    return MISSION_SHARE * mission + RAID_SHARE * raid

def scored(w):
    # Einsatzkosten (Kostenmodell v3, Christopher, 3.11.2026): 1. Sockel voll
    # (Theta/Omega/Delta: 0,7; normale: 1,0), weitere Sockel: normal 0,7,
    # billig 0,5 (positionell); Energie: 1. Energie 1,0, jede weitere 0,7.
    e_cost = 0 if w['energy'] < 1 else 1 + 0.7 * (w['energy'] - 1)
    units = (w['socket_cost'] + e_cost) or 0.5
    credit = sum(DEF_CREDIT[t][min(n, 3) - 1] for t, n in w.get('def_types', {}).items())
    return (effective(w) / units + credit) * SURV_CREDIT

def main():
    apply_final = '--final' in sys.argv
    weapons = load_weapons()
    for w in weapons:
        if apply_final and w['id'] in FINAL:
            f = FINAL[w['id']]
            w['damage'], w['energy'] = f['dmg'], f['e']
            if f['abz']: w['abz'].update(f['abz'])
    for w in weapons:
        w['scored'] = round(scored(w), 2)
    tag = 'mit beschlossenen Aenderungen' if apply_final else 'Status quo'
    print(f"=== Metrik v9 ({tag}) ===")
    for rar in range(1, 6):
        grp = [w['scored'] for w in weapons if w['rarity'] == rar]
        print(f"r{rar}: Median {statistics.median(grp):5.2f} vs Ziel {TARGETS[rar]} (n={len(grp)})")
    print(f"\n-- Unter der Kurve (< -{THR_BACKLOG:.2f}) --")
    for w in sorted(weapons, key=lambda x: x['scored']):
        if w['scored'] - TARGETS[w['rarity']] < -THR_BACKLOG:
            print(f"  {w['id']:>3} r{w['rarity']} {w['title'][:24]:<24} {w['scored']:5.2f} ({w['scored']-TARGETS[w['rarity']]:+.2f})")
    print(f"\n-- Ueber der Kurve (> +{THR_NERF:.2f}) --")
    for w in sorted(weapons, key=lambda x: -x['scored']):
        if w['scored'] - TARGETS[w['rarity']] > THR_NERF:
            print(f"  {w['id']:>3} r{w['rarity']} {w['title'][:24]:<24} {w['scored']:5.2f} (+{w['scored']-TARGETS[w['rarity']]:.2f})")
    # Watchlist (+1.15 .. +1.725, skaliert mit lambda)
    print(f"-- Watchlist (+{THR_WATCH:.2f} bis +{THR_NERF:.2f}) --")
    for w in sorted(weapons, key=lambda x: -x['scored']):
        d = w['scored'] - TARGETS[w['rarity']]
        if THR_WATCH <= d <= THR_NERF:
            print(f"  {w['id']:>3} r{w['rarity']} {w['title'][:24]:<24} {w['scored']:5.2f} (+{d:.2f})")
    # Manuelle Watchlist (Christopher, 3.11.2026): unterhalb der automatischen
    # Schwelle, aber beobachten; 347 erstmals +0.51 nach SAbz-Runde.
    MANUAL_WATCHLIST = {'347': 'Impulslaser +0.51 (3.11.2026, X-Switch-Runde)'}
    print("\n-- Manuelle Watchlist (unter +1.0) --")
    for wid, note in MANUAL_WATCHLIST.items():
        w = next(x for x in weapons if x['id'] == wid)
        d = w['scored'] - TARGETS[w['rarity']]
        print(f"  {w['id']:>3} r{w['rarity']} {w['title'][:24]:<24} {w['scored']:5.2f} ({d:+.2f})  {note}")
    json.dump(weapons, open(f"weapons_v9{'_final' if apply_final else ''}.json", 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main()
