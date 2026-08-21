import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Clock,
  Send,
  Pin,
  Lock,
  Share2,
  Trash2,
  Pencil,
  X
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useForm } from 'react-hook-form'
import { lumi } from '../lib/lumi'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface ForumComment {
  _id: string
  post_id: string
  user_id: string
  content: string
  createdAt: string
  author?: {
    username: string
    avatar: string
  }
}

interface PostDetail {
  _id: string
  user_id: string
  title: string
  content: string
  category: string
  likes: number
  views: number
  isPinned?: boolean
  isLocked?: boolean
  tags?: string[]
  createdAt: string
  author?: {
    username: string
    avatar: string
  }
}

interface EditPostFormValues {
  title: string
  content: string
  category: string
  tagsInput: string
}

const ForumPostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [post, setPost] = useState<PostDetail | null>(null)
  const [comments, setComments] = useState<ForumComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<EditPostFormValues>()

  const categories = [
    { value: 'discussao', label: 'Geral' },
    { value: 'isekai', label: 'Isekai' },
    { value: 'shounen', label: 'Shonen' },
    { value: 'classicos', label: 'Clássicos' },
    { value: 'manga', label: 'Mangás' },
    { value: 'recomendacao', label: 'Recomendações' },
    { value: 'duvida', label: 'Dúvidas' },
    { value: 'noticia', label: 'Notícias' },
    { value: 'evento', label: 'Eventos' }
  ]

  const loadPostAndComments = useCallback(async () => {
    if (!postId) return
    try {
      setLoading(true)

      const [postRes, commentsRes, profilesRes] = await Promise.allSettled([
        lumi.entities.forum_posts.get(postId),
        lumi.entities.forum_comments.list({ filter: { post_id: postId } }),
        lumi.entities.user_profiles.list()
      ])

      const rawPost = postRes.status === 'fulfilled' ? (postRes.value as any) : null
      const rawComments = commentsRes.status === 'fulfilled' ? (commentsRes.value.list || []) : []
      const rawProfiles = profilesRes.status === 'fulfilled' ? (profilesRes.value.list || []) : []

      if (!rawPost) {
        toast.error('Tópico não encontrado')
        navigate('/forum')
        return
      }

      const profileMap = new Map<string, { username: string; avatar: string }>()
      rawProfiles.forEach((p: any) => {
        if (p.user_id) {
          profileMap.set(p.user_id, {
            username: p.username || 'Otaku',
            avatar: p.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'
          })
        }
      })

      const enrichedPost: PostDetail = {
        _id: rawPost._id || postId,
        user_id: rawPost.user_id,
        title: rawPost.title || '',
        content: rawPost.content || '',
        category: rawPost.category || 'discussao',
        likes: rawPost.likes || 0,
        views: rawPost.views || 0,
        isPinned: Boolean(rawPost.isPinned),
        isLocked: Boolean(rawPost.isLocked),
        tags: Array.isArray(rawPost.tags) ? rawPost.tags : [],
        createdAt: rawPost.createdAt || new Date().toISOString(),
        author: profileMap.get(rawPost.user_id) || {
          username: 'Otaku',
          avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'
        }
      }

      setPost(enrichedPost)

      // Preenche os campos do formulário de edição
      setValue('title', enrichedPost.title)
      setValue('content', enrichedPost.content)
      setValue('category', enrichedPost.category)
      setValue('tagsInput', enrichedPost.tags ? enrichedPost.tags.join(', ') : '')

      const enrichedComments: ForumComment[] = rawComments.map((c: any) => ({
        _id: c._id,
        post_id: c.post_id,
        user_id: c.user_id,
        content: c.content,
        createdAt: c.createdAt || new Date().toISOString(),
        author: profileMap.get(c.user_id) || {
          username: 'Otaku',
          avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'
        }
      })).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

      setComments(enrichedComments)

      lumi.entities.forum_posts.update(postId, { views: (rawPost.views || 0) + 1 }).catch(() => {})
    } catch (error) {
      console.error('Erro ao carregar discussão:', error)
    } finally {
      setLoading(false)
    }
  }, [postId, navigate, setValue])

  useEffect(() => {
    loadPostAndComments()
  }, [loadPostAndComments])

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para curtir')
      return
    }
    if (!post) return

    try {
      const nextLikes = isLiked ? Math.max(0, post.likes - 1) : post.likes + 1
      setIsLiked(!isLiked)
      setPost({ ...post, likes: nextLikes })
      await lumi.entities.forum_posts.update(post._id, { likes: nextLikes })
    } catch {
      toast.error('Erro ao atualizar curtida')
    }
  }

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated || !user) {
      try {
        await lumi.auth.signIn()
      } catch {
        toast.error('Faça login para comentar')
      }
      return
    }

    if (!newComment.trim() || !postId) return

    try {
      setSubmitting(true)
      const commentPayload = {
        post_id: postId,
        user_id: user.userId,
        content: newComment.trim(),
        createdAt: new Date().toISOString()
      }

      await lumi.entities.forum_comments.create(commentPayload)
      setNewComment('')
      await loadPostAndComments()
      toast.success('Comentário publicado!')
    } catch (error) {
      console.error('Erro ao enviar comentário:', error)
      toast.error('Erro ao publicar comentário')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditPost = async (data: EditPostFormValues) => {
    if (!post || !user || user.userId !== post.user_id) return

    try {
      setSubmitting(true)
      const parsedTags = data.tagsInput
        ? data.tagsInput.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean)
        : []

      const updatedPayload = {
        title: data.title.trim(),
        content: data.content.trim(),
        category: data.category,
        tags: parsedTags
      }

      await lumi.entities.forum_posts.update(post._id, updatedPayload)

      setPost({
        ...post,
        title: updatedPayload.title,
        content: updatedPayload.content,
        category: updatedPayload.category,
        tags: updatedPayload.tags
      })

      setShowEditModal(false)
      toast.success('Tópico atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao editar tópico:', error)
      toast.error('Erro ao salvar alterações')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    if (!post || !window.confirm('Tem certeza que deseja apagar este tópico permanentemente?')) return

    try {
      setDeleting(true)
      for (const comment of comments) {
        try {
          await lumi.entities.forum_comments.delete(comment._id)
        } catch {}
      }

      await lumi.entities.forum_posts.delete(post._id)
      toast.success('Tópico excluído com sucesso!')
      navigate('/forum')
    } catch (error) {
      console.error('Erro ao apagar tópico:', error)
      toast.error('Não foi possível excluir o tópico')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!post) return null

  const isOwner = user?.userId === post.user_id

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          type="button"
          onClick={() => navigate('/forum')}
          className="inline-flex items-center space-x-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Voltar ao Fórum</span>
        </button>

        {/* Post Principal */}
        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <img
                src={post.author?.avatar}
                alt={post.author?.username}
                className="w-10 h-10 rounded-xl object-cover border border-zinc-700/80 shrink-0"
              />
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">{post.author?.username}</h3>
                <div className="flex items-center space-x-2 text-[11px] text-zinc-500 mt-0.5">
                  <Clock size={12} />
                  <span>
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                  <span>•</span>
                  <span className="bg-[#18181c] text-zinc-400 px-2 py-0.5 rounded border border-zinc-800 uppercase text-[10px] tracking-wider">
                    {post.category}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {post.isPinned && <Pin size={15} className="text-red-500" />}
              {post.isLocked && <Lock size={15} className="text-zinc-500" />}
              
              {/* Botões de Ação para o Autor */}
              {isOwner && (
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    title="Editar tópico"
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer border border-zinc-700/60"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePost}
                    disabled={deleting}
                    title="Excluir tópico"
                    className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mb-4 tracking-tight">
            {post.title}
          </h1>

          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line mb-6">
            {post.content}
          </p>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {post.tags.map(t => (
                <span key={t} className="bg-[#18181c] text-zinc-400 border border-zinc-800 text-[11px] px-2 py-0.5 rounded-md">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800/60 text-xs text-zinc-400">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isLiked
                    ? 'bg-red-500/10 text-red-500 border-red-500/30'
                    : 'bg-[#18181c] hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
              >
                <Heart size={14} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
                <span>{post.likes}</span>
              </button>

              <div className="flex items-center space-x-1.5 text-zinc-500">
                <MessageSquare size={14} />
                <span>{comments.length} comentários</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                toast.success('Link do tópico copiado!')
              }}
              className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <Share2 size={14} />
              <span>Compartilhar</span>
            </button>
          </div>
        </div>

        {/* Respostas */}
        <div className="space-y-4 mb-8">
          <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center space-x-2">
            <MessageSquare size={16} className="text-red-500" />
            <span>Respostas ({comments.length})</span>
          </h2>

          <form onSubmit={handleCreateComment} className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-4">
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isAuthenticated ? "Escreva sua resposta para participar da discussão..." : "Faça login para responder neste tópico..."}
              disabled={submitting}
              className="w-full bg-[#18181c] text-zinc-100 text-xs p-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-red-500 resize-none transition-colors"
            />
            <div className="flex items-center justify-between mt-3 pt-2">
              <span className="text-[11px] text-zinc-500">
                Participe mantendo o respeito mútuo.
              </span>
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Send size={13} />
                <span>{submitting ? 'Enviando...' : 'Comentar'}</span>
              </button>
            </div>
          </form>

          {comments.map((comment) => (
            <div key={comment._id} className="bg-[#121215] border border-zinc-800/80 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <img
                  src={comment.author?.avatar}
                  alt={comment.author?.username}
                  className="w-8 h-8 rounded-lg object-cover border border-zinc-700/80 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-zinc-200">{comment.author?.username}</span>
                    <span className="text-[10px] text-zinc-500">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className="text-center py-8 bg-[#121215]/50 border border-zinc-800/40 rounded-xl">
              <p className="text-xs text-zinc-500">Nenhuma resposta publicada ainda.</p>
            </div>
          )}
        </div>

        {/* Modal de Edição */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">Editar Discussão</h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleEditPost)} className="space-y-4">
                <div>
                  <label className="block text-zinc-400 text-xs mb-1.5 font-medium">Título</label>
                  <input
                    {...register('title', { required: 'Título é obrigatório' })}
                    className="w-full bg-[#18181c] text-zinc-100 text-xs px-3.5 py-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-500"
                  />
                  {errors.title && <p className="text-red-400 text-[11px] mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs mb-1.5 font-medium">Categoria</label>
                  <select
                    {...register('category', { required: 'Selecione uma categoria' })}
                    className="w-full bg-[#18181c] text-zinc-300 text-xs px-3 py-2.5 rounded-lg border border-zinc-800 focus:outline-none cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-400 text-[11px] mt-1">{errors.category.message}</p>}
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs mb-1.5 font-medium">Conteúdo</label>
                  <textarea
                    {...register('content', { required: 'Conteúdo é obrigatório' })}
                    rows={6}
                    className="w-full bg-[#18181c] text-zinc-100 text-xs px-3.5 py-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-500 resize-none"
                  />
                  {errors.content && <p className="text-red-400 text-[11px] mt-1">{errors.content.message}</p>}
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs mb-1.5 font-medium">Tags (separadas por vírgula)</label>
                  <input
                    {...register('tagsInput')}
                    className="w-full bg-[#18181c] text-zinc-100 text-xs px-3.5 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-500"
                    placeholder="ex: shounen, discussao, teoria"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {submitting ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForumPostDetail