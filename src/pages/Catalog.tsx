import React, { useEffect, useState, useCallback } from 'react'
import {
  Search,
  SlidersHorizontal,
  Compass,
  LayoutGrid,
  Rows3,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

// Componentes de Logo das Plataformas
const CrunchyrollLogo: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.6 15.6c-2.8 0-5.1-2.3-5.1-5.1s2.3-5.1 5.1-5.1c1.2 0 2.3.4 3.1 1.1-.3.5-.5 1.1-.5 1.7 0 1.9 1.5 3.4 3.4 3.4.4 0 .8-.1 1.2-.2-.8 2.5-3.2 4.2-7.2 4.2z" />
  </svg>
)

const NetflixLogo: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4 2v20l5.5-2.5V7.5L14.5 22H20V2l-5.5 2.5v12L9.5 2H4z" />
  </svg>
)

const PrimeVideoLogo: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13.7 13.5c-.8.8-1.9 1.3-3.2 1.3-2.1 0-3.6-1.4-3.6-3.4 0-2.3 1.8-3.7 4.2-3.7.9 0 1.9.2 2.6.5v5.3zm2.5-7.4c-.9-.4-2.3-.7-3.9-.7-3.7 0-6.7 2.1-6.7 5.9 0 3.3 2.3 5.4 5.7 5.4 1.5 0 2.9-.4 3.9-1.1l-.3 1c-.1.3 0 .5.3.5h1.9c.2 0 .4-.2.4-.4V5.7c0-.2-.1-.4-.3-.4l-1-.2zm3.6 12.8c-4.2 2.3-9.5 2.3-13.8-.4-.3-.2-.5-.1-.4.2.8 1.4 6 3.6 14.1 1.1.5-.1.5-.7.1-.9zm1.3-.9c-.2-.3-1.4-.4-2.8-.2-.3 0-.3.4 0 .6 1 .5 2.5.4 2.8 0 .1-.2.1-.3 0-.4z" />
  </svg>
)

interface AnimeItem {
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
  streamings: Array<{
    name: 'Crunchyroll' | 'Netflix' | 'Prime Video'
    url: string
    color: string
  }>
}

