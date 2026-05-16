import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Quantfoli — Quant-grade portfolio analytics'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'radial-gradient(circle at 20% 0%, rgba(129, 140, 248, 0.35), transparent 55%), radial-gradient(circle at 100% 100%, rgba(96, 165, 250, 0.25), transparent 50%), #0b0f1a',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              fontWeight: 700,
              background:
                'linear-gradient(135deg, rgba(129,140,248,1), rgba(96,165,250,1))',
              color: '#0b0f1a',
              boxShadow: '0 0 60px rgba(129, 140, 248, 0.55)',
            }}
          >
            Q
          </div>
          <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1 }}>Quantfoli</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 78,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 1000,
            }}
          >
            Quant-grade portfolio analytics for Swiss investors.
          </div>
          <div style={{ fontSize: 30, color: '#94a3b8', maxWidth: 1000, lineHeight: 1.3 }}>
            Markowitz frontier · Stress tests · Sharpe / Sortino / Beta / Alpha · ZKB · Yuh · Neon CSV import
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 24,
            color: '#64748b',
          }}
        >
          <div>quantfoli.com</div>
          <div>Not investment advice</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
