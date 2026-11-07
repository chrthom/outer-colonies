# ============================================================================
# diag_infra_r13i.py — Infrastruktur-Balancing Runde I1, SPUR K (Kampfkonto)
# Erstmessung (Christophers Rahmen-Beschluesse + Korrekturen, 6.11.2026)
# ----------------------------------------------------------------------------
# Spur-K-Objekte (Scope Editionen 1-4, R0-R2; 105/114/413/305/155 draussen):
#   Kolonie-Defensive (planetar, nur Raid-Zellen, Seite 0; in ALLEN Zellen
#   gezaehlt — Mission = 0-Gain, Koedersystem-Präzedenz: keine Nachfrage
#   gehoert zum Kartenwert):
#     156 Planetarer Schild   r2, S1,  E-2  units 1.7 (E degressiv v3)
#     448 Schildkuppel        r1, S1,  E-1  units 1.0
#     169 Verteidigungsnetz   r1, PD2        units 0.5 (Floor)
#     238 Schmugglernest      r1, PD1        units 0.5 (K-Anteil;
#                                   W-Anteil +1 Handlimit in Preisrunde)
#     345 Autonomer Stuetzpunkt r1, PD1      units 0.5 (K-Anteil;
#                                   W-Anteil E+1 in Preisrunde)
#   ctrl (nur Missions-Zellen, BEIDE Rollen, an Schiff — ctrl verfaellt
#   an der Kolonie, Christophers Klarstellung):
#     239 Horchposten         r1, ctrl1, Psi-1, E-2  units 2.7
#
# Frame: v23i-Sonde (diag_random_r13t.py) mit ispec_col/ctrl-Spec
#   (additive Optional-Parameter, Default bit-identisch).
# Messung: N=10k, seed 42, CRN-gepaart je Szenario gegen Baseline
#   (identischer Szenario-Strom wie alle v23-Messungen).
#   Kolonie-Karten: 1 Rolle (Seite 0 — Raid-Verteidiger; side 1 hat im
#   Frame keine ueberfallene Kolonie, dokumentierte Rollen-Asymmetrie).
#   239: beide Rollen wie Statkarten (spin-Rotation it%3, Nicht-
#   platzierbar [kein freier Psi-Sockel] = None, nicht gezaehlt).
# Score-K = roll-gewichteter Delta-Gain / (units + 1.0) — statische
#   Spielkosten +1 konsistent v23; P_planetar folgt in der Preisrunde
#   (nur Spur W bzw. Hybrid-Karten), reine Spur-K-Karten OHNE Zuschlag.
# Konten: out/take/col/loot/prevent je Karte (Sicht der Platzierungs-
#   seite); hp der Defensiv-Karten bewusst NICHT bezahlt (Infra-Zer-
#   stoerung im Raid unbezahlt, I1-Beschluss 6).
# Output: diag_infra_r13i.json (+ Checkpoint/Resume).
# ============================================================================
import json
import os
import random
import time

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
N = int(os.environ.get('DIAG_N', '10000'))
CKPT_EVERY = 500
CKPT_PATH = 'diag_infra_ckpt_r13i.json'
OUT_PATH = 'diag_infra_r13i.json'

t0 = time.time()
SRC = open('diag_random_r13t.py', encoding='utf-8').read()
CUT = SRC.index('# ---------------- Messung mit Checkpoint')
G = {'__name__': 'r13t_defs',
     '__file__': os.path.join(HERE, 'diag_random_r13t.py')}
exec(compile(SRC[:CUT], 'diag_random_r13t.py', 'exec'), G)

v11, v10, v9 = G['v11'], G['v10'], G['v9']
battle_r = G['battle_r']
draw = G['draw_random_battle']
acc_side = G['acc_side']
HP_STATIC = G['HP_STATIC']
CTRL_W = G['CTRL_W']

