#!/usr/bin/env python3
# ============================================================================
# diag_revert_r13t.py — Neu-Simulation im Ruecknahme-Frame (Christophers
# Beschluesse 8.11.2026) + X-Korrektur + Tausch mit csv-Werten.
#
# Christophers Beschluesse:
#   (1) Ruecknahmen Kategorie A (6: 106,107,303,310,343,405) — JA
#   (2) Ruecknahmen Kategorie C (15) — JA, ALLE zuruecknehmen
#   (3) Kategorie-B-Overrides (8: 101,126,151,180,207,302,304,438) — BEHALTEN
#   (4) Tauschpaare NOCHMAL mit csv-Werten zeigen (neue Abweichungen)
#   (5) Nochmal simulieren (neuer Soll-Frame) und evtl. Kurve anpassen
#   (X-Korrektur: Abzug X ist NICHT identisch zu Abzug >= dmg — numerischer
#    Abzug == dmg deaktiviert die Defense-Karte (used), X laesst sie aktiv.
#    Die fruehere 'X-neutral'-Klassifikation war falsch; X-Karten werden
#    hier gegen csv-Numerik GEMESSEN.)
#
# NEUER SOLL-ZUSTAND:
#   Waffen: 21 Ruecknahmen auf cards.csv + beschlossene Hebel
#           (318 dmg16/TAbz8, 412 dmg10, 347 dmg4/SAbz X bleibt)
#           + 8 B-Overrides + 5 X-Formen (157/166/179/344/347)
#   Stat:   406 hp4, 349 hp1, 434 hp0 (Gefecht), 140/109 E-Hebel (nur units)
#   Offen (unentschieden, ORIG gemessen): 103/223/312/537/522
#
# TEIL 1: Standard-Raritaeten, alle 69 Karten in SOLL-Form + 5 X-csv-Extra-
#         Jobs (csv-Numerik statt X) → neue Mediane (Kurvenabgleich v23c)
#         + Outlier gegen v23c.
# TEIL 2: Tausch-Szenario (8 Raritaeten gepatcht), Tauschkarten in
#         csv/SOLL-Form → Abweichungen gegen die NEUEN Ziele.
# CRN: N=10000 (DIAG_N), random.seed(42) je Teil, gepaarte Deltamessung.
# Sonde wird NICHT importiert: exec bis Marker mit G-dict.
# ============================================================================
import json
import os
import random
import statistics
import time

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
N = int(os.environ.get('DIAG_N', '10000'))
CKPT_EVERY = 2000
CKPT_PATH = 'diag_revert_ckpt_v23d_r13t.json'
OUT_PATH = 'diag_revert_v23d_r13t.json'
THRESH = 0.5

t0 = time.time()
SRC = open('diag_random_r13t.py', encoding='utf-8').read()
CUT = SRC.index('# ---------------- Messung mit Checkpoint')
G = {'__name__': 'r13t_defs', '__file__': os.path.join(HERE, 'diag_random_r13t.py')}
exec(compile(SRC[:CUT], 'diag_random_r13t.py', 'exec'), G)

v11 = G['v11']
v10 = G['v10']
ws, cs = G['ws'], G['cs']
W = {w['id']: w for w in ws}
C = {c['id']: c for c in cs}
battle_r = G['battle_r']
draw_random_battle = G['draw_random_battle']
acc_side = G['acc_side']
CREQ = G['CREQ']
HP_STATIC = v11.HP_STATIC                                  # 1.0
# Christophers Zielkurve v23e (8.11.2026, eigene Glaettung der v23d-Mediane
# 1,82/1,63/1,88/2,60/2,95): r1 1,6 / r2 1,8 / r3 2,1 / r4 2,5 / r5 3,0,
# Band zurueck auf +-0,5 (wie die fruehere Outlier-Analyse).
TARGETS = {1: 1.6, 2: 1.8, 3: 2.1, 4: 2.5, 5: 3.0}
WCSV = {w['id']: w for w in v10.load_attackers(final=False)}

# ------------------------------------------------- Soll-Konfiguration ---
REVERT = {'106', '107', '303', '310', '343', '405',             # Kat. A
          '125', '127', '150', '167', '168', '203', '224',     # Kat. C
          '234', '339', '340', '409', '420', '421', '424', '441'}
