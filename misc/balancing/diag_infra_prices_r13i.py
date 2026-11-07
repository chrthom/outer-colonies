# ============================================================================
# diag_infra_prices_r13i.py — Infrastruktur-Balancing Runde I1, SPUR W
# Analytische Preisliste, MODELL v9 (I1r, 7.11.2026: Christophers
# DUAL-PROFIL-BESCHLUSS — "Die Sockel sind bei Anlage an die Kolonie
# egal, bei Anlage an ein Schiff nicht": Jede nicht-planetare Karte
# wird als ZWEI Profile je 50 % gewichtet, Schiff (Psi-Sockel in den
# Kosten, E-SCHIFFSkurs 1,0/0,7) und Kolonie (Psi frei, E-Kolonie-
# kurs); E-ORTSKURS Kolonie REDUZIERT auf 0,5/0,3 (Christophers Werte,
# ersetzte meinen 0,7/0,5-Vorschlag); P_planetar = 1,5 BESTAETIGT)
# — verallgemeinert die 239-Dualmessung (I1i) auf alle Dual-Karten —
# Grundlage fuer Christophers Glaettung
# ----------------------------------------------------------------------------
# Christophers Beschluesse/Regler bislang: P_E-Symmetriekurs FIXIERT ·
# P_planetar = 1,5 BESTAETIGT (I1r, war 2,5 I1b) · PI_PLAY = 0,75
# BESCHLOSSEN (I1w, 7.11., Playtest-Anker Extra-Ziehung -> zusaetzliche
# Ausspielung; war 0,5) · Tier-Inversion via paarierte Rarity-Swaps
# geloest (Umsetzung Issue #815) · ALPHA_E = 0,25 (I1y Pfad A, war 0,5
# I1o) · E-Ortskurs
# Kolonie 0,5/0,3
# (I1r, Christophers Werte; Playtest) · Dual-Profile 50/50 BESCHLOSSEN
# (I1r, generalisiert I1i) · Deck-Gleichverteilung 25 % BESCHLOSSEN
# (I1q) · 183 Code-Lesart BESCHLOSSEN (I1q).
#
# MODELL v3 — Aenderungen gegen v2 (alle aus dem 9-Punkte-Review):
# (1) FLOOR ENTFERNT: Null-Anforderungs-Karten haben units 0 (die statische
#     Spielkosten +1 im Score-Nenner ersetzt den 0,5-Floor; konsistent:
#     KEINE der 50 Waffen und KEINE der 19 Statkarten der offiziellen
#     v23i-Messung steht auf dem Floor — verified). Betroffen: 188
#     Solarpanele, 172 Ressourcensilo, 169 Verteidigungsnetz (K-Anteil).
# (2) AKTION NEU — Burst-Modell, Regel-verankert (Aktionslimit: 1 Karte je
#     Kartentyp pro Spielzug; Taktik: 1 gesamt pro Zug, Aktion ggf.
#     disziplinbeschraenkt; "+ = alle genannten Typen", "| = einer der
#     Typen", "Faktor wie 3x = um Faktor"). Das Basis-Limit bindet nur im
#     BURST (Mehrkarten-Schiffsbau braucht 3 Rumpfkarten, Ausruestungs-
#     Nachbestueckung, Taktik-Doppelzug): Die Extra-Aktion realisiert
#     sich nur, wenn >= 2 passende Karten auf der 7er Hand liegen:
#       b_X   = P(>=2 X in 7er Hand), Binomial mit Deck-Anteil s_X
#       A(X) = b_X * T_win * u_X * PV(X)     [je +1 Limit Typ X]
#         u_X = situationsbedingte Nutzbarkeit je Runde (I1g,
#         Christophers Beschluss): hull 1,0 (immer spielbar) ·
#         equipment 0,7 (Sockel-/Energieverfuegbarkeit, im Deck
#         fokussiert) · infra 0,8 (Kolonie fast immer, Schiff
#         eingeschraenkt; Blend — Kolonie-vs-Schiff-Trennung offen) ·
#         Taktik 0,8 (I1e verifiziert: Runde mit Gefecht ~100%, ohne
#         ~64%, Mischwert; Beschluss I1f "je Runde").
#         T_win = 1 FIXIERT (I1g, per-Runde-Frame): Huelle/Ausruestung/
#         Infra werden VOR dem Gefecht in der Aufbauphase gespielt —
#         keine Gefechtsfenster-Skalierung mehr; I1h AUS DER FORMEL
#         ENTFERNT (war nur noch Faktor 1,0).
#         — 0,8 ERGÄNZT den Burst, ersetzt ihn NICHT: Die Disziplin-
#         Beschraenkung bindet weiter ueber b_disc (Handverfuegbarkeit
#         passenden Materials), Fokus-Deck-Incentive bleibt erhalten
#         (Ratio b_focus/b_disc unveraendert, da multiplikativ).
#       A_n(X) = E[min(H-1, n)] * PV(X)    [Limit +n, 183: n=3]
#       Aktion Taktik-Disziplin d: b = P(>=2 Taktik) * P( surplus passt zu d )
#       flexibel X|Y (dynamische Wahl je Ausspielung):
#         A(X|Y) = a_X*A_X + (1-a_X)*a_Y*A_Y + phi*a_X*a_Y*A_alt  [phi=0,15]
#     T_win = 1 (Regler: Burst-Realisierungen je Gefechtsfenster — Obergrenze
#     ist das vom Typ-Limit gebundene Fenster; Spielzug-Anzahl je Gefecht
#     per Playtest klären).
# (3) PV(X): Ausruestung gemessen (Median-Raw-Gain v23i); Huelle/Taktik
#     Paritaet x PV_equip (offen bis hspec-/Taktik-Runde); Infra Fixed-Point
#     (Median der Infra-Raw-Gains, 154 exkludiert wg. Zirkularitaet).
# (4) MULTIPLIKATOR NEU — Regel-verankert (Regeln: "zu Rundenbeginn gezogene
#     Karte des genannten Typs -> 1 Extra-Karte; stapelbar"): erwartete
#     Extra-Ziehungen je Runde = 2 * s_X (2 Karten zu Rundenbeginn, nur
#     X-Ziehungen triggern; konservativ ohne Kette).
#       M(X) = 2 * s_X * pi_play * PV(X)   [pi_play = 0,75 Regler (Beschluss
#     I1w, war 0,5): Anteil der
#     Extra-Ziehungen, der vor Spielende in zusaetzliche Ausspielungen
#     muendet — Rest = Tempo-Verschiebung/Verlust bei Erschoepfung]
# (5) Handlimit: H(+1) = h_limit * PV_equip, h_limit = 0,12 (Regler).
# (6) 239 am SCHIFF (Psi + E-Kosten in units; Aktion wirkt global, ctrl nur
#     dort); Produzenten zahlen keine E-Kosten (E+ = Ertrag im Gain);
#     planetar: units += P_planetar = 1,5.
#
# Offene Punkte an Christopher (I1c): T_win-Magnitude, pi_play, phi,
# PV-Paritaeten (Huelle/Taktik/Infra — bestimmt auch 154-vs-148),
# Burst-Modell vs. einfache Verdopplung, P_planetar-Konsistenzfrage
# (Kolonie-Vorteile gelten fuer ALLE Kolonieplatzierungen, Zuschlag bislang
# nur Tag "Planetar").
# ============================================================================
import json
import os
import statistics
from math import comb

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)

