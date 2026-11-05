# Balancing

## Prinzipien (Christopher, Stand 1.11.2026)

- **Balancing-Philosophie: Intuition + Playtesting** – unterstützt durch die kalibrierte Waffen-Balancing-Metrik v9 (Szenario-Simulation + Zielkurve, siehe unten); finale Wertentscheidungen trifft Christopher
- Erster systematischer Playtest-Befund (Einsatzkosten vs. Wirkung, siehe unten): schwer einsetzbare, meist seltenere Karten kompensieren ihren Aufwand zu wenig; weitere Befunde folgen
- Die **Sol-Progression ist gewollt** wie implementiert

## Playtest-Befunde

### Einsatzschwierigkeit wird nicht ausreichend kompensiert (1.11.2026, Christopher)

Schwer einsetzbare Karten – meist seltenere Waffen mit Energiebedarf und/oder 2+ (Spezial-)Sockeln – sind pro Karte zwar stärker als einfach einsetzbare, im Playtest hat der Stärkevorteil den nötigen Aufwand (Großschiff mit passenden Sockeln, Reaktor am Schiff, Verfügbarkeit) aber nicht kompensiert. Die Kurve „Einsatzschwierigkeit → zusätzliche Stärke" ist zu flach.

**Beispiel Archenemitter (303) vs. 2× Railgun (180):**
- **303 Archenemitter** (rarity 5, Edition 3): Reichweite 3, 6 Schaden, keine Schild-/Panzerungsabzüge („Verteidigungssysteme wirkungslos"); 2 Xi-Sockel + 2 Energie → nur auf großen Mehrkarten-Schiffen einsetzbar, braucht zusätzlich z. B. einen Atomreaktor am Schiff
- **2× 180 Railgun** (rarity 1, Edition 1): zusammen ebenfalls 2 Xi-Sockel + 6 Schaden bei Reichweite 3, keine Energie; auf 2 Schiffe verteilbar; je Treffer 3 Schaden mit Panzerungsabzug (−2)
- Einziger verbleibender Vorteil des Archenemitters: Schaden kann nicht durch Panzerung/Schilde blockiert werden – für rarity 5 + 2 Energie + Großschiff-Hürde deutlich zu wenig (Potenzialschaden je Gefecht: Archenemitter 3×6 = 18, 2× Railgun 2×(3×3) = 18 – identisch)

**Waffen-Balancing-Metrik v9 (kalibriert am 2.11.2026, n=50 implementierte Waffen mit Schadenswerten, `misc/cards.csv`):**

Ersetzt v8 (1.11.2026) als aktive Metrik; [balancing_metric_v8.py](balancing_metric_v8.py) bleibt als Referenz. Voll-Simulation des Gefechts gegen Defensivszenarien, Mechanik verifiziert gegen Server-Code (`card.ts`, `equipment_card.ts`, `card_profile.ts`); **Validierung**: v9 reproduziert v8 exakt, wenn die neuen Wahrscheinlichkeiten neutralisiert werden (0/50 Abweichungen).

Kampfmodell (pro Angriff, wie v8):
- Reduktion = |Waffen-Abzug| × Defensivpunkte je Karte, Reihenfolge PD → Schild → Panzerung; Verteidigungskarte wird deaktiviert, wenn Angriffsschaden ≥ Reduktion (sonst Schaden 0, Karte bleibt aktiv); Schild/PD reaktivieren je Phase, Panzerung nie
- Abzugsfrei (Spalte leer/0) = kein Angriffsschritt gegen diesen Defense-Typ (Defense bleibt aktiv); „X" = Angriff wird vollständig absorbiert (Defense bleibt aktiv)
- „Einmalige Verwendung" = genau 1 Angriff pro Gefecht; wiederaufladbare Waffen greifen je Gefechtsphase (Reichweite 4→1) einmal an

v9-Neuerungen (Christopher, 2.11.2026):
- **Angriffs-Wahrscheinlichkeit je Reichweite** (ATTACK_PROB): R4 100 %, R3 95 %, R2 90 %, R1 70 % – R1 birgt die Gefahr, nie zum Einsatz zu kommen
- **Speed-Halbierung** (HALF_PROB): Chance auf halbierten Schaden (`equipment_card.ts`: `target.isFlightReady && attacker.speed + range < target.speed` → `Math.round(damage/2)`), gilt nur gegen flugbereite Schiffe – **Kolonien werden nie halbiert**. Kalibrierung R4–R1 = **0 %/10 %/20 %/25 %**; Datenbasis aus der Speed-Verteilung der 50 implementierten Hüllen (Paar-Rechnung): 2 %/10 %/19 %/26 %. Modelliert als Zwei-Zweig-Approximation (voller/halber Schaden, Mischung je Phase)
- **Mission vs. Raid 50:50** (Christophers Entscheidung 2.11.2026, vorher 85:15): Mission = reines Schiffsgefecht, **kein** Kolonie-Angriff möglich. Raid = Kolonie erst ab R1 angreifbar (`battle.ts` stellt Kolonie-Stacks bei range==1 zu); dort Zielwahl `max(Schiffsangriff, Kolonie-Angriff)`, „Verheerend (Kolonie)" = Schaden ×2 nach Abzügen; ap1 = 70 % gilt auch für den Kolonie-Angriff (Annahme, dokumentiert)
- **Einmalwaffen: bester Einsatzzeitpunkt** – genau 1 Schuss zum Maximum über alle einsetzbaren Gefechtsreichweiten; gegen Schiffe ist max. Reichweite praktisch immer optimal, im Raid kann der R1-Kolonieangriff besser sein (bestätigt: 167 Nukleare Torpedos ~11,3 vs. ~3,7; auch 554 Pegasus-Torpedos ohne CK)
- **Spezialfälle** (Server-Code `attackDamageBeforeReductions`): **203 Leerenfeld, 401 Guillotine, 438 Feldannihilator** = 0 Schaden gegen Kolonie („Wirkungslos (Kolonie)"); **401 Guillotine** = Schaden −6 je Zielspeedpunkt (Ø Zielspeed 1,3 → Ø −7,8 Schaden gegen Schiffe); **224 Bergbaulaser** = wirkungslos gegen Schiffe mit speed ≥ 3 (32 % der Hüllen → Faktor 0,68 gegen Schiffe, gegen Kolonie voll wirksam, CK ×2)
- **Score = (0,5 × Mission + 0,5 × Raid) ÷ Einsatzkosten**, plus **+1,5 je Defensivpunkt** für Dual-Use-Waffen (eigene abm/shield/armour-Punkte; ihr Defensivnutzen ist im Offensiv-Score nicht enthalten). Einsatzkosten (Christopher, 2.11.2026 v2; **3.11.2026 final v3, positional** – Billig-Sockel ab dem 2. Sockel der Karte nur 0,5 statt 0,7, analog zur Degression normaler Sockel 1,0 → 0,7): **1. Sockel voll (Theta/Omega/Delta: 0,7; normale: 1,0), weitere Sockel: normal 0,7, billig 0,5 — bei gemischten Sockeln zählt der teurere Sockel zuerst** (150 Phi+Omega: Phi 1,0 + Omega 0,5 = 1,5); **Energie: 1. Energie 1,0, jede weitere 0,7** (E2=1,7, E3=2,4, E4=3,1, E5=3,8). Effekt: 1-Theta/0-E-Karten (viele r1-Leichtwaffen) +43 %, Mehrsockel-Karten im Divisor −15 %; v3 zusätzlich: Karten mit einem 2. Billig-Sockel nochmal −0,2 (unter den 50 Waffen nur 224/421/150 betroffen, keine Waffe nutzt Delta oder Xi+Theta).

Szenario-Mix v9.3 (2.11.2026, datenbasiert aus `cards.csv` + Server-Häufigkeiten statt Handmix): Verteilung **50 % Mission / 50 % Raid** (Christopher). **Rarity-Gewichtung** (Christopher, 2.11.2026): r1 doppelt so häufig wie r2, r2 doppelt so häufig wie r3 usw. (Gewicht 2^(5−r); r0 = Reihe fortgesetzt, doppelt so häufig wie r1 – Annahme). Schiffsgefecht – Verteilungsszenarien aus den echten Ausrüstungs-Häufigkeiten abgeleitet (rarity-gewichtet): je Ausrüstungs-Zug P(PD1) 13,7 %, P(PD2) 9,1 %, P(S1) 5,1 %, P(S2) 3,4 %, P(Pz1) 4,8 %, P(Pz2) 4,8 %, P(Pz3) 0,1 %, keine Defense 58,9 %; je Schiff `min(Sockelzahl, 4)` Sockel (Sockelverteilung der 48 echten Hüllvarianten aus `hull_*.ts`, Ø 6,4 Sockel, Kappung bei 4 wegen Karten-Nachschub), davon jeder mit **EQUIP_FILL = 0,67** tatsächlich mit einer Ausrüstungskarte bestückt (v9.3, kalibriert auf Christophers Playtest-Schätzung „fast 30 % aller Schiffe ohne Defense"; 0,67 → exakt 30,0 % nackt; ohne Fill-Faktor wären es nur 14,1 %); exakte Multinomial-Enumeration aller Permutationen → **173 Schiffs-Szenarien**: **nackt 30,0 %**, P(PD) 46,4 %, P(Schild) 20,0 %, P(Panzerung) 22,7 % (PD bleibt klare Nummer 1: 66 % der verteidigten Schiffe tragen PD); Top: nackt 30,0 %, PD1 13,9 %, PD2 11,7 %, Pz2 5,2 %, Sch1 5,2 %, Pz1 4,9 %. **Schild+Panzerung-Permutationen vollständig enthalten** (auch alle Kombis ohne PD). Kolonie-Verteidigung im Raid – 3 Ziehungen aus dem Koloniezonen-Pool (20 Karten: 10 planetare Infrastruktur + 10 Orbs; je Ziehung PD1 12,4 %, PD2 6,0 %, S1 9,8 %, Pz1 0,8 %, keine 71,1 %; unskaliert, kein Fill-Faktor) → **30 Kolonie-Szenarien**: nackt 35,9 %, PD1 18,8 %, S1 14,8 %, PD2 12,4 %, PD1+S1 5,2 %, P(Pz) nur 2,2 %. **162 Schildüberladung ist nicht im Modell** (Taktik, nicht im Koloniezonen-Pool – Christopher, 2.11.2026); Kolonie-S2 entsteht aus 2× S1 (Titan/Planetarer Schild/Schildkuppel), Pz1 nur via Miranda 410. PD dominiert real (9 der 11 PD-Karten sind Dual-Use-Waffen).

**Zielkurve (neu angekurvt nach Kostenmodell-Umstellung, Christopher, 2.11.2026): R1 4,5 / R2 4,75 / R3 5,0 / R4 6,0 / R5 6,5.** Streng monoton, nah an den FINAL-Medianen unter dem Einsatzkosten-Modell v2 (4,65/4,86/4,33/6,08/6,56); r3 sitgt 0,67 darunter → die r3-Torpedos brauchen Buffs. Ersetzt die Kurven 3,75/4,0/4,5/5,5/6,5 (v9.3-Nackt-Kalibrierung) und 3,5/4,0/5,0/6,0/7,0 (v9.2). Regeln wie gehabt: seltenere Rarität muss stets besser performen; < −0,1 unter Ziel = Backlog, > +1,5 über Ziel = Nerf-Backlog, +1,0 bis +1,5 = Watchlist.

Status quo vor der Werteanpassung (Kostenmodell v2, 2.11.2026): Mediane r1 4,65 / r2 4,35 / r3 4,33 / r4 4,40 / r5 4,63 – die Kostenreform (1. Sockel voll, weitere 0,7; Theta/Omega von Anfang an 0,7) hebt Leichtwaffen (r1) stark, die Rare-Waffen hängen unten durch.

**Beschlossene Wertänderungen (Runden 1+2, 1.–2.11.2026 – noch NICHT im Repo umgesetzt; Stand: Kostenmodell v2, Zielkurve 4,5/4,75/5,0/6,0/6,5):**

| Karte | Änderung (vs. Repo) | Score | Δ Soll |
| --- | --- | --- | --- |
| 101 Quantentorpedos (r5) | dmg 24→28, PD-Abzug 9→14 | 5,93 | −0,57 |
| 106 Tachyonlanze (r5) | dmg 8→11 (E bleibt 4) | 6,63 | +0,13 |
| 107 Partikellanze (r4) | dmg 7→9, E 2→1, Schildabzug 5→8 | 6,28 | +0,28 |
| 125 Plasmakanone (r3) | dmg 14→17, Schildabzug 6→7 | 4,83 | −0,17 |
| 126 Kinetische Artillerie (r3) | dmg 8→7 | 5,30 | +0,30 |
| 127 Protontorpedos (r3) | dmg 15→14, Schildabzug 7→8, Pz-Abzug 4→5 | 5,30 | +0,30 |
| 151 Kinetikwaffenbatterie (r2) | dmg 5→4 | 4,93 | +0,18 |
| 167 Nukleare Torpedos (r1) | Schildabzug 3→5, Pz-Abzug 4→5 | 5,37 | +0,87 |
| 179 Pulskanone (r1) | Panzerungsabzug 2→X (wirkungslos) | 5,44 | +0,94 |
| 180 Railgun (r1) | dmg 3→2 | 4,00 | −0,50 |
| 203 Leerenfeld (r5) | dmg 6→8, Schildabzug 1→2 | 6,56 | +0,06 |
| 207 Materiedesintegrator (r4) | dmg 4→3 | 7,04 | +1,04 (Watchlist) |
| 224 Bergbaulaser (r2) | dmg 7→10, Schildabzug 6→8; **Nerf 3.11.: dmg→8** | 4,46 | −0,29 |
| 302 Götterdämmerung (r5) | dmg 50→72, E 6→5 | 7,35 | +0,85 |
| 303 Archenemitter (r5) | dmg 6→8, E 2→1 | 7,02 | +0,52 |
| 304 Antimaterietorpedos (r5) | dmg 22→24, E 2→1, PD-Abzug 11→12 | 6,02 | −0,48 |
| 310 Gauss Kanone (r4) | dmg 5→7, E 3→2, Pz-Abzug 2→3 | 6,59 | +0,59 |
| 343 Laserphalanx (r1) | dmg 4→6 | 4,24 | −0,26 |
| 405 Thermallanze (r4) | dmg 6→7, E 2→1 | 5,72 | −0,28 |
| 409 Plasmabeschleuniger (r4) | dmg 27→26, E 2→1 | 5,81 | −0,19 |
| 421 Salvenlaser (r2) | dmg 6→9, E 2→1, Schildabzug 3→4 | 4,53 | −0,22 |
| 424 Sturmgeschütz (r2) | dmg 8→10, Pz-Abzug 4→5 | 4,48 | −0,27 |
| 438 Feldannihilator (r1) | dmg 2→3 | 4,35 | −0,15 |
| 441 Flechette-Werfer (r1) | dmg 5→4 | 4,81 | +0,31 |
| 420 Donnerkanone (r2) | dmg 11→13 | 3,97 | −0,78 |

- Runde-2-Fazit (2.11.2026, nach Kostenmodell v2 + Kurve 4,5/4,75/5,0/6,0/6,5): **Mediane FINAL r1 4,42 / r2 4,86 / r3 4,83 / r4 6,08 / r5 6,56** → Differenzen zum Soll −0,08/+0,11/−0,17/+0,08/+0,06 – alle innerhalb ±0,17, Raritäts-Treppe sauber (r2/r3 praktisch gleichauf). **Nerf-Backlog leer**, Watchlist nur noch 207 Materiedesintegrator (+1,04, dmg 3 beschlossen). Von den 25 beschlossenen Änderungen sitzen 15 innerhalb ±0,5; übersteuert nur 302 (+0,85) und 167/179 (je ~+0,9); die tiefsten verbliebenen Lücken sind 182 (−0,92, bewusst unverändert – Christopher), 420 (−0,78, dmg-13-Buff beschlossen) und das r3-Torpedo-Trio 216/318/412 (je ~−0,7)
- Umsetzung immer in `misc/cards.csv` **und** `server/src/components/cards/collection/*.ts` gleichzeitig (CSV/Code-Konflikte wie Issue #777 vermeiden)
- Metrik-Skript (reproduziert alle v9-Zahlen): [balancing_metric_v9.py](balancing_metric_v9.py) – `cards.csv` aus dem Repo danebenlegen, `python3 balancing_metric_v9.py [--final]`. Die Metrik-Skripte (v9, v10, marginal_values) liegen zusätzlich versioniert im Repo unter `misc/balancing/` ([PR #788](https://github.com/chrthom/outer-colonies/pull/788), Branch `feature/balancing-scripts`); Knowledge-Kopien bleiben der Arbeitsstand, Repo-Snapshots folgen nach jeder abgeschlossenen Runde via Branch + PR

**Backlog nach Runde 2 (Kostenmodell v2, Kurve 4,5–6,5, Ausgabe mit `--final`):**
- Unter der Kurve: 23 von 50 Karten; größte Lücken: **420 Donnerkanone (−1,43 → nach dmg-13-Buff jetzt −0,78; CK-Frage geklärt: Christopher hat die gedruckte Karte geprüft – KEIN „Verheerend (Kolonie)", Server-Code (plain EquipmentCardRechargeable) und CSV korrekt)**, 182 Dual-Lasergeschütz (−0,92, bewusst unverändert – Christopher), 216 Schwarmraketensystem (−0,72), 340 Abfangraketenwerfer (−0,71), 318 Nova-Torpedos (−0,70), 412 Langstreckentorpedos (−0,67), 101 Quantentorpedos (−0,57), 180 Railgun (−0,50), 555 Penetrator-Torpedos (−0,45), 150 Fusionsbombentorpedos (−0,45), 223 Massebeschleuniger (−0,40), 554 Pegasus-Torpedos (−0,34), 405 Thermallanze (−0,28), 440 Impulskanone (−0,28), 424 Sturmgeschütz (−0,27), 343 Laserphalanx (−0,26), 421 Salvenlaser (−0,22), 234 Punktabwehrlaser (−0,21), 409 Plasmabeschleuniger (−0,19), 125 Plasmakanone (−0,17), 438 Feldannihilator (−0,15), 209 Phasendisruptor (−0,13), 304 Antimaterietorpedos (−0,48) – die Grenzfälle wurden bewusst nicht angepasst (Christopher, 2.11.2026)
- **Nerf-Backlog (> +1,5): LEER.** Watchlist: nur 207 Materiedesintegrator (+1,04; dmg 3 beschlossen – bleibt zur Beobachtung, da kein Einzelschritt das Soll trifft). 302 (+0,85), 167 (+0,87), 179 (+0,94) sitzen über Soll, aber unterhalb der Watchlist-Schwelle. Entscheidung über weitere Schritte NACH DEM PLAYTEST

**Kostenmodell v3 (3.11.2026, Christopher – gilt einheitlich für Waffen- und Defense-Metrik):** Billig-Sockel (Theta/Omega/Delta) zählen ab dem 2. Sockel der Karte nur **0,5** statt 0,7 (positionell); der 1. Sockel bleibt voll (billig 0,7 / normal 1,0), teurere Sockel zuerst. Betroffen unter den 50 FINAL-Waffen: nur **3 Karten** – 224 Bergbaulaser (Θ+Ω: 1,4 → 1,2), 421 Salvenlaser (Θ+Θ: 2,4 → 2,2), 150 Fusionsbombentorpedos (Φ+Ω: 1,7 → 1,5); keine Waffe nutzt Delta oder Xi+Theta. Auswirkung (`--final` unter v3): **Mediane r1 4,42 / r2 4,90 / r3 4,83 / r4 6,08 / r5 6,56**; 150 (+0,12) und 421 (+0,19) verlassen die Unter-der-Kurve-Liste; **224 Bergbaulaser rutschte auf 5,90 (+1,15) → Watchlist. Nerf beschlossen (Christopher, 3.11.2026): dmg 10→8** (Schildabzug 8 bleibt; dmg 8 + SAbz 8 = 0 Schaden gegen Schildziele) → **4,46 (−0,29)**. Stand danach (`--final` unter v3): Mediane **4,42 / 4,88 / 4,83 / 6,08 / 6,56**, unter der Kurve 22 von 50 Karten, **Watchlist nur 207 (+1,04)**, Nerf-Backlog leer.

**Runde 3 (3.11.2026, Christopher – PD dynamisch, Schild stärken):**

- **Dynamischer Dual-Use-Credit (v9)** statt statisch +1,5 je Defensivpunkt: je Punkt-Typ aus der v10-Marginalmessung × k, kumulativ je 1/2/3 Punkte – **PD 0,84/1,16/1,19, Schild 2,38/3,10/3,33, Panzerung 2,40/3,65/4,36**. Alle 10 Dual-Use-Waffen tragen nur PD-Punkte (abm 1–2).
- **Moderate Dual-Use-Buffs** (Christopher: PD wirkt schiffsübergreifend = bewusst unbezahlter Flotten-Bonus; die PD-Abwertung als Ausgleich der Torpedo-Schwäche – Torpedos scheitern im Playtest am PD-reichen Feld, also PD-Karten nur vorsichtig aufwerten). Originalwerte (Christopher-Protokoll) neben dem Vorschlag:

| Waffe | Änderung | Score vorher → nachher |
| --- | --- | --- |
| 168 Automatikkanone (r1) | dmg 2→3 | 2,81 → 3,69 |
| 339 Gatling (r1) | dmg 2→3 | 2,81 → 3,69 |
| 234 Punktabwehrlaser (r1) | dmg 2→3 | 2,45 → 3,20 |
| 340 Abfangraketenwerfer (r2) | dmg 6→7 | 3,13 → 3,74 |
| 424 Sturmgeschütz (r2) | dmg 10→12 | 3,82 → 4,47 |
| 440 Impulskanone / 181 Flugabwehrkanone / 441 Flechette-Werfer / 130 Flakartillerie / 237 Mini-Railgun | unverändert | 3,56 / 4,15 / 4,15 / 4,64 / 3,76 |

- **SAbz-Erhöhungen überstarker Waffen** (SAbz macht die Waffe schwächer gegen Schildziele UND Schildpunkte feldweit stärker): 150 Fusionsbombentorpedos SAbz 3→4, 106 Tachyonlanze 5→6, 421 Salvenlaser 4→5, 107 Partikellanze 8→9, **167 Nukleare Torpedos nur 5→7** (Christopher-Korrektur), **127 Protontorpedos nur 8→10** (Christopher-Korrektur). Sättigungs-Ausschluss (SAbz ≥ dmg wäre wirkungslos): 344/166/157/347 und 302 (kaum Wirkung).
- **Sättigungs-Korrektur (Christopher, 3.11.2026, zutreffend):** Bei Schaden = Abzug × Defensivpunkte wird die Defense **deaktiviert**; nur bei Schaden < Abzug × Punkte bleibt sie intakt. Design-Regel für künftige Karten: SAbz unter dmg halten oder bewusst „wirkungslos gegen Schild" schreiben; mehr Waffen mit Schild-Abzug gewünscht (bestehende überstarke Waffen erhöhen UND neue Karten mit SAbz gestalten – Christopher: „beides").
- **X-Switch (3.11.2026, beschlossen):** 344 Fokuslaser, 166 Laserkanone, 157 Plasmawerfer, 347 Impulslaser (SAbz = dmg) → **„wirkungslos gegen Schild" (X)**. Metrikneutral (Scores identisch: 4,89/4,67/4,90/5,01 – gegen 1 Schildpunkt geht der Schuss in beiden Varianten auf 0 net), aber in-game bleibt das Schild nach dem Treffer **aktiv** → Schildpunkte feldweit stärker (bewusst unbezahlter Vorteil wie der PD-Flottenbonus; beide Metriken bilden Einzelangriffe je Phase ab und preisen den Effekt nicht). **347 zusätzlich auf die manuelle Watchlist gesetzt (+0,51)**.
- **Stand nach Runde 3 (`--final`):** Mediane **4,15 / 4,72 / 4,83 / 6,03 / 6,56** (Δ −0,35/−0,03/−0,17/+0,03/+0,06), unter der Kurve 28 von 50, **Nerf-Backlog leer**, Watchlist 207 Materiedesintegrator (+1,04) + manuell 347 Impulslaser (+0,51).

## Defense-Balancing-Metrik v10 (Nicht-Waffen-Statkarten, 3.11.2026)

**Umfang (Christopher, 3.11.2026):** die **19 reinen Statkarten** (Schild/Panzerung/PD/hp/Speed) – die 7 Utility-Karten (104, 124, 211, 212, 241, 325, 545) bleiben außen vor; Rumpf-Karten folgen später (benötigen Sockelwerte aus Equipment). **Gleiche Zielkurve wie Waffen (4,5/4,75/5,0/6,0/6,5)** – Waffen und Defensivsysteme konkurrieren um dieselben Sockel und Energie; ein Defensivsystem unter der Kurve wird nicht gespielt, wenn der Sockel auch eine Waffe aufnehmen könnte.

- **Score = erwarteter verhinderter Schaden (Marker) ÷ Einsatzkosten (Kostenmodell v3)** – duale Umkehrung von v9 (Score = ausgeteilter Schaden ÷ Kosten). Angreifer-Feld = die 50 FINAL-Waffen, rarity-gewichtet (2^(5−r)); Ziel-Pools = v9-Schiffs-Szenarien mit der Defensivkarte marginal obendrauf; Mission/Raid 50:50.
- Absorption wie im Server-Code (Schild/PD je Phase reaktiviert, Panzerung nie; „Unerschöpflich“ 115/312 sofort); Bedingungen: 312 Refraktorfeld nur in Pools ohne Schild, 426 Schildbooster nur mit ≥ 1 Schildpunkt; hp-Credit = E[min(hp, T)] (negativ = Spiegel-Debit).
- **Speed doppelseitig verrechnet** (Christopher, 3.11.2026): Speed verschiebt die Halbierungswahrscheinlichkeit um eine Reichweite – defensiv (weniger erlitten) und offensiv (mehr ausgeteilt, weil nicht halbiert), verrechnet auf Schiffs-Ebene mit Faktor k = 1,59 (Ø Sockel-Auslastung × EQUIP_FILL 0,67 × rarity-gewichteter Waffenanteil). Der Missions-Bonus (Abfangen nur mit Speed ≥ langsamstem Missionsschiff) bleibt bewusst unbezahlt (schwer quantifizierbar).
- **k-Faktor ×1,59 auf ALLE Defense-Effekte** (Christopher, 3.11.2026): eine Defensivkarte trifft im Gefecht die Ø k gegnerischen Waffeneinsätze → Basis-Absorption UND Speed werden × k verrechnet (ohne k wäre Defense auf ~70 % der Ø Waffenwirkung gedeckelt, Prävention ≤ Ø Marker-Aufbau 3,55, und die Waffenkurve ab r3 unerreichbar). **Zwei Ausnahmen (Christopher, 3.11.2026):**
  - **hp ×1**: hp-Bonus/-Malus wirkt einmalig aufs Rumpfkonto (verbraucht sich), unabhängig von der Angreiferzahl. Zerlegung additiv exakt: `total = m·Absorption + k·(Speed def + off) + 1·hp`.
  - **Panzerungs-m statt k**: Panzerpunkte deaktivieren sich beim Blocken (Schaden ≥ Abzug × Punkte) und blocken danach nicht mehr → zwischen ×1 und ×k interpoliert: **m = 1 + (k−1)·s**, s = P(Karte überlebt die 1-v-1-Salve) **am nackten Schiff** (Christopher: Pool-Schilde dürfen der Panzerung kein Überleben „schenken", das ihr als Wiederhol-Block gutgeschrieben würde; der verhinderte Schaden selbst bleibt marginal und wird nie durch Pool-Defense der Panzerung zugeschrieben). Nackt gemessen: **P1 s 25,7 % → m 1,15, P2 47,4 % → 1,28, P3 70,1 % → 1,41** (74,3 % des rarity-gewichteten Felds deaktiviert ein nacktes P1; 22,1 Prozentpunkte des Überlebens stammen von Panzer-Abzugs-X-Waffen: 168/179/237/339/438/441/203, 15,1 pp am Pool von PD/Schild-Vorfilterung, 4,1 pp kompletter Block). Unerschöpflich (115/312), Schild und PD behalten volles k (Reaktivierung).
- Verifikation: Hand-Check 421-Salvenlaser gegen S2 exakt (12,0 verhindert), Punkte-Liga plausibel; Schild-PUNKTE sind nicht schwach (S1 ~1,6, S2 ~2,0 Marker marginal je Waffeneinsatz) – schwache Schild-KARTEN liegen an E-Kosten (140 Deflektorschild: 2,4 Einheiten). 49 % des Waffenfelds haben Schild-Abzug, 98 % Panzer-Abzug. **Bewusst unbezahlte Vorteile (dokumentiert):** PD schiffsübergreifend (Flotten-Bonus), Speed-Abfangregel, X-Switch (Schilde bleiben in-game aktiv, Metrik neutral).
- **Baseline (3.11.2026, FINAL-Feld nach Runde 3 + X-Switch, k/m/hp-Verrechnung, 240-Zerlegungsfix):** Ø Marker-Aufbau am Feldschiff 3,63, Ø ausgeteilt 4,96 je Waffeneinsatz. Mediane r1 3,42 (−1,08) / r2 0,58 (−4,17) / r3 1,00 (−4,00) / r4 2,87 (−3,13) / r5 3,32 (−3,18) → **Defense braucht systematische Buffs (Kalibrierungsrunde offen).** Liga: 115 Ablative Magnetpanzerung 4,69 / 171 Titanplattenpanzer 4,05 / 163 Verbundpanzerung 3,76 / 170 Strahlenschilde 3,59 / 240 Ceramo-Stahl 3,43 / 184 Rumpferweiterung 3,42 / 103 Adamantiumpanzer 3,32 / 449 Schwerer Rumpf 3,12 / 406 Kohlenstoffsilikatpanzer 2,87 / 349 Dura-Stahl Platten 2,81 / 341 Ködersystem 1,72; am Boden: 522 Heckdeflektor 1,45 / 140 Deflektorschild 1,33 / 312 Refraktorfeld 1,00 / 537 Quantenmechanischer Antrieb 0,58 / 161 Ionenschubdüsen 0,41 / 109 Plasmanachbrenner 0,38 / 426 Schildbooster 0,09 / **434 Leichtbauweise −1,71** (einzige negative Karte, hp−3/sp+1). Skript: [balancing_metric_v10.py](balancing_metric_v10.py) (Ergebnis: `defense_v10.json`)

### Defense-Kalibrierungsrunde – Messstand (3.11.2026, Vorschläge unbestätigt)

Werkzeuge im Topic: `marginal_values.py` erweitert (Modi `points`/`hp`/`speed`, Aufruf `all`); neu `defense_buff_round.py` – misst Wert-Varianten der 19 Karten (v10 auf temporär modifizierter cards.csv; Pseudo-Spalten `@recharge` = Unerschöpflich-Umbau, `@cond_drop` = Bedingung entfernen; Batches A–F dokumentiert).

Frische Marginalmessung (FINAL-Feld, je Waffeneinsatz, in v10 ×k/m): S1 1,58 / S2 2,01 / S3 2,15 / S4 2,17 (**Schild-Sättigung ab S2**); P1 1,57 / P2 2,36 / P3 2,83 / P4 3,08; PD1 0,56 / PD2 0,76 / PD3 0,79 (**PD-Sättigung ab PD2**); P1u 2,07 (Unerschöpflich-Lift auf P1 ×1,32); hp+1…+8: 0,79/1,42/1,94/2,39/2,68/2,89/3,08/3,21 (×1, Kurs 0,13–0,79/Pkt); sp+1/+2/+3: 0,44/0,73/1,01.

Struktur-Befunde (messbar, 3.11.2026):
- **Verhinderungs-Deckel**: Ø Marker-Aufbau 3,63 je Waffeneinsatz begrenzt jede Karte auf ~5,8 verhindert (×k); Karten mit Kosten ≥ 1,2 Einheiten erreichen per Wertebuff nur ~3,0–4,9 → **r4/r5-Ziele (6,0/6,5) nur mit 0,7-Einheiten-Chassis + Unerschöpflich-Absorption erreichbar** (103/406 brauchen Sockel-Reduktion).
- **hp×Punkte-Überlappung**: hp frisst die Prävention der Punkte (406 P2+hp7: Abs-Rest nur 0,29) – Kombikarten addieren nicht.
- **hp-Kurs ×1 ≈ Speed-Kurs ×k** (0,13–0,79 vs. 0,47–0,70/Pkt): jeder −hp/+sp-Tausch ist metrisch ~Nullsumme → 434 Leichtbauweise bleibt mit Konzept unter der Kurve.
- **Szenario-Selbstbezug**: `build_scenarios()` leitet die v9-SHIP-Pools aus der cards.csv-Punkteverteilung ab → „nachher"-Scores nur im Konsistenzlauf (alle 19 Vorschläge gleichzeitig) valide (Batch F).
- **Strukturell unter der Kurve** (auch mit aggressiven Werten): reine Triebwerke 161/537/109 (Speed-Deckel ~2,2–2,5 bei 0,7 Einheiten; mit hp-Zugabe „verstärkte Struktur" kämen 161 auf 4,8 / 109 auf 5,8), 426 Schildbooster (Bedingung: marginal nur auf bereits geschildeten Pools ~0,1–0,2; ohne Bedingung 4,46), 434 Leichtbauweise (Trade-off-Deckel ~1,2).

Vorschlagspaket Batch F (alle 19 gleichzeitig; Christopher-Korrektur ausstehend): Mediane danach **r1 4,26 / r2 4,46 / r3 4,62 / r4 5,30 / r5 6,86** – Treppe streng monoton; r2-Median steht/fällt mit der 426-Redesign-Entscheidung. Details der Vorschläge in der Chat-Runde vom 3.11.2026; Entscheidungen folgen per Antwortliste.

**Kalibrierungs-Review (Christopher-Fragen 1–6, 3.11.2026, gemessen – Entscheidungen offen; Skripte [kalibrierung_check.py](kalibrierung_check.py)/[kalibrierung_check2.py](kalibrierung_check2.py)):**
1. **X vs „Schaden = Abzug": Metrik behandelt korrekt unterschiedlich** (Mikro-Test: S1 vs SAbz=dmg → Schild deaktiviert, Netto 0; vs X → bleibt aktiv; ab 2 Punkten bleibt die Karte auch numerisch aktiv, da Schaden < Abzug×Punkte). Die Runde-3-„Metrikneutralität" galt nur dem Waffen-Score gegen genau 1 Schildpunkt. **X-Switch-Kandidaten im FINAL-Feld: 107 Partikellanze (dmg 9/SAbz 9), 224 Bergbaulaser (dmg 8/SAbz 8)** – für Waffen metrikneutral, Schilde in-game stärker (nur wirksam bei Mehrfachangriffen je Phase; Modell simuliert 1 Angriff/Phase).
2. **Schild-Schwäche ist feld-seitig:** nur 19/50 Waffen mit numerischem SAbz (38 %; Werte Median ~6), 24 abzugsfrei, 7 X; Panzerung numeric 40/50, PD nur 13/50. Sättigung ab S2 (S3 +0,14, S4 +0,03 raw). Sensitivität gemessen: SAbz 3 für die 24 abzugsfreien Waffen → S1 +52 %, S2 +54 % (Ø Marker-Aufbau sinkt 3,63→3,39). Hebel: mehr SAbz-Waffen (Roadmap/Neukarten), Schild-Karten ≤ S2 designen, E-Kosten runter.
3. **Speed-Halbierung modellgerecht klein:** Shift nur +5–9 pp je Speed-Punkt (R1 25→30,3→35,9→40,2 %; R4 0→8→17→24 %), nur ×0,5 Schaden, Kolonien nie halbiert (Raid-Anteil 50 %) → sp+1 = 0,44 Marker je Waffeneinsatz. Größerer Real-Impact nur bei Mehrfachangriffen je Phase und über die Abfang-/Reichweitenrollen.
4. **Missionsbonus quantifiziert (Abfangregel)** – *KORRIGIERT, s. Review Runde 2: Treppe zählte Speed-0/−1-Hüllen als Abfänger; korrekt (nur speed ≥ 1): ≥2 98,8 / ≥3 88,3 / ≥4 61,3 / ≥5 2,5 %.* Alte (falsche) Treppe: ≥2 64,0 % / ≥3 57,3 % / ≥4 39,8 % / **≥5 1,6 %** / ≥6 0 %. Effekt je Speed-Punkt auf die Abfangbarkeit der eigenen (solo-)Mission: +1 → −6,7 pp, +2 → −24,2 pp, +3 → −62,4 pp (praktisch unabfangbar). Vorschlag: eigene Ausgabespalte „Missionswert" in v10 (kein Mixing in Marker-Score, Währungskonflikt: Missionserfolg = Karten/Rekrutierung, keine Marker), Design-Cap Speed +2.
5. **PD-Flottenbonus:** weiter unbezahlt bis Playtest-Flottendaten (Ø Flottengröße, Angriffsverteilung unbekannt); der eigentliche PD-Hebel ist der PAbz-Anteil von nur 26 %: PAbz 2 für die 37 abzugsfreien Waffen → PD1 +186 %, PD2 +189 % (Sättigung PD2→PD3 minimal). Hebel: mehr PD-Abzugs-Waffen (Torpedos) – Roadmap.
6. **Überlebens-Credit (Defense → Mehr-Output des überlebenden Schiffs) ist NICHT modelliert, quantifiziert:** MC (Poisson k=1,59 Waffeneinsätze × empirische Verteilung, rarity-gewichtete Hüllen): E[Marker-Aufbau je Gefecht] 5,79; P(Zerstörung je Gefecht) 53,7 % (Ein-Gefechts-Modell, ohne Reparatur); Flip-Dichte je verhindertem Marker 5,0 % → Credit ≈ ×1,10–1,20 (je nach Rest-Output-Anteil 25–50 %). **Symmetrisch zur Waffen-Seite** (Schaden, der die HP-Schwelle überschreitet, stoppt gegnerischen Output – gleicher Struktur), daher Empfehlung: beide Seiten unbezahlt dokumentieren ODER beide bezahlen (= Kurven −10–20 %), nicht nur Defense. Struktureller Hauptbefund bleibt: Waffen stapeln linear, Defense sättigt am Eingangs-Deckel (~5,8 verhindert je Gefecht) – r4/r5-Defense braucht 0,7-Einheiten-Chassis + Unerschöpflich.

### Kalibrierungs-Review – Runde 2 (3.11.2026): Entscheidungen, Korrekturen, Messungen

**Entscheidungen (Christopher, 3.11.2026):**
- **Feld-Hebel** (mehr SAbz-/PAbz-Waffen, Roadmap/Neukarten): **JA.**
- **Speed-Cap:** Ausrüstung gibt **max. +1 Speed**; Triebwerke brauchen **immer einen Delta-Sockel** (socket_g = Triebwerksspur; alle 4 Speed+-Karten tragen ihn bereits, keine Sockel-Migration nötig).
- **Überlebens-Credit:** **beide Metriken symmetrisch bezahlt** („beide symmetrisch einpreisen").

**λ_surv = 1,15 implementiert (v9 + v10, 3.11.2026):** `SURV_CREDIT = 1,15` multipliziert den Score-Numerator (v9: `(effective/units + credit)×λ`; v10: `total×λ`), Zielkurve ×1,15 → **5,18/5,46/5,75/6,90/7,48**, Schwellen ×1,15 (**Backlog ±0,115 / Watchlist +1,15 / Nerf +1,725**). Begründung: Flip-Dichte je verhindertem Marker 5,0 % (Defense-Seite, E[Aufbau] 5,79) bzw. 6,5 % (Waffen-Seite, E[ausgeteilt] 7,84) × 25–50 % Rest-Output → ×1,10–1,26, Mittel 1,15. Alle bisher dokumentierten Zahlen sind **nominell** (×1,15 = wahr); alle Deltas skalieren ×1,15, **keine Entscheidung kippt**: Waffen-Mediane wahr 4,77/5,42/5,56/6,93/7,54 (207 Watchlist +1,20, 347 manuell +0,58, kein Nerf-Eintrag); Defense-Baseline wahr **3,93/0,67/1,15/3,30/3,82** (defense_v10.json regeneriert).

**SAbz-Verifikation (Frage 2, [kalibrierung_check3.py](kalibrierung_check3.py)):** 19/50 Waffen numerischer SAbz (38 % raw), 7 X (14 %), 24 abzugsfrei; **rarity-gewichtet: numerisch 28,9 %, X 20,5 %, numerisch+X 49,4 %** – die alte „49 %"-Notiz war rarity-gewichtet inkl. X und stimmt. Vollständige 50-Waffen-Tabelle im Skript-Output.

**Mehrfachangriffe (Frage 3, [kalibrierung_check4.py](kalibrierung_check4.py)/[kalibrierung_check5.py](kalibrierung_check5.py)):**
- *2×-dieselbe-Waffe-je-Phase* (Christophers Beispiel): Ø Marker-Aufbau je Waffeneinsatz 3,63→9,52 (**×2,62 statt ×2,0** – Sättigung durch geteilten Schildzustand), je Gefecht ~15,1 Marker vs. Ø HP 6,9 → unrealistisch tödlich als Baseline (k=1,59 zählt bereits mehrere Waffen). Liga je Waffeneinsatz: S1 +63 %, S2 +100 %, PD2 +119 %, P1 +65 %, P2 +108 %, P3 +127 %, hp+4 +40 %, sp+1 def 0,43 (flat).
- *Joint-k* (k Waffen greifen je Phase auf den **geteilten** Pool an, konstantes Angriffsvolumen, mission-only, MC N=15.000, Common Random Numbers): Liga **innerhalb ±20 % konsistent** mit der aktuellen Verrechnung (je Gefecht: S1 2,42 / S2 3,40 / PD2 1,44 / P2 3,35 / P3 4,72 / hp+4 2,43 / sp+1 def 0,32; Ø Aufbau 7,41 mission-only, Tod@HP7 40 %). Befund: Panzerungs-m leicht konservativ (P2/P3 +11/+18 % über v10-Implikat), PD ×k leicht konservativ (+19 %), hp ×1 passt.
- **X-Switch 107/224 (SAbz→X), gepaart gemessen:** 1×-Modell exakt **0,00** (analytisch: used-Flag wirkt bei 1 Angriff/Phase nie; Messung bestätigt); Joint-k: **S1 +0,013 Marker/Gefecht (+0,5 % Score), alle anderen ±0,001** → kurvenneutral. In-game-Effekt: Schild bleibt für Folgeangriffe der Phase aktiv (Christophers Szenario bestätigt). Empfehlung: X = „wirkungslos gegen Schild" als sauberere Regelsemantik übernehmen; Balancing-Effekt ~0, wächst aber mit künftigem SAbz/X-Feld.
- **Empfehlung: Joint-k als v11-Verfeinerung** übernehmen (nach Abschluss der Defense-Runde; kolonie-Zweig dann integrieren), das 2×-Literalmodell nicht (überhöht die Letalität).

**Abfang/Missionswert korrigiert und quantifiziert (Frage 4 + Entscheidung 3):** Korrekte Abfang-Treppe (nur einsatzfähige Abfänger, speed ≥ 1): **≥2 98,8 % / ≥3 88,3 % / ≥4 61,3 % / ≥5 2,5 % / ≥6 0 %** → **ΔP(nicht abfangbar) je +1 Speed = 43,1 pp** (Erwartung über rarity-gewichtete Missions-Hüllen; Karten sitzen auf Solo-/Flaschenhals-Schiff). Christophers Intuition bestätigt: fast immer offensiv oder defensiv ein Effekt, nur bei identischem Speed keiner. Kolonien: Halbierung wirkt auf Mission UND schiffsgerichteten Raid; nur der R1-Kolonie-Angriffszweig ist speed-immun → frühere Aussage „Raid 50 % wirkungslos" war überzeichnet, die Abschwächung ist klein und im Modell (R1-Zielwahl) enthalten.
- **Option A (Missionswert-Spalte, unbezahlt):** Score-Effekt 0; Triebwerke (revidiert) 1,14; Spalte weist ΔP 43,1 pp je Karte aus.
- **Option B (bezahlter Faktor):** Credit = 0,5 (Missionsanteil der Gefechte) × 43,1 pp × W, **einmalig je Speed-Punkt, nicht ×k**; W-Regler: W=2/4/8 → Triebwerk-Score 1,76/2,38/3,92 (wahr, Ziel r1 5,17). Symmetrischer Malus auf sp−1-Karten (449/240): −0,43/−0,86/−1,73.
- Beide Optionen lassen Triebwerke strukturell unter der Kurve (bewusste Design-Entscheidung nach Cap +1); Option B preist sie ehrlich und macht Deltas zwischen sp-Karten vergleichbar.

**PD-Flottenfaktor (Frage 1):** Ja – mit dokumentierter Flottengrößen-Annahme ist der Bonus bezahlbar: **f_PD = n_fleet** (PD wirkt schiffsübergreifend gegen alle PAbz-Angiffe der Flotte; Schild/Panzerung/hp/Speed bleiben Eigenschiff-Effekte). Palette für 341 Ködersystem (PD2, ohne hp-Buff, wahr): n_f 2,0 → 3,97 / **2,5 → 4,96 (Δ −0,21 am r1-Ziel)** / 3,0 → 5,95 / 4,0 → 6,91. Empfehlung n_f = 2,5 (Ø 2,5 Schiffe je Gefechtsseite) → 341 braucht **keinen** hp-Buff mehr.

**Triebwerke revidiert (Entscheidung 4, Batch H, wahre Werte):** 161 Ionenschubdüsen E−1→0 (sp+1, Delta): 0,47→**1,14** | 537 Quantenmechanischer Antrieb nur Delta (socket_e weg): 0,67→**1,14** | 109 Plasmanachbrenner sp+2→+1 (**Cap-Nerf**) + E−3→0: 0,43→**1,14** | 434 Leichtbauweise hp−3→−1 (sp+1, Delta): −1,97→**−0,14**. Mit Missionswert Option B (W=4): 161/537/109 ≈ 2,4, 434 ≈ Break-even. Batch F (übrige 15 Karten) bleibt gültig (Deltas unverändert, Werte ×1,15).

**Offene Entscheidungen (Christopher):** X-Switch 107/224 (Empfehlung: ja); Missionswert Option A vs. B + W-Regler; PD n_fleet (Empfehlung 2,5); Joint-k als v11 (Empfehlung: ja, nach Rundenabschluss); 426-Redesign; finale Buff-Liste (Batch F/H).

### Kalibrierungs-Review – Runde 3 (3.11.2026): Flottenmodell-Probe, λ-Diskussion, Option-B-Design

**Christophers Flottenmodell gemessen ([kalibrierung_check6.py](kalibrierung_check6.py)):** 2v2, beide Seiten 2 identische Schiffe (gleicher Pool-Build, gleiches HP), Focus Fire aufs erste lebende Schiff bis zerstört, dann das nächste; Overkill entfällt; PD wirkt schiffsübergreifend (Fleet-Pool), verfällt mit dem Tod des eigenen Schiffs; Feuereihenfolge alterniert (First-Strike-Artefakt gemittelt); N=10.000, Common Random Numbers, gepaart. Zwei Wert-Rahmen je Karte: *prevented-frame* (verhinderte Marker, bisherige Metrik-Währung) vs. *output-frame* (Mehr-Output durch längeres Überleben – Überlebens-Credit ENDOGEN).

| Karte | prevented | Output-Gewinn | Verhältnis |
|---|---|---|---|
| S1 | 1,39 | 1,08 | 0,78 |
| S2 | 2,00 | 1,53 | 0,77 |
| P2 | 2,52 | 1,83 | 0,72 |
| PD2 (nur eigenes Schiff) | 0,34 | 0,25 | 0,73 |
| PD2 (flottenweit) | 0,60 | 0,42 | 0,70 |
| hp+4 | **−0,57** | **1,29** | −2,28 (s. u.) |

Baseline: Ø taken 9,50 / Ø dealt 12,95 je Gefecht; P(Schiff 1 zerstört) 52 %, P(Flotte vernichtet) 36 %. Befunde:
- **Überlebens-Credit ist ENDOGEN ~0,7–0,8, nicht +15 % additiv**: Der Output-Gewinn einer Karte beträgt ~0,70–0,78 × ihrer verhinderten Marker – prevented-Marker-Accounting und Output-Accounting sind zwei Währungen desselben Nutzens, Wechselkurs nahezu konstant über S/P/PD. Der flip-dichte-basierte λ=1,15 (+15 % additiv) hält dem endogenen Test NICHT stand. Die Symmetrie (Waffen wie Defense, gleiche Währung) bleibt aber vollständig erhalten → reine Einheiten-/Ankerfrage.
- **f_PD endogen = 1,78 (verhindert) bzw. 1,69 (Output) bei n=2** – bestätigt f_PD ≈ n_fleet.
- **hp-Befund**: Unter Focus Fire + Todes-Cap ist hp+4 im prevented-frame NEGATIV (−0,57: mehr HP = mehr Schaden wird gebunden, bevor das Schiff stirbt), im Output-frame +1,29. Wichtig für v12: Im Flottenmodell ist der Output-frame die einzig sinnvolle Wertdefinition; „verhinderte Marker" bricht bei hp/Todes-Logik.
- **Rahmen-Hinweis**: joint-k/check5 waren mission-only als Probe-Vereinfachung (Kolonie-Zweig = per-Waffen-r1_col-Tracking, v11-Aufgabe); Christophers Flottenmodell subsumiert joint-k UND f_PD UND Überlebens-Credit UND hp – **Nordstern v12** (nach Abschluss der Defense-Runde, dann Neu-Kalibrierung der Kurve im Output-frame).

**λ-Diskussion (offen, Christopher-Entscheidung):** Aktueller Code-Stand: λ=1,15 aktiv in v9+v10 (Umbuchung, Kurve ×1,15 – keine Entscheidung verändert). Optionen: (A) **λ zurück auf 1,0** (Empfehlung: endogene Messung zeigt +15 % additiv ist nicht haltbar; externer Effekt bereits in der Währung enthalten, dokumentieren statt bezahlen); (B) λ=1,15 als unverbindliche Wahrwert-Buchhaltung behalten; (C) Kurve nominell lassen (λ wirksam) → Waffen +0,27…+1,04 über Kurve (207 bei +1,60 im Nerf-Band!), Defense 15 % näher an Kurve – **nicht empfohlen**, wäre Entscheidungs-Churn ohne endogene Evidenz.

**Option B (Missionswert bezahlt) – Umsetzungsvorschlag (v10):**
```python
MISSION_SHARE = 0.5    # Missionsanteil der Gefechte (0,5/0,5-Mix wie Metrik)
DELTA_P      = 0.431  # E[P_abfang(s) - P_abfang(s+1)] über Missions-Hullen
MISSION_W    = 4.0    # Regler: Missionsloot in Marker-Äquivalenten (Playtest)
mission_credit = MISSION_SHARE * DELTA_P * MISSION_W * d['speed']  # signed
total = SURV * (abs_mult*prev_base + k*(prev_spd+off) + prev_hp) + mission_credit
```
Einmalig je Speed-Punkt (nicht ×k), signed (sp−1-Karten 449/240/434 erhalten Malus), Wirkungstabelle s. Chat; W über Playtest an Missionsloot verankern (interim 4). Alternative ΔP kartenindividuell an Hullen-Speed – verworfen (Karten sind hull-agnostisch, Flat-Average einfacher).

### Kalibrierungs-Review – Runde 4 (3.11.2026): Christophers Entscheidungen umgesetzt, v11 Flottenmodell gebaut

**Entscheidungen (Christopher, 3.11.2026):** 1. X-Switch 107/224 **abgelehnt** (Unterschied 0,00) – dokumentiert, nichts umgesetzt. 2. Missionswert **Option B** (bezahlt). 3. PD **n_fleet = 3** (v10-interim; v11 misst endogen, s. u.). 4. λ **verworfen, zurück auf 1,0**. 5. Flottenmodell **direkt als v11** (joint-k-Zwischenschritt entfällt). 6. **Buffs pausiert**, bis das Modell richtig umgesetzt ist; 426-Entscheidung offen.

**v9/v10-Status nach Umsetzung:**
- v9 (λ=1,0): exakt Runde-3-Zustand – Mediane 4,15/4,72/4,83/6,03/6,56, Watchlist 207 +1,20→**+1,04**, 347 +0,51, Nerf leer. Keine Waffen-Änderung.
- v10 (Missionswert B implementiert: `MISSION_SHARE 0,5 × DELTA_P 0,431 × MISSION_W 4,0 × speed`, einmalig/signed; PD_FLEET=3): Speed-Karten: 161 0,47→**0,92**, 537 0,67→**1,30**, 109 0,43→**0,93** (sp+2: Credit +1,72), 449 3,59→**1,89** (Malus −0,86), 240 3,94→**2,19**, 434 −1,97→**−0,48**; **341 Ködersystem 1,98→5,17 (Δ +0,67 ÜBER der r1-Kurve)** durch n_f=3 – bewusst so entschieden, aber s. v11-Befund (endogen kein Flottenfaktor!). Mediane: 3,42/1,30/1,00/2,87/3,32.

**v11 = Flottenmodell ([balancing_metric_v11.py](balancing_metric_v11.py), N=10.000, Output-Gewinn σ≈0,03–0,05):**
Rahmen: 3v3 Spiegel-Gefecht, je Seite 3 identische Schiffe (gleicher Pool-Build, gleiches HP), **1 Waffentyp je Gefecht, 1 Instanz je Schiff** (beide Seiten), Focus Fire aufs erste lebende Schiff (Overkill entfällt), PD flottenweit (verfällt mit eigenem Schiffstod), Halbierung paar-genau mit Angreifer- UND Ziel-Bonus, Feuereihenfolge alterniert, Kolonie-Zweig (vorerst) nicht simuliert, Missionswert-Credit additiv. **Wertdefinition = Output-Frame** (Mehr-Output durch längeres Überleben; prevented nur Diagnose – bricht bei hp: hp-Karten binden unter Focus Fire MEHR Schaden, bevor das Schiff stirbt).

Baseline: Ø taken 13,53 ≈ Ø dealt 13,69 je Gefecht | P(Schiff-1-Tod) 69 % | P(Flotte vernichtet) 30 %.

| id | Karte | Score | Out-Gewinn | Mission | prev (Diagnose) |
|---|---|---|---|---|---|
| 426 | Schildbooster (Bedingung) | 0,08 | 0,13 | – | 0,21 |
| 434 | Leichtbauweise | 0,15 | −0,75 | +0,86 | 0,51 |
| 449 | Schwerer Rumpf | 0,50 | 1,21 | −0,86 | −0,74 |
| 312 | Refraktorfeld | 0,52 | 1,24 | – | 2,18 |
| 161 | Ionenschubdüsen | 0,64 | 0,23 | +0,86 | 0,21 |
| 140 | Deflektorschild | 0,68 | 1,64 | – | 2,68 |
| 109 | Plasmanachbrenner | 0,69 | 0,42 | +1,72 | 0,41 |
| 522 | Heckdeflektor | 0,72 | 1,58 | – | 2,65 |
| 341 | Ködersystem | 0,85 | 0,59 | – | 1,14 |
| 537 | Quanten-Antrieb | 0,90 | 0,21 | +0,86 | 0,21 |
| 240 | Ceramo-Stahl | 0,98 | 1,55 | −0,86 | 1,74 |
| 170 | Strahlenschilde | 1,51 | 1,06 | – | 1,87 |
| 184 | Rumpferweiterung | 1,71 | 1,20 | – | −0,38 |
| 349 | Dura-Stahl Platten | 2,08 | 2,50 | – | 3,54 |
| 163 | Verbundpanzerung | 2,19 | 1,54 | – | 2,03 |
| 103 | Adamantiumpanzer | 2,28 | 2,74 | – | 5,08 |
| 115 | Ablative Magnetpanzerung | 2,33 | 1,63 | – | 3,53 |
| 406 | Kohlenstoffsilikatpanzer | 2,40 | 2,88 | – | 3,54 |
| 171 | Titanplattenpanzer | 2,48 | 1,74 | – | 3,79 |

Mediane: r1 1,51 / r2 0,68 / r3 0,52 / r4 2,33 / r5 2,28. **Struktur-Befunde:**
- **PD-Flottenfaktor endogen ≈ 1,0 – n_fleet-Regler war falsch!** Meine analytische Palette (k×n_f) hat ignoriert, dass PD pro Phase nur 1× blockt (used-Flag, 'phase'-Recharge): mehr Schiffe/Zeile erhöhen die Blocking-Anzahl nicht. 341 prev endogen 1,14 ≈ Eigenwert des 1-Schiff-Frames (1,21) → **341 gehört in der Buff-Runde NICHT über die Kurve gehoben**; v10-n_f=3 ist damit überholt (für v10 dokumentiert belassen, Entscheidung regelt v11).
- **Output-Frame vs prevented-Frame:** Ligen unterscheiden sich stark (S2 1,58 Output vs 2,65 prev; P3 2,74 vs 5,08) – Output-Frame ist der ehrliche Wert (Prevented zählt auch Nicht-Todesrelevantes doppelt), bricht aber die alte Skala → **Zielkurve muss für v11 neu verankert werden** (Design-Entscheidung: Treppe nicht mehr monoton in Rarität – r4/r5-Panzer liegen ÜBER r1; Optionen: neue Kurve an v11-Mediane + alte Stufenform, oder Buffs/Nerfs für Monotonie).
- **Speed-Karten**: Output-Gewinn klein (0,21–0,42; Focus Fire verzehrt Halbierungsvorteile), Missionswert dominiert ihren Score → Option B ist der Hauptwert der Triebwerke.
- **426 Schildbooster**: mit Bedingung 0,08 (struktur-tot, auch in v11); offene Entscheidung: Bedingung streichen (Redesign) oder behalten.
- **Kolonie-Zweig fehlt** (Design-Vereinfachung v11 first cut) – zur Abnahme entschieden werden: ergänzen (Raid/R1-Zielwahl je Waffen-Instanz) oder dokumentiert weglassen.

**Nächste Schritte:** v11-Design-Abnahme durch Christopher (Mirror-3v3, 1 Waffentyp, Output-Frame, Kolonie-Zweig, Missionswert additiv) → Kurven-Verankerung v11 → erst dann Buff-Runde (19 Karten) unter v11 neu vermessen. Buff-Vorschläge Batch F/H sind damit PAUSIERT (Werte nur noch Referenz).

### Kalibrierungs-Review – Runde 5 (3.11.2026): 426-Entscheidung, Kolonie-Zweig in v11, Focus-Fire-Klärung

**426 Schildbooster (Christopher, 3.11.2026): Energiebedarf GESTRICHEN, sonst unverändert** (Bedingung `need_shield` bleibt, S2 bleibt). In der Arbeitskopie `cards.csv` umgesetzt (E −1 → leer); Kosten 1,70 → **0,70 Einheiten**. V10: 0,09 → **0,22**; v11: 0,08 → **0,13**. Für die Repo-Umsetzung (CSV + Server-Code, zusammen) vorgemerkt.

**Kolonie-Zweig in v11 integriert (Christophers Klarstellung):** Der Koloniezweig ist identisch zum Missionszweig außer der R1-Zielwahl – implementiert als 50 % Raid-Gefechte, in denen auf R1 jede Instanz statt des Schiffs die **Kolonie** angreift, wenn ihr erwarteter Kolonienschaden `r1_col` (nie halbiert, speed-unabhängig) den halbierungsgemischten Erwartungsschaden aufs Schiff übersteigt. Neu gemessen (N=10.000): Baseline taken 13,45 ≈ dealt 13,44 | P(Schiff-1-Tod) 69 % | Flotte vernichtet 31 %. Mediane: r1 1,47 / r2 0,65 / r3 0,49 / r4 2,39 / r5 2,28. 426 → 0,13, 341 → 0,94 (Out 0,66), 161 → 0,63, 537 → 0,90, 109 → 0,67. Struktur gegenüber Runde 4 unverändert.

**Focus-Fire-Klärung ([kalibrierung_check7.py](kalibrierung_check7.py), gepaart N=5.000):** Sequenz-Verifikation: 3 Angriffe je Phase laufen NACHEINANDER (Schiff 0→1→2), jeder Angriff wird sofort gegen das erste lebende Gegner-Schiff aufgelöst, Tod wird unmittelbar nach jedem Angriff geprüft, ggf. Retargeting für den nächsten Angriff – exakt Christophers Regel. **Korrektur meiner früheren Aussage: Focus Fire verzerrt den Speed-/Halbierungsvorteil NICHT** (sp+1 Output 0,25 focus vs. 0,23 spread, Faktor 1,09, im Rauschen); alle Specs sind unter Focus sogar tendenziell HÖHER (S1 1,09× / hp+4 1,13× / P2 1,26×), weil konzentrierter Schaden Todes-Flips häufiger macht. Der wahre Grund für die kleinen Speed-Output-Werte (0,21–0,36) ist der **Output-Frame selbst**: nur überlebensrelevante Verhinderung erzeugt Output-Wert – Halbierungs-Shifts (+5–9 pp ×0,5 auf einem Angriffsanteil) verschieben den Tod selten um eine ganze Phase; die offensive Speed-Komponente (eigene Angriffe seltener halbiert) wird im Output-Frame direkt mitgemessen und ist klein. Spread-Gefechte dauern länger (beide Flotten bleiben länger vollständig), getauschter Schaden Ø 14,05 vs. 13,34 – Werte bleiben aber unter Focus die relevanten (Spielregel).

**Output-Frame (Definition, Christopher-Frage):** Kartenwert = E[Output-Gewinn des Verteidigers] = zusätzliche ausgeteilte Marker der eigenen Flotte, weil Schiffe durch die Karte länger leben (gepaarte Identical-Battles, Platzierung uniform zufällig). Begründung: unter Todes-Cap ist „verhinderte Marker" keine gültige Währung mehr (hp+4 verhindert NEGATIV: mehr HP bindet mehr Schaden, bevor das Schiff stirbt; Overkill entfällt) – der Mehr-Output misst den echten strategischen Nutzen. Prevented bleibt nur Diagnose-Spalte.

**Stand Buffs:** weiter PAUSIERT bis v11 abgenommen + Kurve verankert (Christopher, 3.11.2026). 426-E-Streichung ist als beschlossene Wertänderung dokumentiert; alle übrigen Batch-F/H-Vorschläge nur Referenz.

### Kalibrierungs-Review – Runde 6 (3.11.2026): komplette Schiffe aus Sektionen, HP↔Speed-Paarung

**Christophers Review-Fragen (Überlebenschance):** (1) „Nimmst du 3 zufällige Schiffe?" (2) „Paarst du zusammengehörige HP (für das gesamte Schiff bestehend aus allen Karten, bei einem Kreuzer also fast 30 HP) mit der passenden Speed?"

**Antwort (1):** Nein – bewusst EIN zufälliger Schiff-Build je Gefecht, davon 3 identische Kopien, Spiegel auf beiden Seiten (Christophers Vorgabe „3x gleiches Schiff"). Grund: Common-Random-Numbers-Paarung für rauschfreie Kartendeltas.

**Antwort (2):** War NICHT gepaart – drei Lücken im alten v11: (a) HP marginal aus den 50 **Sektions**-Hüllen gezogen (4–17, rarity-gewichtet Ø 6,9) statt kompletter Schiffe; (b) Schiffs-Speed implizit 0, Halbierung über marginal geworfene Münze (`HALF_CAL`); (c) HP- und Speed-Ziehung unabhängig → Korrelation fehlte.

**Umbau (umgesetzt in [balancing_metric_v11.py](balancing_metric_v11.py)):**
- **Komplette Schiffe komponiert** aus Sektionen gemäß `Komponenten`-Tag: Kreuzer = Bug+Kern+Heck (26/27/30/31 HP), Schlachtschiff 32–37, Fregatte 13–18, Zerstörer 10, Schwerer Frachter 15–20, Stationen Sektionen mit Wiederholung; **Schiff-HP = Σ Sektions-HPs, Schiff-Speed = Heck-Speed** (Regel: Speed nur vom Heck mehrteiliger Schiffe), Einteilige = Kartenwerte. Gewicht = Produkt der Sektions-Rarity-Gewichte. Ergebnis: 29 distinkte Builds, HP-Spanne 4–37, rarity-gewichtet **Ø HP 20,1**, **Korrelation HP↔Speed −0,71** (sp≥3: Ø 15 HP; sp≤2: Ø 27). Hull-Sektionen haben **keinen** intrinsischen Schaden (die Werte in der `damage`-Spalte gehören zu Waffen; „4" bei Kreuzer (Kern) = `control`).
- **Halbierung deterministisch je Paar** (Regel: eigene speed + Phasenreichweite ≤ Ziel-speed ⇒ halbiert, vor allen Abzügen) statt `HALF_CAL`-Münzen. Konsequenz Spiegel-Baseline: **nie halbiert** (gleiche Speeds); Speed-Karten wirken als **Ausweichen** – eingehende Angriffe in Phase ≤ Speed-Bonus werden halbiert. `raw_half`/`half_p` entfallen (Laufzeit 10.000 Gefechte: ~180 s → ~8 s).
- **401 Guillotine**: −6 × konkreter Ziel-Speed statt Ø 1,3.
- **Kolonie-Zweig** vereinfacht konsistent: Raid-R1 geht auf die Kolonie, wenn `r1_col` > unhalbierten Erwartungsschaden aufs Schiff.
- **3×-Defense-Platzierung** (Christophers Entscheidung 3 „3x Defense"): bewertete Karte je Verteidiger-Schiff 1 Instanz, Output-Gewinn **/3 normalisiert** auf Kartenwert; Diagnosemodus 1× (altes Design) per `SPEC_ALL3 = False`.
- **Gefechts-Pool nur missionstaugliche Schiffe (speed ≥ 1)**; Stationen/Orbitaler Außenposten (speed 0) nicht im Spiegel-Gefecht (offener Punkt: asymmetrische Heimverteidigung).
- Bewusste Vereinfachung: Hintergrund-Builds (v9.SHIP-Pools) weiterhin nur S/P/PD, **keine hp-/speed-Ausrüstung** (v9-Pools mit Waffen-Finalisierung eingefroren; Effekt wäre weitgehend spiegelsymmetrisch).

**Messung nach Umbau (N=10.000, gepaart):**
- 3× Defense (Standard): Baseline taken 24,56 ≈ dealt 24,54 | P(Schiff-1-Tod) 60 % | Flotte vernichtet 11 %. **Mediane r1 0,86 / r2 0,38 / r3 0,33 / r4 1,19 / r5 1,07.** Top: 115 Ablative 1,58 / 171 Titanplatten 1,20 / 406 Kohlenstoff 1,19 / 103 Adamantium 1,07 / 349 Dura-Stahl 1,03; Flop: 449 Schwerer Rumpf −1,54 / 240 Ceramo-Stahl −1,38 (beide sp−1: eigene R1-Ausgangsangriffe werden halbiert, kassiert HP-Gewinn auf).
- 1× Diagnosemodus: Tod 59 %, wipe 12 %; Mediane r1 1,04 / r2 0,51 / r3 0,43 / r4 1,68 / r5 1,69 (per Karte höhere Werte als 3× wegen Sättigung: Flotte hat nur 3 Schiffe, Fokusfeuer-Remanenz).
- Vorher (Runde-5-Referenz, marginales Modell): taken 13,45 / Tod 69 % / wipe 31 %; Mediane r1 1,47 / r2 0,65 / r3 0,49 / r4 2,39 / r5 2,28.
- Plausibilität: hp-Karten binden Marker (prev negativ, z. B. 449 −0,30), Panzerungs/hp-Kombis verhindern über Zweite-Rund-Effekt positiv (240: +6,16 prevented → Angreiferflotte stirbt früher); 434 Leichtbauweise (hp−3/sp+1): Out −0,69 – sp+1 dodged nur R1-Angriffe (25 % der Angriffe, halbiert ~Ø dmg/2), hp−3 kostet mehr.

**Offene Abnahmepunkte (Christopher):** (i) Spiegel ⇒ Baseline nie halbiert – gewollt? (ii) Stationen (sp 0) nicht im Gefechts-Pool – gewollt? (iii) Build-Gewicht = Produkt der Sektions-Rarity-Gewichte (Kreuzer ~45 % der Builds, da alle Teile r2/r3 verfügbar) – oder Bottleneck-Min? (iv) 3×-Platzierung + /3-Normalisierung – gewollt? (v) Hintergrund-Pools ohne hp/speed-Ausrüstung – ok? Danach: Kurven-Verankerung (Mediane liegen ~3–6 unter der Kurve; alte Anker gelten nicht mehr), dann Buff-Runde.

### Kalibrierungs-Review – Runde 7 (3.11.2026): Christophers Runde-6-Entscheidungen umgesetzt (gemischte Flotten, Stationen, Bottleneck-Rarität)

**Runde-6-Abnahme (Christophers Antworten 1–5):** (1) 3 identische Schiffe abgelehnt – stattdessen **3 Schiffe unterschiedlicher Größe/Klasse, gespiegelt**; (2) **Stationen als Raid-Verteidiger**; (3) **Rarity-Häufigkeit** (jede Stufe doppelt so häufig wie die nächste) statt Produkt-Gewichtung; (4) Erklärung Produkt vs. Rarity angefordert (siehe unten, ersetzt durch Bottleneck); (5) Erklärung Hintergrund-Pools angefordert (offen, siehe unten).

**Umbau (umgesetzt in [balancing_metric_v11.py](balancing_metric_v11.py)):**
- **Gemischte, gespiegelte Flotten:** je Gefecht 3 Schiffe verschiedener Größenklassen – je 1× ein-, zwei-, dreiteilig, Bottleneck-gewichtet gezogen; Missionsgefechte (50 %): Verteidiger = Spiegel der Angreifer-Flotte (gleiche 3 Schiffe in gleicher Position), nur Schiffe speed ≥ 1; **dadurch triggert die paargenaue Halbierung auch in der Baseline** (schnelle Schiffe weichen langsamen Angreifern in niedrigen Phasen aus). Nur der Raid bleibt bewusst asymmetrisch.
- **Waffen-Sockel-Kompatibilität:** nur Schiffe mit den benötigten Sockeln (Θ/Ξ/Φ, z. T. +Ω wie 150/224; −2/−3-Anforderungen wie 106/302) tragen die gezogene Waffe (1 Instanz je Träger); Flotten werden neu gezogen, bis jede Seite ≥ 1 Träger hat. Angriffsvolumen variiert dadurch real je Waffe (schwere Waffen oft nur auf dem Großschiff).
- **Raid (50 %) asymmetrisch:** Seite 1 überfällt die Kolonie von Seite 0; nur Seite-1-Instanzen weichen auf R1 auf die Kolonie aus (wenn `r1_col` > erwarteter Schiffschaden). Die **Raid-Verteidiger-Flotte wird separat inkl. Stationen gezogen**: Orbitaler Außenposten (1-teilig, HP 9–11), Raumstation (2-teilig, HP 24–28), Sternbasis (3-teilig, HP 42–51), speed 0 → können nicht ausweichen, ihre eigenen Angriffe auf schnelle Schiffe werden paargenau halbiert.
- **Bottleneck-Rarität (Punkt 3):** Gewicht eines Builds = **rarteste Sektion** (Einteiler = Karten-Rarität). Verteilung danach: 1-teiliger Slot 73 % Korvette (5× r0) + Leichter Frachter u. a.; 2-teilig 43 % Zerstörer / 33 % Fregatte / 24 % Schwerer Frachter; 3-teilig 73 % Kreuzer / 27 % Schlachtschiff. **Kreuzer: vorher 45 % aller Schiffe (bis 3× je Flotte), jetzt max. 1 Schiff in 73 % der Gefechte.** Raid-Verteidiger-Slots: Stationen 16 % (1-teilig) / 17 % (2-teilig) / 37 % (3-teilig, Sternbasis-Sektionen r3–r5, viele Kombinationen).
- Halbierung deterministisch, 401 Guillotine −6×konkreter Ziel-Speed, 3×-Defense-Platzierung (Gain/3), Output-Frame, Missionswert-Option B: unverändert aus Runde 6.

**Messung nach Umbau (N=10.000, gepaart):** Baseline Ø taken 15,54 / dealt 14,68 (Verteidiger; Differenz durch asymmetrische Raids mit Stations-Verteidigung) | P(Verteidiger verliert ≥ 1 Schiff) 71 % | Verteidiger vernichtet 2 % | Angreifer vernichtet 2 %. **Mediane r1 0,87 / r2 0,35 / r3 0,27 / r4 1,06 / r5 0,90** (Runde 6: 0,86/0,38/0,33/1,19/1,07). Verschiebungen: Speed-Karten gewinnen (echte Baseline-Halbierung: 161 0,42→0,42 Out, 537 1,07 Score; 434 Leichtbauweise Out −0,69→−0,08 – sp+1-Ausweichen wirkt jetzt), 103 Adamantium 1,07→0,90 (große Hüllen relativieren P3-Block), Panzerungs-Kombis (163/171/349/406) vorn. Pools/Vertilgung: Wipes von 11 % auf 2 % (gemischte Flotten: Big-Ship-Slot bindet viel Schaden, Fokusverteilung realistischer).

**Erklärung Punkt 4 (Produkt vs. Rarity):** Das alte Gewicht eines kompletten Schiffs war das **Produkt** der Sektions-Gewichte: Ein r2-r2-r2-Kreuzer wog 8×8×8 = 512 gegen eine r0-Korvette mit 32 – dreiteilige Schiffe wurden massiv überhäuft (Kreuzer 45 % aller Schiffe, jeder Gefechtsflotten-Slot). Nach deiner Rarity-Treppe (jede Stufe 2:1) wiegt ein Schiff jetzt so viel wie seine **rarste Sektion** (Bottleneck-Logik: selteneres Teil limitiert, wie oft das komplette Schiff überhaupt zusammenkommt): Kreuzer mit r3-Kern = Gewicht 4 – wie eine einzelne r3-Karte.

**Erklärung Punkt 5 (Hintergrund-Pools, offen):** Die Defense-Ausrüstung der simulierten Schiffe („Feld-Build") wird aus den v9-SHIP-Pools gezogen, die **nur Schild-/Panzerungs-/PD-Karten** enthalten – keine hp-/speed-Ausrüstung. D. h.: Hintergrund-Schiffe haben exakt die Sektions-HPs, nur die bewertete Karte bringt hp/speed ein. Grund: (a) die v9-Pools sind mit der Waffen-Finalisierung eingefroren (Waffen-Seite darf sich nicht ändern), (b) der Effekt auf die Karten-**Deltas** ist weitgehend spiegelsymmetrisch (beide Seiten gleiche Builds), (c) eine Erweiterung wäre ein eigener Abnahmeschritt. **Offen: Hintergrund-Builds um hp-/speed-Karten erweitern (eigenes v11-Poolmodell) oder bewusst so lassen?**

**Verbleibende bewusste Vereinfachungen:** (a) Hintergrund-Pools ohne hp/speed (Punkt 5, offen); (b) bewertete Karte ohne Sockel-Realismus (jedes Verteidiger-Schiff trägt sie, auch Stationen; Sockel-Abstraktion konsistent mit den Hintergrund-Pools); (c) 1 Waffeninstanz je Träger-Schiff (Sockel-Multiplizität wie a2 = 2× Θ ignoriert); (d) Stations-Kombinatorik (Sternbasis 37 % des 3-teiligen Raid-Slots über Kombinationsvielfalt trotz r3–r5-Sektionen – Bottleneck-Heuristik).

### Kalibrierungs-Review – Runde 7b (3.11.2026): Christophers Feinjustierung (zweistufige Typ-Ziehung)

**Christophers Antworten (zu Runde 7):** (3) auch andere 1-teilige Schiffe sinnvoll am Slot beteiligen, da deren Speed/HP-Profile abweichen (Blockadebrecher sp5, Kanonenboot sp3 etc.) – die 73 % Korvette waren ein Kartenvielfalt-Artefakt (5 r0-Karten zählten einzeln); (4) Bottleneck-Regel bestätigt („rarsten Typ nehmen"); (5) Hintergrund-Builds bleiben ohne hp/speed-Ausrüstung (bewusste Vereinfachung, entschieden). „Das sieht jetzt schon fast gut aus."

**Umsetzung – zweistufige Ziehung:** Erst **Schiffstyp** je Größenklasse ziehen, gewichtet mit dem Bottleneck-Gewicht der **günstigsten Bauweise** des Typs; dann konkreter Build innerhalb des Typs (Build-Gewicht = Bottleneck der Sektionen). Neue Slot-Verteilung: 1-teilig Korvette 29 % / Kanonenboot, Leichter Frachter, Mittelschwerer Frachter, Torpedoboot je 14 % / Blockadebrecher, Panzerschiff je 7 %; 2-teilig Zerstörer 50 % / Fregatte 25 % / Schwerer Frachter 25 %; 3-teilig Kreuzer 50 % / Schlachtschiff 50 %; Raid-Verteidiger-Slots: Außenposten 12,5 %, Raumstation 20 %, Sternbasis 33 %.

**Messung (N=10.000, gepaart):** Baseline Ø taken 15,07 / dealt 14,27 | P(Verteidiger verliert ≥ 1 Schiff) 70 % | Vernichtung je 2 %. **Mediane r1 0,83 / r2 0,33 / r3 0,25 / r4 0,99 / r5 0,83** (Runde 7a: 0,87/0,35/0,27/1,06/0,90; Rangfolge stabil: Panzerungs-Kombis vorn (115 1,10 / 171 1,06 / 163 1,07 / 406 0,99), Flops 449 −1,24 / 240 −1,02, Speed-Karten mit echtem Ausweichwert (434 Out −0,07, 161/537 Out 0,43 + Missionscredit 0,86)). Sockel-Realismus der bewerteten Karte weiterhin abstrahiert (bewusst, konsistent mit Hintergrund-Pools).

### Kalibrierungs-Review – Runde 8 (3.11.2026): v11 abgenommen, Reichweiten-Fix + Halbierungs-Verifikation, gemeinsamer Kalibrierungsrahmen, Kurven-Frage

**Abnahme:** Christopher hat das v11-Flottenmodell „vorerst so abgenommen". Neuer Auftrag: Waffen und Nicht-Waffen gleichwertig machen → gleiche Zielkurve für beide; Vorschlag mit Problemen/Lösungen erarbeitet (siehe unten). Zusatzfrage: Halbierungsregel (`>` vs. `>=` bzw. `<` vs. `<=`) anhand Code-Implementierung prüfen.

**Halbierungsregel – Code-Verifikation (`server/src/components/cards/types/equipment_card.ts`, `attack()`):**
```ts
if (target.isFlightReady && attackingShip.profile.speed + match.battle.range < target.profile.speed) {
  damage = Math.round(damage / 2);
}
```
→ **streng `<`** (nicht `<=`), Ziel muss `isFlightReady` sein, Aufrundung via `Math.round`, Vergleich mit **Phasenreichweite** (`match.battle.range`, nicht Waffen-Reichweite). Bonus-Bestätigung aus derselben Datei: `isInRange(range): attackProfile.range >= range` → Reichweiten-Fix in v11 (Waffe feuert nur in Phase p ≤ range) ist code-korrekt. **Diskrepanz:** Website-Regeltext (rules.page.html, Glossar „Geschwindigkeit") sagt „kleiner oder gleich" (≤) – widerspricht dem Code. Metriken folgen dem Code; v11 stand vorher auf `<=` (aus Regeldoku) → auf `<` korrigiert (2 Stellen). [regeln-spielmechaniken.md](regeln-spielmechaniken.md) Z. 38 entsprechend korrigiert.

**Hebel-Analyse `<=` statt `<` (potenzielle Regeladjustierung, Christophers Entscheidung):** Mit `<=` würde die Halbierung eine Stufe früher greifen (Grenzfall: Angriffs-Speed + Phasenreichweite **exakt gleich** Ziel-Speed). Messung (früherer v11-Stand mit `<=` + Range-Fix): 434 Leichtbauweise Out 0,08 → 0,26, Score 1,35 → 1,60. D. h. alle Speed-/Triebwerks-Karten (sp+1) würden deutlich aufgewertet, da sie bereits gegen gleichschnelle Angreifer R1-Angriffe halbieren. Trade-off: v9-Waffenreferenz (FINAL) ist auf `<` kalibriert (HALF-Wahrscheinlichkeiten 0/10/20/25 %) – eine Regeländerung würde die Waffen-Seite invalidieren und eine Neukalibrierung beider Seiten erfordern. Empfehlung: Code-Verhalten (`<`) als verbindlich erklären und nur den Regeltext korrigieren; `<=` nur bei Bedarf als bewusste Balancing-Regeländerung in einem neuen Rahmen.

**Reichweiten-Fix (v11):** Bisher ließ v11 Nicht-Einmalwaffen in allen 4 Phasen feuern. Fix: `elif p > w['range'] or not fire[...]: continue`. Folge: Baseline dealt 14,27 → 7,76; E[Angriffe je Waffe/Gefecht] rarity-gewichtet **1,36** (v9-Joint-k-Referenz 1,59, Spanne 0,70–3,55) → bestätigt das Joint-k-Modell näherungsweise.

**Neue Defense-Baseline (N=10.000, gepaart, nach Range- + `<`-Fix):** taken 7,99 / dealt 7,76 | P(Verteidiger verliert ≥ 1 Schiff) 60 % | Wipes ≈ 0 %. **Mediane r1 0,28 / r2 0,10 / r3 0,08 / r4 0,32 / r5 0,26.** Speed-/Triebwerks-Karten jetzt vorn (434 Leichtbauweise 1,35, 537 1,09, 109 0,71, 161 0,65), Panzerungs-/hp-Karten mit kleinen Out-Gewinnen (0,2–0,37), Flops 449 Schwerer Rumpf −1,39, 240 Ceramo-Stahl −1,36 (sp−1 halbiert eigene R1-Ausgangsangriffe).

**Gemeinsamer Kalibrierungsrahmen (check9_frame_calibration.py, N=3.000, `frame_calibration.json`):** Alle 50 FINAL-Waffen im selben v11-Flotten-Frame gemessen wie die 19 Statkarten (je Verteidiger-Schiff 1 zusätzliche Waffeninstanz, abstrakt ohne Sockel-Check; Out-Gewinn/3; Einsatzkosten v3 aus socket_cost + energy). Ergebnis: **Waffen-v11-Mediane r1 1,71 / r2 2,20 / r3 2,18 / r4 2,53 / r5 2,37** (λ v9/v11 ≈ 2,1–2,8× je Rarität) vs. **Statkarten 0,28/0,10/0,08/0,33/0,27 → Lücke Waffe/Karte 6–27×** (r2/r3 am schlimmsten: 312/140/522 mit 2,2–2,4 Kosteneinheiten wegen teurer Sockel). Spearman Waffen v11 vs. v9-FINAL: **+0,50** (mäßige Rangstabilität; oben 302 Götterdämmerung 4,37, unten 412 Langstreckentorpedos 0,47).

**Kurven-Probleme (Warum Waffen- und Karten-Scores im gemeinsamen Frame nicht direkt auf die alte Kurve passen):**
- **(a) Währungs-Lücke:** Waffen-Score (v9) = eigene Schadensmarker 1. Ordnung; Defense-Score (v11-Output-Frame) = marginale Mehr-Marker der Flotte 2. Ordnung → strukturell 6–27× kleiner.
- **(b) Form-Bruch:** Defense-Mediane nicht monoton (r1 > r2 > r3 < r4 > r5), die v9-Kurve ist streng monoton. Ursache v. a. Kostenstruktur (r2/r3-Karten mit teuren Sockeln), nicht Wirkungsstärke → Buff-Runde muss primär Kosten/Sockel der r2/r3-Karten angreifen.
- **(c) Erfassungslücken des Output-Frames:** zerstörte Ausrüstung, Kolonieschutz, Missionserfolg zahlen 0 → Defense-Wirkung systematisch unterschätzt.

**Optionen für die gemeinsame Zielkurve:**
- **A (Empfehlung):** Gemeinsamer v11-Frame als Wertdefinition für beide Seiten; Kurve neu verankert auf den Waffen-v11-Medianen (~1,7/2,2/2,2/2,5/2,4; Form ggf. glätten, Monotonie prüfen). Waffen-Balancing bleibt relativ unangetastet (Ränge bleiben), danach Buff-Runde für die Statkarten inkl. Kostenhebel r2/r3-Sockel.
- **B:** Alte Kurve (4,5/4,75/5,0/6,0/6,5) behalten + globaler λ-Umrechnungsfaktor je Seite. Einfach, aber willkürlich, kaschiert (a)/(c) und lässt den Form-Bruch (b) unberührt.
- **C:** Getrennte Kurven für Waffen/Karten – widerspricht Christophers Gleichwertigkeitsziel, nur als Fallback falls (a) sich nicht sauber schließen lässt.
- **D:** Frame-Erweiterung um Asset-Schutz (zerstörte Ausrüstung, Kolonie-HP, Missionswert) → schließt (c), vergrößert aber Aufwand und macht Ergebnisse schwerer interpretierbar; ggf. als spätere Verfeinerung nach Buff-Runde 1.

### Kalibrierungs-Review – Runde 9 (3.11.2026): Christophers Beschlüsse umgesetzt – Frame v2 (Asset-Konto) + Zielkurve v12 auf Waffen-Anker

**Christophers Entscheidungen (Runde 8 → 9):** (1) **Code = Wahrheit**: Halbierung streng `<`; `≤`-Variante ggf. später als Balancing-Hebel (würde Speed-Ausrüstung buffen), betrachtet/entschieden im nächsten Schritt mit Kurve und Einzelkarten. (2) Problem (b) (nicht-monotone Form, r2/r3-Kosten) **erstmal ignorieren** – wird beim Um-Sortieren/Balancen im nächsten Schritt angegangen. (a) Währungs-Lücke und (c) Erfassungslücken **sind das Problem** → mein Vorschlag (Option A: gemeinsamer Frame + Neuverankerung; Option D: Asset-Schutz-Erweiterung) **von Christopher gebilligt und umgesetzt**.

**Frame v2 (Wert-Konto je Gefecht, Seite 0):** `Wert = Output-Marker (dealt) − Kolonie-Marker − EQ_RATE × verlorene Waffen-Kosteneinheiten + Missionslohn`. Im Einzelnen:
