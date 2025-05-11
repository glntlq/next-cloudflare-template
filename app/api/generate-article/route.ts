import { NextRequest, NextResponse } from 'next/server'

import { generateArticle } from '@/actions/ai-content'
import { auth } from '@/lib/auth'

export const runtime = 'edge'

interface RequestBody {
  keyword: string
  locale?: string
}

export async function POST(request: NextRequest) {
  const u = await auth()
  if (u?.user?.id !== process.env.NEXT_PUBLIC_ADMIN_ID) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body: RequestBody = await request.json()
    const { keyword, locale } = body

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    const article = await generateArticle({ keyword, locale })
    return NextResponse.json(article)
  } catch (error: any) {
    console.error('Error generating article:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate article' }, { status: 500 })
  }
}
