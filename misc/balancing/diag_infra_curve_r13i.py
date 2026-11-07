# ============================================================================
# diag_infra_curve_r13i.py — Infrastruktur-Balancing Runde I1x
# KURVEN-ANKERUNG + OUTLIER-DETECTION im SOLL-ZUSTAND (PROJEKTION):
# Es wird gerechnet, ALS WAEREN die I1w-Beschluesse umgesetzt (Issue #815
# ist noch offen — cards.csv/Grafiken folgen dort durch menschliche
# Umsetzung). Soll-Annahmen:
#   - 8 paarierte Rarity-Swaps: 448+183+164 -> R2, 333+435+154 -> R1,
#     320 <-> 413 (320 wird R3 = Progressions-Referenz, 413 wird R2 und
#     rueckt damit in Tier 2)
#   - 230 Verwaltungsbueros: E-2 -> E-1 (staerkster Kosten-Hebel, I1w)
#   - 219 Freihaendlerkontor: E-3 -> E-2 UND Psi-2 -> Psi-1 (Christophers
#     Ergaenzung; exakt 336 Militaerakademie-aequivalent)
# Methode: Re-Exec des diag_infra_prices_r13i.py (MODELL v9, PI_PLAY 0,75,
# ALPHA_E 0,25 seit I1y Pfad A — Re-Run 7.11.)
# mit Buff-Overrides; Tier-Remap auf die Swap-Struktur; KURVEN-ANKER =
# Tier-Mediane der Soll-Struktur (Christopher glaettet); Outlier gegen
# den Anker mit zwei Banden-Optionen (absolut 0,5 wie Waffen-v23g UND
# relativ 50 % des Tier-Medians — Infra-Score-Skala ist ~6x kleiner).
# Validierung: Soll-Mediane bei ALPHA_E 0,25 (I1y Pfad A): T1 0,280 /
# T2 0,505 = 1,80x (I1x-Anker bei alpha 0,5: 0,310/0,505 = 1,63x; die
# BESCHLOSSENE Kurve 0,3/0,5 deckt beide — gerundeter Anker stabil).
# Bande BESCHLOSSEN (I1y): relativ +-50 % des Kurvenwerts.
# ----------------------------------------------------------------------------
import contextlib
import io
import json
import os
import statistics

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)  # Re-Exec liest diag_v23i_r13t.json / diag_infra_r13i.json
SRC = open(os.path.join(HERE, 'diag_infra_prices_r13i.py'),
           encoding='utf-8').read()
TMP = os.path.join(HERE, '.curve_out.tmp')

BAND_ABS = 0.5   # absolute Bande (Waffen-Konvention v23g, Referenz)
BAND_REL = 0.5   # relative Bande: 50 % des Tier-Medians (Empfehlung)


def run_soll():
    """v9-Preisskript mit I1w-Buff-Overrides ausfuehren (Soll-Zustand)."""
    s = SRC
    # (1) 230: E-2 -> E-1 (beide Zweige: Schiff + Kolonie)
    old230 = ("obj('230', 'Verwaltungsbueros', 2, 'T2', "
              "SHIP_P2 + e_cost(-2), 'M',\n"
              "    'infrastructure', units2=e_cost_col(-2),")
    new230 = ("obj('230', 'Verwaltungsbueros', 2, 'T2', "
              "SHIP_P2 + e_cost(-1), 'M',\n"
              "    'infrastructure', units2=e_cost_col(-1),")
    assert old230 in s, '230-Override: Muster nicht gefunden'
    s = s.replace(old230, new230)
    # (2) 219: E-3 -> E-2 UND Psi-2 -> Psi-1 (SHIP_P2 -> SHIP_P1,
    #     beide Zweige)
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
        exec(compile(s, 'curve_soll', 'exec'), ns)
    os.remove(TMP)  # Re-Exec-Artefakt entfernen (keine Droppings)
    return ns['out']


out = run_soll()
objs = {e['id']: e for e in out['objects']}

# ---------------------------------------------------- Validierung der Buffs
VAL = dict(id230=objs['230']['score'], id219=objs['219']['score'])
assert abs(VAL['id230'] - 0.416) < 5e-4, ('230-Soll-Score', VAL['id230'])
assert abs(VAL['id219'] - 0.505) < 5e-4, ('219-Soll-Score', VAL['id219'])

# ------------------------------------------------- Tier-Remap (I1w-Soll)
SWAP = {'448': (2, 'T2'), '183': (2, 'T2'), '164': (2, 'T2'),
        '333': (1, 'T1'), '435': (1, 'T1'), '154': (1, 'T1'),
        '320': (3, 'R3')}
