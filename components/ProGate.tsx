'use client'

interface Props {
  children:        React.ReactNode
  onUpgrade:       () => void
  featureName:     string
  headlineMetric:  React.ReactNode
  featureSubcopy:  string
  ctaLabel:        string
}

function LockIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export default function ProGate({
  children, onUpgrade, featureName, headlineMetric, featureSubcopy, ctaLabel,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Crisp headline — real number on user's actual positions */}
      <div>
        {headlineMetric}
      </div>

      {/* Blurred preview + CTA overlay */}
      <div style={{ position: 'relative' }}>
        <div style={{
          filter:       'blur(8px)',
          pointerEvents: 'none',
          userSelect:    'none',
          opacity:       0.55,
        }}>
          {children}
        </div>

        <div style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '24px',
          zIndex:         10,
        }}>
          <div style={{
            background:    'var(--bg-1)',
            border:        '1px solid var(--accent, #C89B3C)',
            borderRadius:  14,
            padding:       '24px 28px',
            maxWidth:      380,
            textAlign:     'center',
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           10,
            boxShadow:     '0 12px 40px rgba(0,0,0,0.35), 0 0 24px var(--accent-glow, oklch(0.84 0.148 80 / 0.20))',
          }}>
            <div style={{ color: 'var(--accent, #C89B3C)' }}><LockIcon /></div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
              {featureName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              {featureSubcopy}
            </div>
            <button
              className="btn"
              style={{
                marginTop:  4,
                padding:    '10px 18px',
                fontSize:   12.5,
                fontWeight: 700,
                background: 'var(--accent, #C89B3C)',
                color:      '#000',
                border:     'none',
                width:      '100%',
                justifyContent: 'center',
              }}
              onClick={onUpgrade}
            >
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
