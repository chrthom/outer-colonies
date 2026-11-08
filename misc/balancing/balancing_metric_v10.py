#!/usr/bin/env python3
"""Outer Colonies – Defense-Ausruestungs-Metrik v10 (Christopher, 3.11.2026).

Duale Erganzung zur Waffen-Metrik v9.3: bewertet die 19 implementierten
Nicht-Waffen-Statkarten (Schild/Panzerung/Punktabwehr/Rumpf/Speed) ueber den
erwarteten verhinderten Schaden je Gefecht (Schadensmarker) geteilt durch
Einsatzkosten (Kostenmodell v2, identisch zu v9.3).

Rahmen (Christopher, 3.11.2026): nur die 19 reinen Statkarten (7 Effekt-/
Utility-Karten ausgespart: 104, 124, 211, 212, 241, 325, 545); Zielkurve =
GLEICHE Kurve wie Waffen (4,5/4,75/5,0/6,0/6,5 – Waffen und Nicht-Waffen
konkurrieren um spielbare Karten, Sockel und Energie). Einsatzkosten wie v9.3,
erweitert um Christopher 3.11.2026: Theta/Omega/Delta zaehlen als billig
(1. Sockel 0,7); keine implementierte Waffe nutzt Delta, die 25 beschlossenen
Waffen-Aenderungen bleiben davon unberuehrt.

Modell – exakte Umkehrung der v9-Sichtweise:
- Angreifer-Feld: die 50 implementierten Waffen, rarity-gewichtet (2^(5-r),
  wie v9-Szenarien), standardmaessig MIT den 25 beschlossenen FINAL-Werten
  (--repo = Status quo Repo). Ein Angreifer-Waffeneinsatz je Gefecht.
- Ziel-Pools: SHIP-Szenarien aus v9 (Bestueckungsgrad 0,67), die bewertete
  Karte kommt kanonisch OBEN drauf (marginaler Beitrag zum Feld-Durchschnitt;
  Diminishing Returns via Absorptions-/Deaktivierungsdynamik).
- Mission/Raid 50:50 wie v9; im Raid nur der SCHIFFSgerichtete Anteil
  (Kolonieangriff zaehlt nicht fuer Schiff-Defense; R1-Zielwahl Schiff vs.
  Kolonie wie v9 ueber max-Entscheidung).
- Schild/Panzerung/PD: Absorption via v9.resolve_attack (Reduktion = Abzug x
  Punkte, Deaktivierung bei dmg >= Reduktion, Reaktivierung: Schild/PD je
  Phase, Panzerung nie; 'Unerschpflich' (115, 312) = Reaktivierung sofort,
  hier identisch zu je Phase, da 1 Angriff je Phase simuliert wird).
- Bedingungen aus Effekttexten: 312 Refraktorfeld nur auf Pools OHNE
  Schildpunkte, 426 Schildbooster nur auf Pools MIT >= 1 Schildpunkt.
- Rumpf (hp): Credit = E[min(hp, T)] je Gefecht (Linearisierung der
  Ueberlebenswirkung; negativ = Spiegel-Debit). Schwachstelle des Modells,
  kalibrierbar.
- Speed (Christopher, 3.11.2026, Bonus und Malus direkt verrechnet): Eine Speed-
  Anpassung verschiebt die Paar-Halbierungswahrscheinlichkeit um genau eine
  Reichweite (Paar-Identitaet P(Sa + r < Sd + s) = P(Sa + r - s < Sd),
  reproduziert die v9-Herleitung 2/10/20/27 %; Basis = v9-Kalibrierung
  0/10/20/25 % + Paar-Shift, clamp 0..1), in BEIDE Richtungen:
  - Defensive: eigener erlittener Schaden wird haeufiger halbiert
    (half_prob(r, s); zusaetzlich 224-Faktor P(Sd + s < 3) und
    401-Abzug 6 x (Ø Zielspeed + s), beide zielseitig speed-abhaengig).
  - Offensive: eigener AUSGETEILTER Schaden wird seltener halbiert
    (half_prob_out(r, s) = Shift nach r + s) -> Mehr-Marker ueber die
    v9-effective-Spiegel-Funktion deals_ship() gegen dieselben Feld-Pools.
  Beide Beitraege zaehlen in derselben Waehrung (Marker) und werden auf
  SCHIFFS-EBENE verrechnet: die Karte multipliziert alle Waffen des eigenen
  Schiffs, daher Faktor k = Ø Sockel (Cap 4) x EQUIP_FILL x rarity-gewichteter
  Waffenanteil (Kalibrierungsregler); Malus-Karten entsprechend negativ.
  K-FAKTOR AUF ALLES (Christopher, 3.11.2026): nicht nur Speed, sondern
  auch die Basis-Absorption (Punkte/hp) trifft im Gefecht die Ø k gegnerischen
  Waffen -> GESAMT-Effekt x k. Ohne das waere Defense auf ~70 % der Ø
  Waffenwirkung gedeckelt (Praevention <= Ø Marker-Aufbau 3,55) und die
  Waffen-Zielkurve ab r3 unerreichbar.
  PANZERUNGS-M (Christopher, 3.11.2026): Panzerpunkte deaktivieren sich, sobald
  ein Angriff >= Abzug x Punkte ist, und blocken danach NICHT mehr ->
  interpoliert zwischen x1 (einmal blocken wie hp) und xk (je Angriff blocken
  wie Schild/PD): m = 1 + (k-1) * s mit s = P(Karte ueberlebt die 1-v-1-Salve).
  s wird AM NACKTEN SCHIFF gemessen (Christopher: Pool-Schilde duerfen der
  Panzerung kein Ueberleben 'schenken', das ihr als Wiederhol-Block gutge-
  schrieben wuerde; der verhinderte Schaden selbst bleibt marginal und wird
  durch Pool-Defense nie der Panzerung zugeschrieben). Unerschpflich
  (115/312) reaktiviert -> volles k. hp wirkt einmal -> x1 (s. unten).
  Nicht quantifiziert (bewusst, Christopher 3.11.2026): Speed schuetzt bei
  Missionen vor Abfangung durch langsamere Schiffe (Abfangen nur mit Speed >=
  langsamstes Missionsschiff) – unbezahlter Zusatzvorteil. Die taktische
  Reichweitenwahl bleibt (wie in v9) ausserhalb des Modells.
- v9-Konsistenzkorrektur: der 224-Slow-Faktor gilt hier fuer ALLEN
  Schaden (v9 liess ihn im Raid-Zweig unberuecksichtigt – dort unbeabsichtigt).

Datengrundlage: cards.csv (Repo: misc/cards/cards.csv) im selben oder uebergeordneten Ordner (Aufloesung via v9.CARDS_CSV).
Aufruf: python3 balancing_metric_v10.py [--repo]
"""
import csv, json, statistics, sys

