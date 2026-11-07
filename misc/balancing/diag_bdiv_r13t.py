# ============================================================================
# diag_bdiv_r13t.py — B-Karten-Divergenz im v23d-Frame (FIN vs. csv)
# ----------------------------------------------------------------------------
# Christophers B-Beschluss (8 Overrides behalten: 101/126/151/180/207/302/
# 304/438) beruhte auf dem v23c-Messlauf. Der v23d-Frame (wspec feuert zuerst
# je Phase + >=-Halved-Fix im wspec-Pfad) verschiebt die FIN-Scores von 101
# und 304 deutlich (beide jetzt ausserhalb ±0,6 gegen v23c). Dieses Skript
# misst die csv-Formen der 8 B-Karten im v23d-Soll-Frame nach, damit die
# Behalten-Entscheidung auf aktueller Basis fallen kann.
# CRN-gepaart, N=10000 (DIAG_N), seed 42, Baseline je Gefecht.
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
OUT_PATH = 'diag_bdiv_v23d_r13t.json'
HP_STATIC = 1.0
TARGETS = {1: 1.6, 2: 1.9, 3: 2.3, 4: 2.9, 5: 3.6}
t0 = time.time()

SRC = open('diag_random_r13t.py', encoding='utf-8').read()
CUT = SRC.index('# ---------------- Messung mit Checkpoint')
G = {'__name__': 'r13t_defs',
     '__file__': os.path.join(HERE, 'diag_random_r13t.py')}
exec(compile(SRC[:CUT], 'diag_random_r13t.py', 'exec'), G)

v11, v10 = G['v11'], G['v10']
ws, cs = G['ws'], G['cs']
W = {w['id']: w for w in ws}
WCSV = {w['id']: w for w in v10.load_attackers(final=False)}

REVERT = {'106', '107', '303', '310', '343', '405',
          '125', '127', '150', '167', '168', '203', '224',
          '234', '339', '340', '409', '420', '421', '424', '441'}
B_CARDS = ['101', '126', '151', '180', '207', '302', '304', '438']


def wcsv_spec(cid):
    s = dict(W[cid])
    wc = WCSV[cid]
    s['damage'] = wc['damage']
    s['energy'] = wc['energy']
    s['abz'] = dict(wc['abz'])
    s['r1_col'] = v10.colony_r1(s)
    return s


def wvar(base, dmg=None, pd_=None):
    s = dict(base)
    if (dmg, pd_) != (None, None):
        s['abz'] = dict(base['abz'])
        if pd_ is not None:
            s['abz']['pd'] = pd_
    if dmg is not None:
        s['damage'] = dmg
    if dmg is not None or pd_ is not None:
        s['r1_col'] = v10.colony_r1(s)
    return s


WSOLL = {}
for w in ws:
    cid = w['id']
    if cid in REVERT:
        WSOLL[cid] = wcsv_spec(cid)
    elif cid == '318':
        WSOLL[cid] = wvar(w, dmg=16, pd_=8)
    elif cid == '412':
        WSOLL[cid] = wvar(w, dmg=10)
    elif cid == '347':
        WSOLL[cid] = wvar(w, dmg=4)
    else:
        WSOLL[cid] = dict(w)

POOL = [dict(WSOLL[w['id']], kind='w', req=v11.WREQ.get(w['id'], {}))
        for w in ws] \
    + [dict(c, kind='c', req=G['CREQ'].get(c['id'], {})) for c in cs]

G['POOL'] = POOL
G['TOT'] = tot = sum(v10.RARITY_W[p['rarity']] for p in POOL)
G['PPROB'] = [v10.RARITY_W[p['rarity']] / tot for p in POOL]
wpidx = [i for i, p in enumerate(POOL) if p['kind'] == 'w']
G['WPIDX'] = wpidx
G['_WPT'] = wpt = sum(G['PPROB'][i] for i in wpidx)
G['WPPROB'] = [G['PPROB'][i] / wpt for i in wpidx]

battle_r, draw, acc_side = G['battle_r'], G['draw_random_battle'], G['acc_side']
blank = lambda: [dict(out=0.0, take=0.0, col=0.0, loot=0.0, prevent=0.0)
                for _ in range(2)]
acc = {}      # (form, id) -> 2-Seiten-Konten
accn = {}
for cid in B_CARDS:
    for form in ('fin', 'csv'):
        acc[(form, cid)] = blank()
        accn[(form, cid)] = [0, 0]

random.seed(42)
for it in range(N):
    sc = draw(random)
    r0 = battle_r(sc)
    a0, a1 = acc_side(r0, 0), acc_side(r0, 1)
    for cid in B_CARDS:
        for form in ('fin', 'csv'):
            x = WSOLL[cid] if form == 'fin' else wcsv_spec(cid)
            for side in (0, 1):
                r = battle_r(sc, spin=it % 3, wspec=dict(x),
                             wf=sc['wf'][side], spec_side=side)
                if r is None:
                    continue
                a = acc_side(r, side)
                b = a0 if side == 0 else a1
                accn[(form, cid)][side] += 1
                for ch in a:
                    acc[(form, cid)][side][ch] += a[ch] - b[ch]
    if (it + 1) % 2500 == 0:
        print('Gefecht %d/%d (%.0fs)' % (it + 1, N, time.time() - t0),
              flush=True)


def score(form, cid):
    gains = []
    for s in (0, 1):
        n = accn[(form, cid)][s]
        if n > 0:
            gains.append(sum(acc[(form, cid)][s].values()) / n)
    gain = sum(gains) / len(gains)
    w = WSOLL[cid] if form == 'fin' else wcsv_spec(cid)
    return gain / (v11.weapon_units(w) + 1.0)


rows = []
for cid in sorted(B_CARDS):
    rar = W[cid]['rarity']
    s_fin, s_csv = score('fin', cid), score('csv', cid)
    tgt = TARGETS[rar]
    rows.append(dict(id=cid, title=W[cid].get('title', cid), rarity=rar,
                     target=tgt,
                     score_fin=round(s_fin, 2), delta_fin=round(s_fin - tgt, 2),
                     score_csv=round(s_csv, 2), delta_csv=round(s_csv - tgt, 2)))

result = dict(N=N, seed=42,
              frame='v23d-soll (wspec-first, >=-fix), FIN vs. csv der 8 '
                    'B-Karten',
              rows=rows, elapsed=round(time.time() - t0, 1))
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=1)

print('\nB-Karten im v23d-Frame (N=%d, %.0fs):' % (N, time.time() - t0))
print('%-5s %-24s r  Ziel   FIN    csv' % ('id', 'Titel'))
for r in rows:
    print('%-5s %-24s r%d %.1f  %.2f (%+.2f)  %.2f (%+.2f)'
          % (r['id'], r['title'], r['rarity'], r['target'],
             r['score_fin'], r['delta_fin'], r['score_csv'], r['delta_csv']))
print('\nErgebnis: %s' % OUT_PATH)
