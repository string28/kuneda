import React, { useState, useEffect } from 'react'
import {
  User,
  Pencil,
  Check,
  X,
  Camera,
  Calendar,
  Flame,
  Globe,
  Plus,
  Play,
  Activity,
  Layers,
  MessageSquare,
  LayoutGrid,
  Rows3,
  Search,
  ArrowLeft,
  Sparkles,
  Swords,
  BookmarkCheck,
  Compass
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { useParams, useNavigate } from 'react-router-dom'

interface UserProfile {
  _id?: string
  user_id: string
  username: string
  avatar: string
  banner: string
  bio: string
  favoriteGenres: string[]
  favoriteAnimes: Array<{
    id: string
    title: string
    image: string
    rating: number
  }>
  socialLinks: {
    instagram?: string
    twitter?: string
    youtube?: string
    website?: string
  }
  watchedCount: number
  joinDate: string
  isActive: boolean
}

interface ProfileFormData {
  username: string
  bio: string
  favoriteGenres: string[]
  avatar: string
  banner: string
  socialLinks: {
    instagram?: string
    twitter?: string
    youtube?: string
    website?: string
  }
}

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [animes, setAnimes] = useState<any[]>([])
  const [showAnimeSelector, setShowAnimeSelector] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterGenre, setFilterGenre] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isOwnProfile, setIsOwnProfile] = useState(true)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileFormData>()

  const availableGenres = [
    'Ação', 'Aventura', 'Comédia', 'Drama', 'Fantasia', 'Romance',
    'Shounen', 'Seinen', 'Slice of Life', 'Sobrenatural', 'Mecha',
    'Histórico', 'Escolar', 'Esportes', 'Música', 'Terror'
  ]

  const socialPlatforms = [
    { key: 'instagram', label: 'Instagram', placeholder: '@seuusuario' },
    { key: 'twitter', label: 'Twitter / X', placeholder: '@seuusuario' },
    { key: 'youtube', label: 'YouTube', placeholder: 'canal/seucanal' },
    { key: 'website', label: 'Site Pessoal', placeholder: 'https://seusite.com' }
  ]

  useEffect(() => {
    const targetUserId = userId || user?.userId
    setIsOwnProfile(!userId || userId === user?.userId)
    
    if (targetUserId) {
      fetchProfile(targetUserId)
      fetchAnimes()
    } else {
      setLoading(false)
    }
  }, [userId, user])

  const fetchAnimes = async () => {
    try {
      const { list } = await lumi.entities.animes.list()
      setAnimes(list)
    } catch (error) {
      console.error('Erro ao carregar animes:', error)
    }
  }

  const fetchProfile = async (targetUserId: string) => {
    try {
      const { list } = await lumi.entities.user_profiles.list({
        filter: { user_id: targetUserId }
      })

      if (list.length > 0) {
        const userProfile = list[0] as unknown as UserProfile
        setProfile(userProfile)
        if (isOwnProfile) {
          setValue('username', userProfile.username)
          setValue('bio', userProfile.bio)
          setValue('favoriteGenres', userProfile.favoriteGenres)
          setValue('avatar', userProfile.avatar)
          setValue('banner', userProfile.banner || 'https://images.pexels.com/photos/1097456/pexels-photo-1097456.jpeg')
          setValue('socialLinks', userProfile.socialLinks || {})
        }
      } else if (isOwnProfile) {
        setIsNewUser(true)
        setEditing(true)
        setValue('username', user?.userName || '')
        setValue('bio', '')
        setValue('favoriteGenres', [])
        setValue('avatar', 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg')
        setValue('banner', 'https://images.pexels.com/photos/1097456/pexels-photo-1097456.jpeg')
        setValue('socialLinks', {})
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      toast.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return

    try {
      const profileData = {
        user_id: user.userId,
        username: data.username,
        bio: data.bio,
        favoriteGenres: data.favoriteGenres,
        avatar: data.avatar,
        banner: data.banner,
        socialLinks: data.socialLinks,
        favoriteAnimes: profile?.favoriteAnimes || [],
        watchedCount: profile?.watchedCount || 0,
        joinDate: profile?.joinDate || new Date().toISOString(),
        isActive: true,
        creator: user.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (isNewUser) {
        const newProfile = await lumi.entities.user_profiles.create(profileData) as unknown as UserProfile
        setProfile(newProfile)
        setIsNewUser(false)
        toast.success('Perfil configurado')
      } else if (profile) {
        const updatedProfile = await lumi.entities.user_profiles.update(profile._id!, profileData) as unknown as UserProfile
        setProfile(updatedProfile)
        toast.success('Alterações salvas')
      }

      setEditing(false)
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast.error('Erro ao salvar perfil')
    }
  }

  const handleGenreToggle = (genre: string) => {
    const currentGenres = watch('favoriteGenres') || []
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre]
    
    setValue('favoriteGenres', newGenres)
  }

  const addFavoriteAnime = (anime: any) => {
    if (!profile) return

    const favoriteAnime = {
      id: anime._id,
      title: anime.title,
      image: anime.image || anime.imageUrl,
      rating: anime.rating
    }

    const updatedFavorites = [...(profile.favoriteAnimes || []), favoriteAnime]
    setProfile({ ...profile, favoriteAnimes: updatedFavorites })
    setShowAnimeSelector(false)
    toast.success(`${anime.title} adicionado`)
  }

  const removeFavoriteAnime = (animeId: string) => {
    if (!profile) return

    const updatedFavorites = profile.favoriteAnimes?.filter(anime => anime.id !== animeId) || []
    setProfile({ ...profile, favoriteAnimes: updatedFavorites })
    toast.success('Removido dos favoritos')
  }

  const filteredAnimes = animes.filter(anime => {
    const matchesSearch = anime.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = !filterGenre || anime.genre?.includes(filterGenre)
    return matchesSearch && matchesGenre
  })

  if (!isAuthenticated && isOwnProfile) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="text-center bg-[#121215] rounded-2xl p-8 border border-zinc-800 max-w-md w-full">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <User size={20} />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Acesso Restrito</h2>
          <p className="text-zinc-400 text-sm mb-6">Entre para visualizar e gerenciar seu perfil</p>
          <button
            type="button"
            onClick={() => lumi.auth.signIn()}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Fazer Login
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile && !isNewUser) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="text-center bg-[#121215] rounded-2xl p-8 border border-zinc-800 max-w-md w-full">
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Perfil Indisponível</h2>
          <p className="text-zinc-400 text-sm mb-6">Este usuário não possui um perfil público configurado.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-[#121215] rounded-2xl overflow-hidden border border-zinc-800/80 shadow-sm">
          {/* Banner */}
          <div className="relative h-64 sm:h-72 overflow-hidden bg-zinc-900">
            <img
              src={watch('banner') || profile?.banner || 'https://images.pexels.com/photos/1097456/pexels-photo-1097456.jpeg'}
              alt="Banner do perfil"
              className="w-full h-full object-cover opacity-80 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-[#121215]/20 to-transparent pointer-events-none" />

            {editing && (
              <div className="absolute top-4 right-4 z-30">
                <input
                  {...register('banner')}
                  placeholder="URL da imagem do banner..."
                  className="bg-black/70 backdrop-blur-md text-zinc-100 px-3.5 py-2 rounded-lg text-xs w-72 border border-zinc-700 focus:border-red-500 focus:outline-none"
                />
              </div>
            )}

            {/* Ações do Topo/Banner */}
            <div className="absolute bottom-4 right-4 z-30">
              {!editing && isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border border-zinc-700/80 px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 font-medium cursor-pointer shadow-sm"
                >
                  <Pencil size={15} className="text-red-500" />
                  <span>Editar</span>
                </button>
              ) : editing ? (
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1.5 font-medium cursor-pointer"
                  >
                    <Check size={16} />
                    <span>Salvar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3.5 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <X size={16} />
                    <span>Cancelar</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/80 px-3.5 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Voltar</span>
                </button>
              )}
            </div>
          </div>

          {/* Área Principal de Perfil */}
          <div className="px-6 sm:px-8 pb-8 pt-0">
            {/* Avatar Sobreposto */}
            <div className="-mt-16 sm:-mt-20 mb-6 pl-1 z-20 relative">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-2xl p-1 bg-[#121215] shadow-xl sm:w-36 sm:h-36">
                  <img
                    src={watch('avatar') || profile?.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'}
                    alt="Avatar"
                    className="w-full h-full rounded-xl object-cover border border-zinc-700"
                  />
                </div>
                
                {/* Indicador de Status */}
                <div className="absolute bottom-2 right-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-[#121215]" />
                </div>

                {editing && (
                  <button 
                    type="button"
                    className="absolute -bottom-1 -right-1 bg-red-600 text-white p-2 rounded-lg hover:bg-red-500 transition-colors shadow-md cursor-pointer"
                  >
                    <Camera size={16} />
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Informações Básicas */}
              <div className="mb-10">
                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                          Nome de Usuário
                        </label>
                        <input
                          {...register('username', { required: 'Nome é obrigatório' })}
                          className="w-full bg-[#18181c] text-zinc-100 px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-red-500 border border-zinc-800 transition-colors"
                          placeholder="Como quer ser chamado"
                        />
                        {errors.username && (
                          <p className="text-red-400 text-xs mt-1.5">{errors.username.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                          Link da Foto (Avatar)
                        </label>
                        <input
                          {...register('avatar')}
                          className="w-full bg-[#18181c] text-zinc-100 px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-red-500 border border-zinc-800 transition-colors"
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-2">
                        Biografia
                      </label>
                      <textarea
                        {...register('bio')}
                        rows={3}
                        className="w-full bg-[#18181c] text-zinc-100 px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-red-500 border border-zinc-800 transition-colors resize-none"
                        placeholder="Escreva algo sobre você ou suas recomendações de anime..."
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 mb-2 tracking-tight">
                          {profile?.username || 'Usuário'}
                        </h1>
                        <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                          {profile?.bio || 'Nenhuma biografia adicionada.'}
                        </p>
                      </div>
                      
                      {/* Badge Discreta */}
                      <div className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium px-3 py-1.5 rounded-md flex items-center space-x-1.5">
                        <Flame size={14} className="text-red-500" />
                        <span>Otaku</span>
                      </div>
                    </div>

                    {/* Metadados Rápidos */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="flex items-center space-x-3 bg-[#18181c]/60 p-3 rounded-xl border border-zinc-800/60">
                        <Calendar size={18} className="text-zinc-500 shrink-0" />
                        <div className="text-xs">
                          <p className="text-zinc-500">Membro desde</p>
                          <p className="text-zinc-200 font-medium">
                            {profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString('pt-BR') : 'Recente'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 bg-[#18181c]/60 p-3 rounded-xl border border-zinc-800/60">
                        <BookmarkCheck size={18} className="text-red-500 shrink-0" />
                        <div className="text-xs">
                          <p className="text-zinc-500">Animes Assistidos</p>
                          <p className="text-zinc-200 font-medium">{profile?.watchedCount || 0}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 bg-[#18181c]/60 p-3 rounded-xl border border-zinc-800/60">
                        <Activity size={18} className="text-zinc-500 shrink-0" />
                        <div className="text-xs">
                          <p className="text-zinc-500">Classificação</p>
                          <p className="text-zinc-200 font-medium">
                            {(profile?.watchedCount || 0) < 10 ? 'Iniciante' : 
                             (profile?.watchedCount || 0) < 50 ? 'Intermediário' : 'Veterano'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Redes Sociais */}
              <div className="mb-10">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center space-x-2">
                  <Globe size={16} className="text-red-500" />
                  <span>Conexões</span>
                </h3>

                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {socialPlatforms.map(platform => (
                      <div key={platform.key}>
                        <label className="block text-zinc-400 text-xs mb-1 font-medium">{platform.label}</label>
                        <input
                          {...register(`socialLinks.${platform.key}` as any)}
                          className="w-full bg-[#18181c] text-zinc-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-red-500 border border-zinc-800"
                          placeholder={platform.placeholder}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {socialPlatforms.map(platform => {
                      const link = profile?.socialLinks?.[platform.key as keyof typeof profile.socialLinks]
                      if (!link) return null

                      return (
                        <a
                          key={platform.key}
                          href={link.startsWith('http') ? link : `https://${platform.key}.com/${link.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#18181c] hover:bg-[#202026] text-zinc-300 hover:text-zinc-100 border border-zinc-800 text-xs px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <span className="font-medium">{platform.label}:</span>
                          <span className="text-zinc-400">{link.replace('@', '').replace('https://', '')}</span>
                        </a>
                      )
                    })}
                    {(!profile?.socialLinks || Object.keys(profile.socialLinks).length === 0) && (
                      <span className="text-zinc-500 text-xs italic">Nenhum link adicionado.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Gêneros Favoritos */}
              <div className="mb-10">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center space-x-2">
                  <Compass size={16} className="text-red-500" />
                  <span>Gêneros Preferidos</span>
                </h3>

                {editing ? (
                  <div className="flex flex-wrap gap-2">
                    {availableGenres.map(genre => {
                      const isSelected = (watch('favoriteGenres') || []).includes(genre)
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => handleGenreToggle(genre)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-red-600 text-white'
                              : 'bg-[#18181c] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                          }`}
                        >
                          {genre}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(profile?.favoriteGenres || []).map(genre => (
                      <span
                        key={genre}
                        className="bg-[#18181c] text-zinc-300 border border-zinc-800/80 px-3 py-1 rounded-md text-xs"
                      >
                        {genre}
                      </span>
                    ))}
                    {(!profile?.favoriteGenres || profile.favoriteGenres.length === 0) && (
                      <span className="text-zinc-500 text-xs italic">Nenhum gênero selecionado.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Animes Favoritos */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center space-x-2">
                    <Swords size={16} className="text-red-500" />
                    <span>Favoritos</span>
                  </h3>
                  {!editing && isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => setShowAnimeSelector(true)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Adicionar</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5">
                  <AnimatePresence>
                    {(profile?.favoriteAnimes || []).map((anime) => (
                      <div 
                        key={anime.id}
                        className="relative group rounded-xl overflow-hidden bg-[#18181c] border border-zinc-800"
                      >
                        <img
                          src={anime.image}
                          alt={anime.title}
                          className="w-full h-48 sm:h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                        {isOwnProfile && (
                          <button
                            type="button"
                            onClick={() => removeFavoriteAnime(anime.id)}
                            className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 p-2.5">
                          <h4 className="text-zinc-100 text-xs font-semibold truncate mb-1">{anime.title}</h4>
                          <span className="text-red-400 text-[11px] font-medium">★ {anime.rating}</span>
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
                {(!profile?.favoriteAnimes || profile.favoriteAnimes.length === 0) && (
                  <p className="text-zinc-500 text-xs italic">Nenhum anime favorito selecionado.</p>
                )}
              </div>

              {/* Catálogo Geral */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center space-x-2">
                    <Play size={16} className="text-red-500" />
                    <span>Catálogo</span>
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-[#18181c] text-xs text-zinc-200 pl-8 pr-3 py-1.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-red-500 w-36 sm:w-48"
                      />
                    </div>
                    
                    <select
                      value={filterGenre}
                      onChange={(e) => setFilterGenre(e.target.value)}
                      className="bg-[#18181c] text-xs text-zinc-300 px-2.5 py-1.5 rounded-lg border border-zinc-800 focus:outline-none"
                    >
                      <option value="">Gêneros</option>
                      {availableGenres.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>

                    <div className="flex border border-zinc-800 rounded-lg p-0.5 bg-[#18181c]">
                      <button
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`p-1 rounded cursor-pointer ${viewMode === 'grid' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'}`}
                      >
                        <LayoutGrid size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`p-1 rounded cursor-pointer ${viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'}`}
                      >
                        <Rows3 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grid/Lista do Catálogo */}
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5" 
                  : "space-y-2"
                }>
                  {filteredAnimes.slice(0, 12).map((anime) => (
                    <div 
                      key={anime._id}
                      className={viewMode === 'grid'
                        ? 'relative group rounded-xl overflow-hidden bg-[#18181c] border border-zinc-800'
                        : 'flex items-center space-x-3 bg-[#18181c] p-2.5 rounded-xl border border-zinc-800/80'}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <img
                            src={anime.image || anime.imageUrl}
                            alt={anime.title}
                            className="w-full h-48 sm:h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                          <div className="absolute bottom-0 left-0 right-0 p-2.5">
                            <h4 className="text-zinc-100 text-xs font-semibold truncate mb-1">{anime.title}</h4>
                            <div className="flex justify-between items-center text-[11px] text-zinc-400">
                              <span className="text-red-400">★ {anime.rating}</span>
                              <span>{anime.releaseYear}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <img
                            src={anime.image || anime.imageUrl}
                            alt={anime.title}
                            className="w-12 h-16 object-cover rounded-lg shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-zinc-100 text-xs font-semibold truncate">{anime.title}</h4>
                            <p className="text-zinc-500 text-[11px] truncate mb-1">{anime.synopsis}</p>
                            <div className="flex items-center space-x-3 text-[10px] text-zinc-400">
                              <span className="text-red-400">★ {anime.rating}</span>
                              <span>{anime.episodes} eps</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Modal de Escolha Simples */}
        <AnimatePresence>
          {showAnimeSelector && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-zinc-100">Escolha um Anime</h3>
                  <button 
                    type="button"
                    onClick={() => setShowAnimeSelector(false)}
                    className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {animes.map((anime) => (
                    <button 
                      key={anime._id}
                      type="button"
                      onClick={() => addFavoriteAnime(anime)}
                      className="text-left bg-[#18181c] hover:border-red-500/60 border border-zinc-800 rounded-xl p-2 transition-colors cursor-pointer group"
                    >
                      <img
                        src={anime.image || anime.imageUrl}
                        alt={anime.title}
                        className="w-full h-36 object-cover rounded-lg mb-2"
                      />
                      <h4 className="text-zinc-200 text-xs font-medium truncate">{anime.title}</h4>
                      <span className="text-red-400 text-[11px]">★ {anime.rating}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Profile