assert len(REVERT) == 21
X_CARDS = {'157', '166', '179', '344', '347'}                  # X-Form bleibt


def wcsv_spec(cid):
    """Override zurueckgenommen: v11-Waffe mit csv-Werten (damage/energy/abz),
    r1_col neu berechnet (haengt von damage+abz ab)."""
    s = dict(W[cid])
    wc = WCSV[cid]
    s['damage'] = wc['damage']
    s['energy'] = wc['energy']
    s['abz'] = dict(wc['abz'])
    s['r1_col'] = v10.colony_r1(s)
    return s


def wvar(base, dmg=None, sh=None, ar=None, pd_=None, e=None, units=None):
    s = dict(base)
    if (dmg, sh, ar, pd_, e, units) != (None, None, None, None, None, None):
        s['abz'] = dict(base['abz'])
        if sh is not None:
            s['abz']['shield'] = sh
        if ar is not None:
            s['abz']['armour'] = ar
        if pd_ is not None:
            s['abz']['pd'] = pd_
    if dmg is not None:
        s['damage'] = dmg
    if e is not None:
        s['energy'] = e
    if units is not None:
        s['units'] = units
    if dmg is not None or sh is not None or ar is not None or pd_ is not None:
        s['r1_col'] = v10.colony_r1(s)
    return s


def cvar(base, hp=None, units=None):
    s = dict(base)
    if hp is not None:
        s['hp'] = hp
    if units is not None:
        s['units'] = units
    return s


# Waffen-Soll
WSOLL = {}
for w in ws:
    cid = w['id']
    if cid in REVERT:
        WSOLL[cid] = wcsv_spec(cid)
    elif cid == '318':
        WSOLL[cid] = wvar(w, dmg=16, pd_=8)          # Beschluss: dmg16+TAbz8
    elif cid == '412':
        WSOLL[cid] = wvar(w, dmg=10)                # Beschluss: dmg 10
    elif cid == '347':
        WSOLL[cid] = wvar(w, dmg=4)                 # Beschluss: dmg 4, X bleibt
    else:
        WSOLL[cid] = dict(w)

# Stat-Soll
CSOLL = {}
for c in cs:
    cid = c['id']
    if cid == '406':
        CSOLL[cid] = cvar(c, hp=4)                  # Beschluss: hp 7->4
    elif cid == '349':
        CSOLL[cid] = cvar(c, hp=1)                  # Beschluss: hp 4->1
    elif cid == '434':
        CSOLL[cid] = cvar(c, hp=0)                  # Beschluss: hp -3 -> 0
    elif cid == '140':
        CSOLL[cid] = cvar(c, units=1.7)            # Beschluss: E -2 -> -1
    elif cid == '109':
        CSOLL[cid] = cvar(c, units=1.7)            # Beschluss: E -3 -> -1
    else:
        CSOLL[cid] = dict(c)

# POOL im Soll-Zustand (Umfeld spiegelt die kuenftigen Kartenwerte)
POOL = ([dict(WSOLL[w['id']], kind='w', req=v11.WREQ.get(w['id'], {}))
         for w in ws]
        + [dict(CSOLL[c['id']], kind='c', req=CREQ.get(c['id'], {}))
           for c in cs])


def set_pool(pool):
    G['POOL'] = pool
    tot = sum(v10.RARITY_W[p['rarity']] for p in pool)
    G['TOT'] = tot
    G['PPROB'] = [v10.RARITY_W[p['rarity']] / tot for p in pool]
    wpidx = [i for i, p in enumerate(pool) if p['kind'] == 'w']
    G['WPIDX'] = wpidx
    wpt = sum(G['PPROB'][i] for i in wpidx)
    G['_WPT'] = wpt
    G['WPPROB'] = [G['PPROB'][i] / wpt for i in wpidx]


set_pool(POOL)

# ------------------------------------------------------------- Jobs ---
JOBS = []


def add_job(label, kind, spec, part, rarity):
    # key MUSS die Abzuege enthalten: 157-X vs. 157-csvnum (sh=7) hatten
    # denselben key und buchten in EIN Konto -> X-Divergenz war ein
    # Artefakt (Mittelwert, diff exakt 0.0). Bugfix 8.11.2026.
    abzs = '%s/%s/%s' % ((spec.get('abz') or {}).get('pd'),
                         (spec.get('abz') or {}).get('shield'),
                         (spec.get('abz') or {}).get('armour'))
    key = (part, spec['id'], kind, spec.get('damage'), spec.get('energy'),
           spec.get('hp'), spec.get('speed'), spec.get('units'), abzs)
    JOBS.append(dict(label=label, kind=kind, spec=spec, part=part,
                     rarity=rarity, key=key))


