#!/usr/bin/env python3
"""DIAGNOSE (Runde 11, 3.11.2026): Vergleich der Wert-Rahmen-Alternativen.

Christophers Fragen:
  (i) Zaehlt der Output-Rahmen v2 Defensivwert nicht schon allein dadurch,
      dass ueberlebende Schiffe laenger weiterfeuern?
  (ii) Alternative A: verhinderter Schaden (Halbierung/Reduktion) dazurechnen,
      +HP-Karten statisch mit HP bewerten.
  (iii) Alternative B: bilaterale Differenz dealt_own - dealt_enemy.
  (iv) Ausruestungs-Malus: Kartenanzahl statt Kosteneinheiten (Karte = knappe
      Ressource, Sockel sind keine Kosten); im Szenario traegt jedes Schiff
      immer genau 1 Karte -> Anzahl verlorener Karten == Anzahl toter Schiffe.

KEINE Aenderung der offiziellen Metrik -- nur Messung im selben gepaarten
Frame (Common Random Numbers wie check9). NEU: Alternative A und B sind
mathematisch IDENTISCH im gepaarten Setup:
  Gain(B) = (dOut - dTaken) == dOut + (Taken0 - Taken1) == Gain(A mit
  verhindertem Schaden), denn Taken (Seite 0) ist exakt der Output des
  Gegners. Beide zaehlen Verhinderung Marker-fuer-Marker.

Rahmen (Gain je Karte/Waffe je Gefecht, alle Vorzeichen 'mit Karte besser'):
  F0     = dOut + dKol + dEQ(units) + dLoot   (Frame v2, Status quo)
  F0noeq = dOut + dKol + dLoot                 (ohne Ausruestungs-Malus)
  F0flat = dOut + dKol + 1,0 x dGerettete_Schiffe + dLoot  (Malus je Karte)
  Fstar  = dOut + dVerhindert + dKol + dLoot   (Christophers A == B)
Normalisierung /3 (Platzierung je Schiff 1 Instanz), / Einsatzkosten,
Speed-Karten mit Option-B-Credit (frame-unabhaengig, auf alle Rahmen gleich).
Waffen im selben Rahmen -> Anker-Mediane je Rahmen (Kurve verschiebt sich mit).

Aufruf: python3 diag_frame_compare.py [N]   (Default 3000)
"""
import random
import statistics
import sys

import balancing_metric_v10 as v10
import balancing_metric_v11 as v11
import balancing_metric_v9 as v9

N = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
random.seed(42)
cpools = [(cs, p) for cs, p in v9.COLONY]
cptot = sum(p for _, p in cpools)
FRAMES = ('F0', 'F0noeq', 'F0flat', 'Fstar', 'Fstar05')


def frame_gains(a):
    """Gain je Rahmen aus Konto-Differenzen (mit Karte minus Baseline).
    Fstar05: Take-Gewicht 0,5 (Sensitivitaet: Heilung durch Zurueck-auf-
    Hand macht Soak nicht permanent 1:1 wertvoll, Tempo-Kosten ~ Regler)."""
    return {
        'F0': a['out'] + a['col'] + a['eq'] + a['loot'],
        'F0noeq': a['out'] + a['col'] + a['loot'],
        'F0flat': a['out'] + a['col'] + a['dead'] + a['loot'],
        'Fstar': a['out'] + a['take'] + a['col'] + a['loot'],
        'Fstar05': a['out'] + 0.5 * a['take'] + a['col'] + a['loot'],
    }


acc_c = {c['id']: dict(out=0.0, take=0.0, dead=0.0, eq=0.0, col=0.0, loot=0.0)
         for c in v11.cards}
acc_w = {w['id']: dict(out=0.0, take=0.0, dead=0.0, eq=0.0, col=0.0, loot=0.0)
         for w in v11.weapons}
