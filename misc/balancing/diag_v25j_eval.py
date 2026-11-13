import json, os, statistics as st
HERE = os.path.dirname(os.path.abspath(__file__))
new = json.load(open(os.path.join(HERE, 'diag_v25j_r13t.json')))['rows']
ref = {r['id']: r for r in json.load(open(os.path.join(HERE, 'diag_v25b_r13t.json')))['rows']}
TARGET = {1: -2.0, 2: -0.5, 3: 2.0, 4: 6.0}
new_by_id = {r['id']: r for r in new}
ships = [dict(id=r['id'], title=r['title'], rarity=r['rarity'], n=r['n'],
              score_t=(new_by_id[r['id']]['score_t'] if r['id'] in new_by_id else r['score_t']))
         for r in ref.values() if not r['station']]
print('Neue Schiffs-Mediane je Rarity (T(n) aktiv):')
for rar in sorted(TARGET):
    vals = [s['score_t'] for s in ships if s['rarity'] == rar]
    print('  r%d: %+6.2f (Ziel %+5.1f, Abw %+5.2f, N %d)' % (rar, st.median(vals), TARGET[rar], st.median(vals) - TARGET[rar], len(vals)))
print()
print('Abweichungen je Schiff gegen Zielkurve (|Abw| > 3):')
cnt = 0
for s in sorted(ships, key=lambda s: (s['rarity'], s['score_t'] - TARGET.get(s['rarity'], 0))):
    if s['rarity'] not in TARGET: continue
    abw = s['score_t'] - TARGET[s['rarity']]
    mark = ' *' if abs(abw) > 3 else ''
    if abs(abw) > 3:
        cnt += 1
        print('  r%d %-26s n%d  score %+6.2f  Abw %+5.2f%s' % (s['rarity'], s['title'][:26], s['n'], s['score_t'], abw, mark))
print('  -> %d Schiffe mit |Abw| > 3' % cnt)
