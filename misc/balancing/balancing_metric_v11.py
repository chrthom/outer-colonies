#!/usr/bin/env python3
"""Defense-Metrik v11 (3.11.2026, Runde 7: gemischte Flotten, Runde-6-Review).

Rahmen (Christopher, 3.11.2026, Runde-6-Review + Entscheidungen 3+5):
  - 3v3-Gefecht mit GEMISCHTEN, GESPIEGELTEN Flotten: je Seite 3 Schiffe
    UNTERSCHIEDLICHER Groesse/Klasse - je 1 ein-, zwei- und dreiteiliges
    Schiff (z. B. Korvette + Fregatte + Kreuzer), Verteidiger = Spiegel
    der Angreifer-Flotte (gleiche 3 Schiffe in gleicher Position).
    => innerhalb der Flotte unterschiedliche HP UND Speeds, Halbierung
    triggert auch in der Baseline paar-genau (Regel).
  - Waffen-Sockel-Kompatibilitaet: nur Schiffe mit den benoetigten
    Sockeln (Theta/Xi/Phi, z. T. +Omega wie 150/224) tragen die je
    Gefecht gezogene Waffe (1 Instanz je traegendem Schiff). Flotten
    werden so lange neu gezogen, bis JE Seite mind. 1 Traeger hat
    (sonst waere das Gefecht waffenlos / wertlos).
  - Raritaets-Haeufigkeit (Christophers Runde-6-Punkt 3): Schiff-Gewicht
    = RARTESTE Sektion (Bottleneck; Ein-Karten-Schiff = Karten-Raritaet),
    nicht das Produkt - ein Kreuzer mit r3-Kern haengt wie eine r3-Karte.
    ZWEIstufige Ziehung (Runde-7-Punkt 3): erst SCHIFFSTYP (gewichtet mit
    der guenstigsten Bauweise), dann konkreter Build - sonst dominieren
    Kartenvielfalten (5x Korvette r0) den Slot statt der Speed-/HP-
    Vielfalt (Blockadebrecher sp5, Kanonenboot sp3, ...).
  - Raid (50 %): ASYMMETRISCH - Seite 1 ueberfaellt die Kolonie von
    Seite 0; nur Seite-1-Instanzen koennen auf R1 auf die Kolonie
    ausweichen (wenn r1_col > erwarteter Schiffschaden, nie halbiert).
    Die RAID-VERTEIDIGER-Flotte wird separat gezogen und ENTHAELT
    STATIONEN (Orbitaler Aussenposten 1-teilig, Raumstation 2-teilig,
    Sternbasis 3-teilig; speed 0 - koennen nicht ausweichen, ihre
    Angriffe auf schnelle Schiffe werden paargenau halbiert).
  - Missions-Gefechte (50 %): Spiegel beider Flotten, nur Schiffe
    mit speed >= 1 (Abfangflotte). Abfang-Ausduennung (Runde 12c,
    Christopher): Abfaenger-Schiffe (Seite 1) mit speed < langsamstem
    Schiff der Kartenflotte NACH Karten-Bonus kommen nicht mit
    (Abfangregel: Speed >= langsamstem Missions-Schiff; Spiegel-
    Baseline bleibt 3v3, Gleichstand qualifiziert). Kein Abfaenger
    schnell genug = NICHT abgefangen: Gefecht entfaellt, Missionslohn
    = volle Flotten-Kontrolle (CTRL_W x Summe control, Gegner 0).
  - Focus Fire, PD schiffsuebergreifend (verfaellt mit Schiffstod),
    Feuereihenfolge alterniert, Einmalwaffen 1x in min(range, 4).
  - Halbierung deterministisch je Paar (eigene speed + Phasen-
    reichweite < Ziel-speed — historische Pre-v22-Regel, im Legacy-
    Motor bewusst erhalten; der Server rechnet seit #813 (7.11.2026)
    <= und die Sonde (diag_random_r13t.py) misst seit v22 ebenfalls
    Tie-Halving, nur dieser v11-Motor bleibt bei <;
    Ziel muss isFlightReady sein; s. auch Waffen-Range-Check:
    Waffenreichweite >= Phasenreichweite); 401 Guillotine: -6 x konkreter Ziel-
    Speed; Hintergrund-Defense-Build je Gefecht einmal gezogen und
    identisch auf alle Schiffe beider Seiten (v9.SHIP-Pools: nur
    S/P/PD, keine hp-/speed-Ausruestung - bewusste Vereinfachung).

Wertdefinition = DIFFERENZ-RAHMEN v3 (Runde 11b, Christophers Beschluss):
Erwarteter Mehr-Wert des Verteidigers durch die Karte, Wert-Konto je
Gefecht = Output-Marker (dealt, nach Abzuegen) - erlittene Marker auf
eigenen Schiffen (taken = Gegner-Output) - Kolonie-Marker (Kap 50 HP,
Raid) + Missionslohn (Kontrolle: CTRL_W x max(0, control eigene
ueberlebende - control gegnerische ueberlebende Schiffe), code-
verankert: rules.ts controlLimit 15 == colonyHP 50 -> 1 Kontrolle =
50/15 Marker). Die bilaterale Differenz ist unter Schadensmarker-
Persistenz (Heilung nur via Zurueck-auf-Hand, Regeln: Aufbauphase) die
HP-Materiell-Bilanz: dealt - taken = (gegnerische HP zerstoert UND
beschaedigt) - (eigene). EQ-Konto ENTFALLEN (Christophers Runde-11-
Argument: Karten sind die knappe Ressource, Anzahl im Szenario konstant
1/Schiff; Messung +-0,07 bei Rang-Korrelation +1,00); Tod laeuft ueber
taken + Output intern. Nicht erfasst (dokumentiert): abstrakte Pool-
Ausruestung (keine belastbare Kostenbasis), Tod-Zuschlag ueber HP hinaus
(Schiffs-/Ausruestungskarten, symmetrisch gekuerzt), Kartenziehen-Loot.
Take-Gewicht 1,0 (Obergrenze; Heilungs-Tempo-Kosten -> Regler, per
Playtest zu justieren). Platzierung je Verteidiger-Schiff 1 Instanz
("3x Defense"), Wert-Gewinn /3 normalisiert; gepaarte Zuege (Common
Random Numbers). Prevented nur Diagnose-Spalte.

Score = Wert-Gewinn / Einsatzkosten v3. Missionswert-Korrektur Option B v1
(5,45 Marker je Speed-Punkt) ENTFALLEN (Runde 12c, Christophers Beschluss):
Abfang-Ausduennung und Lohn des nicht abgefangenen Gefechts sind jetzt
endogen im Frame; der Formel-Credit waere eine Doppelbuchung.

Aufruf: python3 balancing_metric_v11.py [N_GEFECHTE]   (inkrementell, Cache)
"""
import csv as _csv
import itertools
import json
import os
import random
import statistics
import sys
import time

