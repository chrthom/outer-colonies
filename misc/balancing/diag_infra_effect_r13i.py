# ============================================================================
# diag_infra_effect_r13i.py — Infrastruktur-Balancing Runde I1aa
# KLASSISCHE OUTLIER-RUNDE: EFFEKT-Hebel (Regeln/Kartentexte, KEINE Preise)
# fuer die vier offenen Design-Faelle (alle preislich on-band bzw.
# Progressions-Fragen — deshalb Effekt-Diskussion statt Preis-Hebel):
#   333/435  M2-Multiplikatoren (2 Disziplinen-Trigger, P 0,234 vs
#            M(infra) 0,4375) — nach Down-Swap R1 on-band (0,238),
#            offene Design-Frage zur Trigger-Klasse (I1w/I1x)
#   413      M2-Kern + konditionale Aktion (nur Schiff mit Speed 1+),
#            R2 per Tausch, T2-Schlusslicht 0,279 (in Bande, an Kante)
#   169      PD-Nachfrage 4,3 % (Messbefund) vs Schild 27 % — nur
#            Regel-/Effekt-Hebel, kein Preis-Hebel (I1w)
#   105      Kapazitaet E+10 vs E+5, alpha-Wirklichkeit, R5-Progression
# Kontext (fixiert I1x-I1z): Kurve 0,3/0,5, Bande relativ +-50 %,
# PI_PLAY 0,75, ALPHA_E 0,25 (Pfad A).
# BESCHLUSS (12.11., Christopher): NICHTS UMSETZEN — alle vier Faelle
# bleiben Status quo / bewusst akzeptiert (333/435 on-band R1, 413 als
# T2-Schlusslicht in Bande, 169 on-band, 105 E+10); keine Karten-
# aenderungen, Issue #815 bleibt unveraendert. Die Varianten unten sind
# der messbare Hebel-Katalog fuer den Fall, dass der Playtest reopenpt.
# Methode: Re-Exec des v9 im SOLL-ZUSTAND (wie I1x: 230 E-1,
# 219 E-2/Psi-1 + Tier-Remap) mit M2-Trigger-Varianten (String-Replace
# der M2-Lambda, wirkt auf 333/435 UND den 413-Kern); 413/105 analytisch
# aus den Modell-Primitiven des Re-Exec-ns (pr/e_cost/soc_cost).
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
TMP = os.path.join(HERE, '.effect_out.tmp')

CURVE = {'T1': 0.3, 'T2': 0.5}   # BESCHLOSSEN (I1x/I1y)
BAND = 0.5                        # BESCHLOSSEN: relativ +-50 %
P_SPEED = 21 / 24                # 21/24 Huelle mit Speed >= 1 (I1u)

SWAP = {'448': (2, 'T2'), '183': (2, 'T2'), '164': (2, 'T2'),
        '333': (1, 'T1'), '435': (1, 'T1'), '154': (1, 'T1'),
        '320': (3, 'R3')}

M2_ORIG = ("        p['M2'] = lambda: ((1 - (1 - 2 * DISC) ** 2) "
           "* PI_PLAY * PV_DECK)")


def run_soll(m2_line=None):
    """v9-Soll-Lauf (230 E-1, 219 E-2/Psi-1) + optionale M2-Variante."""
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
    # --- M2-Trigger-Variante ---
    if m2_line is not None:
        assert M2_ORIG in s, 'M2-Lambda: Muster nicht gefunden'
        s = s.replace(M2_ORIG, m2_line)
    # Haupt-JSON der v9 nicht ueberschreiben:
    s = s.replace("json.dump(out, open('diag_infra_prices_r13i.json', "
                  "'w', encoding='utf-8'),",
                  "json.dump(out, open('" + TMP +
                  "', 'w', encoding='utf-8'),")
    ns = {'__file__': os.path.join(HERE, 'diag_infra_prices_r13i.py')}
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(s, 'effect_variant', 'exec'), ns)
    return ns


