# ============================================================================
# diag_anchor_live_r13i.py — Anker-LIVE-Rechnung (I1ad, 11.11.2026):
# Effektanalyse „Datenanker gepinnt vs. live abgeleitet" OHNE Anwendung.
#
# Hintergrund (I1ac): diag_infra_prices_r13i.py leitet c_ex/PV_equip her aus
# diag_v23i_r13t.json x units_of, wobei units_of via balancing_metric_v11
# die AKTUELLE cards.csv liest. Die v25-Repricing-Patches (10.11.,
# Equipment-/Statkarten-Energy-Dosen) aendern units_of -> Live-Anker
# driften. In I1ac wurde deshalb auf die v23i-Kalibrierung GEPINNT
# (c_ex 1,650 / PV_equip 3,145). Christophers Auftrag: den Live-Anker
# einmal durchrechnen und die Implikationen ANALYSIEREN (nicht anwenden).
#
# Methode: identischer Re-Exec wie diag_infra_final_r13i.py (Modell v9,
# PI_PLAY 0,75, ALPHA_E 0,25, Buff-Overrides 230 E-1 / 219 E-2+Psi-1,
# TMP-Umlenkung des Haupt-JSON), aber OHNE Anker-PIN (Live-Ableitung).
# Danach derselbe Tier-Remap (SWAP-Struktur, 413 mit I1aa-Score 0,269)
# und Median-/Band-Rechnung, dann Vergleich PINNED (aus
# diag_infra_final_r13i.json) vs. LIVE je Karte:
#   - Welche Anker ergeben sich live? Ratio?
#   - Skalierungs-These pruefen: Konsumenten ~ x(PV_equip_live/PV_equip_pin),
#     E-Produzenten (c_ex-Kurse) konstant?
#   - Aendert sich irgendeine Band-Entscheidung (flag_rel) oder die
#     Kurven-Rundung 0,3/0,5?
# ----------------------------------------------------------------------------
import contextlib
import io
import json
import os
import statistics

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
SRC = open(os.path.join(HERE, 'diag_infra_prices_r13i.py'),
           encoding='utf-8').read()
TMP = os.path.join(HERE, '.anchor_live_out.tmp')

BAND_REL = 0.5   # relative Bande +-50 % (BESCHLOSSEN I1y)
PIN_C_EX = 1.65
PIN_PV_EQUIP = 3.145


def run_live():
    """v9-Preisskript mit Buff-Overrides, OHNE Anker-PIN (Live-Ableitung)."""
    s = SRC
    # (KEIN Anker-PIN — c_ex/pv_equip werden live aus der aktuellen
    #  csv-Units-Ableitung berechnet, genau das ist der Analysegegenstand.)
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
        exec(compile(s, 'anchor_live', 'exec'), ns)
    os.remove(TMP)
    return ns


ns = run_live()
out = ns['out']
live_c_ex = ns['c_ex']
live_pv_equip = ns['pv_equip']
objs = {e['id']: e for e in out['objects']}

# ------------------------------- Tier-Remap (identisch zu I1ac/I1ab)
SWAP = {'448': (2, 'T2'), '183': (2, 'T2'), '164': (2, 'T2'),
        '333': (1, 'T1'), '435': (1, 'T1'), '154': (1, 'T1'),
        '320': (3, 'R3')}
EXTRA_413 = dict(id='413', title='Logistikknotenpunkt', rarity=2,
                 tier='T2', units=None, costs=None, gain=None, score=0.269,
                 calc='M2-Kern + konditionale Aktion (Speed 1+)',
                 place='Dual 50/50',
                 note='I1aa-Score 0,269 uebernommen (Modell liegt nicht im '
                 'v9-Objekt-Set; Skalierung analog den Konsumenten, s. '
                 'Analyse)')

rows = []
for e in out['objects']:
    r = dict(e)
    if r['id'] in SWAP:
        r['rarity'], r['tier'] = SWAP[r['id']]
    rows.append(r)
