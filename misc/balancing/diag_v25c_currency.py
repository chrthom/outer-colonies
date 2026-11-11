# v25c Wehrungs-Szenarien: Sockel im Nenner (Christophers Korrektur 9.11.)
# U1 (bisher): units = 1 + E-deg        (Sockel unpreist)
# U2:          units = 1 + E-deg + Sockel (a/e/g 0,7 | b/d/f 1,0, kein 2.-Rabatt)
# U3 (v23-pur): units = E-deg + Sockel   (kein statischer Grundpreis, Floor 0,5)
# Zielkurve (Christopher, bestaetigt): 15/20/25/30/35 fuer Waffen UND Karten.
# Outlier-Kriterium (Christopher): |Score - Ziel| > 8,0 je Rarity.
import csv
import json
import statistics as st

HERE = '/home/user/knowledge/outer-colonies'
CHEAP = {'socket_a', 'socket_e', 'socket_g'}
TGT = {1: 15.0, 2: 20.0, 3: 25.0, 4: 30.0, 5: 35.0}

socks_by_id, energy_by_id = {}, {}
with open(HERE + '/cards.csv', newline='', encoding='utf-8') as f:
    for r in csv.DictReader(f, delimiter=';', quotechar='"'):
        s = []
        for c in ['socket_a', 'socket_b', 'socket_d', 'socket_e', 'socket_f', 'socket_g']:
            v = r.get(c, '')
            if v not in ('', '0') and int(v) < 0:
                s.extend([c in CHEAP] * -int(v))
        socks_by_id[r['id']] = s
        ev = r.get('energy', '')
        energy_by_id[r['id']] = abs(int(ev)) if ev not in ('', '0') else 0
    # Beschlossene Ruecknahmen E0->E-1 (csv noch nicht gepatcht):
    for cid in ('140', '426', '522'):
        energy_by_id[cid] = 1

rows = json.load(open(HERE + '/diag_v25a_r13t.json', encoding='utf-8'))['rows']

# Finale Paket-Margins (Messung diag_v25c_r13t.json; interp. Dosen markiert)
adj = {  # id -> (margin, rarity, note)
    '349': (21.45, 1, 'hp -4 gemessen'),
    '171': (16.00, 3, 'hp -5 interp. (Bracket -3: 21,39 / -6: 13,29)'),
    '449': (10.60, 1, 'hp 21 interp. (Bracket 15: 5,00 / 25: 13,85)'),
    '240': (10.60, 1, 'hp 17 interp. (Bracket 13: 6,76 / 21: 14,36)'),
    '140': (23.44, 2, 'E-1 gemessen'),
    '426': (23.44, 2, 'E-1 gemessen'),
    '522': (20.04, 1, 'E-1 gemessen'),
    '325': (3.89, 2, 'rep 4 + hp 2 gemessen'),
    '104': (14.64, 5, 'Regel + hp 6 gemessen'),
    '166': (21.78, 1, 'v25b PzAbz -2'),
    '344': (23.75, 2, 'v25b PzAbz -2'),
    '302': (100.0, 5, 'v25b dmg 70 / E-3'),
}

objs = []
for r in rows:
    o = dict(r)
    sid = str(r['id'])
    o['socks'] = sorted(socks_by_id.get(sid, []))
    o['E'] = energy_by_id.get(sid, 0)
    o['margin'] = r['score'] * r['units']
    if sid in adj:
        m, rar, note = adj[sid]
        o['margin'] = m
        if o['kind'] == 'c':
            o['rarity'] = rar
        o['note'] = note
    objs.append(o)

def units(o, variant):
    e = o['E']
    ec = (1 + 0.7 * (e - 1)) if e >= 1 else 0
    sock = sum(0.7 if c else 1.0 for c in o['socks'])
    if variant == 'U1':
        u = 1 + ec
    elif variant == 'U2':
        u = 1 + ec + sock
    else:  # U3
        u = sock + ec
    return max(u, 0.5)

def analyse(variant):
    print(f'\n{"="*74}\n== {variant} ==')
    res = {}
    for o in objs:
        o[variant] = o['margin'] / units(o, variant)
    for kind, name in (('w', 'Waffen'), ('c', 'Karten')):
        meds = []
        for rar in range(1, 6):
            grp = [o[variant] for o in objs if o['kind'] == kind and o['rarity'] == rar]
            if grp:
                m = st.median(grp)
                meds.append(f'r{rar} {m:+.1f} (Ziel {TGT[rar]:.0f}, Diff {m-TGT[rar]:+.1f})')
        print(f'  {name}-Mediane: ' + ' | '.join(meds))
    # Outlier |Score-Ziel| > 8 je Rarity
    outs = [(o, o[variant] - TGT[o['rarity']]) for o in objs
            if abs(o[variant] - TGT[o['rarity']]) > 8.0]
    print(f'  Outlier |Score-Ziel| > 8,0: {len(outs)}')
    for o, d in sorted(outs, key=lambda x: -abs(x[1])):
        print(f"    {o['id']:4} {o['title'][:26]:28} {o['kind']} r{o['rarity']} "
              f"{o[variant]:+7.2f} vs Ziel {TGT[o['rarity']]:.0f}  Diff {d:+7.2f}")
    return res

for v in ('U1', 'U2', 'U3'):
    analyse(v)

# Detail: die Sockel- und E-Struktur der 50 Waffen unter U3
print(f'\n{"="*74}\nDetail Waffen ohne Sockel/E-Sonderfaelle unter U3:')
for o in objs:
    if o['kind'] == 'w' and len(o['socks']) == 0:
        print(f"  {o['id']} {o['title']}: keine Sockel! E={o['E']}")
