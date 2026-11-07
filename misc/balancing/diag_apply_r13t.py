#!/usr/bin/env python3
# ============================================================================
# diag_apply_r13t.py — v23b-Frame-Messung, Christophers Beschlusspaket 7./8.11.
#
# TEIL A  Systematische Divergenz-Analyse cards.csv vs. Frame (v9.FINAL):
#         Ueberall, wo die gedruckte Karte (cards.csv) vom Frame-Wert
#         abweicht, werden BEIDE Konfigurationen gepaart im selben Gefecht
#         gemessen (CRN) und die Notwendigkeit des Overrides geprueft.
#         DEFAULT (Christopher): Ruecknahme auf den csv-Wert, ausser die
#         Ruecknahme wuerfe die Karte aus dem +/-0,6-Band.
#         X-Switch-Karten (abz='X', metrisch neutral gegen csv-Abzug >= dmg)
#         werden nur berichtet: in-game-Beschluss, keine Messung.
#
# TEIL B  Outlier-Varianten (Christophers Einzelentscheidungen):
#         406/349 HP-Druck, 106/107 dmg-Kurven auf BEIDEN Basen
#         (Frame und csv), 347 dmg4-Var. (X/SAbz5/SAbz4/SAbz3), 405 SAbz-Hebel
#         (beide Basen), 318 dmg16+TAbz8, 412-dmg10 (Vergleich 136).
#
# TEIL C  Rarity-Tausch (310<->103, 223<->312, 343<->537, 522<->344):
#         POOL-Raritaeten der 8 Karten gepatcht, TOT/PPROB/_WPT/WPPROB neu
#         berechnet, die 8 Karten mit ORIG-Werten (Frame-Stand) im NEUEN
#         Umfeld gemessen, Auswertung gegen die NEUEN Zielbnder.
#
# CRN: N=10000 (DIAG_N ueberschreibbar), random.seed(42) je Teil.
# Sonde wird NICHT importiert (kein __main__-Schutz): exec bis Marker mit
# G-dict (__name__='r13t_defs', __file__ MUSS gesetzt sein, CWD=HERE).
# ============================================================================
import csv as _csv
import json
import os
import random
import time

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
N = int(os.environ.get('DIAG_N', '10000'))
CKPT_EVERY = 2000
CKPT_PATH = 'diag_apply_ckpt_r13t.json'
OUT_PATH = 'diag_apply_v23_r13t.json'
THRESH = 0.6

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
HP_STATIC = v11.HP_STATIC                                  # 1.0
TARGETS = {1: 1.6, 2: 1.9, 3: 2.3, 4: 2.9, 5: 3.6}

# ---------------------------------------------------------------- Teil A ---
rows_csv = list(_csv.DictReader(open('cards.csv', newline='', encoding='utf-8'),
                                delimiter=';'))
CSV = {r['id']: r for r in rows_csv}
WCSV = {w['id']: w for w in v10.load_attackers(final=False)}   # Frame, ohne FINAL
assert set(WCSV) == set(W), 'Waffen-IDs csv vs. Frame inkonsistent'
# Doppelcheck: WCSV-Load == eigene csv-Parsung (Schutz gegen Spaltenfehler)
for cid, w in WCSV.items():
    r = CSV[cid]
    a = w['abz']

    def ival(v):
        v = (v or '').strip()
        if v == '':
            return None
        if v == 'X':
            return 'X'
        return int(v)
    assert w['damage'] == int(r['damage']), (cid, 'damage')
    for fld, key in (('damage_abm', 'pd'), ('damage_shield', 'shield'),
                     ('damage_armour', 'armour')):
        v = ival(r[fld])
        expect = 'X' if v == 'X' else (None if v is None else abs(v))
        assert a.get(key) == expect, (cid, key)
    ev = ival(r['energy'])
    assert w['energy'] == (0 if ev is None else abs(ev)), (cid, 'energy')

FIN = v10.v9.FINAL