import balancing_metric_v10 as v10
import balancing_metric_v9 as v9

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'v11_cache.json')
N_SHIPS = 3
PHASES = (4, 3, 2, 1)
# Platzierung der bewerteten Karte (Christophers Entscheidung 3: "3x
# Defense"): True = je Verteidiger-Schiff 1 Instanz, Gain/3 normalisiert.
# False (Diagnose): uniform zufaellig auf EINEM Schiff, ohne Normalisierung.
SPEC_ALL3 = True
# --- Rahmen v3 (Runde 11b): Differenz-Rahmen, EQ-Konto entfallen ---
# EQ_RATE (Frame v2, Runde 9/10) ENTFALLEN: Tode laufen ueber taken/Output
# intern; ein Karten-Anzahl-Malus waere konstant 1/Schiff (Christophers
# Karten-Argument) und brachte nur +-0,07 bei Rang-Korrelation +1,00.
COLONY_HP = 50.0     # Kolonie-HP (rules.ts: colonyHP = 50)
# Missionslohn (Runde 10, Christophers Vorgabe): Vorherrschaft-Sieg bei 15
# control (rules.ts: controlLimit = 15) == Zerstoerungs-Sieg bei 50 Kolonie-
# Markern (rules.ts: colonyHP = 50) -> 1 Kontrolle-Punkt = 50/15 Marker.
# Missionslohn im Gefecht (battle.ts: applyMissionResult): Erfolg bei
# >= 1 ueberlebendem eigenen Schiff; Kontrolle = max(0, Summe control der
# eigenen ueberlebenden - der gegnerischen ueberlebenden Schiffe).
CTRL_W = 50.0 / 15.0
# Zielkurve v14 (3.11.2026, Runde 12c): r1-r4 = Mediane der 50 FINAL-
# Waffen-Scores je Raritaet im Rahmen v3 (check9, N=10.000); r5 =
# Trend-Extrapolation 3,55 statt Messwert 2,88 (Christophers Beschluss:
# strenge Monotonie - seltenere Raritaet performt stets besser; der
# gemessene r5-Median lag UNTER r4 3,25, Inversion robust in N=3k/10k).
# Zielkurve v17 (Christophers Beschluss Runde 13j, 4.11.2026, geglaettet
# ueber den sauberen v16-Messwerten 8,54/7,77/8,96/7,53/8,56 — Frame nach
# Muenz-/wspec-Bugfix, HP ×0,5): 7,8/8,0/8,4/9,0/9,8 — streng monoton mit
# deutlich mehr Abstand am oberen Ende (Design-Regel: seltenere Raritaet
# performt stets besser; r4/r5 liegen bewusst ueber den Messwerten).
# Zielkurve v18 (Christophers Beschluss Runde 13n, 4.11.2026, geglaettet
# ueber den 13n-Messmedianen 4,77/4,78/6,09/6,54/7,23): 4,7/5,0/5,8/6,6/7,4.
# Zielkurve v20 (Christophers Beschluss Runde 13q, 4.11.2026, geglaettet
# ueber den v20-Messmedianen 4,11/4,18/5,54/5,88/6,38 — Frame 13q:
# Referenz-Nachfrage M=2, Statkarten n_inst je Kopie) — GEMEINSAME
# Kurve fuer Waffen UND Statkarten (alte Runde-8-Praemisse wieder
# aktiv, Christophers Beschluss 4.11.2026): 4,0/4,3/5,1/6,0/7,0.
# r1 unter / r5 weit ueber dem Messmedian (Design-Regel: seltenere
# Raritaet performt stets besser).
TARGETS_V14 = {1: 4.0, 2: 4.3, 3: 5.1, 4: 6.0, 5: 7.0}


def weapon_units(w):
    """Einsatzkosten v3 einer Waffe (socket_cost + Energie, wie check9)."""
    e = w['energy']
    e_cost = 0 if e < 1 else 1 + 0.7 * (e - 1)
    return (w['socket_cost'] + e_cost) or 0.5


def value(dealt, taken, colony, loot):
    """Wert-Konto je Gefecht (Seite 0 / Verteidiger), Rahmen v3
    (Differenz): Output - Gegner-Output (taken = Marker auf eigenen
    Schiffen) - Kolonie-Marker + Missionslohn (Kontrolle)."""
    return dealt - taken - colony + loot


# --- HP-Konto (Christophers Beschluss 4.11.2026, Runde 13i, ERHOEHT
# 6.11.2026 Runde 13t): statischer Zuschlag x hp je Gefecht aufs
# Karten-Konto. 13i: 0,5 (Mitte zwischen rein dynamischer Buchung ~0,16
# Auslastung und vollem 1:1-Konto). 13t: 1,0 — volles HP-Konto, weil
# die Faktor-2-Analyse zeigte, dass +hp-Karten den Trager laenger am
# Leben halten und damit MEHR Schaden einstecken (take negativ), was
# nur das volle Konto ausgleicht. ---
HP_STATIC = 1.0


def card_score(c, gain):
    """Karten-Score im Rahmen v16: dynamischer gain je Gefecht
    (3x Platzierung, /3 normiert) + statisches HP-Konto, / units."""
    return (gain + HP_STATIC * c['hp']) / c['units']


def mission_credit(c, loot_intercept):
    """(Runde 12c: IM OFFIZIELLEN SCORE ENTFALLEN - die Abfang-Ausduennung
    zahlt den Speed-Mechanismus jetzt endogen; Funktion bleibt NUR fuer
    diag_frame_compare.py (Runde-11-Diagnose) erhalten.)
    Option-B-Korrektur (Abfang-Vermeidung, nur Speed-Karten): Der Frame
    simuliert immer das ABGEFANGENE Gefecht und zahlt dort den Missionslohn.
    Dieser Kredit korrigiert um die Wahrscheinlichkeitsverschiebung Richtung
    'nicht abgefangen': delta_P je +1 Speed x (voller Flotten-Lohn ohne
    Abfang minus erwarteter abgefangener Lohn) x speed. (v10.mission_credit mit
    W=4-Regler war die interim-Version; W ist jetzt code-verankert.)"""
    return v10.MISSION_SHARE * v10.DELTA_P * (LOOT_NO_INTERCEPT - loot_intercept) \
        * (c.get('speed') or 0)

weapons = v10.load_attackers(final=True)
wtot = sum(v10.RARITY_W[w['rarity']] for w in weapons)
widx = list(range(len(weapons)))
wweights = [v10.RARITY_W[w['rarity']] / wtot for w in weapons]
for w in weapons:
    w['fire_phase'] = min(w['range'], 4)
    w['r1_col'] = v10.colony_r1(w)

# --- Runde 13e (Christophers Beschluss): PD-Anteil der Baseline-Ausruestung
# senken, Schild/Panzerung dafuer erhoehen. Je PD-Karte einer Pool-Ziehung
# wechselt POOL_SHIFT der Faelle deterministisch zur Haelfte zur Schild- bzw.
# Panzerungskarte mit GLEICHEN Punkten (PD1->S1/A1, PD2->S2/A2).
# Shift 25 %: P(PD) 46,4 -> ~34 %, P(Schild) 20 -> ~30 %, P(Panzerung)
# 22,7 -> ~25 % (Koloniezonen-Pools unveraendert).
# --- Runde 13l (Christophers Beschluss 4.11.2026): ZURUECK auf 0.0 —
# Original-Verteilung (46,4 % PD); shift0-Probe zeigte, dass die
# Umschichtung den Torpedo-Flip nicht erklaert (412 blieb +4,49), und
# der Zielframe wird ohnehin neu verankert. ---
POOL_SHIFT = 0.0

def _shifted_pools(shift=POOL_SHIFT):
    if shift <= 0:
        return list(v9.SHIP)
    agg = {}
    for cards, prob in v9.SHIP:
        states = [([dict(c) for c in cards], 1.0)]
        for i, c in enumerate(cards):
            if c['type'] != 'pd':
                continue
            nxt = []
            for cs, pr in states:
                keep = [dict(x) for x in cs]
                nxt.append((keep, pr * (1 - shift)))
                for t in ('shield', 'armour'):
                    nc = [dict(x) for x in cs]
                    nc[i] = {'type': t, 'points': c['points'],
                             'recharge': v9.RECHARGE[t]}
                    nxt.append((nc, pr * shift / 2.0))
            states = nxt
        for cs, pr in states:
            key = tuple(sorted((c['type'], c['points']) for c in cs))
            a = agg.setdefault(key, [cs, 0.0])
            a[1] += prob * pr
    return [entry for entry in agg.values() if entry[1] > 0]

pools = _shifted_pools()
ptot = sum(p for _, p in pools)
pprob = [p / ptot for _, p in pools]

RW = {0: 32, 1: 16, 2: 8, 3: 4, 4: 2, 5: 1}
SOCKET_COLS = ('socket_a', 'socket_b', 'socket_d', 'socket_e', 'socket_f', 'socket_g')


def _socks(r):
    s = {}
    for c in SOCKET_COLS:
        if r[c] and r[c].lstrip('-').isdigit():
            v = int(r[c])
            if v > 0:
                s[c.replace('socket_', '')] = v
    return s


def weapon_reqs():
    """Sockel-ANFORDERUNGEN der Waffen (negative Werte) je id."""
    reqs = {}
    wids = {w['id'] for w in weapons}
    with open(v9.CARDS_CSV, newline='', encoding='utf-8') as f:
        for r in _csv.DictReader(f, delimiter=';', quotechar='"'):
            if r['id'] not in wids or r['type'] != 'equipment':
                continue
            req = {}
            for c in SOCKET_COLS:
                if r[c] and r[c].lstrip('-').isdigit() and int(r[c]) < 0:
                    req[c.replace('socket_', '')] = -int(r[c])
            reqs[r['id']] = req
    return reqs


WREQ = weapon_reqs()


def compatible(w, build):
    return all(build['socks'].get(t, 0) >= n for t, n in WREQ.get(w['id'], {}).items())