import balancing_metric_v9 as v9

ATTACK_PROB = v9.ATTACK_PROB
HALF_CAL = v9.HALF_PROB                     # v9-Kalibrierung (Basis, s=0)
# Zielkurve: GLEICHE Kurve wie Waffen (Christopher, 3.11.2026) – Waffen und
# Nicht-Waffen konkurrieren um spielbare Karten, Sockel und Energie; zu schwache
# Defense waere unspielbar, wenn eine Waffe den Sockel bekommen koennte.
TARGETS = v9.TARGETS                        # {1: 4.5, 2: 4.75, 3: 5.0, 4: 6.0, 5: 6.5}
# Einsatzkosten (Kostenmodell v3, Christopher, 3.11.2026, positional): Theta/
# Omega/Delta sind Billig-Sockel (1. Sockel 0,7), normale 1,0; AB DEM 2. Sockel
# gilt Degression: normal 0,7, billig 0,5; Energie 1. 1,0, jede weitere 0,7.
CHEAP_SOCKETS = ('socket_a', 'socket_e', 'socket_g')
SUB_CHEAP = 0.5                             # Billig-Sockel ab dem 2. (v3)
RECHARGE_DEF = {'pd': 'phase', 'shield': 'phase', 'armour': 'never'}
RECHARGE_OVERRIDE = {'115': 'attack', '312': 'attack'}   # 'Unerschöpflich'
COND = {'312': 'no_shield', '426': 'need_shield'}        # Effekttext-Bedingungen
DEF_IDS = {'103', '109', '115', '140', '161', '163', '170', '171', '184', '240',
           '312', '341', '349', '406', '426', '434', '449', '522', '537'}
RARITY_W = {0: 32, 1: 16, 2: 8, 3: 4, 4: 2, 5: 1}        # wie v9-Szenarien


# --- Huellen-Speed-Verteilung (Paar-Rechnung wie v9-Herleitung) ---
def hull_speeds():
    speeds = []
    with open(v9.CARDS_CSV, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter=';', quotechar='"'):
            if r['implemented'] == 'yes' and r['type'] == 'hull':
                s = (r['speed'] or '').strip()
                speeds.append(int(s) if s else 0)
    return speeds

HULL_SPEEDS = hull_speeds()
assert len(HULL_SPEEDS) == 50 and abs(sum(HULL_SPEEDS) / 50 - v9.AVG_SPEED) < 0.05, \
    f'Hull-Speeds plausibel? n={len(HULL_SPEEDS)}, Ø={sum(HULL_SPEEDS)/len(HULL_SPEEDS)}'

def raw_half(r, s=0.0):
    """P(angreifer.speed + r < ziel.speed + s) ueber alle Hullen-Paare, Ziel flugbereit."""
    n = len(HULL_SPEEDS)
    cnt = sum(1 for sa in HULL_SPEEDS for sd in HULL_SPEEDS if sd > 0 and sa + r < sd + s)
    return cnt / (n * n)

def half_prob(r, s=0.0):
    """Kalibrierte Basis, geshiftet um die Paar-Differenz (clamp 0..1)."""
    return max(0.0, min(1.0, HALF_CAL[r] + raw_half(r, s) - raw_half(r, 0)))

def half_prob_out(r, s=0.0):
    """Offensiv: P(eigener Angriff wird halbiert) mit Speed-Bonus s.

    Halbierung iff Sa + r < Sd (Ziel flugbereit); eigener Bonus s auf dem
    ANGREIFER: P(Sa + s + r < Sd) = raw_half(r + s, 0) – Shift um eine
    Reichweite nach oben (Christopher, 3.11.2026).
    """
    return max(0.0, min(1.0, HALF_CAL[r] + raw_half(r + s, 0) - raw_half(r, 0)))

def slow_factor(s=0.0):
    """224 'Wirkungslos (3+ speed)': Anteil der Ziele mit speed + s < 3."""
    return sum(1 for sd in HULL_SPEEDS if sd + s < 3) / len(HULL_SPEEDS)

def avg_speed(s=0.0):
    """401 Guillotine: Ø Zielspeed (1,3) + Bonus s."""
    return sum(HULL_SPEEDS) / len(HULL_SPEEDS) + s


# --- Angreifer (Waffen) ---
def load_attackers(final=True):
    ws = v9.load_weapons()
    if final:
        for w in ws:
            if w['id'] in v9.FINAL:
                f = v9.FINAL[w['id']]
                w['damage'], w['energy'] = f['dmg'], f['e']
                if f['abz']:
                    w['abz'].update(f['abz'])
    return ws

def colony_r1(w):
    """v9-Logik: erwarteter Kolonieangriff in R1 (fuer die R1-Zielwahl im Raid)."""
    if w['no_colony']:
        return 0.0
    cw = sum(wt for _, wt in v9.COLONY)
    avg = sum(wt * v9.colony_attack(w, c) for c, wt in v9.COLONY) / cw
    return ATTACK_PROB[1] * avg


# --- Gefechtssimulation (Schiffsgerichteter Schadensmarker-Aufbau) ---
def base_damage(w, avg_sp):
    return max(0, w['damage'] - (6 * avg_sp if w['id'] == '401' else 0))

def attack_once(w, cards, p, hp_, avg_sp):
    """Einzelangriff in Phase p mit Halbierungs-Mischung hp_."""
    e = 0.0
    for halved, wgt in ((False, 1 - hp_), (True, hp_)):
        d = v9.half(base_damage(w, avg_sp)) if halved else base_damage(w, avg_sp)
        e += wgt * v9.resolve_attack(w, [dict(c) for c in cards], d)
    return ATTACK_PROB[p] * e

def phase_totals(w, cards, halved, avg_sp):
    cards = [dict(c) for c in cards]
    phases = [min(w['range'], 4)] if w['single'] else [p for p in (4, 3, 2, 1) if w['range'] >= p]
    base = base_damage(w, avg_sp)
    out = {}
    for p in phases:
        d = v9.half(base) if halved else base
        out[p] = v9.resolve_attack(w, cards, d)
        for c in cards:
            if c['recharge'] in ('phase', 'attack'):
                c['used'] = False
    return out

def ship_taken(w, cards, s, hp_extra, r1_col):
    """Erwarteter Schadensmarker-Aufbau am (verteidigten) Schiff je Gefecht."""
    hp_ = {p: half_prob(p, s) for p in (1, 2, 3, 4)}
    sl = slow_factor(s) if w['id'] == '224' else 1.0
    asp = avg_speed(s)
    if w['single']:
        mission = sl * max((attack_once(w, cards, p, hp_[p], asp)
                            for p in range(1, min(w['range'], 4) + 1)), default=0.0)
        raid_ship = mission if mission >= r1_col else 0.0
    else:
        A = phase_totals(w, cards, False, asp)
        B = phase_totals(w, cards, True, asp)
        ph = {p: ATTACK_PROB[p] * ((1 - hp_[p]) * A.get(p, 0.0) + hp_[p] * B.get(p, 0.0)) for p in A}
        for p in ph:
            ph[p] *= sl
        mission = sum(ph.values())
        raid_ship = (sum(v for p, v in ph.items() if p >= 2)
                     + (ph[1] if ph.get(1, 0.0) >= r1_col else 0.0))
    T = 0.5 * mission + 0.5 * raid_ship
    if hp_extra > 0:
        T = max(0.0, T - hp_extra)
    elif hp_extra < 0:
        T += min(-hp_extra, T)
    return T


def deals_ship(w, cards, s):
    """Erwartete AUSGETEILTE Marker je Gefecht (v9-effective-Spiegel) mit
    eigenem Speed-Bonus s: eigene Waffe gegen Feld-Gegnerpool, Kolonie-Zweig
    wie v9 (Kolonie nie halbiert, r1_col unabhaengig von s)."""
    hpo = {p: half_prob_out(p, s) for p in (1, 2, 3, 4)}
    sl = slow_factor() if w['id'] == '224' else 1.0
    asp = avg_speed()
    if w['single']:
        mission = sl * max((attack_once(w, cards, p, hpo[p], asp)
                            for p in range(1, min(w['range'], 4) + 1)), default=0.0)
        raid = max(mission, w['r1_col'])
    else:
        A = phase_totals(w, cards, False, asp)
        B = phase_totals(w, cards, True, asp)
        ph = {p: ATTACK_PROB[p] * ((1 - hpo[p]) * A.get(p, 0.0) + hpo[p] * B.get(p, 0.0)) for p in A}
        for p in ph:
            ph[p] *= sl
        mission = sum(ph.values())
        raid = (sum(v for p, v in ph.items() if p >= 2)
                + max(ph.get(1, 0.0), w['r1_col']))
    return 0.5 * mission + 0.5 * raid