def field_diffs(wf, wc):
    d = []
    if wf['damage'] != wc['damage']:
        d.append(('dmg', wc['damage'], wf['damage']))
    if wf['energy'] != wc['energy']:
        d.append(('e', wc['energy'], wf['energy']))
    for t in ('pd', 'shield', 'armour'):
        a, b = wf['abz'].get(t), wc['abz'].get(t)
        if a != b:
            d.append(('abz_' + t, b, a))
    return d


def x_neutral(diffs, wf, wc):
    """True, wenn der einzige Diff ein Abzug ist, der auf BEIDEN Seiten wie
    'voll absorbierend' wirkt (Wert 'X' oder >= dmg bei unveraendertem dmg).
    Dann ist der Override metrikneutral (in-game-Beschluss, keine Messung)."""
    if len(diffs) != 1 or not diffs[0][0].startswith('abz_'):
        return False
    if wf['damage'] != wc['damage']:
        return False
    dmg = wf['damage']

    def full(v):
        return v == 'X' or (isinstance(v, int) and v >= dmg)
    return full(diffs[0][1]) and full(diffs[0][2])


MANUAL = {'106', '107', '343', '405', '347'}    # eigene Job-Listen unten
divergent, x_neutral_cards = [], []
for cid in FIN:
    diffs = field_diffs(W[cid], WCSV[cid])
    if not diffs:
        continue
    if x_neutral(diffs, W[cid], WCSV[cid]):
        x_neutral_cards.append(dict(id=cid, title=W[cid]['title'],
                                    rarity=W[cid]['rarity'], diffs=diffs))
    else:
        divergent.append(dict(id=cid, title=W[cid]['title'],
                              rarity=W[cid]['rarity'], diffs=diffs))
# Statkarten: csv vs. v11 (hp/speed/armour/shield) — nur Bericht
stat_div = []
for c in cs:
    r = CSV[c['id']]

    def ival(v):
        v = (v or '').strip()
        return 0 if v == '' else int(v)
    if (ival(r['hp']), ival(r['speed'])) != (c['hp'], c['speed']) or \
       (ival(r['armour']), ival(r['shield'])) != (c['pts']['armour'], c['pts']['shield']):
        stat_div.append(c['id'])
assert not stat_div, 'Stat-Divergenzen duerfen hier nicht auftreten: %s' % stat_div

# ------------------------------------------------------------ Job-Aufbau ---
JOBS = []


def wvar(base, dmg=None, sh=None, ar=None, pd_=None, e=None):
    s = dict(base)
    if (dmg, sh, ar, pd_, e) != (None, None, None, None, None):
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
    if dmg is not None or sh is not None or ar is not None or pd_ is not None:
        # r1_col (Kolonie-Angriff R1, Raid) haengt von damage+abz ab und
        # MUSS fuer die gepatchte Waffe neu berechnet werden (v11 macht das
        # beim Laden einmalig); fire_phase/def_pts bleiben unveraendert.
        s['r1_col'] = v10.colony_r1(s)
    return s


def wcsv_spec(cid):
    """csv-Konfiguration (Override zurueckgenommen) als PATCH der v11-Waffe:
    alle v11-Zusatzfelder (fire_phase, def_pts, no_colony, ...) bleiben
    erhalten, nur damage/energy/abz werden auf den cards.csv-Stand gesetzt."""
    s = dict(W[cid])
    wc = WCSV[cid]
    s['damage'] = wc['damage']
    s['energy'] = wc['energy']
    s['abz'] = dict(wc['abz'])
    s['r1_col'] = v10.colony_r1(s)
    return s


def cvar(base, hp=None):
    s = dict(base)
    if hp is not None:
        s['hp'] = hp
    return s


def add_job(label, kind, spec, part='v', rarity=None):
    assert kind in ('w', 'c')
    if kind == 'w':
        key = (part, spec['id'], 'w', spec['damage'], spec['energy'],
               spec['abz'].get('pd'), spec['abz'].get('shield'),
               spec['abz'].get('armour'))
    else:
        key = (part, spec['id'], 'c', spec['hp'], spec['speed'])
    for j in JOBS:
        if j['key'] == key:
            return
    JOBS.append(dict(label=label, kind=kind, spec=spec, part=part,
                     rarity=rarity if rarity is not None else spec['rarity'],
                     key=key))