# ------------------------------------------------------ 413 analytisch ------
def score_413(ns, lever='L0'):
    """413 Dual-Score aus den Modell-Primitiven des Varianten-ns.

    L0: Status quo (Aktion nur an Schiff mit Speed 1+, P 21/24)
    L1: Speed-Klausel entfallen (Aktion immer an Schiff)
    L2: Aktion ortsunabhaengig (Schiff UND Kolonie, Speed-Klausel weg)
    """
    m2gain = ns['out']['prices']['M_2disc']       # M2-Kern (variante)
    a_disc = ns['out']['prices']['A_tact_disc']   # Aktion (Wirtschaft)
    u_ship = ns['soc_cost'](1) + ns['e_cost'](-2) + 1.0   # Psi-1, E-2, stat.
    u_kol = ns['e_cost_col'](-2) + 1.0                    # Psi frei, E-2 col
    if lever == 'L0':
        s_ship = (m2gain + a_disc * P_SPEED) / u_ship
        s_kol = m2gain / u_kol
    elif lever == 'L1':
        s_ship = (m2gain + a_disc) / u_ship
        s_kol = m2gain / u_kol
    elif lever == 'L2':
        s_ship = (m2gain + a_disc) / u_ship
        s_kol = (m2gain + a_disc) / u_kol
    else:
        raise ValueError(lever)
    return 0.5 * s_ship + 0.5 * s_kol


def tier_medians(ns, s413):
    """Soll-Tier-Mediane inkl. Remap + 413 (mit Varianten-Score)."""
    rows = []
    for e in ns['out']['objects']:
        r = dict(id=e['id'], tier=e['tier'], score=e['score'])
        if e['id'] in SWAP:
            r['tier'] = SWAP[e['id']][1]
        rows.append(r)
    rows.append(dict(id='413', tier='T2', score=s413))
    return {t: round(statistics.median(
        [r['score'] for r in rows if r['tier'] == t]), 3)
        for t in ('T1', 'T2')}


def in_band(score, tier):
    return abs(score - CURVE[tier]) <= BAND * CURVE[tier]


# ------------------------------------------------------------- Varianten ----
M2_VARIANTS = [
    ('status_quo', 'Status quo (2 Disziplinen)', None,
     lambda ns: 1 - (1 - 2 * ns['DISC']) ** 2),
    ('disc3', '3 Disziplinen', M2_ORIG.replace('2 * DISC', '3 * DISC'),
     lambda ns: 1 - (1 - 3 * ns['DISC']) ** 2),
    ('disc4', '4 Disziplinen (= alle)', M2_ORIG.replace('2 * DISC', '4 * DISC'),
     lambda ns: 1 - (1 - 4 * ns['DISC']) ** 2),
    ('infra', 'Infrastruktur-Trigger (230-Klon)',
     M2_ORIG.replace('(1 - 2 * DISC) ** 2',
                     "(1 - DECK['infrastructure']) ** 2"),
     lambda ns: 1 - (1 - ns['DECK']['infrastructure']) ** 2),
    ('pi_m2', 'separater pi_M2 = 1,0', M2_ORIG.replace('PI_PLAY', '1.0'),
     lambda ns: 1 - (1 - 2 * ns['DISC']) ** 2),
    ('draw2', 'Ziehung 2 Karten (drawCards(2))',
     M2_ORIG.replace('lambda: ((1', 'lambda: (2 * (1'),
     lambda ns: 1 - (1 - 2 * ns['DISC']) ** 2),
]

W = 108
print('=' * W)
print('I1aa KLASSISCHE OUTLIER-RUNDE: EFFEKT-HEBEL 333/435 (M2-Trigger), '
      '413 (konditionale Aktion), 169 (PD), 105 (Kapazitaet)')
print('=' * W)
print('Soll-Zustand (Projektion #815) | Kurve FIX 0,3/0,5 | Bande relativ '
      '+-50 % | PI 0,75 | ALPHA_E 0,25 (I1z Pfad A)')
