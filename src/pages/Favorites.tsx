
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2, Calendar, Star, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { lumi } from '../lib/lumi'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

interface Favorite {
  _id: string
  user_id: string
  anime_id: string
  note: string
  createdAt: string
}

interface Anime {
  _id: string
  title: string
  rating: number
  releaseYear: number
  episodes: number
  imageUrl: string
  genre: string[]
  status: string
}

const Favorites: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [animes, setAnimes] = useState<Record<string, Anime>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false)
        return
      }

      try {
        // Buscar favoritos do usuário
        const { list: userFavorites } = await lumi.entities.user_favorites.list({
          filter: { user_id: user.userId }
        })
        
        setFavorites(userFavorites)

        // Buscar informações dos animes
        if (userFavorites.length > 0) {
          const animePromises = userFavorites.map(fav => 
            lumi.entities.animes.findById(fav.anime_id).catch(() => null)
          )
          
          const animeResults = await Promise.all(animePromises)
          const animeMap: Record<string, Anime> = {}
          
          animeResults.forEach((anime, index) => {
            if (anime) {
              animeMap[userFavorites[index].anime_id] = anime
            }
          })
          
          setAnimes(animeMap)
        }
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error)
        toast.error('Erro ao carregar favoritos')
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [isAuthenticated, user])

  const removeFavorite = async (favoriteId: string, animeTitle: string) => {
    try {
      await lumi.entities.user_favorites.delete(favoriteId)
      setFavorites(prev => prev.filter(fav => fav._id !== favoriteId))
      toast.success(`${animeTitle} removido dos favoritos`)
    } catch (error) {
      console.error('Erro ao remover favorito:', error)
      toast.error('Erro ao remover favorito')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">Faça login para ver seus favoritos</h2>
          <p className="text-gray-400 mb-8">Crie sua lista personalizada de animes favoritos</p>
          <button
            onClick={() => lumi.auth.signIn()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Fazer Login
          </button>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Heart className="w-8 h-8 text-red-500 fill-current" />
            <h1 className="text-4xl font-bold text-white">Meus Favoritos</h1>
          </div>
          <p className="text-gray-400 text-lg">
            {favorites.length} anime{favorites.length !== 1 ? 's' : ''} na sua lista de favoritos
          </p>
        </motion.div>

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Heart className="w-24 h-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Sua lista está vazia</h2>
            <p className="text-gray-400 mb-8">Comece adicionando seus animes favoritos!</p>
            <Link
              to="/catalog"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-block"
            >
              Explorar Catálogo
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((favorite, index) => {
              const anime = animes[favorite.anime_id]
              
              if (!anime) {
                return (
                  <motion.div
                    key={favorite._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-800 rounded-lg p-4"
                  >
                    <div className="text-gray-400 text-center">
                      Anime não encontrado
                      <button
                        onClick={() => removeFavorite(favorite._id, 'Anime desconhecido')}
                        className="block mx-auto mt-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                )
              }

              return (
                <motion.div
                  key={favorite._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-gray-800 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <Link to={`/anime/${anime._id}`}>
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={anime.imageUrl}
                        alt={anime.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-bold flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span>{anime.rating}</span>
                      </div>
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    <Link to={`/anime/${anime._id}`}>
                      <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {anime.title}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{anime.releaseYear}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{anime.episodes} eps</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {anime.genre.slice(0, 2).map(genre => (
                        <span key={genre} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                          {genre}
                        </span>
                      ))}
                    </div>

                    {favorite.note && (
                      <div className="bg-gray-700 rounded p-2 mb-3">
                        <p className="text-gray-300 text-xs italic">"{favorite.note}"</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Favoritado em {new Date(favorite.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => removeFavorite(favorite._id, anime.title)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Remover dos favoritos"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Favorites
