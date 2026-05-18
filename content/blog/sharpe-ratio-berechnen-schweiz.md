---
title: "Sharpe Ratio berechnen: Was Schweizer Investoren wissen müssen"
description: "Wie du die Sharpe Ratio für dein ZKB- oder Yuh-Depot berechnest — inklusive CHF-Risk-Free-Rate und FX-Korrektur."
keywords: ["Sharpe Ratio", "ZKB", "Yuh", "Portfolio Schweiz", "CHF Risk-Free Rate"]
date: 2026-05-18
author: "Dariush Tahajomi"
slug: "sharpe-ratio-berechnen-schweiz"
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

## Was [Quantfoli](/how-it-works) anders macht

Standard-Tools nehmen USD-Rates und ignorieren FX-Effekte. Wir berechnen Sharpe in CHF, mit Schweizer Risk-Free-Rate, auf deinem importierten ZKB/Yuh-Depot. Mehr dazu im [Backtest-Bereich](/backtests).

Externe Referenz: die [SNB Yield Curve](https://www.snb.ch/en/iabout/stat/statpub/zidea/id/current_interest_exchange_rates).

```jsonld-faq
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Welche Risk-Free-Rate für Schweizer Portfolios?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Die 3-Monats-Eidgenossen-Rendite der SNB. Nicht der US-Treasury-Satz."
      }
    },
    {
      "@type": "Question",
      "name": "Was ist eine gute Sharpe Ratio?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Über 1.0 ist gut. Über 2.0 sollte misstrauisch machen, da oft Overfitting oder Selection Bias dahinterstecken."
      }
    }
  ]
}
```
