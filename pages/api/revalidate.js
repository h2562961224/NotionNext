import { revalidatePath } from 'next/cache'
import BLOG from '@/blog.config'

/**
 * 接受邮件订阅
 * @param {*} req
 * @param {*} res
 */
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { revalidateSecret } = req.body
    if (revalidateSecret === BLOG.NEXT_REVALIDATE_SECRET) {
      revalidatePath('/')
      res.status(200).json({ status: 'success', message: 'Revalidate success' })
    } else {
      res.status(403).json({ status: 'error', message: 'Invalid secret' })
    }
  } else {
    res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }
}
