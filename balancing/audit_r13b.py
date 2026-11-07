"""Runde 13b Audit: Verdachtsfaelle 115/103/166/438/237/101 + Torpedo-Struktur.

Analytische Zerlegung gegen die SHIP-Baseline-Pool-Verteilung (v9.SHIP)
und die 50er-Waffen-Population (FINAL, rarity-gewichtet).
Temporaer fuer die Analyse; danach loeschen.
"""
import balancing_metric_v9 as v9
import balancing_metric_v10 as v10

# ---- Baseline-Pool-Verteilung ----
pools = v9.SHIP
tot = sum(p for _, p in pools)
print(f'SHIP-Pools: {len(pools)} kanonische Pools, Summe p = {tot:.3f}')

def pool_stats():
    import collections
    stats = {'pd': [0, 0], 'shield': [0, 0], 'armour': [0, 0]}
    for cards, p in pools:
        for t in stats:
            pts = sum(c['points'] for c in cards if c['type'] == t)
            w = p / tot
            if pts > 0:
                stats[t][0] += w          # P(Typ vorhanden)
                stats[t][1] += w * pts    # E[Punkte | vorhanden]-Anteil
    print('Ziel-Schiff-Defense (Baseline-Verteilung):')
    for t in ('pd', 'shield', 'armour'):
        pr, epts = stats[t]
        print(f'  P({t}>0) = {pr*100:5.1f} %   E[gesamte {t}-Punkte je Schiff] = {epts:.2f}')
    # mindestens irgendeine Defense
    p_any = sum(p / tot for cards, p in pools
                if any(c['points'] > 0 for c in cards))
    print(f'  P(irgendeine Defense) = {p_any*100:.1f} %   '
          f'P(vollkommen nackt) = {(1-p_any)*100:.1f} %')
    return pools, tot

pools, tot = pool_stats()

# ---- Waffen-Einzelschuesse gegen die Pool-Verteilung ----
W = {str(w['id']): w for w in v10.load_attackers(final=True)}
all_w = v10.load_attackers(final=True)
RARITY_W = {0: 32, 1: 16, 2: 8, 3: 4, 4: 2, 5: 1}

def shots_vs_pools(wid, label):
    w = W[wid]
    e_dmg = 0.0
    e_raw = 0.0
    x_rate = 0.0
    for cards, p in pools:
        pw = p / tot
        # Ziel-Pool: Schild/Panzerung + 1 PD-Karte-Instanz je vorhandener PD (nah)
        pool = [dict(c) for c in cards]
        base = v9.base_damage(w)
        d = v9.resolve_attack(w, pool, base)
        e_dmg += pw * d
        e_raw += pw * base
        # X-Griff: Angriff haette Defense dieses Typs, aber X macht 0
        if any(w['abz'][t] == 'X' and any(c['type'] == t and c['points'] > 0 for c in pool)
               for t in ('pd', 'shield', 'armour')):
            x_rate += pw
    print(f'{label}: E[Rohschaden je Schuss] = {e_raw:.2f} | '
          f'E[Effektivschaden] = {e_dmg:.2f} | X-Griff (Angriff praegnet auf X-Defense) = {x_rate*100:.1f} %')

print()
for wid, lab in [('438', '438 Feldannihilator   (dmg 3, shield-1, armour X)'),
                 ('166', '166 Laserkanone       (dmg 3, shield X, armour-1)'),
                 ('237', '237 Mini-Railgun      (dmg 1, armour X)'),
                 ('101', '101 Quantentorpedos   (dmg 28, pd-14, shield-7, armour-4)'),
                 ('118', '118 Ionendisruptor    (dmg 6, abzugsfrei)'),
                 ('157', '157 Plasmawerfer      (dmg 7, shield X, armour-1)')]:
    shots_vs_pools(wid, lab)

# ---- Torpedo-Struktur: warum tief? ----
print()
print('Torpedo-Schuss vs Mehrphasen-Waffe (gleiche units):')
for wid, lab in [('101', '101 Quantentorpedos (single, range 2)'),
                 ('106', '106 Tachyonlanze     (PerRound, range 4)')]:
    w = W[wid]
    phases = [min(w['range'], 4)] if w['single'] else [p for p in (4, 3, 2, 1) if w['range'] >= p]
    e = 0.0
    for cards, p in pools:
        pool = [dict(c) for c in cards]
        per = [v9.resolve_attack(w, pool, v9.base_damage(w)) for _ in phases]
        e += p / tot * sum(per)
    # Einmal: 1 Schuss; PerRound: 1 Schuss je Phase
    n = 1 if w['single'] else len(phases)
    print(f'  {lab}: {n} Schuss(e), E[Effektivschaden je Schuss] = {e/max(1,n):.2f}, '
          f'gesamt = {e:.2f}, E[dmg] = {w["damage"]}')

# ---- Karten-Marginal: 103/115 absorbieren je Waffenschuss ----
print()
print('Marginal-Absorption von 103 (armour 3) / 115 (armour 1) je Waffenschuss,')
print('rarity-gewichtet ueber alle 50 FINAL-Waffen, gegen Pool-Verteilung:')
specs = {'103': {'type': 'armour', 'points': 3, 'recharge': 'never'},
         '115': {'type': 'armour', 'points': 1, 'recharge': 'attack'}}
for sid, spec in specs.items():
    tot_abs = 0.0
    wsum = 0
    for w in all_w:
        ww = RARITY_W.get(w['rarity'], 1)
        wsum += ww
        for cards, p in pools:
            pool_wo = [dict(c) for c in cards]
            pool_w = [dict(c) for c in cards] + [dict(spec)]
            base = v9.base_damage(w)
            a_wo = v9.resolve_attack(w, pool_wo, base)
            a_w = v9.resolve_attack(w, pool_w, base)
            tot_abs += p / tot * ww * (a_wo - a_w)
    print(f'  {sid}: E[marginal absorbiert je Waffenschuss] = {tot_abs/wsum:.2f} Marker')
