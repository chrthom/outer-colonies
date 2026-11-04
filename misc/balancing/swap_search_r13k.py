"""Runde 13k: Tausch-Suche gegen Zielkurve v17 (7,8/8,0/8,4/9,0/9,8).

Constraints (Christophers Vorgaben, wie Runde 13f, 3.11.2026):
- editionsrein (Edition = 1. Ziffer der ID); nur Waffen (Karten vertagt,
  Christophers Beschluss Runde 13j Fortsetzung)
- max. 2 Rarity-Level Sprung je Karte
- R0-Karten werden nie getauscht
- 125 Plasmakanone nicht auf r5 (S2-Tabu)
- Abweichler-Grenzwert |d| > 1,0 (Christophers Beschluss Runde 13k)

Zwei Szenarien:
  A: Basis-Scores = 13k-EMPFEHLUNG (Werte-Paket aus audit_r13k.json,
     beste Variante je Waffe) — Tausch als Ergaenzung zum Paket
  B: Basis-Scores = FINAL (kein Wert-Paket) — reine Tausch-Option
Toleranz: fixierter Outlier danach |d| <= 0,5; Partner darf durch den
Tausch kein neuer Outlier werden (|d| <= 1,0).
"""
import json

T = {1: 7.8, 2: 8.0, 3: 8.4, 4: 9.0, 5: 9.8}
LIM = 1.0
FIX = 0.5
TABU = {('125', 5)}

# 13k-Empfehlungs-Scores (Runde 13k, Messung audit_r13k.py N=10k):
# sauber im Fenster: 412 B / 136 B / 207 B / 344 A / 179 A / 554 D /
# 555 B / 216 E / 101 A / 304 A / 167 B / 422 D / 151 D / 180 F / 223 D;
# Grenzfaelle: 127 F / 438 F / 166 A (Struktur-Luecke); 209 A gegen r4
# (T2-Plan r5 ware -1,01, haarrueck).
EMPFA = {
    '412': 8.23, '136': 7.27, '127': 7.18, '207': 8.15, '344': 8.06,
    '179': 7.98, '554': 7.20, '555': 7.92, '216': 8.19, '101': 9.08,
    '304': 9.05, '209': 8.79, '167': 7.26, '422': 8.19, '166': 6.32,
    '151': 7.40, '438': 6.49, '180': 7.98, '223': 7.51,
}


def load(final):
    items = []
    for x in json.load(open('frame_calibration.json'))['weapons']:
        wid = str(x['id'])
        it = dict(id=wid, title=x['title'], r=int(x['rarity']), typ='W',
                  ed=wid[0])
        if not final and wid in EMPFA:
            it['score'] = EMPFA[wid]
        else:
            it['score'] = float(x['score'])
        if not 1 <= it['r'] <= 5:
            continue
        it['d'] = it['score'] - T[it['r']]
        items.append(it)
    return items


def ok_after(a, r_new):
    if (a['id'], r_new) in TABU:
        return None
    return a['score'] - T[r_new]


def search(items):
    outliers = [it for it in items if abs(it['d']) > LIM]
    pairs = []
    for a in outliers:
        for b in items:
            if b['id'] == a['id'] or b['ed'] != a['ed']:
                continue
            if not 1 <= abs(a['r'] - b['r']) <= 2:
                continue
            da = ok_after(a, b['r'])
            db = ok_after(b, a['r'])
            if da is None or db is None:
                continue
            if abs(da) <= FIX and abs(db) <= LIM:
                fixed = 1 + (abs(b['d']) > LIM)
                pairs.append((fixed, -(abs(da) + abs(db)), a, b, da, db))
    pairs.sort(key=lambda p: (p[0], p[1]), reverse=True)
    used, chosen = set(), []
    for fixed, q, a, b, da, db in pairs:
        if a['id'] in used or b['id'] in used:
            continue
        used |= {a['id'], b['id']}
        chosen.append((a, b, da, db))
    return outliers, chosen, [it for it in outliers
                              if it['id'] not in used]


for name, final in (('A (13k-Empfehlung aktiv)', False),
                    ('B (FINAL ohne Wert-Paket)', True)):
    items = load(final)
    outliers, chosen, rest = search(items)
    print(f'\n===== Szenario {name}: {len(outliers)} Outlier |d|>{LIM} =====')
    for it in sorted(outliers, key=lambda x: -x['d']):
        print(f"  {it['id']:4} {it['title'][:24]:24} r{it['r']} "
              f"Score {it['score']:5.2f}  d {it['d']:+5.2f}")
    print(f'-- {len(chosen)} Tauschpaare (fix |d|<={FIX}, Partner |d|<={LIM}):')
    for a, b, da, db in chosen:
        print(f"  {a['id']:4} {a['title'][:20]:20} r{a['r']}->{b['r']}  "
              f"d {a['d']:+.2f} -> {da:+.2f}")
        print(f"  {b['id']:4} {b['title'][:20]:20} r{b['r']}->{a['r']}  "
              f"d {b['d']:+.2f} -> {db:+.2f}")
    if rest:
        print('-- Rest-Outlier ohne Paar:')
        for it in sorted(rest, key=lambda x: -x['d']):
            print(f"  {it['id']:4} {it['title'][:24]:24} r{it['r']} "
                  f"Score {it['score']:5.2f}  d {it['d']:+5.2f}")
    print('-- Top-Alternativen:')
    _, _, _ = None, None, None
    outliers2, chosen2, rest2 = search(items)
    pairs_all = []
    for a in outliers2:
        for b in items:
            if b['id'] == a['id'] or b['ed'] != a['ed']:
                continue
            if not 1 <= abs(a['r'] - b['r']) <= 2:
                continue
            da = ok_after(a, b['r'])
            db = ok_after(b, a['r'])
            if da is None or db is None:
                continue
            if abs(da) <= LIM and abs(db) <= LIM:
                pairs_all.append((abs(da) + abs(db), a, b, da, db))
    pairs_all.sort(key=lambda p: p[0])
    for q, a, b, da, db in pairs_all[:12]:
        print(f"  {a['id']:4} r{a['r']}->{b['r']} ({da:+.2f})  <->  "
              f"{b['id']:4} r{b['r']}->{a['r']} ({db:+.2f})  E{a['ed']}")
