import type { MetadataRoute } from 'next'

const SITE_URL = 'https://quantfoli.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
    { path: '',                          priority: 1.0, changeFrequency: 'weekly' },
    { path: '/portfolio',                priority: 0.95, changeFrequency: 'weekly' },
    { path: '/portfolio/how-it-works',   priority: 0.9, changeFrequency: 'weekly' },
    { path: '/portfolio/blog',           priority: 0.8, changeFrequency: 'daily' },
    { path: '/portfolio/login',          priority: 0.6, changeFrequency: 'monthly' },
    { path: '/portfolio/register',       priority: 0.7, changeFrequency: 'monthly' },
    { path: '/learn',                    priority: 0.6, changeFrequency: 'monthly' },
    { path: '/support',                  priority: 0.5, changeFrequency: 'monthly' },
    { path: '/privacy',                  priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms',                    priority: 0.3, changeFrequency: 'yearly' },
    { path: '/advisor-legal',            priority: 0.4, changeFrequency: 'yearly' },
  ]

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}
