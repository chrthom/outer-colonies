# v25f-Analyse (Tausch-/Nerf-Runde Teil 2, 9.11.2026):
# U2-Scores auf Messprofil-Basis (csv #795 + Dosen + neue Varianten v25e),
# Kurve 8/10/13/16/20, Mediane je (Typ x Raritaet) + joint, 44-Zeilen-Tabelle.
# Konvention exakt wie Forts.-9-Tabelle: Energien aus csv, AUSNAHME 140/426/522
# (Dose E-1), NEU: 343 (E je Modus). Parameter: MODE_207, MODE_343, MODE_302.
import csv, json, os, statistics as st

import balancing_metric_v9 as v9

HERE = os.path.dirname(os.path.abspath(__file__))
CURVE = {1: 8.0, 2: 10.0, 3: 13.0, 4: 16.0, 5: 20.0}
CHEAP = {'socket_a', 'socket_e', 'socket_g'}

def u2_units(socks, e):
    ec = (1 + 0.7 * (e - 1)) if e >= 1 else 0
    return max(1.0 + ec + socks, 0.5)

socks_by_id, energy_by_id = {}, {}
with open(v9.CARDS_CSV, newline='', encoding='utf-8') as f:
    for r in csv.DictReader(f, delimiter=';', quotechar='"'):
        s = []
        for c in ['socket_a', 'socket_b', 'socket_d', 'socket_e', 'socket_f', 'socket_g']:
            v = r.get(c, '')
            if v not in ('', '0') and int(v) < 0:
                s.extend([c in CHEAP] * -int(v))
        socks_by_id[r['id']] = s
        ev = r.get('energy', '')
        energy_by_id[r['id']] = abs(int(ev)) if ev not in ('', '0') else 0

def build(mode_207, mode_343, mode_302):
    rows = json.load(open(HERE + '/diag_v25a_r13t.json', encoding='utf-8'))['rows']
    objs = {r['id']: dict(r) for r in rows}
    # --- Margin-Overrides (Dosen alt + neue Runde v25e) ---
    MARG = {  # (margin, quelle)
        '130': (30.02, '130pzx'), '182': (38.60, '182s5'), '184': (4.86, '184hp4'),
        '216': (34.46, '216pz6'), '349': (26.70, '349hp0'), '406': (35.13, '406hp7'),
        '412': (14.61, '412pd5'), '104': (21.12, '104hp10'), '325': (3.89, '325hp2'),
        '171': (16.00, '171hp-5 interp'), '449': (10.60, '449hp25'), '240': (10.60, '240hp21'),
        '140': (23.44, '140e1'), '426': (23.44, '426e1'), '522': (20.04, '522e1'),
        '166': (21.78, '166pz2'), '344': (23.75, '344pz2'), '302': (100.01, '302d70'),
    }
    if mode_207 == 'pz3':
        MARG['207'] = (33.82, '207pz3')
    # --- Raritaets-Overrides: #795 ist schon in csv; hier Tausche + Dosen ---
    RAR = {'180': 2, '325': 1, '237': 2, '224': 1, '412': 2, '151': 3,
           '109': 3, '223': 4, '406': 4, '207': 5, '104': 4, '115': 5, '171': 3}
    # --- Energie-Overrides ---
    E = {}
    for cid in ('140', '426', '522'):
        E[cid] = 1
    E['343'] = 2 if mode_343 == 'e2' else 3
    if mode_302 == 'e3dose':
        E['302'] = 3
    out = []
    for cid, r in objs.items():
        m, src = MARG.get(cid, (r['margin'], 'base'))
        rar = RAR.get(cid, r['rarity'])
        e = E.get(cid, energy_by_id.get(cid, 0))
        u = u2_units(sum(0.7 if c else 1.0 for c in socks_by_id.get(cid, [])), e)
        out.append(dict(id=cid, title=r['title'], kind=r['kind'], rarity=rar,
                        margin=m, src=src, units=u, score=m / u))
    return out

if __name__ == '__main__':
    import sys
    m207, m343, m302 = (sys.argv[1:4] + ['pz3', 'e2', 'e6'] * 4)[:3]
    objs = build(m207, m343, m302)
    print(f"MODUS: 207={m207} 343={m343} 302={m302}")
    for kind, name in (('w', 'Waffen'), ('c', 'Karten')):
        seq = []
        for rar in range(1, 6):
            grp = [o['score'] for o in objs if o['kind'] == kind and o['rarity'] == rar]
            seq.append(f"r{rar} {st.median(grp):6.2f} (N {len(grp)})" if grp else f"r{rar}  --    (N 0)")
        print(f"{name}: " + ' | '.join(seq))
    for rar in range(1, 6):
        grp = [o['score'] for o in objs if o['rarity'] == rar]
        print(f"JOINT r{rar}: {st.median(grp):6.2f} (N {len(grp)})")
    # 44er-Tabelle
    IDS = ['179','340','180','237','182','234','168','339','167','130','151','150',
           '343','421','344','424','420','224','422','216','223','318','126','412',
           '125','207','209','101','409','304','302','106','203','184','349','170',
           '537','325','140','426','109','115','406','104']
    byid = {o['id']: o for o in objs}
    tbl = sorted((byid[i] for i in IDS), key=lambda o: -(o['score'] - CURVE[o['rarity']]))
    for o in tbl:
        print(f"{o['id']:>4} {o['title'][:26]:28} r{o['rarity']} m={o['margin']:7.2f} u={o['units']:4.1f} score={o['score']:7.2f} abw={o['score']-CURVE[o['rarity']]:+7.2f} [{o['src']}]")