print()

# ------------------------------------------------- Basis-Validierung --------
ns0 = run_soll()
objs0 = {e['id']: e for e in ns0['out']['objects']}
s413_base = score_413(ns0, 'L0')
med0 = tier_medians(ns0, s413_base)
print('Basis-Validierung: 230 = %.3f | 219 = %.3f | 333/435 = %.3f | '
      '413 (L0, live) = %.3f (I1v-Bracket 0,279, Delta %+.3f) | '
      'T1-Med %.3f / T2-Med %.3f'
      % (objs0['230']['score'], objs0['219']['score'],
         objs0['333']['score'], s413_base, s413_base - 0.279,
         med0['T1'], med0['T2']))
print()

# ------------------------------------- 1) M2-Klasse: 333/435 (+ 413-Kern) --
print('--- (1) M2-TRIGGER-KLASSE (333/435, nach Down-Swap R1 on-band; '
      'Kern teilt 413) ---')
print('%-34s %-8s %-8s %-9s %-9s %-8s %s'
      % ('Variante', 'P(Trig)', 'M2-Gain', '333/435', 'T1-Med',
         'Kurve?', 'Bande T1'))
m2_res = {}
for key, label, line, pfun in M2_VARIANTS:
    ns = ns0 if line is None else run_soll(line)
    objs = {e['id']: e for e in ns['out']['objects']}
    s333 = objs['333']['score']
    m2gain = ns['out']['prices']['M_2disc']
    med = tier_medians(ns, score_413(ns, 'L0'))
    ptrig = pfun(ns)
    m2_res[key] = dict(label=label, p_trigger=round(ptrig, 3),
                       m2_gain=round(m2gain, 3),
                       s333_s435=round(s333, 3),
                       s413_L0=round(score_413(ns, 'L0'), 3),
                       s413_L1=round(score_413(ns, 'L1'), 3),
                       s413_L2=round(score_413(ns, 'L2'), 3),
                       med=med)
    print('%-34s %-8.3f %-8.3f %-9.3f %-9.3f %-8s %s'
          % (label, ptrig, m2gain, s333, med['T1'],
             '0,3' if round(med['T1'], 1) == 0.3 else 'PRUEFEN',
             'IN' if in_band(s333, 'T1') else 'RAUS'))
print('  (413-Kern je Variante: L0 %.3f / L1 %.3f / L2 %.3f bei '
      'status_quo — s. Abschnitt 2; T2-Med in allen Varianten 0,505.)'
      % (m2_res['status_quo']['s413_L0'], m2_res['status_quo']['s413_L1'],
         m2_res['status_quo']['s413_L2']))
print()

# ------------------------------------------------ 2) 413 Aktions-Hebel ------
print('--- (2) 413 LOGISTIKKNOTENPUNKT (R2 per Tausch, T2-Schlusslicht): '
      'Aktions-Hebel ---')
print('%-44s %-9s %-9s %s'
      % ('Hebel (M2-Kern = Status quo 2 Disz.)', '413-Score',
         'T2-Delta', 'Bande T2 (0,25-0,75)'))
lever_res = {}
for lever, label in (('L0', 'L0 Status quo (nur Schiff, Speed 1+, 21/24)'),
                     ('L1', 'L1 Speed-Klausel entfallen'),
                     ('L2', 'L2 Aktion ortsunabhaengig (Schiff+Kolonie)')):
    s = score_413(ns0, lever)
    lever_res[lever] = dict(label=label, score=round(s, 3))
    print('%-44s %-9.3f %+-9.3f %s'
          % (label, s, s - CURVE['T2'],
             'IN' if in_band(s, 'T2') else 'RAUS'))
print('Kombination mit M2-3-Disziplinen (falls 333/435 mitgezogen):')
combo_res = {}
for key, label in (('disc3', 'L2 + 3 Disziplinen'),
                  ('pi_m2', 'L2 + pi_M2 1,0'),
                  ('disc4', 'L2 + 4 Disz./Infra-Trigger')):
    s = m2_res[key]['s413_L2']
    combo_res[key] = dict(label=label, score=s)
    print('  %-42s %-9.3f %s'
          % (label, s, 'IN' if in_band(s, 'T2') else 'RAUS'))
print('  (T2-Median bleibt in ALLEN 413-Hebeln 0,505 — Median-Paar '
      '336/219 unbeeinflusst, 413 bleibt unter/mitte Kern.)')
print()

# -------------------------------------------------------- 3) 169 PD --------
k169 = ns0['K']['169']
s169 = objs0['169']['score']
print('--- (3) 169 VERTEIDIGUNGSNETZ (R1, planetar, PD2 E0) ---')
print('  Modell-Score %.3f (Spur K gemessen, units 0 + stat. 1,0) — '
      'T1-Bande 0,15-0,45: %s'
      % (s169, 'IN' if in_band(s169, 'T1') else 'RAUS'))
print('  K-Messung: gain %.3f (score_k %.3f), PD-Nachfrage %.1f %% '
      'vs Schild 27 %% — Effekt bindet selten (Messbefund I1).'
      % (k169['gain'], k169['score_k'], 100 * k169['gain_share']))
print('  Kein Preis-Hebel (E0/units 0 ausgeschoepft); Regel-/Effekt-'
      'Hebel nur bei Playtest-Befund "PD irrelevant".')
print()

# ------------------------------------------------------- 4) 105 Kapazitaet --
E10 = ns0['pr']['E'](10)
E5 = ns0['pr']['E'](5)
C105 = ns0['soc_cost'](3) + 1.0        # Omega-3, kein E als Produzent
ALPHA = ns0['ALPHA_E']
print('--- (4) 105 ANTIMATERIEREAKTOR (R5, Omega-3, E+10) ---')
print('  P_E(10) = %.3f | P_E(5) = %.3f | Kosten (Omega-3 + stat.) '
      '= %.1f | Default-Alpha = %.2f' % (E10, E5, C105, ALPHA))
print('  %-34s %-9s %s'
      % ('Szenario', 'Score', 'Progression vs R3 320 (1,020) / R4 114 '
         '(0,598)'))
sc105 = []
for label, cap, alpha in [
        ('E+10, global alpha 0,25 (Default)', 10, ALPHA),
        ('E+10, size-dep. d=1 E/Runde', 10, 1 / 10),
        ('E+10, size-dep. d=2 E/Runde', 10, 2 / 10),
        ('E+10, size-dep. d=3 E/Runde', 10, 3 / 10),
        ('E+5, global alpha 0,25 (145-pari)', 5, ALPHA)]:
    s = (E10 if cap == 10 else E5) * alpha / C105
    sc105.append(dict(label=label, score=round(s, 3)))
    print('  %-34s %-9.3f %s'
          % (label, s, 'ueber R3' if s > 1.020 else 'unter R3'))
d_r3 = 10 * 1.020 * C105 / E10   # size-dep. alpha = d/10 -> d-Schwelle
print('  Schwelle: 105 >= R3-Niveau (1,020) erst ab d >= %.1f E/Runde '
      '(size-dep.) — der Kolonie-E-Nachfrage-Anker (3-8 E/PARTIE) '
      'deutet auf deutlich weniger; globaler alpha 0,25 (Pfad A) '
      'setzt d = 2,5 an. Zerstoerungseffekt (1 Schaden an alle '
      'Gefechtsschiffe) bleibt unbewertet (Spur K).' % d_r3)
print()

# ------------------------------------------------------------- Empfehlung --
print('VORSCHLAEGE (Mess-Katalog; BESCHLUSS 12.11.: NICHTS UMSETZEN — '
      'alle vier Faelle Status quo / bewusst akzeptiert):')