# ---------------------------------------------------------------- Regler ---
P_PLANETAR = 1.5     # BESTAETIGT I1r (war 2,5 I1b; Christophers "beim
                    # 1,5 belassen" nach v8-Durchsicht; Sockel-\
                    # Aequivalenz 1,0 + Sicherheitspraemie 0,5; Cross-\
                    # Anker Kraftwerk==Atomreaktor bei P_planetar 0,7\
                    # (Sweep-Gesetz P = E1 + 4*SUB - 1 mit E-Kurs\
                    # 0,5/0,3, I1s; 1,7 galt nur fuer den I1q-Kurs\
                    # 0,7/0,5); Playtest-kalibrierbar)
# T_win ENTFERNT (I1h, Christophers Rueckfrage): war seit I1g nur noch
# Faktor 1,0 — Huelle/Ausruestung/Infra werden VOR dem Gefecht gespielt,
# Wertung je Runde; keine Gefechtsfenster-Skalierung mehr im Modell.
U = {'hull': 1.0, 'equipment': 0.8, 'infrastructure': 0.8, 'tactic': 0.8}
# u_X = Nutzbarkeit je Runde (Christophers Beschluesse I1g + I1h):
# Huelle immer spielbar (1,0); Ausruestung 0,8 (Sockel-/Energie-
# verfuegbarkeit, im Deck fokussiert, z.B. Delta-Sockel; I1h von 0,7
# angehoben — "dann sind sie alle mehr oder weniger gleich"); Infra 0,8
# (Kolonie fast immer wegen unbegrenzter Sockel + Kraftwerks-Energie,
# Schiff eingeschraenkt — Blend, Kolonie-vs-Schiff-Trennung offen/
# Playtest); Taktik 0,8 (I1f, I1e-verifiziert). u ERGAENZT den Burst
# (s.o.), ersetzt ihn NICHT: Die Disziplin-Beschraenkung bindet weiter
# ueber b_disc (Handverfuegbarkeit), Fokus-Deck-Incentive bleibt.
PI_PLAY = 0.75       # Extra-Ziehung -> zusaetzliche Ausspielung (Beschluss
                     # I1w, 7.11.; war 0,5; Playtest-Anker)
PHI_FLEX = 0.15      # Optionswert flexible Auswahl "|"-Form (Regler)
H_LIMIT = 0.12       # Optionwert +1 Handkarte (x PV_equip)
SUB_E = 0.7          # degressiver E-Kurs (FIXIERT, Spiegel Einsatzkosten v3)
SUB_SOC_CHEAP = 0.5  # 2. billiger Sockel (Omega), wie Einsatzkosten v3
PV_PARITY = {'hull': 1.0, 'tactic': 1.0}   # x PV_equip, bis hspec/Taktik
E_DEMAND_W = {0: 32, 1: 16, 2: 8}
# ALPHA_E (I1n-Befund -> I1o-Beschluss Option A): Absorptions-Regler auf die
# E-Produzenten-Gains. Energie war der EINZIGE Gain ohne Realisierungs-
# faktor (Aktionen: b x u = 0,13-0,73; Multiplikatoren: pi_play 0,75;
# Spur K: Szenario-Mix) — Produzenten-Scores waren Obergrenzen am
# Volllast-Absatz. Christophers Playtest-Wahrnehmung ("Aktionskarten stark,
# E-Karten dominieren das Modell") + Nachfrage-Anker (~3-8 E/Partie vs.
# Kraftwerk E+5 JE RUNDE) reaktivieren den in I1b geparkten Regler.
# Kurs je Punkt bleibt 1,65/1,155 (I1l/I1m-kalibriert, Spiegel zur
# Verbraucher-Belastung intakt); ALPHA_E dämpft nur die MENGE (Anteil der
# E-Punkte mit Abnehmer je Runde). Playtest misst: Nachfrage je Runde /
# Kapazitaet, ggf. groessenabhaengig je Produzent (kleinster zuerst).
# I1y-BESCHLUSS PFAD A (7.11.): ALPHA_E 0,25 — deckt 187/188/185/145
# in der Tier-Bande (Kurve 0,3/0,5, Bande relativ +-50 %); 448/156/183
# bleiben bewusste Tier-Spitzen. Roh-Median T1 sinkt 0,310 -> 0,280,
# gerundete Kurve 0,3 bleibt gueltig, T2 0,505 haelt (Median-Paar 336/
# 219). ALPHA_E bleibt Playtest-Regler.
ALPHA_E = 0.25       # I1y-Beschluss Pfad A (war 0,5; I1n-Sensitivitaet)
# E-ORTSKURS (I1q eingefuehrt mit 0,7/0, I1r REDUZIERT auf 0,5/0,3 —
# Christophers Werte: "E-Wert Kolonie weiter reduzieren (0,5 und 0,3)"):
# Die E-Pools sind getrennt (Schiffe: eigene Reaktoren; Kolonie: eigener
# Grid), die offizielle Waffen-Kalibrierung sitzt auf den SCHIFF-
# Einsatzkosten, ein Kolonie-Kurs beruehrt die Zielkurve also nicht.
# 0,5/0,3 unterbietet bewusst den billigen Sockelkurs (Omega 0,7/0,5):
# Energie ist an der Kolonie (Solar/Geothermie) am guenstigsten.
# Konsistenz (I1p-Bedingung a): Kolonie-Produzenten (185, 345) verdienen
# den Kolonie-SPIEGEL; Schiff-Produzenten (187/188/145) behalten den
# Schiffskurs. Playtest-Regler; Interaktion mit ALPHA_E dokumentiert.
E1_COL = 0.5        # 1. E-Punkt an der Kolonie (I1r, Christophers Werte)
SUB_E_COL = 0.3      # jede weitere (I1r), Degression wie v3

# ------------------------------------------- Deck-Anteile (I1q, Christophers
# Beschluss): GLEICHVERTEILUNG 25 % je Kartentyp (Huelle/Ausruestung/
# Infra/Taktik) — "Decks werden vom Spieler gestaltet; leichte Abweichung
# davon ist taktisches Kalkuel, Gleichverteilung zur Kalkulation ist
# sauberer." Ersetzt den Starter-Deck-Mix (0,294/0,356/0,172/0,178) als
# Default-Anker; Starter-Mix als Sensitivitaets-Linie ausgewiesen.
DECK = {'hull': 0.25, 'equipment': 0.25,
        'infrastructure': 0.25, 'tactic': 0.25}
