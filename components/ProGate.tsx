'use client'

interface Props {
  children: React.ReactNode
  onUpgrade: () => void
  featureName: string
}

function LockIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export default function ProGate({ children, onUpgrade, featureName }: Props) {
  return (
    <div style={{ position: 'relative' }}>
      {/* Blurred content behind gate */}
      <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.4 }}>
        {children}
      </div>

      {/* Lock overlay */}
      <div style={{
        position:       'absolute',
        inset:          0,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            16,
        zIndex:         10,
      }}>
        <div style={{
          background:   'var(--surface)',
          border:       '1px solid var(--line-soft)',
          borderRadius: 16,
          padding:      '32px 40px',
          textAlign:    'center',
          display:      'flex',
          flexDirection: 'column',
          alignItems:   'center',
          gap:          12,
          boxShadow:    '0 8px 32px rgba(0,0,0,0.3)',
        }}>
          <div style={{ color: 'var(--brand-green)' }}><LockIcon /></div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>
            {featureName} — Pro only
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 280, lineHeight: 1.5 }}>
            Upgrade to Pro to access Sharpe Ratio, Efficient Frontier, Stress Testing, and Full Fundamentals.
          </div>
          <button
            className="btn btn--primary"
            style={{ marginTop: 4, padding: '10px 24px', fontSize: 13 }}
            onClick={onUpgrade}
          >
            Upgrade to Pro — CHF 12/mo
          </button>
        </div>
      </div>
    </div>
  )
}
