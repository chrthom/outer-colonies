# Balancing-Metriken

Simulationsgestützte Balancing-Werkzeuge für Ausrüstungskarten: erwartete Schadensmarker je Gefecht im Verhältnis zu den Einsatzkosten. Stand: Balancing-Runden 1–3 (3.11.2026). Alle Kampfmechaniken sind gegen den Server-Code verifiziert (Absorption/Reaktivierung, Reichweiten, Speed-Halbierung, Mission/Raid, Kolonieangriff).

## Skripte

| Skript | Zweck |
| --- | --- |
| `balancing_metric_v9.py` | Waffen-Metrik: Score = Ø ausgeteilte Marker ÷ Einsatzkosten, je Karte gegen das rarity-gewichtete Waffenfeld; Zielkurve je Rarität 4,5 / 4,75 / 5,0 / 6,0 / 6,5 |
| `balancing_metric_v10.py` | Defense-Metrik (19 reine Statkarten): Score = Ø verhinderte Marker ÷ Einsatzkosten – duale Umkehrung von v9, gleiche Zielkurve |
| `marginal_values.py` | Marginalwerte synthetischer Defensivkarten (Punkte-Sättigung je Typ) als Grundlage für Kalibrierungsrunden |

## Aufruf

```bash
python3 balancing_metric_v9.py [--final]   # --final = beschlossene Änderungen (FINAL-Dikt), sonst Repo-Status quo
python3 balancing_metric_v10.py [--repo]   # --repo = Status-quo-Waffenfeld, default FINAL
python3 marginal_values.py
```

Datengrundlage: `../cards.csv` (oder `cards.csv` im selben Ordner – wird automatisch gefunden). Python 3, keine Abhängigkeiten. Ausgaben: `weapons_v9.json` / `weapons_v9_final.json` / `defense_v10.json` im Arbeitsverzeichnis.

## Modellkonventionen (Beschlüsse, 1.–3.11.2026)

- **Einsatzkosten v3 (positional):** 1. Sockel voll (Theta/Omega/Delta 0,7, normal 1,0), ab dem 2. Sockel normal 0,7 / billig 0,5, teurere Sockel zuerst; Energie 1. Energie 1,0, jede weitere 0,7.
- **Szenario:** 50 % Mission / 50 % Raid (Kolonieangriff erst ab Reichweite 1), Angriffswahrscheinlichkeit je Reichweite 100/95/90/70 %, Speed-Halbierung 0/10/20/25 %, Bestückungsgrad 0,67 (Ø 1,59 Waffeneinsätze je Schiff).
- **Defense-Verrechnung:** k ×1,59 auf Absorption + Speed; hp ×1 (Rumpfkonto wirkt einmalig); Panzerung m = 1+(k−1)·s mit Überlebensrate s am nackten Schiff (P1 1,15 / P2 1,28 / P3 1,41); „Unerschöpflich" volles k.
- **Dual-Use-Waffen** erhalten je Defensivpunkt-Typ einen dynamischen Credit (aus der v10-Marginalmessung × k).
- **Watchlist** automatisch ab +1,0 (bis +1,5); Nerf-Backlog ab +1,5.

## Hinweise

- Die FINAL-Diktate in v9/v10 enthalten die beschlossenen, aber noch NICHT in `misc/cards.csv` bzw. Server-Code umgesetzten Wertänderungen (Runden 1–3); der default-Modus zeigt den Repo-Status quo.
- Kommentare und README bewusst deutsch (Spiel erscheint deutsch-first); Git-Konvention: Conventional Commits.
