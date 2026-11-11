# v25c-Auswertung: reine Rechenanalysen auf diag_v25a_r13t.json
# (1) E-Waehrung degressiv statt linear, (2) gamma-Szenarien,
# (3) 171-Tausch-Arithmetik, (4) 104/163-Check.
import json
import statistics as st

HERE = '/home/user/knowledge/outer-colonies'
rows = json.load(open(HERE + '/diag_v25a_r13t.json', encoding='utf-8'))['rows']
rows = [r for r in rows if r['id'] not in ('325', '104')]  # Sonderobjekte ohne Basisframe
for r in rows:
    r['units_lin'] = r['units']
    r['E'] = r['units_lin'] - 1  # |E| (v25: units = 1 + |E<0|)

def stats(objs, key='score'):
    out = {}
    for kind in ('w', 'c'):
        for rar in range(1, 6):
            grp = [r for r in objs if r['kind'] == kind and r['rarity'] == rar]
            if grp:
                out[(kind, rar)] = st.median(r[key] for r in grp)
    return out

def resid_table(objs, med, key='score'):
    out = []
    for r in objs:
        m = med.get((r['kind'], r['rarity']))
        if m is None:
            continue
        out.append((r['id'], r['title'], r['kind'], r['rarity'],
                    round(r[key], 2), round(r[key] - m, 2)))
    return out

def sd_outliers(objs, med, key='score'):
    res = [(r[key] - med[(r['kind'], r['rarity'])], r) for r in objs
           if (r['kind'], r['rarity']) in med]
    for kind in ('w', 'c'):
        vals = [v for v, r in res if r['kind'] == kind]
        sd = st.pstdev(vals)
        print(f'  SD_{kind} = {sd:.2f}  Schwelle 0.5*SD = {sd/2:.2f}'
              f'  Outlier |resid|>Schwelle: {sum(1 for v in vals if abs(v) > sd/2)}')

def show_med(med, tag):
    print(f'  [{tag}] Waffen-Mediane: ' +
          ' '.join(f"r{r}={med.get(('w', r), float('nan')):+.2f}" for r in range(1, 6)))
    print(f'  [{tag}] Karten-Mediane: ' +
          ' '.join(f"r{r}={med.get(('c', r), 0):+.2f}" for r in range(1, 6)))
    wm = [med.get(('w', r)) for r in range(1, 6)]
    cm = [med.get(('c', r)) for r in range(1, 6)]
    print(f'  [{tag}] Waffen monoton: {all(wm[i] <= wm[i+1] for i in range(4) if wm[i] and wm[i+1])}' +
          f' | Karten monoton (r1<r2<r4<r5): True' if False else '')

def mono(med):
    wm = [med.get(('w', r)) for r in range(1, 6)]
    cm = [med.get(('c', r)) for r in (1, 2, 4, 5)]
    def mono_p(l):
        l = [x for x in l if x is not None]
        return all(l[i] <= l[i+1] + 1e-9 for i in range(len(l)-1))
    return mono_p(wm), mono_p(cm)

print('=' * 72)
print('(0) Baseline v25a (linear, gamma=1) — Verifikation')
med0 = stats(rows)
show_med(med0, 'v25a')
sd_outliers(rows, med0)
mw, mc = mono(med0)
print(f'  monoton: Waffen={mw} Karten={mc}')

# ---------- (1) E-Waehrung degressiv ----------
print()
print('=' * 72)
print('(1) E-Waehrung degressiv: E-Kosten = 1 + 0.7*(E-1) statt E linear')
for r in rows:
    e = r['E']
    e_cost = 0 if e < 1 else 1 + 0.7 * (e - 1)
    r['units_deg'] = 1 + e_cost
    r['score_deg'] = r['margin'] / r['units_deg']
changed = [r for r in rows if r['units_deg'] != r['units_lin']]
print(f'  betroffen: {len(changed)} Objekte (E>=1)')
for r in sorted(changed, key=lambda r: -r['E'])[:12]:
    print(f"    {r['id']} {r['title'][:28]:30} E={r['E']:.0f} "
          f"units {r['units_lin']:.1f}->{r['units_deg']:.1f} "
          f"score {r['score']:+.2f} -> {r['score_deg']:+.2f}")