# (1) Automatische Divergenz-Jobs: FINAL und csv je Karte
for d in divergent:
    if d['id'] in MANUAL:
        continue
    cid = d['id']
    add_job('%s-fin' % cid, 'w', dict(W[cid]))
    add_job('%s-csv' % cid, 'w', wcsv_spec(cid))
# (2) 106 Tachyonlanze — FINAL-Basis (dmg 11/SAbz 6/PzAbz 1/E 4) + csv-Basis
#     (dmg 8/SAbz 5/PzAbz 1/E 4); Christophers Frage: dmg 8->6/7 und/oder
#     Abzuege +1 (SAbz -6, PzAbz -2)
add_job('106-fin', 'w', dict(W['106']))
for dm in (10, 9, 8, 7, 6):
    add_job('106-fin-dmg%d' % dm, 'w', wvar(W['106'], dmg=dm))
add_job('106-fin-SAbz7', 'w', wvar(W['106'], sh=7))
add_job('106-csv', 'w', wcsv_spec('106'))
add_job('106-csv-dmg7', 'w', wvar(wcsv_spec('106'), dmg=7))
add_job('106-csv-dmg6', 'w', wvar(wcsv_spec('106'), dmg=6))
add_job('106-csv-SAbz6', 'w', wvar(wcsv_spec('106'), sh=6))
add_job('106-csv-SAbz6-PzAbz2', 'w', wvar(wcsv_spec('106'), sh=6, ar=2))
add_job('106-csv-dmg7-SAbz6', 'w', wvar(wcsv_spec('106'), dmg=7, sh=6))
add_job('106-csv-dmg7-SAbz6-PzAbz2', 'w', wvar(wcsv_spec('106'), dmg=7, sh=6, ar=2))
# (3) 107 Partikellanze — FINAL (dmg 9/SAbz 9/E 1) + csv (dmg 7/SAbz 5/E 2)
add_job('107-fin', 'w', dict(W['107']))
for dm in (8, 7, 6):
    add_job('107-fin-dmg%d' % dm, 'w', wvar(W['107'], dmg=dm))
add_job('107-csv', 'w', wcsv_spec('107'))
add_job('107-csv-dmg6', 'w', wvar(wcsv_spec('107'), dmg=6))
# (4) 343 Laserphalanx — Divergenz dmg 6 (Frame) vs. 4 (csv)
add_job('343-fin', 'w', dict(W['343']))
add_job('343-csv', 'w', wcsv_spec('343'))
# (5) 405 Thermallanze — FINAL (dmg 7/SAbz 5/E 1) + csv (dmg 6/SAbz 5/E 2),
#     Christophers Hebel: SAbz -5 -> -6 auf beiden Basen
add_job('405-fin', 'w', dict(W['405']))
add_job('405-fin-SAbz6', 'w', wvar(W['405'], sh=6))
add_job('405-csv', 'w', wcsv_spec('405'))
add_job('405-csv-SAbz6', 'w', wvar(wcsv_spec('405'), sh=6))
# (6) 347 Impulslaser — FINAL dmg 5/SAbz X/PzAbz 3; Christophers Varianten:
#     dmg 4 mit SAbz X (bleibt), SAbz 5, SAbz 4 (X-aquivalent), SAbz 3
add_job('347-orig', 'w', dict(W['347']))
add_job('347-dmg4-X', 'w', wvar(W['347'], dmg=4))
add_job('347-dmg4-SAbz5', 'w', wvar(W['347'], dmg=4, sh=5))
add_job('347-dmg4-SAbz4', 'w', wvar(W['347'], dmg=4, sh=4))
add_job('347-dmg4-SAbz3', 'w', wvar(W['347'], dmg=4, sh=3))
# (7) 318 Nova-Torpedos — dmg 14->16 UND TAbz -7 -> -8
add_job('318-orig', 'w', dict(W['318']))
add_job('318-dmg16-TAbz8', 'w', wvar(W['318'], dmg=16, pd_=8))
# (8) 412 Langstreckentorpedos — orig + dmg 10 (Vergleich 136 Plasmatorpedos)
add_job('412-orig', 'w', dict(W['412']))
add_job('412-dmg10', 'w', wvar(W['412'], dmg=10))
# (9) 406/349 Statkarten — HP druecken (Christopher: NICHT Energie)
add_job('406-orig', 'c', dict(C['406']))
add_job('406-hp4', 'c', cvar(C['406'], hp=4))
add_job('406-hp3', 'c', cvar(C['406'], hp=3))
add_job('349-orig', 'c', dict(C['349']))
add_job('349-hp1', 'c', cvar(C['349'], hp=1))
add_job('349-hp0', 'c', cvar(C['349'], hp=0))

