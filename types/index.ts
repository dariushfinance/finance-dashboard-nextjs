export interface Position {
  id: number
  user_id: string
  ticker: string
  shares: number
  buy_price: number
  buy_date: string
  current_price?: number | null
  invested?: number
  current_value?: number | null
  pnl?: number | null
  return_pct?: number | null
  price_error?: boolean
  lot_count?: number
  lot_ids?: number[]
}

export interface PortfolioMetrics {
  total_value: number
  total_invested: number
  total_pnl: number
  total_return: number
  sharpe_ratio?: number
  volatility?: number
}

export interface HistoricalDataPoint {
  date: string
  value: number
}

export interface BenchmarkDataPoint {
  date: string
  portfolio: number
  sp500: number
}

export interface Fundamentals {
  ticker: string
  pe?: number | null
  ev_ebitda?: number | null
  ps?: number | null
  gross_margin?: number | null
  net_margin?: number | null
  roe?: number | null
  debt_equity?: number | null
  rev_growth?: number | null
  fcf_yield?: number | null
  rateLimited?: boolean
}

export interface HistoryResult {
  history: HistoricalDataPoint[]
  twrReturns: { date: string; ret: number }[]
  sharpe: number | null
  volatility: number | null
  sortino: number | null
  maxDrawdown: number | null
  var95: number | null
  cvar95: number | null
}

export interface BenchmarkResult {
  data: BenchmarkDataPoint[]
  beta: number | null
  alpha: number | null
  informationRatio: number | null
  rollingBeta: { date: string; beta: number }[]
}

export interface CorrelationResult {
  tickers: string[]
  matrix: number[][]
  avgOffDiagonal: number | null
}