loot0s = n_mission = 0
for b in range(N):
    w, att, deff, raid = v11.draw_battle()
    pool_cards, _ = v11.pools[random.choices(
        range(len(v11.pools)), weights=v11.pprob)[0]]
    colpool = None
    if raid:
        colpool = cpools[random.choices(
            range(len(cpools)), weights=[p / cptot for _, p in cpools])[0]][0]
    fire = [[[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
             for _ in range(3)] for _ in (0, 1)]
    wspec_fire = [[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
                  for _ in range(3)]
    order = (0, 1) if b % 2 == 0 else (1, 0)
    take0, dealt0, dead0, _, col0, eq0, loot0 = v11.battle(
        w, att, deff, pool_cards, fire, order, raid=raid, colpool=colpool)
    if not raid:
        loot0s += loot0
        n_mission += 1

    def accrue(acc, res):
        take1, dealt1, dd0, dd1, col1, eq1, loot1 = res
        acc['out'] += dealt1 - dealt0
        acc['take'] += take0 - take1      # verhinderter Schiffs-Schaden
        acc['dead'] += dead0 - dd0        # gerettete eigene Schiffe (Karten)
        acc['eq'] += eq0 - eq1            # gerettete Kosten-Einheiten
        acc['col'] += col0 - col1         # verhinderte Kolonie-Marker
        acc['loot'] += loot1 - loot0       # Missionslohn-Differenz

    for c in v11.cards:
        accrue(acc_c[c['id']], v11.battle(
            w, att, deff, pool_cards, fire, order, raid=raid,
            spec=c, colpool=colpool))
    for w2 in v11.weapons:
        accrue(acc_w[w2['id']], v11.battle(
            w, att, deff, pool_cards, fire, order, raid=raid,
            wspec=w2, wspec_fire=wspec_fire, colpool=colpool))
    if (b + 1) % 500 == 0:
        print(f'  {b+1}/{N}', flush=True)

LOOT_INT = loot0s / max(1, n_mission)
print(f'Ø Missionslohn im abgefangenen Gefecht: {LOOT_INT:.2f}')

# --- Scores je Rahmen ---
cards_f = {f: {} for f in FRAMES}
weapons_f = {f: {} for f in FRAMES}
for c in v11.cards:
    a = acc_c[c['id']]
    mc = v11.mission_credit(c, LOOT_INT)
    for f, g in frame_gains(a).items():
        cards_f[f][c['id']] = (g / N / 3 + mc) / c['units']
for w2 in v11.weapons:
    a = acc_w[w2['id']]
    u = v11.weapon_units(w2)
    for f, g in frame_gains(a).items():
        weapons_f[f][w2['id']] = g / N / 3 / u

print('\n=== Waffen-Mediane (Kurve) je Rahmen ===')
curves = {}
for f in FRAMES:
    curves[f] = {r: statistics.median(
        weapons_f[f][w2['id']] for w2 in v11.weapons if w2['rarity'] == r)
        for r in (1, 2, 3, 4, 5)}
    print(f'  {f:<8} ' + '  '.join(
        f'r{r} {curves[f][r]:.2f}' for r in (1, 2, 3, 4, 5)))

print('\n=== Statkarten-Scores je Rahmen (inkl. Option-B-Credit) ===')
print(f'{"id":>4} {"Karte":<26} ' + ' '.join(f'{f:>8}' for f in FRAMES)
      + '   Kanäle: out/take/dead/eq/col/loot (je Gefecht)')
for c in sorted(v11.cards, key=lambda x: cards_f['F0'][x['id']]):
    a = {k: acc_c[c['id']][k] / N / 3 for k in
         ('out', 'take', 'dead', 'eq', 'col', 'loot')}
    print(f'{c["id"]:>4} r{c["rarity"]} {c["title"][:24]:<24} '
          + ' '.join(f'{cards_f[f][c["id"]]:8.2f}' for f in FRAMES)
          + f'   {a["out"]:+.2f}/{a["take"]:+.2f}/{a["dead"]:+.2f}/'
          f'{a["eq"]:+.2f}/{a["col"]:+.2f}/{a["loot"]:+.2f}')

print('\n=== Karten-Mediane je Rahmen vs eigene Kurve (Delta je Raritaet) ===')
for f in FRAMES:
    parts = []
    for r in (1, 2, 3, 4, 5):
        grp = [cards_f[f][c['id']] for c in v11.cards if c['rarity'] == r]
        if grp:
            med = statistics.median(grp)
            parts.append(f'r{r} {med:.2f} ({med-curves[f][r]:+.2f})')
    print(f'  {f:<8} ' + '  '.join(parts))

print('\n=== Statische HP-Bewertung (Christophers Crutch-Vorschlag) ===')
for c in v11.cards:
    hp = c.get('hp') or 0
    if hp > 0:
        print(f'  {c["id"]:>4} {c["title"][:26]:<26} hp+{hp} -> statisch '
              f'{hp}/{c["units"]:.1f} = {hp/c["units"]:.2f} '
              f'(F0 gemessen {cards_f["F0"][c["id"]]:.2f})')


def spearman(xs, ys):
    def ranks(v):
        order = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        i = 0
        while i < len(v):
            j = i
            while j + 1 < len(v) and v[order[j + 1]] == v[order[i]]:
                j += 1
            avg = (i + j) / 2 + 1
            for k in range(i, j + 1):
                r[order[k]] = avg
            i = j + 1
        return r
    rx, ry = ranks(xs), ranks(ys)
    mx, my = sum(rx) / len(rx), sum(ry) / len(ry)
    cov = sum((x - mx) * (y - my) for x, y in zip(rx, ry))
    vx = sum((x - mx) ** 2 for x in rx) ** 0.5
    vy = sum((y - my) ** 2 for y in ry) ** 0.5
    return cov / (vx * vy)


ids = [c['id'] for c in v11.cards]
print('\n=== Rang-Korrelation der Karten-Scores zwischen Rahmens ===')
for f in ('F0noeq', 'F0flat', 'Fstar'):
    print(f'  Spearman F0 vs {f}: '
          f'{spearman([cards_f["F0"][i] for i in ids], [cards_f[f][i] for i in ids]):+.2f}')
