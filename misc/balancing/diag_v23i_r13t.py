# ============================================================================
# diag_v23i_r13t.py — Neu-Simulation mit Christophers Feinkorrekturen
# (5.11.2026) auf Frame v23d (wspec-first, >=-Halved-Fix)
# ----------------------------------------------------------------------------
# Aenderungen vs. v23h:
#   - 101: TAbz -14 -> -11 (auf FIN dmg 28)
#   - 126: dmg bleibt csv 8 (FIN-dmg-7-Hebel zurueckgenommen) + E1 aktiv
#     (C.-Beschluss "nur E1"; fixt zugleich den v23h-Tot-Code-Bug:
#     B_FIN-elif griff vor dem 126er-Zweig, E1 war nie aktiv)
#   - 140: units 0.7 statt 1.2 — echte Metrik bei E0 (socket 0.7 + e_cost 0),
#     fixt den "-0.5/Stufe"-Modellierungsfehler aus v23f/g/h
#   - 240: hp bleibt 3 (csv, Hebel zurueckgenommen)
#   - 349: hp 2 (statt 1)
#   - 406: hp 5 (statt 4), rarity r5 bleibt
# Unveraendert: v23g-Kurve 1,5/1,7/2,0/2,5/3,0 (Band +-0,5), exakte Tausche
# (312 r2 / 537 r1 / 522 r1), 401 dmg 35, alle sonstigen v23h-Hebel.
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
CKPT_PATH = 'diag_v23i_ckpt_r13t.json'
OUT_PATH = 'diag_v23i_r13t.json'
THRESH = 0.5
TARGETS = {1: 1.5, 2: 1.7, 3: 2.0, 4: 2.5, 5: 3.0}   # v23g-Kurve
HP_STATIC = 1.0

# --------------- HISTORISCHER SNAPSHOT: Messframe eingefroren -------------
# diag_v23i_r13t.json ist die Kalibrierungs-Basis des I1-Preismodells
# (diag_infra_prices_r13i.py: c_ex/PV_equip = rw_median ueber die v23i-
# Zeilen x units_of; auch diag_anchor_live_r13i.py liest dieselbe JSON).
# Der Messframe dieses Snapshots existiert im Repo NICHT mehr: v9.FINAL
# traegt nur noch die 5 X-Abzuege (v25a-Frame, 9.11.2026), v11 summiert
# die Sektions-Speeds (H1-Fix 8.11.2026, "Code = Wahrheit") statt
# Heck-/Max-Speed, und die csv wandert mit #795 in den Zielzustand.
# Jeder Re-Run misst deshalb in einem ANDEREN Frame und ueberschreibt
# die eingefrorene Kalibrierungs-Basis hinter dem I1ac/I1ad-Pin-Entscheid
# still mit abweichenden Daten. Ein csv-Zustands-Assert greift zu kurz
# (FINAL-Trim und Speed-Fix sitzen in den Metrik-Modulen, nicht in der
# csv) — deshalb Ueberschreiben nur noch mit explizitem Opt-In; ohne
# Flag bricht das Skript VOR der Messung ab (laut, kein Silent-
# Overwrite des Referenz-JSON).
if os.environ.get('V23I_ALLOW_OVERWRITE') != '1':
    raise SystemExit(
        'HISTORISCHER SNAPSHOT: diag_v23i_r13t.json ist die v23i-'
        'Kalibrierungs-Basis des I1-Preismodells (Anker-Pin I1ac/I1ad). '
        'Der Messframe (~30 FINAL-Overrides, Heck-/Max-Speed, Ist-csv) '
        'existiert im Repo nicht mehr (v25a-Frame: 5 X-Abzuege, '
        'Speed-Summen-Fix, #795-Ziel-csv) — ein Re-Run wuerde die Basis '
        'mit abweichenden Daten ueberschreiben. Explizites Opt-In: '
        'V23I_ALLOW_OVERWRITE=1 python3 diag_v23i_r13t.py')

t0 = time.time()
SRC = open('diag_random_r13t.py', encoding='utf-8').read()
CUT = SRC.index('# ---------------- Messung mit Checkpoint')
G = {'__name__': 'r13t_defs', '__file__': os.path.join(HERE, 'diag_random_r13t.py')}
exec(compile(SRC[:CUT], 'diag_random_r13t.py', 'exec'), G)

