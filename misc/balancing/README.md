# Balancing-Metriken

Simulationsgestützte Balancing-Werkzeuge für Ausrüstungskarten: erwarteter Gefechtswert im Verhältnis zu den Einsatzkosten. Stand: Balancing-Runden 1–10 (3.11.2026). Alle Kampfmechaniken sind gegen den Server-Code verifiziert (Absorption/Reaktivierung, Reichweiten, Speed-Halbierung `<`, Mission/Raid, Kolonieangriff, Missionskontrolle).

## Skripte

| Skript | Zweck |
| --- | --- |
| `balancing_metric_v9.py` | Waffen-Metrik: Score = Ø ausgeteilte Marker ÷ Einsatzkosten, je Karte gegen das rarity-gewichtete Waffenfeld; Zielkurve je Rarität 4,5 / 4,75 / 5,0 / 6,0 / 6,5 (FINAL) |
| `balancing_metric_v10.py` | Defense-Metrik (19 reine Statkarten) als duale Umkehrung von v9 – Szenario-Modell (historisch, durch v11 abgelöst) |
| `marginal_values.py` | Marginalwerte synthetischer Defensivkarten (Punkte-Sättigung je Typ) als Grundlage für Kalibrierungsrunden |
| `balancing_metric_v11.py` | Defense-Flottenmetrik v11: 3v3-Gefechte mit gemischten, gespiegelten, aus Sektionen gebauten Flotten; Wert = Frame v2 (Output − Kolonie-Marker − verlorene Waffen + Missionslohn aus Kontrolle), Score = Wert-Gewinn ÷ Einsatzkosten |
| `check9_frame_calibration.py` | Gemeinsamer Kalibrierungsrahmen: misst alle 50 FINAL-Waffen und die 19 Statkarten im selben v11-Frame und verankert die gemeinsame Zielkurve v12 (Mediane der Waffen-Scores je Rarität) |

## Aufruf

```bash
python3 balancing_metric_v9.py [--final]    # Waffen; --final = FINAL-Dikt, sonst Repo-Status quo; erzeugt u. a. weapons_v9_final.json
python3 balancing_metric_v11.py [N]         # Defense-Kartenmetrik (N Gefechte, default 3000, inkrementell mit Cache)
python3 check9_frame_calibration.py [N]     # Kurven-Verankerung (default 3000); benötigt weapons_v9_final.json aus v9
python3 balancing_metric_v10.py [--repo]    # historisch (--repo = Status-quo-Waffenfeld, default FINAL)
python3 marginal_values.py
```

Datengrundlage: `../cards.csv` (oder `cards.csv` im selben Ordner – wird automatisch gefunden). Python 3, keine Abhängigkeiten. Ausgaben: `weapons_v9*.json` / `defense_v10.json` / `defense_v11.json` / `frame_calibration.json` im Skript-Ordner.

## Modellkonventionen (v9/v10, historisch, Beschlüsse 1.–3.11.2026)

- **Einsatzkosten v3 (positional):** 1. Sockel voll (Theta/Omega/Delta 0,7, normal 1,0), ab dem 2. Sockel normal 0,7 / billig 0,5, teurere Sockel zuerst; Energie 1. Energie 1,0, jede weitere 0,7.
- **Szenario:** 50 % Mission / 50 % Raid (Kolonieangriff erst ab Reichweite 1), Angriffswahrscheinlichkeit je Reichweite 100/95/90/70 %, Speed-Halbierung 0/10/20/25 %, Bestückungsgrad 0,67 (Ø 1,59 Waffeneinsätze je Schiff).
- **Defense-Verrechnung:** k ×1,59 auf Absorption + Speed; hp ×1 (Rumpfkonto wirkt einmalig); Panzerung m = 1+(k−1)·s mit Überlebensrate s am nackten Schiff (P1 1,15 / P2 1,28 / P3 1,41); „Unerschöpflich" volles k.
- **Dual-Use-Waffen** erhalten je Defensivpunkt-Typ einen dynamischen Credit (aus der v10-Marginalmessung × k).
- **Watchlist** automatisch ab +1,0 (bis +1,5); Nerf-Backlog ab +1,5.

## Zielkurve v12 und Frame v2 (Runden 8–10, 3.11.2026)

- **Gemeinsamer Anker** für Waffen und Statkarten: Ziel je Rarität = Median der 50 FINAL-Waffen-Scores im gemeinsamen v11-Frame (aktuell 2,06 / 2,57 / 2,63 / 3,02 / 2,74), unverglättet.
- **Wert-Konto je Gefecht (Frame v2):** Output-Marker − Kolonie-Marker (Kap 50 HP, Raid) − EQ_RATE × verlorene Waffen-Kosteneinheiten (je totem eigenen Träger) + Missionslohn.
- **Missionslohn:** Vorherrschafts-Sieg (15 Kontrolle, `rules.ts` controlLimit) ≡ Zerstörungs-Sieg (50 Kolonie-HP, `rules.ts` colonyHP) → 1 Kontrolle = 50/15 Marker; Lohn = 50/15 × max(0, Σ control eigene − gegnerische überlebende Schiffe) bei ≥ 1 Überlebendem (`battle.ts` applyMissionResult).
- **Missionswert-Korrektur für Speed-Karten** (Abfang-Vermeidung, Option B): 0,5 × 0,431 × (Lohn ohne Abfang − Ø Lohn im abgefangenen Gefecht) × speed.
- **Flottenmodell v11:** 3 Schiffe je Seite (je 1× ein-, zwei-, dreiteilig), gespiegelt; Waffen-Sockel-Kompatibilität; Raritäts-Gewicht = rarste Sektion (Bottleneck), zweistufige Typ/Build-Ziehung; Raid asymmetrisch mit Stationen als Verteidigern; Speed-Halbierung deterministisch `<` je Paar (Server-Code `equipment_card.ts`).
- **Offene Regler (per Playtest zu verankern):** EQ_RATE = 1,0 Marker je verlorener Kosteneinheit; Kolonie-Gewicht 1,0.

## Hinweise

- Die FINAL-Diktate in v9/v10 enthalten die beschlossenen, aber noch NICHT in `misc/cards.csv` bzw. Server-Code umgesetzten Wertänderungen (Runden 1–3); der default-Modus zeigt den Repo-Status quo.
- `check9_frame_calibration.py` setzt `weapons_v9_final.json` voraus (erst v9 mit `--final` ausführen).
- Kommentare und README bewusst deutsch (Spiel erscheint deutsch-first); Git-Konvention: Conventional Commits.