# --- Bewertete Defense-Karten ---
# Missionswert Option B (Christopher, 3.11.2026, Entscheidung 2 "B"): bezahlter
# Credit fuer die Abfangregel – Speed-Effekt auf Missions-Erfolg, einmalig je
# Speed-Punkt (nicht x k), signed (sp-1-Karten erhalten den Malus).
MISSION_SHARE = 0.5    # Missionsanteil der Gefechte (0,5/0,5-Mix wie Metrik)
DELTA_P = 0.431        # E[P_abfang(s) - P_abfang(s+1)] ueber Missions-Hullen (kalibrierung_check3)
MISSION_W = 4.0        # Regler: Missionsloot in Marker-Aequivalenten (interim, per Playtest zu verankern)
# PD-Flottenbonus (Christopher, 3.11.2026, Entscheidung 3): PD wirkt schiffs-
# uebergreifend gegen alle PAbz-Angiffe der Flotte -> Faktor n_fleet auf das
# k der abgedeckten Einsaetze. Schild/Panzerung/hp/Speed bleiben Eigenschiff.
PD_FLEET = 3.0


def mission_credit(d):
    return MISSION_SHARE * DELTA_P * MISSION_W * (d.get('speed') or 0)


def load_defense():
    out = []
    with open(v9.CARDS_CSV, newline='', encoding='utf-8') as f:
        for r in csv.DictReader(f, delimiter=';', quotechar='"'):
            if r['implemented'] != 'yes' or r['type'] != 'equipment' or r['id'] not in DEF_IDS:
                continue
            socks = []
            for c in ['socket_a', 'socket_b', 'socket_d', 'socket_e', 'socket_f', 'socket_g']:
                v = v9.num(r[c])
                if isinstance(v, int) and v < 0:
                    # Billig-Sockel: Theta/Omega/Delta (Christopher, 3.11.2026);
                    # Degression v3: ab dem 2. Sockel nur 0,5 (SUB_CHEAP).
                    socks.extend([c in CHEAP_SOCKETS] * -v)
            socks.sort()   # teuere Sockel zuerst
            socket_cost = ((0.7 if socks[0] else 1.0) if socks else 0) \
                + sum((SUB_CHEAP if s else 0.7) for s in socks[1:])
            energy = abs(v9.num(r['energy'])) if isinstance(v9.num(r['energy']), int) \
                and v9.num(r['energy']) < 0 else 0
            e_cost = 0 if energy < 1 else 1 + 0.7 * (energy - 1)
            units = (socket_cost + e_cost) or 0.5
            pts = {}
            for t, k in (('pd', 'abm'), ('shield', 'shield'), ('armour', 'armour')):
                n = v9.num(r[k])
                pts[t] = n if isinstance(n, int) and n > 0 else 0
            hp = v9.num(r['hp'])
            sp = v9.num(r['speed'])
            added = [{'type': t, 'points': pts[t],
                      'recharge': RECHARGE_OVERRIDE.get(r['id'], RECHARGE_DEF[t])}
                     for t in ('pd', 'shield', 'armour') if pts[t] > 0]
            out.append({
                'id': r['id'], 'title': r['title'], 'rarity': v9.num(r['rarity']),
                'units': round(units, 2), 'pts': pts,
                'hp': hp if isinstance(hp, int) else 0,
                'speed': sp if isinstance(sp, int) else 0,
                'cond': COND.get(r['id']), 'added': added,
            })
    assert len(out) == len(DEF_IDS), f'{len(out)} Defense-Karten gefunden, erwartet {len(DEF_IDS)}'
    return out