def ship_builds():
    """Komplette Schiffe (Runde 6/7):
    - einteilige Hullen: Schiff = Karte (HP, Speed, Sockel, Raritaet).
    - mehrteilige: Produkt ueber Bug/Kern/Heck (Stationen: Sektionen mit
      Wiederholung); HP = Summe, Sockel = Summe, GEWICHT = rarste Sektion
      (Bottleneck, Christophers Runde-6-Punkt 3).
    - H1-SPEED-SUMMEN-FIX (8.11.2026, Christophers Beschluss 6.11.2026
      „Code = Wahrheit"): `card_profile.ts` `profile.combine()` SUMMIERT
      die Sektions-Speeds — Schiffs-Speed = SUMME statt Heck-/Max-Speed
      (die alte v11-Annahme „Speed = Heck-Speed" war eine Vereinfachung;
      Bug-Sektionen mit sp-1 (120/326/328) reduzieren den realen
      Schiffsspeed). Historische v11-/v23g-Messungen (bis 8.11.2026)
      liefen noch auf Heck-/Max-Speed.
    ZWEIstufige Ziehung (Christophers Runde-7-Punkt 3): erst SCHIFFSTYP
    (Korvette, Zerstoerer, Kreuzer, ...), gewichtet mit dem Bottleneck-
    Gewicht der GUENSTIGSTEN Bauweise des Typs (sonst wuerden Karten-
    vielfalte wie 5x Korvette r0 den Slot 73 % dominieren, statt der
    Speed-/HP-Vielfalt wie Blockadebrecher sp5 / Kanonenboot sp3);
    dann konkreter Build innerhalb des Typs (Build-Gewicht = Bottleneck).
    Rueckgabe (Builds, Typgewichte {(parts, typ): gewicht})."""
    singles = []
    parts = {}
    with open(v9.CARDS_CSV, newline='', encoding='utf-8') as f:
        for r in _csv.DictReader(f, delimiter=';', quotechar='"'):
            if not (r['implemented'] == 'yes' and r['type'] == 'hull'
                    and r['rarity'] and int(r['hp'] or 0) > 0):
                continue
            card = dict(title=r['title'], tags=r['tags'],
                        hp=int(r['hp']), ctrl=int(r['control']) if r['control'] else 0,
                        speed=int(r['speed']) if r['speed'] else 0,
                        rw=RW[int(r['rarity'])], socks=_socks(r))
            if r['tags'].startswith('Komponenten'):
                base = r['title'].split(' (')[0].strip()
                parts.setdefault(base, []).append(card)
            else:
                singles.append(card)
    builds = []
    type_best = {}

    def add(combo, n, typ, speed=None):
        socks = {}
        for c in combo:
            for t, k in c['socks'].items():
                socks[t] = socks.get(t, 0) + k
        # H1-Speed-Summen-Fix (8.11.2026): SUMME der Sektions-Speeds
        # (Code = Wahrheit, profile.combine()); der speed-Parameter
        # (Heck-Speed-Sonderfall) entfaellt.
        sp = speed if speed is not None else sum(c['speed'] for c in combo)
        w = min(c['rw'] for c in combo)
        type_best[(n, typ)] = max(type_best.get((n, typ), 0.0), w)
        builds.append(dict(hp=sum(c['hp'] for c in combo), s=sp, parts=n,
                           socks=socks, w=w, type=typ,
                           ctrl=sum(c['ctrl'] for c in combo)))

    for c in singles:
        type_best[(1, c['title'])] = max(type_best.get((1, c['title']), 0.0),
                                         c['rw'])
        builds.append(dict(hp=c['hp'], s=c['speed'], parts=1,
                           socks=dict(c['socks']), w=c['rw'], type=c['title'],
                           ctrl=c['ctrl']))
    for base, cards in parts.items():
        inner = cards[0]['tags']
        inner = inner[inner.index('(') + 1:inner.rindex(')')]
        if 'Sektion' in inner:
            n = int(inner.split('x')[0].strip())
            for combo in itertools.combinations_with_replacement(cards, n):
                add(combo, n, base)
        else:
            req = [p.strip() for p in inner.split(',')]
            by_part = {}
            for c in cards:
                part = c['title'].split('(')[-1].rstrip(')').strip()
                by_part.setdefault(part, []).append(c)
            missing = [p for p in req if p not in by_part]
            assert not missing, f'{base}: Teile fehlen {missing}'
            for combo in itertools.product(*[by_part[p] for p in req]):
                add(combo, len(req), base)
    merged = {}
    for b in builds:
        key = (b['hp'], b['s'], b['parts'], b['type'], b['ctrl'],
               tuple(sorted(b['socks'].items())))
        merged[key] = merged.get(key, 0.0) + b['w']
    out = [dict(hp=k[0], s=k[1], parts=k[2], type=k[3], ctrl=k[4],
                socks=dict(k[5]), w=v)
           for k, v in sorted(merged.items())]
    return out, type_best


ALL_BUILDS, TYPE_BEST = ship_builds()
BUILDS_BY = {}
for b in ALL_BUILDS:
    BUILDS_BY.setdefault((b['parts'], b['type']), []).append(b)
TYPES_BY_N = {n: sorted({t for (m, t) in BUILDS_BY if m == n}) for n in (1, 2, 3)}
# Mission: nur flugfaehige Schiffe (speed >= 1); Raid-Verteidiger inkl. Stationen.
MISSION_TYPES = {n: [t for t in TYPES_BY_N[n]
                     if any(b['s'] >= 1 for b in BUILDS_BY[(n, t)])]
                 for n in (1, 2, 3)}
RAID_TYPES = TYPES_BY_N
for n in (1, 2, 3):
    assert MISSION_TYPES[n] and RAID_TYPES[n], f'Größenklasse {n} leer'

# Erwartete Flotten-Kontrolle (Option-B-Korrektur): gewichteter Mittelwert
# ueber die zweistufige Typ/Build-Ziehung der Missionsflotte (3 Schiffe).
E_FLEET_CTRL = 0.0
for _n in (1, 2, 3):
    _types = MISSION_TYPES[_n]
    _tw = sum(TYPE_BEST[(_n, t)] for t in _types)
    for _t in _types:
        _bl = BUILDS_BY[(_n, _t)]
        _bw = sum(b['w'] for b in _bl)
        E_FLEET_CTRL += TYPE_BEST[(_n, _t)] / _tw \
            * sum(b['w'] * b['ctrl'] for b in _bl) / _bw
LOOT_NO_INTERCEPT = CTRL_W * E_FLEET_CTRL

cards = v10.load_defense()


def draw_fleet(types_by_n, rng=random):
    """3 Schiffe unterschiedlicher Groesse: je 1x 1-, 2-, 3-teilig.
    Zweistufig: erst Typ (Gewicht = günstigste Bauweise), dann Build."""
    fleet = []
    for n in (1, 2, 3):
        types = types_by_n[n]
        t = rng.choices(types, weights=[TYPE_BEST[(n, t)] for t in types])[0]
        bl = BUILDS_BY[(n, t)]
        fleet.append(rng.choices(bl, weights=[b['w'] for b in bl])[0])
    return fleet


def draw_battle(rng=random):
    """Waffe + Flottenpaar ziehen (beide Seiten >= 1 Waffentraeger)."""
    w = weapons[rng.choices(widx, weights=wweights)[0]]
    while True:
        att = draw_fleet(MISSION_TYPES, rng)
        if any(compatible(w, b) for b in att):
            break
    raid = rng.random() < 0.5
    if raid:
        while True:
            deff = draw_fleet(RAID_TYPES, rng)
            if any(compatible(w, b) for b in deff):
                break
    else:
        deff = list(att)   # Spiegel (Mission: Abfangflotte, keine Stationen)
    return w, att, deff, raid


