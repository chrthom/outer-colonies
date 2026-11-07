# ============================================================================
# diag_infra_sweep_r13i.py — Sensitivitaets-Sweep Runde I1s (nach I1r)
# Kombi-Sweep E-ORTSKURS KOLONIE (E1/SUB) x P_planetar auf Basis des
# MODELLS v9 aus diag_infra_prices_r13i.py: Fuehrt das v9-Skript
# mit ueberschriebenen Reglern aus (Re-Exec, Ausgabe unterdrueckt, JSON
# wird NICHT angefasst) und stellt die Fit-Metriken gegenueber:
#   - Tier-Mediane + Inversion (E-Kurs ist der Haupt-Hebel: bewegt alle
#     Kolonie-Zweige der Dual-Profile + Planetar-Verbraucher)
#   - P_planetar bewegt NUR die 4 Planetar-Spur-W-Karten (185/183/345/238)
#   - CROSS-ANKER-GESETZ (I1s-Befund): Kraftwerk (185) == Atomreaktor
#     (187, 0.825) genau dann, wenn P_planetar = E1 + 4*SUB - 1
#     (= Kolonie-Einheiten von E-5 minus 1): 0,7/0,5 -> 1,7 ·
#     0,6/0,4 -> 1,2 · 0,5/0,3 -> 0,7
#   - PV_infra-Fixpunkt 1,397 bleibt in ALLEN Varianten erhalten
#     (wird von 164 getragen, kursunabhaengig) — Methodik-Notiz I1r
#     bestaetigt sich im Grid.
# HINWEIS: Re-Run 10.11. auf PI_PLAY = 0,75 (Beschluss I1w) — T2-Mediane
#     inkl. Multiplikatoren verschieben sich leicht gegenueber den in
#     balancing.md I1s dokumentierten pi-0,5-Zahlen; die I1s-Entscheidung
#     (BEI v9 GEBLIEBEN: 0,5/0,3 + P_planetar 1,5) und das Cross-Anker-
#     Gesetz sind pi-unabhaengig.
# ----------------------------------------------------------------------------
import contextlib
import io
import itertools
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(HERE, 'diag_infra_prices_r13i.py'),
           encoding='utf-8').read()


def run_variant(e1, sub, pp):
    """v9-Skript mit ueberschriebenen Reglern ausfuehren."""
    s = SRC
    s = re.sub(r'^E1_COL = [\d.]+', 'E1_COL = %r' % e1, s, flags=re.M)
    s = re.sub(r'^SUB_E_COL = [\d.]+', 'SUB_E_COL = %r' % sub, s, flags=re.M)
    s = re.sub(r'^P_PLANETAR = [\d.]+', 'P_PLANETAR = %r' % pp, s, flags=re.M)
    # Haupt-JSON der v9 nicht ueberschreiben:
    s = s.replace("json.dump(out, open('diag_infra_prices_r13i.json', "
                  "'w', encoding='utf-8'),",
                  "json.dump(out, open('" + os.path.join(HERE, '.sweep_out.tmp') +
                  "', 'w', encoding='utf-8'),")
    ns = {'__file__': os.path.join(HERE, 'diag_infra_prices_r13i.py')}
    with contextlib.redirect_stdout(io.StringIO()):
        exec(compile(s, 'sweep_variant', 'exec'), ns)
    out = ns['out']
    return dict(pv_infra=out['anchors']['pv_infra'],
                med_t1=out['tier_median']['T1'], med_t2=out['tier_median']['T2'],
                sc={e['id']: e['score'] for e in out['objects']})


GRID_E = [(0.7, 0.5), (0.6, 0.4), (0.5, 0.3)]
GRID_P = [1.0, 1.25, 1.5, 2.0]

print('=' * 100)
print('I1s KOMBI-SWEEP: E-Ortskurs Kolonie (E1/SUB) x P_planetar '
      '(v9-Struktur, Dual-Profile 50/50)')
