# ============================================================================
# diag_infra_outlier_r13i.py — Infrastruktur-Balancing Runde I1y
# UEBER-OUTLIER: konkrete Hebel-Messung im SOLL-ZUSTAND (Projektion wie
# I1x: I1w-Buffs + Swap-Tier-Remap, Issue #815 noch nicht umgesetzt).
# Christophers Entscheidungen (7.11.): KURVE 0,3/0,5 (gerundeter Anker)
# + BANDE RELATIV +-50 % des Kurvenwerts (T1 0,15-0,45, T2 0,25-0,75);
# fuer die 8 UEBER-Outlier konkrete Vorschlaege.
# Hebel: (a) je Karte E-/Handlimit-Kappen, (b) globaler ALPHA_E-Regler
# (E-Produzenten-Absorption, I1n/I1o) als EIN Hebel fuer alle vier
# Produzenten-Outlier 145/187/188/185. Kurve bleibt FIX 0,3/0,5
# (Anker-Stabilitaet: gerundeter Anker ist gegen Regler-Verschiebungen
# robust; Roh-Mediane werden mitberichtet).
# ----------------------------------------------------------------------------
import contextlib
import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)  # Re-Exec liest diag_v23i_r13t.json / diag_infra_r13i.json
SRC = open(os.path.join(HERE, 'diag_infra_prices_r13i.py'),
           encoding='utf-8').read()
TMP = os.path.join(HERE, '.outlier_out.tmp')

CURVE = {'T1': 0.3, 'T2': 0.5}   # BESCHLOSSEN (I1x, gerundeter Anker)
BAND = 0.5                        # BESCHLOSSEN: relativ +-50 %

SWAP = {'448': (2, 'T2'), '183': (2, 'T2'), '164': (2, 'T2'),
        '333': (1, 'T1'), '435': (1, 'T1'), '154': (1, 'T1'),
        '320': (3, 'R3')}


def run(overrides=(), alpha=None):
    """v9-Soll-Lauf (230 E-1, 219 E-2/Psi-1) + zusaetzliche Overrides."""
    s = SRC
    # --- Soll-Buffs (I1w) ---
    s = s.replace("obj('230', 'Verwaltungsbueros', 2, 'T2', "
                  "SHIP_P2 + e_cost(-2), 'M',\n"
                  "    'infrastructure', units2=e_cost_col(-2),",
                  "obj('230', 'Verwaltungsbueros', 2, 'T2', "
                  "SHIP_P2 + e_cost(-1), 'M',\n"
                  "    'infrastructure', units2=e_cost_col(-1),")
    s = s.replace("obj('219', 'Freihaendlerkontor', 2, 'T2', "
                  "SHIP_P2 + e_cost(-3), 'A2d', 2,\n"
                  "    units2=e_cost_col(-3),",
                  "obj('219', 'Freihaendlerkontor', 2, 'T2', "
                  "SHIP_P1 + e_cost(-2), 'A2d', 2,\n"
                  "    units2=e_cost_col(-2),")
    # --- Hebel-Overrides ---
    for old, new in overrides:
        assert old in s, 'Override-Muster nicht gefunden: %r' % old[:60]
        s = s.replace(old, new)
    if alpha is not None:
        s = re.sub(r'^ALPHA_E = [\d.]+', 'ALPHA_E = %r' % alpha, s,
                   flags=re.M)
    s = s.replace("json.dump(out, open('diag_infra_prices_r13i.json', "
                  "'w', encoding='utf-8'),",
                  "json.dump(out, open('" + TMP +
                  "', 'w', encoding='utf-8'),")
    ns = {'__file__': os.path.join(HERE, 'diag_infra_prices_r13i.py')}
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(s, 'outlier_variant', 'exec'), ns)
    os.remove(TMP)  # Re-Exec-Artefakt entfernen (keine Droppings)
    return {e['id']: e for e in ns['out']['objects']}


