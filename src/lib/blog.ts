import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: string
  author: string
  date: string
  coverImage: string
  tags: string[]
  readingTime: string
  content: string
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'))

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.md$/, '')
    const raw = fs.readFileSync(path.join(BLOG_DIR, filename), 'utf-8')
    const { data, content } = matter(raw)
    const stats = readingTime(content)

    return {
      slug,
      title: data.title || slug,
      excerpt: data.excerpt || '',
      category: data.category || 'Uncategorized',
      author: data.author || 'Inmybox Team',
      date: data.date || '',
      coverImage: data.coverImage || '',
      tags: data.tags || [],
      readingTime: stats.text,
      content,
    }
  })

  // Sort by date (newest first)
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const stats = readingTime(content)

  return {
    slug,
    title: data.title || slug,
    excerpt: data.excerpt || '',
    category: data.category || 'Uncategorized',
    author: data.author || 'Inmybox Team',
    date: data.date || '',
    coverImage: data.coverImage || '',
    tags: data.tags || [],
    readingTime: stats.text,
    content,
  }
}

export function getCategories(): string[] {
  const posts = getAllPosts()
  return Array.from(new Set(posts.map(p => p.category)))
}