def battle(w, att, deff, pool_cards, fire, order, spec=None, ship=None,
           raid=False, spread=False, wspec=None, wspec_fire=None,
           colpool=None, wspec_side=0, spec_side=0, ret='legacy',
           spec_n_inst=False, dmg_scale=None, col_rule='std'):
    """Ein Gefecht. Seite 0 = Verteidiger (deff, bewertete Karte),
    Seite 1 = Angreifer (att; im Raid ueberfaellt er die Kolonie von
    Seite 0). fire[u][i][p] je Seite u, Schiff i, Phase p.
    wspec/wspec_fire (Kalibrierungs-Frame, check9): zusaetzliche
    Waffe auf JEDEM Verteidiger-Schiff (1 Instanz, abstrakt ohne
    Sockel-Check analog zur Karten-Platzierung); wspec_fire[i][p]
    = Feuer-Muenzen. Nur für die Kurven-Verankerung, nicht für die
    Karten-Metrik selbst. colpool: Koloniezonen-Defense-Pool (Raid),
    fuer das Kolonie-Konto (Kolonieangriff unabhaengig von Sockel-/
    Schiffs-Defense, unhalbiert, Kolonie-Killer x2; Kap COLONY_HP).
    Rueckgabe (taken_def, dealt_def, dead_def, dead_att, colony, eq,
    loot): colony = Kolonie-Marker (Seite 0), eq = Kosteneinheiten der
    Waffen-Instanzen toter eigener Traeger (Seite 0, seit Rahmen v3 nur
    Diagnose, nicht mehr im Wert-Konto),
    loot = Missionslohn in Markern (nur Mission: CTRL_W x max(0,
    control eigene ueberlebende - control gegnerische ueberlebende
    Schiffe), battle.ts: applyMissionResult). Missionen mit Abfang-
    Ausduennung (Runde 12c); bei Nicht-Abfangen (kein Abfaenger
    schnell genug): Rueckgabe (0, 0, 0, 0, 0, 0, CTRL_W x Flotten-
    Kontrolle)."""
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
            if side == spec_side and spec is not None and (ship is None or i == ship):
                # --- Runde 13r (Christophers Beschluss 4.11.2026): die
                # Bedingung (cond) der bewerteten Karte wird in der
                # SIMULATION GESTRICHEN — sie wird IMMER platziert
                # ("Wir simulieren den Fall, dass sie wirklich eingesetzt
                # wird"). Die ECHTE Karte behaelt ihre Bedingung (Effekt-
                # text, v10.COND: 426 need_shield / 312 no_shield). Der
                # bisherige bad-Block liess 426 in 96,5 % und 312 in
                # 69 % der Gefechte unplatziert; fuer Karten OHNE cond
                # ist die Aenderung bit-identisch. ---
                # --- Runde 13q (Christophers Beschluss 4.11.2026):
                # Statkarten-Platzierung analog c3/n_inst — die
                # bewertete Karte erhaelt auf 3-teiligen Schiffen
                # 2 Kopien (1x auf 1-/2-teiligen), Normierung dann
                # auf JE KOPIE (Flotte: 4 Platzierungen -> gain/4
                # statt /3). Default spec_n_inst=False = 1x je
                # Schiff (bisheriges Verhalten, check10). ---
                n = (2 if b['parts'] == 3 else 1) if spec_n_inst else 1
                ship_hp += n * spec['hp']
                s_bonus = n * spec['speed']
                for c in spec['added']:
                    for _k in range(n):
                        if c['type'] == 'pd':
                            side_pd.append((dict(c), i))
                        else:
                            cpool.append(dict(c))
            if side == wspec_side and wspec is not None \
                    and wspec.get('def_pts', 0) > 0:
                # --- Runde 13p (Christophers Beschluss 4.11.2026): die
                # bewertete Waffe zahlt ihre Defensivpunkte (abm u. a.)
                # je Traeger-Schiff in den Flotten-Defense-Pool ein —
                # analog zur Karten-Platzierung (spec-Block oben) und
                # serverkonform (card.ts attackStep: Defense-Karten der
                # verteidigenden Flotte wirken kumulativ; Reduktion =
                # Abzug x Defensivpunkte; point_defense_cards.ts:
                # EquipmentCardRechargeable = RechargeRate.PerRound ->
                # recharge 'phase'; PD wirkt nur gegen Angreifer mit
                # eigenem PD-Abzug = Torpedos). Nur die BEWERTETE Waffe
                # zahlt; die abstrakte Gefechtswaffe der Umgebung bleibt
                # unbezahlt (Frame-Philosophie: Umgebung = Lieferant,
                # Deltamessung nur ueber die bewertete Karte). ---
                for t, pts in wspec['def_types'].items():
                    side_pd.append((dict(type=t, points=pts, used=False,
                                         recharge=v9.RECHARGE[t]), i))
            pds = [(dict(c), i) for c in cpool if c['type'] == 'pd']
            side_pd.extend(pds)
            cards_nopd = [dict(c) for c in cpool if c['type'] != 'pd']
            ships.append(dict(cards=cards_nopd, taken=0.0, dead=False,
                              hp=ship_hp, s=b['s'] + s_bonus,
                              ctrl=b['ctrl'],
                              n_inst=(2 if b['parts'] == 3 else 1),
                              carrier=compatible(w, b)))
        fleet.append(ships)
        fleet_pd[side] = side_pd
    # --- Abfang-Ausduennung (Runde 12c, nur Mission, s. Docstring) ---
    if not raid:
        s0min = min(sh['s'] for sh in fleet[0])
        kept = [(i, sh) for i, sh in enumerate(fleet[1]) if sh['s'] >= s0min]
        if not kept:
            # Nicht abgefangen: kein Gefecht, volle Flotten-Kontrolle
            own_c = sum(b['ctrl'] for b in deff)
            if ret == 'full':
                return dict(taken0=0.0, taken1=0.0, dealt0=0.0, dealt1=0.0,
                            dead0=0, dead1=0, colony=0.0, eq0=0.0,
                            loot0=CTRL_W * own_c, loot1=0.0)
            return 0.0, 0.0, 0, 0, 0.0, 0.0, CTRL_W * own_c
        remap = {old: new for new, (old, _) in enumerate(kept)}
        fleet[1] = [sh for _, sh in kept]
        fleet_pd[1] = [(c, remap[oi]) for c, oi in fleet_pd[1]
                       if oi in remap]
    dealt = [0.0, 0.0]
    for p in PHASES:
        for u in order:
            own, enemy = fleet[u], fleet[1 - u]
            # --- Runde 13q: Nachfrage-Skalierung der UMGBUNGS-
            # Bewaffnung je Seite (Diagnose): dmg_scale = (s0, s1)
            # multipliziert den Waffenschaden der Seite u. Nur fuer
            # die Saettigungs-Diagnose (diag_saturation_r13q.py),
            # Standard None = unveraendert. Die bewertete Karte
            # (wspec/spec) wird NICHT skaliert. ---
            wd = w['damage'] * (dmg_scale[u] if dmg_scale else 1.0)
            e_pd = [(c, oi) for c, oi in fleet_pd[1 - u]
                    if not enemy[oi]['dead']]
            for i, sh in enumerate(own):
                if sh['dead'] or not sh['carrier']:
                    continue
                # --- Runde 13j-Fix (2 Bugs, 4.11.2026): ---
                # (a) Muenz-Index: fire-Listen werden in PHASES-Ordnung
                #     (4,3,2,1) aufgebaut -> Index 4-p, NICHT p-1 (davor
                #     feuerte Phase 4 mit 70 % statt 100 % und Phase 1 mit
                #     100 % statt 70 % — Christophers User-Vorgabe
                #     ATTACK_PROB = {4: 1.00, ...} war verletzt).
                if w['single']:
                    if p != w['fire_phase'] or not fire[u][i][4 - p]:
                        continue
                elif p > w['range'] or not fire[u][i][4 - p]:
                    continue   # Regel: Waffenreichweite >= Phasenreichweite
                # --- Frame v16 (Christophers Beschluss 4.11.2026, Runde 13i):
                # 2-/3-teilige Schiffe tragen IMMER 2 Waffen (1-teilige 1);
                # 2 Schuesse a dmg sind NICHT 1 Schuss a 2xdmg (Abzuege/
                # Deaktivierung wirken je Schuss). Gefechts- und bewertete
                # Waffe feuern je n_inst Instanzen auf dieselbe Feuermuenze. ---
                col_shot = False
                for _inst in range(sh['n_inst']):
                    if spread:
                        tgt_i = i if not enemy[i]['dead'] else next(
                            (j for j, e in enumerate(enemy) if not e['dead']), None)
                    else:
                        tgt_i = next((j for j, e in enumerate(enemy) if not e['dead']), None)
                    if tgt_i is None:
                        break
                    tgt = enemy[tgt_i]
                    base = max(0, wd - (6 * tgt['s'] if w['id'] == '401' else 0))
                    halved = sh['s'] + p < tgt['s']    # historische Pre-v22-Regel (<); Server seit #813 <=, Sonde >= (Tie-Halving)
                    d = v9.half(base) if halved else base
                    pool = tgt['cards'] + [c for c, _ in e_pd]
                    # --- Runde 13r (Kolonie-Zielwahl, Christopher): col_rule
                    # steuert die R1-Zielwahl im Raid. 'std' (Default) =
                    # alter Vergleich w['r1_col'] (0,7-diskontierter
                    # Erwartungswert) > Brutto-Schiffschuss d VOR Schiff-
                    # Defense — regressionsneutral. 'eff' = rationaler
                    # Vergleich des NUTZBAREN Schadens: Kolonie-Effektiv-
                    # schaden (nach Koloniezonen-Defense, x2 bei Kolonie-
                    # Killern; die 70 %-Feuer-Muenze ist bei der Zielwahl
                    # schon gefallen, KEIN weiteres 0,7) vs. Schiffschaden
                    # nach Defense, auf die verbleibende Ziel-HP gedeckelt
                    # (Overkill zaehlt bei der Wahl nicht). 'always' =
                    # R1 im Raid immer Kolonie (Obergrenze). Die BUCHUNG
                    # bleibt in allen Regeln unveraendert ( voller Schaden,
                    # Overkill wird nicht gekappt — Wertdefinitionsthema,
                    # nur mit Beschluss). ---
                    col_dec = False
                    dmg = None
                    cd = None
                    if raid and u == 1 and p == 1:
                        if col_rule == 'std':
                            if w['r1_col'] > d:
                                col_dec = True
                        elif w['r1_col'] > 0 and colpool is not None \
                                and colony < COLONY_HP:
                            # --- Christophers Beschluss 13r: 'always' =
                            # R1 im Raid IMMER Kolonie, AUSSER Kolonie-
                            # wirkungslose Waffen (no_colony: 203/401/438,
                            # r1_col == 0 -> Schiffschuss). Gilt analog
                            # fuer 'eff' (wirkt sonst faelschlich Kolonie-
                            # schaden bei no_colony). ---
                            cd = v9.resolve_attack(
                                w, [dict(c) for c in colpool], wd) \
                                * (2 if w['colony_killer'] else 1)
                            if col_rule == 'always':
                                col_dec = True
                            else:   # 'eff'
                                dmg = v9.resolve_attack(w, pool, d)
                                ship_util = min(dmg, max(0.0,
                                              tgt['hp'] - tgt['taken']))
                                col_dec = cd >= ship_util
                    if col_dec:
                        if cd is None:   # 'std': Buchung wie bisher
                            if colpool is not None and colony < COLONY_HP:
                                cd = v9.resolve_attack(
                                    w, [dict(c) for c in colpool], wd) \
                                    * (2 if w['colony_killer'] else 1)
                                colony = min(COLONY_HP, colony + cd)
                        elif colony < COLONY_HP:
                            colony = min(COLONY_HP, colony + cd)
                        col_shot = True
                        continue
                    if dmg is None:
                        dmg = v9.resolve_attack(w, pool, d)
                    tgt['taken'] += dmg
                    dealt[u] += dmg
                    if tgt['taken'] >= tgt['hp']:
                        tgt['dead'] = True
            # --- Kalibrierungs-Frame: bewertete Waffe (nur Seite 0),
            # ebenfalls n_inst Instanzen je Schiff (Frame v16).
            # (b) Runde 13j-Fix: EIGENE Schleife, unabhaengig von der
            # zufaelligen Gefechtswaffe — davor stand der Block im
            # Koerper der Gefechtswaffen-Schleife HINTER deren
            # continue-Guards, d.h. die bewertete Waffe feuerte nur in
            # Phasen, in denen die Gefechtswaffe desselben Traegers
            # ebenfalls feuerte (Range-4-Feuerung wurde dadurch fast nie
            # erreicht; 13i-Befund '412 range 4 = exakt 0,0' war dieses
            # Artefakt, nicht der apply-Bug allein). ---
            if u == wspec_side and wspec is not None:
                # --- Runde 13m (Christophers Beschluss 4.11.2026): die
                # bewertete Waffe wird je Gefecht in BEIDEN Rollen
                # gemessen (Seite 0 = Verteidiger, Seite 1 = Raid-
                # Angreifer mit vollstaendiger R1-Kolonie-Logik und
                # Verheerend (Kolonie) = x2); Score = Rollenmittel. ---
                for i, sh in enumerate(own):
                    if sh['dead']:
                        continue
                    ok = (p == wspec['fire_phase']) if wspec['single'] \
                        else (p <= wspec['range'])
                    if ok and wspec_fire[i][4 - p]:
                        # --- Runde 13l (Christophers Beschluss 4.11.2026):
                        # bewertete Karte nur 1x je Schiff (kein Stack-
                        # Bonus durch n_inst; Combo-Stacks bleiben
                        # gewollter Spiel-Effekt, kein Kartenwert) ---
                        for _inst in range(1):
                            tgt_i = next((j for j, e in enumerate(enemy)
                                          if not e['dead']), None)
                            if tgt_i is None:
                                break
                            tgt = enemy[tgt_i]
                            base = max(0, wspec['damage']
                                       - (6 * tgt['s'] if wspec['id'] == '401' else 0))
                            d = v9.half(base) if sh['s'] + p < tgt['s'] else base   # wie Umgebungspfad: historische <-Regel (Server/Sonde seit #813 <=)
                            pool = tgt['cards'] + [c for c, _ in e_pd]
                            # --- Runde 13r: col_rule auch fuer die bewertete
                            # Waffe (s.o., identische Regeln; 'std' =
                            # regressionsneutral). ---
                            col_dec = False
                            dmg = None
                            cd = None
                            if raid and wspec_side == 1 and p == 1:
                                if col_rule == 'std':
                                    if wspec['r1_col'] > d:
                                        col_dec = True
                                elif wspec['r1_col'] > 0 and colpool is not None \
                                        and colony < COLONY_HP:
                                    # --- Christophers Beschluss 13r:
                                    # 'always' + no_colony-Ausnahme,
                                    # s.o. (Gefechtswaffen-Block). ---
                                    cd = v9.resolve_attack(
                                        wspec, [dict(c) for c in colpool],
                                        wspec['damage']) \
                                        * (2 if wspec['colony_killer'] else 1)
                                    if col_rule == 'always':
                                        col_dec = True
                                    else:   # 'eff'
                                        dmg = v9.resolve_attack(wspec, pool, d)
                                        ship_util = min(dmg, max(0.0,
                                                      tgt['hp'] - tgt['taken']))
                                        col_dec = cd >= ship_util
                            if col_dec:
                                if cd is None:   # 'std': Buchung wie bisher
                                    if colpool is not None and colony < COLONY_HP:
                                        cd = v9.resolve_attack(
                                            wspec, [dict(c) for c in colpool],
                                            wspec['damage']) \
                                            * (2 if wspec['colony_killer'] else 1)
                                        colony = min(COLONY_HP, colony + cd)
                                elif colony < COLONY_HP:
                                    colony = min(COLONY_HP, colony + cd)
                                continue
                            if dmg is None:
                                dmg = v9.resolve_attack(wspec, pool, d)
                            tgt['taken'] += dmg
                            dealt[u] += dmg
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
    taken1 = sum(s['taken'] for s in fleet[1])
    # Asset-Konto: verlorene Waffen-Instanzen eigener toter Traeger (Seite 0)
    eq = weapon_units(w) * sum(1 for sh in fleet[0] if sh['dead'] and sh['carrier'])
    # Missionslohn (battle.ts: applyMissionResult): Kontrolle der
    # ueberlebenden Schiffe, max(0, eigene - gegnerische), nur Mission.
    if raid:
        loot = 0.0
        loot1 = 0.0
    else:
        own_c = sum(sh['ctrl'] for sh in fleet[0] if not sh['dead'])
        enemy_c = sum(sh['ctrl'] for sh in fleet[1] if not sh['dead'])
        loot = CTRL_W * max(0.0, own_c - enemy_c)
        loot1 = CTRL_W * max(0.0, enemy_c - own_c)
    if ret == 'full':
        # Runde 13m: Konten BEIDER Seiten (Rollenmittel-Messung)
        return dict(taken0=taken, taken1=taken1, dealt0=dealt[0],
                    dealt1=dealt[1], dead0=dead[0], dead1=dead[1],
                    colony=colony, eq0=eq, loot0=loot, loot1=loot1)
    return taken, dealt[0], dead[0], dead[1], colony, eq, loot