DECK_STARTER = {'hull': (16 + 19 + 18) / 180,
                'equipment': (21 + 21 + 22) / 180,
                'infrastructure': (11 + 9 + 11) / 180,
                'tactic': (12 + 11 + 9) / 180}
DISC = DECK['tactic'] / 4          # Annahme: Disziplinen je 1/4 (Regler)

# ---------------------------------------------------------- Datenanker -----
v11 = __import__('balancing_metric_v11')
v10 = __import__('balancing_metric_v10')

fc = json.load(open('diag_v23i_r13t.json', encoding='utf-8'))
rows = fc['rows']
units_of = {}
for r in rows:
    if r['kind'] == 'w':
        w = next(w for w in v11.weapons if w['id'] == r['id'])
        units_of[r['id']] = v11.weapon_units(w)
    else:
        c = next(c for c in v11.cards if c['id'] == r['id'])
        units_of[r['id']] = c['units']
RW = v10.RARITY_W


def rw_median(pairs):
    pairs = sorted(pairs)
    wtot = sum(RW[r] for _, r in pairs)
    acc = 0.0
    for v, r in pairs:
        acc += RW[r]
        if acc >= wtot / 2:
            return v
    return pairs[-1][0]


c_ex = rw_median([(r['score'], r['rarity']) for r in rows])
pv_equip = rw_median([(r['score'] * (units_of[r['id']] + 1), r['rarity'])
                      for r in rows])

# ------------------------------------------------- Burst-Konversionen -----
def p_ge2(s, hand=7):
    """P(>=2 Karten vom Deck-Anteil s in der hand-Karten-Hand), Binomial."""
    q = (1 - s) ** hand
    p1 = hand * s * (1 - s) ** (hand - 1)
    return 1 - q - p1


def e_extra(s, n, hand=7):
    """E[min(H-1, n) | H ~ Binomial(hand, s)] — fuer Limit +n (Faktor)."""
    tot = 0.0
    for h in range(2, hand + 1):
        p = comb(hand, h) * s ** h * (1 - s) ** (hand - h)
        tot += p * min(h - 1, n)
    return tot


B2 = {k: p_ge2(v) for k, v in DECK.items()}
B_TACT = B2['tactic']
# Disziplin-Burst: >=2 Taktiken UND mindestens eine ueberzaehlige passt zur
# Disziplin (2er-Naeherung: P(>=1 d | genau 2 Taktiken) = 1-(1-1/4)^2)
B_DISC1 = B_TACT * (1 - 0.75 ** 2)           # 1 Disziplin
B_DISC2 = B_TACT * (1 - 0.50 ** 2)           # 2 Disziplinen ("+")

# ------------------------------------------------------------- Objekte -----
def e_cost(e):
    e = int(e)
    return 0 if e > -1 else 1 + SUB_E * (-e - 1)


def e_cost_col(e):
    """E-Kosten an der KOLONIE (I1r E-Ortskurs 0,5/0,3, Christophers
    Werte; Schiffskurs 1,0/0,7 unveraendert fuer offizielle
    Waffen-Kalibrierung und Schiff-Karten)."""
    e = int(e)
    return 0 if e > -1 else E1_COL + SUB_E_COL * (-e - 1)


def soc_cost(n, cheap=True):
    n = int(n)
    if n <= 0:
        return 0
    first, rest = (0.7, SUB_SOC_CHEAP) if cheap else (1.0, 0.7)
    return first + rest * (n - 1)


K = {c['id']: c for c in json.load(open('diag_infra_r13i.json',
                                        encoding='utf-8'))['cards']}
KRAW = {i: K[i]['gain'] for i in K}

OBJ = []


def obj(i, title, rarity, tier, units, kind, payload, kraw=0.0, place='',
        note='', units2=None, kraw2=0.0):
    # units2/kraw2: DUAL-Messung (I1i) — 50 % Platz A (units, kraw) /
    # 50 % Platz B (units2, kraw2); Score = Mittel der Zweig-Scores.
    OBJ.append(dict(id=i, title=title, rarity=rarity, tier=tier,
                    units=units, kind=kind, payload=payload, kraw=kraw,
                    place=place, note=note, units2=units2, kraw2=kraw2))


# Schiff-Sockelkosten fuer die Dual-Profile (I1r, Christophers Beschluss):
# Psi-1 -> 1,0 / Psi-2 -> 1,7 (Normal-Kurs, soc_cost cheap=False).
SHIP_P1 = soc_cost(1, cheap=False)   # = 1.0
SHIP_P2 = soc_cost(2, cheap=False)   # = 1.7
# KONVENTION der Dual-Profile (I1r, verallgemeinert I1i):
#   units  = SCHIFF-Profil  (Psi-Sockel + E zum Schiffskurs 1,0/0,7)
#   units2 = KOLONIE-Profil (Psi frei    + E zum Koloniekurs 0,5/0,3)
#   Score = 0,5 x Schiff-Score + 0,5 x Kolonie-Score (je 50 % Wichtung).


# --- Tier 1 (R0+R1) ---
obj('185', 'Kraftwerk (r0 x5)', 0, 'T1', P_PLANETAR, 'Ec', 5,
    place='Kolonie (planetar)',
    note='E+5; KOLONIE-Ortskurs 0,5/0,3 (I1r, Christophers Werte); '
         'Saettigungs-Kandidat -> ALPHA_E-Bewertung (I1n/I1o), '
         'Nachfrage-Anker ~3-8 E/Partie')
obj('187', 'Atomreaktor (r0 x5)', 0, 'T1', soc_cost(1), 'E', 2,
    place='Schiff (Omega-1)',
    note='E+2; mit Solarpanele exakt pari (Spiegel-Konstruktion)')
obj('188', 'Solarpanele (r0 x4)', 0, 'T1', 0.0, 'E', 1,
    place='Schiff (sockelfrei)',
    note='E+1; Floor entfallen (I1c) -> units 0')
obj('448', 'Schildkuppel', 1, 'T1', e_cost_col(-1), 'K', None,
    kraw=KRAW['448'],
    place='Kolonie (planetar)',
    note='S1 E-1 (Kolonie-Kurs); schuetzt NUR die Kolonie (Regelergaenzung)')
obj('169', 'Verteidigungsnetz', 1, 'T1', 0.0, 'K', None, kraw=KRAW['169'],
    place='Kolonie (planetar)',
    note='PD2 E0; Floor entfallen -> units 0; schwach wegen PD-Nachfrage 4,3 %')
