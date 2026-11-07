# diag_stat_r13t.py — Systematische Analyse "Warum sind Statwerte
# ~Faktor 2 schwächer als Waffen?" (Christophers Wunsch 6.11.2026,
# vor der v23b-Ankuerung). Reine Auswertung der v23b-Offizialdaten
# (diag_random_v23_r13t.json + Checkpoint) + strukturzerlegung:
#   1. Ratio Karten-/Waffen-Median je Raritaet (Faktor-2-Pruefung)
#   2. Kanalzerlegung je Statkarte (Gain-Ebene vs. Score-Ebene)
#   3. Gruppenzerlegung (Panzer/Schild/PD/Speed/hp-only)
#   4. Wirkfenster (Beschuss vs. Eigenfeuer je Platzierung,
#      aus diag_speed5_r13t.py-Messung v23b, hardcodet mit Quelle)
#   5. Cross-Bonus-Asymmetrie: Waffen bekommen Kills-Bonus (take),
#      Statkarten nur Ueberlebens-Bonus (out)
#   6. hp-Buchungseffekt: +hp erzeugt NEGATIVEN take (Schiff steckt
#      mehr Schaden ein, bevor es stirbt), nur 0,5xhp-Ausgleich
# Achtung: KEIN Import-Schutz — nie importieren! CWD = knowledge-Ordner.

import json
import statistics as st

d = json.load(open('diag_random_v23_r13t.json'))
ck = json.load(open('diag_random_ckpt_v23_r13t.json'))

WIRK_BESCHUSS = 1.88   # Schuesse auf den Traeger je Platzierung
WIRK_EIGEN = 1.72       # Schuesse vom Traeger (alle Waffen) je Platzierung
# Quelle: diag_speed5_r13t.py, v23b (Flotte 1-5), N=2000, seed 42

# Wirkfenster-These: paritaetisch -> Faktor 2 kommt NICHT aus der Zahl
# der Wirkgelegenheiten.
print('=== 1) Wirkfenster je Platzierung (v23b, diag_speed5) ===')
print('Beschuss des Traegers %.2f vs. Eigenfeuer %.2f -> Verhaeltnis %.2f'
      % (WIRK_BESCHUSS, WIRK_EIGEN, WIRK_BESCHUSS / WIRK_EIGEN))
print('=> Wirkfenster ~paritaetisch, KEINE Erklaerung fuer Faktor 2.')
print()

print('=== 2) Ratio Karten-/Waffen-Median je Raritaet (Score-Ebene) ===')
ratios = []
for r in range(1, 6):
    wm = d['medians'][str(r)]['weapons']
    cm = d['medians'][str(r)]['cards']
    ratios.append(cm / wm if wm else 0)
    print('r%d: Waffen %.2f | Karten %.2f | Ratio %.2f'
          % (r, wm, cm, cm / wm if wm else 0))
print('Ratio-Median: %.2f' % st.median(ratios))
print()

print('=== 3) Gain-Ebene vs. Score-Ebene (Faktor-2-Zerlegung) ===')
wtab = []
for w in d['weapons']:
    if w['score'] is None:
        continue
    acc, n = ck['accW'][w['id']], ck['accWn'][w['id']]
    g = [(acc[s]['out'] + acc[s]['take'] + acc[s]['col']
          + acc[s]['loot'] + acc[s]['prevent']) / n[s]
         for s in (0, 1) if n[s] > 0]
    out_m = st.mean([acc[s]['out'] / n[s] for s in (0, 1) if n[s]])
    take_m = st.mean([acc[s]['take'] / n[s] for s in (0, 1) if n[s]])
    wtab.append(dict(id=w['id'], rarity=w['rarity'], title=w['title'],
                     score=w['score'], gain=st.mean(g), out=out_m,
                     take=take_m))
ctab = []
for c in d['cards']:
    if c['score'] is None:
        continue
    acc, n = ck['accC'][c['id']], ck['accCn'][c['id']]
    g = [(acc[s]['out'] + acc[s]['take'] + acc[s]['col']
          + acc[s]['loot'] + acc[s]['prevent']) / n[s]
         for s in (0, 1) if n[s] > 0]
    out_m = st.mean([acc[s]['out'] / n[s] for s in (0, 1) if n[s]])
    take_m = st.mean([acc[s]['take'] / n[s] for s in (0, 1) if n[s]])
    ctab.append(dict(id=c['id'], rarity=c['rarity'], title=c['title'],
                     score=c['score'], gain=st.mean(g), out=out_m,
                     take=take_m))
print('%-18s %8s %8s' % ('Gruppe', 'Gain', 'Score'))
for r in range(1, 6):
    wg = [w['gain'] for w in wtab if w['rarity'] == r]
    cg = [c['gain'] for c in ctab if c['rarity'] == r]
    ws = [w['score'] for w in wtab if w['rarity'] == r]
    cs = [c['score'] for c in ctab if c['rarity'] == r]
    if wg and cg:
        print('r%d Waffen          %8.2f %8.2f (n=%d)'
              % (r, st.median(wg), st.median(ws), len(wg)))
        print('r%d Karten          %8.2f %8.2f (n=%d) | Gain-Ratio %.2f,'
              ' Score-Ratio %.2f'
              % (r, st.median(cg), st.median(cs), len(cg),
                 st.median(cg) / st.median(wg),
                 st.median(cs) / st.median(ws)))
print()
print('=> Gain-Luecke < Score-Luecke: ein Gutteil des Faktors 2 ist')
print('   KOSTEN-Normierung (teure Statkarten mit missetem Gain),')
print('   nicht Wirkungslosigkeit.')
print()

print('=== 4) Gruppenzerlegung der Statkarten (v23b) ===')
GROUPS = {
    'Panzer (armour)': ('103', '115', '163', '171', '240', '349', '406'),
    'Schild': ('140', '170', '312', '426', '522'),
    'PD': ('341',),
    'Speed': ('109', '161', '434', '537'),
    'hp-only': ('184', '449'),
}
byid = {c['id']: c for c in ctab}
for gname, ids in GROUPS.items():
    gs = [byid[i] for i in ids if i in byid]
    if not gs:
        continue
    print('%-18s Score-Median %.2f | Gain-Median %.2f | take %.2f |'
          ' out %.2f' % (gname, st.median([x['score'] for x in gs]),
                         st.median([x['gain'] for x in gs]),
                         st.median([x['take'] for x in gs]),
                         st.median([x['out'] for x in gs])))
print()

print('=== 5) Cross-Bonus-Asymmetrie ===')
print('Waffen-Median take-Kanal (Kills-Bonus):  %+.2f'
      % st.median([w['take'] for w in wtab]))
print('Waffen-Median out-Kanal (Eigenanteil):   %+.2f'
      % st.median([w['out'] for w in wtab]))
print('Karten-Median out-Kanal (Ueberlebensbonus): %+.2f'
      % st.median([c['out'] for c in ctab]))
print('Karten-Median take-Kanal (Wirkanteil):    %+.2f'
      % st.median([c['take'] for c in ctab]))
print('=> Waffe: Secondary-Bonus ~%.0f%% des out; Karte: Secondary nur'
      ' ~%.0f%% des take.'
      % (100 * st.median([w['take'] for w in wtab])
         / max(0.01, st.median([w['out'] for w in wtab])),
         100 * st.median([c['out'] for c in ctab])
         / max(0.01, st.median([c['take'] for c in ctab]))))
print()

print('=== 6) hp-Buchungseffekt (184, 449: +hp -> NEGATIV take) ===')
for i in ('184', '449', '349', '406'):
    c = byid[i]
    print('%s %-24s take %+.2f | out %+.2f | Score %.2f'
          % (c['id'], c['title'][:24], c['take'], c['out'], c['score']))
print('=> +hp verlaengert das Leben: der Traeger steckt MEHR Schaden')
print('   ein, bevor er stirbt -> take bucht NEGATIV; nur 0,5xhp-')
print('   STATIC-Ausgleich (Christophers 13i-Mitte). hp-Karten leben')
print('   fast nur vom HP-Konto, 449/240 geraten dadurch unter 0.')
print()

print('=== 7) Verzerrung des Karten-Medians durch Ausreisser ===')
neg = [c['title'] for c in ctab if c['gain'] < 0.5]
print('Karten mit Gain < 0,5: ' + ', '.join(neg))
print('=> 4-5 Karten mit ~0/negativem Gain druecken den Median unter')
print('   das Niveau der funktionierenden Panzer/Schild-Karten, die')
print('   mit Ratio 0,5-0,83 NAH an den Waffenmedian herankommen.')