print('=' * 100)
print('%-12s %-6s %-9s %-8s %-8s %-6s %-34s' %
      ('E Kolonie', 'P_pl', 'pv_infra', 'T1-Med', 'T2-Med', 'Inv',
       '185 Kraftwerk vs 0,825 (Cross-Anker)'))
grid_rows = []
for (e1, sub), pp in itertools.product(GRID_E, GRID_P):
    r = run_variant(e1, sub, pp)
    r.update(e1=e1, sub=sub, pp=pp)
    grid_rows.append(r)
    print('%-12s %-6.2f %-9.3f %-8.3f %-8.3f %-6.2f %+8.3f' %
          ('%.1f/%.1f' % (e1, sub), pp, r['pv_infra'], r['med_t1'],
           r['med_t2'], r['med_t1'] / r['med_t2'],
           r['sc']['185'] - r['sc']['187']))

# Cross-Anker-Paarungen + Kandidaten der Glattungsdiskussion
FOCUS = [(0.7, 0.5, 1.7), (0.6, 0.4, 1.25), (0.6, 0.4, 1.2), (0.6, 0.4, 1.0),
         (0.5, 0.3, 1.5), (0.5, 0.3, 1.25), (0.5, 0.3, 1.0), (0.5, 0.3, 0.7)]
KEY_T1 = ['448', '183', '187', '185', '164', '172', '239', '345', '169', '238']
KEY_T2 = ['145', '156', '320', '135', '336', '219', '154', '137', '230', '333']

print()
print('Fokus-Varianten (Score je Karte; Kosten-Nenner inkl. statischer 1,0):')
print('%-12s %-6s %-7s %-7s %-5s %-6s %-6s %-6s %-6s %-6s %-6s %-6s %-6s' %
      ('E Kolonie', 'P_pl', 'T1-Med', 'T2-Med', 'Inv', '448', '183',
       '185', '187', '156', '320', '230', '333'))
focus_rows = []
for e1, sub, pp in FOCUS:
    r = run_variant(e1, sub, pp)
    r.update(e1=e1, sub=sub, pp=pp)
    focus_rows.append(r)
    print('%-12s %-6.2f %-7.3f %-7.3f %-5.2f %-6.3f %-6.3f %-6.3f %-6.3f '
          '%-6.3f %-6.3f %-6.3f %-6.3f'
          % ('%.1f/%.1f' % (e1, sub), pp, r['med_t1'], r['med_t2'],
             r['med_t1'] / r['med_t2'], r['sc']['448'], r['sc']['183'],
             r['sc']['185'], r['sc']['187'], r['sc']['156'], r['sc']['320'],
             r['sc']['230'], r['sc']['333']))

print()
print('Cross-Anker-Gesetz: P_planetar = E1 + 4*SUB - 1 setzt Kraftwerk '
      'exakt auf Atomreaktor-Paritaet 0,825:')
for e1, sub in GRID_E:
    r = run_variant(e1, sub, e1 + 4 * sub - 1)
    print('  E %.1f/%.1f -> P_planetar %.2f | 185 = %.3f | Abweichung %+.4f'
          % (e1, sub, e1 + 4 * sub - 1, r['sc']['185'],
             r['sc']['185'] - r['sc']['187']))

out = dict(frame='I1s Kombi-Sweep E-Ortskurs Kolonie x P_planetar '
                '(Basis MODELL v9/I1r; kein Beschluss, Regler-Sensitivitaet '
                'fuer die Glaettung)',
           cross_anker_gesetz='P_planetar = E1 + 4*SUB - 1 <=> '
                             'Kraftwerk == Atomreaktor (0.825)',
           grid=grid_rows, focus=focus_rows)
json.dump(out, open(os.path.join(HERE, 'diag_infra_sweep_r13i.json'), 'w',
                    encoding='utf-8'), ensure_ascii=False, indent=1)
print('\nJSON: diag_infra_sweep_r13i.json')
