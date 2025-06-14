'use client'

import { use, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { getArticleBySlug, updateArticle, deleteArticle } from '@/actions/ai-content'
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