# 413 Logistikknotenpunkt: R3 -> R2 per Tausch, Werte UNVERAENDERT
# (I1w: Effekt-Hebel statt Preis -> Outlier-Runde). Score pi 0,75 = 0,279
# aus dem I1v-Bracket (0,213 / 0,279 / 0,345); Median-unempfindlich: mit
# 0,213 bleibt T2-Median 0,505 (Median-Paar weiterhin 336/219).
EXTRA_413 = dict(id='413', title='Logistikknotenpunkt', rarity=2,
                 tier='T2', units=None, costs=None, gain=None, score=0.279,
                 calc='M2-Kern + konditionale Aktion (Speed 1+)',
                 place='Dual 50/50', note='R3->R2 per Tausch 320<->413; '
                 'Score I1v-Bracket pi 0,75; Effekt-Hebel = Outlier-Runde')

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

# ------------------------------------------------------------- Outlier
for t in TIERS:
    for r in T[t]:
        r['delta'] = round(r['score'] - med[t], 3)
        r['flag_abs'] = abs(r['score'] - med[t]) > BAND_ABS
        r['flag_rel'] = abs(r['score'] - med[t]) > BAND_REL * med[t]

# Glaettungs-Kandidaten (Christophers Glaettung steht aus; Anker = Messwert):
rounded = {t: round(med[t], 1) for t in TIERS}

# Progression oberhalb Tier 2 (Werte unveraendert, I1u/I1v-Bewertungen):
PROG = [dict(id='320', title='Legierungsgiesserei', rarity=3,
             score=objs['320']['score'],
             note='R2->R3 per Tausch; Score raritaetsinvariant'),
        dict(id='114', title='Flottenlogistikzentrum', rarity=4,
             score=0.598,
             note='pi 0,75 (Bracket 0,399-0,798); pi-Playtest-Anker'),
        dict(id='105', title='Antimateriereaktor', rarity=5,
             score=0.446,
             note='d=1-Schaetzung; alpha 0,25 -> 1,116 (unter der '
                  '448-Spitze 1,229, knapp ueber deren ausgeschoepften '
                  'Preis-Hebel 1,024); alpha-Wirklichkeitstest, E+5 '
                  'waere 145-pari')]

KNOWN = {  # Outlier-Runden-Kandidaten unabhaengig von der Bande (I1t/I1u/I1w/I1y)
    '333': 'M2-Trigger-Fraktion 0,234 vs M(infra) 0,4375 — Design-Frage',
    '435': 'Zwilling von 333 (identischer M2-Kern)',
    '169': 'PD-Nachfrage 4,3 % (Messbefund) vs Schild 27 % — nur '
           'Effekt/Regel-Hebel',
    '413': 'M2-Kern + Speed-1+-Klausel; Effekt-Buff statt Preis '
           '(E-1 brachte nur 0,260)',
    '105': 'alpha-Anker / Kapazitaetsentscheidung',
    '114': 'pi-Realisierungs-Bracket, Playtest-Anker',
    '230': 'Buff umgesetzt (E-1, 0,416); bewusst unter T2-Median',
    '448': 'Bewusste T2-Spitze (I1y Pfad A; Preis-Hebel E-2 nur 1,024)',
    '156': 'Bewusste T2-Spitze (I1y Pfad A; Preis-Hebel E-3 nur 0,878)',
    '183': 'Bewusste T2-Spitze (I1y Pfad A; Preis-Hebel E-6 nur 0,836)',
    '172': 'Bewusst ueber Bande (I1y Pfad A: +2 belassen, I1p; '
           '+1-Option 0,283 dokumentiert)',
    '345': 'Bewusst unter Bande (I1y Pfad A, alpha 0,25: 0,130; '
           'Known Flag seit I1x)',
}

# ------------------------------------------------------------- Ausgabe
W = 108
print('=' * W)
print('I1x KURVEN-ANKERUNG + OUTLIER-DETECTION IM SOLL-ZUSTAND '
      '(PROJEKTION, Issue #815 noch nicht umgesetzt)')
print('=' * W)
print('Modell v9, PI_PLAY 0,75, ALPHA_E 0,25 (I1y Pfad A) | Buffs: 230 E-1, '
      '219 E-1/Psi-1 | Swaps: 448+183+164->R2, 333+435+154->R1, 320<->413')
print('Validierung: 230 = %.3f (Soll 0,416) | 219 = %.3f (Soll 0,505) | '
      'T1 = %.3f / T2 = %.3f = %.2fx (Soll bei alpha 0,25: 0,280/0,505 '
      '= 1,80x; I1x-Anker bei alpha 0,5: 0,310/0,505 = 1,63x)'
      % (VAL['id230'], VAL['id219'], med['T1'], med['T2'],
         med['T2'] / med['T1']))
