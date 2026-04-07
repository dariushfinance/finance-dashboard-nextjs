export interface Position {
  id: number
  user_id: string
  ticker: string
  shares: number
  buy_price: number
  buy_date: string
  current_price?: number
  invested?: number
  current_value?: number
  pnl?: number
  return_pct?: number
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
}

export interface HistoryResult {
  history: HistoricalDataPoint[]
  sharpe: number | null
  volatility: number | null
}

export interface BenchmarkResult {
  data: BenchmarkDataPoint[]
  beta: number | null
  alpha: number | null
}
