'use client'

const TICKERS = [
  { sym: 'SPY',  px: '528.41', chg: '+0.84%', dir: 'pos' },
  { sym: 'QQQ',  px: '449.12', chg: '+1.12%', dir: 'pos' },
  { sym: 'AAPL', px: '212.49', chg: '+0.43%', dir: 'pos' },
  { sym: 'NVDA', px: '875.39', chg: '+2.17%', dir: 'pos' },
  { sym: 'MSFT', px: '418.82', chg: '-0.21%', dir: 'neg' },
  { sym: 'AMZN', px: '192.55', chg: '+0.66%', dir: 'pos' },
  { sym: 'TSLA', px: '174.87', chg: '-1.34%', dir: 'neg' },
  { sym: 'META', px: '511.30', chg: '+0.98%', dir: 'pos' },
  { sym: 'GOOGL',px: '175.43', chg: '+0.52%', dir: 'pos' },
  { sym: 'BRK.B',px: '414.22', chg: '-0.08%', dir: 'neg' },
  { sym: 'JPM',  px: '215.67', chg: '+0.31%', dir: 'pos' },
  { sym: 'V',    px: '278.94', chg: '+0.19%', dir: 'pos' },
  { sym: 'BTC',  px: '67,420', chg: '+3.21%', dir: 'pos' },
  { sym: 'ETH',  px: '3,512',  chg: '+2.44%', dir: 'pos' },
  { sym: 'GLD',  px: '228.15', chg: '+0.67%', dir: 'pos' },
  { sym: 'TLT',  px: '89.34',  chg: '-0.45%', dir: 'neg' },
]

export default function TickerTape() {
  const items = [...TICKERS, ...TICKERS]
  return (
    <div className="ticker-tape">
      <div className="ticker-tape__label">
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
          background: 'var(--pos)', boxShadow: '0 0 8px var(--pos)',
        }} />
        Live
      </div>
      <div className="ticker-tape__track">
        {items.map((t, i) => (
          <div key={i} className="ticker-tape__item">
            <span className="ticker-tape__sym">{t.sym}</span>
            <span className="ticker-tape__px">{t.px}</span>
            <span className={`ticker-tape__chg ${t.dir}`}>{t.chg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