v11, v10 = G['v11'], G['v10']
ws, cs = G['ws'], G['cs']
W = {w['id']: w for w in ws}
C = {c['id']: c for c in cs}
WCSV = {w['id']: w for w in v10.load_attackers(final=False)}
battle_r = G['battle_r']
draw = G['draw_random_battle']
acc_side = G['acc_side']
CREQ = G['CREQ']

REVERT = {'106', '107', '303', '310', '343', '405',
          '125', '127', '167', '168', '203', '224',
          '234', '339', '340', '409', '420', '421', '424', '441'}
B_FIN = {'151', '180', '207', '304'}    # FIN-Overrides aktiv (101/126 eigene Zweige)
RARITY = {'310': 5, '223': 3, '343': 2, '344': 2, '101': 4}


def wcsv_spec(cid):
    s = dict(W[cid])
    wc = WCSV[cid]
    s['damage'] = wc['damage']
    s['energy'] = wc['energy']
    s['abz'] = dict(wc['abz'])
    s['r1_col'] = v10.colony_r1(s)
    return s


def wvar(base, dmg=None, pd_=None, sh=None, e=None, rar=None):
    s = dict(base)
    if (dmg, pd_, sh) != (None, None, None):
        s['abz'] = dict(base['abz'])
        if pd_ is not None:
            s['abz']['pd'] = pd_
        if sh is not None:
            s['abz']['shield'] = sh
    if dmg is not None:
        s['damage'] = dmg
    if e is not None:
        s['energy'] = e
    if dmg is not None or pd_ is not None or sh is not None:
        s['r1_col'] = v10.colony_r1(s)
    if rar is not None:
        s['rarity'] = rar
    return s


WSOLL = {}
for w in ws:
    cid = w['id']
    if cid in REVERT:
        WSOLL[cid] = wcsv_spec(cid)
    elif cid in B_FIN:
        WSOLL[cid] = dict(w)                     # FIN-Override aktiv
    elif cid == '302' or cid == '438':
        WSOLL[cid] = wcsv_spec(cid)              # csv-Ruecknahme
    elif cid == '150':
        WSOLL[cid] = wvar(w, dmg=14, pd_=7, sh=4)   # Beschluss: 14/TAbz7/SAbz4
    elif cid == '555':
        WSOLL[cid] = wvar(w, dmg=6)
    elif cid == '182':
        WSOLL[cid] = wvar(w, dmg=5)
    elif cid == '318':
        WSOLL[cid] = wvar(w, dmg=16, pd_=8)
    elif cid == '412':
        WSOLL[cid] = wvar(w, dmg=10)
    elif cid == '347':
        WSOLL[cid] = wvar(w, dmg=4)              # X bleibt
    elif cid == '223':
        WSOLL[cid] = wvar(w, e=2, rar=3)        # E2 + Tausch r3
    elif cid == '101':
        WSOLL[cid] = wvar(w, pd_=11)            # FIN dmg 28 + TAbz 14->11 (C.-Beschluss)
    elif cid == '126':
        WSOLL[cid] = wvar(wcsv_spec(cid), e=1)  # csv dmg 8 (bleibt) + E 1 (C.-Beschluss)
    elif cid == '401':
        WSOLL[cid] = wvar(w, dmg=35)            # C.-Beschluss: dmg 30 -> 35
    else:
        WSOLL[cid] = dict(w)
for cid, rar in RARITY.items():
    if cid in WSOLL:
        WSOLL[cid]['rarity'] = rar

