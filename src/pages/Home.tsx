
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {Play, Star, Calendar, Clock, TrendingUp, MessageCircle, Heart, Eye, Users, Award, Flame, ArrowRight} from 'lucide-react'
import { motion } from 'framer-motion'
import { lumi } from '../lib/lumi'
import { useAuth } from '../hooks/useAuth'
import SocialLogin from '../components/SocialLogin'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Anime {
  _id: string
  title: string
  synopsis: string
  rating: number
  releaseYear: number
  episodes: number
  imageUrl: string
  bannerUrl: string
  genre: string[]
  status: string
}

interface ForumPost {
  _id: string
  user_id: string
  title: string
  content: string
  category: string
  likes: number
  views: number
  createdAt: string
  author?: {
    username: string
    avatar: string
  }
  commentCount?: number
}

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [featuredAnimes, setFeaturedAnimes] = useState<Anime[]>([])
  const [topAnimes, setTopAnimes] = useState<Anime[]>([])
  const [latestPosts, setLatestPosts] = useState<ForumPost[]>([])
  const [trendingPosts, setTrendingPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [communityStats, setCommunityStats] = useState({
    totalMembers: 0,
    activeToday: 0,
    totalPosts: 0
  })

  const categories = [
    { value: 'isekai', label: 'Isekais', icon: '🌟', color: 'purple', description: 'Mundos paralelos e aventuras' },
    { value: 'shounen', label: 'Shonen', icon: '⚔️', color: 'red', description: 'Ação e aventura' },
    { value: 'classicos', label: 'Animes Clássicos', icon: '👑', color: 'yellow', description: 'Os eternos favoritos' },
    { value: 'manga', label: 'Mangás', icon: '📚', color: 'blue', description: 'Discussões sobre mangás' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch animes
      const { list: animeList } = await lumi.entities.animes.list()
      setFeaturedAnimes(animeList.slice(0, 3))
      setTopAnimes(animeList.sort((a, b) => b.rating - a.rating).slice(0, 6))

      // Fetch forum posts
      const { list: postList } = await lumi.entities.forum_posts.list()
      
      // Get posts with author info
      const postsWithAuthors = await Promise.all(
        postList.map(async (post) => {
          try {
            const { list: profiles } = await lumi.entities.user_profiles.list({
              filter: { user_id: post.user_id }
            })
            
            const { list: comments } = await lumi.entities.forum_comments.list({
              filter: { post_id: post._id }
            })

            return {
              ...post,
              author: profiles[0] ? {
                username: profiles[0].username,
                avatar: profiles[0].avatar
              } : {
                username: 'Otaku Anônimo',
                avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'
              },
              commentCount: comments.length
            }
          } catch (error) {
            return {
              ...post,
              author: {
                username: 'Otaku Anônimo',
                avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'
              },
              commentCount: 0
            }
          }
        })
      )

      // Latest posts (últimos 5)
      const latest = postsWithAuthors
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
      setLatestPosts(latest)

      // Trending posts (mais populares por engajamento)
      const trending = postsWithAuthors
        .sort((a, b) => (b.likes + b.views + (b.commentCount || 0)) - (a.likes + a.views + (a.commentCount || 0)))
        .slice(0, 4)
      setTrendingPosts(trending)

      // Community stats
      const { list: profiles } = await lumi.entities.user_profiles.list()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      setCommunityStats({
        totalMembers: profiles.length,
        activeToday: profiles.filter(p => p.isActive).length,
        totalPosts: postList.length
      })

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando a comunidade otaku...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-purple-900/90 to-pink-900/90 z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105"
          style={{
            backgroundImage: `url(${featuredAnimes[0]?.bannerUrl || 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg'})`
          }}
        ></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-20 text-center text-white max-w-6xl mx-auto px-4"
        >
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            Kuneda Animes
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-xl md:text-2xl mb-8 text-gray-200 max-w-3xl mx-auto"
          >
            A maior comunidade otaku do Brasil. Descubra, discuta e compartilhe sua paixão pelos animes com milhares de fãs.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link
              to="/catalog"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg"
            >
              <Play size={20} />
              <span>Explorar Catálogo</span>
            </Link>
            <Link
              to="/forum"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105 shadow-lg"
            >
              <MessageCircle size={20} />
              <span>Entrar no Fórum</span>
            </Link>
            {!isAuthenticated && (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Juntar-se à Comunidade
              </button>
            )}
          </motion.div>

          {/* Community Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="grid grid-cols-3 gap-8 max-w-md mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{communityStats.totalMembers}+</div>
              <div className="text-sm text-gray-300">Otakus</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{communityStats.activeToday}</div>
              <div className="text-sm text-gray-300">Online Hoje</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400">{communityStats.totalPosts}+</div>
              <div className="text-sm text-gray-300">Discussões</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Trending Discussions Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Flame className="text-orange-400" size={32} />
              <h2 className="text-4xl font-bold text-white">Discussões em Alta</h2>
              <Flame className="text-orange-400" size={32} />
            </div>
            <p className="text-gray-400 text-lg">Os tópicos mais quentes da comunidade otaku</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {trendingPosts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <Link to={`/forum/post/${post._id}`}>
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                    <div className="flex items-start space-x-4">
                      <img
                        src={post.author?.avatar}
                        alt={post.author?.username}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-500/30"
                      />
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {post.content}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="font-medium text-orange-400">{post.author?.username}</span>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Heart size={12} className="text-red-400" />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle size={12} className="text-blue-400" />
                              <span>{post.commentCount}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye size={12} className="text-gray-400" />
                              <span>{post.views}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/forum"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              <span>Ver Todas as Discussões</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Forum Categories */}
      <section className="py-16 px-4 bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Categorias do Fórum</h2>
            <p className="text-gray-400 text-lg">Encontre discussões sobre seus gêneros favoritos</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.value}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <Link to={`/forum?category=${category.value}`}>
                  <div className={`bg-gradient-to-br from-${category.color}-600/20 to-${category.color}-800/20 border border-${category.color}-600/30 rounded-xl p-6 text-center hover:border-${category.color}-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl`}>
                    <div className="text-4xl mb-4">{category.icon}</div>
                    <h3 className={`text-${category.color}-400 font-bold text-lg mb-2`}>
                      {category.label}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {category.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Forum Posts */}
      <section className="py-16 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-12"
          >
            <div>
              <h2 className="text-4xl font-bold text-white mb-4 flex items-center space-x-3">
                <Clock className="text-blue-400" />
                <span>Últimas Discussões</span>
              </h2>
              <p className="text-gray-400 text-lg">As conversas mais recentes da comunidade</p>
            </div>
            <Link
              to="/forum"
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center space-x-2"
            >
              <span>Ver todos os tópicos</span>
              <ArrowRight size={18} />
            </Link>
          </motion.div>

          <div className="space-y-4">
            {latestPosts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <Link to={`/forum/post/${post._id}`}>
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 hover:border-blue-600/50 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      <img
                        src={post.author?.avatar}
                        alt={post.author?.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors truncate">
                            {post.title}
                          </h3>
                          <span className={`bg-${categories.find(c => c.value === post.category)?.color || 'gray'}-600/20 text-${categories.find(c => c.value === post.category)?.color || 'gray'}-400 px-2 py-1 rounded text-xs`}>
                            {categories.find(c => c.value === post.category)?.icon}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="font-medium">{post.author?.username}</span>
                          <span>
                            {formatDistanceToNow(new Date(post.createdAt), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <Heart size={12} />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle size={12} />
                              <span>{post.commentCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Animes */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Animes em Destaque</h2>
            <p className="text-gray-400 text-lg">Os títulos mais comentados pela comunidade</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredAnimes.map((anime, index) => (
              <motion.div
                key={anime._id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="group"
              >
                <Link to={`/anime/${anime._id}`}>
                  <div className="relative overflow-hidden rounded-xl bg-gray-800 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl">
                    <div className="aspect-[3/4] overflow-hidden">
                      <img
                        src={anime.imageUrl}
                        alt={anime.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-white text-xl font-bold mb-2">{anime.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{anime.rating}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{anime.releaseYear}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{anime.episodes} eps</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      {!isAuthenticated && (
        <section className="py-16 px-4 bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Pronto para se Juntar à Nossa Comunidade?
              </h2>
              <p className="text-xl text-gray-200 mb-8">
                Conecte-se com milhares de otakus, compartilhe suas opiniões e descubra novos animes incríveis.
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-white text-gray-900 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl"
              >
                Criar Conta Grátis
              </button>
            </motion.div>
          </div>
        </section>
      )}

      {/* Social Login Modal */}
      {showLoginModal && (
        <SocialLogin onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  )
}

export default Home