med1 = stats(rows, 'score_deg')
show_med(med1, 'deg')
sd_outliers(rows, med1, 'score_deg')
mw1, mc1 = mono(med1)
print(f'  monoton: Waffen={mw1} Karten={mc1}')
res0 = resid_table(rows, med0)
res1 = resid_table(rows, med1, 'score_deg')
d0 = {x[0]: x for x in res0}
fixed = []
for x in res1:
    y = d0[x[0]]
    sd_c = 6.33  # Karten-Schwelle Baseline
    sd_w = 3.30
    thr = sd_w if x[2] == 'w' else sd_c
    if abs(y[5]) > thr and abs(x[5]) <= thr:
        fixed.append((x[0], x[1], y[5], x[5]))
print(f'  Outlier -> Band gewandelt (vs. Baseline-Schwellen): {len(fixed)}')
for f in sorted(fixed, key=lambda f: -abs(f[2])):
    print(f"    {f[0]} {f[1][:30]:32} resid {f[2]:+.2f} -> {f[3]:+.2f}")

# ---------- (2) gamma-Szenarien ----------
print()
print('=' * 72)
print('(2) gamma-Szenarien: score(gamma) = (d_hp + d_col + d_ctrl + gamma*d_dealt)/units')
for g in (1.0, 0.75, 0.5):
    for r in rows:
        r[f'score_g{g}'] = (r['d_hp'] + r['d_col'] + r['d_ctrl'] + g * r['d_dealt']) / r['units']
    medg = stats(rows, f'score_g{g}')
    print(f'  gamma={g}:')
    show_med(medg, f'g{g}')
    sd_outliers(rows, medg, f'score_g{g}')
    mwg, mcg = mono(medg)
    print(f'  monoton: Waffen={mwg} Karten={mcg}')
    print()

# ---------- (3) 171-Tausch ----------
print('=' * 72)
print('(3) 171-Tausch (r1 -> r2/r3): reine Median-Arithmetik')
cards = [r for r in rows if r['kind'] == 'c']
s171 = next(r for r in rows if r['id'] == '171')
print(f"  171 {s171['title']}: score {s171['score']:+.2f}")
for rar in (1, 2, 3, 4):
    grp = [r for r in cards if r['rarity'] == rar]
    print(f'  Karten r{rar}: n={len(grp)} ' +
          ' '.join(f"{r['id']}({r['score']:+.1f})" for r in sorted(grp, key=lambda r: -r['score'])))
# Optionen
r1s = [r['score'] for r in cards if r['rarity'] == 1]
r2s = [r['score'] for r in cards if r['rarity'] == 2]
r1_wo = [v for v in r1s if v != s171['score']]
r2_wo171 = st.median(r2s + [s171['score']])
r1_wo171 = st.median(r1_wo)
print(f'  171 -> r2: r1-Median {st.median(r1s):+.2f} -> {r1_wo171:+.2f}; '
      f'r2-Median {st.median(r2s):+.2f} -> {r2_wo171:+.2f}')
print(f'  171 -> r3: r3 = {{171}} -> Median {s171["score"]:+.2f}; '
      f'r1-Median -> {r1_wo171:+.2f}')
# Partner-Swaps: 171 -> rX und Partner (rX) -> r1
print('  Partner-Swap 171<->P (P aus r2, P -> r1):')
sd_c = 6.33
for P in [r for r in cards if r['rarity'] == 2]:
    newr2 = sorted([v for v in r2s if v != P['score']] + [s171['score']])
    newr1 = sorted(r1s + [P['score']])
    m1, m2 = st.median(newr1), st.median(newr2)
    resP = P['score'] - m1
    res171 = s171['score'] - m2
    flag = 'BEIDE Band' if abs(resP) <= sd_c and abs(res171) <= sd_c else ''
    print(f"    P={P['id']} {P['title'][:26]:28} P->r1 resid {resP:+.2f}, "
          f"171->r2 resid {res171:+.2f}  r1={m1:+.2f} r2={m2:+.2f} {flag}")

# ---------- (4) 104/163-Check ----------
print()
print('=' * 72)
in_set = [r['id'] for r in rows]
print(f"(4) 163 im Messset: {'163' in in_set}")
full_rows = [r['id'] for r in json.load(
    open(HERE + '/diag_v25a_r13t.json', encoding='utf-8'))['rows']]
print(f"    163 im vollen v25a-Set (inkl. 325/104): {'163' in full_rows}")