CSOLL = {}
for c in cs:
    cid = c['id']
    if cid == '171':
        CSOLL[cid] = dict(c, hp=0)              # "HP raus" (csv -1 -> 0)
    elif cid == '184':
        CSOLL[cid] = dict(c, hp=3)
    elif cid == '406':
        CSOLL[cid] = dict(c, hp=5, rarity=5)  # Tausch mit 101 (406->r5), hp 5 (C.-Beschluss)
    elif cid == '349':
        CSOLL[cid] = dict(c, hp=2)             # hp 2 (C.-Beschluss, war 1)
    elif cid == '434':
        CSOLL[cid] = dict(c, hp=0)
    elif cid == '103':
        CSOLL[cid] = dict(c, hp=c['hp'] + 2, rarity=4)
    elif cid == '312':
        CSOLL[cid] = dict(c, rarity=2)   # exakter Tausch mit 223 (C.-Korrektur)
    elif cid == '140':
        CSOLL[cid] = dict(c, units=0.7)         # E0: socket 0.7 + e_cost 0 (echte Metrik)
    elif cid == '161':
        CSOLL[cid] = dict(c, units=0.7)         # E0 (1.7 - 1.0 E-Anteil)
    elif cid == '522':
        CSOLL[cid] = dict(c, units=1.2, rarity=1)  # E0 + exakter Tausch mit 344
    elif cid == '109':
        CSOLL[cid] = dict(c, units=1.7)         # E-1 (bewusst)
    elif cid == '537':
        CSOLL[cid] = dict(c, rarity=1)   # exakter Tausch mit 343 (C.-Korrektur)
    else:
        CSOLL[cid] = dict(c)

POOL = [dict(WSOLL[w['id']], kind='w', req=v11.WREQ.get(w['id'], {}))
        for w in ws] \
    + [dict(CSOLL[c['id']], kind='c', req=CREQ.get(c['id'], {})) for c in cs]
G['POOL'] = POOL
G['TOT'] = tot = sum(v10.RARITY_W[p['rarity']] for p in POOL)
G['PPROB'] = [v10.RARITY_W[p['rarity']] / tot for p in POOL]
wpidx = [i for i, p in enumerate(POOL) if p['kind'] == 'w']
G['WPIDX'] = wpidx
G['_WPT'] = wpt = sum(G['PPROB'][i] for i in wpidx)
G['WPPROB'] = [G['PPROB'][i] / wpt for i in wpidx]

# ------------------------------------------------------------- Jobs ---
JOBS = []


def add_job(cid, kind, spec, rarity):
    JOBS.append(dict(label=cid, id=cid, kind=kind, spec=spec, rarity=rarity))


for w in ws:
    add_job(w['id'], 'w', dict(WSOLL[w['id']]), WSOLL[w['id']]['rarity'])
for c in cs:
    add_job(c['id'], 'c', dict(CSOLL[c['id']]), CSOLL[c['id']]['rarity'])

blank = lambda: [dict(out=0.0, take=0.0, col=0.0, loot=0.0, prevent=0.0)
                 for _ in range(2)]
acc = {j['id']: blank() for j in JOBS}
accn = {j['id']: [0, 0] for j in JOBS}

start = 0
if os.path.exists(CKPT_PATH):
    try:
        ck = json.load(open(CKPT_PATH, encoding='utf-8'))
        start = ck['iter']
        for k, v in ck['acc'].items():
            acc[k][0].update(v[0]); acc[k][1].update(v[1])
        for k, v in ck['accn'].items():
            accn[k] = v
        print('Resume bei Gefecht %d/%d' % (start, N))
    except Exception as ex:
        print('Kaputter Checkpoint, Neustart:', ex)
        start = 0
        acc = {j['id']: blank() for j in JOBS}
        accn = {j['id']: [0, 0] for j in JOBS}

random.seed(42)
for it in range(start, N):
    sc = draw(random)
    r0 = battle_r(sc)
    a0, a1 = acc_side(r0, 0), acc_side(r0, 1)
    for j in JOBS:
        for side in (0, 1):
            if j['kind'] == 'w':
                r = battle_r(sc, spin=it % 3, wspec=dict(j['spec']),
                             wf=sc['wf'][side], spec_side=side)
            else:
                r = battle_r(sc, spin=it % 3, spec=dict(j['spec']),
                             spec_side=side)
            if r is None:
                continue
            a = acc_side(r, side)
            b = a0 if side == 0 else a1
            accn[j['id']][side] += 1
            for ch in a:
                acc[j['id']][side][ch] += a[ch] - b[ch]
    if (it + 1) % CKPT_EVERY == 0 or it == N - 1:
        with open(CKPT_PATH, 'w', encoding='utf-8') as f:
            json.dump(dict(iter=it + 1, acc=acc, accn=accn), f)
        print('Gefecht %d/%d (%.0fs)' % (it + 1, N, time.time() - t0),
              flush=True)
if os.path.exists(CKPT_PATH):
    os.remove(CKPT_PATH)
print('Messung fertig: %.0fs' % (time.time() - t0), flush=True)

