import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllSlugs, getPostBySlug } from '@/lib/blog'
import styles from './article.module.css'

const SITE_URL = 'https://quantfoli.com'
const PUBLISHER = 'Quantfoli'

export const dynamic = 'force-static'
export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  if (!post) return {}
  const url = `${SITE_URL}/portfolio/blog/${post.slug}`
  const image = post.image || `${SITE_URL}/opengraph-image`
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url,
      images: [{ url: image }],
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [image],
    },
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()

  const url = `${SITE_URL}/portfolio/blog/${post.slug}`
  const image = post.image || `${SITE_URL}/opengraph-image`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image,
    datePublished: post.date,
    dateModified: post.date,
    author: { '@type': 'Person', name: post.author, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: PUBLISHER,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {post.faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(post.faqSchema) }}
        />
      )}

      <nav style={{ marginBottom: 32, fontSize: 14 }}>
        <Link href="/portfolio/blog" style={{ color: '#ffffff', textDecoration: 'none' }}>
          ← Blog
        </Link>
      </nav>

      <header style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 16 }}>
          {post.title}
        </h1>
        <div style={{ fontSize: 14, color: '#ffffff' }}>
          <span>{post.author}</span>
          <span style={{ margin: '0 8px' }}>·</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span style={{ margin: '0 8px' }}>·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
      </header>

      <article
        className={styles.prose}
        dangerouslySetInnerHTML={{ __html: post.html }}
      />
    </main>
  )
}
