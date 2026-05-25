---
title: "Sharpe Ratio berechnen: Was Schweizer Investoren wissen müssen"
description: "Wie du die Sharpe Ratio für dein ZKB- oder Yuh-Depot berechnest — inklusive CHF-Risk-Free-Rate und FX-Korrektur."
keywords: ["Sharpe Ratio", "ZKB", "Yuh", "Portfolio Schweiz", "CHF Risk-Free Rate"]
date: 2026-05-18
author: "Dariush Tahajomi"
slug: "sharpe-ratio-berechnen-schweiz"
faq:
  - q: "Welche Risk-Free-Rate gilt für ein Schweizer Depot?"
    a: "Für ein CHF-denominiertes Depot ist die Rendite der Eidgenossen (Schweizer Bundesobligationen) die passende Referenz, nicht der US-Treasury-Satz. Im Mai 2026 liegt der 3-Monats-Satz bei rund 0.8 Prozent."
  - q: "Muss ich die Sharpe Ratio in CHF oder in Lokalwährung rechnen?"
    a: "In CHF. Bei einem ZKB- oder Yuh-Depot mit USD- oder EUR-Titeln zeigt die Bank oft die Performance in Lokalwährung. Für die Sharpe Ratio musst du die CHF-Rendite verwenden, damit das Wechselkursrisiko korrekt einfliesst."
  - q: "Wie viel Historie brauche ich für eine verlässliche Sharpe Ratio?"
    a: "Mindestens drei Jahre an monatlichen oder täglichen Returns. Mit weniger Daten ist die Schätzung der annualisierten Volatilität zu unzuverlässig, um aussagekräftig zu sein."
  - q: "Was ist eine gute Sharpe Ratio?"
    a: "Sharpe Ratios werden oft mit folgenden Bereichen beschrieben: unter 1 (niedrige Rendite-zu-Risiko-Quote), um 1 (moderate Quote), über 2 (hohe Quote). Das sind rein statistische Kategorisierungen ohne Wertung. Welche Quote für ein Depot angemessen ist, hängt von individuellen Zielen, Risikotoleranz und Marktumfeld ab — das ist kein statistisches, sondern ein persönliches Thema. Quantfoli bewertet nicht, welche Quote du anstreben solltest."
---

Die Sharpe Ratio misst, wie viel Rendite ein Portfolio pro Einheit Risiko liefert. Für Schweizer Investoren gibt es einen Haken: die meisten Online-Rechner verwenden den US-Treasury-Satz als Risk-Free-Rate. Für ein CHF-denominiertes Depot ist das falsch.

## Die Formel

Sharpe Ratio = (Rendite − Risk-Free-Rate) / Volatilität

Klingt simpel. Drei Variablen, drei Stolperfallen.

## 1. Welche Rendite?

Bei einem ZKB-Depot mit USD-Titeln zeigt dir die Bank oft die Performance in lokaler Währung. Für die Sharpe Ratio musst du die CHF-Rendite verwenden — sonst rechnest du das FX-Risiko nicht ein.

## 2. Welche Risk-Free-Rate?

Für CHF-Investoren ist die SNB-Eidgenossen-Rendite die richtige Referenz, nicht der US-Treasury. Mai 2026 liegt sie bei rund 0.8% (3-Monats).

## 3. Welche Volatilität?

Annualisierte Standardabweichung der monatlichen oder täglichen Returns. Mindestens 3 Jahre Historie, sonst ist die Schätzung unzuverlässig.

## Was eine gute Sharpe Ratio ist

- Unter 0.5: schwach
- 0.5 – 1.0: solide
- Über 1.0: gut
- Über 2.0: misstrauisch werden (Selection Bias oder Overfitting)

## Was [Quantfoli](/portfolio/how-it-works) anders macht

Standard-Tools nehmen USD-Rates und ignorieren FX-Effekte. Wir berechnen Sharpe in CHF, mit Schweizer Risk-Free-Rate, auf deinem importierten ZKB/Yuh-Depot. Mehr dazu im [Backtest-Bereich](/portfolio/how-it-works).

Externe Referenz: die [SNB Yield Curve](https://www.snb.ch/en/iabout/stat/statpub/zidea/id/current_interest_exchange_rates).