obj('183', 'Industriekomplex', 1, 'T1', e_cost_col(-5) + P_PLANETAR, 'A3',
    None,
    place='Kolonie (planetar)',
    note='Code-Lesart (I1q, beschlossen): je +1 Ausruestung/Infra/Huelle, '
         'E-5 Kolonie-Kurs; CSV-Tag-Fix als PR eingereicht (hull|hull|hull '
         'war falsch)')
obj('164', 'Ruestungsschmiede', 1, 'T1', SHIP_P1 + e_cost(-2), 'A',
    'equipment', units2=e_cost_col(-2),
    place='50 % Schiff (Psi-1, E-Schiffskurs) / 50 % Kolonie '
          '(Psi frei, E-Koloniekurs)',
    note='DUAL I1r: Schiff Psi-1 + E-2 Schiffskurs / Kolonie Psi frei '
         '+ E-2 Koloniekurs; Gain ortsunabhaengig')
obj('345', 'Autonomer Stuetzpunkt', 1, 'T1', P_PLANETAR, 'Ec', 1,
    kraw=KRAW['345'], place='Kolonie (planetar)',
    note='E+1 planetar (Kolonie-Kurs) + PD1 (K-Anteil)')
obj('172', 'Ressourcensilo', 1, 'T1', SHIP_P1, 'H', 2, units2=0.0,
    place='50 % Schiff (Psi-1) / 50 % Kolonie (Psi frei)',
    note='+2 Handlimit, E0; DUAL I1r: Schiff Psi-1 / Kolonie Psi frei; '
         'Floor entfallen -> units 0')
obj('239', 'Horchposten', 1, 'T1', soc_cost(1, cheap=False) + e_cost(-2),
    'A', ('tactic_disc', 1), kraw=KRAW['239'],
    units2=e_cost_col(-2), kraw2=0.0,
    place='50 % Schiff (Psi-1, ctrl) / 50 % Kolonie (Psi frei)',
    note='Aktion Info (global); DUAL I1i, durch I1r generalisiert: '
         '50 % Schiff (ctrl 1 relevant, Gefechtssim, Psi-1 + E-2 '
         'Schiffskurs) + 50 % Kolonie (Psi frei, E-2 Koloniekurs, '
         'ctrl verfaellt, kein K)')
obj('238', 'Schmugglernest', 1, 'T1', P_PLANETAR, 'H', 1, kraw=KRAW['238'],
    place='Kolonie (planetar)',
    note='+1 Handlimit planetar + PD1 (K-Anteil)')

# --- Tier 2 (R2) ---
obj('145', 'Fusionsreaktor', 2, 'T2', soc_cost(2), 'E', 4,
    place='Schiff (Omega-2)', note='E+4')
obj('156', 'Planetarer Schild', 2, 'T2', e_cost_col(-2), 'K', None,
    kraw=KRAW['156'],
    place='Kolonie (planetar)',
    note='S1 E-2 (Kolonie-Kurs); schuetzt auch andere Karten der Koloniezone '
         '(Regelergaenzung, unbezahlt)')
obj('135', 'Schiffswerft', 2, 'T2', SHIP_P1 + e_cost(-2), 'A', 'hull',
    units2=e_cost_col(-2),
    place='50 % Schiff (Psi-1, E-Schiffskurs) / 50 % Kolonie '
          '(Psi frei, E-Koloniekurs)',
    note='Aktion hull, E-2; DUAL I1r (Gain ortsunabhaengig)')
obj('320', 'Legierungsgiesserei', 2, 'T2', SHIP_P1 + e_cost(-3),
    'A_flex', ('hull', 'equipment'), units2=e_cost_col(-3),
    place='50 % Schiff (Psi-1, E-Schiffskurs) / 50 % Kolonie '
          '(Psi frei, E-Koloniekurs)',
    note='Aktion hull|equipment (dynamische Wahl) + Optionswert phi; '
         'DUAL I1r')
obj('336', 'Militaerakademie', 2, 'T2', SHIP_P1 + e_cost(-2), 'A2d', 2,
    units2=e_cost_col(-2),
    place='50 % Schiff (Psi-1, E-Schiffskurs) / 50 % Kolonie '
          '(Psi frei, E-Koloniekurs)',
    note='Aktion Militaer + Wissenschaft ("+" = je Disziplin +1); '
         'DUAL I1r')
obj('219', 'Freihaendlerkontor', 2, 'T2', SHIP_P2 + e_cost(-3), 'A2d', 2,
    units2=e_cost_col(-3),
    place='50 % Schiff (Psi-2, E-Schiffskurs) / 50 % Kolonie '
          '(Psi frei, E-Koloniekurs)',
    note='Aktion Info + Wirtschaft; E-3/Psi-2 -> strikt teurer als 336 '
         '(Outlier-Hebel E-3->-2); DUAL I1r: Schiff Psi-2 = 1,7 Socket')
obj('137', 'Rechenzentrum', 2, 'T2', SHIP_P1 + e_cost(-1), 'A',
    ('tactic_disc', 1), units2=e_cost_col(-1),
    place='50 % Schiff (Psi-1, E-Schiffskurs) / 50 % Kolonie '
          '(Psi frei, E-Koloniekurs)',
    note='Aktion Information (disziplinbeschraenkt); DUAL I1r')
obj('138', 'Handelsunternehmen', 2, 'T2', SHIP_P1 + e_cost(-1), 'A',
    ('tactic_disc', 1), units2=e_cost_col(-1),
    place='50 % Schiff (Psi-1, E-Schiffskurs) / 50 % Kolonie '
          '(Psi frei, E-Koloniekurs)',
    note='Aktion Wirtschaft; DUAL I1r')
obj('147', 'Kommandozentrale', 2, 'T2', SHIP_P1 + e_cost(-1), 'A',
    ('tactic_disc', 1), units2=e_cost_col(-1),
    place='50 % Schiff (Psi-1, E-Schiffskurs) / 50 % Kolonie '
          '(Psi frei, E-Koloniekurs)',
    note='Aktion Militaer; DUAL I1r')
obj('148', 'Forschungslabor', 2, 'T2', SHIP_P1 + e_cost(-1), 'A',
    ('tactic_disc', 1), units2=e_cost_col(-1),
    place='50 % Schiff (Psi-1, E-Schiffskurs) / 50 % Kolonie '
          '(Psi frei, E-Koloniekurs)',
    note='Aktion Wissenschaft; DUAL I1r')
obj('154', 'Bergbauaussenposten', 2, 'T2', SHIP_P1 + e_cost(-1), 'A',
    'infrastructure', units2=e_cost_col(-1),
    place='50 % Schiff (Psi-1, E-Schiffskurs) / 50 % Kolonie '
          '(Psi frei, E-Koloniekurs)',
    note='Aktion infra; Wert < Aktion Taktik, weil PV(infra) < PV(taktik); '
         'DUAL I1r')
obj('230', 'Verwaltungsbueros', 2, 'T2', SHIP_P2 + e_cost(-2), 'M',
    'infrastructure', units2=e_cost_col(-2),
    place='50 % Schiff (Psi-2, E-Schiffskurs) / 50 % Kolonie '
          '(Psi frei, E-Koloniekurs)',
    note='Multiplikator infra (Rundenbeginn-Ziehung), E-2; DUAL I1r: '
         'Schiff Psi-2 = 1,7 Socket')
obj('333', 'Marsianisches Konsulat', 2, 'T2', SHIP_P1 + e_cost(-1),
    'M2', None, units2=e_cost_col(-1),
    place='50 % Schiff (Psi-1, E-Schiffskurs) / 50 % Kolonie '
          '(Psi frei, E-Koloniekurs)',
    note='Multiplikator Info+Militaer, E-1; DUAL I1r')
obj('435', 'Gewerbegebiet', 2, 'T2', SHIP_P1 + e_cost(-1), 'M2', None,
    units2=e_cost_col(-1),
    place='50 % Schiff (Psi-1, E-Schiffskurs) / 50 % Kolonie '
          '(Psi frei, E-Koloniekurs)',
    note='Multiplikator Wirtschaft+Wissenschaft, E-1; DUAL I1r')

# --------------------------------------------------- PV(infra)-Fixpunkt ----
def run():
    """Fixpunkt + Auswertung fuer ein T_win-Szenario."""
    def prices_t(pv_infra):
        pv = {'equipment': pv_equip,
              'hull': pv_equip * PV_PARITY['hull'],
              'tactic': pv_equip * PV_PARITY['tactic'],
              'infrastructure': pv_infra}
        p = {}
        p['E'] = lambda n: c_ex * (1.0 + SUB_E * (n - 1)) if n >= 1 else 0.0
        p['E_col'] = lambda n: (c_ex * (E1_COL + SUB_E_COL * (n - 1))
                               if n >= 1 else 0.0)

        def a_gain(kind, payload):
            if kind == 'A':
                if isinstance(payload, tuple):
                    return B_DISC1 * U['tactic'] * pv['tactic']
                return B2[payload] * U[payload] * pv[payload]
            if kind == 'A2d':
                return 2 * B_DISC1 * U['tactic'] * pv['tactic']
            if kind == 'A3':
                # 183 Code-Lesart (I1q): je +1 Ausruestung/Infra/Huelle
                return (a_gain('A', 'equipment')
                        + a_gain('A', 'infrastructure')
                        + a_gain('A', 'hull'))
            if kind == 'A_f':
                return (e_extra(DECK['hull'], payload) * U['hull']
                        * pv['hull'])
            if kind == 'A_flex':
                x, y = payload
                b_union = B2[x] + B2[y] - B2[x] * B2[y]
                u_flex = 1 - (1 - U[x]) * (1 - U[y])
                return (b_union * max(pv[x], pv[y]) * (1 + PHI_FLEX)
                        * u_flex)
            raise ValueError(kind)
        p['a_gain'] = a_gain
        # I1p-Codeverifikation (card.ts additionalCardWhenDrawing,
        # match.ts prepareStartPhase, rules.ts cardsToDrawPerTurn = 2):
        # Trigger = P(>=1 passende unter den 2 Rundenbeginn-Ziehungen) =
        # 1-(1-s)^2 — NICHT 2s je Ziehung; Auszahlung = GENAU 1 Extra-Karte
        # (drawCards(1), kein Stacking je gezogener Karte); die Extra-Karte
        # ist eine ZUFALLSKARTE aus dem Deck -> Wert PV_DECK (gewichteter
        # Deck-Median), nicht PV des Trigger-Typs. Ketten sind im Code
        # real (getDrawnCards = hand.slice(-2) sieht Extra-Karten
        # nachfolgender Multiplikatoren derselben onStartTurn-Kette,
        # Reihenfolge-abhaengig) -> Playtest/Sim-Verfeinerung, Basis ohne.
        PV_DECK = sum(DECK[t] * pv[t] for t in DECK)
        p['M'] = lambda x: ((1 - (1 - DECK[x]) ** 2) * PI_PLAY * PV_DECK)
        p['M2'] = lambda: ((1 - (1 - 2 * DISC) ** 2) * PI_PLAY * PV_DECK)
        p['H'] = lambda n: n * H_LIMIT * pv_equip
        return p

    def evaluate_t(pv_infra, alpha=ALPHA_E):
        p = prices_t(pv_infra)
        out = []
        for o in OBJ:
            k, pl = o['kind'], o['payload']
            if k == 'E':
                gain = p['E'](pl) * alpha + o['kraw']
                calc = 'P_E(%d) x a = %.3f' % (pl, gain - o['kraw'])
                if o['kraw']:
                    calc += ' + K %.3f' % o['kraw']
            elif k == 'Ec':
                gain = p['E_col'](pl) * alpha + o['kraw']
                calc = 'P_E_col(%d) x a = %.3f' % (pl, gain - o['kraw'])
                if o['kraw']:
                    calc += ' + K %.3f' % o['kraw']
            elif k == 'K':
                gain = o['kraw']
                calc = 'Spur K gemessen (ispec) = %.3f' % gain
            elif k in ('A', 'A_f', 'A_flex', 'A2d', 'A3'):
                gain = p['a_gain'](k, pl) + o['kraw']
                calc = 'Aktion = %.3f' % (gain - o['kraw'])
                if o['kraw']:
                    calc += ' + K %.3f' % o['kraw']
            elif k == 'M':
                gain = p['M'](pl) + o['kraw']
                calc = 'M(%s) = %.3f' % (pl, gain - o['kraw'])
            elif k == 'M2':
                gain = p['M2']() + o['kraw']
                calc = 'M(2 Disz.) = %.3f' % (gain - o['kraw'])
            elif k == 'H':
                gain = p['H'](pl) + o['kraw']
                calc = '%dxH = %.3f' % (pl, gain - o['kraw'])
                if o['kraw']:
                    calc += ' + K %.3f' % o['kraw']
            if o.get('units2') is not None:
                # DUAL (I1i): erwarteter Score = Mittel der Zweig-Scores
                # (Erwartungswert des Quotienten, nicht Quotient der MW)
                gain2 = gain - o['kraw'] + o['kraw2']
                s_a = gain / (o['units'] + 1.0)
                s_b = gain2 / (o['units2'] + 1.0)
                calc += ' | Dual 50/50: Schiff %.3f + Kolonie %.3f' % (s_a, s_b)
                out.append(dict(o,
                                units=round(0.5 * o['units']
                                            + 0.5 * o['units2'], 2),
                                gain=round(0.5 * gain + 0.5 * gain2, 3),
                                calc=calc, score=round(0.5 * s_a
                                                      + 0.5 * s_b, 3)))
                continue
            out.append(dict(o, gain=round(gain, 3), calc=calc,
                            score=round(gain / (o['units'] + 1.0), 3)))
        return out

    pv_infra = pv_equip
    for _ in range(8):
        # Fixpunkt auf UNGEDAEMPFTEN Gains (alpha=1): ALPHA_E wirkt nur
        # lokal auf die Produzenten-Gains des Endergebnisses — PV_infra
        # als "Wert einer gespielten Infra-Karte" bleibt v6-identisch
        # (Beschluss I1o Option A; post-alpha-Fixpunkt wuerde PV_infra
        # auf 0,825 druecken und Aktion/Multiplikator-Infra zusaetzlich
        # schwaechen, entgegen Christophers Playtest-Wahrnehmung).
        ev = [e for e in evaluate_t(pv_infra, alpha=1.0)
              if e['id'] != '154']
        new = rw_median([(e['gain'], e['rarity']) for e in ev])
        if abs(new - pv_infra) < 1e-6:
            break
        pv_infra = new
    return evaluate_t(pv_infra), pv_infra, prices_t(pv_infra)


EV, pv_infra, pr = run()

# -------------------------------------------------------------- Ausgabe ----
print('=' * 108)
print('SPUR W — PREISLISTE MODELL v9 (I1r: DUAL-PROFILE 50/50 '
      'SCHIFF/KOLONIE (Christophers Beschluss) — Psi-Sockel + E-'
      'Schiffskurs nur im Schiff-Zweig; E-ORTSKURS Kolonie 0,5/0,3 '
      '(Christophers Werte); P_planetar 1,5 BESTAETIGT; I1q: Deck-'
      'Gleichverteilung 25 %% je Typ, 183 Code-Lesart je +1 E/I/H; '
      'I1o: ALPHA_E = %.2f; I1h: u: hull 1,0 / equip 0,8 / infra 0,8 / '
      'tactic 0,8)' % ALPHA_E)
print('=' * 108)
print()
print('Datenanker (v23i, rarity-gewichtet): c_ex = %.3f | PV_equip = %.3f | '
      'PV_infra (Fixpunkt) = %.3f' % (c_ex, pv_equip, pv_infra))
print('Deck: hull %.3f | equip %.3f | infra %.3f | tactic %.3f (Disz. je %.3f)'
      % (DECK['hull'], DECK['equipment'], DECK['infrastructure'],
         DECK['tactic'], DISC))
print()
print('Burst-Konversionen b_X = P(>=2 X in 7er Hand): hull %.3f | equip %.3f '
      '| tactic %.3f | infra %.3f | Taktik-Disz. 1/2: %.3f / %.3f'
      % (B2['hull'], B2['equipment'], B2['tactic'], B2['infrastructure'],
         B_DISC1, B_DISC2))
# (Label-Fix I1f: vorher standen tactic/infra vertauscht in dieser Zeile;
#  Berechnungen/JSON waren immer korrekt, da dict-keys.)
# (183-Modell E[min(H-1,3)] obsolet seit I1q: Code-Lesart je +1 E/I/H
#  beschlossen; e_extra() nur noch historisch fuer A_f-Branch.)
print()
# pr kommt aus run() (prices_t mit iteriertem Fixpunkt)

print('Gueterpreise (je Runde, T_win ENTFERLEN; u: hull %.1f, '
      'equip %.1f, infra %.1f, tactic %.1f):'
      % (U['hull'], U['equipment'], U['infrastructure'], U['tactic']))
print('  P_E(1) = %.3f | P_E(2) = %.3f | P_E(4) = %.3f | P_E(5) = %.3f '
      '(Schiff-Kurs; Produzenten-Gains x ALPHA_E = %.2f)'
      % (pr['E'](1), pr['E'](2), pr['E'](4), pr['E'](5), ALPHA_E))
print('  P_E_col(1) = %.3f | P_E_col(2) = %.3f | P_E_col(5) = %.3f '
      '(KOLONIE-Ortskurs %.1f/%.1f, I1r Christophers Werte: billiger '
      'als Schiff und als Sockelkurs; senkt Kosten Infra-Karten an '
      'der Kolonie)'
      % (pr['E_col'](1), pr['E_col'](2), pr['E_col'](5), E1_COL, SUB_E_COL))
print('  A(hull) = %.3f | A(equipment) = %.3f | A(taktik 1 Disz.) = %.3f | '
      'A(2 Disz. je +1) = %.3f'
      % (B2['hull'] * U['hull'] * pv_equip,
         B2['equipment'] * U['equipment'] * pv_equip,
         B_DISC1 * U['tactic'] * pv_equip,
         2 * B_DISC1 * U['tactic'] * pv_equip))
print('  A(infra) = %.3f | A(hull|equip flexibel) = %.3f | '
      'A(183: E+I+H je +1) = %.3f'
      % (B2['infrastructure'] * U['infrastructure'] * pv_infra,
         pr['a_gain']('A_flex', ('hull', 'equipment')),
         pr['a_gain']('A3', None)))
print('  M(infra) = %.3f | M(2 Taktik-Disz.) = %.3f | H(+1) = %.3f | '
      'P_planetar = %.2f'
      % (pr['M']('infrastructure'), pr['M2'](), pr['H'](1), P_PLANETAR))
print()
print('-' * 108)
print('%-4s %-24s %-3s %-3s %6s %8s %8s  %-24s %s'
      % ('id', 'Karte', 'R', 'T', 'Kosten', 'Gain', 'Score',
         'Gain-Herleitung', 'Platzierung'))
print('-' * 108)
# Kosten-Spalte (I1j, Christophers Wunsch): units INKL. statischer 1,0
# Kartenkosten (Score-Nenner); Score = Gain / Kosten.
for e in sorted(EV, key=lambda x: (x['tier'], -x['score'])):
    print('%-4s %-24s %-3s %-3s %6.2f %+8.3f %+8.3f  %-24s %s'
          % (e['id'], e['title'][:24], e['rarity'], e['tier'],
             e['units'] + 1.0, e['gain'], e['score'], e['calc'][:24],
             e['place'][:34]))
print('-' * 108)
for tier in ('T1', 'T2'):
    sc = [e['score'] for e in EV if e['tier'] == tier]
    print('%s: Median %-6.3f  Min %-6.3f  Max %-6.3f  n=%d'
          % (tier, statistics.median(sc), min(sc), max(sc), len(sc)))

# ------------------------------------------------ Planetar-Sweep (I1b) ----
PLAN_X = [1.0, 1.5, 2.0, 2.5, 3.0]


