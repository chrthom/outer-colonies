# ============================================================================
# diag_geqfix_r13t.py — Isolation des >=-Halved-Fixes im wspec-Pfad
# ----------------------------------------------------------------------------
# Fund 8.11.2026: Die v22->=-Umstellung (Zielspeed >= Angreiferspeed + Phase
# => halbiert) war im wspec-Pfad der Sonde UEBERSEHEN worden: Der Block der
# bewerteten Waffe nutzte noch die alte >-Regel ('< statt <='), d.h. ALLE
# bewerteten Waffen feuerten seit v22 mit der alten Speed-Regel und wurden
# zu selten halbiert (Scores leicht ueberhoeht). Umgebungswaffen waren
# korrekt (>=).
# Dieses Skript misst den Effekt des Fixes isoliert:
#   Frame A (alt): wspec feuert zuerst je Phase (v23d-Reihenfolge),
#                  aber Halved noch mit '<'  (buggy)
#   Frame B (neu): wspec feuert zuerst je Phase, Halved mit '<=' (fix)
# Beide Frames im Soll-Zustand (21 Ruecknahmen + Hebel + X), CRN-gepaart
# (dieselben Gefechte), N=2000 (DIAG_N), seed 42, nur Waffen-Jobs.
# Sonde wird NICHT importiert: exec bis Marker, zwei Varianten per
# String-Replace der eindeutigen wspec-Halved-Zeile.
# ============================================================================
import json
import os
import random
import statistics
import time

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
N = int(os.environ.get('DIAG_N', '2000'))
OUT_PATH = 'diag_geqfix_v23d_r13t.json'
HP_STATIC = 1.0
t0 = time.time()

SRC = open('diag_random_r13t.py', encoding='utf-8').read()
CUT = SRC.index('# ---------------- Messung mit Checkpoint')
GEQ_NEW = "d = v9.half(base) if sh['s'] + p <= tgt['s'] else base"
GEQ_OLD = "d = v9.half(base) if sh['s'] + p < tgt['s'] else base"
assert SRC.count(GEQ_NEW) == 1, 'wspec-Halved-Zeile nicht eindeutig'

G_NEW = {'__name__': 'r13t_defs',
         '__file__': os.path.join(HERE, 'diag_random_r13t.py')}
exec(compile(SRC[:CUT], 'diag_random_r13t.py', 'exec'), G_NEW)
G_OLD = {'__name__': 'r13t_defs',
         '__file__': os.path.join(HERE, 'diag_random_r13t.py')}
exec(compile(SRC[:CUT].replace(GEQ_NEW, GEQ_OLD),
             'diag_random_r13t.py', 'exec'), G_OLD)


def frame(G):
    return dict(v11=G['v11'], v10=G['v10'], ws=G['ws'], cs=G['cs'],
                battle_r=G['battle_r'], draw=G['draw_random_battle'],
                acc_side=G['acc_side'], CREQ=G['CREQ'],
                WREQ=G['v11'].WREQ, POOL=None)


F_NEW, F_OLD = frame(G_NEW), frame(G_OLD)
v10, v11 = F_NEW['v10'], F_NEW['v11']
ws, cs = F_NEW['ws'], F_NEW['cs']
W = {w['id']: w for w in ws}
WCSV = {w['id']: w for w in v10.load_attackers(final=False)}

REVERT = {'106', '107', '303', '310', '343', '405',
          '125', '127', '150', '167', '168', '203', '224',
          '234', '339', '340', '409', '420', '421', '424', '441'}


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
    + [dict(c, kind='c', req=F_NEW['CREQ'].get(c['id'], {})) for c in cs]


def set_pool(g, pool):
    g['POOL'] = pool
    tot = sum(v10.RARITY_W[p['rarity']] for p in pool)
    g['TOT'] = tot
    g['PPROB'] = [v10.RARITY_W[p['rarity']] / tot for p in pool]
    wpidx = [i for i, p in enumerate(pool) if p['kind'] == 'w']
    g['WPIDX'] = wpidx
    g['_WPT'] = sum(g['PPROB'][i] for i in wpidx)
    g['WPPROB'] = [g['PPROB'][i] / g['_WPT'] for i in wpidx]


for G in (G_NEW, G_OLD):
    set_pool(G, [dict(p) for p in POOL])

random.seed(42)
acc = {}   # (frame, id, side) -> [konten]
accn = {}
for w in ws:
    for f in ('old', 'new'):
        for s in (0, 1):
            acc[(f, w['id'], s)] = dict(out=0.0, take=0.0, col=0.0,
                                        loot=0.0, prevent=0.0)
            accn[(f, w['id'], s)] = 0

draw = F_NEW['draw']
b_new, b_old = F_NEW['battle_r'], F_OLD['battle_r']
acc_side = F_NEW['acc_side']
for it in range(N):
    sc = draw(random)
    r0 = b_new(sc)
    a0, a1 = acc_side(r0, 0), acc_side(r0, 1)
    for w in ws:
        x = WSOLL[w['id']]
        for side in (0, 1):
            for f, b in (('old', b_old), ('new', b_new)):
                r = b(sc, spin=it % 3, wspec=dict(x),
                      wf=sc['wf'][side], spec_side=side)
                if r is None:
                    continue
                a = acc_side(r, side)
                base = a0 if side == 0 else a1
                accn[(f, w['id'], side)] += 1
                for ch in a:
                    acc[(f, w['id'], side)][ch] += a[ch] - base[ch]
    if (it + 1) % 500 == 0:
        print('Gefecht %d/%d (%.0fs)' % (it + 1, N, time.time() - t0),
              flush=True)


def score(f, w):
    gains = []
    for s in (0, 1):
        n = accn[(f, w['id'], s)]
        if n > 0:
            gains.append(sum(acc[(f, w['id'], s)].values()) / n)
    gain = sum(gains) / len(gains)
    return gain / (v11.weapon_units(w) + 1.0)


rows = []
for w in ws:
    s_old, s_new = score('old', w), score('new', w)
    rows.append(dict(id=w['id'], title=w.get('title', w['id']),
                     rarity=w['rarity'], score_old=round(s_old, 3),
                     score_new=round(s_new, 3),
                     delta=round(s_new - s_old, 3)))
rows.sort(key=lambda r: r['delta'])
med_old = statistics.median([r['score_old'] for r in rows])
med_new = statistics.median([r['score_new'] for r in rows])

result = dict(N=N, seed=42,
              frame='v23d-soll, wspec-first; A: wspec-Halved alt (<), '
                    'B: wspec-Halved fix (<=) — Umgebung beidesmal >=',
              rows=rows,
              median_old=round(med_old, 3), median_new=round(med_new, 3),
              median_delta=round(med_new - med_old, 3),
              elapsed=round(time.time() - t0, 1))
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=1)

print('\n>=-Fix Isolation (wspec-Pfad), N=%d, %.0fs' % (N, time.time() - t0))
print('Waffen-Median alt (buggy <): %.3f' % med_old)
print('Waffen-Median neu (fix <=):  %.3f' % med_new)
print('Delta Median: %+.3f' % (med_new - med_old))
print('\nTop-10 (fix senkt am staerksten) und Top-5 (hebt):')
for r in rows[:10]:
    print('  %s %-26s alt %.2f neu %.2f  %+.3f'
          % (r['id'], r['title'], r['score_old'], r['score_new'],
             r['delta']))
print('  ...')
for r in rows[-5:]:
    print('  %s %-26s alt %.2f neu %.2f  %+.3f'
          % (r['id'], r['title'], r['score_old'], r['score_new'],
             r['delta']))
print('\nErgebnis: %s' % OUT_PATH)
