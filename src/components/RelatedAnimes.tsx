
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, Calendar, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { lumi } from '../lib/lumi'

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

interface RelatedAnimesProps {
  currentAnime: Anime
  limit?: number
}

const RelatedAnimes: React.FC<RelatedAnimesProps> = ({ currentAnime, limit = 6 }) => {
  const [relatedAnimes, setRelatedAnimes] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const findRelatedAnimes = async () => {
      try {
        // Buscar todos os animes
        const { list } = await lumi.entities.animes.list()
        
        // Filtrar animes relacionados baseado em gêneros
        const related = list
          .filter(anime => {
            // Excluir o anime atual
            if (anime._id === currentAnime._id) return false
            
            // Verificar se tem gêneros em comum
            const commonGenres = anime.genre.filter(genre => 
              currentAnime.genre.includes(genre)
            )
            
            return commonGenres.length > 0
          })
          .map(anime => ({
            ...anime,
            // Calcular score de similaridade
            similarity: calculateSimilarity(anime, currentAnime)
          }))
          .sort((a, b) => b.similarity - a.similarity) // Ordenar por similaridade
          .slice(0, limit) // Limitar resultados

        setRelatedAnimes(related)
      } catch (error) {
        console.error('Erro ao buscar animes relacionados:', error)
      } finally {
        setLoading(false)
      }
    }

    findRelatedAnimes()
  }, [currentAnime, limit])

  const calculateSimilarity = (anime: Anime, current: Anime): number => {
    let score = 0
    
    // Gêneros em comum (peso maior)
    const commonGenres = anime.genre.filter(genre => current.genre.includes(genre))
    score += commonGenres.length * 3
    
    // Mesmo estúdio (se disponível)
    if (anime.studio === current.studio) {
      score += 2
    }
    
    // Ano de lançamento próximo
    const yearDiff = Math.abs(anime.releaseYear - current.releaseYear)
    if (yearDiff <= 2) score += 2
    else if (yearDiff <= 5) score += 1
    
    // Rating similar
    const ratingDiff = Math.abs(anime.rating - current.rating)
    if (ratingDiff <= 0.5) score += 2
    else if (ratingDiff <= 1) score += 1
    
    // Mesmo status
    if (anime.status === current.status) {
      score += 1
    }
    
    return score
  }

  if (loading) {
    return (
      <div className="py-8">
        <h3 className="text-2xl font-bold text-white mb-6">Animes Relacionados</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-gray-700 rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-700 rounded mb-1"></div>
              <div className="h-3 bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (relatedAnimes.length === 0) {
    return (
      <div className="py-8">
        <h3 className="text-2xl font-bold text-white mb-6">Animes Relacionados</h3>
        <div className="text-center py-8">
          <p className="text-gray-400">Nenhum anime relacionado encontrado</p>
          <Link 
            to="/catalog" 
            className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
          >
            Explorar catálogo →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Animes Relacionados</h3>
        <Link 
          to="/catalog" 
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          Ver mais →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {relatedAnimes.map((anime, index) => (
          <motion.div
            key={anime._id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <Link to={`/anime/${anime._id}`}>
              <div className="relative overflow-hidden rounded-lg bg-gray-800 transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={anime.imageUrl}
                    alt={anime.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                
                {/* Overlay com informações */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center justify-between text-xs text-white mb-1">
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span>{anime.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{anime.releaseYear}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-300">
                      <Clock className="w-3 h-3" />
                      <span>{anime.episodes} eps</span>
                    </div>
                  </div>
                </div>

                {/* Rating badge */}
                <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-bold flex items-center space-x-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span>{anime.rating}</span>
                </div>
              </div>

              <div className="mt-3">
                <h4 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {anime.title}
                </h4>
                
                {/* Gêneros em comum destacados */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {anime.genre.slice(0, 2).map(genre => (
                    <span
                      key={genre}
                      className={`text-xs px-2 py-1 rounded ${
                        currentAnime.genre.includes(genre)
                          ? 'bg-blue-600/30 text-blue-400 border border-blue-600/50'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Explanation */}
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          💡 Recomendações baseadas em gêneros, estúdio e avaliações similares
        </p>
      </div>
    </div>
  )
}

export default RelatedAnimes