def w_gain(i):
    g = {'185': pr['E_col'](5) * ALPHA_E,
         '183': pr['a_gain']('A3', None),
         '238': pr['H'](1) + KRAW['238'],
         '345': pr['E_col'](1) * ALPHA_E + KRAW['345']}[i]
    u = {'185': P_PLANETAR, '183': e_cost_col(-5) + P_PLANETAR,
         '238': P_PLANETAR, '345': P_PLANETAR}[i]
    return g, u


print()
print('Planetar-Sweep (Referenz I1b; P_planetar %.1f BESTAETIGT I1r; '
      'E-Gains x ALPHA_E, 185/345 Kolonie-Kurs):' % P_PLANETAR)
print('%-26s' % 'P_planetar ->', end='')
for x in PLAN_X:
    print(' %8.1f' % x, end='')
print()
for i, t in [('185', 'Kraftwerk'), ('183', 'Industriekomplex'),
             ('345', 'Autonomer Stuetzpunkt'), ('238', 'Schmugglernest')]:
    g, u0 = w_gain(i)
    print('%-26s' % t, end='')
    for x in PLAN_X:
        u = u0 - P_PLANETAR + x
        print(' %+8.3f' % (g / (u + 1.0)), end='')
    print()

# --------------------------- T_win FIXIERT (I1g, per-Runde-Frame) ----------
# Christophers Beschluss I1g: T_win = 1 fixiert — Huelle/Ausruestung/Infra
# werden VOR dem Gefecht (Aufbauphase) gespielt, Wertung je Runde; die
# Szenario-Tabellen T_win 1/2/3 (I1c/I1d) sind obsolet und nur noch in
# balancing.md dokumentiert. Situationsnutzbarkeit laeuft ueber u_X.
print()
print('=' * 108)
print('T_win ENTFERNT (I1g fixiert auf 1, I1h aus der Formel genommen) — '
      'Szenarien T_win 2/3 obsolet (historisch in balancing.md I1c/I1d).')
print('=' * 108)
print()
print('u-Sensitivitaet (Werkzeug fuer Outlier-Runde; Score je Karte '
      'bei u-Reglern):')
BASE_U = dict(U)
for label, uu in [('v9-Default (u unveraendert)', dict(BASE_U)),
                  ('u_equip 0,8 -> 1,0 (Sockel immer frei)',
                   {**BASE_U, 'equipment': 1.0}),
                  ('u_infra 0,8 -> 1,0 (nur Kolonie-Bewertung)',
                   {**BASE_U, 'infrastructure': 1.0})]:
    save = dict(U)
    U.clear(); U.update(uu)
    ev_u, pvi_u, _ = run()
    U.clear(); U.update(save)
    print('  %-42s 164 %.3f | 320 %.3f | 154 %.3f | 137-148 %.3f | '
          'PV_infra %.3f'
          % (label,
             [e['score'] for e in ev_u if e['id'] == '164'][0],
             [e['score'] for e in ev_u if e['id'] == '320'][0],
             [e['score'] for e in ev_u if e['id'] == '154'][0],
             [e['score'] for e in ev_u if e['id'] == '137'][0],
             pvi_u))
print()
print('Fokus-Deck-Sensitivitaet (Christophers Punkt: Spieler fokussieren '
      '1-2 Disziplinen):')
b_focus = B2['tactic']          # ganze Taktik-Anteil auf EINE Disziplin
print('  Aktion 1 Disz. im Viertel-Mix: %.3f | im Fokus-Deck '
      '(100 %% der Taktik = 1 Disz.): %.3f  (x%.1f)'
      % (B_DISC1 * U['tactic'] * pv_equip, b_focus * U['tactic'] * pv_equip,
         b_focus / B_DISC1))
print('  -> Einzel-Disziplin-Aktionen belohnen Fokus-Decks wie gewuenscht '
      '(Incentive); Default-Anker bleibt die Gleichverteilung (I1q).')
print()
print('Deck-Sensitivitaet (I1q): Starter-Deck-Mix (29/36/17/18 %) vs. '
      'Gleichverteilung — Abweichung davon ist Spielertaktik:')
print('  Starter-Mix b_X: hull %.3f | equip %.3f | infra %.3f | tactic %.3f'
      % (p_ge2(DECK_STARTER['hull']), p_ge2(DECK_STARTER['equipment']),
         p_ge2(DECK_STARTER['infrastructure']),
         p_ge2(DECK_STARTER['tactic'])))
print('  -> Gleichverteilung (b je %.3f) ist der saubere Kalkulations-'
      'Anker; Spieler-Mixe verschieben Einzelwerte, aber nicht die '
      'Preislogik.' % B2['hull'])

print()
print('=' * 108)
print('Absorptions-Sensitivitaet E-Produzenten (I1n/I1o-Regler; I1y-'
      'BESCHLUSS PFAD A: ALPHA_E = %.2f, v9-Default):' % ALPHA_E)
print('  Realisierungs-Symmetrie: Aktionen b x u, Multiplikatoren pi_play, '
      'Energie ALPHA_E (ehemals einziger Gain ohne Realisierungs-')
print('  Faktor -> Produzenten-Scores der v6 waren Obergrenzen). Kurs je '
      'Punkt: Schiff 1,65/1,155, Kolonie 0,825/0,495 (I1r); ALPHA_E '
      'daempft nur die MENGE. Playtest:')
print('  Nachfrage je Runde / Kapazitaet messen (ggf. je Produzent '
      'groessenabhaengig — kleinster verkauft zuerst).')
# E-Produzenten: (id, Kapazitaet E/Runde, nicht-E-Gain, Kurs)
# Kurs 'col' = Kolonie-Ortskurs (I1q-Vorschlag), 'ship' = Schiffskurs
PRODS = [('185', 5, 0.0, 'col'), ('187', 2, 0.0, 'ship'),
         ('188', 1, 0.0, 'ship'), ('145', 4, 0.0, 'ship'),
         ('345', 1, 0.120, 'col')]


def course_of(c):
    return pr['E_col'] if c == 'col' else pr['E']


by_id = {e['id']: e for e in EV}
med = {t: statistics.median([e['score'] for e in EV if e['tier'] == t])
       for t in ('T1', 'T2')}
anchors = {'bestes Aktionsobjekt 320': by_id['320']['score'],
           '135 Schiffswerft': by_id['135']['score'],
           'T1-Median': med['T1'], 'T2-Median': med['T2'],
           '336 Militaerakademie': by_id['336']['score']}


def prod_scores(alpha):
    sc = {}
    for pid, cap, other, course in PRODS:
        gain = course_of(course)(cap) * alpha + other
        sc[pid] = gain / (by_id[pid]['units'] + 1.0)
    return sc


def alpha_eq(pid, anchor_score):
    """Alpha, bei dem der Produzenten-Score dem Anker entspricht."""
    costs = by_id[pid]['units'] + 1.0
    for pid2, cap, other, course in PRODS:
        if pid2 == pid:
            return ((anchor_score * costs - other)
                    / course_of(course)(cap))