def run(n_battles, seed=23):
    random.seed(seed)
    gain = {c['id']: 0.0 for c in cards}
    prev = {c['id']: 0.0 for c in cards}
    inter = {c['id']: 0 for c in cards}
    t0s = d0s = col0s = eq0s = loot0s = 0.0
    n_mission = 0
    losses = wipes0 = wipes1 = 0
    cpools = [(cs, p) for cs, p in v9.COLONY]
    cptot = sum(p for _, p in cpools)
    for b in range(n_battles):
        w, att, deff, raid = draw_battle()
        pool_cards, _ = pools[random.choices(range(len(pools)), weights=pprob)[0]]
        colpool = None
        if raid:
            colpool = cpools[random.choices(
                range(len(cpools)), weights=[p / cptot for _, p in cpools])[0]][0]
        fire = [[[random.random() < v10.ATTACK_PROB[p] for p in PHASES]
                 for _ in range(N_SHIPS)] for _ in (0, 1)]
        order = (0, 1) if b % 2 == 0 else (1, 0)
        take0, dealt0, dead0, dead1, col0, eq0, loot0 = battle(
            w, att, deff, pool_cards, fire, order, raid=raid, colpool=colpool)
        t0s += take0
        d0s += dealt0
        col0s += col0
        eq0s += eq0
        if not raid:
            loot0s += loot0
            n_mission += 1
        losses += 1 if dead0 >= 1 else 0
        wipes0 += 1 if dead0 == 3 else 0
        wipes1 += 1 if dead1 == 3 else 0
        v0 = value(dealt0, take0, col0, loot0)
        for c in cards:
            ship = None if SPEC_ALL3 else random.randrange(N_SHIPS)
            take1, dealt1, cd0, cd1, col1, eq1, loot1 = battle(
                w, att, deff, pool_cards, fire, order,
                spec=c, ship=ship, raid=raid, colpool=colpool)
            gain[c['id']] += value(dealt1, take1, col1, loot1) - v0
            prev[c['id']] += take0 - take1
            # Diagnose Nicht-Abfangen: voller Lohn >> abgefangener Lohn
            # (Ø 0,53); abgefangen > 10 praktisch ausgeschlossen.
            inter[c['id']] += 1 if loot1 > 10.0 else 0
    norm = 3.0 if SPEC_ALL3 else 1.0
    return dict(n=n_battles, taken=t0s / n_battles, dealt=d0s / n_battles,
                col=col0s / n_battles, eq=eq0s / n_battles,
                loot=loot0s / max(1, n_mission),
                loss=losses / n_battles, wipe0=wipes0 / n_battles,
                wipe1=wipes1 / n_battles,
                gain={k: v / n_battles / norm for k, v in gain.items()},
                prev={k: v / n_battles for k, v in prev.items()},
                inter={k: v / n_battles for k, v in inter.items()})


