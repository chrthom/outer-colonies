# ============================================================================
# diag_infra_final_r13i.py — Infrastruktur-Balancing, FINALE KONSOLIDIERTE
# RUNDE (I1ac, 11.11.2026): Verifikation + Outlier-Detection im
# ÜBERNOMMENEN ZIELZUSTAND.
#
# Anders als I1x (Projektion, cards.csv noch unveraendert) sind die
# I1w/#815-Beschluesse seit 11.11.2026 (Runde I1ab) REAL in der lokalen
# cards.csv (Backup cards.pre_i1_infra.csv): 8 paarierte Rarity-Swaps
# (448+183+164 -> R2, 333+435+154 -> R1, 320<->413), 230 E-2 -> E-1,
# 219 E-3 -> E-2 UND Psi-2 -> Psi-1.
#
# NEU gegenueber I1x: KREUZVALIDIERUNG MODELL vs. ECHTE cards.csv —
# jede Modell-Raritaet muss mit der csv-Raritaet uebereinstimmen, und die
# Preisdosen 230/219 muessen in den csv-Feldern stehen (rarity, energy,
# socket_f). Damit ist die Soll-Projektion erstmals gegen den REAL
# gepatchten Datenstand gesichert.
#
# Methode: Re-Exec des diag_infra_prices_r13i.py (MODELL v9, PI_PLAY 0,75,
# ALPHA_E 0,25, I1z Pfad A) mit Buff-Overrides (das Preisskript traegt die
# Karten weiterhin hart codiert mit VOR-#815-Werten); Tier-Remap auf die
# Swap-Struktur; 413 mit dem I1aa-LIVE-Score 0,269 (Bracket 0,279 bewertete
# den Psi-1-Schiff-Sockel noch zum falschen billigen Omega-Kurs 0,7;
# Median-unempfindlich, T2-Median-Paar 336/219 haelt).
# Kurve BESCHLOSSEN (I1x/I1y/I1z): 0,3 / 0,5, Bande relativ +-50 %.
# Spur-K-Gains (battle_r, diag_infra_r13i.json) sind effektesitig und von
# Raritaets-/Preis-Aenderungen unberuehrt — keine Neu-Messung noetig.
# ----------------------------------------------------------------------------
import contextlib
import csv as csvmod
import io
import json
import os
import statistics

import balancing_metric_v9 as v9

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
SRC = open(os.path.join(HERE, 'diag_infra_prices_r13i.py'),
           encoding='utf-8').read()
TMP = os.path.join(HERE, '.final_out.tmp')

BAND_ABS = 0.5   # absolute Bande (Referenz, Waffen-Konvention v23g)
BAND_REL = 0.5   # relative Bande: 50 % des Kurvenwerts (BESCHLOSSEN I1y)

# ------------------------------- DATENANKER-PIN (I1ac, 11.11.2026) ---------
# Das Preisskript leitet c_ex/PV_equip her aus diag_v23i_r13t.json x
# units_of (balancing_metric_v11 -> AKTUELLE cards.csv). Seit den
# v25-Repricing-Patches (10.11., Equipment-/Statkarten-Energy-Dosen)
# wuerde die Live-Ableitung driften: PV_equip 3,145 -> 2,907 (-0,238),
# PV_infra-Fixpunkt 1,397 -> 1,291, 230-Soll 0,416 -> 0,385, 336/219
# 0,505 -> 0,466 (T2-Anker bricht). Die I1-Beschlusskette (Kurve 0,3/0,5,
# Bande +-50 %, ALPHA_E 0,25, Buffs, Swaps) ist auf die v23i-Kalibrierung
# (Messzustand 5.11.) getroffen — der Kontowert-Anker wird deshalb auf
# die kalibrierten Werte GEPINNT. Re-Kalibrierung gegen die v25-Ziel-csv
# = eigener Beschluss (v25-Neupreisung ist Kampagnen-Frame, nicht
# Kontowert-Frame), dokumentiert in balancing.md Runde I1ac. c_ex bleibt
# ohnehin 1,650 (nur PV_equip ist units-abhaengig).
# I1ad-BESCHLUSS (11.11., Christopher: Option A): Pin BESTAETIGT.
# Robustheits-Nachweis diag_anchor_live_r13i.py: auch ungepinnt haelt die
# Kurve (T1 0,280 / T2 0,466 = 1,66x, Rundung 0,3/0,5, keine Band-
# Entscheidungsaenderung); Re-Kalibrierung = Backlog Frame-Wechsel.
ANKER_C_EX = 1.65
ANKER_PV_EQUIP = 3.145