const Catalog: React.FC = () => {
  const [animes, setAnimes] = useState<AnimeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedOrderBy, setSelectedOrderBy] = useState<'SCORE_DESC' | 'POPULARITY_DESC' | 'EPISODES_DESC' | 'START_DATE_DESC'>('SCORE_DESC')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(50)

  const genres = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Romance',
    'Sci-Fi', 'Slice of Life', 'Supernatural', 'Mecha', 'Horror',
    'Mystery', 'Sports', 'Music', 'Psychological', 'Thriller'
  ]

  const getStreamingPlatforms = (title: string, genresList: string[]) => {
    const encodedTitle = encodeURIComponent(title)
    const platforms: AnimeItem['streamings'] = [
      {
        name: 'Crunchyroll',
        url: `https://www.crunchyroll.com/pt-br/search?q=${encodedTitle}`,
        color: 'bg-[#ff640a]/15 text-[#ff640a] border-[#ff640a]/30 hover:bg-[#ff640a] hover:text-white'
      },
      {
        name: 'Netflix',
        url: `https://www.netflix.com/search?q=${encodedTitle}`,
        color: 'bg-[#e50914]/15 text-[#e50914] border-[#e50914]/30 hover:bg-[#e50914] hover:text-white'
      }
    ]

    if (genresList.includes('Sci-Fi') || genresList.includes('Psychological')) {
      platforms.push({
        name: 'Prime Video',
        url: `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodedTitle}`,
        color: 'bg-[#00a8e1]/15 text-[#00a8e1] border-[#00a8e1]/30 hover:bg-[#00a8e1] hover:text-white'
      })
    }

    return platforms
  }

  const renderPlatformLogo = (name: string) => {
    switch (name) {
      case 'Crunchyroll':
        return <CrunchyrollLogo className="w-3 h-3 shrink-0" />
      case 'Netflix':
        return <NetflixLogo className="w-3 h-3 shrink-0" />
      case 'Prime Video':
        return <PrimeVideoLogo className="w-3.5 h-3.5 shrink-0" />
      default:
        return null
    }
  }

  const fetchAnimes = useCallback(async () => {
    try {
      setLoading(true)

      const query = `
        query ($page: Int, $perPage: Int, $search: String, $genre: String, $sort: [MediaSort]) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              total
              lastPage
            }
            media(type: ANIME, isAdult: false, search: $search, genre: $genre, sort: $sort) {
              id
              title {
                romaji
                english
              }
              coverImage {
                extraLarge
                large
              }
              bannerImage
              averageScore
              startDate {
                year
              }
              episodes
              genres
              status
              studios(isMain: true) {
                nodes {
                  name
                }
              }
              description(asHtml: false)
            }
          }
        }
      `

      const variables: Record<string, any> = {
        page: currentPage,
        perPage: 24,
        sort: [selectedOrderBy]
      }

      if (searchTerm.trim()) {
        variables.search = searchTerm.trim()
      }

      if (selectedGenre) {
        variables.genre = selectedGenre
      }

      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables })
      })

      const result = await response.json()
      const mediaList = result?.data?.Page?.media || []

      const formatted: AnimeItem[] = mediaList.map((item: any) => {
        const title = item.title?.english || item.title?.romaji || 'Anime'
        const score = item.averageScore ? (item.averageScore / 10).toFixed(1) : '8.0'
        const genreList = item.genres || ['Anime']

        return {
          _id: String(item.id),
          title,
          synopsis: item.description?.replace(/<[^>]*>?/gm, '') || 'Sinopse não disponível.',
          rating: parseFloat(score),
          releaseYear: item.startDate?.year || 2024,
          episodes: item.episodes || 12,
          imageUrl: item.coverImage?.extraLarge || item.coverImage?.large,
          genre: genreList,
          status: item.status === 'RELEASING' ? 'Em exibição' : 'Finalizado',
          studio: item.studios?.nodes?.[0]?.name || 'Studio',
          streamings: getStreamingPlatforms(title, genreList)
        }
      })

      setAnimes(formatted)
      if (result?.data?.Page?.pageInfo?.lastPage) {
        setTotalPages(Math.min(result.data.Page.pageInfo.lastPage, 200))
      }
    } catch (error) {
      console.error('Erro ao buscar da AniList:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, selectedGenre, selectedOrderBy, searchTerm])

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAnimes()
    }, 350)

    return () => clearTimeout(delayDebounceFn)
  }, [fetchAnimes])

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 flex items-center space-x-2.5 tracking-tight">
              <Compass size={24} className="text-red-500" />
              <span>Catálogo Global</span>
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden bg-[#121215] border border-zinc-800 text-xs font-medium text-zinc-300 px-3 py-2 rounded-lg flex items-center space-x-1.5 cursor-pointer"
            >
              <SlidersHorizontal size={14} className="text-red-500" />
              <span>Filtros</span>
            </button>

            <div className="flex border border-zinc-800 rounded-lg p-0.5 bg-[#121215]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded cursor-pointer transition-colors ${
                  viewMode === 'grid' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded cursor-pointer transition-colors ${
                  viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Rows3 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-4 mb-6">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por qualquer anime (ex: Jujutsu Kaisen, Bleach, Frieren, Chainsaw Man)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-[#18181c] text-zinc-100 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${showFilters ? 'block' : 'hidden lg:grid'}`}>
            <select
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-[#18181c] text-zinc-300 text-xs px-3 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="">Todos os Gêneros</option>
              {genres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <select
              value={selectedOrderBy}
              onChange={(e) => {
                setSelectedOrderBy(e.target.value as any)
                setCurrentPage(1)
              }}
              className="bg-[#18181c] text-zinc-300 text-xs px-3 py-2 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="SCORE_DESC">Melhor Avaliados</option>
              <option value="POPULARITY_DESC">Mais Populares</option>
              <option value="START_DATE_DESC">Lançamentos Recentes</option>
              <option value="EPISODES_DESC">Mais Episódios</option>
            </select>
          </div>
        </div>

        {/* Lista de Animes */}
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {animes.map((anime) => (
                  <div
                    key={anime._id}
                    className="bg-[#121215] border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col justify-between group hover:border-zinc-700 transition-colors"
                  >
                    <div>
                      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900">
                        <img
                          src={anime.imageUrl}
                          alt={anime.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent opacity-80" />

                        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[11px] font-semibold text-red-400 border border-zinc-800">
                          ★ {anime.rating}
                        </div>

                        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                          {anime.genre.slice(0, 2).map((g) => (
                            <span key={g} className="bg-black/70 text-zinc-300 px-1.5 py-0.5 rounded text-[9px] border border-zinc-800">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3">
                        <h3 className="text-xs font-semibold text-zinc-100 truncate mb-1" title={anime.title}>
                          {anime.title}
                        </h3>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-2.5">
                          <span>{anime.releaseYear}</span>
                          <span>{anime.episodes} eps</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 pt-0 border-t border-zinc-800/60 mt-1">
                      <span className="block text-[9px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                        Onde Assistir:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {anime.streamings?.map((str) => (
                          <a
                            key={str.name}
                            href={str.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors flex items-center space-x-1.5 ${str.color}`}
                          >
                            {renderPlatformLogo(str.name)}
                            <span>{str.name}</span>
                            <ExternalLink size={9} className="shrink-0 opacity-70" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {animes.map((anime) => (
                  <div
                    key={anime._id}
                    className="bg-[#121215] border border-zinc-800/80 rounded-xl p-3 hover:border-zinc-700 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={anime.imageUrl}
                        alt={anime.title}
                        className="w-12 h-16 rounded-lg object-cover border border-zinc-800 shrink-0"
                        loading="lazy"
                      />
                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-zinc-100 truncate mb-1">
                          {anime.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 mb-1">
                          <span className="text-red-400 font-medium">★ {anime.rating}</span>
                          <span>•</span>
                          <span>{anime.releaseYear}</span>
                          <span>•</span>
                          <span>{anime.episodes} eps</span>
                          <span>•</span>
                          <span>{anime.studio}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {anime.genre.map(g => (
                            <span key={g} className="bg-[#18181c] text-zinc-400 px-1.5 py-0.5 rounded text-[10px] border border-zinc-800">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex flex-col sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                        Disponível em:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {anime.streamings?.map((str) => (
                          <a
                            key={str.name}
                            href={str.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs font-medium px-2.5 py-1 rounded-md border transition-colors flex items-center space-x-1.5 ${str.color}`}
                          >
                            {renderPlatformLogo(str.name)}
                            <span>{str.name}</span>
                            <ExternalLink size={11} className="shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginação */}
            <div className="flex items-center justify-center space-x-2 mt-8">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-[#121215] border border-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-zinc-400 px-3 py-2 bg-[#121215] border border-zinc-800 rounded-lg">
                Página <strong className="text-zinc-100">{currentPage}</strong> de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-[#121215] border border-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Catalog