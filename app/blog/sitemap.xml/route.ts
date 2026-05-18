import { getAllPostsMeta } from '@/lib/blog'

const SITE_URL = 'https://quantfoli.com'

export const dynamic = 'force-static'
export const revalidate = 3600

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!))
}

export async function GET() {
  const posts = await getAllPostsMeta()

  const urls = [
    `  <url><loc>${SITE_URL}/blog</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
    ...posts.map(
      (p) =>
        `  <url><loc>${escapeXml(`${SITE_URL}/blog/${p.slug}`)}</loc><lastmod>${p.date}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
    ),
  ].join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap-0.9">
${urls}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
    },
  })
}