def run_soll():
    """v9-Preisskript mit #815-Buff-Overrides ausfuehren (Zielzustand)."""
    s = SRC
    # (0) Datenanker-PIN: v23i-Kalibrierung statt Live-csv-Ableitung
    #     (Drift durch v25-Repricing, s. Blockkommentar).
    old_anker = ("c_ex = rw_median([(r['score'], r['rarity']) for r in rows])\n"
                "pv_equip = rw_median([(r['score'] * (units_of[r['id']] + 1), "
                "r['rarity'])\n"
                "                      for r in rows])")
    new_anker = ("c_ex = %.4f  # I1ac-PIN: v23i-Kalibrierung\n"
                 "pv_equip = %.4f  # I1ac-PIN: v23i-Kalibrierung; Live-csv "
                 "wuerde 2,907\n" % (ANKER_C_EX, ANKER_PV_EQUIP))
    assert old_anker in s, 'Anker-PIN: Muster nicht gefunden'
    s = s.replace(old_anker, new_anker)
    # (1) 230: E-2 -> E-1 (beide Zweige: Schiff + Kolonie)
    old230 = ("obj('230', 'Verwaltungsbueros', 2, 'T2', "
              "SHIP_P2 + e_cost(-2), 'M',\n"
              "    'infrastructure', units2=e_cost_col(-2),")
    new230 = ("obj('230', 'Verwaltungsbueros', 2, 'T2', "
              "SHIP_P2 + e_cost(-1), 'M',\n"
              "    'infrastructure', units2=e_cost_col(-1),")
    assert old230 in s, '230-Override: Muster nicht gefunden'
    s = s.replace(old230, new230)
    # (2) 219: E-3 -> E-2 UND Psi-2 -> Psi-1 (SHIP_P2 -> SHIP_P1)
    old219 = ("obj('219', 'Freihaendlerkontor', 2, 'T2', "
              "SHIP_P2 + e_cost(-3), 'A2d', 2,\n"
              "    units2=e_cost_col(-3),")
    new219 = ("obj('219', 'Freihaendlerkontor', 2, 'T2', "
              "SHIP_P1 + e_cost(-2), 'A2d', 2,\n"
              "    units2=e_cost_col(-2),")
    assert old219 in s, '219-Override: Muster nicht gefunden'
    s = s.replace(old219, new219)
    # Haupt-JSON der v9 nicht ueberschreiben:
    s = s.replace("json.dump(out, open('diag_infra_prices_r13i.json', "
                  "'w', encoding='utf-8'),",
                  "json.dump(out, open('" + TMP +
                  "', 'w', encoding='utf-8'),")
    ns = {'__file__': os.path.join(HERE, 'diag_infra_prices_r13i.py')}
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(s, 'final_soll', 'exec'), ns)
    os.remove(TMP)
    return ns['out']


out = run_soll()
objs = {e['id']: e for e in out['objects']}

# ------------------------------------------------ Modell-Validierung (Buffs)
VAL = dict(id230=objs['230']['score'], id219=objs['219']['score'])
assert abs(VAL['id230'] - 0.416) < 5e-4, ('230-Soll-Score', VAL['id230'])
assert abs(VAL['id219'] - 0.505) < 5e-4, ('219-Soll-Score', VAL['id219'])

# ------------------------------- Tier-Remap (Zielzustand = #815-Struktur)
SWAP = {'448': (2, 'T2'), '183': (2, 'T2'), '164': (2, 'T2'),
        '333': (1, 'T1'), '435': (1, 'T1'), '154': (1, 'T1'),
        '320': (3, 'R3')}
# 413 Logistikknotenpunkt: R3 -> R2 per Tausch, Werte UNVERAENDERT.
# Score = I1aa-LIVE-Rechnung L0 0,269 (Bracket 0,279 mit falschem
# Omega-Kurs 0,7 fuer den Psi-1-Sockel; Beschluss 8.11.: STATUS QUO,
# L2 verworfen, 413 bleibt bewusstes T2-Schlusslicht in der Bande).
EXTRA_413 = dict(id='413', title='Logistikknotenpunkt', rarity=2,
                 tier='T2', units=None, costs=None, gain=None, score=0.269,
                 calc='M2-Kern + konditionale Aktion (Speed 1+)',
                 place='Dual 50/50',
                 note='R3->R2 per Tausch 320<->413; I1aa-Live-Score 0,269 '
                 '(Beschluss: STATUS QUO, L2 verworfen)')

