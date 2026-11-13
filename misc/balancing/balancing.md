# Balancing

> **Kompaktfassung (11.11.2026).** Die ausführliche Runden-Chronik mit allen Messdetails ist in der Git-History des Repos erhalten (PR #827, Stand vor der Kürzung). Diese Fassung bewahrt alle Entscheidungen, Beschlusswerte und Messanker; Einzelmesswerte stehen in den JSONs des Toolkits (`misc/balancing/`), die Umsetzung des Zielzustands in [#795](https://github.com/chrthom/outer-colonies/issues/795).

## Prinzipien (Christopher, Stand 1.11.2026)

- **Balancing-Philosophie: Intuition + Playtesting** – unterstützt durch die kalibrierte Balancing-Metrik (Szenario-Simulation + Zielkurve); finale Wertentscheidungen trifft Christopher
- Erster systematischer Playtest-Befund (Einsatzkosten vs. Wirkung, siehe unten): schwer einsetzbare, meist seltenere Karten kompensieren ihren Aufwand zu wenig
- Die **Sol-Progression ist gewollt** wie implementiert
- **Code = Wahrheit**: Bei Diskrepanz zwischen Messmodell und Server-Code gewinnt der Code (Halbierung `<=`/#813, Feuerreihenfolge, `profile.combine()`-Speed-Summen, `controlLimit 15`/`colonyHP 50`, `applyMissionResult`)

## Playtest-Befunde (1.11.2026) – Ursprung

**Befund (Christopher):** Schwer einsetzbare Karten (Energiebedarf, 2+ Spezial-Sockeln, Großschiff-Anforderung) sind pro Karte stärker als einfach einsetzbare, aber der Stärkevorteil kompensiert den Aufwand im Playtest nicht. Die Kurve „Einsatzschwierigkeit → zusätzliche Stärke" ist zu flach.

**Metrik v9 (kalibriert 2.11.2026, 50 Waffen):** Voll-Simulation des Gefechts gegen Defensivszenarien, Mechanik verifiziert gegen Server-Code. Kern-Punkte:

- Defense-Kaskade PD → Schild → Panzerung; Deaktivierung bei Schaden ≥ Abzug × Punkte; „X" = völlige Absorption (Defense bleibt aktiv); Design-Regel: SAbz unter dmg halten oder bewusst X schreiben
- **Mission/Raid 50:50**; Szenario-Mix datenbasiert, rarity-gewichtet (Gewicht 2^(5−r))
- **v9.3-Reichweiten** 100/95/90/70 %, **Speed-Halbierung** 0/10/20/25 %
- **Einsatzkosten:** 1. Sockel voll (billig 0,7 / normal 1,0), weitere 0,7 / 0,5 (teurer zuerst), Energie 1,0 + 0,7 je weitere (Kostenmodell v3, 3.11.)

**Erste Beschlüsse:** Runden 1+2 (1.–2.11.): 25 Wertänderungen gegen die Kurve 4,5/4,75/5,0/6,0/6,5. Runde 3 (3.11.): dynamischer Dual-Use-Credit, 5 Dual-Use-Buffs (168/339/234/340/424), 6 SAbz-Erhöhungen (150/106/421/107/167/127), 224-Nerf (dmg 10→8), **X-Switch 344/166/157/347** (metrikneutral, in-game bleibt das Schild aktiv, bewusst unbezahlter Vorteil). Stand FINAL: Mediane 4,15/4,72/4,83/6,03/6,56, Nerf-Backlog leer, Watchlist 207 (+1,04) und 347 (+0,51).

**Aufgeklärt (1.11.):** 304 und 216 tragen den Tag „Einmalige Verwendung" in der CSV nicht, der Code ist korrekt (`EquipmentCard` = PerBattle); Fix via [PR #786](https://github.com/chrthom/outer-colonies/pull/786), Grafik-Rework 216 in [#787](https://github.com/chrthom/outer-colonies/issues/787). Edition-5-Torpedos 554/555 analog (Tags folgen mit den Texten).

## Chronik (kompakt)

### Defense-Metrik v10 + Kalibrierung (3.11.2026)

**v10 (19 Statkarten):** Score = verhinderter Schaden ÷ Einsatzkosten, Speed doppelseitig, **k ×1,59** auf Absorption + Speed (Ausnahmen: Panzerungs-m = 1+(k−1)·s am nackten Schiff, hp ×1). Strukturell unter der Kurve: reine Triebwerke (161/537/109), 426 Schildbooster (Bedingung), 434 Leichtbauweise.

**Kalibrierungs-Reviews 2–11 (Entscheidungen):** λ_surv 1,15 erst implementiert, dann **verworfen zurück auf 1,0** (Überlebens-Credit ist endogen ~0,7–0,8). Missionswert **Option B bezahlt** (ΔP 0,431 je +1 Speed, LOOT-Anker). PD-Flottenfaktor n_fleet=3 interim, **endogen ≈1,0** (used-Flag), 341 Ködersystem bewusst unter Kurve. Triebwerke revidiert (161 E−1→0, 537 nur Delta, 109 sp+2→+1/E−3→0, 434 hp−3→−1). **426: Energiebedarf gestrichen** (Bedingung bleibt). **v11-Flottenmodell** gebaut und abgenommen: komplette Schiffe aus Sektionen, Bottleneck-Rarität, gemischte gespiegelte Flotten, zweistufige Typ-Ziehung, Kolonie-Zweig integriert. **Frame v2 (Asset-Konto):** Missionslohn code-verankert (CTRL_W × Kontrolle; `applyMissionResult`-Bug gefunden), Kurve v12: 2,06/2,57/2,63/3,02/2,74. **Rahmen v3 = F\*** (bilaterale Differenz, Take-Gewicht 1,0: dealt − taken − colony + loot), EQ-Konto gestrichen (quantitativ bedeutungslos).

### Waffen-Runden 12–13r (3.–5.11.2026)

- **12b/c:** Kurve nicht monoton → **v14** = Mediane N=10k (2,23/2,62/2,83/3,25) + r5-Trend 3,55; Abfang-Ausdünnung endogen, Option-B-Credit v1 entfallen
- **13b Metrik-Audit:** Christophers Stopp lose(r) Tausch-Trackings; systematische Audits (115/103/166/438/Torpedos)
- **13c–13e:** deactivationPriority-Fix; **Baseline-Umschichtung POOL_SHIFT 25 %** (PD 46,4 % → weniger PD; Torpedo-Problem geheilt); X-Switch bestätigt; **Kurve v15 = 2,3/2,5/2,8/3,1/3,4**; Mediane erstmals streng monoton
- **13f–13h:** Tausch-Beschlüsse (T1 151↔127, T2 209↔203; später kontra­produktiv); 13g-Paket weitgehend obsolet; **HP statisch ×0,5** (1:1 überzeichnet Faktor 5–9); Frame-Probe „2 Waffen auf großen Schiffen"
- **13j (Schlüssel-Runde):** ZWEI Frame-Bugs seit Framework-Beginn gefunden (Münz-Index, wspec-Schatten); sauberer Frame v16, Neuankürung; **Kurve v17 = 7,8/8,0/8,4/9,0/9,8**; 13g-Nerfs endgültig verworfen
- **13k–13n:** Abweichlerrunde |Δ|>1,0 mit 15 Empfehlungen; Torpedo-Flip-Challenge → Frame **n1+c3+shift0** (POOL_SHIFT zurück auf 0); **bewertete Waffe in BEIDEN Rollen** (50/50-Rollenmittel, Raid-Angreifer inkl. Kolonie-Logik); **2-Gefechte-Frame** (Flotte + 1v1-Spiegelduell, 50/50); Mediane 4,77/4,78/6,09/6,54/7,23
- **13p:** PD-Bezahlung (def_pts war unbezahlt); **Kurve v19 = 4,7/5,0/5,9/6,9/8,0**; 21/50 Outlier
- **13q/r:** Deck-Sim abgelegt; Nachfrage-Deckel M=2 permanent; Missions-Credit verifiziert (`controlLimit 15`, `colonyHP 50` – kein zusätzlicher Credit); **Bedingungs-Gate entfernt** („Wir simulieren den Fall, dass sie wirklich eingesetzt wird"); Kolonie-Zielwahl `col_rule='always'` (Kolonie fast immer bessere Wahl, Ausnahme Waffen ohne Kolonie-Schaden)

### Sonde 13t + v23-Reihe (5.–6.11.2026)

- **13t (Christophers Beschluss):** Zufallsgefechte-Sonde als Frame-Audit: NUR M=1, EIN Gefechtstyp, Spiegel-Faktor = Kartenanzahl, regelkonforme Loadouts (Sockel-Zwang, Draw-v2 mit Pflichtwaffe), Bedingungskarten = akzeptierte Outlier
- **v23b:** Flotte 1–5 Schiffe (Playtest-Rückmeldung: Angriffe/Tote zu niedrig)
- **v23d:** Feuerreihenfolge (bewertete Waffe feuert zuerst); **`>=`-Bugfix** (Median 2,016→1,804); X-Artefakt aufgeklärt (Messskript-Bug; echte X-Divergenz 157/166/179/344/347 gering)
- **v23e:** **Kurve 1,6/1,8/2,1/2,5/3,0**, Band ±0,5; B-Rest 101/304/438 zurückgenommen; Tausch 223↔312 gestrichen; 302-Befund neu
- **v23f/g/h:** Beschlusspakete: 223 E2 + Tausch 312, 171 hp raus, 150 dmg 14/TAbz −7/SAbz −4, 184 hp 3, 240 +1 hp; **Kurve v23g FINAL: 1,5/1,7/2,0/2,5/3,0**; 304 auf FIN; 312→r1; 101↔406; **exakte Tausch-Paare** (312 r1⇄223 r2, 537 r1⇄343 r2, 522 r1⇄344 r2); 401 dmg 30→35; Artefakte: 126-E1 tot, 140-E0 units 0,7
- **v23i (FINAL):** Feinkorrekturen (101 TAbz −11, 126 dmg zurück auf csv 8, 240 hp bleibt 3) → **Mediane 1,57/1,71/1,89/2,41/2,97, NUR NOCH 9 OUTLIER**, alle bewusst (einziger offener Fall 163). Csv-Umsetzung in [#795](https://github.com/chrthom/outer-colonies/issues/795)

### Hüllen-Reihe H1 (8.–9.11.2026)

- **H1a:** **Speed-Summen-Fix** (Code = Wahrheit: Schiffsspeed = Summe der Sektions-Tools statt Heck-/Max-Speed) + Frame-Bug #5; v24-Neuvollmessung (Waffen/Karten-Mediane 1,72/1,44 · 1,98/0,93 · 1,68/0,99 · 3,52/2,83 · 3,85/1,99)
- **H1b:** Hüllen-Erstmessung (hspec, Sektion marginal): Mediane r0 +0,69 / r1 −0,23 / r2 −0,87 / r3 −0,27 / r4 +0,70 / r5 −1,65, **nicht monoton** (Rarität ist bei Hüllen kein Wert-Treiber)
- **H1c/d:** Glättungshebel = Rarity-Zuordnung; **T(n) FIXIERT: Einsatzkosten je Schiffsgröße 1,0 / 1,3 / 1,5** (statt (n−1)/n); 309/315-Sonderfälle 3,5/2,5
- **H1e:** Ψ-Bepreisung + Komposit-Score; Füllraten f-Sockel 0 % (im Pool unbespielbar)
- **H1f/g:** Marginalen-Sonden: +1 HP verifiziert; **sp−1-Bug-Sektionen 120/326/328** (Fix sp−1→0 ist +1,88..+2,63 wert, HP-Kompensation ausgeschlossen)
- **H1h:** Christophers Frame-Verdacht (HP-Bewertung): +70 hp nur +0,52 im Einzelgefecht (Sättigung ~50 HP); Diagnose: H1-Score lässt HP_STATIC-Term vermissen; Kurs-7-Anker („7 HP = 1 sp am Kreuzer") fixiert, unter materialler Schranke 10,6
- **H1i/j:** **Kampagnen-Frame** (persistente Flotten, Schaden/Tode kumulativ): HP zahlt fast 1:1 materiell (keine Sättigung bis 200), Kurs ~17 HP/sp; Frame v2: Serien-Split Mission/Raid 50/50 + dealt-Kanal; **γ=1 FIXIERT → Referenzkurs 1 sp ≈ 21,5 HP** (hp70-Anker, konsistent mit Todeskosten-Brücke 21,3); Anker 7 und pow07-Term OBOLET; Reparaturkarten 325/104 implementiert; Startflotten **3–5 Schiffe FRAME-FIX**; **Feuerreihenfolge-Korrektur** (battle.ts: keine speed-basierte Reihenfolge, Range-Stufen!); **PR #813 A/B (Halbierung bei Ties): BEIBEHALTEN** (25,5 vs. 15,8 HP/sp, Revert als Option geparkt); v25-Reihenfolge fixiert (Taktik zurückgestellt); Laufzeitbudget 8 min

### v25-Reihe (9.–11.11.2026): Ausrüstung, Hüllen, Stationen

**v25-KONZEPT:** Währung Score = ΔKriegsbilanz (γ=1: hp + col + ctrl + dealt) je Platzierung ÷ units; Hüllen zusätzlich mit T(n). Methodik r13t im Kampagnen-Frame; Basis-Cache je Zelle, fire je Schiff via Split-RNG (CRN-Identität), N adaptiv mit SE-Diagnose (N=3000 final).

- **v25a:** Vollmessung 71 Objekte (50 Waffen + 19 Statkarten + 325/104); Top 126 (44,0), 555, 209; Flops 449 (−4,70), 240 (−4,29); Reparatur schwach (325 0,49, 104 1,05)
- **Forts. 1:** #795-Prüfung: Frame lief auf Vor-v23i-Zustand → **patch_cards_795.py**, komplette Umstellung auf Zielzustand, alle Erstmess-Zahlen obsolet (Altmessung: `diag_v25a_pre795_r13t.json`)
- **Forts. 2–6 (Glättungs-/Währungsrunden):** 209 E−1; **344/166 PzAbz −2**; 216 dmg 8→7; 104 rep=inf (Regeländerung); 140/426 E−1-Rücknahme; 349arm1-Dominanz bestätigt (armour-Nerf verworfen); Sockel NICHT zusätzlich preisen; **E-Währung degressiv BESCHLOSSEN** (1 + [1 + 0,7×(E−1)]); 349/171 via HP-Malus; **Christophers Korrektur: Sockel in den Nenner** (a/e/g 0,7, b/d/f 1,0, kein 2.-Sockel-Rabatt); Währungs-Szenarien U1/U2/U3
- **Forts. 7–9:** „Kurve 40 % senken?" NEIN (nicht einheitlich); **Christophers Progressions-Einwand kippt U3 → U2 FINAL** (Grundpreis 1 + Sockel + E degressiv; Waffen +63 % r1→r5); 44 Outlier (33 Waffen + 11 Karten) als Tauschrunde-Grundlage
- **Forts. 10/11:** Referenz-Klärung: „derzeit implementiert" = **REPO-Stand** (drei Stände: Repo implementiert / lokale Arbeits-csv / Messprofil)
- **Forts. 12–17 (Tausch-/Nerf-Runden, ABGENOMMEN):** 179 PzAbz X **+ SAbz X**; Tausche 109↔223, 180↔325, 237↔224, 412↔151 (+412 TAbz −5), 434⇄441; 182 SAbz −5; 130 PzAbz X; 103 hp 0; 171 hp −3; **ZIELKURVE GEMEINSAM 8/10/13/16/20** (Waffen UND Karten); Census 77 Equipment (6 nie gemessen: 124/211/212/241/447/545), 22/71 außerhalb ±4
- **v25b:** Hüllen-Benchmark aller 50 Hüllen inkl. 12 Stationen (N=3000); Stationen endogen negativ (sp 0, reine Raid-Kolonie-Verteidigung)
- **v25b-Forts. 1–3:** Editions-Wanderung korrigiert (Edition wandert mit); **T(n) BLEIBT** (score_t); kein r5-Schiff; **ZIELKURVE HÜLLEN (Schiffe) −2 / −0,5 / +2 / +6** (Christophers Wurf); 171-Partner-Historie: Empfehlung 171⇄318
- **Forts. 4/5 (Dosen 1+2):** 9 Dosen gemessen; **436 sp 2→1 = stärkster Hüllen-Hebel (−12,01)**, revertiert auf sp 2 + hp 8→7; 348-Anomalie gelöst (Bewaffnung GARANTIERT, g ist reiner Statkarten-Sockel) → 348 hp 5→4 mit g; **171-Ring ohne 150 (kein Koloniekiller auf r1): 171→r3 · 125→r2 · 140→r1**; **P_Ψ-Korridor +1,6/+2,0/+3,3 je f-Sockel**
- **Forts. 6 (Zielzustands-Volllauf):** 13 Hüllen-Dosen + 17 Tausch-Raritäten + Ring + **P_Ψ 2,0** komplett in cards.csv; Erstlauf-Artefakt gefixt (Dosen nur in Spec, nicht in csv → Umgebungs-Flotten ungedost); **Frame-Shift-Befund**: härterer Zielzustands-Frame drückt Survival-Margins, Typ-Problem wandert Kreuzer→Schlachtschiff
- **Forts. 7/8 (Dosen 3+4):** Schlachtschiff-Dosen 221/226 hp−1, 306 hp 20, 308 hp 19, 315 hp 16: **r4-Median +5,14 (Ziel erreicht)**; Frame-Interaktion drückt Kreuzer gepaart; KEINE Dose überschossen; 134 e+1 schwach (bleibt Unter-Outlier); **finale Schiffs-Mediane (comp): r1 −0,34 / r2 +1,45 / r3 −0,21 / r4 +4,20** (ohne P_Ψ r1 −2,26 = praktisch auf Ziel)
- **Forts. 9/10 (Stationen-Runde, ABGESCHLOSSEN):** Modus-Trennung score_m/score_r; **P_Ψ 2,0 auch für Stationen**; **102-Dose (A2B2D2E3): −57,04 → −61,11** = Absorptions-Mechanik bestätigt (nutzbare Sockel korrelieren mit score Pearson r = −0,68); 228-Führung = Budget-Absorption, kein Verteidigungswert. **Christophers Beschlüsse: Bestückung ist SPIELER-WAHL → Absorptions-Nachteil = Messartefakt; Stations-Sockel künftig Design-Entscheidungen, NICHT Frame-Score-bewertet; 102-Dose BLEIBT; alle übrigen Stationen unverändert.** Typ-Anker (comp-Mediane): Außenposten −31,72 / Raumstation −40,25 / Sternbasis −53,22; Rarität ordnet nicht. Issue #795 nachgezogen (17 Hüllen, Stations-Absatz, Messbasis diag_v25o)

### Infrastruktur-Reihe I1 (6.–11.11.2026)

**Scope:** 33 Infra-Karten (Ed. 1–4, R0–R2) auf 25 Bewertungsobjekte reduziert; R3–R5 (413/114/105) im Modell platziert, bewusst nicht re-balanciert; Edition 5 außen vor.

- **Spur K (Kampf-Infra):** Erstmessung via `battle_r`-Erweiterung (bewertete Karte an Koloniezone, 239 an Schiff): 156/169/448/238/345 marginal, 239 Kontrolle
- **Spur W (Ökonomie), Modell v3→v9:** analytische Preise, alle Regler. **Datenanker (v23i): c_ex = 1,65** (rarity-gewichteter Median der 69 Karten-Scores), **PV_equip = 3,145**, PV_colony 1,574
- **Modell-Evolution (Beschlüsse):** Floor 0,5 entfallen (statisches +1 ersetzt); **Burst-Modell A(X) = b_X × u_X × PV(X) übernommen**; niedrige Taktik-Bewertung GEWOLLT (nur EIN-Disziplin-Karten b, ~2/3 der Taktiken außerhalb von Gefechten spielbar); **u_tactic = 0,8 je Runde**; T_win entfernt; **u_equip 0,8**; E-Kurs doppelseitig (P_E = c_ex × E-units); **239 DUAL 50/50 Schiff/Kolonie**; Christophers Wirkungskette-Prinzip dokumentiert (Aktion = Enabler, Sockel/Energie = Voraussetzung); Substitutions-Deckel empirisch bestätigt (Spiegelkurs 1,65 innerhalb der Bandbreite 1,2–2,0 je E-Punkt; E-frei-Median-Score exakt 1,650 = c_ex)
- **I1n–z (Regler, BESCHLOSSEN):** **ALPHA_E 0,5 → 0,25** (Pfad A) auf die E-Produzenten-Gains; **Deck-Basis Gleichverteilung 25 % je Typ**; **DUAL-PROFILE 50/50** für alle Nicht-Planetar-Karten; **E-Kurs Kolonie 0,5/0,3**; **P_planetar = 1,5**; **π_play = 0,75** (230-Trigger-Expansion VERWORFEN); Cross-Anker-Gesetz Kraftwerk == Atomreaktor ⇔ P_planetar = E1 + 4×SUB − 1; PV_infra-Fixpunkt in allen Sweep-Varianten erhalten
- **I1t–z (Glättung, BESCHLOSSEN):** Rarity-Swaps paariert, R0 nie: **P4: 448+183+164 → R2, 333+435+154 → R1** (T1 0,232 / T2 0,541 = 2,33×); **Buff-Overrides 230 E−1 (0,416) und 219 E−2/Ψ−1 (0,505)**; **Kurve 0,3/0,5 mit relativem Band ±50 % BESTÄTIGT**; Anker T1 0,280 / T2 0,505 = **1,80×** @ α 0,25; bewusste Fälle: 172 +0,286 (+2 belassen), 345 −0,150 (Known Flag), T2-Spitzen 448/156/183 (Preis-Hebel ausgeschöpft)
- **I1aa (Effekt-Runde):** 333/435 M2-Trigger → STATUS QUO; **413: L2 ortsunabhängige Aktion** (0,269→0,449) EMPFOHLEN; 169 PD-Report; 105 Kapazität/α-Szenarien
- **I1ab (Zielzustands-Übernahme, 11.11.):** alle 11 #815-Feldänderungen in die lokale cards.csv übernommen (Backup cards.pre_i1_infra.csv), diff exakt minimal, Pools konstant; die lokale cards.csv ist damit der KOMPLETTE Zielzustand
- **I1ac (Finale Verifikation, 11.11., `diag_infra_final_r13i.py`):** Re-Exec v9 (π 0,75, α 0,25) + Buff-Overrides + Tier-Remap, erstmals kreuzvalidiert gegen die echte csv (26 Objekte Raritäts-sync); 413 Live-Score 0,269. **Anker exakt reproduziert (T1 0,280 / T2 0,505), KEINE unerwarteten Outlier.** **Datenanker-Drift-Befund:** PV_equip wird live aus der aktuellen csv abgeleitet; die v25-Repricing-Patches würden ihn auf 2,907 drücken (PV_infra 1,291, 230-Soll 0,385, 336/219 0,466, T2-Anker bräche). **I1ac-Entscheidung: Kontowert-Anker GEPINNT (c_ex 1,650 / PV_equip 3,145)**; Re-Kalibrierung gegen die v25-Ziel-csv = eigener künftiger Beschluss. **Konsolidierung: #815 als Sektion 5 in [#795](https://github.com/chrthom/outer-colonies/issues/795) überführt, [#815](https://github.com/chrthom/outer-colonies/issues/815) als DUPLICATE geschlossen**
- **I1ad (Anker-Live-Rechnung, 11.11., `diag_anchor_live_r13i.py`):** I1ac einmal OHNE Pin durchgerechnet (Live-Ableitung v23i-Kontowerte × v25-Units): c_ex unverändert 1,650, **PV_equip 2,907 (−7,57 %)**. Konsumenten-Scores deflationieren nahezu uniform (−5,6 bis −7,7 %; E-Kosten-Beimischungen dämpfen), **E-Produzenten (c_ex-Kurs: 145/156/448, Kraftwerk/Atomreaktor/Solarpanele u. a.) absolut konstant**. Anker LIVE: **T1 0,280** (T1-Median ist zufällig der E-Produzent Kraftwerk r0×5, bewegt sich nicht) **/ T2 0,466 = 1,66×**; Kurven-Rundung bleibt **0,3 / 0,5** (0,466 → 0,5), **KEINE Band-Entscheidung ändert sich** (172/345 weiterhin T1-Outlier, 183/156/448 weiterhin T2-Outlier). Ratio 1,80× → 1,66×, landet fast exakt auf der Kurven-Ratio 0,5/0,3. **Fazit: Pin vs. Live ist eine Hygiene-/Konsistenz-Frage, keine Balancing-Entscheidung. I1ad-BESCHLUSS (Christopher, 11.11.): Option A — PIN BEHALTEN**; Live-Rechnung bleibt als Robustheits-Nachweis dokumentiert (auch ungepinnt bricht nichts), saubere Re-Kalibrierung = Backlog für einen künftigen Frame-Wechsel.

## Zielzustand Balancing (Stand 11.11.2026)

- **Währung v25:** Score = ΔKriegsbilanz (γ=1) je Platzierung ÷ units; units = 1 + |E<0| degressiv (1 + [1 + 0,7×(E−1)]) + Sockel (a/e/g 0,7, b/d/f 1,0); Hüllen + T(n) 0/0,3/0,5; **P_Ψ = +2,0 je f-Sockel** (alle Hüllen inkl. Stationen)
- **Kurven:** Ausrüstung **8 / 10 / 13 / 16 / 20** (gemeinsam Waffen+Karten); Hüllen (Schiffe) **−2 / −0,5 / +2 / +6** (comp mit P_Ψ); Stationen Typ-Anker **−31,72 / −40,25 / −53,22**; Infra **0,3 / 0,5**, Band ±50 % relativ; Referenzkurs **1 sp ≈ 24,4 HP im #795-Frame** (Kampagnen-Frame, hp70-Anker, γ=1; alt 25,5 pre-#795)
- **Finale v25-Schiffs-Mediane:** r1 −0,34 / r2 +1,45 / r3 −0,21 / r4 +4,20 (ohne P_Ψ r1 −2,26); v23i-Mediane 1,57/1,71/1,89/2,41/2,97
- **cards.csv (lokal) = kompletter Zielzustand:** #795-Änderungen (Equipment/Ring/Tausch-Raritäten) + 17 Hüllen-Dosen (16 Schiffe + 102 A2B2D2E3) + I1-Infra-Übernahme (8 Swaps + 230/219-Buffs)
- **Bewusste Outlier (dokumentiert, keine Handlung):** Schiffe 348/436 (Spitzen), 308/315/134 (Rest-Unter); Stationen 228 (Frame-Spitze, Artefakt), 102 (Festungs-Design); v23i: 9 Fälle, einziger offener 163; Infra: 172/345/183/156/448, 413 (T2-Schlusslicht, L2-Empfehlung offen), 320 (einzige r3-Infra)
- **Anker PIN:** c_ex 1,650 / PV_equip 3,145 (v23i-Kalibrierung); Live-Rechnung (I1ad): PV_equip 2,907, Anker T1 0,280 / T2 0,466 = 1,66×, Kurve 0,3/0,5 hält, keine Band-Änderung; **BESCHLOSSEN (I1ad): Pin behalten**
- **Umsetzung:** [#795](https://github.com/chrthom/outer-colonies/issues/795) (konsolidiert, inkl. ehemaligem #815: Equipment + Hüllen + Infrastruktur + Artwork + Server), Toolkit in PR [#827](https://github.com/chrthom/outer-colonies/pull/827); Playtest-Anker: π_play (0,75), ALPHA_E (0,25), Serienlänge/Endursachen, Missions-Frequenz

## Offene Punkte

- **Kontowert-Frame-Re-Kalibrierung (Backlog):** Pin auf die v23i-Kalibrierung BESCHLOSSEN behalten (I1ad, 11.11., Option A; Live-Rechnung `diag_anchor_live_r13i.py`: keine Band-Änderung, Kurve hält auch ungepinnt); saubere Re-Kalibrierung nur bei künftigem Frame-Wechsel als eigene Messkampagne
- **#795-Umsetzung** durch Christopher (cards.csv + Server-Code + Artwork: 17 Hüllen + 8 Infra-Tauschkarten + 230/219-Wertetexte); danach Playtest der v23i+I1+Hüllen-Zielwerte
- **PR #827** (v25-Toolkit + I1-Finalverifikation + Metrik-Updates) reviewen und mergen
- **Playtest-Anker messen:** π_play 0,75, ALPHA_E 0,25, Serienlänge Ø ~3,9, Endursachen-Verteilung, Missions-Frequenz, Speed-Realitätscheck (413-L2-Effekt-Hebel)
- **Edition 5:** Werte implementiert, noch nicht playtested; Balancing-Review ausstehend; Torpedo-Tags 554/555 folgen mit den Texten
- **Grafik-Reworks:** [#819](https://github.com/chrthom/outer-colonies/issues/819) (423), [#787](https://github.com/chrthom/outer-colonies/issues/787) (216); Release 3.2: [#825](https://github.com/chrthom/outer-colonies/issues/825)
- **Bewusste Rest-Outlier** beobachten: 163 (einziger offener v23i-Fall), 348/436, 308/315/134, 228/102, Infra-T2-Spitzen; nach Playtest ggf. Feindosierung

## Referenz: Sol-Ökonomie (Code-Fakten)

Quelle: `server/src/shared/config/rules.ts`, `server/src/shared/config/dailies.ts`

### Einkommen pro Spiel (`gameEarnings`)
- Sieg: **50 Sol** (Bonus nur mit ≥ 6 Karten im Spiel, `minCardsForVictoryBonus`)
- Pro Karte im Spiel: **3 Sol**
- Pro Karte im Discard-Pile: **1 Sol**
- Pro verursachtem Kolonie-Schaden: **1 Sol**
- Typisches Spiel: **~100–200 Sol**

### Dailies (13 Stück, Sol-Belohnung)
| Daily | Sol | Daily | Sol |
| --- | --- | --- | --- |
| Tägliche Inspektion (Login) | 35 | Ich bleibe hier (3+ Stationen) | 105 |
| Der Duft des Sieges (Sieg) | 45 | Sweet Home (7+ Koloniekarten) | 110 |
| Bis zum bitteren Ende (Spiel ohne Kapitulation) | 70 | Armada (5+ Schiffe) | 115 |
| Keine Gefangenen (Sieg durch Zerstörung) | 85 | Potentes Einsatzteam (6+ Kontrolle) | 115 |
| Bereit zur Expansion (6+ Energie) | 90 | Der Koloss (7-Karten-Schiff) | 125 |
| Vorherrschaft (Sieg durch Vorherrschaft) | 100 | Der lange Krieg (50+ abgelegt) | 130 |
| Juggernaut (20+ HP Schiff) | 120 | | |

### Booster-Preise (`boosterCosts`)
- Edition 1: **920 Sol**, Edition 2–4: **1045 Sol**, Edition 5: **1105 Sol**
- Progression: ~5–10 Spiele pro Booster, mit Dailies deutlich schneller – gewollt

## Booster & Rarity

Details in [kartendaten.md](kartendaten.md): Common = rarity ≤ 1, Uncommon = 2, Rare = ≥ 3; Ziehungsgewichte 0→5, 1→4, 2→1, 3→4, 4→2, 5→1; Booster = 6 Common + 3 Uncommon + 1 Rare; keine Duplikate im Booster (`card_collection.ts`).

## Starter-Decks

3 thematische Decks (`server/src/shared/config/starter_decks.ts`), sollen in etwa gleichstark sein:

- **Terranische Siedler**: ausgewogen (16 Hüllen, 21 Ausrüstung, 11 Infrastruktur, 12 Taktiken)
- **Freihändler-Clans**: Handels-/Wirtschaftsfokus (19 Hüllen, 21 Ausrüstung, 9 Infrastruktur, 11 Taktiken)
- **Trans-Jupiter Expedition**: technisch/wissenschaftlich (18 Hüllen, 22 Ausrüstung, 11 Infrastruktur, 9 Taktiken)

## Geplanter Balancing-Skill / -Bibliothek

Christopher möchte beides abdecken (1.11.2026):

1. **Stat-Analysen & Outlier-Erkennung**: Verteilungen und Ausreißer bei Kartenwerten (pro Kartentyp/Edition), z. B. HP/Speed/Schaden pro Sockelzahl, inkl. **Einsatzschwierigkeits-Score** (Sockelzahl/-art, Energiebedarf, Großschiff-Anforderung, Rarität) im Verhältnis zur Wirkung
2. **Werte-Vorschläge für neue Karten**: Ableitung aus Vergleichskarten (gleicher Typ, Sockelzahl, Rarität), mit Korrekturfaktor für Einsatzschwierigkeit

Datenbasis: abgeglichene `misc/cards.csv` (siehe [kartendaten.md](kartendaten.md)) bzw. `server/src/components/cards/collection/*.ts`.