for w in ws:                                  # Teil 1: 50 Waffen in SOLL-Form
    add_job(w['id'], 'w', dict(WSOLL[w['id']]), 'v', w['rarity'])
for c in cs:                                  # Teil 1: 19 Statkarten in SOLL
    add_job(c['id'], 'c', dict(CSOLL[c['id']]), 'v', c['rarity'])
# X-Divergenz: csv-Numerik statt X (Christophers Korrektur — NICHT neutral)
add_job('157-csvnum', 'w', wvar(W['157'], sh=7), 'v', W['157']['rarity'])
add_job('166-csvnum', 'w', wvar(W['166'], sh=3), 'v', W['166']['rarity'])
add_job('179-csvnum', 'w', wvar(W['179'], ar=2), 'v', W['179']['rarity'])
add_job('344-csvnum', 'w', wvar(W['344'], sh=2), 'v', W['344']['rarity'])
add_job('347-csvnum', 'w', wvar(W['347'], dmg=4, sh=4), 'v', W['347']['rarity'])

SWAPS = {'310': 5, '103': 4, '223': 3, '312': 2,
         '343': 2, '537': 1, '522': 1, '344': 2}
for cid, rar in SWAPS.items():                # Teil 2: Tausch in Soll/csv-Form
    kind = 'w' if cid in W else 'c'
    spec = dict(WSOLL[cid]) if kind == 'w' else dict(CSOLL[cid])
    add_job('swap-%s->r%d' % (cid, rar), kind, spec, 's', rar)
add_job('swap-344-csv->r2', 'w', wvar(W['344'], sh=2), 's', 2)  # Info: csv-Form

# ------------------------------------------------- Messung Teil 1 (CRN) ---
blank = lambda: [dict(out=0.0, take=0.0, col=0.0, loot=0.0, prevent=0.0)
                 for _ in range(2)]
acc = {j['key']: blank() for j in JOBS if j['part'] == 'v'}
accn = {j['key']: [0, 0] for j in JOBS if j['part'] == 'v'}
VJOBS = [j for j in JOBS if j['part'] == 'v']

start = 0
if os.path.exists(CKPT_PATH):
    try:
        ck = json.load(open(CKPT_PATH, encoding='utf-8'))
        start = ck['iter']
        for k, v in ck['acc'].items():
            acc[tuple(k)][0].update(v[0]); acc[tuple(k)][1].update(v[1])
        for k, v in ck['accn'].items():
            accn[tuple(k)] = v
        print('Resume bei Gefecht %d/%d' % (start, N))
    except Exception as ex:
        print('Kaputter Checkpoint, Neustart:', ex)
        start = 0
        acc = {j['key']: blank() for j in VJOBS}
        accn = {j['key']: [0, 0] for j in VJOBS}

random.seed(42)
for it in range(start, N):
    sc = draw_random_battle(random)
    r0 = battle_r(sc)
    a0, a1 = acc_side(r0, 0), acc_side(r0, 1)
    for j in VJOBS:
        for side in (0, 1):
            if j['kind'] == 'w':
                r = battle_r(sc, spin=it % 3, wspec=j['spec'],
                             wf=sc['wf'][side], spec_side=side)
            else:
                r = battle_r(sc, spin=it % 3, spec=dict(j['spec']),
                             spec_side=side)
            if r is None:
                continue
            a = acc_side(r, side)
            b = a0 if side == 0 else a1
            accn[j['key']][side] += 1
            for ch in a:
                acc[j['key']][side][ch] += a[ch] - b[ch]
    if (it + 1) % CKPT_EVERY == 0 or it == N - 1:
        with open(CKPT_PATH, 'w', encoding='utf-8') as f:
            json.dump(dict(iter=it + 1,
                           acc={str(list(k)): v for k, v in acc.items()},
                           accn={str(list(k)): v for k, v in accn.items()}), f)
        print('Teil 1: Gefecht %d/%d (%.0fs)' % (it + 1, N, time.time() - t0),
              flush=True)
