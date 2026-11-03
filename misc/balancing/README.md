# Balancing-Metriken

Simulationsgestützte Balancing-Werkzeuge für Ausrüstungskarten: erwarteter Gefechtswert im Verhältnis zu den Einsatzkosten. Stand: Balancing-Runden 1–12 (3.11.2026). Alle Kampfmechaniken sind gegen den Server-Code verifiziert (Absorption/Reaktivierung, Reichweiten, Speed-Halbierung `<`, Mission/Raid, Kolonieangriff, Missionskontrolle).

## Skripte

| Skript | Zweck |
| --- | --- |
| `balancing_metric_v9.py` | Waffen-Metrik: Score = Ø ausgeteilte Marker ÷ Einsatzkosten, je Karte gegen das rarity-gewichtete Waffenfeld; Zielkurve je Rarität 4,5 / 4,75 / 5,0 / 6,0 / 6,5 (FINAL) |
| `balancing_metric_v10.py` | Defense-Metrik (19 reine Statkarten) als duale Umkehrung von v9 – Szenario-Modell (historisch, durch v11 abgelöst) |
| `marginal_values.py` | Marginalwerte synthetischer Defensivkarten (Punkte-Sättigung je Typ) als Grundlage für Kalibrierungsrunden |
| `balancing_metric_v11.py` | Defense-Flottenmetrik v11: 3v3-Gefechte mit gemischten, gespiegelten, aus Sektionen gebauten Flotten; Wert = Rahmen v3 (Output − Gegner-Output/taken − Kolonie + Missionslohn aus Kontrolle) inkl. Abfang-Ausdünnung in Missionen, Score = Wert-Gewinn ÷ Einsatzkosten |
| `check9_frame_calibration.py` | Gemeinsamer Kalibrierungsrahmen: misst alle 50 FINAL-Waffen und die 19 Statkarten im selben v11-Frame und verankert die gemeinsame Zielkurve v14 (Mediane der Waffen-Scores je Rarität) |
| `diag_frame_compare.py` | Runde-11-Diagnose: Vergleich der Wert-Rahmen-Alternativen (Frame v2 mit/ohne EQ-Konto, flacher Karten-Malus je gerettetem Schiff, bilaterale Differenz F*, Take-Gewicht-0,5-Sensitivität) – Entscheidungsgrundlage für Rahmen v3 |

## Aufruf

```bash
python3 balancing_metric_v9.py [--final]    # Waffen; --final = FINAL-Dikt, sonst Repo-Status quo; erzeugt u. a. weapons_v9_final.json
python3 balancing_metric_v11.py [N]         # Defense-Kartenmetrik (N Gefechte, default 3000, inkrementell mit Cache)
python3 check9_frame_calibration.py [N]     # Kurven-Verankerung (default 3000); benötigt weapons_v9_final.json aus v9
python3 diag_frame_compare.py [N]           # Rahmen-Diagnose (default 3000)
python3 balancing_metric_v10.py [--repo]    # historisch (--repo = Status-quo-Waffenfeld, default FINAL)
python3 marginal_values.py
```

Datengrundlage: `../cards.csv` (oder `cards.csv` im selben Ordner – wird automatisch gefunden). Python 3, keine Abhängigkeiten. Ausgaben: `weapons_v9*.json` / `defense_v10.json` / `defense_v11.json` / `frame_calibration.json` im Skript-Ordner.

## Modellkonventionen (v9/v10, historisch, Beschlüsse 1.–3.11.2026)

- **Einsatzkosten v3 (positional):** 1. Sockel voll (theta/omega/delta 0,7, normal 1,0), ab dem 2. Sockel normal 0,7 / billig 0,5, teurere Sockel zuerst; Energie 1. Energie 1,0, jede weitere 0,7.
- **Szenario:** 50 % Mission / 50 % Raid (Kolonieangriff erst ab Reichweite 1), Angriffswahrscheinlichkeit je Reichweite 100/95/90/70 %, Speed-Halbierung 0/10/20/25 %, Bestückungsgrad 0,67 (Ø 1,59 Waffeneinsätze je Schiff).
- **Defense-Verrechnung:** k ×1,59 auf Absorption + Speed; hp ×1 (Rumpfkonto wirkt einmalig); Panzerung m = 1+(k−1)·s mit Überlebensrate s am nackten Schiff (P1 1,15 / P2 1,28 / P3 1,41); „Unerschöpflich\" volles k.
- **Dual-Use-Waffen** erhalten je Defensivpunkt-Typ einen dynamischen Credit (aus der v10-Marginalmessung × k).
- **Watchlist** automatisch ab +1,0 (bis +1,5); Nerf-Backlog ab +1,5.