rows.append(EXTRA_413)

TIERS = ('T1', 'T2')
T = {t: sorted([r for r in rows if r['tier'] == t],
               key=lambda r: r['score']) for t in TIERS}
med = {t: round(statistics.median([r['score'] for r in T[t]]), 3)
       for t in TIERS}
for t in TIERS:
    for r in T[t]:
        r['delta'] = round(r['score'] - med[t], 3)
        r['flag_rel'] = abs(r['score'] - med[t]) > BAND_REL * med[t]

# ------------------------------- PINNED-Referenz (I1ac-JSON)
pin = json.load(open(os.path.join(HERE, 'diag_infra_final_r13i.json'),
                     encoding='utf-8'))
pin_rows = {r['id']: r for r in pin['objects']}
pin_med = pin['curve']['anchor']

# ------------------------------- Vergleich PINNED vs. LIVE
scale = live_pv_equip / PIN_PV_EQUIP
comp = []
for r in sorted(rows, key=lambda r: (r['tier'], r['score'])):
    p = pin_rows.get(r['id'])
    if p is None:
        continue
    d = r['score'] - p['score']
    in_band_frame = 'flag_rel' in p and 'flag_rel' in r  # R3 (320) ohne Band
    comp.append(dict(
        id=r['id'], title=r['title'], tier=r['tier'],
        pinned=round(p['score'], 3), live=round(r['score'], 3),
        delta=round(d, 3),
        pct=round(100 * (r['score'] / p['score'] - 1), 1) if p['score'] else None,
        pin_band=(bool(p['flag_rel']) if in_band_frame else None),
        live_band=(bool(r['flag_rel']) if in_band_frame else None),
        band_change=(in_band_frame
                     and bool(p['flag_rel']) != bool(r['flag_rel'])),
        pin_delta=p.get('delta'), live_delta=r.get('delta'),
    ))

producers = [c for c in comp if c['pct'] is not None and abs(c['pct']) < 0.05]
consumers = [c for c in comp if c['pct'] is not None and abs(c['pct']) >= 0.05]
band_changes = [c for c in comp if c['band_change']]

# ------------------------------- Ausgabe
W = 108
print('=' * W)
print('I1ad ANKER-LIVE-RECHNUNG (Analyse, KEINE Anwendung)')
print('=' * W)
print('Datenanker PINNED (I1ac, v23i-Kalibrierung): c_ex %.3f | '
      'PV_equip %.3f' % (PIN_C_EX, PIN_PV_EQUIP))
print('Datenanker LIVE  (aktuelle csv, v25-units):  c_ex %.3f | '
      'PV_equip %.3f  (%+.2f %%)'
      % (live_c_ex, live_pv_equip, 100 * (scale - 1)))
print('Tier-Mediane  PINNED: T1 %.3f / T2 %.3f (Ratio %.2fx) | '
      'LIVE: T1 %.3f / T2 %.3f (Ratio %.2fx)'
      % (pin_med['T1'], pin_med['T2'], pin_med['T2'] / pin_med['T1'],
         med['T1'], med['T2'], med['T2'] / med['T1']))
print('Kurven-Rundung LIVE: T1 %.2f / T2 %.2f (beschlossen: 0,3 / 0,5)'
      % (round(med['T1'], 1), round(med['T2'], 1)))
print()
print('Band-Entscheidungen (REL +-50 %%): %d geaendert%s'
      % (len(band_changes),
         '' if band_changes else ' — alle Karten behalten ihren Band-Status'))
for c in band_changes:
    print('  GEWAENDELT: %s %s pinned %.3f (%s) -> live %.3f (%s)'
          % (c['tier'], c['id'], c['pinned'],
             'ausserhalb' if c['pin_band'] else 'innerhalb',
             c['live'], 'ausserhalb' if c['live_band'] else 'innerhalb'))
