# diag_playcost_r13t.py — Spielkosten-Analyse (Christophers Empfehlung:
# statische Kosten +1 auf alle Karten, 6.11.2026). Reine Post-Processing-
# Auswertung der gesicherten v22-Ergebnisse (diag_random_r13t.json) +
# cards.csv: Die Gains aendern sich NICHT (keine Simulation), nur die
# Kosten-Normierung Score = Gain/units -> Gain/(units+1).
# Achtung: DIESES Skript hat KEINEN Import-Schutz — nie importieren!
# v11 selbst ist __main__-geschuetzt und darf importiert werden.

import json
import statistics as st

res = json.load(open('diag_random_r13t.json'))
w_sc = {w['id']: w for w in res['weapons']}
c_sc = {c['id']: c for c in res['cards']}

import balancing_metric_v11 as v11  # noqa: E402 (CWD = knowledge-Ordner)


def e_cost(e):
    """Einsatzkosten v3 der Energie (Verbrauch)."""
    return 0 if e < 1 else 1 + 0.7 * (e - 1)


def _ranks(vals):
    order = sorted(range(len(vals)), key=lambda i: vals[i])
    r = [0.0] * len(vals)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and vals[order[j + 1]] == vals[order[i]]:
            j += 1
        avg = (i + j) / 2 + 1
        for k in range(i, j + 1):
            r[order[k]] = avg
        i = j + 1
    return r


def spearman(a, b):
    """Spearman-Rangkorrelation (mit Tie-Behandlung)."""
    ra, rb = _ranks(a), _ranks(b)
    n = len(a)
    ma = sum(ra) / n
    mb = sum(rb) / n
    num = sum((ra[i] - ma) * (rb[i] - mb) for i in range(n))
    da = sum((x - ma) ** 2 for x in ra) ** 0.5
    db = sum((x - mb) ** 2 for x in rb) ** 0.5
    return num / (da * db) if da and db else 1.0


print('=== 1) Waffen: units alt -> neu (Spielkosten +1) ===')
wtab = []
for w in sorted(v11.weapons, key=lambda x: int(x['id'])):
    raw = w['socket_cost'] + e_cost(w['energy'])
    old = raw if raw > 0 else 0.5   # v11.weapon_units: (raw) or 0.5
    new = raw + 1.0                 # Spielkosten-Modell: roh + 1 (Floor entfaellt)
    s_old = w_sc[w['id']]['score']
    s_new = s_old * old / new
    wtab.append(dict(id=w['id'], title=w['title'], rarity=w['rarity'],
                     u_old=old, u_new=new, s_old=s_old, s_new=s_new,
                     f=old / new))
zero_floor = [t for t in wtab if t['u_old'] == 0.5]
print(f'n={len(wtab)} Waffen; Floor-Faelle (raw=0, bisher 0,5): {len(zero_floor)}')

med_old, med_new = {}, {}
for r in range(1, 6):
    so = [t['s_old'] for t in wtab if t['rarity'] == r]
    sn = [t['s_new'] for t in wtab if t['rarity'] == r]
    med_old[r] = st.median(so)
    med_new[r] = st.median(sn)
print('Waffen-Mediane alt :', ' '.join(f'r{r} {med_old[r]:.2f}' for r in range(1, 6)))
print('Waffen-Mediane neu :', ' '.join(f'r{r} {med_new[r]:.2f}' for r in range(1, 6)))
rho_w = spearman([t['s_old'] for t in wtab], [t['s_new'] for t in wtab])
print(f'Spearman alt vs neu (Waffen): {rho_w:.3f}')
big = sorted(wtab, key=lambda t: t['s_new'] - t['s_old'])
print('Staerkste Verlierer:')
for t in big[:5]:
    print(f"  {t['id']} {t['title'][:26]:<26} units {t['u_old']:.1f}->{t['u_new']:.1f}"
          f" Score {t['s_old']:.2f}->{t['s_new']:.2f} (Faktor {t['f']:.2f})")
print('Staerkste relative Gewinner (Faktor hoechstens 1):')
for t in sorted(wtab, key=lambda t: -t['f'])[:5]:
    print(f"  {t['id']} {t['title'][:26]:<26} units {t['u_old']:.1f}->{t['u_new']:.1f}"
          f" Score {t['s_old']:.2f}->{t['s_new']:.2f} (Faktor {t['f']:.2f})")

