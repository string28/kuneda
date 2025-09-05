
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {MessageCircle, Heart, Eye, Clock, Plus, Filter, Search, Pin, Lock, Star, ThumbsUp, Award, TrendingUp, Users, MessageSquare, X} from 'lucide-react'
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
  isPinned: boolean
  isLocked: boolean
  tags: string[]
  createdAt: string
  author?: {
    username: string
    avatar: string
  }
  commentCount?: number
  lastActivity?: string
}

interface CreatePostData {
  title: string
  content: string
  category: string
  tags: string[]
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

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreatePostData>()

  const categories = [
    { value: 'discussao', label: 'Discussão Geral', icon: '💬', color: 'blue' },
    { value: 'isekai', label: 'Isekais', icon: '🌟', color: 'purple' },
    { value: 'shounen', label: 'Shonen', icon: '⚔️', color: 'red' },
    { value: 'classicos', label: 'Animes Clássicos', icon: '👑', color: 'yellow' },
    { value: 'manga', label: 'Mangás', icon: '📚', color: 'blue' },
    { value: 'recomendacao', label: 'Recomendações', icon: '⭐', color: 'green' },
    { value: 'duvida', label: 'Dúvidas', icon: '❓', color: 'pink' },
    { value: 'noticia', label: 'Notícias', icon: '📰', color: 'indigo' },
    { value: 'review', label: 'Reviews', icon: '📝', color: 'orange' },
    { value: 'evento', label: 'Eventos', icon: '🎉', color: 'teal' }
  ]

  const sortOptions = [
    { value: 'recent', label: 'Mais Recentes', icon: Clock },
    { value: 'popular', label: 'Mais Populares', icon: TrendingUp },
    { value: 'likes', label: 'Mais Curtidos', icon: Heart },
    { value: 'views', label: 'Mais Visualizados', icon: Eye },
    { value: 'comments', label: 'Mais Comentados', icon: MessageCircle }
  ]

  useEffect(() => {
    fetchPosts()
    fetchForumStats()
  }, [selectedCategory, sortBy])

