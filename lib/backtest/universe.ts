// Curated instrument universe for the /how-it-works backtesting page.
//
// Selection rules:
//   - Must be tradeable at a Swiss retail broker (ZKB, Yuh, Saxo CH, IBKR CH).
//   - Must have continuous Yahoo price history covering at least 2014-01-01..2024-12-31
//     (with documented per-ticker first-trade-date for engines that need to skip).
//   - SMI large-caps cover the single-stock-heavy ZKB profile.
//   - ETFs cover the diversified 60/40 and global-growth profiles.

export interface InstrumentMeta {
  ticker:        string  // Yahoo symbol (with exchange suffix where required)
  name:          string
  currency:      'CHF' | 'USD' | 'EUR' | 'GBP'
  asset:         'equity' | 'equity-etf' | 'bond-etf' | 'commodity-etf'
  firstTrade:    string  // YYYY-MM-DD — earliest reliable Yahoo close
  domicile:      'CH' | 'IE' | 'LU' | 'US'  // governs Swiss stamp duty (CH = 0.15%, foreign = 0.30%)
}

// SMI heavyweights — the "concentrated retail" sample portfolio draws from these
export const SMI_LARGE: InstrumentMeta[] = [
  { ticker: 'NESN.SW', name: 'Nestlé',        currency: 'CHF', asset: 'equity', firstTrade: '2000-01-03', domicile: 'CH' },
  { ticker: 'NOVN.SW', name: 'Novartis',      currency: 'CHF', asset: 'equity', firstTrade: '2000-01-03', domicile: 'CH' },
  { ticker: 'ROG.SW',  name: 'Roche',         currency: 'CHF', asset: 'equity', firstTrade: '2000-01-03', domicile: 'CH' },
  { ticker: 'UBSG.SW', name: 'UBS Group',     currency: 'CHF', asset: 'equity', firstTrade: '2000-01-03', domicile: 'CH' },
  { ticker: 'ZURN.SW', name: 'Zurich Ins.',   currency: 'CHF', asset: 'equity', firstTrade: '2000-01-03', domicile: 'CH' },
  { ticker: 'ABBN.SW', name: 'ABB',           currency: 'CHF', asset: 'equity', firstTrade: '2000-01-03', domicile: 'CH' },
]

// Swiss-broker-accessible ETFs covering the 60/40 + global-growth sample portfolios.
// Domicile matters for Swiss stamp duty: CH/IE/LU UCITS = 0.15%, US-domiciled = 0.30%.
export const SWISS_ACCESSIBLE_ETFS: InstrumentMeta[] = [
  { ticker: 'VWRL.SW', name: 'Vanguard FTSE All-World',           currency: 'CHF', asset: 'equity-etf',    firstTrade: '2014-01-02', domicile: 'IE' },
  { ticker: 'CSPX.L',  name: 'iShares Core S&P 500 (Acc, UCITS)', currency: 'USD', asset: 'equity-etf',    firstTrade: '2010-05-19', domicile: 'IE' },
  { ticker: 'EUNL.DE', name: 'iShares Core MSCI World (UCITS)',   currency: 'EUR', asset: 'equity-etf',    firstTrade: '2009-10-19', domicile: 'IE' },
  { ticker: 'EIMI.L',  name: 'iShares Core MSCI EM IMI (UCITS)',  currency: 'USD', asset: 'equity-etf',    firstTrade: '2014-06-02', domicile: 'IE' },
  { ticker: 'AGGH.SW', name: 'iShares Core Global Aggregate Bond (CHF-hedged)', currency: 'CHF', asset: 'bond-etf', firstTrade: '2018-11-21', domicile: 'IE' },
  // Fallback for pre-2018 bond exposure on the 60/40 backtest:
  { ticker: 'AGGG.L',  name: 'iShares Core Global Aggregate Bond (UCITS)', currency: 'USD', asset: 'bond-etf', firstTrade: '2017-11-09', domicile: 'IE' },
]

// Benchmarks (used as market-cap reference, NOT in portfolios)
export const BENCHMARKS: Record<string, InstrumentMeta> = {
  SMI:    { ticker: '^SSMI',    name: 'SMI Total Return',         currency: 'CHF', asset: 'equity', firstTrade: '2000-01-03', domicile: 'CH' },
  SPX:    { ticker: '^GSPC',    name: 'S&P 500',                  currency: 'USD', asset: 'equity', firstTrade: '2000-01-03', domicile: 'US' },
  WORLD:  { ticker: 'URTH',     name: 'iShares MSCI World ETF',   currency: 'USD', asset: 'equity-etf', firstTrade: '2012-01-17', domicile: 'US' },
}

export const ALL_INSTRUMENTS: InstrumentMeta[] = [
  ...SMI_LARGE,
  ...SWISS_ACCESSIBLE_ETFS,
  ...Object.values(BENCHMARKS),
]

const META_BY_TICKER = new Map(ALL_INSTRUMENTS.map(m => [m.ticker, m]))

export function metaFor(ticker: string): InstrumentMeta | undefined {
  return META_BY_TICKER.get(ticker)
}

export function stampDutyRate(ticker: string): number {
  const m = META_BY_TICKER.get(ticker)
  if (!m) return 0.0030
  return m.domicile === 'CH' ? 0.0015 : 0.0030
}