print()
print('E-Produzenten (c_ex-Kurs, erwartungsgemaess konstant):')
for c in producers:
    print('  %s %-26s pinned %.3f live %.3f (%+.1f %%)'
          % (c['tier'], c['title'][:26], c['pinned'], c['live'], c['pct']))
print()
print('Konsumenten (PV_equip-Skalierung erwartet ~ %+.2f %%):'
      % (100 * (scale - 1)))
for c in consumers:
    print('  %s %-26s pinned %.3f live %.3f (%+.1f %%) %s'
          % (c['tier'], c['title'][:26], c['pinned'], c['live'], c['pct'],
             'BAND-STATUS GEANDERT' if c['band_change'] else ''))
print()
print('Live-Band-Report (LIVE-Anker, Bande relativ +-50 %):')
for t in TIERS:
    print('  %s: Median %.3f, Bande %.3f-%.3f, ausserhalb: %s'
          % (t, med[t], med[t] * (1 - BAND_REL), med[t] * (1 + BAND_REL),
             ', '.join(r['id'] for r in T[t] if r['flag_rel']) or 'keine'))
print()
print('Implikations-Kern: Live-Anker senkt PV_equip um %.1f %% -> '
      'Konsumenten-Scores deflationieren ~uniform, E-Produzenten bleiben '
      'absolut konstant (c_ex unveraendert). Kurve 0,3/0,5 absorbiert den '
      'Level-Effekt; Ratio verschiebt sich leicht (%.2fx -> %.2fx), weil '
      'nur die Konsumenten-Skala sinkt.'
      % (100 * (1 - scale), pin_med['T2'] / pin_med['T1'],
         med['T2'] / med['T1']))

out_json = dict(
    frame='I1ad Anker-Live-Rechnung (Effektanalyse gepinnt vs. live, '
          'KEINE Anwendung; Auftrag Christopher 11.11.2026)',
    issue='chrthom/outer-colonies#795 (Kontext I1ac-Pin)',
    model='MODELL v9, PI_PLAY 0,75, ALPHA_E 0,25; Re-Exec '
          'diag_infra_prices_r13i.py mit Buff-Overrides OHNE Anker-PIN',
    anker=dict(pinned=dict(c_ex=PIN_C_EX, pv_equip=PIN_PV_EQUIP),
               live=dict(c_ex=round(live_c_ex, 3),
                         pv_equip=round(live_pv_equip, 3)),
               scale=round(scale, 4),
               pct_pv_equip=round(100 * (scale - 1), 2)),
    mediane=dict(pinned=dict(T1=pin_med['T1'], T2=pin_med['T2'],
                              ratio=pin_med['T2'] / pin_med['T1']),
                 live=dict(T1=med['T1'], T2=med['T2'],
                           ratio=round(med['T2'] / med['T1'], 3)),
                 live_rundung=dict(T1=round(med['T1'], 1),
                                    T2=round(med['T2'], 1)),
                 kurve_beschlossen=dict(T1=0.3, T2=0.5)),
    band_entcheidungen_geaendert=[dict(id=c['id'], tier=c['tier'],
                                        pinned=c['pinned'], live=c['live'],
                                        pin_band=c['pin_band'],
                                        live_band=c['live_band'])
                                   for c in band_changes],
    vergleich=comp,
    live_band_report={t: dict(median=med[t],
                              bande=[round(med[t] * (1 - BAND_REL), 3),
                                     round(med[t] * (1 + BAND_REL), 3)],
                              ausserhalb=[r['id'] for r in T[t]
                                          if r['flag_rel']]) for t in TIERS},
    objects=rows,
    befund='Siehe Analyse in balancing.md Runde I1ad und Diskussion mit '
           'Christopher (Pin vs. Re-Kalibrierung offen).',
)
json.dump(out_json, open(os.path.join(HERE, 'diag_anchor_live_r13i.json'),
                         'w', encoding='utf-8'), ensure_ascii=False,
          indent=1)
print()
print('JSON: diag_anchor_live_r13i.json')