# --- Spur-K-Objekte (Werte aus cards.csv, verifiziert 6.11.2026) -----------
# units: Sockel + Energie degressiv (Einsatzkosten v3: 1. Sockel normal
# 1.0 / billig 0.7, ab 2. 0.7 / 0.5; E 1.0, ab 2. 0.7), Floor 0.5;
# statische Spielkosten +1 kommt in score_of.
INFRA_COL = [
    dict(id='156', title='Planetarer Schild', rarity=2, tier='T2',
         e=-2, units=1.7,
         d=dict(type='shield', points=1, recharge='phase')),
    dict(id='448', title='Schildkuppel', rarity=1, tier='T1',
         e=-1, units=1.0,
         d=dict(type='shield', points=1, recharge='phase')),
    dict(id='169', title='Verteidigungsnetz', rarity=1, tier='T1',
         e=0, units=0.5,
         d=dict(type='pd', points=2, recharge='phase')),
    dict(id='238', title='Schmugglernest', rarity=1, tier='T1',
         e=0, units=0.5, hybrid='+1 Handlimit (W-Anteil Preisrunde, '
         'P_planetar in units_W)',
         d=dict(type='pd', points=1, recharge='phase')),
    dict(id='345', title='Autonomer Stuetzpunkt', rarity=1, tier='T1',
         e=0, units=0.5, hybrid='E+1 (W-Anteil Preisrunde, P_planetar '
         'in units_W)',
         d=dict(type='pd', points=1, recharge='phase')),
]
SPEC239 = dict(id='239', title='Horchposten', rarity=1, tier='T1',
               hp=0, speed=0, ctrl=1, req={'f': 1}, e=-2, units=2.7,
               hybrid='Aktion Information (W-Anteil Preisrunde)')

CHAN = ('out', 'take', 'col', 'loot', 'prevent')

random.seed(42)
start = 0
base = dict(tk0=0.0, tk1=0.0, d0=0.0, d1=0.0, col=0.0, loot0=0.0,
            raid=0, col_hit=0, loot_pos=0)


def blank_acc():
    return {k: 0.0 for k in CHAN}


def mk_stat(card, kind, n_roles):
    # cond_n/cond_gain = Bedarfs-Zellen (Kolonie-Karten: Raids;
    # 239: Missionen — dort fliesst der loot/prevent-Kanal)
    return dict(card=card, kind=kind,
                acc=[blank_acc() for _ in range(n_roles)],
                n=[0] * n_roles, n_gain=[0] * n_roles,
                cond_n=[0] * n_roles, cond_gain=[0.0] * n_roles)


STAT = {c['id']: mk_stat(c, 'col', 1) for c in INFRA_COL}
STAT['239'] = mk_stat(SPEC239, 'ship', 2)

if os.path.exists(CKPT_PATH):
    ck = json.load(open(CKPT_PATH, encoding='utf-8'))
    start = ck['iter']
    base.update(ck['base'])
    for k, st in ck['stat'].items():
        for i, a in enumerate(st['acc']):
            STAT[k]['acc'][i].update(a)
        STAT[k]['n'] = st['n']
        STAT[k]['n_gain'] = st['n_gain']
        STAT[k]['cond_n'] = st['cond_n']
        STAT[k]['cond_gain'] = st['cond_gain']
    print(f'Resume bei Gefecht {start}/{N}')

for it in range(start, N):
    sc = draw(random)
    r0 = battle_r(sc)
    base['tk0'] += r0['taken0']; base['tk1'] += r0['taken1']
    base['d0'] += r0['dealt0']; base['d1'] += r0['dealt1']
    base['col'] += r0['colony']; base['loot0'] += r0['loot0']
    if sc['raid']:
        base['raid'] += 1
        if r0['colony'] > 0:
            base['col_hit'] += 1
    elif r0['loot0'] > 0:
        base['loot_pos'] += 1
    a0 = acc_side(r0, 0)

    for c in INFRA_COL:
        st = STAT[c['id']]
        r = battle_r(sc, ispec_col=dict(c['d']))
        a = acc_side(r, 0)
        m = {k: a[k] - a0[k] for k in CHAN}
        st['acc'][0] = {k: st['acc'][0][k] + m[k] for k in CHAN}
        st['n'][0] += 1
        g = sum(m[k] for k in CHAN)
        if abs(g) > 1e-9:
            st['n_gain'][0] += 1
        if sc['raid']:
            st['cond_n'][0] += 1
            st['cond_gain'][0] += g

    for side in (0, 1):
        st = STAT['239']
        r = battle_r(sc, spin=it % 3, spec=dict(SPEC239),
                     spec_side=side)
        if r is None:
            continue
        a = acc_side(r, side)
        abase = acc_side(r0, side)
        m = {k: a[k] - abase[k] for k in CHAN}
        st['acc'][side] = {k: st['acc'][side][k] + m[k] for k in CHAN}
        st['n'][side] += 1
        g = sum(m[k] for k in CHAN)
        if abs(g) > 1e-9:
            st['n_gain'][side] += 1
        if not sc['raid']:
            st['cond_n'][side] += 1
            st['cond_gain'][side] += g

    if (it + 1) % CKPT_EVERY == 0 or it == N - 1:
        with open(CKPT_PATH, 'w', encoding='utf-8') as f:
            json.dump(dict(iter=it + 1, base=base,
                           stat={k: dict(acc=[dict(a) for a in v['acc']],
                                         n=v['n'], n_gain=v['n_gain'],
                                         cond_n=v['cond_n'],
                                         cond_gain=v['cond_gain'])
                                    for k, v in STAT.items()}), f)
        print(f'Gefecht {it + 1}/{N} (Checkpoint)', flush=True)