def main():
    target_n = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    done = cache.get('n', 0)
    runs = cache.get('runs', [])
    t_start = time.time()
    while done < target_n:
        chunk = min(1000, target_n - done)
        res = run(chunk, seed=100 + done)
        runs.append(res)
        done += chunk
        cache = dict(n=done, runs=runs)
        json.dump(cache, open(CACHE, 'w'))
        print(f'  {done} Gefechte ({time.time()-t_start:.0f}s)', flush=True)
    # Aggregate
    n = sum(r['n'] for r in runs)
    agg = {k: sum(r[k] * r['n'] for r in runs) / n
           for k in ('taken', 'dealt', 'col', 'eq', 'loot',
                     'loss', 'wipe0', 'wipe1')}
    gain = {c['id']: sum(r['gain'][c['id']] * r['n'] for r in runs) / n for c in cards}
    prev = {c['id']: sum(r['prev'][c['id']] * r['n'] for r in runs) / n for c in cards}
    inter = {c['id']: sum(r['inter'][c['id']] * r['n'] for r in runs) / n for c in cards}
    targets = TARGETS_V14 or v9.TARGETS
    tname = 'v17 (sauberer v16-Frame, Christophers Kurve 7,8/8,0/8,4/9,0/9,8)' if TARGETS_V14 else 'v9 (alt)'
    out = []
    print(f'=== Defense-Metrik v11 (gemischte Flotten 3v3, Rahmen v3, N={n}) ===')
    print('Karten-Platzierung: 3x Defense (je Schiff 1 Instanz, Gain/3)'
          if SPEC_ALL3 else '1x auf zufaelligem Schiff')
    print(f'Baseline: Ø taken {agg["taken"]:.2f} | Ø dealt {agg["dealt"]:.2f} je Gefecht'
          f' | Ø Kolonie-Marker {agg["col"]:.2f} | Ø verlorene Waffen-Einheiten {agg["eq"]:.2f}'
          f' | Ø Missionslohn {agg["loot"]:.2f} Marker (je Missionsgefecht; kein Abfang: {LOOT_NO_INTERCEPT:.2f})'
          f' | P(Verteidiger verliert >=1 Schiff) {agg["loss"]*100:.0f} %'
          f' | Verteidiger vernichtet {agg["wipe0"]*100:.0f} % | Angreifer vernichtet {agg["wipe1"]*100:.0f} %')
    print(f'Zielkurve: {tname}')
    print(f'{"id":>4} {"Karte":<28} {"Score":>6} {"Wert-Gew":>8} {"oAbf%":>6} {"prev":>6} {"ΔKurve":>7}')
    for c in cards:
        score = card_score(c, gain[c['id']])
        out.append(dict(id=c['id'], rarity=c['rarity'], title=c['title'],
                        gain=round(gain[c['id']], 3),
                        nointercept=round(inter[c['id']], 3),
                        prevented=round(prev[c['id']], 3),
                        units=c['units'], score=round(score, 2)))
    for o in sorted(out, key=lambda x: x['score']):
        tgt = targets.get(o['rarity'])
        d = o['score'] - tgt if tgt else 0.0
        print(f'{o["id"]:>4} r{o["rarity"]} {o["title"][:26]:<26} {o["score"]:6.2f}'
              f' {o["gain"]:8.2f} {o["nointercept"]*100:6.1f} {o["prevented"]:6.2f} {d:+7.2f}')
    for rar in (5, 4, 3, 2, 1):
        grp = [o for o in out if o['rarity'] == rar]
        if grp:
            med = statistics.median(o['score'] for o in grp)
            print(f'  -> r{rar} Median {med:.2f} (n={len(grp)})')
    json.dump(out, open(os.path.join(HERE, 'defense_v11.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
