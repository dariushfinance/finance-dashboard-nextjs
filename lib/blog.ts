import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkHtml from 'remark-html'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export interface BlogFrontmatter {
  title: string
  description: string
  keywords?: string[]
  date: string
  author: string
  slug: string
  image?: string
}

export interface BlogPostMeta extends BlogFrontmatter {
  readingMinutes: number
}

export interface BlogPost extends BlogPostMeta {
  html: string
  faqSchema: object | null
}

const FAQ_FENCE = /```jsonld-faq\s*\n([\s\S]*?)\n```/g

function countWords(md: string): number {
  return md.replace(/[`*_>#\-\[\]\(\)!]/g, ' ').split(/\s+/).filter(Boolean).length
}

function readingMinutes(md: string): number {
  return Math.max(1, Math.round(countWords(md) / 220))
}

async function listFiles(): Promise<string[]> {
  try {
    const entries = await fs.readdir(BLOG_DIR)
    return entries.filter((f) => f.endsWith('.md'))
  } catch {
    return []
  }
}

async function readFile(file: string) {
  const raw = await fs.readFile(path.join(BLOG_DIR, file), 'utf8')
  return matter(raw)
}

export async function getAllPostsMeta(): Promise<BlogPostMeta[]> {
  const files = await listFiles()
  const posts = await Promise.all(
    files.map(async (file) => {
      const { data, content } = await readFile(file)
      const fm = data as BlogFrontmatter
      return {
        ...fm,
        readingMinutes: readingMinutes(content),
      }
    })
  )
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const files = await listFiles()
  for (const file of files) {
    const { data, content } = await readFile(file)
    const fm = data as BlogFrontmatter
    if (fm.slug !== slug) continue

    let faqSchema: object | null = null
    const faqMatches = [...content.matchAll(FAQ_FENCE)]
    if (faqMatches.length > 0) {
      try {
        faqSchema = JSON.parse(faqMatches[0][1])
      } catch {
        faqSchema = null
      }
    }
    const body = content.replace(FAQ_FENCE, '').trim()

    const processed = await remark().use(remarkGfm).use(remarkHtml, { sanitize: false }).process(body)
    const html = String(processed)

    return {
      ...fm,
      readingMinutes: readingMinutes(body),
      html,
      faqSchema,
    }
  }
  return null
}

export async function getAllSlugs(): Promise<string[]> {
  const posts = await getAllPostsMeta()
  return posts.map((p) => p.slug)
}