if os.path.exists(CKPT_PATH):
    os.remove(CKPT_PATH)
print('Teil 1 fertig: %.0fs' % (time.time() - t0), flush=True)

# ------------------------------------------------- Messung Teil 2 (Tausch) ---
sacc, saccn = {}, {}
SJOBS = [j for j in JOBS if j['part'] == 's']
for j in SJOBS:
    sacc[j['key']] = blank()
    saccn[j['key']] = [0, 0]
pool_swap = [dict(p) for p in POOL]
idmap = {p['id']: p for p in pool_swap}
for cid, rar in SWAPS.items():
    idmap[cid]['rarity'] = rar
set_pool(pool_swap)

random.seed(42)
for it in range(N):
    sc = draw_random_battle(random)
    r0 = battle_r(sc)
    a0, a1 = acc_side(r0, 0), acc_side(r0, 1)
    for j in SJOBS:
        for side in (0, 1):
            if j['kind'] == 'w':
                r = battle_r(sc, spin=it % 3, wspec=j['spec'],
                             wf=sc['wf'][side], spec_side=side)
            else:
                r = battle_r(sc, spin=it % 3, spec=dict(j['spec']),
                             spec_side=side)
            if r is None:
                continue
            a = acc_side(r, side)
            b = a0 if side == 0 else a1
            saccn[j['key']][side] += 1
            for ch in a:
                sacc[j['key']][side][ch] += a[ch] - b[ch]
    if (it + 1) % CKPT_EVERY == 0 or it == N - 1:
        print('Teil 2: Gefecht %d/%d (%.0fs)' % (it + 1, N, time.time() - t0),
              flush=True)
print('Teil 2 fertig: %.0fs' % (time.time() - t0), flush=True)

# ------------------------------------------------------------ Auswertung ---
def score_of(job, accd, accnd):
    n = accnd[job['key']]
    if n[0] + n[1] == 0:
        return None
    gains = []
    for s in (0, 1):
        if n[s] > 0:
            gains.append(sum(accd[job['key']][s].values()) / n[s])
    gain = sum(gains) / len(gains)
    hp = job['spec']['hp'] if job['kind'] == 'c' else 0
    units = (job['spec']['units'] if job['kind'] == 'c'
             else v11.weapon_units(job['spec']))
    return (gain + HP_STATIC * hp) / (units + 1.0)


rows = []
for j in VJOBS:
    sc_ = score_of(j, acc, accn)
    tgt = TARGETS[j['rarity']]
    rows.append(dict(label=j['label'], id=j['spec']['id'], kind=j['kind'],
                     rarity=j['rarity'],
                     score=None if sc_ is None else round(sc_, 3),
                     target=tgt,
                     delta=None if sc_ is None else round(sc_ - tgt, 3)))
swap_rows = []
for j in SJOBS:
    sc_ = score_of(j, sacc, saccn)
    tgt = TARGETS[j['rarity']]
    swap_rows.append(dict(label=j['label'], id=j['spec']['id'],
                          kind=j['kind'], rarity=j['rarity'],
                          score=None if sc_ is None else round(sc_, 3),
                          target=tgt,
                          delta=None if sc_ is None else round(sc_ - tgt, 3)))

# Mediane je Raritaet (Waffen und Statkarten getrennt)
med_w, med_c = {}, {}
for r in range(1, 6):
    sw = [x['score'] for x in rows if x['kind'] == 'w' and x['rarity'] == r
          and x['score'] is not None]
    sc_ = [x['score'] for x in rows if x['kind'] == 'c' and x['rarity'] == r
           and x['score'] is not None]
    med_w[r] = round(statistics.median(sw), 3) if sw else None
    med_c[r] = round(statistics.median(sc_), 3) if sc_ else None

# Outlier gegen v23c (nur die 69 Standard-Jobs, nicht die X-Extra-Jobs)
outliers = [x for x in rows if x['delta'] is not None
            and abs(x['delta']) > THRESH and not x['label'].endswith('csvnum')]

# X-Divergenz (Christophers Korrektur: X vs. csv-Numerik)
R = {x['id'] if x['label'] == x['id'] else x['label']: x['score'] for x in rows}
xdiv = []
for cid in sorted(X_CARDS):
    s_x = next(x['score'] for x in rows if x['label'] == cid)
    s_num = next((x['score'] for x in rows if x['label'] == cid + '-csvnum'),
                 None)
    xdiv.append(dict(id=cid, title=W[cid]['title'], score_x=s_x,
                     score_csvnum=s_num,
                     diff=None if s_num is None else round(s_num - s_x, 3)))

# Spearman Waffen neu vs. v23b (Stabilitaet)
v23 = {}
try:
    fc = json.load(open('diag_random_v23_r13t.json', encoding='utf-8'))
    v23 = {r['id']: r['score'] for r in fc.get('weapons', [])}


    def spearman(a, b):
        pairs = [(x, y) for x, y in zip(a, b)
                 if x is not None and y is not None]
        if len(pairs) < 3:
            return None

        def rank(v):
            s = sorted(range(len(v)), key=lambda i: v[i])
            rr = [0] * len(v)
            i = 0
            while i < len(s):
                j = i
                while j + 1 < len(s) and v[s[j + 1]] == v[s[i]]:
                    j += 1
                for k in range(i, j + 1):
                    rr[s[k]] = (i + j) / 2
                i = j + 1
            return rr
        rx, ry = rank([p[0] for p in pairs]), rank([p[1] for p in pairs])
        mx, my = statistics.mean(rx), statistics.mean(ry)
        num = sum((a - mx) * (b - my) for a, b in zip(rx, ry))
        den = (sum((a - mx) ** 2 for a in rx) ** 0.5
               * sum((b - my) ** 2 for b in ry) ** 0.5)
        return round(num / den, 3) if den else None
    sp = spearman([x['score'] for x in rows if x['kind'] == 'w'],
                  [v23.get(x['id']) for x in rows if x['kind'] == 'w'])
except Exception:
    sp = None

result = dict(N=N, seed=42, frame='v23d-revert-soll (wspec feuert zuerst je Phase, >=-Halved-Fix im wspec-Pfad)', hp_static=HP_STATIC,
              targets=TARGETS, thresh=THRESH, revert=sorted(REVERT),
              medians_weapons=med_w, medians_cards=med_c,
              spearman_weapons_vs_v23b=sp, rows=rows, swap=swap_rows,
              x_divergence=xdiv, outliers=outliers,
              elapsed=round(time.time() - t0, 1))
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=1)

print('\n===== TEIL 1: Neue Mediane (Soll-Frame) vs. v23c =====')
print('Rar  Waffen-Median  Karten-Median  v23c-Ziel')
for r in range(1, 6):
    print('r%d   %-13s %-13s %.1f' % (r, med_w[r], med_c[r], TARGETS[r]))
print('\n===== TEIL 1: Outlier gegen v23c (|Delta|>0,6) =====')
for x in sorted(outliers, key=lambda y: -abs(y['delta'])):
    print('%-4s %-26s %s r%d  Score %-6s Delta %-6s' %
          (x['id'], next((w2['title'] for w2 in ws + cs
                          if w2['id'] == x['id']), '?'),
           x['kind'], x['rarity'],
           'n/a' if x['score'] is None else '%.2f' % x['score'],
           '%+.2f' % x['delta']))
print('\n===== X-Divergenz (X vs. csv-Numerik, Christophers Korrektur) =====')
for x in xdiv:
    print('%-4s %-24s X %-6s csv-num %-6s Diff %-6s' %
          (x['id'], x['title'],
           'n/a' if x['score_x'] is None else '%.2f' % x['score_x'],
           'n/a' if x['score_csvnum'] is None else '%.2f' % x['score_csvnum'],
           'n/a' if x['diff'] is None else '%+.2f' % x['diff']))
print('\n===== TEIL 2: Tauschpaare mit csv/Soll-Werten =====')
for x in sorted(swap_rows, key=lambda y: y['id']):
    print('%-20s neu r%d Ziel %.1f  Score %-6s Delta %-6s' %
          (x['label'], x['rarity'], x['target'],
           'n/a' if x['score'] is None else '%.2f' % x['score'],
           'n/a' if x['delta'] is None else '%+.2f' % x['delta']))
print('\nSpearman Waffen neu vs. v23b:', sp)
print('Ergebnis: %s (%.0fs)' % (OUT_PATH, time.time() - t0))