def main():
    final = '--repo' not in sys.argv
    weapons = load_attackers(final)
    for w in weapons:
        w['r1_col'] = colony_r1(w)
    wtot = sum(RARITY_W[w['rarity']] for w in weapons)

    pools = []
    for cards, prob in v9.SHIP:
        tot = {'pd': 0, 'shield': 0, 'armour': 0}
        for c in cards:
            tot[c['type']] += c['points']
        pools.append((cards, prob, tot))

    # T0-Cache: erwarteter Marker-Aufbau OHNE bewertete Karte
    T0 = {}
    for i, w in enumerate(weapons):
        for j, (cards, _, _) in enumerate(pools):
            T0[(i, j)] = ship_taken(w, cards, 0.0, 0, w['r1_col'])

    # D0-Cache: erwartete ausgeteilte Marker ohne Speed-Bonus (Offensiv-Seite)
    D0 = {}
    for i, w in enumerate(weapons):
        for j, (cards, _, _) in enumerate(pools):
            D0[(i, j)] = deals_ship(w, cards, 0.0)

    dsum = sum(prob for _, prob, _ in pools)
    avg_taken = sum(RARITY_W[w['rarity']] / wtot * prob * T0[(i, j)]
                    for i, w in enumerate(weapons)
                    for j, (_, prob, _) in enumerate(pools)) / dsum
    avg_deals = sum(RARITY_W[w['rarity']] / wtot * prob * D0[(i, j)]
                    for i, w in enumerate(weapons)
                    for j, (_, prob, _) in enumerate(pools)) / dsum

    # --- Vorbereitung Speed-Karten (Christopher, 3.11.2026) ---
    dcards = load_defense()
    speeds = {d['speed'] for d in dcards if d['speed']}
    # Offensiv-Caches je Speed-Stufe (Ø ueber Feld-Waffen x Feld-Pools)
    Ds = {s: {(i, j): deals_ship(w, cards, float(s))
              for i, w in enumerate(weapons)
              for j, (cards, _, _) in enumerate(pools)}
          for s in speeds}
    off_pw = {s: sum(RARITY_W[w['rarity']] / wtot * (prob / dsum) * (Ds[s][(i, j)] - D0[(i, j)])
                     for i, w in enumerate(weapons)
                     for j, (_, prob, _) in enumerate(pools))
              for s in speeds}
    # k: erwartete Waffenzahl je Schiff (Schiffs-Ebene; Kalibrierungsregler)
    with open(v9.CARDS_CSV, newline='', encoding='utf-8') as f:
        eq_w = sum(RARITY_W[v9.num(r['rarity'])]
                   for r in csv.DictReader(f, delimiter=';', quotechar='"')
                   if r['implemented'] == 'yes' and r['type'] == 'equipment')
    k_ship = (sum(min(s, v9.SHIP_CAP) for s in v9.SHIP_SOCKETS) / len(v9.SHIP_SOCKETS)
              * v9.EQUIP_FILL * sum(RARITY_W[w['rarity']] for w in weapons) / eq_w)

    # --- Panzerungs-m (Christopher, 3.11.2026): Ueberlebensrate s der Panzer-
    # karte AM NACKTEN SCHIFF (kein Pool-Schild-Effekt), 1-v-1 gegen die
    # gesamte rarity-gewichtete Salve einer Waffe; m = 1 + (k-1) * s.
    # Halbiert-Zweige mit Feld-Gesamtwahrscheinlichkeit 13,75 % gemischt. ---
    def naked_survival(points):
        alive = 0.0
        for w in weapons:
            ww = RARITY_W[w['rarity']] / wtot
            abzA = w['abz']['armour']
            if abzA is None or abzA == 0 or abzA == 'X':
                alive += ww          # deaktiviert Panzer nie
                continue
            base = base_damage(w, avg_speed(0.0))
            phases = [min(w['range'], 4)] if w['single'] else \
                     [p for p in (4, 3, 2, 1) if w['range'] >= p]
            for halved, hb in ((False, 0.8625), (True, 0.1375)):
                cl = [dict(type='armour', points=points, recharge='never')]
                ok = True
                for _ in phases:
                    d = v9.half(base) if halved else base
                    v9.resolve_attack(w, cl, d)
                    if cl[0].get('used'):
                        ok = False
                        break
                if ok:
                    alive += ww * hb
        return alive

    def is_armour_never(d):
        return bool(d['added']) and all(c['type'] == 'armour' and c['recharge'] == 'never'
                                        for c in d['added'])

    arm_pts = sorted({sum(c['points'] for c in d['added']) for d in dcards if is_armour_never(d)})
    ARM_S = {n: naked_survival(n) for n in arm_pts}
    print('Panzerungs-m (nackt gemessen): '
          + ', '.join(f'P{n}: s {ARM_S[n]*100:.1f} % -> m {1 + (k_ship-1)*ARM_S[n]:.2f}'
                      for n in arm_pts))
    for d in dcards:
        if is_armour_never(d):
            n = sum(c['points'] for c in d['added'])
            d['abs_mult'] = 1 + (k_ship - 1) * ARM_S[n]
        elif d['added'] and all(c['type'] == 'pd' for c in d['added']):
            d['abs_mult'] = k_ship * PD_FLEET   # PD flottenweit (n_fleet = 3)
        else:
            d['abs_mult'] = k_ship

    results = []
    for d in dcards:
        prev_base = prev_hp = prev_spd = 0.0
        for i, w in enumerate(weapons):
            ww = RARITY_W[w['rarity']] / wtot
            for j, (cards, prob, tot) in enumerate(pools):
                ok = True
                if d['cond'] == 'no_shield' and tot['shield'] > 0:
                    ok = False
                if d['cond'] == 'need_shield' and tot['shield'] < 1:
                    ok = False
                if not ok or (not d['added'] and not d['hp'] and not d['speed']):
                    t1 = t1n = thp = T0[(i, j)]
                elif d['speed']:
                    t1n = ship_taken(w, cards + d['added'], 0.0, d['hp'], w['r1_col'])
                    # Traegt die Speed-Karte zusaetzlich Punkte (nur 240 Ceramo-
                    # Stahl), wird der hp-Anteil OHNE Punkte gemessen; der Rest
                    # (thp - t1n) ist Absorption und zaehlt x k.
                    thp = ship_taken(w, cards, 0.0, d['hp'], w['r1_col']) \
                        if d['added'] else t1n
                    t1 = ship_taken(w, cards + d['added'], float(d['speed']), d['hp'], w['r1_col'])
                else:
                    # Zerlegung (additiv exakt, Christopher 3.11.2026): hp wirkt
                    # EINMAL pro Gefecht (Rumpfkonto verbraucht sich), unabhaen-
                    # gig von der Zahl angreifender Waffen -> x 1. Nur Absorption
                    # (Schild/Panzer/PD) blockt je Angreifer neu -> x k.
                    thp = ship_taken(w, cards, 0.0, d['hp'], w['r1_col']) if d['hp'] else T0[(i, j)]
                    t1 = t1n = ship_taken(w, cards + d['added'], 0.0, d['hp'], w['r1_col'])
                prev_hp += ww * (prob / dsum) * (T0[(i, j)] - thp)
                prev_base += ww * (prob / dsum) * (thp - t1n)
                prev_spd += ww * (prob / dsum) * (t1n - t1)
        off = off_pw.get(d['speed'], 0.0)
        # Schiffsebene (Christopher, 3.11.2026): ALLE Karten-Effekte werden auf
        # SCHIFFS-EBENE verrechnet: die Karte multipliziert alle Waffen des
        # eigenen Schiffs, daher Faktor k = Ø Sockel (Cap 4) x EQUIP_FILL x
        # rarity-gewichteter Waffenanteil (Kalibrierungsregler); Malus-Karten
        # entsprechend negativ.
        # AUSNAHME hp (Christopher, 3.11.2026): hp-Bonus/-Malus wirkt einmalig
        # auf das Rumpfkonto (verbraucht sich), NICHT je Angreifer -> x 1.
        # AUSNAHME Panzerung (Christopher, 3.11.2026): deaktiviert sich beim
        # Blocken -> m = 1 + (k-1)*s (nackt gemessen) statt vollem k.
        total = v9.SURV_CREDIT * (d['abs_mult'] * prev_base + k_ship * (prev_spd + off)
                                  + prev_hp) + mission_credit(d)
        results.append(dict(d, prev_base=round(prev_base, 3), prev_hp=round(prev_hp, 3),
                            prev_spd=round(prev_spd, 3),
                            prevented_off=round(off, 3),
                            prevented=round(total, 3), score=round(total / d['units'], 2)))

    tag = 'FINAL-Waffen' if final else 'Repo-Waffen (Status quo)'
    print(f'=== Defense-Metrik v10 ({tag}) – 19 Statkarten ===')
    print(f'Ø Marker-Aufbau am nackten Feldschiff je Waffeneinsatz: {avg_taken:.2f}')
    print(f'Ø ausgeteilte Marker je Waffeneinsatz (Feld-Gegner):      {avg_deals:.2f}')
    print(f'k (Ø Waffen je Schiff, Schiffs-Ebene):                    {k_ship:.2f}')
    for s in sorted(speeds):
        print(f'Speed-Offensivanteil je Waffe s{int(s):+d}: '
              f'{off_pw[s]:+.2f} Marker | Speed-Defensivanteil s{int(s):+d} je Angreiferwaffe: s. Tabelle')
    print()
    for rar in (5, 4, 3, 2, 1, 0):
        grp = [d for d in results if d['rarity'] == rar]
        if not grp:
            continue
        med = statistics.median(d['score'] for d in grp)
        ziel = f' vs Ziel {TARGETS[rar]:.2f} (Δ {med - TARGETS[rar]:+.2f})' if rar in TARGETS else ''
        print(f'r{rar}: Median {med:5.2f} (n={len(grp)}){ziel}')
    print('\n-- Alle Karten (aufsteigend nach Score) --')
    for d in sorted(results, key=lambda x: x['score']):
        eff = []
        if d['pts']['shield']: eff.append(f"S{d['pts']['shield']}")
        if d['pts']['armour']: eff.append(f"P{d['pts']['armour']}")
        if d['pts']['pd']: eff.append(f"PD{d['pts']['pd']}")
        if d['hp']: eff.append(f"hp{d['hp']:+d}")
        if d['speed']: eff.append(f"sp{d['speed']:+d}")
        split = ''
        segs = []
        if d['prev_hp']:
            segs.append(f'hp {d["prev_hp"]:+.2f} x 1')
        if d['speed']:
            net = k_ship * (d['prev_spd'] + d['prevented_off'])
            tag_m = f'x m {d["abs_mult"]:.2f}' if d['abs_mult'] != k_ship else ''
            segs.append(f'Abs {d["prev_base"]:+.2f} {tag_m} | Speed netto {net:+.2f} '
                        f'(def {d["prev_spd"]:+.2f} + off {d["prevented_off"]:+.2f})'
                        f' x k {k_ship:.2f}')
        elif d['prev_base']:
            tag_m = f'x m {d["abs_mult"]:.2f}' if d['abs_mult'] != k_ship else f'x k {k_ship:.2f}'
            segs.append(f'Abs {d["prev_base"]:+.2f} {tag_m}')
        if segs:
            split = '  [' + ' | '.join(segs) + ']'
        tgt = TARGETS.get(d['rarity'])
        delta = f'  Δ {d["score"] - tgt:+.2f}' if tgt else ''
        print(f"  {d['id']:>3} r{d['rarity']} {d['title'][:26]:<26} {'+'.join(eff) or '-':<12}"
              f" Kosten {d['units']:4.2f}  verhindert {d['prevented']:5.2f}  Score {d['score']:5.2f}{delta}{split}")
        if tgt:
            d['target'] = tgt
            d['delta'] = round(d['score'] - tgt, 2)
    json.dump(results, open('defense_v10.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
