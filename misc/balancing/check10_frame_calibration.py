#!/usr/bin/env python3
"""check10: Gesamt-Kalibrierungsrahmen (Runde 13n, Christophers
2-Gefechte-Frame, 4.11.2026).

Christophers Beschluesse 13l/13m:
- Frame n1+c3+shift0: bewertete Karte 1x je Schiff (wspec-Instanzschleife
  range(1)), 3-teilige Schiffe 2 Gefechtswaffen / 2- und 1-teilige 1
  (n_inst), POOL_SHIFT 0.0 (Original-Verteilung).
- ZWEI simulierte Gefechte je Karte, 50/50-Gewichtung:
  (a) Flottenkampf wie check9 (draw_battle, 3+3 Schiffe),
  (b) 1v1-Spiegelduell: Build gemaess Sockel-Kompatibilitaet der
      bewerteten Waffe gezogen (Torpedo socket d -> grosse Traeger),
      Statkarten ohne Sockelzwang auf typischem Build; att = deff = [b],
      Gefechtswaffe rarity-gewichtet bis kompatibel; Raid 50 % mit
      Kolonie-Pool, gleiche Konten.
- Rollen-Fix: bewertete Karte in BEIDEN Rollen messen (Seite 0 =
  Verteidiger, Seite 1 = Raid-Angreifer inkl. R1-Kolonie-Logik,
  Verheerend (Kolonie) x2, Kolonieschaden aus Angreifersicht = Beute);
  Score = 50/50-Rollenmittel je Frame, dann 50/50 Frame-Mittel.
- Konten: Sicht 0 = out - take - col + loot; Sicht 1 = out - take
  + col (Beute) + loot. Flotte: gain/N/3/units; 1v1: gain/N/1/units.
- Statkarten-Score zusaetzlich statisches HP-Konto (HP_STATIC x hp,
  Runde 13i), 1x im Rollenmittel.

Output: frame_calibration.json (13p-Messung gesichert als
frame_calibration_r13p.json). Checkpoints check10_ckpt_v20.json
(Flotte, alle 500 Gefechte), 1v1-Einzelergebnisse in
check10_1v1_v20.json (je Karte eigener Strom, seed 42, N je Karte).

--- FRAME-UPDATE 13q (Christophers Beschluesse 4.11.2026, nach
Saettigungs-Diagnose diag_saturation_r13q.py): ---
1. REFERENZ-NACHFRAGE M=2: Umgebungs-Bewaffnung beider Seiten
   permanent dmg_scale=(2.0, 2.0) — Gefechte verzehren ~46 % des
   HP-Pools (vorher ~20 %); Schild-/Panzerungs-/Speed-Karten waren
   nachfragelimitiert (Elastizitaet 1,3-1,6 bei M2). Die bewertete
   Karte (wspec/spec) wird NICHT skaliert (Deltamessung).
2. STATKARTEN n_inst-PLATZIERUNG: bewertete Karte analog c3 2 Kopien
   auf dem 3-teiligen Schiff (Flotte: 1+1+2 = 4 Kopien, jede Flotte
   hat exakt 1x 3-teilig -> gain/N/4; Duell: je Build n_pl = 2 bei
   3-teilig sonst 1, Gain je Gefecht /n_pl) — Normierung JE KOPIE,
   basisgleich mit Waffen (gain/N/3 bei 3 Platzierungen).
   Umgebungspool bleibt 1x je Schiff (Beschluss: nur bewertete Karte).
Erwartung: Waffen-Mediane sinken leicht (eigenes Fleet stirbt
frueher), Karten-Mediane steigen -> NEUANKERUNG v20 auf den neuen
Medianen (Christophers Glaettung), Waffen UND erste Karten-Kurve
auf gemeinsamer Basis.

Aufruf: python3 check10_frame_calibration.py [N]   (Default 10000)
"""
import json
import os
import random
import shutil
import statistics
import sys
import time

import balancing_metric_v10 as v10
import balancing_metric_v11 as v11
import balancing_metric_v9 as v9

HERE = os.path.dirname(os.path.abspath(__file__))
N = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
TAKE_WEIGHT = 1.0
T = dict(v11.TARGETS_V14)          # v20-Kurve (offiziell, GEMEINSAM fuer
                                   # Waffen+Karten, Christophers Beschluss)
