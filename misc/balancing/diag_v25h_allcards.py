# v25h-Analyse (9.11.2026): VOLLSTAENDIGE Tabelle aller 71 gemessenen
# Ausruestungsobjekte (50 Waffen + 21 Stat-/Def-/Reparatur-Karten) gegen
# die gemeinsame Kurve 8/10/13/16/20. Erweitert die 44er-Outlier-
# Arbeitsliste (Forts. 9/13) um die 27 zusaetzlich gemessenen Objekte
# im SD-Band (Christophers Rueckfrage "fehlende Ausruestungskarten",
# 9.11.2026). Zahlen identisch zu diag_v25g_analysis (Modus pz3/e2/e3
# d.h. exakt die Tabelle aus Forts. 13/15 + 179sx); die 27 Zusatzzeilen
# laufen ueber dieselbe build()-Logik (margins aus diag_v25a_r13t.json,
# units U2 aus csv + E-Overrides 140/426/522/343).
#
# Profilanpassungsspalte Repo->Messprofil (v23i-Zustaende csv-lokal,
# v25-Zustaende via MARG/RAR/E-Overrides): (#795) = Wert-/E-Aenderung
# im Zielzustand, (Dose) = v25-kalibrierte Dosierung, (Tausch) =
# Raritaetstausch, "wie implementiert" = Messprofil == Repo.
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import diag_v25g_analysis as g

CURVE = g.CURVE

# --- #795-Zielzustands-Sicherung (Daten-Assertion wie diag_v25c_scenarios.py):
# units/energies stammen aus der csv — nur 140/426/522/343/302 bekommen ihre
# Energie als E-Override in g.build (nicht aus der csv). Gegen die Ist-csv
# (pre-#795) driften genau die 5 Energie-Dosen-Karten (126/223/161/109/304)
# und der Lauf ueberschreibt die eingecheckte 71-Objekt-Referenztabelle
# (Autoritaet fuer #795 Abschnitt 8) mit 5 stillschweigend veraenderten
# Zeilen. Deshalb VOR der Analyse die #795-Zielenergien der 5 Karten
# assertieren:
E_DOSE_795 = {'109': 1, '126': 1, '161': 0, '223': 2, '304': 1}
for cid, want in E_DOSE_795.items():
    got = g.energy_by_id.get(cid, 0)
    assert got == want, ('csv nicht im #795-Zielzustand (Energie-Dosis)',
                         cid, got, want)

objs = g.build('pz3', 'e2', 'e3')

# --- v25h-Runde (Christophers Beschluesse der Vollstaendigkeits-
# Runde, 9.11.2026, Forts. 17): 103 hp 2->0 und 171 hp -5->-3 neu
# gemessen (diag_v25h_r13t.json, N=3000, CRN-gepaart); 434<->441
# Raritaetstausch (reine Referenzverschiebung); 166 SAbz X bereits
# metrisch aktiv (v9.FINAL) -> Score unveraendert. ---
V25H = {   # id -> (margin neu, src) bzw. rarity
    '103': dict(margin=43.09, src='103hp0'),
    '171': dict(margin=21.39, src='171hp3'),
    '434': dict(rarity=1),
    '441': dict(rarity=2),
}
for o in objs:
    if o['id'] in V25H:
        o.update(V25H[o['id']])
        o['score'] = o['margin'] / o['units']

# Die 27 Objekte, die NICHT in der 44er-Outlier-Liste standen
# (Christophers Rueckfrage; im SD-Band der Forts.-9-Selektion)
MISSING = {'103', '107', '118', '127', '136', '157', '161', '163', '166',
           '171', '181', '240', '303', '310', '312', '341', '347', '401',
           '405', '434', '438', '440', '441', '449', '522', '554', '555'}

# Profilanpassung Repo -> Messprofil je ID
PROF = {
 '101': 'dmg 24\u219228, TAbz \u22129\u2192\u221211 (#795), R 5\u21924 (Tausch)',
 '103': 'hp \u00b10 (v23i hp\u21922 verworfen), R 5\u21924 (#795)',
 '104': 'hp 0\u219210 + Vollreparatur (Dose), R 5\u21924 (Tausch)',
 '106': 'wie implementiert',
 '107': 'wie implementiert',
 '109': 'E \u22123\u2192\u22121 (#795), R 4\u21923 (Tausch)',
 '115': 'R 4\u21925 (Tausch)',
 '118': 'wie implementiert',
 '125': 'wie implementiert',
 '126': 'E \u2192\u22121 (#795)',
 '127': 'wie implementiert',
 '130': 'PzAbz \u22123\u2192X (#795)',
 '136': 'wie implementiert',
 '140': 'E \u22122\u2192\u22121 (#795)',
 '150': 'dmg 12\u219214, SAbz \u22123\u2192\u22124, TAbz \u22126\u2192\u22127 (#795)',
 '151': 'dmg 5\u21924 (#795), R 2\u21923 (Tausch)',
 '157': 'wie implementiert',
 '161': 'E \u22121\u21920 (#795)',
 '163': 'wie implementiert',
 '166': 'PzAbz \u22121\u2192\u22122 (Dose), SAbz \u22123\u2192X (#795)',
 '167': 'wie implementiert',
 '168': 'wie implementiert',
 '170': 'wie implementiert',
 '171': 'hp 0\u2192\u22123 (Dose), R 1\u21923 (Tausch)',
 '179': 'PzAbz \u22122\u2192X, SAbz \u2192X (#795)',
 '180': 'dmg 3\u21922 (#795), R 1\u21922 (Tausch)',
 '181': 'wie implementiert',
 '182': 'dmg 6\u21925, SAbz \u22123\u2192\u22125 (#795)',
 '184': 'wie implementiert (v23i-Revert)',
 '203': 'wie implementiert',
 '207': 'dmg 4\u21923 (#795), R 4\u21925 (Tausch)',
 '209': 'wie implementiert',
 '216': 'PzAbz \u22124\u2192\u22126 (#795)',
 '223': 'E \u22121\u2192\u22122 (#795), R 2\u21924 (Tausch)',
 '224': 'R 2\u21921 (Tausch)',
 '234': 'wie implementiert',
 '237': 'R 1\u21922 (Tausch)',
 '240': 'hp 3\u219221 (Dose)',
 '302': 'dmg 50\u219270 (Dose), E \u22126\u2192\u22123 (#795)',
 '303': 'wie implementiert',
 '304': 'dmg 22\u219224, E \u2192\u22121, TAbz \u221211\u2192\u221212 (#795)',
 '310': 'R 4\u21925 (#795)',
 '312': 'R 3\u21922 (#795)',
 '318': 'dmg 14\u219216, TAbz \u22127\u2192\u22128 (#795)',
 '325': 'rep 2\u21924, hp 0\u21922 (Dose), R 2\u21921 (Tausch)',
 '339': 'wie implementiert',
 '340': 'wie implementiert',
 '341': 'wie implementiert',
 '343': 'E \u22121\u2192\u22122 (#795), R 1\u21922 (Tausch)',
 '344': 'PzAbz \u22121\u2192\u22122 (Dose), R 1\u21922 (Tausch)',
 '347': 'dmg 5\u21924 (#795)',
 '349': 'hp 4\u21920 (Dose)',
 '401': 'dmg 30\u219235 (#795)',
 '405': 'wie implementiert',
 '406': 'wie implementiert (v23i-Revert)',
 '409': 'wie implementiert',
 '412': 'dmg 8\u219210, TAbz \u22124\u2192\u22125 (#795), R 3\u21922 (Tausch)',
 '420': 'wie implementiert',
 '421': 'wie implementiert',
 '422': 'wie implementiert',
 '424': 'wie implementiert',
 '426': 'wie implementiert (v23i E\u21920 aufgehoben)',
 '434': 'hp \u22123\u21920 (#795), R 2\u21921 (Tausch)',
 '438': 'wie implementiert',
 '440': 'wie implementiert',
 '441': 'R 1\u21922 (Tausch)',
 '449': 'hp 5\u219225 (Dose)',
 '522': 'R 2\u21921 (Tausch), E \u22121 wie Repo (v23i-Aufhebung)',
 '537': 'R 2\u21921 (Tausch)',
 '554': 'wie implementiert',
 '555': 'dmg 8\u21926 (#795)',
}

rows = []
for o in objs:
    cid = o['id']
    abw = o['score'] - CURVE[o['rarity']]
    rows.append(dict(cid=cid, title=o['title'], rarity=o['rarity'],
                     margin=o['margin'], units=o['units'],
                     score=o['score'], abw=abw, src=o['src'],
                     prof=PROF.get(cid, '???'),
                     miss=cid in MISSING))
assert len(rows) == 71, f'{len(rows)} Zeilen, erwartet 71'
assert not any(r['prof'] == '???' for r in rows), 'fehlender Profilanpassungs-String'

rows.sort(key=lambda r: -r['abw'])

out = dict(
    frame=('v25h: VOLLSTAENDIGE 71-Objekt-Tabelle (50 Waffen + 21 Stat-/Def-/'
           'Reparatur-Karten) gegen die gemeinsame Kurve 8/10/13/16/20; '
           'Modus identisch diag_v25g_analysis (pz3/e2/e3); erweitert die '
           '44er-Outlier-Arbeitsliste um die 27 im SD-Band liegenden, '
           'ebenfalls gemessenen Objekte (Christophers Rueckfrage 9.11.2026); '
           '6 implementierte Utility-/Sockelkarten (124/211/212/241/447/545) '
           'bleiben bewusst ungemessen (Christophers Bestaetigung). '
           'v25h-Runde (Forts. 17) integriert: 103 hp 2->0 und 171 hp -5->-3 '
           'NEU GEMESSEN (diag_v25h_r13t.json, N=3000, CRN-gepaart), '
           '434<->441 Raritaetstausch (reine Referenzverschiebung), '
           '166 SAbz X bereits metrisch aktiv (v9.FINAL, Score unveraendert).'),
    rows=[dict(id=r['cid'], title=r['title'], rarity=r['rarity'],
               margin=round(r['margin'], 3), units=round(r['units'], 2),
               score=round(r['score'], 3), abw=round(r['abw'], 3),
               src=r['src'], prof=r['prof'], in_44er_liste=not r['miss'])
          for r in rows])
with open(os.path.join(HERE, 'diag_v25h_allcards.json'), 'w',
          encoding='utf-8') as f:
    json.dump(out, f, indent=1, ensure_ascii=False)

# Markdown-Tabelle (fett = zavor NICHT in der 44er-Tabelle)
print('| ID | Karte | R | Score | Abw. | Profilanpassung |')
print('|---|---|---|---|---|---|')
for r in rows:
    pre = '**' if r['miss'] else ''
    post = '**' if r['miss'] else ''
    print(f"| {pre}{r['cid']}{post} | {pre}{r['title']}{post} | "
          f"{r['rarity']} | {r['score']:.2f} | {r['abw']:+.2f} | {r['prof']} |")

n_out = sum(1 for r in rows if abs(r['abw']) > 4)
print(f'\nObjekte ausserhalb +/-4 gegen die Kurve: {n_out} von 71')