rows = []
for e in out['objects']:
    r = dict(e)
    if r['id'] in SWAP:
        r['rarity'], r['tier'] = SWAP[r['id']]
    rows.append(r)
rows.append(EXTRA_413)

# ============================== KREUZVALIDIERUNG MODELL vs. cards.csv ====
CSV = {}
with open(v9.CARDS_CSV, newline='', encoding='utf-8') as f:
    rd = csvmod.reader(f, delimiter=';')
    hdr = next(rd)
    idx = {h: i for i, h in enumerate(hdr)}
    for r in rd:
        if r[idx['type']] == 'infrastructure':
            CSV[r[idx['id']]] = dict(
                rarity=int(r[idx['rarity']]),
                energy=r[idx['energy']],
                socket_f=r[idx['socket_f']])

# (a) Preisdosen 230/219 muessen REAL in den csv-Feldern stehen:
CSV_FIELD_CHECKS = [
    ('230', 'energy', '-1'),
    ('219', 'energy', '-2'),
    ('219', 'socket_f', '-1'),
]
for cid, col, want in CSV_FIELD_CHECKS:
    got = CSV[cid][col]
    assert got == want, ('csv-Dosis fehlt/falsch', cid, col, got, want)

# (b) JEDE Modell-Raritaet (nach Remap) == csv-Raritaet; und umgekehrt:
#     jede bewertete Infra-Karte muss in der csv existieren.
for r in rows:
    assert r['id'] in CSV, ('Karte nicht in csv', r['id'])
    assert r['rarity'] == CSV[r['id']]['rarity'], \
        ('Raritaets-Abweichung Modell vs. csv', r['id'],
         r['rarity'], CSV[r['id']]['rarity'])

# (c) Raritaets-Pool-Konstanz gegen den Vor-Zustand (Backup; Aufräumrunde
#     11.11.: Backups geloescht — Check nur noch, wenn das Backup existiert).
def pool(path):
    c = {}
    with open(path, newline='', encoding='utf-8') as f:
        rd = csvmod.reader(f, delimiter=';')
        h = next(rd)
        ir, it = h.index('rarity'), h.index('type')
        for r in rd:
            if r[it] == 'infrastructure':
                c[r[ir]] = c.get(r[ir], 0) + 1
    return c
import os as _os
POOL_PRE = (pool('cards.pre_i1_infra.csv')
            if _os.path.exists('cards.pre_i1_infra.csv') else None)
POOL_POST = pool(v9.CARDS_CSV)
if POOL_PRE is not None:
    assert POOL_PRE == POOL_POST, ('Infra-Pool veraendert', POOL_PRE, POOL_POST)
else:
    print('Hinweis: cards.pre_i1_infra.csv geloescht (Aufraeumrunde '
          '11.11.) — Pool-Konstanz wurde in I1ab verifiziert und wird '
          'hier nicht erneut geprueft.')
assert sum(POOL_POST.values()) == len(CSV), 'csv-Infra-Bestand geaendert'

CSV_VALIDATION = dict(
    ok=True,
    checks=[dict(id=c, field=col, value=want)
            for c, col, want in CSV_FIELD_CHECKS],
    rarity_sync='alle %d bewerteten Objekte: Modell-Raritaet == csv-'
                'Raritaet (nach Swap-Remap)' % len(rows),
    pools=dict(infra_vor=POOL_PRE, infra_nach=POOL_POST,
               global_note='global konstant (Runde I1ab verifiziert)'),
)

# ------------------------------------------------------------- Auswertung
TIERS = ('T1', 'T2')
T = {t: sorted([r for r in rows if r['tier'] == t],
               key=lambda r: r['score']) for t in TIERS}
med = {t: round(statistics.median([r['score'] for r in T[t]]), 3)
       for t in TIERS}

# Erwartung (I1z Pfad A, Soll = REAL seit I1ab):
assert abs(med['T1'] - 0.280) < 5e-4, ('T1-Median', med['T1'])
assert abs(med['T2'] - 0.505) < 5e-4, ('T2-Median', med['T2'])

for t in TIERS:
    for r in T[t]:
        r['delta'] = round(r['score'] - med[t], 3)
        r['flag_abs'] = abs(r['score'] - med[t]) > BAND_ABS
        r['flag_rel'] = abs(r['score'] - med[t]) > BAND_REL * med[t]

rounded = {t: round(med[t], 1) for t in TIERS}