print()
for t in TIERS:
    print('--- TIER %s (R%s) — Anker-Median %.3f | n=%d '
          '---' % (t[1], '0+1' if t == 'T1' else '2', med[t], len(T[t])))
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
print('Outlier (Bande relativ 50 % des Medians — BESCHLOSSEN I1y; '
      'absolut 0,5 = Referenz):')
for t in TIERS:
    fl = [r for r in T[t] if r['flag_rel']]
    print('  %s: %s' % (t, ', '.join('%s %+0.3f' % (r['id'], r['delta'])
                                     for r in fl) or 'keine'))
print()
print('Struktur-Befund bei alpha 0,25: Die I1x-Bimodalitaet (alpha 0,5: '
      'Produzenten 0,56-0,83 vs Basis-Cluster 0,20-0,31, Median 0,310) '
      'loest sich AUF — die Produzenten ruecken in die Bande (185 0,280 '
      'auf dem Median, 187/188 0,412), T1 wird homogener (0,13-0,41); '
      'verbleibende REL-Outlier nur noch bewusste Faelle: in T1 172 '
      '+0,286 (I1p) und 345 -0,150 (Known Flag), in T2 183 +0,391, '
      '156 +0,519, 448 +0,724 (bewusste Spitzen).')
print('KURVE BESCHLOSSEN (I1x/I1y): gerundet %.1f/%.1f | Ratio %.2fx | '
      'Bande relativ +-50 %% (T1 0,15-0,45, T2 0,25-0,75).'
      % (rounded['T1'], rounded['T2'], med['T2'] / med['T1']))

# validation.ok berechnen (wie die 230/219-Asserts): Soll-Tier-Mediane
# gegen die I1y-Pfad-A-Erwartung pruefen, damit das JSON bei Regler-
# Veraenderungen nicht weiterhin ok=true behaupten wuerde.
ok = abs(med['T1'] - 0.280) < 5e-4 and abs(med['T2'] - 0.505) < 5e-4

out_json = dict(
    frame='I1x Kurven-Ankerung + Outlier-Detection im Soll-Zustand '
          '(Projektion: I1w-Beschluesse als umgesetzt angenommen)',
    issue='chrthom/outer-colonies#815',
    model='MODELL v9, PI_PLAY 0,75, ALPHA_E 0,25 (I1y Pfad A); Re-Exec '
          'diag_infra_prices_r13i.py mit Buff-Overrides '
          '(230 E-1, 219 E-1/Psi-1)',
    swap={'to_R2': ['448', '183', '164'], 'to_R1': ['333', '435', '154'],
          'r2_r3': ['320<->413']},
    validation=dict(expected_T1=0.280, expected_T2=0.505,
                    expected_ratio=1.80,
                    i1x_anker_alpha_05=dict(T1=0.310, T2=0.505,
                                            ratio=1.63),
                    kurve_beschlossen=dict(T1=0.3, T2=0.5),
                    buff_scores=dict(id230=VAL['id230'],
                                     id219=VAL['id219']),
                    tier_median=med, ok=ok),
    curve_candidates=dict(anchor=med, rounded=rounded,
                          ratio=round(med['T2'] / med['T1'], 3)),
    band=dict(band_abs=BAND_ABS, band_rel=BAND_REL,
              beschluss='relativ (BAND_REL) BESCHLOSSEN (I1y): '
                        'T1 0,15-0,45, T2 0,25-0,75'),
    objects=rows,
    progression=PROG,
    outliers_rel={t: [dict(id=r['id'], delta=r['delta'])
                     for r in T[t] if r['flag_rel']] for t in TIERS},
    outliers_abs={t: [dict(id=r['id'], delta=r['delta'])
                     for r in T[t] if r['flag_abs']] for t in TIERS},
    known_flags=KNOWN,
    struktur_befund='Bei alpha 0,25 (I1y Pfad A) loest sich die I1x-'
                    'Bimodalitaet auf: Produzenten ruecken in die '
                    'Bande (185 0,280 = Median, 187/188 0,412), T1 '
                    'homogener (0,13-0,41); verbleibende REL-Outlier '
                    'nur bewusste Faelle: in T1 172 +0,286 (I1p), '
                    '345 -0,150 (Known Flag); in T2 183 +0,391, '
                    '156 +0,519, 448 +0,724 (bewusste Spitzen)',
)
json.dump(out_json, open(os.path.join(HERE, 'diag_infra_curve_r13i.json'),
                        'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print()
print('JSON: diag_infra_curve_r13i.json')