# ---------------------------------------------------------- Auswertung ---
def score_of(j):
    gains = []
    for s in (0, 1):
        n = accn[j['id']][s]
        if n > 0:
            gains.append(sum(acc[j['id']][s].values()) / n)
    gain = sum(gains) / len(gains)
    hp = j['spec']['hp'] if j['kind'] == 'c' else 0
    units = (j['spec']['units'] if j['kind'] == 'c'
             else v11.weapon_units(j['spec']))
    return (gain + HP_STATIC * hp) / (units + 1.0)


rows = []
for j in JOBS:
    s_ = score_of(j)
    tgt = TARGETS[j['rarity']]
    rows.append(dict(label=j['label'], id=j['id'], kind=j['kind'],
                     rarity=j['rarity'], score=round(s_, 2),
                     target=tgt, delta=round(s_ - tgt, 2)))

def medians(kind):
    out = {}
    for rar in (1, 2, 3, 4, 5):
        vals = [x['score'] for x in rows
                if x['kind'] == kind and x['rarity'] == rar]
        if vals:
            out[str(rar)] = round(statistics.median(vals), 3)
    return out

med_w, med_c = medians('w'), medians('c')

spear = None
try:
    fc = json.load(open('diag_random_v23_r13t.json', encoding='utf-8'))
    old = {c['id']: c['score'] for c in fc['cards']}
    pairs = [(x['score'], old[x['id']]) for x in rows
             if x['kind'] == 'c' and x['id'] in old]

    def rank(v):
        order = sorted(range(len(v)), key=lambda i: v[i])
        r = [0.0] * len(v)
        i = 0
        while i < len(order):
            j = i
            while j + 1 < len(order) and v[order[j + 1]] == v[order[i]]:
                j += 1
            avg = (i + j) / 2 + 1
            for k in range(i, j + 1):
                r[order[k]] = avg
            i = j + 1
        return r

    n_ = len(pairs)
    d2 = sum((a - b) ** 2 for a, b in zip(rank([p[0] for p in pairs]),
                                          rank([p[1] for p in pairs])))
    spear = 1 - 6 * d2 / (n_ * (n_ * n_ - 1))
    spear = round(spear, 3)
except Exception as ex:
    print('Spearman nicht verfuegbar:', ex)

outliers = [x for x in rows if abs(x['delta']) > THRESH]
outliers.sort(key=lambda x: -x['delta'])
knapp = [x for x in rows if THRESH >= abs(x['delta']) > 0.4]
knapp.sort(key=lambda x: -abs(x['delta']))

result = dict(N=N, seed=42,
              frame='v23i-soll auf Frame v23d (wspec-first, >=-fix), '
                    'v23g-Kurve, exakte Tausche, 101 TAbz 11, 126 csv+e1, '
                    '140 units 0.7, 240 csv, 349 hp2, 406 hp5',
              targets=TARGETS, thresh=THRESH, hp_static=HP_STATIC,
              medians_weapons=med_w, medians_cards=med_c,
              spearman_cards_vs_v23=spear,
              rows=rows, outliers=outliers, knapp=knapp,
              elapsed=round(time.time() - t0, 1))
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=1)

print('\n===== v23i-Soll-Messung (N=%d, %.0fs) =====' % (N, time.time() - t0))
print('Mediane Waffen:', med_w)
print('Mediane Karten:', med_c)
if spear is not None:
    print('Spearman Karten vs. v23: %.3f' % spear)
print('\n===== Outlier gegen v23g (|%s|>%.1f): %d ====='
      % ('\u0394', THRESH, len(outliers)))
for x in outliers:
    print('%-5s %-26s %s r%d  Score %5.2f  Ziel %.1f  Delta %+5.2f'
          % (x['id'], x['label'], x['kind'], x['rarity'], x['score'],
             x['target'], x['delta']))
print('\n===== Knapp im Band (0.4<|d|<=%.1f): %d =====' % (THRESH, len(knapp)))
for x in knapp:
    print('%-5s %-26s %s r%d  Score %5.2f  Ziel %.1f  Delta %+5.2f'
          % (x['id'], x['label'], x['kind'], x['rarity'], x['score'],
             x['target'], x['delta']))
print('\nErgebnis: %s' % OUT_PATH)
