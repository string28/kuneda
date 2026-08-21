import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Play,
  Flame,
  ArrowRight,
  Sparkles,
  Swords,
  BookOpen,
  Crown,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Layers,
  Radio,
  ExternalLink
} from 'lucide-react'
import { lumi } from '../lib/lumi'
import { useAuth } from '../hooks/useAuth'
import SocialLogin from '../components/SocialLogin'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SeasonalAnime {
  id: number
  title: string
  coverImage: string
  bannerImage: string
  description: string
  rating: number
  episodes: number
  genres: string[]
  status: string
  studios: string
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
  const { isAuthenticated } = useAuth()
  const [seasonalAnimes, setSeasonalAnimes] = useState<SeasonalAnime[]>([])
  const [latestPosts, setLatestPosts] = useState<ForumPost[]>([])
  const [trendingPosts, setTrendingPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const currentYear = new Date().getFullYear()

  const [communityStats, setCommunityStats] = useState({
    totalMembers: 0,
    activeToday: 0,
    totalPosts: 0
  })

  const categories = [
    { value: 'isekai', label: 'Isekai', icon: Sparkles, description: 'Mundos paralelos e jornadas épicas' },
    { value: 'shounen', label: 'Shonen', icon: Swords, description: 'Ação, batalhas e superação' },
    { value: 'classicos', label: 'Clássicos', icon: Crown, description: 'As obras que definiram gerações' },
    { value: 'manga', label: 'Mangás & Light Novels', icon: BookOpen, description: 'Leituras, teorias e debates' }
  ]

  useEffect(() => {
    fetchHomeData()
  }, [])

  // Auto-avanço do carrossel principal a cada 6 segundos
  useEffect(() => {
    if (seasonalAnimes.length === 0) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % seasonalAnimes.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [seasonalAnimes])

  const fetchHomeData = async () => {
    try {
      setLoading(true)

      // 1. Busca os animes em alta do ano corrente via AniList GraphQL
      const anilistQuery = `
        query ($year: Int) {
          Page(page: 1, perPage: 12) {
            media(type: ANIME, seasonYear: $year, sort: [POPULARITY_DESC, SCORE_DESC], isAdult: false) {
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
              description(asHtml: false)
              averageScore
              episodes
              genres
              status
              studios(isMain: true) {
                nodes {
                  name
                }
              }
            }
          }
        }
      `

      const [anilistRes, postsRes, profilesRes, commentsRes] = await Promise.allSettled([
        fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ query: anilistQuery, variables: { year: currentYear } })
        }).then((res) => res.json()),
        lumi.entities.forum_posts.list(),
        lumi.entities.user_profiles.list(),
        lumi.entities.forum_comments.list()
      ])

      // Formatação dos animes da AniList
      if (anilistRes.status === 'fulfilled' && anilistRes.value?.data?.Page?.media) {
        const mediaList = anilistRes.value.data.Page.media
        const formattedSeasonal: SeasonalAnime[] = mediaList.map((item: any) => ({
          id: item.id,
          title: item.title.english || item.title.romaji,
          coverImage: item.coverImage.extraLarge || item.coverImage.large,
          bannerImage: item.bannerImage || item.coverImage.extraLarge,
          description: item.description ? item.description.replace(/<[^>]*>?/gm, '') : 'Sem sinopse disponível.',
          rating: item.averageScore ? parseFloat((item.averageScore / 10).toFixed(1)) : 8.0,
          episodes: item.episodes || 12,
          genres: item.genres || ['Anime'],
          status: item.status === 'RELEASING' ? 'Em transmissão' : 'Finalizado',
          studios: item.studios?.nodes?.[0]?.name || 'Studio'
        }))
        setSeasonalAnimes(formattedSeasonal)
      }

      // Mapeamento dos Fóruns
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
      commentList.forEach((c: any) => {
        if (c.post_id) {
          commentsCountMap.set(c.post_id, (commentsCountMap.get(c.post_id) || 0) + 1)
        }
      })

      const enrichedPosts: ForumPost[] = postList.map((post: any) => ({
        ...post,
        author: profileMap.get(post.user_id) || {
          username: 'Otaku',
          avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'
        },
        commentCount: commentsCountMap.get(post._id) || 0
      }))

      const latest = [...enrichedPosts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
      setLatestPosts(latest)

      const trending = [...enrichedPosts]
        .sort((a, b) => ((b.likes || 0) + (b.views || 0) + (b.commentCount || 0)) - ((a.likes || 0) + (a.views || 0) + (a.commentCount || 0)))
        .slice(0, 4)
      setTrendingPosts(trending)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      setCommunityStats({
        totalMembers: profileList.length,
        activeToday: profileList.filter((p: any) => p.isActive).length,
        totalPosts: postList.length
      })
    } catch (error) {
      console.error('Erro ao carregar dados da página inicial:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollTrending = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const featured = seasonalAnimes[currentSlide] || null

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200">
      {/* 1. Hero Dinâmico: Destaque da Temporada com Transição Suave */}
      {featured && (
        <section className="relative h-[80vh] min-h-[580px] flex items-end overflow-hidden border-b border-zinc-800/80">
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 transform scale-105"
            style={{ backgroundImage: `url(${featured.bannerImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-[#09090b]/30 z-10" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#09090b]/40 to-[#09090b] z-10" />

          <div className="relative z-20 max-w-6xl mx-auto px-4 pb-14 w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center space-x-2.5 mb-3">
                <span className="inline-flex items-center space-x-1.5 bg-red-600/90 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  <Radio size={12} className="animate-pulse" />
                  <span>Em Alta {currentYear}</span>
                </span>
                <span className="text-xs text-zinc-400 font-medium">{featured.studios}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs text-red-400 font-bold">★ {featured.rating}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-zinc-100 tracking-tight mb-3 line-clamp-2">
                {featured.title}
              </h1>

              <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 mb-6 leading-relaxed max-w-xl">
                {featured.description}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`https://www.crunchyroll.com/pt-br/search?q=${encodeURIComponent(featured.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center space-x-2 shadow-lg shadow-red-950/40 cursor-pointer"
                >
                  <Play size={15} className="fill-white" />
                  <span>Assistir Agora</span>
                  <ExternalLink size={12} className="opacity-80" />
                </a>

                <Link
                  to="/catalog"
                  className="bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 text-xs font-medium px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Explorar Catálogo
                </Link>
              </div>
            </div>

            {/* Controles do Carrossel de Banner */}
            <div className="flex items-center space-x-2 self-end">
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev === 0 ? seasonalAnimes.length - 1 : prev - 1))}
                className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-xs font-medium text-zinc-400 px-2">
                <span className="text-zinc-100 font-bold">{currentSlide + 1}</span> / {seasonalAnimes.length}
              </div>
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => (prev + 1) % seasonalAnimes.length)}
                className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. Carrossel Horizontal: Animes em Alta de 2026 com Capas Originais */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center space-x-2 tracking-tight">
              <Flame size={18} className="text-red-500" />
              <span>Destaques da Temporada ({currentYear})</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">As produções mais assistidas e comentadas no momento</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => scrollTrending('left')}
              className="p-2 bg-[#121215] border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scrollTrending('right')}
              className="p-2 bg-[#121215] border border-zinc-800 hover:border-zinc-700 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          ref={carouselRef}
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-none scroll-smooth"
        >
          {seasonalAnimes.map((anime) => (
            <div
              key={anime.id}
              className="w-44 sm:w-52 shrink-0 bg-[#121215] border border-zinc-800/80 rounded-xl overflow-hidden group hover:border-zinc-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900">
                  <img
                    src={anime.coverImage}
                    alt={anime.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent opacity-80" />

                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[11px] font-bold text-red-400 border border-zinc-800">
                    ★ {anime.rating}
                  </div>

                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-semibold px-1.5 py-0.5 rounded">
                      {anime.status}
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="text-xs font-semibold text-zinc-100 truncate mb-1" title={anime.title}>
                    {anime.title}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{anime.studios}</span>
                    <span>{anime.episodes} eps</span>
                  </div>
                </div>
              </div>

              <div className="p-3 pt-0">
                <a
                  href={`https://www.crunchyroll.com/pt-br/search?q=${encodeURIComponent(anime.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#18181c] hover:bg-red-600 hover:text-white text-zinc-300 border border-zinc-800 text-[10px] font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Play size={10} />
                  <span>Assistir</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Discussões Populares da Comunidade */}
      <section className="py-12 px-4 bg-[#0d0d10] border-y border-zinc-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center space-x-2 tracking-tight">
                <TrendingUp size={18} className="text-red-500" />
                <span>Em Debate na Comunidade</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Tópicos com mais teorias e respostas recentes</p>
            </div>
            <Link
              to="/forum"
              className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center space-x-1"
            >
              <span>Ver fórum</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {trendingPosts.map((post) => (
              <Link key={post._id} to={`/forum/post/${post._id}`} className="group">
                <div className="bg-[#121215] border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700 transition-colors h-full flex flex-col justify-between">
                  <div className="flex items-start space-x-3">
                    <img
                      src={post.author?.avatar}
                      alt={post.author?.username}
                      className="w-9 h-9 rounded-xl object-cover border border-zinc-700/80 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-zinc-200 mb-1 group-hover:text-red-400 transition-colors truncate">
                        {post.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                        {post.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/40">
                    <span className="font-medium text-zinc-300">{post.author?.username}</span>
                    <div className="flex items-center space-x-3">
                      <span>{post.likes || 0} curtidas</span>
                      <span>{post.commentCount || 0} respostas</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Categorias de Canais */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-100 flex items-center space-x-2 tracking-tight">
            <Layers size={18} className="text-red-500" />
            <span>Canais Temáticos</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Explore discussões segmentadas por categoria</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Link key={category.value} to={`/forum?category=${category.value}`} className="group">
                <div className="bg-[#121215] border border-zinc-800/80 rounded-xl p-4 hover:border-red-500/40 transition-colors h-full flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 bg-[#18181c] border border-zinc-800 rounded-lg flex items-center justify-center text-red-500 mb-3 group-hover:bg-red-500/10 transition-colors">
                      <Icon size={16} />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-zinc-200 mb-1 group-hover:text-red-400 transition-colors">
                      {category.label}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 5. Últimas Atividades do Fórum & Métricas */}
      <section className="py-12 px-4 bg-[#0d0d10] border-t border-zinc-800/60">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center space-x-2 tracking-tight">
                <MessageSquare size={16} className="text-red-500" />
                <span>Tópicos Recentes</span>
              </h2>
              <Link to="/forum" className="text-xs text-red-400 hover:text-red-300 font-medium">
                Ver todos
              </Link>
            </div>

            <div className="space-y-2.5">
              {latestPosts.map((post) => (
                <Link key={post._id} to={`/forum/post/${post._id}`} className="group block">
                  <div className="bg-[#121215] border border-zinc-800/80 rounded-xl p-3 hover:border-zinc-700 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={post.author?.avatar}
                        alt={post.author?.username}
                        className="w-7 h-7 rounded-lg object-cover border border-zinc-700/80 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-red-400 transition-colors">
                          {post.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-[11px] text-zinc-500 mt-0.5">
                          <span className="text-zinc-400 font-medium">{post.author?.username}</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">{post.commentCount || 0} msgs</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Cartão de Status da Comunidade */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 mb-4 tracking-tight">
              Status da Comunidade
            </h2>
            <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <span className="text-xs text-zinc-400">Total de Membros</span>
                <span className="text-sm font-bold text-zinc-100">{communityStats.totalMembers}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <span className="text-xs text-zinc-400">Otakus Online</span>
                <span className="text-sm font-bold text-red-500">{communityStats.activeToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Discussões Ativas</span>
                <span className="text-sm font-bold text-zinc-100">{communityStats.totalPosts}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Banner de Inscrição Final */}
      {!isAuthenticated && (
        <section className="py-16 px-4 border-t border-zinc-800/60 bg-[#09090b]">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-zinc-100 mb-2.5 tracking-tight">
              Junte-se ao Kuneda Animes
            </h2>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Crie seu perfil, favorite animes, vote nas melhores obras e participe das teorias no fórum.
            </p>
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Criar Conta Grátis
            </button>
          </div>
        </section>
      )}

      {showLoginModal && <SocialLogin onClose={() => setShowLoginModal(false)} />}
    </div>
  )
}

export default Home