# ---------------- Auswertung ----------------
def score_k(st):
    c = st['card']
    gains, ns = [], []
    for i in range(len(st['n'])):
        if st['n'][i] == 0:
            continue
        g = sum(st['acc'][i][k] for k in CHAN) / st['n'][i]
        gains.append(g)
        ns.append(st['n'][i])
    if not gains:
        return None
    gain = sum(g * n for g, n in zip(gains, ns)) / sum(ns)
    return (gain + 0.0) / (c['units'] + 1.0), gain


rows = []
for cid, st in STAT.items():
    c = st['card']
    r_ = score_k(st)
    score, gain = r_ if r_ else (None, None)
    chan = {}
    tn = sum(st['n'])
    for k in CHAN:
        chan[k] = round(sum(st['acc'][i][k] for i in range(len(st['n'])))
                        / tn, 4) if tn else None
    cond = None
    if st['kind'] == 'col' and st['cond_n'][0]:
        cond = round(st['cond_gain'][0] / st['cond_n'][0], 4)
    rows.append(dict(
        id=c['id'], title=c['title'], rarity=c['rarity'], tier=c['tier'],
        kind=st['kind'], units=c['units'],
        hybrid=c.get('hybrid'),
        n=sum(st['n']), n_gain=sum(st['n_gain']),
        gain_share=round(sum(st['n_gain']) / max(1, sum(st['n'])), 3),
        gain_cond_raid=cond if st['kind'] == 'col' else None,
        gain=round(gain, 4) if gain is not None else None,
        score_k=round(score, 3) if score is not None else None,
        channels=chan))

out = dict(
    frame='I1 Spur K: v23i-Sonde + ispec_col (Koloniezone Seite 0, '
          'Raid-Zellen) + ctrl-Spec (239, Schiff, beide Rollen); '
          'Kolonie-Karten in ALLEN Zellen gezaehlt (Mission = 0-Gain, '
          'Koedersystem-Präzedenz); N, seed 42, CRN-gepaart; '
          'hp der Defensivkarten bewusst unbezahlt',
    n=N, seed=42,
    baseline=dict(
        taken0=round(base['tk0'] / N, 2),
        taken1=round(base['tk1'] / N, 2),
        dealt0=round(base['d0'] / N, 2),
        dealt1=round(base['d1'] / N, 2),
        colony=round(base['col'] / N, 3),
        loot0=round(base['loot0'] / N, 2),
        raid_share=round(base['raid'] / N, 3),
        raid_col_hit_share=round(base['col_hit'] / max(1, base['raid']), 3),
        mission_loot_share=round(base['loot_pos'] / max(1, N - base['raid']), 3)),
    cards=rows,
    runtime_s=round(time.time() - t0, 1))

with open(OUT_PATH, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

print(f"\n=== Infra-Spur K (Runde I1, N={N}, seed 42) ===")
b = out['baseline']
print(f"Baseline: taken0 {b['taken0']} / taken1 {b['taken1']} / col "
      f"{b['colony']} / loot0 {b['loot0']} / Raid {b['raid_share']:.0%} "
      f"/ Raid+m.Kolonietreffer {b['raid_col_hit_share']:.1%} "
      f"/ Mission+m.Loot {b['mission_loot_share']:.1%}")
for r in sorted(rows, key=lambda x: -(x['score_k'] or -9)):
    print(f"  {r['id']:>3} {r['tier']} r{r['rarity']} {r['kind']:4} "
          f"{r['title'][:20]:20} units {r['units']:.1f} "
          f"gain {r['gain']:+.3f} (Kond. Raid {str(r['gain_cond_raid']):>7}) "
          f"Anzahl>0 {r['gain_share']:.1%} Score_K {r['score_k']:+.3f}")
print(f"-> {OUT_PATH} ({out['runtime_s']} s)")
