# v25c-Szenarien: Sockel-Preise und E-Waehrung, reine Rechnung auf diag_v25a_r13t.json
# S0: units = 1+|E| linear (Ist-Zustand)
# S1: + E degressiv (1 + [1+0.7*(E-1)]), Sockel unpreist
# S2: S1 + Sockel VOLL (billig 0,7 / teuer 1,0, kein 2.-Sockel-Rabatt)
# S2d: S1 + Sockel mit v23-Rabatt (2.+ Sockel billig 0,5 / teuer 0,7)
import csv
import json
import statistics as st

HERE = '/home/user/knowledge/outer-colonies'
CHEAP = {'socket_a', 'socket_e', 'socket_g'}

socks_by_id, energy_by_id, typ_by_id = {}, {}, {}
with open(HERE + '/cards.csv', newline='', encoding='utf-8') as f:
    for r in csv.DictReader(f, delimiter=';', quotechar='"'):
        socks = []
        for c in CHEAP | {'socket_b', 'socket_d', 'socket_f'}:
            v = r.get(c, '')
            if v not in ('', '0') and int(v) < 0:
                socks.extend([c in CHEAP] * -int(v))
        socks_by_id[r['id']] = socks
        ev = r.get('energy', '')
        energy_by_id[r['id']] = abs(int(ev)) if ev not in ('', '0') else 0

rows = json.load(open(HERE + '/diag_v25a_r13t.json', encoding='utf-8'))['rows']
for r in rows:
    sid = str(r['id'])
    r['E'] = r['units'] - 1
    assert r['E'] == energy_by_id.get(sid, 0) or sid in ('104',), (sid, r['E'])
    r['socks'] = socks_by_id.get(sid, [])
    r['margin'] = r['score'] * r['units']
    assert abs(r['margin'] - r['score'] * (1 + r['E'])) < 1e-6 or sid == '104', sid

def units_v25(r, e_deg=True, socks_mode=None):
    e = r['E']
    ec = (1 + 0.7 * (e - 1)) if (e_deg and e >= 1) else e
    u = 1 + ec
    if socks_mode:
        s = sorted(r['socks'])  # teuer (False) zuerst wie v10
        if s:
            if socks_mode == 'voll':
                u += sum(0.7 if c else 1.0 for c in s)
            else:  # v23-Rabatt
                u += (0.7 if s[0] else 1.0) + sum(0.5 if c else 0.7 for c in s[1:])
    return u

def med(objs, key):
    out = {}
    for kind in ('w', 'c'):
        for rar in range(1, 6):
            grp = [r[key] for r in objs if r['kind'] == kind and r['rarity'] == rar]
            if grp:
                out[(kind, rar)] = st.median(grp)
    return out

def analyse(objs, key, tag, detail_ids=()):
    m = med(objs, key)
    print(f'\n== {tag} ==')
    print('  W-Mediane: ' + ' '.join(f'r{i}={m.get(("w",i),0):+.2f}' for i in range(1, 6)))
    print('  K-Mediane: ' + ' '.join(f'r{i}={m.get(("c",i),0):+.2f}' for i in range(1, 6)))
    for kind, name in (('w', 'Waffen'), ('c', 'Karten')):
        vals = [r[key] - m[(r['kind'], r['rarity'])] for r in objs
                  if r['kind'] == kind and (r['kind'], r['rarity']) in m]
        s = st.stdev(vals)
        outs = sorted([(r['id'], round(r[key] - m[(r['kind'], r['rarity'])], 2))
                       for r in objs if r['kind'] == kind
                       and (r['kind'], r['rarity']) in m
                       and abs(r[key] - m[(r['kind'], r['rarity'])]) > s / 2],
                      key=lambda x: -abs(x[1]))
        wm = [m.get(('w', i)) for i in range(1, 6)]
        mono_w = all(wm[i] <= wm[i+1] for i in range(4))
        print(f'  SD_{name[0]}={s:.2f} (0,5xSD={s/2:.2f}) Outlier={len(outs)}'
              + (f' monoton=True' if kind == 'w' and mono_w else ''))
        if kind == 'w' and not mono_w:
            print('  Waffen NICHT monoton')
        if outs:
            print('    ' + ' '.join(f'{i}({v:+.1f})' for i, v in outs))
    if detail_ids:
        print('  Detail:')
        for r in sorted(objs, key=lambda r: str(r['id'])):
            if str(r['id']) in detail_ids:
                mm = m.get((r['kind'], r['rarity']), 0)
                print(f"    {r['id']:4} {r['title'][:24]:26} r{r['rarity']} units={r['units']:.1f}"
                      f"->{r[key+'_u'] if key+'_u' in r else '':.1f}" if False else
                      f"    {r['id']:4} {r['title'][:24]:26} r{r['rarity']} "
                      f"score {r['score']:+.2f} -> {r[key]:+.2f} (resid {r[key]-mm:+.2f})")

def scenario(tag, e_deg, socks_mode, detail_ids=()):
    for r in rows:
        u = units_v25(r, e_deg, socks_mode)
        r['sc'] = r['margin'] / u
        r['sc_u'] = u
    analyse(rows, 'sc', tag, detail_ids)
    return med(rows, 'sc')

multi = [r for r in rows if len(r['socks']) >= 2]
print('Multi-Sockel-Objekte im Messset:')
for r in sorted(multi, key=lambda r: (r['kind'], str(r['id']))):
    print(f"  {r['id']:4} {r['title'][:24]:26} r{r['rarity']} {r['kind']} Sockel="
          + '/'.join('billig' if c else 'teuer' for c in sorted(r['socks']))
          + f" score {r['score']:+.2f}")
w1 = [r for r in rows if r['kind'] == 'w' and len(r['socks']) == 1]
print(f'Waffen mit genau 1 Sockel: {[(r["id"], r["score"]) for r in w1]}')

DET = {'349', '171', '163', '240', '449', '104', '325', '103', '115', '109', '406',
       '140', '426', '522', '537', '184', '170', '161', '341', '302', '106', '310', '126'}
m0 = scenario('S0: Ist (1+|E| linear, Sockel unpreist)', False, None, DET)
m1 = scenario('S1: E degressiv (Sockel unpreist)', True, None, DET)
m2 = scenario('S2: E degressiv + Sockel VOLL (0,7/1,0)', True, 'voll', DET)
m2d = scenario('S2d: E degressiv + Sockel mit v23-Rabatt', True, 'rabatt', DET)