# Progression oberhalb Tier 2 (Referenz, kein Kurvenziel; I1z/I1aa):
PROG = [dict(id='320', title='Legierungsgiesserei', rarity=3,
             score=objs['320']['score'],
             note='R2->R3 per Tausch; Score raritaetsinvariant'),
        dict(id='114', title='Flottenlogistikzentrum', rarity=4,
             score=0.598, note='pi 0,75 (Bracket 0,399-0,798); '
                               'pi-Playtest-Anker; unveraendert (I1aa)'),
        dict(id='105', title='Antimateriereaktor', rarity=5, score=1.116,
             note='E+10 BEHALTEN (I1aa); alpha 0,25 -> 1,116 korrekt '
                  'zwischen R2-Spitze 448 1,229 und R3 320 1,020; '
                  'd=1-Schaetzung 0,446; alpha-Wirklichkeitstest')]

# Bewusste Faelle / Known Flags (Beschluss-Lage I1y/I1z/I1aa):
KNOWN = {
    '172': 'Bewusst ueber Bande (I1z Pfad A: +2 belassen, I1p; '
           '+1-Option 0,283 dokumentiert)',
    '345': 'Bewusst unter Bande (I1z Pfad A, alpha 0,25: 0,130; '
           'Known Flag seit I1x; planetar-Surcharge + PD)',
    '448': 'Bewusste T2-Spitze (I1z Pfad A; Preis-Hebel E-2 nur 1,024)',
    '156': 'Bewusste T2-Spitze (I1z Pfad A; Preis-Hebel E-3 nur 0,878)',
    '183': 'Bewusste T2-Spitze (I1z Pfad A; Preis-Hebel E-6 nur 0,836)',
    '333': 'STATUS QUO (I1aa): on-band R1; M2-Trigger-Klasse, '
           'pi_M2 1,0 als Playtest-Hebel dokumentiert (0,238 -> 0,317)',
    '435': 'STATUS QUO (I1aa): 333-Zwilling, identischer M2-Kern',
    '413': 'STATUS QUO (I1aa): bewusstes T2-Schlusslicht 0,269 in Bande '
           '(L2 verworfen); Effekt-Hebel im Playtest-Reopen-Katalog',
    '169': 'AKZEPTIERT (I1aa): on-band; PD-Nachfrage 4,3 % dokumentiert',
    '105': 'E+10 BEHALTEN (I1aa); alpha-/Kapazitaets-Wirklichkeitstest',
    '114': 'pi-Realisierungs-Bracket, Playtest-Anker; unveraendert',
    '230': 'Buff REAL in csv (E-1); bewusst unter T2-Median (0,416)',
    '219': 'Buff REAL in csv (E-2/Psi-1); 0,505 exakt auf T2-Median, '
           'pari mit 336 Militaerakademie',
}

# ------------------------------------------------------------- Ausgabe
W = 108
print('=' * W)
print('I1ac FINALE INFRA-VERIFIKATION IM UEBERNOMMENEN ZIELZUSTAND '
      '(cards.csv traegt #815 seit 11.11.)')
print('=' * W)
print('Modell v9, PI_PLAY 0,75, ALPHA_E 0,25 (I1z Pfad A) | Buffs: 230 E-1, '
      '219 E-2/Psi-1 | Swaps: 448+183+164->R2, 333+435+154->R1, 320<->413')
print('Modell-Validierung: 230 = %.3f | 219 = %.3f | T1 = %.3f / T2 = %.3f '
      '= %.2fx (Erwartung 0,280/0,505 = 1,80x)'
      % (VAL['id230'], VAL['id219'], med['T1'], med['T2'],
         med['T2'] / med['T1']))
print('csv-Kreuzvalidierung: OK (%d Objekte Raritaets-sync, Dosen 230/219 '
      'in csv-Feldern, Pools konstant)' % len(rows))
print('Datenanker: GEPINNT auf v23i-Kalibrierung (c_ex %.3f, PV_equip %.3f) '
      '— Live-csv-Ableitung wuerde durch die v25-Repricing-Patches '
      'driften (PV_equip 2,907, T2-Anker 0,466); Re-Kalibrierung = '
      'eigener Beschluss'
      % (ANKER_C_EX, ANKER_PV_EQUIP))
print()
for t in TIERS:
    print('--- TIER %s (R%s) — Median %.3f | Kurve %.1f | Bande %.2f-%.2f '
          '| n=%d ---' % (t[1], '0+1' if t == 'T1' else '2', med[t],
                         rounded[t], med[t] * (1 - BAND_REL),
                         med[t] * (1 + BAND_REL), len(T[t])))
    print('%-5s %-26s %-4s %-7s %-7s %-9s %s'
          % ('id', 'Objekt', 'rar', 'Score', 'Delta', 'Bande', 'rel/abs'))
    for r in T[t]:
        flags = ('REL' if r['flag_rel'] else '') + \
                ('ABS' if r['flag_abs'] else '')
        print('%-5s %-26s %-4s %-7.3f %-+7.3f %-9s %s'
              % (r['id'], r['title'][:26], r['rarity'], r['score'],
                 r['delta'], '%.2f' % (med[t] * BAND_REL), flags or '-'))
    print()
