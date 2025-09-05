
import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, Calendar, Clock, Play, Heart, ArrowLeft, Users, Building } from 'lucide-react'
import { motion } from 'framer-motion'
import { lumi } from '../lib/lumi'
import { useAuth } from '../hooks/useAuth'
import StreamingServices from '../components/StreamingServices'
import RelatedAnimes from '../components/RelatedAnimes'
import toast from 'react-hot-toast'

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
  studio: string
  duration: string
}

const AnimeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuth()
  const [anime, setAnime] = useState<Anime | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    const fetchAnime = async () => {
      if (!id) return

      try {
        const animeData = await lumi.entities.animes.findById(id)
        setAnime(animeData)

        // Verificar se está nos favoritos
        if (isAuthenticated && user) {
          const favorites = await lumi.entities.user_favorites.list({
            filter: {
              user_id: user.userId,
              anime_id: id
            }
          })
          setIsFavorite(favorites.list.length > 0)
        }
      } catch (error) {
        console.error('Erro ao carregar anime:', error)
        toast.error('Erro ao carregar detalhes do anime')
      } finally {
        setLoading(false)
      }
    }

    fetchAnime()
  }, [id, isAuthenticated, user])

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      try {
        await lumi.auth.signIn()
      } catch (error) {
        toast.error('Erro ao fazer login')
      }
      return
    }

    if (!anime || !user) return

    setFavoriteLoading(true)
    try {
      if (isFavorite) {
        // Remover dos favoritos
        const favorites = await lumi.entities.user_favorites.list({
          filter: {
            user_id: user.userId,
            anime_id: anime._id
          }
        })
        
        if (favorites.list.length > 0) {
          await lumi.entities.user_favorites.delete(favorites.list[0]._id)
          setIsFavorite(false)
          toast.success('Removido dos favoritos')
        }
      } else {
        // Adicionar aos favoritos
        await lumi.entities.user_favorites.create({
          user_id: user.userId,
          anime_id: anime._id,
          note: `Adicionado em ${new Date().toLocaleDateString()}`,
          createdAt: new Date().toISOString()
        })
        setIsFavorite(true)
        toast.success('Adicionado aos favoritos!')
      }
    } catch (error) {
      console.error('Erro ao gerenciar favorito:', error)
      toast.error('Erro ao atualizar favoritos')
    } finally {
      setFavoriteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!anime) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Anime não encontrado</h2>
          <Link to="/catalog" className="text-blue-400 hover:text-blue-300">
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative h-96 lg:h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent z-10"></div>
        <img
          src={anime.bannerUrl || anime.imageUrl}
          alt={anime.title}
          className="w-full h-full object-cover"
        />
        
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-4 z-20"
        >
          <Link
            to="/catalog"
            className="flex items-center space-x-2 bg-black/50 text-white px-4 py-2 rounded-lg hover:bg-black/70 transition-colors backdrop-blur-sm"
          >
            <ArrowLeft size={18} />
            <span>Voltar</span>
          </Link>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative -mt-32 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Poster */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:w-80 flex-shrink-0"
            >
              <div className="relative">
                <img
                  src={anime.imageUrl}
                  alt={anime.title}
                  className="w-full rounded-lg shadow-2xl"
                />
                <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1 rounded-lg font-bold flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{anime.rating}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    isFavorite
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  } disabled:opacity-50`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  <span>
                    {favoriteLoading ? 'Carregando...' : isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                  </span>
                </button>

                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2">
                  <Play size={18} />
                  <span>Assistir Agora</span>
                </button>
              </div>

              {/* Streaming Services */}
              <div className="mt-6">
                <StreamingServices animeId={anime._id} />
              </div>
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1"
            >
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">{anime.title}</h1>
              
              {/* Info Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-400 mb-1">
                    <Calendar size={16} />
                    <span className="text-sm">Ano</span>
                  </div>
                  <p className="text-white font-semibold">{anime.releaseYear}</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-400 mb-1">
                    <Clock size={16} />
                    <span className="text-sm">Episódios</span>
                  </div>
                  <p className="text-white font-semibold">{anime.episodes}</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-400 mb-1">
                    <Building size={16} />
                    <span className="text-sm">Estúdio</span>
                  </div>
                  <p className="text-white font-semibold">{anime.studio}</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-400 mb-1">
                    <Users size={16} />
                    <span className="text-sm">Status</span>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                    anime.status === 'Em exibição' ? 'bg-green-600 text-white' :
                    anime.status === 'Finalizado' ? 'bg-blue-600 text-white' :
                    anime.status === 'Em breve' ? 'bg-yellow-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {anime.status}
                  </span>
                </div>
              </div>

              {/* Genres */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Gêneros</h3>
                <div className="flex flex-wrap gap-2">
                  {anime.genre.map(genre => (
                    <span
                      key={genre}
                      className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium border border-blue-600/30"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* Synopsis */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Sinopse</h3>
                <p className="text-gray-300 leading-relaxed text-justify">
                  {anime.synopsis}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Related Animes */}
      <div className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <RelatedAnimes currentAnime={anime} />
        </div>
      </div>
    </div>
  )
}

export default AnimeDetail