print('  (1) 333/435: STATUS QUO BEHALTEN — R1 on-band (0,238); die '
      'Disziplin-Paare sind Karten-Identitaet; M2 < M(infra) ist '
      'strukturell bewusst. Spieltest-Hebel dokumentiert: pi_M2 1,0 '
      '-> 0,317 (Kurve haelt, T1-Med 0,317 -> rundet 0,3). VERWORFEN: '
      'Ziehung 2 (0,475 rauscht aus der T1-Bande und ueberfluegelt '
      '230 als R1-Karte), 4-Disz./Infra-Trigger (230-Klon, '
      'Flavor-Verwässerung).')
print('  (2) 413: L2 EMPFEHLUNG (Aktion ortsunabhaengig, Speed-Klausel '
      'und Schiff-Only weg) -> 0,462: T2-Kern statt Schlusslicht, '
      'Bande komfortabel, Median 0,505 unberuehrt. Kartentext-Aenderung '
      '(conditional_tags/effect) gehoert zur #815-Umsetzung (neue '
      'Zeile im Issue). L1 allein (+0,011) zu schwach; Kombination mit '
      'M2-Hebeln nur falls (1) anders entschieden.')
print('  (3) 169: AKZEPTIEREN — on-band (0,204), PD-Design-Beobachtung '
      'dokumentiert; Regel-Hebel nur bei Playtest-Befund.')
print('  (4) 105: E+10 BEHALTEN — bei alpha 0,25 steht R5 mit 1,115 '
      'korrekt zwischen R2-Spitze (448 1,229) und R3 (320 1,020); '
      'E+5 (0,581) braeche die Progression unter R3. Playtest-Anker: '
      'E-Nachfrage je Runde messen (size-dep. alpha dokumentiert, '
      'I1o "kleinster verkauft zuerst").')

out_json = dict(
    frame='I1aa Klassische Outlier-Runde: Effekt-Hebel 333/435 (M2), '
          '413 (Aktion), 169 (PD), 105 (Kapazitaet) im Soll-Zustand '
          '(Projektion #815)',
    basis=dict(pi_play=ns0['PI_PLAY'], alpha_e=ALPHA, curve=CURVE,
               band=BAND, p_speed=round(P_SPEED, 3),
               tier_median=med0, s413_L0=round(s413_base, 3),
               s169=round(s169, 3), k169_gain=k169['gain'],
               pd_nachfrage=k169['gain_share']),
    m2_variants=m2_res,
    lever_413=lever_res,
    combos_413=combo_res,
    szenarien_105=dict(p_e10=round(E10, 3), p_e5=round(E5, 3),
                       kosten=round(C105, 2), d_schwelle_r3=round(d_r3, 2),
                       szenarien=sc105),
    vorschlaege=[
        '333/435 Status quo (pi_M2 1,0 als dokumentierter Spieltest-'
        'Hebel; Ziehung 2 und Trigger-Expansion verworfen)',
        '413 L2: Aktion ortsunabhaengig (0,462 in den T2-Kern; '
        'Kartentext-Aenderung als #815-Ergaenzung)',
        '169 akzeptieren (on-band, PD-Beobachtung dokumentiert)',
        '105 E+10 behalten (Progression bei alpha 0,25 korrekt; '
        'Playtest-Anker E-Nachfrage je Runde)',
    ],
    beschluss='NICHTS UMSETZEN (Christopher, 12.11.): Alle vier Faelle '
              'bleiben Status quo / bewusst akzeptiert — 333/435 '
              'on-band R1, 413 bleibt T2-Schlusslicht 0,281 (in '
              'Bande, bewusst), 169 on-band, 105 E+10; keine Karten-'
              'aenderungen, Issue #815 unveraendert; Varianten bleiben '
              'als Playtest-Reopen-Katalog dokumentiert',
)
json.dump(out_json, open(os.path.join(HERE, 'diag_infra_effect_r13i.json'),
                        'w', encoding='utf-8'), ensure_ascii=False,
          indent=1)
print()
print('JSON: diag_infra_effect_r13i.json')
