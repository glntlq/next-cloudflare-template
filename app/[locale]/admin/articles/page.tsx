'use client'

import { MoreHorizontalIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { deleteArticle, getPaginatedArticles } from '@/actions/ai-content'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination-client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Link } from '@/i18n/navigation'
import { locales } from '@/i18n/routing'
import { formatDate } from '@/lib/utils'

export default function ArticlesPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [articles, setArticles] = useState<any[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const fetchArticles = async () => {
    setIsLoading(true)
    try {
      const result = await getPaginatedArticles({
        page: currentPage,
        pageSize
      })
      setArticles(result.articles)
      setTotalPages(result.pagination.totalPages)
    } catch (error) {
      console.error('Failed to fetch articles:', error)
      toast.error('加载文章失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [currentPage])

  const handleDelete = async (slug: string, id: string) => {
    if (confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      try {
        setIsDeleting(id)
        await deleteArticle(slug)
        toast.success('文章已成功删除')

        getPaginatedArticles({
          page: currentPage,
          pageSize
        }).then((result) => {
          setArticles(result.articles)
          setTotalPages(result.pagination.totalPages)
        })
      } catch (error) {
        console.error('删除文章失败:', error)
        toast.error('删除文章失败，请重试')
      } finally {
        setIsDeleting(null)
      }
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const renderPaginationItems = () => {
    const items = []
    const maxVisiblePages = 5

    items.push(
      <PaginationItem key="first">
        <PaginationLink isActive={currentPage === 1} onClick={() => handlePageChange(1)}>
          1
        </PaginationLink>
      </PaginationItem>
    )

    // Calculate range of pages to show
    const startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3)

    // Adjust if we're near the beginning
    if (startPage > 2) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <span className="flex h-9 w-9 items-center justify-center">
            <MoreHorizontalIcon className="h-4 w-4" />
          </span>
        </PaginationItem>
      )
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={currentPage === i} onClick={() => handlePageChange(i)}>
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    // Add ellipsis if needed
    if (endPage < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <span className="flex h-9 w-9 items-center justify-center">
            <MoreHorizontalIcon className="h-4 w-4" />
          </span>
        </PaginationItem>
      )
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink isActive={currentPage === totalPages} onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return items
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">文章列表</h1>
        <div>
          <Link href="/admin/articles/batch">
            <Button>批量创建</Button>
          </Link>
          <Link href="/admin/articles/new">
            <Button className="ml-4" variant="secondary">
              新建文章
            </Button>
          </Link>
        </div>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-lg border shadow">
        <Table>
          <TableHeader>
            <TableRow>
              {['封面图', '标题', '创建日期', '语言', '状态', '操作'].map((header) => (
                <TableHead
                  key={header}
                  className="text-muted-foreground px-6 py-3 text-xs font-medium tracking-wider whitespace-nowrap uppercase"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <div className="flex justify-center">
                    <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground px-6 py-4 text-center">
                  暂无文章
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    {article.coverImageUrl && (
                      <img
                        src={`${process.env.NEXT_PUBLIC_R2_DOMAIN}/${article.coverImageUrl}`}
                        alt={article.title}
                        className="h-16 w-24 rounded-md object-cover"
                      />
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">{article.title}</div>
                    <div className="text-muted-foreground truncate text-sm">{article.slug}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground px-6 py-4 text-sm whitespace-nowrap">
                    {formatDate(article.createdAt)}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline">{locales.find((i) => i.code === article.locale)?.name}</Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={article.publishedAt ? 'success' : 'secondary'}>
                      {article.publishedAt ? '已发布' : '草稿'}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                    <Link
                      href={`/admin/articles/edit/${article.slug}`}
                      className="text-primary hover:text-primary/80 mr-4"
                    >
                      编辑
                    </Link>
                    <Link
                      href={`/blog/${article.slug}`}
                      className="text-primary hover:text-primary/80 mr-4"
                      target="_blank"
                    >
                      查看
                    </Link>
                    <button
                      onClick={() => handleDelete(article.slug, article.id)}
                      disabled={isDeleting === article.id}
                      className="text-destructive hover:text-destructive/80 font-medium"
                    >
                      {isDeleting === article.id ? '删除中...' : '删除'}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6">
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)} />
              </PaginationItem>

              {renderPaginationItems()}

              <PaginationItem>
                <PaginationNext onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </>
  )
}