print('  %-6s %-12s %10s %9s %9s   Alpha zum Angleich an:'
      % ('id', 'Objekt', 'a=1,0 (v6)', 'a=0,5 (I1o)', 'a=0,25 (v9)'))
for pid, cap, other, course in PRODS:
    s = prod_scores(1.0)[pid]
    eq = ', '.join('%s %.2f' % (lbl, alpha_eq(pid, a))
                   for lbl, a in anchors.items())
    print('  %-6s %-12s %10.3f %9.3f %9.3f   %s'
          % (pid, by_id[pid]['title'][:12],
             s, prod_scores(0.5)[pid], prod_scores(0.25)[pid], eq))
print('  (Alpha = Anteil der produzierten E-Punkte, der je Runde '
      'tatsaechlich Abnehmer findet; Kurs je Punkt: Schiff 1,65/1,155, '
      'Kolonie 0,825/0,495.)')
for alpha in (0.75, 0.25):
    sc = prod_scores(alpha)
    ev_a = [dict(e) for e in EV]
    for e in ev_a:
        if e['id'] in sc:
            e['score'] = sc[e['id']]
    med_a = {t: statistics.median([e['score'] for e in ev_a
                                   if e['tier'] == t])
             for t in ('T1', 'T2')}
    top_t1 = sorted((e['score'], e['id']) for e in ev_a
                    if e['tier'] == 'T1')[-3:]
    print('  Szenario alpha=%.2f: T1-Median %.3f / T2-Median %.3f | '
          'T1-Spitze: %s'
          % (alpha, med_a['T1'], med_a['T2'],
             ' '.join('%s %.2f' % (i, s) for s, i in reversed(top_t1))))
print('  Verkaufs-Reihenfolge bei Knappheit: kleinster Produzent first '
      '(alpha_X = min(1, d_Runde/Kapazitaet_X)) -> Rang kehrt sich um:')
print('    Nachfrage-Beispiel d=1,0 E/Runde (v9-Kurse, Kosten wie '
      'Haupttabelle): 188 1,650 | 187 0,825 | 145 0,581 | 345 0,378 | '
      '185 0,224  (188 verkauft sich voll und bleibt ueber allen '
      'Aktionskarten; 185 faellt unter 320/135/183; v8-Zeile hatte 145 '
      'inkonsistent zu soc_cost(2) gerechnet)')
print()

out = dict(
    frame='I1 Spur W Preisliste MODELL v9 (I1w): Dual-Profile 50/50 '
          'Schiff (Psi-Sockel + E-Schiffskurs) / Kolonie (Psi frei, '
          'E-Koloniekurs) fuer alle Nicht-Planetar-Karten (beschlossen, '
          'generalisiert I1i); E-Ortskurs Kolonie 0,5/0,3 (Christophers '
          'Werte, I1r); P_planetar 1,5 (bestaetigt I1r, war 2,5); I1w: '
          'PI_PLAY = 0,75 (war 0,5, Playtest-Anker); I1q: '
          'Deck-Gleichverteilung 25 % je Typ, 183 Code-Lesart je +1 '
          'E/I/H (CSV-PR #808); I1y: ALPHA_E = 0,25 (Pfad A, war 0,5 '
          'I1o); I1h: u (hull 1,0 / '
          'equip 0,8 / infra 0,8 / tactic 0,8)',
    anchors=dict(c_ex=round(c_ex, 3), pv_equip=round(pv_equip, 3),
                 pv_infra=round(pv_infra, 3), deck=DECK,
                 deck_starter=DECK_STARTER,
                 burst=B2, burst_disc=[round(B_DISC1, 3), round(B_DISC2, 3)]),
    regler=dict(P_planetar=P_PLANETAR, u=U, alpha_e=ALPHA_E,
                e_kolonie=[E1_COL, SUB_E_COL],
                pi_play=PI_PLAY,
                phi_flex=PHI_FLEX, h_limit=H_LIMIT, sub_e=SUB_E,
                pv_parity=PV_PARITY, disc_frac=0.25),
    prices=dict(P_E1=round(pr['E'](1), 3), P_E5=round(pr['E'](5), 3),
                P_E_col1=round(pr['E_col'](1), 3),
                P_E_col5=round(pr['E_col'](5), 3),
                A_hull=round(B2['hull'] * U['hull'] * pv_equip, 3),
                A_equip=round(B2['equipment'] * U['equipment'] * pv_equip, 3),
                A_tact_disc=round(B_DISC1 * U['tactic'] * pv_equip, 3),
                A_tact_2disc=round(2 * B_DISC1 * U['tactic'] * pv_equip, 3),
                A_infra=round(B2['infrastructure'] * U['infrastructure']
                              * pv_infra, 3),
                A_flex=round(pr['a_gain']('A_flex', ('hull', 'equipment')), 3),
                A_183=round(pr['a_gain']('A3', None), 3),
                M_infra=round(pr['M']('infrastructure'), 3),
                M_2disc=round(pr['M2'](), 3),
                H1=round(pr['H'](1), 3)),
    objects=[dict(id=e['id'], title=e['title'], rarity=e['rarity'],
                  tier=e['tier'], units=e['units'],
                  costs=round(e['units'] + 1.0, 2),  # I1j inkl. stat. 1,0
                  gain=e['gain'],
                  score=e['score'], calc=e['calc'], place=e['place'],
                  note=e['note']) for e in EV],
    tier_median={t: round(statistics.median(
        [e['score'] for e in EV if e['tier'] == t]), 3)
        for t in ('T1', 'T2')},
    absorption=dict(
        note='I1n/I1o (Beschluss Option A): Produzenten-Gains x ALPHA_E '
             '(Default 0,25 seit I1y Pfad A, war 0,5; Playtest-Regler: '
             'Nachfrage je Runde / Kapazitaet; Kurs je Punkt: Schiff '
             '1,65/1,155, Kolonie 0,825/0,495 (I1r). '
             'alpha_1.0 = historische v6-Obergrenze.',
        producers={pid: dict(cap=cap, other_gain=other, course=course,
                             score_a10=round(prod_scores(1.0)[pid], 3),
                             score_a05=round(prod_scores(0.5)[pid], 3),
                             score_a075=round(prod_scores(0.75)[pid], 3),
                             score_a025=round(prod_scores(0.25)[pid], 3),
                             eq_alpha_320=round(alpha_eq(pid, anchors[
                                 'bestes Aktionsobjekt 320']), 3))
                   for pid, cap, other, course in PRODS}),
    t_win_fixiert='I1g: T_win = 1 (per-Runde-Frame), Szenarien 2/3 obsolet',
)
json.dump(out, open('diag_infra_prices_r13i.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print('\nJSON: diag_infra_prices_r13i.json')
