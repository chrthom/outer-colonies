# v25d Anker-Analyse (Christophers Rueckfragen 9.11.):
# A) Grundpreis-Frage: U2 (A=1) / U2a (A=0,5) / U3 (A=0) / U1 (sockelfrei, Referenz)
#    - Mediane je (kind, rarity), Monotonie, Outlier gegen BESCHLOSSENE Kurve 15/20/25/30/35
#    - intrinsische Streuung: Outlier gegen je-EIGENE Median-Kurve (Dosen-Status gleich)
#    - Faktor U2/U3 je Objekt: ist die Senkung einheitlich (~40 %) oder strukturabhaengig?
# B) 104-Tausch auf r3: Slot-Matrix aller Karten unter U3 (Abweichung gegen jedes Ziel),
#    um Tauschkandidaten (wer rueckt auf r5? passt 103?) zu belegen.
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
    for cid in ('140', '426', '522'):
        energy_by_id[cid] = 1

rows = json.load(open(HERE + '/diag_v25a_r13t.json', encoding='utf-8'))['rows']

adj = {
    '349': (21.45, 1), '171': (16.00, 3), '449': (10.60, 1), '240': (10.60, 1),
    '140': (23.44, 2), '426': (23.44, 2), '522': (20.04, 1), '325': (3.89, 2),
    '104': (14.64, 5), '166': (21.78, 1), '344': (23.75, 2), '302': (100.0, 5),
}

objs = []
for r in rows:
    o = dict(r)
    sid = str(r['id'])
    o['socks'] = sorted(socks_by_id.get(sid, []))
    o['E'] = energy_by_id.get(sid, 0)
    o['margin'] = r['score'] * r['units']
    if sid in adj:
        m, rar = adj[sid]
        o['margin'] = m
        if o['kind'] == 'c':
            o['rarity'] = rar
    objs.append(o)

def units(o, variant):
    e = o['E']
    ec = (1 + 0.7 * (e - 1)) if e >= 1 else 0
    sock = sum(0.7 if c else 1.0 for c in o['socks'])
    if variant == 'U1':
        u = 1 + ec
    else:
        u = {'U2': 1.0, 'U2a': 0.5, 'U3': 0.0}[variant] + ec + sock
    return max(u, 0.5)

def med_by_cell(variant):
    res = {}
    for kind in ('w', 'c'):
        for rar in range(1, 6):
            grp = [o[variant] for o in objs if o['kind'] == kind and o['rarity'] == rar]
            if grp:
                res[(kind, rar)] = st.median(grp)
    return res

print('=' * 78)
print('A) WAEHRUNGSSZENARIEN  (Dosen-Paket identisch in allen Wahrungen)')
for v in ('U1', 'U2', 'U2a', 'U3'):
    for o in objs:
        o[v] = o['margin'] / units(o, v)
    meds = med_by_cell(v)
    print(f'\n== {v} ==  (U2a = Kompromiss Grundpreis 0,5)')
    for kind, name in (('w', 'Waffen'), ('c', 'Karten')):
        vals = [meds.get((kind, r)) for r in range(1, 6) if (kind, r) in meds]
        seq = ' '.join(f'r{r} {meds[(kind, r)]:+6.1f}' for r in range(1, 6) if (kind, r) in meds)
        mono = all(vals[i] < vals[i + 1] for i in range(len(vals) - 1))
        print(f'   {name}: {seq}   monoton: {"JA" if mono else "NEIN"}')
    out_conf = [o for o in objs if abs(o[v] - TGT[o['rarity']]) > 8.0]
    own = 0
    for kind in ('w', 'c'):
        for rar in range(1, 6):
            m = meds.get((kind, rar))
            if m is None:
                continue
            for o in objs:
                if o['kind'] == kind and o['rarity'] == rar and abs(o[v] - m) > 8.0:
                    own += 1
    print(f'   Outlier gegen beschlossene Kurve: {len(out_conf)} | gegen EIGENE Median-Kurve: {own}')

print('\n== Faktor U2/U3 je Objekt (senkt U2 einheitlich ~40 %?) ==')
facs = [(1 - o['U2'] / o['U3'], o) for o in objs]
facs.sort(key=lambda x: x[0])
for pct, o in [facs[0], facs[len(facs) // 4], facs[len(facs) // 2], facs[-1]]:
    u3 = sum(0.7 if c else 1.0 for c in o['socks']) + ((1 + 0.7 * (o['E'] - 1)) if o['E'] >= 1 else 0)
    print(f"   {o['id']:4} {o['title'][:28]:30} U3-units {u3:4.1f}  Senkung {pct * 100:+5.1f} %")
import statistics as s2
allf = [f for f, _ in facs]
print(f'   Spannweite der Senkung: {min(allf) * 100:+.1f} % bis {max(allf) * 100:+.1f} %  (Median {s2.median(allf) * 100:+.1f} %)')

print()
print('=' * 78)
print("B) SLOT-MATRIX KARTEN unter U3: Abweichung gegen jedes Raritaetsziel")
print('   (Dosen-Paket eingerechnet; Ziel in Klammern)')
cards = [o for o in objs if o['kind'] == 'c']
for rar_cur in range(1, 6):
    grp = [o for o in cards if o['rarity'] == rar_cur]
    for o in sorted(grp, key=lambda x: -x['U3']):
        devs = ' '.join(f"r{r} {o['U3'] - TGT[r]:+7.1f}" for r in range(1, 6))
        best = min(range(1, 6), key=lambda r: abs(o['U3'] - TGT[r]))
        print(f"   {o['id']:4} {o['title'][:26]:28} (ist r{rar_cur})  {devs}   bester Slot: r{best}")
