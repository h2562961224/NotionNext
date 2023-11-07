import BLOG from '@/blog.config'
import { getGlobalData } from '@/lib/notion/getNotionData'

function fetchAllPathFromGlobalData({ allPages, categoryOptions, tagOptions, postCount }, slugs) {
  if (!slugs) {
    return []
  }
  const modifiedPages = allPages.filter(row => {
    const slug = row.slug
    return slug && slugs.indexOf(slug.substring(slug.lastIndexOf('/') + 1)) >= 0
  })

  if (modifiedPages.length === 0) {
    return []
  }

  const relatedTags = new Set();
  const relatedCategories = new Set();

  modifiedPages.forEach(row => {
    if (row.tags) {
      row.tags.forEach(tag => {
        relatedTags.add(tag)
      })
    }
    if (row.category) {
      relatedCategories.add(row.category)
    }
  })

  const paths = []
  const postPaths = modifiedPages.filter(row => row.type.indexOf('Menu') < 0).map(row => '/' + row.slug)

  const categoryPaths = []
  const categoryPagePaths = []

  categoryOptions.forEach(({ name: category, count }) => {
    if (relatedCategories.has(category)) {
      categoryPaths.push(`/category/${category}`)
      const totalPages = Math.ceil(count / BLOG.POSTS_PER_PAGE)
      if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
          categoryPagePaths.push(`/category/${category}/page/${i}`)
        }
      }
    }
  })

  const totalPages = Math.ceil(postCount / BLOG.POSTS_PER_PAGE)
  const pagePaths = Array.from({ length: totalPages - 1 }, (_, i) => `/page/${i + 2}`)

  const tagPaths = []
  const tagPagePaths = []

  tagOptions.forEach(({ name: tag, count }) => {
    if (relatedTags.has(tag)) {
      categoryPaths.push(`/tag/${tag}`)
      const totalPages = Math.ceil(count / BLOG.POSTS_PER_PAGE)
      if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
          categoryPagePaths.push(`/tag/${tag}/page/${i}`)
        }
      }
    }
  })

  paths.push('/')
  paths.push(...postPaths)
  paths.push('/archive')
  paths.push('/category')
  paths.push(...categoryPaths)
  paths.push(...categoryPagePaths)
  paths.push(...pagePaths)
  paths.push('/search')
  paths.push('/tag')
  paths.push(...tagPaths)
  paths.push(...tagPagePaths)
  return paths
}

/**
 * 接受邮件订阅
 * @param {*} req
 * @param {*} res
 */
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { revalidateSecret, slugs } = req.body
    if (revalidateSecret === BLOG.NEXT_REVALIDATE_SECRET) {
      const paths = await getGlobalData({ from: 'revalidate' }).then(data => fetchAllPathFromGlobalData(data, slugs))
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i]
        await res.revalidate(path)
      }
      res.status(200).json({ status: 'success', message: 'Revalidate success' })
    } else {
      res.status(403).json({ status: 'error', message: 'Invalid secret' })
    }
  } else {
    res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }
}