VKEYS = [j['key'] for j in JOBS if j['part'] == 'v']

# --------------------------------------------------- Messung Teil B (CRN) ---
blank = lambda: [dict(out=0.0, take=0.0, col=0.0, loot=0.0, prevent=0.0)
                 for _ in range(2)]
acc = {k: blank() for k in VKEYS}
accn = {k: [0, 0] for k in VKEYS}

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
        print('Kaputter Checkpoint, Neustart Teil B:', ex)
        start = 0
        acc = {k: blank() for k in VKEYS}
        accn = {k: [0, 0] for k in VKEYS}

random.seed(42)
VJOBS = [j for j in JOBS if j['part'] == 'v']
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
        print('Teil B: Gefecht %d/%d (%.0fs)' % (it + 1, N, time.time() - t0),
              flush=True)
os.remove(CKPT_PATH) if os.path.exists(CKPT_PATH) else None
print('Teil B fertig: %.0fs' % (time.time() - t0), flush=True)

# --------------------------------------------- Messung Teil C (Rarity-Tausch) ---
SWAPS = {'310': 5, '103': 4, '223': 3, '312': 2,
         '343': 2, '537': 1, '522': 1, '344': 2}
POOL = G['POOL']
idmap = {p['id']: p for p in POOL}
for cid, rar in SWAPS.items():
    idmap[cid]['rarity'] = rar
TOT = sum(v10.RARITY_W[p['rarity']] for p in POOL)
PPROB = [v10.RARITY_W[p['rarity']] / TOT for p in POOL]
WPIDX = [i for i, p in enumerate(POOL) if p['kind'] == 'w']
_WPT = sum(PPROB[i] for i in WPIDX)
WPPROB = [PPROB[i] / _WPT for i in WPIDX]
G['TOT'] = TOT
G['PPROB'] = PPROB
G['WPIDX'] = WPIDX
G['_WPT'] = _WPT
G['WPPROB'] = WPPROB

SJOBS = []
for cid, rar in SWAPS.items():
    kind = 'w' if cid in W else 'c'
    spec = dict(W[cid]) if kind == 'w' else dict(C[cid])
    key = ('s', cid, kind, spec.get('damage'), spec.get('energy'),
           spec.get('hp'), spec.get('speed'))
    SJOBS.append(dict(label='swap-%s->r%d' % (cid, rar), kind=kind,
                      spec=spec, part='s', rarity=rar, key=key))
sacc = {j['key']: blank() for j in SJOBS}
saccn = {j['key']: [0, 0] for j in SJOBS}

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
        print('Teil C: Gefecht %d/%d (%.0fs)' % (it + 1, N, time.time() - t0),
              flush=True)
print('Teil C fertig: %.0fs' % (time.time() - t0), flush=True)

# ------------------------------------------------------------ Auswertung ---
def score_of(key, job, accd, accnd):
    n = accnd[key]
    if n[0] + n[1] == 0:
        return None
    gains = []
    for s in (0, 1):
        if n[s] > 0:
            gains.append(sum(accd[key][s].values()) / n[s])
    gain = sum(gains) / len(gains)
    hp = job['spec']['hp'] if job['kind'] == 'c' else 0
    units = (job['spec']['units'] if job['kind'] == 'c'
             else v11.weapon_units(job['spec']))
    return (gain + HP_STATIC * hp) / (units + 1.0)


