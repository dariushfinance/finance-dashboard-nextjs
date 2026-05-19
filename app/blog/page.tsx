import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPostsMeta } from '@/lib/blog'

const SITE_URL = 'https://quantfoli.com'
const TITLE = 'Blog · Quantfoli'
const DESC = 'Quant-driven portfolio insights for Swiss self-directed investors — Sharpe, Markowitz, ZKB/Yuh-Use-Cases, FX, and risk.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: { title: TITLE, description: DESC, type: 'website', url: `${SITE_URL}/blog` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESC },
}

export const dynamic = 'force-static'
export const revalidate = 3600

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function BlogIndexPage() {
  const posts = await getAllPostsMeta()

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
      <header style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>Blog</h1>
        <p style={{ color: '#475569', fontSize: 17, lineHeight: 1.6 }}>
          Portfolio analytics, Swiss-broker mechanics, and quant primers — written for self-directed investors.
        </p>
      </header>

      {posts.length === 0 ? (
        <p style={{ color: '#64748b' }}>No articles yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 32 }}>
          {posts.map((post) => (
            <li key={post.slug} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 24 }}>
              <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <article>
                  <div style={{ fontSize: 13, color: '#ffffff', marginBottom: 8 }}>
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    <span style={{ margin: '0 8px' }}>·</span>
                    <span>{post.readingMinutes} min read</span>
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, letterSpacing: '-0.01em' }}>
                    {post.title}
                  </h2>
                  <p style={{ color: '#475569', lineHeight: 1.6, margin: 0 }}>{post.description}</p>
                </article>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
