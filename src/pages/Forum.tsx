import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MessageSquare,
  Heart,
  Eye,
  Clock,
  Plus,
  Search,
  Pin,
  Lock,
  Flame,
  X,
  Sparkles,
  Swords,
  BookOpen,
  Crown,
  HelpCircle,
  Newspaper,
  Calendar,
  Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { lumi } from '../lib/lumi'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useForm } from 'react-hook-form'

interface ForumPost {
  _id: string
  user_id: string
  title: string
  content: string
  category: string
  anime_id?: string
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
  commentCount?: number
  lastActivity?: string
}

interface CreatePostFormValues {
  title: string
  content: string
  category: string
  tagsInput: string
}

const Forum: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [sortBy, setSortBy] = useState('recent')
  const [forumStats, setForumStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    todayPosts: 0,
    activeUsers: 0
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreatePostFormValues>()

  const categories = [
    { value: 'discussao', label: 'Geral', icon: MessageSquare },
    { value: 'isekai', label: 'Isekai', icon: Sparkles },
    { value: 'shounen', label: 'Shonen', icon: Swords },
    { value: 'classicos', label: 'Clássicos', icon: Crown },
    { value: 'manga', label: 'Mangás', icon: BookOpen },
    { value: 'recomendacao', label: 'Recomendações', icon: Flame },
    { value: 'duvida', label: 'Dúvidas', icon: HelpCircle },
    { value: 'noticia', label: 'Notícias', icon: Newspaper },
    { value: 'evento', label: 'Eventos', icon: Calendar }
  ]

  const sortOptions = [
    { value: 'recent', label: 'Mais Recentes' },
    { value: 'popular', label: 'Mais Populares' },
    { value: 'likes', label: 'Mais Curtidos' },
    { value: 'views', label: 'Mais Visualizados' },
    { value: 'comments', label: 'Mais Comentados' }
  ]

  useEffect(() => {
    loadForumData()
  }, [selectedCategory, sortBy])

  const loadForumData = async () => {
    try {
      setLoading(true)

      let filter: Record<string, any> = {}
      if (selectedCategory) {
        filter.category = selectedCategory
      }

      const [postsRes, profilesRes, commentsRes] = await Promise.allSettled([
        lumi.entities.forum_posts.list({ filter }),
        lumi.entities.user_profiles.list(),
        lumi.entities.forum_comments.list()
      ])

      const postList = postsRes.status === 'fulfilled' ? postsRes.value.list || [] : []
      const profileList = profilesRes.status === 'fulfilled' ? profilesRes.value.list || [] : []
      const commentList = commentsRes.status === 'fulfilled' ? commentsRes.value.list || [] : []

      const profileMap = new Map<string, { username: string; avatar: string }>()
      profileList.forEach((p: any) => {
        if (p.user_id) {
          profileMap.set(p.user_id, {
            username: p.username || 'Otaku',
            avatar: p.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'
          })
        }
      })

      const commentsCountMap = new Map<string, number>()
      const lastActivityMap = new Map<string, string>()

      commentList.forEach((c: any) => {
        if (c.post_id) {
          commentsCountMap.set(c.post_id, (commentsCountMap.get(c.post_id) || 0) + 1)
          const currentLast = lastActivityMap.get(c.post_id)
          if (!currentLast || new Date(c.createdAt).getTime() > new Date(currentLast).getTime()) {
            lastActivityMap.set(c.post_id, c.createdAt)
          }
        }
      })

      const enrichedPosts: ForumPost[] = postList.map((post: any) => ({
        ...post,
        tags: Array.isArray(post.tags) ? post.tags : [],
        author: profileMap.get(post.user_id) || {
          username: 'Otaku',
          avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'
        },
        commentCount: commentsCountMap.get(post._id) || 0,
        lastActivity: lastActivityMap.get(post._id) || post.createdAt
      }))

      enrichedPosts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1

        switch (sortBy) {
          case 'popular':
            return ((b.likes || 0) + (b.views || 0) + (b.commentCount || 0)) - ((a.likes || 0) + (a.views || 0) + (a.commentCount || 0))
          case 'likes':
            return (b.likes || 0) - (a.likes || 0)
          case 'views':
            return (b.views || 0) - (a.views || 0)
          case 'comments':
            return (b.commentCount || 0) - (a.commentCount || 0)
          default:
            return new Date(b.lastActivity || b.createdAt).getTime() - new Date(a.lastActivity || a.createdAt).getTime()
        }
      })

      setPosts(enrichedPosts)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayPosts = enrichedPosts.filter(p => new Date(p.createdAt) >= today).length

      setForumStats({
        totalPosts: postList.length,
        totalUsers: profileList.length,
        todayPosts,
        activeUsers: profileList.filter((p: any) => p.isActive).length
      })
    } catch (error) {
      console.error('Erro ao carregar fórum:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPost = async (data: CreatePostFormValues) => {
    if (!isAuthenticated || !user) {
      try {
        await lumi.auth.signIn()
      } catch {
        toast.error('Faça login para continuar')
      }
      return
    }

    try {
      const parsedTags = data.tagsInput
        ? data.tagsInput.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean)
        : []

      const postData = {
        user_id: user.userId,
        title: data.title.trim(),
        content: data.content.trim(),
        category: data.category,
        tags: parsedTags,
        likes: 0,
        views: 0,
        isPinned: false,
        isLocked: false,
        createdAt: new Date().toISOString()
      }

      await lumi.entities.forum_posts.create(postData)

      reset()
      setShowCreatePost(false)
      await loadForumData()
      toast.success('Discussão criada com sucesso!')
    } catch (error) {
      console.error('Erro ao criar post:', error)
      toast.error('Erro ao publicar discussão')
    }
  }

  const deleteSinglePost = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!window.confirm('Deseja realmente apagar este tópico?')) return

    try {
      await lumi.entities.forum_posts.delete(postId)
      setPosts(prev => prev.filter(p => p._id !== postId))
      toast.success('Tópico excluído!')
    } catch {
      toast.error('Erro ao excluir tópico')
    }
  }

  // Função utilitária para limpar todos os posts de teste criados por terceiros
  const clearFakePosts = async () => {
    if (!user) return
    if (!window.confirm('Deseja apagar todos os tópicos que NÃO foram criados pela sua conta?')) return

    try {
      setLoading(true)
      const fakePosts = posts.filter(p => p.user_id !== user.userId)
      
      for (const p of fakePosts) {
        try {
          await lumi.entities.forum_posts.delete(p._id)
        } catch {}
      }

      toast.success(`${fakePosts.length} tópicos antigos removidos!`)
      await loadForumData()
    } catch {
      toast.error('Erro ao limpar posts')
      setLoading(false)
    }
  }

  const likePost = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      try {
        await lumi.auth.signIn()
      } catch {
        toast.error('Faça login para curtir')
      }
      return
    }

    try {
      const post = posts.find(p => p._id === postId)
      if (!post) return

      const updatedLikes = (post.likes || 0) + 1
      await lumi.entities.forum_posts.update(postId, { likes: updatedLikes })

      setPosts(prev => prev.map(p => 
        p._id === postId ? { ...p, likes: updatedLikes } : p
      ))
    } catch (error) {
      console.error('Erro ao curtir post:', error)
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  const getCategoryLabel = (categoryValue: string) => {
    return categories.find(c => c.value === categoryValue)?.label || categoryValue
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header do Fórum */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 flex items-center space-x-2 tracking-tight">
              <MessageSquare size={24} className="text-red-500" />
              <span>Fórum da Comunidade</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">Converse e compartilhe suas teorias com a comunidade</p>
          </div>

          <div className="flex items-center space-x-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={clearFakePosts}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium px-3 py-2.5 rounded-xl transition-colors cursor-pointer border border-zinc-700/80"
                title="Limpa tópicos que não são seus"
              >
                Limpar Fakes
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowCreatePost(true)}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              <span>Nova Discussão</span>
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-[#121215] border border-zinc-800/80 p-3.5 rounded-xl">
            <span className="text-xs text-zinc-500">Tópicos</span>
            <p className="text-lg font-bold text-zinc-100 mt-0.5">{forumStats.totalPosts}</p>
          </div>
          <div className="bg-[#121215] border border-zinc-800/80 p-3.5 rounded-xl">
            <span className="text-xs text-zinc-500">Membros</span>
            <p className="text-lg font-bold text-zinc-100 mt-0.5">{forumStats.totalUsers}</p>
          </div>
          <div className="bg-[#121215] border border-zinc-800/80 p-3.5 rounded-xl">
            <span className="text-xs text-zinc-500">Hoje</span>
            <p className="text-lg font-bold text-red-500 mt-0.5">+{forumStats.todayPosts}</p>
          </div>
          <div className="bg-[#121215] border border-zinc-800/80 p-3.5 rounded-xl">
            <span className="text-xs text-zinc-500">Ativos</span>
            <p className="text-lg font-bold text-zinc-100 mt-0.5">{forumStats.activeUsers}</p>
          </div>
        </div>

        {/* Categorias */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                selectedCategory === ''
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                  : 'bg-[#121215] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              Todas
            </button>
            {categories.map(category => {
              const Icon = category.icon
              const isSelected = selectedCategory === category.value
              return (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setSelectedCategory(category.value)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-red-600 text-white border border-red-500'
                      : 'bg-[#121215] text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                  }`}
                >
                  <Icon size={14} className={isSelected ? 'text-white' : 'text-zinc-500'} />
                  <span>{category.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Busca e Ordenação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-[#121215] border border-zinc-800/80 p-3 rounded-xl">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar discussões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#18181c] text-zinc-100 text-xs pl-8 pr-3 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#18181c] text-xs text-zinc-300 px-3 py-2 rounded-lg border border-zinc-800 focus:outline-none cursor-pointer"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <span className="text-xs text-zinc-500 hidden sm:inline px-1">
              {filteredPosts.length} tópicos
            </span>
          </div>
        </div>

        {/* Lista de Tópicos */}
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const isOwner = user?.userId === post.user_id
            return (
              <div 
                key={post._id} 
                className="bg-[#121215] border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700 transition-colors relative group"
              >
                <div className="flex items-start space-x-3.5">
                  <img
                    src={post.author?.avatar}
                    alt={post.author?.username}
                    className="w-9 h-9 rounded-lg object-cover border border-zinc-700/80 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center space-x-2 min-w-0">
                        {post.isPinned && <Pin size={13} className="text-red-500 shrink-0" />}
                        {post.isLocked && <Lock size={13} className="text-zinc-500 shrink-0" />}
                        <Link
                          to={`/forum/post/${post._id}`}
                          className="text-sm font-semibold text-zinc-100 hover:text-red-400 transition-colors truncate"
                        >
                          {post.title}
                        </Link>
                      </div>

                      {/* Excluir Post Direto da Lista */}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={(e) => deleteSinglePost(e, post._id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Excluir tópico"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <Link to={`/forum/post/${post._id}`} className="block">
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                        {post.content}
                      </p>
                    </Link>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-3 text-zinc-500">
                        <span className="text-zinc-300 font-medium">{post.author?.username}</span>
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(post.createdAt), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                        <span className="bg-[#18181c] text-zinc-400 px-2 py-0.5 rounded border border-zinc-800 text-[11px]">
                          {getCategoryLabel(post.category)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-zinc-400">
                        <button
                          type="button"
                          onClick={(e) => likePost(e, post._id)}
                          className="flex items-center space-x-1 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Heart size={14} />
                          <span>{post.likes || 0}</span>
                        </button>
                        <Link to={`/forum/post/${post._id}`} className="flex items-center space-x-1 hover:text-zinc-200">
                          <MessageSquare size={14} />
                          <span>{post.commentCount || 0}</span>
                        </Link>
                        <div className="flex items-center space-x-1">
                          <Eye size={14} />
                          <span>{post.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Sem resultados */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-16 bg-[#121215] border border-zinc-800/80 rounded-2xl p-8 mt-4">
            <MessageSquare size={32} className="text-zinc-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300 mb-1">Nenhuma discussão encontrada</h3>
            <p className="text-xs text-zinc-500 mb-4">Crie o primeiro tópico desta categoria!</p>
            <button
              type="button"
              onClick={() => setShowCreatePost(true)}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Criar Tópico
            </button>
          </div>
        )}

        {/* Modal de Criação de Post */}
        <AnimatePresence>
          {showCreatePost && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">Nova Discussão</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreatePost(false)}
                    className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit(createPost)} className="space-y-4">
                  <div>
                    <label className="block text-zinc-400 text-xs mb-1.5 font-medium">Título</label>
                    <input
                      {...register('title', { required: 'Título é obrigatório' })}
                      className="w-full bg-[#18181c] text-zinc-100 text-xs px-3.5 py-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-500"
                      placeholder="Sobre o que você quer falar?"
                    />
                    {errors.title && <p className="text-red-400 text-[11px] mt-1">{errors.title.message}</p>}
                  </div>

                  <div>
                    <label className="block text-zinc-400 text-xs mb-1.5 font-medium">Categoria</label>
                    <select
                      {...register('category', { required: 'Selecione uma categoria' })}
                      className="w-full bg-[#18181c] text-zinc-300 text-xs px-3 py-2.5 rounded-lg border border-zinc-800 focus:outline-none cursor-pointer"
                    >
                      <option value="">Selecione...</option>
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
                      rows={5}
                      className="w-full bg-[#18181c] text-zinc-100 text-xs px-3.5 py-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-500 resize-none"
                      placeholder="Escreva sua mensagem..."
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
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Publicar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreatePost(false)}
                      className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Forum