# ------------------------------------------------------- Hebel-Definitionen
LEVER = {
    '448': ('448 Schildkuppel E-1->E-2',
            ("obj('448', 'Schildkuppel', 1, 'T1', e_cost_col(-1), 'K', None,",
             "obj('448', 'Schildkuppel', 1, 'T1', e_cost_col(-2), 'K', None,")),
    '145': ('145 Fusionsreaktor E+4->E+3',
            ("obj('145', 'Fusionsreaktor', 2, 'T2', soc_cost(2), 'E', 4,",
             "obj('145', 'Fusionsreaktor', 2, 'T2', soc_cost(2), 'E', 3,")),
    '156': ('156 Planetarer Schild E-2->E-3',
            ("obj('156', 'Planetarer Schild', 2, 'T2', e_cost_col(-2), "
             "'K', None,",
             "obj('156', 'Planetarer Schild', 2, 'T2', e_cost_col(-3), "
             "'K', None,")),
    '183': ('183 Industriekomplex E-5->E-6',
            ("obj('183', 'Industriekomplex', 1, 'T1', e_cost_col(-5) + "
             "P_PLANETAR, 'A3',",
             "obj('183', 'Industriekomplex', 1, 'T1', e_cost_col(-6) + "
             "P_PLANETAR, 'A3',")),
    '172': ('172 Ressourcensilo +2->+1 Handlimit',
            ("obj('172', 'Ressourcensilo', 1, 'T1', SHIP_P1, 'H', 2, "
             "units2=0.0,",
             "obj('172', 'Ressourcensilo', 1, 'T1', SHIP_P1, 'H', 1, "
             "units2=0.0,")),
    '187': ('187 Atomreaktor E+2->E+1',
            ("obj('187', 'Atomreaktor (r0 x5)', 0, 'T1', soc_cost(1), "
             "'E', 2,",
             "obj('187', 'Atomreaktor (r0 x5)', 0, 'T1', soc_cost(1), "
             "'E', 1,")),
    '185': ('185 Kraftwerk E+5->E+4',
            ("obj('185', 'Kraftwerk (r0 x5)', 0, 'T1', P_PLANETAR, "
             "'Ec', 5,",
             "obj('185', 'Kraftwerk (r0 x5)', 0, 'T1', P_PLANETAR, "
             "'Ec', 4,")),
}

TITLES = {'185': 'Kraftwerk (r0 x5)', '187': 'Atomreaktor (r0 x5)',
          '188': 'Solarpanele (r0 x4)', '448': 'Schildkuppel',
          '172': 'Ressourcensilo', '145': 'Fusionsreaktor',
          '156': 'Planetarer Schild', '183': 'Industriekomplex',
          '413': 'Logistikknotenpunkt', '345': 'Autonomer Stuetzpunkt'}


def tier_rows(sc):
    """Objektliste mit Soll-Tier + Delta gegen die FIXE Kurve 0,3/0,5."""
    rows = []
    for oid, e in sc.items():
        r = dict(id=oid, title=e['title'], rarity=e['rarity'],
                 tier=e['tier'], score=e['score'])
        if oid in SWAP:
            r['rarity'], r['tier'] = SWAP[oid]
        rows.append(r)
    rows.append(dict(id='413', title=TITLES['413'], rarity=2, tier='T2',
                     score=0.279))
    for r in rows:
        if r['tier'] not in CURVE:   # R3-Progressions-Referenz (320)
            r['delta'] = None
            r['in_band'] = True
            continue
        c = CURVE[r['tier']]
        r['delta'] = round(r['score'] - c, 3)
        r['in_band'] = abs(r['score'] - c) <= BAND * c
    return rows


def outliers(rows, side='both'):
    out = []
    for r in rows:
        if not r['in_band']:
            d = r['delta']
            if side == 'both' or (side == 'over') == (d > 0):
                out.append('%s %+0.3f' % (r['id'], d))
    return out


import statistics

def med_of(rows, t):
    return round(statistics.median([r['score'] for r in rows
                                    if r['tier'] == t]), 3)


W = 104
print('=' * W)
print('I1y UEBER-OUTLIER: HEBEL-MESSUNG IM SOLL-ZUSTAND — Kurve FIX 0,3/0,5,'
      ' Bande relativ +-50 % (T1 0,15-0,45 | T2 0,25-0,75)')
print('=' * W)

base_sc = run()
base = tier_rows(base_sc)
print('%-38s %-8s %-8s %-24s %-24s'
      % ('Szenario', '187/188', '185', '145/156/448/183', 'Outlier (Delta vs Kurve)'))
print('%-38s %-8s %-8s %-24s T1: %s | T2: %s'
      % ('BASE (Soll, alpha 0,5)',
         '%.3f' % base_sc['187']['score'],
         '%.3f' % base_sc['185']['score'],
         '%.3f %.3f %.3f %.3f' % (base_sc['145']['score'],
                                  base_sc['156']['score'],
                                  base_sc['448']['score'],
                                  base_sc['183']['score']),
         ', '.join(outliers([r for r in base if r['tier'] == 'T1'])) or 'keine',
         ', '.join(outliers([r for r in base if r['tier'] == 'T2'])) or 'keine'))
print()

print('--- Einzelhebel (je Karte) ---')
lever_res = {}
for oid, (label, (old, new)) in LEVER.items():
    sc = run(overrides=[(old, new)])
    rows = tier_rows(sc)
    lever_res[oid] = dict(label=label, scores={k: sc[k]['score']
                                              for k in ('187', '188', '185',
                                                        '145', '156', '448',
                                                        '183', '172', '345')},
                          med=dict(T1=med_of(rows, 'T1'), T2=med_of(rows, 'T2')),
                          outliers={'T1': outliers([r for r in rows
                                                    if r['tier'] == 'T1']),
                                    'T2': outliers([r for r in rows
                                                    if r['tier'] == 'T2'])})
    print('%-38s %s -> %-7.3f (Delta %+0.3f, %s)'
          % (label, TITLES[oid], sc[oid]['score'],
             sc[oid]['score'] - CURVE['T1' if oid in
             ('187', '188', '185', '172', '169', '238', '239', '345',
              '333', '435', '154') else 'T2'],
             'IN BAND' if abs(sc[oid]['score'] - CURVE[
                 'T1' if oid in ('187', '188', '185', '172') else 'T2'])
             <= BAND * CURVE['T1' if oid in ('187', '188', '185', '172')
                             else 'T2'] else 'ueber'))
print()

print('--- Globaler ALPHA_E-Regler (E-Produzenten-Absorption, '
      'I1n/I1o-Hebel) ---')
alpha_res = {}
for a in (0.5, 0.375, 0.25):
    sc = run(alpha=a)
    rows = tier_rows(sc)
    alpha_res[a] = dict(scores={k: sc[k]['score'] for k in
                                ('185', '187', '188', '145', '345')},
                        med=dict(T1=med_of(rows, 'T1'), T2=med_of(rows, 'T2')),
                        outliers={'T1': outliers([r for r in rows
                                                   if r['tier'] == 'T1']),
                                  'T2': outliers([r for r in rows
                                                 if r['tier'] == 'T2'])})
    print('alpha %.3f: 187/188 %.3f | 185 %.3f | 145 %.3f | 345 %.3f | '
          'Roh-Mediane %.3f/%.3f'
          % (a, sc['187']['score'], sc['185']['score'], sc['145']['score'],
             sc['345']['score'], med_of(rows, 'T1'), med_of(rows, 'T2')))
    print('          T1-Outlier: %s | T2-Outlier: %s'
          % (', '.join(alpha_res[a]['outliers']['T1']) or 'keine',
             ', '.join(alpha_res[a]['outliers']['T2']) or 'keine'))
print()
print('EMPFEHLUNG: alpha 0,25 deckt 187/188/185/145 ab (kein Einzelhebel '
      'fuer 188 existiert); 448/156/183 bleiben strukturelle Tier-Spitzen '
      '(Preis-Hebel ausgeschoepft, s.o.); 172 einziger verbleibender '
      'T1-UEBER-Outlier (+0,266; Hebel +1 -> siehe oben, I1p: +2 belassen).')
print('Anker-Stabilitaet: gerundete Kurve 0,3/0,5 bleibt bei alpha 0,25 '
      'gueltig (Roh-Median T1 0,280 -> rundet auf 0,3; T2 unverändert '
      '0,505 -> 0,5, Median-Paar 336/219 haelt).')

out_json = dict(
    frame='I1y Ueber-Outlier Hebel-Messung im Soll-Zustand '
          '(Projektion #815; Kurve FIX 0,3/0,5 beschlossen, Bande '
          'relativ +-50 % beschlossen)',
    curve=CURVE, band=BAND,
    lever={k: dict(label=v[0],
                   scores=lever_res[k]['scores'],
                   med=lever_res[k]['med'],
                   outliers=lever_res[k]['outliers'])
           for k, v in LEVER.items()},
    alpha={str(a): dict(scores=alpha_res[a]['scores'],
                         med=alpha_res[a]['med'],
                         outliers=alpha_res[a]['outliers'])
           for a in alpha_res},
    empfehlung='ALPHA_E 0,25 als Modell-Default (deckt 187/188/185/145; '
               '345 faellt auf 0,131 leicht unter die T1-Kante, Known '
               'Flag); 448/156/183 bewusst als Tier-Spitzen akzeptiert '
               '(Preis-Hebel ausgeschoepft: E-2/E-3/E-6 nur 1,02/0,88/'
               '0,84); 172 +2 belassen (I1p) oder +1-Option; '
               'alpha bleibt Playtest-Regler',
)
json.dump(out_json, open(os.path.join(HERE, 'diag_infra_outlier_r13i.json'),
                        'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print()
print('JSON: diag_infra_outlier_r13i.json')