HP_STATIC = v11.HP_STATIC
# --- Runde 13q (Christophers Beschluss): Referenz-Nachfrage M=2 ---
DMG_SCALE = (2.0, 2.0)
CKPT = os.path.join(HERE, 'check10_ckpt_v20.json')
CKPT_1V1 = os.path.join(HERE, 'check10_1v1_v20.json')
FC_PATH = os.path.join(HERE, 'frame_calibration.json')
FC_BAK = os.path.join(HERE, 'frame_calibration_r13p.json')

V9_SCORES = {w['id']: w['scored'] for w in json.load(
    open(os.path.join(HERE, 'weapons_v9_final.json'), encoding='utf-8'))}

cpools = [(cs, p) for cs, p in v9.COLONY]
cptot = sum(p for _, p in cpools)

ws = v11.weapons
cs = v11.cards
byid = {w['id']: w for w in ws}


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
    cov = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
    vx = sum((a - mx) ** 2 for a in rx) ** 0.5
    vy = sum((b - my) ** 2 for b in ry) ** 0.5
    return cov / (vx * vy)


def acc_side(r, side):
    """Wert-Konto zerlegt (Vorzeichen: mehr = mehr Wert) je Sicht."""
    if side == 0:
        return dict(out=r['dealt0'], take=-TAKE_WEIGHT * r['taken0'],
                    col=-r['colony'], loot=r['loot0'])
    return dict(out=r['dealt1'], take=-TAKE_WEIGHT * r['taken1'],
                col=+r['colony'], loot=r['loot1'])


def total(a):
    return a['out'] + a['take'] + a['col'] + a['loot']


def blank2():
    return {wid: [dict(out=0.0, take=0.0, col=0.0, loot=0.0) for _ in (0, 1)]
            for wid in byid}


# ================= Frame A: Flottenkampf (Rollenmittel) =================
def run_fleet():
    accW = blank2()
    accC = {c['id']: [dict(out=0.0, take=0.0, col=0.0, loot=0.0)
                      for _ in (0, 1)] for c in cs}
    base0 = base1 = 0.0
    acc0 = acc1 = dict(out=0.0, take=0.0, col=0.0, loot=0.0)
    raid_n = n_mission = 0
    start = 0
    random.seed(42)
    if os.path.exists(CKPT):
        ck = json.load(open(CKPT, encoding='utf-8'))
        start = ck['iter']
        accW, accC = ck['accW'], ck['accC']
        base0, base1 = ck['base0'], ck['base1']
        acc0, acc1 = ck['acc0'], ck['acc1']
        raid_n, n_mission = ck['raid_n'], ck['n_mission']
        random.setstate((3, tuple(ck['rng']), None))
        print(f'Resume Flotte bei Iteration {start}/{N}')
    t0 = time.time()
    for b in range(start, N):
        w, att, deff, raid = v11.draw_battle()
        pool_cards, _ = v11.pools[random.choices(
            range(len(v11.pools)), weights=v11.pprob)[0]]
        colpool = None
        if raid:
            raid_n += 1
            colpool = cpools[random.choices(
                range(len(cpools)),
                weights=[p / cptot for _, p in cpools])[0]][0]
        else:
            n_mission += 1
        fire = [[[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
                 for _ in range(3)] for _ in (0, 1)]
        wspec_fire = [[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]
                      for _ in range(3)]
        order = (0, 1) if b % 2 == 0 else (1, 0)
        r = v11.battle(w, att, deff, pool_cards, fire, order, raid=raid,
                       colpool=colpool, dmg_scale=DMG_SCALE, ret='full')
        a0, a1 = acc_side(r, 0), acc_side(r, 1)
        base0 += total(a0)
        base1 += total(a1)
        for k in a0:
            acc0[k] += a0[k]
            acc1[k] += a1[k]
        for w2 in ws:
            r0 = v11.battle(w, att, deff, pool_cards, fire, order, raid=raid,
                            wspec=w2, wspec_fire=wspec_fire, colpool=colpool,
                            wspec_side=0, dmg_scale=DMG_SCALE, ret='full')
            m = acc_side(r0, 0)
            for k in m:
                accW[w2['id']][0][k] += m[k] - a0[k]
            r1 = v11.battle(w, att, deff, pool_cards, fire, order, raid=raid,
                            wspec=w2, wspec_fire=wspec_fire, colpool=colpool,
                            wspec_side=1, dmg_scale=DMG_SCALE, ret='full')
            m = acc_side(r1, 1)
            for k in m:
                accW[w2['id']][1][k] += m[k] - a1[k]
        for c in cs:
            # --- 13q: n_inst-Platzierung (2 Kopien auf 3-teiligem
            # Schiff, 4 Kopien gesamt) — Normierung je Kopie via
            # N*4 in der Auswertung ---
            r0 = v11.battle(w, att, deff, pool_cards, fire, order, raid=raid,
                            spec=c, spec_side=0, colpool=colpool,
                            dmg_scale=DMG_SCALE, spec_n_inst=True,
                            ret='full')
            m = acc_side(r0, 0)
            for k in m:
                accC[c['id']][0][k] += m[k] - a0[k]
            r1 = v11.battle(w, att, deff, pool_cards, fire, order, raid=raid,
                            spec=c, spec_side=1, colpool=colpool,
                            dmg_scale=DMG_SCALE, spec_n_inst=True,
                            ret='full')
            m = acc_side(r1, 1)
            for k in m:
                accC[c['id']][1][k] += m[k] - a1[k]
        if (b + 1) % 500 == 0 or b + 1 == N:
            state = random.getstate()
            json.dump(dict(iter=b + 1, accW=accW, accC=accC,
                           base0=base0, base1=base1, acc0=acc0, acc1=acc1,
                           raid_n=raid_n, n_mission=n_mission,
                           rng=list(state[1])),
                      open(CKPT, 'w', encoding='utf-8'))
            print(f'  Flotte {b + 1}/{N} ({time.time() - t0:.0f}s)', flush=True)
    return dict(accW=accW, accC=accC, base0=base0 / N, base1=base1 / N,
                acc0={k: v / N for k, v in acc0.items()},
                acc1={k: v / N for k, v in acc1.items()},
                raid_share=raid_n / N)


# ================= Frame B: 1v1-Spiegelduell (Rollenmittel) ==============
def draw_duel_build(spec):
    """Build gemaess Sockel-Kompatibilitaet (Waffe) bzw. typisch
    (Statkarte), zweistufig gewichtet (Typ x Build), flugfaehig."""
    cands, weights = [], []
    for b in v11.ALL_BUILDS:
        if b['s'] < 1 or not v11.compatible(spec, b):
            continue
        cands.append(b)
        weights.append(v11.TYPE_BEST[(b['parts'], b['type'])] * b['w'])
    return random.choices(cands, weights=weights)[0]


def duel_battle(w2, b, pool_cards, fire, wf, order, raid, colpool,
                side_kw):
    return v11.battle(w2, [b], [b], pool_cards, fire, order, raid=raid,
                      colpool=colpool, dmg_scale=DMG_SCALE, **side_kw,
                      ret='full')


def run_duel_one(kind, spec, n):
    """Ein Duelldurchlauf (eigener Strom seed 42) fuer eine Karte."""
    random.seed(42)
    acc = [dict(out=0.0, take=0.0, col=0.0, loot=0.0) for _ in (0, 1)]
    raid_n = 0
    for i in range(n):
        b = draw_duel_build(spec)
        while True:
            w2 = ws[random.choices(v11.widx, weights=v11.wweights)[0]]
            if v11.compatible(w2, b):
                break
        raid = random.random() < 0.5
        colpool = None
        if raid:
            raid_n += 1
            colpool = cpools[random.choices(
                range(len(cpools)),
                weights=[p / cptot for _, p in cpools])[0]][0]
        pool_cards, _ = v11.pools[random.choices(
            range(len(v11.pools)), weights=v11.pprob)[0]]
        fire = [[[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]]
                for _ in (0, 1)]
        wf = [[random.random() < v10.ATTACK_PROB[p] for p in v11.PHASES]]
        order = (0, 1) if i % 2 == 0 else (1, 0)
        r = duel_battle(w2, b, pool_cards, fire, wf, order, raid, colpool, {})
        a0, a1 = acc_side(r, 0), acc_side(r, 1)
        if kind == 'w':
            n_pl = 1.0
            r0 = duel_battle(w2, b, pool_cards, fire, wf, order, raid,
                             colpool, dict(wspec=spec, wspec_fire=wf,
                                            wspec_side=0))
            r1 = duel_battle(w2, b, pool_cards, fire, wf, order, raid,
                             colpool, dict(wspec=spec, wspec_fire=wf,
                                            wspec_side=1))
        else:
            # --- 13q: n_inst-Platzierung, Normierung je Kopie ->
            # Gain je Gefecht / n_pl (2 bei 3-teiligem Build) ---
            n_pl = 2.0 if b['parts'] == 3 else 1.0
            r0 = duel_battle(w2, b, pool_cards, fire, wf, order, raid,
                             colpool, dict(spec=spec, spec_side=0,
                                            spec_n_inst=True))
            r1 = duel_battle(w2, b, pool_cards, fire, wf, order, raid,
                             colpool, dict(spec=spec, spec_side=1,
                                            spec_n_inst=True))
        for k in a0:
            acc[0][k] += (acc_side(r0, 0)[k] - a0[k]) / n_pl
            acc[1][k] += (acc_side(r1, 1)[k] - a1[k]) / n_pl
    return acc, raid_n / n


def run_duel(n):
    """Alle 50 Waffen + 19 Statkarten im Duell, je Karte eigener
    seed-42-Strom; Fortsetzung via check10_1v1.json."""
    done = {}
    if os.path.exists(CKPT_1V1):
        done = json.load(open(CKPT_1V1, encoding='utf-8'))
    queue = ([('w', w) for w in ws] + [('c', c) for c in cs])
    t0 = time.time()
    for idx, (kind, spec) in enumerate(queue):
        if f'{kind}:{spec["id"]}' in done:
            continue
        acc, rs = run_duel_one(kind, spec, n)
        done[f'{kind}:{spec["id"]}'] = dict(kind=kind, acc=acc,
                                            raid_share=rs)
        json.dump(done, open(CKPT_1V1, 'w', encoding='utf-8'))
        print(f'  Duell {idx + 1}/69: {spec["id"]} {spec["title"][:24]} '
              f'({time.time() - t0:.0f}s)', flush=True)
    return done


# ============================ Auswertung ================================
def scores_from(accs, div):
    """Rollen-Gewinn (Mittel je Gefecht/Schiff, OHNE units)."""
    g0 = total(accs[0]) / div
    g1 = total(accs[1]) / div
    return g0, g1, (g0 + g1) / 2


fleet = run_fleet()
duel = run_duel(N)

rows_w, rows_c = [], []
for w in ws:
    units = v11.weapon_units(w)
    f0, f1, fm = scores_from(fleet['accW'][w['id']], N * 3)
    d0, d1, dm = scores_from(duel[f'w:{w["id"]}']['acc'], N * 1)
    fsc, dsc = fm / units, dm / units
    k = (fsc + dsc) / 2
    rows_w.append(dict(id=w['id'], title=w['title'], rarity=w['rarity'],
                       units=units, fleet0=round(f0 / units, 2),
                       fleet1=round(f1 / units, 2), fleet=round(fsc, 2),
                       duel0=round(d0 / units, 2), duel1=round(d1 / units, 2),
                       duel=round(dsc, 2), score=round(k, 2),
                       delta=round(k - T[w['rarity']], 2),
                       v9=V9_SCORES.get(w['id']),
                       sockets=w.get('sockets', '')))
for c in cs:
    units = c['units']
    # --- 13q: Normierung je Kopie — Flotte hat 4 Platzierungen
    # (1+1+2 Kopien), Duell per Gefecht bereits /n_pl normiert ---
    f0, f1, fm = scores_from(fleet['accC'][c['id']], N * 4)
    d0, d1, dm = scores_from(duel[f'c:{c["id"]}']['acc'], N * 1)
    # Score-Formel 13i: (gain-Rollenmittel + HP_STATIC x hp) / units
    fsc = (fm + HP_STATIC * c['hp']) / units
    dsc = (dm + HP_STATIC * c['hp']) / units
    k = (fsc + dsc) / 2
    rows_c.append(dict(id=c['id'], title=c['title'], rarity=c['rarity'],
                       units=units, hp=c['hp'],
                       fleet0=round(f0 / units, 2), fleet1=round(f1 / units, 2),
                       fleet=round(fsc, 2), duel0=round(d0 / units, 2),
                       duel1=round(d1 / units, 2), duel=round(dsc, 2),
                       score=round(k, 2),
                       delta=round(k - T[c['rarity']], 2)))

med = {}
for rar in (1, 2, 3, 4, 5):
    gw = [r for r in rows_w if r['rarity'] == rar]
    gc = [r for r in rows_c if r['rarity'] == rar]
    med[rar] = dict(
        weapons=round(statistics.median(r['score'] for r in gw), 2),
        cards=round(statistics.median(r['score'] for r in gc), 2),
        n_w=len(gw), n_c=len(gc),
        weapons_fleet=round(statistics.median(r['fleet'] for r in gw), 2),
        weapons_duel=round(statistics.median(r['duel'] for r in gw), 2),
        cards_fleet=round(statistics.median(r['fleet'] for r in gc), 2),
        cards_duel=round(statistics.median(r['duel'] for r in gc), 2))

rho_fd = spearman([r['fleet'] for r in rows_w], [r['duel'] for r in rows_w])
_v9p = [(r['score'], r['v9']) for r in rows_w if r['v9'] is not None]
rho_v9 = spearman([a for a, _ in _v9p], [b for _, b in _v9p])

outlier = sorted((r for r in rows_w if abs(r['delta']) > 1.0),
                 key=lambda r: -abs(r['delta']))
# --- 13q: GEMEINSAME Kurve fuer Waffen UND Karten (Christophers
# Beschluss v20) -> Karten-Outlier gegen dieselbe Zielkurve ---
outlier_c = sorted((r for r in rows_c if abs(r['delta']) > 1.0),
                   key=lambda r: -abs(r['delta']))

print(f'\n=== check10 Gesamt-Frame (N={N}): Flotte+Duell 50/50, '
      f'Rollenmittel ===')
print(f'Flotte: Baseline-Konto Seite 0 {fleet["base0"]:.2f} / '
      f'Seite 1 {fleet["base1"]:.2f} / Raid-Anteil '
      f'{fleet["raid_share"]:.1%}')
print('Mediane je Raritaet (Waffen / Statkarten), kombiniert + je Frame:')
for rar in (1, 2, 3, 4, 5):
    m = med[rar]
    print(f'  r{rar}: Waffen {m["weapons"]:.2f} (Fl {m["weapons_fleet"]:.2f} '
          f'/ Du {m["weapons_duel"]:.2f}) | Karten {m["cards"]:.2f} '
          f'(Fl {m["cards_fleet"]:.2f} / Du {m["cards_duel"]:.2f}) | '
          f'v20 {T[rar]:.2f} | Luecke {m["weapons"] / m["cards"]:.1f}x')
print(f'Spearman Waffen: Duel↔Flotte {rho_fd:+.2f}, kombi↔v9 {rho_v9:+.2f}')
print(f'\nOutlier |Δ|>1,0 gegen v20 (GEMEINSAME Kurve Waffen+Karten): '
      f'{len(outlier)} Waffen')
for r in outlier:
    print(f"  {r['id']:>3} r{r['rarity']} {r['title'][:24]:<24} "
          f"kombi {r['score']:6.2f} Δ{r['delta']:+5.2f} "
          f"(Fl {r['fleet']:5.2f} / Du {r['duel']:5.2f})")
print(f'Outlier |Δ|>1,0 Karten: {len(outlier_c)} (gemeinsame Kurve)')
for r in outlier_c:
    print(f"  {r['id']:>3} r{r['rarity']} {r['title'][:24]:<24} "
          f"kombi {r['score']:6.2f} Δ{r['delta']:+5.2f} "
          f"(Fl {r['fleet']:5.2f} / Du {r['duel']:5.2f})")
_curve = ', '.join(str(r) + ': ' + str(med[r]['weapons']) for r in (1, 2, 3, 4, 5))
print('\nKurven-Neuanker-Vorschlag (Messmediane Waffen): {' + _curve + '}')

out = dict(frame='check10: n1+c3+shift0, Flotte+Duell 50/50, Rollenmittel',
           n=N, hp_static=HP_STATIC, take_weight=TAKE_WEIGHT,
           fleet_baseline=dict(side0=round(fleet['base0'], 2),
                                side1=round(fleet['base1'], 2),
                                raid_share=round(fleet['raid_share'], 3),
                                acc0={k: round(v, 2) for k, v in
                                      fleet['acc0'].items()},
                                acc1={k: round(v, 2) for k, v in
                                      fleet['acc1'].items()}),
           targets_v20=T, medians=med,
           spearman=dict(duel_fleet=round(rho_fd, 3), kombi_v9=round(rho_v9, 3)),
           weapons=rows_w, cards=rows_c,
           outliers=[r['id'] for r in outlier],
           outliers_cards=[r['id'] for r in outlier_c])
if os.path.exists(FC_PATH) and not os.path.exists(FC_BAK):
    shutil.copy(FC_PATH, FC_BAK)
json.dump(out, open(FC_PATH, 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print(f'-> {os.path.basename(FC_PATH)} geschrieben '
      f'(v16-Sicherung: {os.path.basename(FC_BAK)})')