  const fetchForumStats = async () => {
    try {
      const { list: allPosts } = await lumi.entities.forum_posts.list()
      const { list: allProfiles } = await lumi.entities.user_profiles.list()
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayPosts = allPosts.filter(post => 
        new Date(post.createdAt) >= today
      ).length

      setForumStats({
        totalPosts: allPosts.length,
        totalUsers: allProfiles.length,
        todayPosts,
        activeUsers: allProfiles.filter(profile => profile.isActive).length
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      
      let filter: any = {}
      if (selectedCategory) {
        filter.category = selectedCategory
      }

      const { list } = await lumi.entities.forum_posts.list({ filter })
      
      const postsWithAuthors = await Promise.all(
        list.map(async (post) => {
          try {
            const { list: profiles } = await lumi.entities.user_profiles.list({
              filter: { user_id: post.user_id }
            })
            
            const profile = profiles[0]
            
            const { list: comments } = await lumi.entities.forum_comments.list({
              filter: { post_id: post._id }
            })

            const lastComment = comments.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0]

            return {
              ...post,
              author: profile ? {
                username: profile.username,
                avatar: profile.avatar
              } : {
                username: 'Otaku Anônimo',
                avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'
              },
              commentCount: comments.length,
              lastActivity: lastComment ? lastComment.createdAt : post.createdAt
            }
          } catch (error) {
            return {
              ...post,
              author: {
                username: 'Otaku Anônimo',
                avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'
              },
              commentCount: 0,
              lastActivity: post.createdAt
            }
          }
        })
      )

      const sortedPosts = postsWithAuthors.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1

        switch (sortBy) {
          case 'popular':
            return (b.likes + b.views + (b.commentCount || 0)) - (a.likes + a.views + (a.commentCount || 0))
          case 'likes':
            return b.likes - a.likes
          case 'views':
            return b.views - a.views
          case 'comments':
            return (b.commentCount || 0) - (a.commentCount || 0)
          default:
            return new Date(b.lastActivity || b.createdAt).getTime() - new Date(a.lastActivity || a.createdAt).getTime()
        }
      })

      setPosts(sortedPosts)
    } catch (error) {
      console.error('Erro ao carregar posts:', error)
      toast.error('Erro ao carregar posts do fórum')
    } finally {
      setLoading(false)
    }
  }

  const createPost = async (data: CreatePostData) => {
    if (!isAuthenticated || !user) {
      try {
        await lumi.auth.signIn()
      } catch (error) {
        toast.error('Erro ao fazer login')
      }
      return
    }

    try {
      const postData = {
        user_id: user.userId,
        title: data.title,
        content: data.content,
        category: data.category,
        tags: data.tags,
        likes: 0,
        views: 0,
        isPinned: false,
        isLocked: false,
        createdAt: new Date().toISOString(),
        creator: user.userId
      }

      await lumi.entities.forum_posts.create(postData)
      
      reset()
      setShowCreatePost(false)
      fetchPosts()
      fetchForumStats()
      toast.success('Post criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar post:', error)
      toast.error('Erro ao criar post')
    }
  }

  const likePost = async (postId: string) => {
    if (!isAuthenticated) {
      try {
        await lumi.auth.signIn()
      } catch (error) {
        toast.error('Erro ao fazer login')
      }
      return
    }

    try {
      const post = posts.find(p => p._id === postId)
      if (!post) return

      await lumi.entities.forum_posts.update(postId, {
        likes: post.likes + 1
      })

      setPosts(prev => prev.map(p => 
        p._id === postId ? { ...p, likes: p.likes + 1 } : p
      ))

      toast.success('Post curtido!')
    } catch (error) {
      console.error('Erro ao curtir post:', error)
      toast.error('Erro ao curtir post')
    }
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.value === category)
    return cat?.color || 'gray'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-700 rounded w-1/3"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
            <div className="h-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center space-x-3">
                <MessageSquare className="text-blue-400" />
                <span>Fórum Kuneda</span>
              </h1>
              <p className="text-gray-400">Conecte-se com a comunidade otaku mais apaixonada do Brasil</p>
            </div>
            <button
              onClick={() => setShowCreatePost(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg transform hover:scale-105"
            >
              <Plus size={18} />
              <span>Nova Discussão</span>
            </button>
          </div>

          {/* Forum Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border border-blue-600/30 rounded-lg p-4"
            >
              <div className="flex items-center space-x-3">
                <MessageSquare className="text-blue-400" size={24} />
                <div>
                  <div className="text-2xl font-bold text-white">{forumStats.totalPosts}</div>
                  <div className="text-blue-400 text-sm">Total de Posts</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-green-600/20 to-green-800/20 border border-green-600/30 rounded-lg p-4"
            >
              <div className="flex items-center space-x-3">
                <Users className="text-green-400" size={24} />
                <div>
                  <div className="text-2xl font-bold text-white">{forumStats.totalUsers}</div>
                  <div className="text-green-400 text-sm">Otakus</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-600/30 rounded-lg p-4"
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className="text-purple-400" size={24} />
                <div>
                  <div className="text-2xl font-bold text-white">{forumStats.todayPosts}</div>
                  <div className="text-purple-400 text-sm">Posts Hoje</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 border border-yellow-600/30 rounded-lg p-4"
            >
              <div className="flex items-center space-x-3">
                <Award className="text-yellow-400" size={24} />
                <div>
                  <div className="text-2xl font-bold text-white">{forumStats.activeUsers}</div>
                  <div className="text-yellow-400 text-sm">Online</div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Categorias Temáticas</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
            <button
              onClick={() => setSelectedCategory('')}
              className={`p-3 rounded-lg text-center transition-all duration-200 ${
                selectedCategory === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="text-lg mb-1">🌟</div>
              <div className="text-xs font-medium">Todas</div>
            </button>
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`p-3 rounded-lg text-center transition-all duration-200 ${
                  selectedCategory === category.value 
                    ? `bg-${category.color}-600 text-white` 
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="text-lg mb-1">{category.icon}</div>
                <div className="text-xs font-medium truncate">{category.label}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700"
        >
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar discussões, tópicos, usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-gray-400 px-4 py-2">
                {filteredPosts.length} discussão{filteredPosts.length !== 1 ? 'ões' : ''} encontrada{filteredPosts.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Posts List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:bg-gray-750 transition-all duration-200 hover:border-gray-600 hover:shadow-lg">
                <div className="flex items-start space-x-4">
                  <img
                    src={post.author?.avatar}
                    alt={post.author?.username}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-600"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      {post.isPinned && (
                        <Pin className="text-yellow-400" size={16} />
                      )}
                      {post.isLocked && (
                        <Lock className="text-red-400" size={16} />
                      )}
                      <Link
                        to={`/forum/post/${post._id}`}
                        className="text-white text-lg font-semibold hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {post.title}
                      </Link>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                      <span className="font-medium text-gray-300">{post.author?.username}</span>
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>
                          {formatDistanceToNow(new Date(post.createdAt), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                      </div>
                      <span className={`bg-${getCategoryColor(post.category)}-600/20 text-${getCategoryColor(post.category)}-400 px-2 py-1 rounded text-xs border border-${getCategoryColor(post.category)}-600/30`}>
                        {categories.find(c => c.value === post.category)?.icon} {categories.find(c => c.value === post.category)?.label}
                      </span>
                    </div>

                    <p className="text-gray-300 mb-4 line-clamp-2">
                      {post.content}
                    </p>

                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map(tag => (
                          <span
                            key={tag}
                            className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs border border-gray-600"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6 text-sm text-gray-400">
                        <button
                          onClick={() => likePost(post._id)}
                          className="flex items-center space-x-1 hover:text-red-400 transition-colors group"
                        >
                          <Heart size={16} className="group-hover:scale-110 transition-transform" />
                          <span>{post.likes}</span>
                        </button>

                        <div className="flex items-center space-x-1">
                          <MessageCircle size={16} />
                          <span>{post.commentCount || 0}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Eye size={16} />
                          <span>{post.views}</span>
                        </div>
                      </div>

                      {post.lastActivity && post.lastActivity !== post.createdAt && (
                        <div className="text-xs text-gray-500">
                          Última atividade: {formatDistanceToNow(new Date(post.lastActivity), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* No Results */}
        {filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🔍</div>
            <div className="text-gray-400 text-lg mb-4">Nenhuma discussão encontrada</div>
            <p className="text-gray-500 mb-6">Seja o primeiro a iniciar uma conversa sobre este tópico!</p>
            <button
              onClick={() => setShowCreatePost(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              Criar Primeira Discussão
            </button>
          </motion.div>
        )}

        {/* Create Post Modal */}
        <AnimatePresence>
          {showCreatePost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Criar Nova Discussão</h3>
                  <button
                    onClick={() => setShowCreatePost(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit(createPost)} className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Título da Discussão
                    </label>
                    <input
                      {...register('title', { required: 'Título é obrigatório' })}
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
                      placeholder="Ex: Qual anime vocês estão assistindo esta temporada?"
                    />
                    {errors.title && (
                      <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Categoria
                    </label>
                    <select
                      {...register('category', { required: 'Categoria é obrigatória' })}
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.icon} {category.label}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Conteúdo
                    </label>
                    <textarea
                      {...register('content', { required: 'Conteúdo é obrigatório' })}
                      rows={6}
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
                      placeholder="Compartilhe suas ideias, perguntas ou opiniões..."
                    />
                    {errors.content && (
                      <p className="text-red-400 text-sm mt-1">{errors.content.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Tags (separadas por vírgula)
                    </label>
                    <input
                      {...register('tags')}
                      className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
                      placeholder="Ex: naruto, shounen, ação"
                      onChange={(e) => {
                        const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                        setValue('tags', tags)
                      }}
                    />
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 rounded-lg font-semibold transition-all duration-200"
                    >
                      Publicar Discussão
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreatePost(false)}
                      className="px-6 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Forum
