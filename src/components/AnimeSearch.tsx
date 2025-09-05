
import React, { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Loader, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { animeApiService, ExternalAnime } from '../services/animeApi'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface AnimeSearchProps {
  onAnimeSelect?: (anime: any) => void
  showAddToDatabase?: boolean
}

const AnimeSearch: React.FC<AnimeSearchProps> = ({ onAnimeSelect, showAddToDatabase = false }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ExternalAnime[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedGenre, setSelectedGenre] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const genres = [
    { id: 1, name: 'Ação' },
    { id: 2, name: 'Aventura' },
    { id: 4, name: 'Comédia' },
    { id: 8, name: 'Drama' },
    { id: 10, name: 'Fantasia' },
    { id: 22, name: 'Romance' },
    { id: 27, name: 'Shounen' }
  ]

  const searchAnimes = useCallback(async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await animeApiService.searchAnimes(searchQuery, page)
      setResults(response.data)
      setTotalPages(response.pagination.last_visible_page)
      setCurrentPage(page)
    } catch (error) {
      console.error('Erro na busca:', error)
      toast.error('Erro ao buscar animes. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  const searchByGenre = useCallback(async (genreId: number, page: number = 1) => {
    setLoading(true)
    try {
      const response = await animeApiService.getAnimesByGenre(genreId, page)
      setResults(response.data)
      setTotalPages(response.pagination.last_visible_page)
      setCurrentPage(page)
    } catch (error) {
      console.error('Erro na busca por gênero:', error)
      toast.error('Erro ao buscar animes por gênero.')
    } finally {
      setLoading(false)
    }
  }, [])

  const addToDatabase = async (externalAnime: ExternalAnime) => {
    try {
      const mappedAnime = animeApiService.mapExternalToInternal(externalAnime)
      await lumi.entities.animes.create({
        ...mappedAnime,
        creator: 'api_import',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      toast.success(`${mappedAnime.title} adicionado ao banco de dados!`)
    } catch (error) {
      console.error('Erro ao adicionar anime:', error)
      toast.error('Erro ao adicionar anime ao banco de dados.')
    }
  }

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim()) {
        searchAnimes(query)
      }
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [query, searchAnimes])

  useEffect(() => {
    if (selectedGenre) {
      const genre = genres.find(g => g.name === selectedGenre)
      if (genre) {
        searchByGenre(genre.id)
      }
    }
  }, [selectedGenre, searchByGenre])

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Busca de Animes</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
        >
          <Filter size={18} />
          <span>Filtros</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar animes em tempo real..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-gray-700 text-white pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os gêneros</option>
                {genres.map(genre => (
                  <option key={genre.id} value={genre.name}>{genre.name}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setQuery('')
                  setSelectedGenre('')
                  setResults([])
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader className="animate-spin text-blue-500" size={32} />
        </div>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((anime) => (
          <motion.div
            key={anime.mal_id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition-colors"
          >
            <div className="aspect-[3/4] overflow-hidden">
              <img
                src={anime.images.jpg.large_image_url}
                alt={anime.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-white font-semibold mb-2 line-clamp-2">
                {anime.title}
              </h3>
              <div className="flex items-center justify-between text-sm text-gray-300 mb-3">
                <span>⭐ {anime.score || 'N/A'}</span>
                <span>{anime.year || 'N/A'}</span>
                <span>{anime.episodes || '?'} eps</span>
              </div>
              <div className="flex gap-2">
                {onAnimeSelect && (
                  <button
                    onClick={() => onAnimeSelect(animeApiService.mapExternalToInternal(anime))}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Selecionar
                  </button>
                )}
                {showAddToDatabase && (
                  <button
                    onClick={() => addToDatabase(anime)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors"
                  >
                    Adicionar
                  </button>
                )}
                <a
                  href={`https://myanimelist.net/anime/${anime.mal_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => searchAnimes(query, currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-white px-4 py-2">
            {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => searchAnimes(query, currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Próximo
          </button>
        </div>
      )}
    </div>
  )
}

export default AnimeSearch