print()
print('=== 2) Statkarten: units alt -> neu ===')
ctab = []
for c in sorted(v11.cards, key=lambda x: int(x['id'])):
    old = c['units']
    new = old + 1.0
    s_old = c_sc[c['id']]['score']
    s_new = s_old * old / new
    ctab.append(dict(id=c['id'], title=c['title'], rarity=c['rarity'],
                     u_old=old, u_new=new, s_old=s_old, s_new=s_new))
cmed_old, cmed_new = {}, {}
for r in range(1, 6):
    so = [t['s_old'] for t in ctab if t['rarity'] == r]
    sn = [t['s_new'] for t in ctab if t['rarity'] == r]
    cmed_old[r] = st.median(so) if so else None
    cmed_new[r] = st.median(sn) if sn else None
print(f"{'id':>4} {'Karte':<28} {'r':>2} {'units':>9} {'Score alt':>9} {'neu':>6} {'Fakt':>5} {'Ratio alt':>9} {'neu':>6}")
for t in ctab:
    r = t['rarity']
    ro = t['s_old'] / med_old[r] if med_old[r] else 0
    rn = t['s_new'] / med_new[r] if med_new[r] else 0
    print(f"{t['id']:>4} {t['title'][:27]:<28} r{r} {t['u_old']:>4.1f}->{t['u_new']:<4.1f}"
          f" {t['s_old']:>9.2f} {t['s_new']:>6.2f} {t['u_old']/t['u_new']:>5.2f}"
          f" {ro:>9.2f} {rn:>6.2f}")

print()
print('=== 3) Wirtschaftskarten (Energie-Quotient, cards.csv) ===')
import csv as _csv  # noqa: E402
SOCKET_COLS = ('socket_a', 'socket_b', 'socket_d', 'socket_e', 'socket_f', 'socket_g')


def socket_cost_v3(row):
    socks = []
    for col in SOCKET_COLS:
        v = (row[col] or '').strip()
        if v.lstrip('-').isdigit():
            n = int(v)
            if n < 0:
                socks.extend([col in ('socket_a', 'socket_e', 'socket_g')] * -n)
    socks.sort()
    return (((0.7 if socks[0] else 1.0) if socks else 0)
            + sum((0.5 if s else 0.7) for s in socks[1:]))


ecards = []
with open('cards.csv', newline='', encoding='utf-8') as f:
    for row in _csv.DictReader(f, delimiter=';', quotechar='"'):
        if row['implemented'] != 'yes' or row['type'] != 'infrastructure':
            continue
        e_out = (row['energy'] or '').strip()
        if not e_out.isdigit() or int(e_out) < 1:
            continue
        sc = socket_cost_v3(row)
        ecards.append(dict(id=row['id'], title=row['title'],
                           rarity=int(row['rarity'] or 0) if (row['rarity'] or '').strip().isdigit() else 0,
                           e=int(e_out), sc=sc))
print(f"{'id':>4} {'Karte':<22} {'r':>2} {'E':>2} {'SockK':>5} {'units alt':>9} {'Q alt':>6} {'units neu':>9} {'Q neu':>6}")
for c in sorted(ecards, key=lambda x: (int(x['id']))):
    u_old = c['sc']
    u_new = c['sc'] + 1.0
    q_old = c['e'] / u_old if u_old else float('inf')
    q_new = c['e'] / u_new
    print(f"{c['id']:>4} {c['title'][:21]:<22} r{c['rarity']} {c['e']:>2} {c['sc']:>5.1f}"
          f" {u_old:>9.1f} {(('inf' if q_old == float('inf') else f'{q_old:.2f}')):>6}"
          f" {u_new:>9.1f} {q_new:>6.2f}")

print()
print('=== 4) Kalibrierung: statisches Gewicht w (Atomreaktor vs Solarpanele) ===')
print('Atomreaktor (2E, 1 Omega-Sockel 0,7) schlaegt Solarpanele (1E, sockelfrei) iff:')
print('  2/(0,7+w) >= 1/w  <=>  w >= 0,7')
for w in (0.5, 0.7, 0.8, 1.0, 1.5):
    qa = 2 / (0.7 + w)
    qs = 1 / w
    print(f'  w={w:.1f}: Q(Atomreaktor)={qa:.2f}  Q(Solarpanele)={qs:.2f}'
          f'  -> {"Atomreaktor" if qa >= qs else "Solarpanele"} besser')
