"""Runde 13d: Zielklassen-Zerlegung fuer 438/166/237/157/101/118 und
PD->Schild/Panzerung-Umschichtungs-Sensitivitaet (Christophers Vorschlag).
Vereinfachung gegen v11: PD hier nur auf dem Ziel-Schiff (flottenweite PD-
Kaskade der v11 nicht abgebildet) - Richtung der Sensitivitaet bleibt gueltig.
"""
import balancing_metric_v9 as v9
import balancing_metric_v10 as v10

W = {str(w['id']): w for w in v10.load_attackers(final=True)}
pools = v9.SHIP
tot = sum(p for _, p in pools)
RARITY_W = {0: 32, 1: 16, 2: 8, 3: 4, 4: 2, 5: 1}

def klassen(pools):
    """Zielklassen: (pd, sh, ar) Flags."""
    k = {}
    for cards, p in pools:
        key = (any(c['type'] == 'pd' for c in cards and [c for c in cards if c['type'] == 'pd']),
               any(c['type'] == 'shield' for c in cards),
               any(c['type'] == 'armour' for c in cards))
        key = (bool([c for c in cards if c['type'] == 'pd']),
               bool([c for c in cards if c['type'] == 'shield']),
               bool([c for c in cards if c['type'] == 'armour']))
        k[key] = k.get(key, 0.0) + p / tot
    return k

print('=== Zielklassen der Baseline-Verteilung ===')
K = klassen(pools)
names = {(0,0,0): 'nackt', (0,0,1): 'nur Panz', (0,1,0): 'nur Schild',
         (0,1,1): 'Schild+Panz', (1,0,0): 'nur PD', (1,0,1): 'PD+Panz',
         (1,1,0): 'PD+Schild', (1,1,1): 'PD+Schild+Panz'}
for key in sorted(K, key=lambda x: -K[x]):
    print(f'  {names.get(key, key)}: {K[key]*100:5.1f} %')

def dmg_klasse(w, cards):
    pool = [dict(c) for c in cards]
    return v9.resolve_attack(w, pool, v9.base_damage(w))

print()
print('=== Effektivschaden je Schuss nach Zielklasse (Waffen-FINAL) ===')
waffen = [('438', 'Feldannihilator'), ('166', 'Laserkanone'), ('237', 'Mini-Railgun'),
          ('157', 'Plasmawerfer'), ('101', 'Quantentorpedos'), ('118', 'Ionendisruptor')]
hdr = 'Waffe                  ' + ''.join(f'{names.get(key, key)[:12]:>14}' for key in sorted(K, key=lambda x: -K[x]))
print(hdr)
for wid, name in waffen:
    w = W[wid]
    row = f'{wid} {name[:18]:20}'
    for key in sorted(K, key=lambda x: -K[x]):
        # gewichteter Mittelwert der Pools in dieser Klasse
        ed = sum(p * dmg_klasse(w, cards) for cards, p in pools
                 if (bool([c for c in cards if c['type'] == 'pd']),
                     bool([c for c in cards if c['type'] == 'shield']),
                     bool([c for c in cards if c['type'] == 'armour'])) == key) / max(K[key], 1e-9)
        row += f'{ed:14.2f}'
    print(row)

print()
print('=== PD -> Schild/Panzerung-Umschichtung (Christophers Vorschlag) ===')
print('Je PD-Karte im Pool: x % der Faelle -> zur Haelfte Schild-/Panzerungskarte')
print('mit GLEICHEN Punkten (PD1->S1/A1, PD2->S2/A2), Rest bleibt PD.\n')

def transform(pools, shift):
    """Umschichtung: jede PD-Karte wechselt mit W'keit shift zu Schild oder Panzerung."""
    import random
    rng = random.Random(42)
    new = []
    for cards, p in pools:
        nc = []
        for c in cards:
            if c['type'] == 'pd' and rng.random() < shift:
                t = 'shield' if rng.random() < 0.5 else 'armour'
                nc.append({'type': t, 'points': c['points'],
                           'recharge': v9.RECHARGE[t]})
            else:
                nc.append(dict(c))
        new.append((nc, p))
    return new

def stat(pools, label):
    K = klassen(pools)
    p_pd = sum(v for k, v in K.items() if k[0]) 
    p_sh = sum(v for k, v in K.items() if k[1])
    p_ar = sum(v for k, v in K.items() if k[2])
    print(f'{label}: P(PD) {p_pd*100:4.1f} % | P(Schild) {p_sh*100:4.1f} % | P(Panzerung) {p_ar*100:4.1f} %')
    # Waffen: Erwartungsschaden je Schuss
    for wid, name in waffen:
        w = W[wid]
        e = sum(p / tot * dmg_klasse(w, cards) for cards, p in pools)
        print(f'   {wid} {name[:18]:20} E[Schaden/Schuss] {e:5.2f} (Roh {v9.base_damage(w)})')
    # Karten-Marginal: 103 (A3), 115 (A1), 140 (S2), 170 (S1), 341 (PD2), 522 (S2), 184 (hp: entfaellt)
    specs = [('103', {'type': 'armour', 'points': 3, 'recharge': 'never'}),
             ('115', {'type': 'armour', 'points': 1, 'recharge': 'attack'}),
             ('140', {'type': 'shield', 'points': 2, 'recharge': 'phase'}),
             ('170', {'type': 'shield', 'points': 1, 'recharge': 'phase'}),
             ('341', {'type': 'pd', 'points': 2, 'recharge': 'phase'})]
    all_w = v10.load_attackers(final=True)
    for sid, spec in specs:
        tot_abs = 0.0; wsum = 0
        for w in all_w:
            ww = RARITY_W.get(w['rarity'], 1); wsum += ww
            for cards, p in pools:
                pool_wo = [dict(c) for c in cards]
                pool_w = [dict(c) for c in cards] + [dict(spec)]
                tot_abs += p / tot * ww * (v9.resolve_attack(w, pool_wo, v9.base_damage(w))
                                           - v9.resolve_attack(w, pool_w, v9.base_damage(w)))
        print(f'   {sid} marginal absorb./Schuss: {tot_abs/wsum:5.2f}')

for shift in (0.0, 0.5, 1.0):
    stat(transform(pools, shift), f'Shift {shift*100:.0f}%')
    print()