job_rows = []
for j in VJOBS:
    sc_ = score_of(j['key'], j, acc, accn)
    tgt = TARGETS[j['rarity']]
    job_rows.append(dict(label=j['label'], id=j['spec']['id'],
                         rarity=j['rarity'], score=None if sc_ is None
                         else round(sc_, 3), target=tgt,
                         delta=None if sc_ is None else round(sc_ - tgt, 3)))
swap_rows = []
for j in SJOBS:
    sc_ = score_of(j['key'], j, sacc, saccn)
    tgt = TARGETS[j['rarity']]
    swap_rows.append(dict(label=j['label'], id=j['spec']['id'],
                          rarity=j['rarity'], score=None if sc_ is None
                          else round(sc_, 3), target=tgt,
                          delta=None if sc_ is None else round(sc_ - tgt, 3)))

# Divergenz-Bewertung: csv vs. Frame, Notwendigkeit des Overrides
v23 = {}
try:
    fc = json.load(open('diag_random_v23_r13t.json', encoding='utf-8'))
    v23 = {r['id']: r['score'] for r in fc.get('weapons', [])}
except Exception:
    pass


def band(s, t):
    return s is not None and abs(s - t) <= THRESH


JROW = {r['label']: r['score'] for r in job_rows}
div_rows = []
for d in divergent:
    cid = d['id']
    tgt = TARGETS[d['rarity']]
    s_fin = JROW.get('%s-fin' % cid)
    s_csv = JROW.get('%s-csv' % cid)
    if cid == '347':
        s_fin = s_csv = JROW.get('347-orig')      # X-neutral gegen csv
    bf, bc = band(s_fin, tgt), band(s_csv, tgt)
    if bc and bf:
        rec = 'RUECKNAHME (beide im Band)'
    elif not bc and bf:
        rec = 'Override NOTWENDIG'
    elif bc and not bf:
        rec = 'RUECKNAHME DRINGEND (Override wirft Karte aus dem Band)'
    else:
        rec = 'BEIDE AUSSERHALB (weiterer Hebel noetig)'
    div_rows.append(dict(id=cid, title=d['title'], rarity=d['rarity'],
                         diffs=[list(x) for x in d['diffs']], target=tgt,
                         score_csv=s_csv, score_fin=s_fin,
                         score_v23b=v23.get(cid), rec=rec))

result = dict(N=N, seed=42, frame='v23b', hp_static=HP_STATIC,
              targets=TARGETS, thresh=THRESH,
              jobs=job_rows, swap=swap_rows, divergence=div_rows,
              x_neutral=x_neutral_cards,
              stat_divergence=[], elapsed=round(time.time() - t0, 1))
with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=1)

print('\n===== TEIL B: Varianten (%d Jobs) =====' % len(job_rows))
for r in sorted(job_rows, key=lambda x: (x['id'], x['label'])):
    print('%-22s r%d Ziel %.1f  Score %-6s Delta %-6s' %
          (r['label'], r['rarity'], r['target'],
           'n/a' if r['score'] is None else '%.2f' % r['score'],
           'n/a' if r['delta'] is None else '%+.2f' % r['delta']))
print('\n===== TEIL C: Rarity-Tausch (gepatchtes Umfeld) =====')
for r in sorted(swap_rows, key=lambda x: x['id']):
    print('%-18s neu r%d Ziel %.1f  Score %-6s Delta %-6s' %
          (r['label'], r['rarity'], r['target'],
           'n/a' if r['score'] is None else '%.2f' % r['score'],
           'n/a' if r['delta'] is None else '%+.2f' % r['delta']))
print('\n===== TEIL A: Divergenz cards.csv vs. Frame (v9.FINAL) =====')
for d in div_rows:
    print('%-4s %-24s r%d Ziel %.1f  csv %-6s fin %-6s  %s' %
          (d['id'], d['title'], d['rarity'], d['target'],
           'n/a' if d['score_csv'] is None else '%.2f' % d['score_csv'],
           'n/a' if d['score_fin'] is None else '%.2f' % d['score_fin'],
           d['rec']))
print('\nX-neutral (in-game-Beschluss, keine Messung):',
      ', '.join(x['id'] for x in x_neutral_cards))
print('\nErgebnis: %s  (%.0fs)' % (OUT_PATH, time.time() - t0))
