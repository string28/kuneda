
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Star, Calendar, Clock, Grid, List } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { lumi } from '../lib/lumi'

interface Anime {
  _id: string
  title: string
  synopsis: string
  rating: number
  releaseYear: number
  episodes: number
  imageUrl: string
  genre: string[]
  status: string
  studio: string
}

const Catalog: React.FC = () => {
  const [animes, setAnimes] = useState<Anime[]>([])
  const [filteredAnimes, setFilteredAnimes] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [sortBy, setSortBy] = useState('rating')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const genres = ['Ação', 'Aventura', 'Comédia', 'Drama', 'Fantasia', 'Romance', 'Shounen', 'Seinen', 'Slice of Life', 'Sobrenatural']
  const statuses = ['Em exibição', 'Finalizado', 'Em breve', 'Pausado']

  useEffect(() => {
    const fetchAnimes = async () => {
      try {
        const { list } = await lumi.entities.animes.list()
        setAnimes(list)
        setFilteredAnimes(list)
      } catch (error) {
        console.error('Erro ao carregar animes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnimes()
  }, [])

  useEffect(() => {
    let filtered = animes.filter(anime => {
      const matchesSearch = anime.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGenre = !selectedGenre || anime.genre.includes(selectedGenre)
      const matchesStatus = !selectedStatus || anime.status === selectedStatus
      
      return matchesSearch && matchesGenre && matchesStatus
    })

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'year':
          return b.releaseYear - a.releaseYear
        case 'title':
          return a.title.localeCompare(b.title)
        case 'episodes':
          return b.episodes - a.episodes
        default:
          return 0
      }
    })

    setFilteredAnimes(filtered)
  }, [animes, searchTerm, selectedGenre, selectedStatus, sortBy])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">Catálogo de Animes</h1>
          <p className="text-gray-400">Descubra e explore nossa coleção completa</p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg p-6 mb-8"
        >
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar animes por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Filter size={18} />
              <span>Filtros</span>
            </button>

            {/* Filters */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: showFilters || window.innerWidth >= 1024 ? 'auto' : 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`${showFilters || 'lg:block hidden'} overflow-hidden`}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os gêneros</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os status</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="rating">Melhor avaliado</option>
                    <option value="year">Mais recente</option>
                    <option value="title">A-Z</option>
                    <option value="episodes">Mais episódios</option>
                  </select>

                  <div className="flex bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 flex items-center justify-center py-2 rounded transition-colors ${
                        viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 flex items-center justify-center py-2 rounded transition-colors ${
                        viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-gray-400">
            {filteredAnimes.length} anime{filteredAnimes.length !== 1 ? 's' : ''} encontrado{filteredAnimes.length !== 1 ? 's' : ''}
          </div>
        </motion.div>

        {/* Anime Grid/List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {filteredAnimes.map((anime, index) => (
                <motion.div
                  key={anime._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
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
                      <div className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-bold flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span>{anime.rating}</span>
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-blue-400 transition-colors mb-2">
                          {anime.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{anime.releaseYear}</span>
                          <span>{anime.episodes} eps</span>
                        </div>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            anime.status === 'Em exibição' ? 'bg-green-600' :
                            anime.status === 'Finalizado' ? 'bg-blue-600' :
                            anime.status === 'Em breve' ? 'bg-yellow-600' :
                            'bg-gray-600'
                          } text-white`}>
                            {anime.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnimes.map((anime, index) => (
                <motion.div
                  key={anime._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <Link to={`/anime/${anime._id}`}>
                    <div className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-all duration-300 group-hover:shadow-lg">
                      <div className="flex space-x-4">
                        <div className="w-20 h-28 flex-shrink-0 overflow-hidden rounded">
                          <img
                            src={anime.imageUrl}
                            alt={anime.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white text-lg font-semibold group-hover:text-blue-400 transition-colors mb-2">
                            {anime.title}
                          </h3>
                          <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                            {anime.synopsis}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
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
                              <span>{anime.episodes} episódios</span>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs ${
                              anime.status === 'Em exibição' ? 'bg-green-600' :
                              anime.status === 'Finalizado' ? 'bg-blue-600' :
                              anime.status === 'Em breve' ? 'bg-yellow-600' :
                              'bg-gray-600'
                            } text-white`}>
                              {anime.status}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {anime.genre.slice(0, 3).map(genre => (
                              <span key={genre} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                {genre}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* No Results */}
        {filteredAnimes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-gray-400 text-lg mb-4">Nenhum anime encontrado</div>
            <p className="text-gray-500">Tente ajustar os filtros ou termo de busca</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Catalog