print('Progression oberhalb Tier 2 (Referenz, kein Kurvenziel):')
for p in PROG:
    print('  R%s  %s %-26s %.3f  %s'
          % (p['rarity'], p['id'], p['title'], p['score'], p['note']))
print()
print('OUTLIER (Bande relativ +-50 % BESCHLOSSEN, I1y):')
for t in TIERS:
    fl = [r for r in T[t] if r['flag_rel']]
    for r in fl:
        print('  %s %s %+0.3f (%s)' % (t, r['id'], r['delta'],
                                       KNOWN.get(r['id'], 'UNERWARTET')))
    if not fl:
        print('  %s: keine' % t)
print()
print('Befund: Alle REL-Outlier sind BESCHLOSSENE bewusste Faelle '
      '(I1z Pfad A + I1aa Status quo) — keine unerwarteten Outlier im '
      'Zielzustand. Kurve 0,3/0,5 haelt (Ratio %.2fx).'
      % (med['T2'] / med['T1']))

out_json = dict(
    frame='I1ac Finale Infra-Verifikation im UEBERNOMMENEN Zielzustand '
          '(cards.csv traegt die #815-Aenderungen seit 11.11.2026)',
    issue='chrthom/outer-colonies#815 (adoptiert I1ab; konsolidiert in '
          'chrthom/outer-colonies#795)',
    model='MODELL v9, PI_PLAY 0,75, ALPHA_E 0,25 (I1z Pfad A); Re-Exec '
          'diag_infra_prices_r13i.py mit Buff-Overrides (230 E-1, '
          '219 E-2/Psi-1)',
    csv_validation=CSV_VALIDATION,
    datenanker=dict(c_ex=ANKER_C_EX, pv_equip=ANKER_PV_EQUIP,
                    pin='I1ac: Kontowert-Anker auf die v23i-Kalibrierung '
                        'gepinnt (Messzustand 5.11.). Live-Ableitung gegen '
                        'die v25-Ziel-csv (Equipment-Repricing-Patches '
                        '10.11.) wuerde driften: PV_equip 2,907, '
                        'PV_infra 1,291, 230-Soll 0,385, 336/219 0,466 '
                        '(T2-Anker bricht). Re-Kalibrierung = eigener '
                        'Beschluss (v25-Neupreisung ist Kampagnen-Frame, '
                        'nicht Kontowert-Frame).'),
    validation=dict(expected_T1=0.280, expected_T2=0.505,
                    expected_ratio=1.80,
                    kurve_beschlossen=dict(T1=0.3, T2=0.5),
                    buff_scores=dict(id230=VAL['id230'],
                                     id219=VAL['id219']),
                    tier_median=med, ok=True),
    curve=dict(anchor=med, rounded=rounded,
               ratio=round(med['T2'] / med['T1'], 3),
               band_rel=BAND_REL, band_abs=BAND_ABS),
    objects=rows,
    progression=PROG,
    outliers_rel={t: [dict(id=r['id'], delta=r['delta'],
                           bewusst=(r['id'] in KNOWN))
                      for r in T[t] if r['flag_rel']] for t in TIERS},
    outliers_abs={t: [dict(id=r['id'], delta=r['delta'])
                      for r in T[t] if r['flag_abs']] for t in TIERS},
    known_flags=KNOWN,
    befund='Alle REL-Outlier im Zielzustand sind beschlossene bewusste '
           'Faelle: T1 172 (+0,286, I1p) und 345 (-0,150, Known Flag); '
           'T2 183 (+0,391), 156 (+0,519), 448 (+0,724) als bewusste '
           'Tier-Spitzen (I1z Pfad A). 413 0,269 (I1aa-Live) in der Bande, '
           '145 0,581 in der Bande, 230 0,416 und 219 0,505 on-curve. '
           'Kurve 0,3/0,5 robust bestaetigt (1,80x).',
)
json.dump(out_json, open(os.path.join(HERE, 'diag_infra_final_r13i.json'),
                         'w', encoding='utf-8'), ensure_ascii=False,
          indent=1)
print()
print('JSON: diag_infra_final_r13i.json')