## Zielkurve v14 und Rahmen v3 (Runden 8–12, 3.11.2026)

- **Gemeinsamer Anker** für Waffen und Statkarten: Ziel je Rarität = Median der 50 FINAL-Waffen-Scores im gemeinsamen v11-Frame (aktuell 2,23 / 2,62 / 2,83 / 3,25 / 3,55; r5 = Trend-Extrapolation statt Messwert 2,88, denn strenge Monotonie: seltenere Rarität performt stets besser – der gemessene r5-Median lag unter r4, robust in N=3k/10k).
- **Wert-Konto je Gefecht (Rahmen v3, bilaterale Differenz):** Output-Marker − Gegner-Output (taken = Marker auf eigenen Schiffen, Take-Gewicht 1,0) − Kolonie-Marker (Kap 50 HP, Raid) + Missionslohn. Die bilaterale Differenz ist unter Schadensmarker-Persistenz (Heilung nur via Zurück-auf-Hand) die HP-Materiell-Bilanz: dealt − taken = (gegnerische HP zerstört und beschädigt) − eigene. EQ-Konto entfallen (Runde 11): Kartenanzahl im Szenario konstant 1/Schiff, Tode über taken/Output intern erfasst (Diagnose ±0,07 bei Rang-Korrelation +1,00).
- **Missionslohn:** Vorherrschafts-Sieg (15 Kontrolle, `rules.ts` controlLimit) ≡ Zerstörungs-Sieg (50 Kolonie-HP, `rules.ts` colonyHP) → 1 Kontrolle = 50/15 Marker; Lohn = 50/15 × max(0, Σ control eigene − gegnerische überlebende Schiffe) bei ≥ 1 Überlebendem (`battle.ts` applyMissionResult).
- **Abfang-Ausdünnung (Runde 12c, nur Missionen):** Abfänger-Schiffe mit Speed < langsamstem Schiff der Kartenflotte (nach Karten-Bonus) kommen nicht mit (Abfangregel: Speed ≥ langsamstem Missionsschiff; Spiegel-Baseline bleibt 3v3, Gleichstand qualifiziert). Ohne qualifizierten Abfänger entfällt das Gefecht und die Mission zahlt die volle Flotten-Kontrolle (CTRL_W × Σ control). Der Formel-Credit für Speed-Karten (Option B v1, 5,45 Marker je Speed-Punkt) ist entfallen – der Mechanismus ist jetzt endogen.
- **Flottenmodell v11:** 3 Schiffe je Seite (je 1× ein-, zwei-, dreiteilig), gespiegelt; Waffen-Sockel-Kompatibilität; Raritäts-Gewicht = rarste Sektion (Bottleneck), zweistufige Typ/Build-Ziehung; Raid asymmetrisch mit Stationen als Verteidigern; Speed-Halbierung deterministisch `<` je Paar (Server-Code `equipment_card.ts`).
- **Offene Regler (per Playtest zu verankern):** Take-Gewicht 1,0 (Obergrenze, Heilungs-Tempo-Kosten); Kolonie-Gewicht 1,0; optionaler Tod-Zuschlag über HP hinaus (Schiffs-/Ausrüstungskarten, symmetrisch gekürzt).

## Hinweise

- Die FINAL-Diktate in v9/v10 enthalten die beschlossenen, aber noch NICHT in `misc/cards.csv` bzw. Server-Code umgesetzten Wertänderungen (Runden 1–3); der default-Modus zeigt den Repo-Status quo.
- `check9_frame_calibration.py` setzt `weapons_v9_final.json` voraus (erst v9 mit `--final` ausführen).
- Kommentare und README bewusst deutsch (Spiel erscheint deutsch-first); Git-Konvention: Conventional Commits.
