'use client'

import { Loader2, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getArticleBySlug, updateArticle, deleteArticle, generateArticleCoverImage } from '@/actions/ai-content'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from '@/i18n/navigation'

export default function EditArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const { slug } = use(params)

  const [article, setArticle] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [isGeneratingCover, setIsGeneratingCover] = useState(false)

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const data = await getArticleBySlug(slug)
        if (data) {
          setArticle(data)
          setIsPublished(!!data.publishedAt)
        } else {
          toast.error('文章未找到')
          router.push('/admin/articles')
        }
      } catch (error) {
        console.error('获取文章时出错:', error)
        toast.error('获取文章失败')
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticle()
  }, [slug, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    setArticle({
      ...article,
      [field]: e.target.value
    })
  }

  const handlePublishToggle = () => {
    setIsPublished(!isPublished)
  }

  const handleSave = async () => {
    if (!article) return

    setIsSaving(true)
    try {
      const updatedData = {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        coverImage: article.coverImage,
        publishedAt: isPublished ? new Date() : null
      }

      await updateArticle(slug, updatedData)
      toast.success('文章已更新')
      router.push('/admin/articles')
    } catch (error) {
      console.error('更新文章时出错:', error)
      toast.error('更新文章失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteArticle(slug)
      toast.success('文章已删除')
      router.push('/admin/articles')
    } catch (error) {
      console.error('删除文章时出错:', error)
      toast.error('删除文章失败')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRegenerateCover = async () => {
    if (!article || !article.content) {
      toast.error('需要文章内容才能生成封面图')
      return
    }

    setIsGeneratingCover(true)
    try {
      const imageUrl = await generateArticleCoverImage(article.content, article.title)

      if (imageUrl) {
        setArticle({
          ...article,
          coverImage: imageUrl
        })
        toast.success('封面图已重新生成')
      } else {
        toast.error('生成封面图失败')
      }
    } catch (error) {
      console.error('生成封面图时出错:', error)
      toast.error('生成封面图失败')
    } finally {
      setIsGeneratingCover(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>正在加载...</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">编辑文章</h1>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? '正在删除...' : '删除文章'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>确定要删除这篇文章吗？此操作无法撤销。</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="bg-card rounded-lg border p-6 shadow">
        <div className="mb-4">
          <Label htmlFor="title">标题</Label>
          <Input id="title" value={article.title} onChange={(e) => handleInputChange(e, 'title')} />
        </div>

        <div className="mb-4">
          <Label htmlFor="excerpt">摘要</Label>
          <Textarea id="excerpt" value={article.excerpt} onChange={(e) => handleInputChange(e, 'excerpt')} rows={3} />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="coverImage">封面图</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateCover}
              disabled={isGeneratingCover}
              className="flex items-center gap-1"
            >
              {isGeneratingCover ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>生成中...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>重新生成</span>
                </>
              )}
            </Button>
          </div>
          <div className="mt-2 rounded-md border">
            {article.coverImage ? (
              <figure className="relative">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-auto w-full rounded-md"
                  style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                />
              </figure>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                <p className="text-sm text-gray-500">无封面图</p>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">封面图将显示在文章列表和文章详情页面顶部</p>
        </div>

        <div className="mb-6">
          <Label htmlFor="content">内容</Label>
          <Textarea
            id="content"
            value={article.content}
            onChange={(e) => handleInputChange(e, 'content')}
            rows={20}
            className="font-mono"
          />
        </div>

        <div className="mb-6 flex items-center space-x-2">
          <Switch id="published" checked={isPublished} onCheckedChange={handlePublishToggle} />
          <Label htmlFor="published">发布文章</Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/articles')}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '正在保存...' : '保存文章'}
          </Button>
        </div>
      </div>
    </>
  )
}
