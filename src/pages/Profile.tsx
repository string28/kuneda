
import React, { useState, useEffect } from 'react'
import {User, Edit, Save, X, Camera, Star, Calendar, Eye, ExternalLink, Upload, Link as LinkIcon, Instagram, Twitter, Youtube, Globe, Heart, Play, Award, TrendingUp, Users, MessageCircle, Bookmark, Grid, List, Filter, Search, ChevronRight, Zap, Crown, Shield} from 'lucide-react'
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
    { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-500', placeholder: '@seuusuario' },
    { key: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'from-blue-400 to-blue-600', placeholder: '@seuusuario' },
    { key: 'youtube', label: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-600', placeholder: 'canal/seucanal' },
    { key: 'website', label: 'Website', icon: Globe, color: 'from-green-500 to-blue-500', placeholder: 'https://seusite.com' }
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
        const userProfile = list[0]
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
        createdAt: profile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (isNewUser) {
        const newProfile = await lumi.entities.user_profiles.create(profileData)
        setProfile(newProfile)
        setIsNewUser(false)
        toast.success('Perfil criado com sucesso!')
      } else if (profile) {
        const updatedProfile = await lumi.entities.user_profiles.update(profile._id!, profileData)
        setProfile(updatedProfile)
        toast.success('Perfil atualizado com sucesso!')
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
    toast.success(`${anime.title} adicionado aos favoritos!`)
  }

  const removeFavoriteAnime = (animeId: string) => {
    if (!profile) return

    const updatedFavorites = profile.favoriteAnimes?.filter(anime => anime.id !== animeId) || []
    setProfile({ ...profile, favoriteAnimes: updatedFavorites })
    toast.success('Anime removido dos favoritos!')
  }

  const filteredAnimes = animes.filter(anime => {
    const matchesSearch = anime.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = !filterGenre || anime.genre?.includes(filterGenre)
    return matchesSearch && matchesGenre
  })

  if (!isAuthenticated && isOwnProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Acesso Restrito</h2>
          <p className="text-gray-400 mb-6">Faça login para acessar seu perfil</p>
          <button
            onClick={() => lumi.auth.signIn()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Fazer Login
          </button>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!profile && !isNewUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-red-500/20"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Perfil não encontrado</h2>
          <p className="text-gray-400 mb-6">Este usuário não possui um perfil público</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300"
          >
            Voltar ao Início
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/40 backdrop-blur-xl rounded-3xl overflow-hidden border border-purple-500/20 shadow-2xl"
        >
          {/* Banner Premium */}
          <div className="relative h-80 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
            <img
              src={watch('banner') || profile?.banner || 'https://images.pexels.com/photos/1097456/pexels-photo-1097456.jpeg'}
              alt="Banner do perfil"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
            
            {/* Floating particles effect */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-60"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-20, -100],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {editing && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-6 right-6"
              >
                <input
                  {...register('banner')}
                  placeholder="URL do banner"
                  className="bg-black/60 backdrop-blur-lg text-white px-4 py-3 rounded-xl text-sm w-80 border border-purple-500/30 focus:border-purple-400 focus:outline-none"
                />
              </motion.div>
            )}

            {/* Avatar Premium */}
            <div className="absolute -bottom-20 left-8">
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-r from-purple-500 to-pink-500">
                  <img
                    src={watch('avatar') || profile?.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover border-4 border-gray-900"
                  />
                </div>
                
                {/* Status indicator */}
                <div className="absolute bottom-2 right-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full border-3 border-gray-900 flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>

                {editing && (
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
                  >
                    <Camera size={20} />
                  </motion.button>
                )}
              </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="absolute bottom-6 right-6">
              {!editing && isOwnProfile ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditing(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 backdrop-blur-sm shadow-lg"
                >
                  <Edit size={18} />
                  <span>Editar Perfil</span>
                </motion.button>
              ) : editing ? (
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit(onSubmit)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg"
                  >
                    <Save size={18} />
                    <span>Salvar</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditing(false)}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 shadow-lg"
                  >
                    <X size={18} />
                    <span>Cancelar</span>
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2 backdrop-blur-sm shadow-lg"
                >
                  <ChevronRight size={18} className="rotate-180" />
                  <span>Voltar</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Content Premium */}
          <div className="pt-24 p-8">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Header Info */}
              <div className="mb-12">
                {editing ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-white text-sm font-medium mb-3 flex items-center space-x-2">
                          <User size={16} />
                          <span>Nome de Usuário</span>
                        </label>
                        <input
                          {...register('username', { required: 'Nome de usuário é obrigatório' })}
                          className="w-full bg-gray-700/50 backdrop-blur-lg text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600/50 transition-all duration-300"
                          placeholder="Seu nome de usuário"
                        />
                        {errors.username && (
                          <p className="text-red-400 text-sm mt-2">{errors.username.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-white text-sm font-medium mb-3 flex items-center space-x-2">
                          <Camera size={16} />
                          <span>URL do Avatar</span>
                        </label>
                        <input
                          {...register('avatar')}
                          className="w-full bg-gray-700/50 backdrop-blur-lg text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600/50 transition-all duration-300"
                          placeholder="https://exemplo.com/avatar.jpg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-3 flex items-center space-x-2">
                        <MessageCircle size={16} />
                        <span>Biografia</span>
                      </label>
                      <textarea
                        {...register('bio')}
                        rows={4}
                        className="w-full bg-gray-700/50 backdrop-blur-lg text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600/50 transition-all duration-300"
                        placeholder="Conte um pouco sobre você e seus animes favoritos..."
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                          {profile?.username || 'Usuário'}
                        </h1>
                        <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
                          {profile?.bio || 'Nenhuma biografia adicionada'}
                        </p>
                      </div>
                      
                      {/* Premium Badge */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full flex items-center space-x-2 shadow-lg"
                      >
                        <Crown size={16} />
                        <span className="text-sm font-medium">Otaku</span>
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center space-x-3 bg-gray-700/30 backdrop-blur-lg rounded-xl p-4 border border-gray-600/30"
                      >
                        <Calendar className="text-purple-400" size={20} />
                        <div>
                          <p className="text-gray-400">Membro desde</p>
                          <p className="text-white font-medium">
                            {profile?.joinDate ? 
                              new Date(profile.joinDate).toLocaleDateString('pt-BR') : 
                              'Data não disponível'
                            }
                          </p>
                        </div>
                      </motion.div>

                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center space-x-3 bg-gray-700/30 backdrop-blur-lg rounded-xl p-4 border border-gray-600/30"
                      >
                        <Eye className="text-blue-400" size={20} />
                        <div>
                          <p className="text-gray-400">Animes assistidos</p>
                          <p className="text-white font-medium">{profile?.watchedCount || 0}</p>
                        </div>
                      </motion.div>

                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center space-x-3 bg-gray-700/30 backdrop-blur-lg rounded-xl p-4 border border-gray-600/30"
                      >
                        <TrendingUp className="text-green-400" size={20} />
                        <div>
                          <p className="text-gray-400">Nível</p>
                          <p className="text-white font-medium">
                            {(profile?.watchedCount || 0) < 10 ? 'Iniciante' :
                             (profile?.watchedCount || 0) < 50 ? 'Intermediário' :
                             (profile?.watchedCount || 0) < 100 ? 'Avançado' : 'Mestre Otaku'}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Social Links Premium */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-12"
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Users size={18} />
                  </div>
                  <span>Redes Sociais</span>
                </h3>
                
                {editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {socialPlatforms.map(platform => (
                      <motion.div 
                        key={platform.key} 
                        whileHover={{ scale: 1.02 }}
                        className="space-y-3"
                      >
                        <label className="flex items-center space-x-2 text-white text-sm font-medium">
                          <platform.icon size={16} />
                          <span>{platform.label}</span>
                        </label>
                        <input
                          {...register(`socialLinks.${platform.key}` as any)}
                          className="w-full bg-gray-700/50 backdrop-blur-lg text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600/50 transition-all duration-300"
                          placeholder={platform.placeholder}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {socialPlatforms.map(platform => {
                      const link = profile?.socialLinks?.[platform.key as keyof typeof profile.socialLinks]
                      if (!link) return null
                      
                      return (
                        <motion.a
                          key={platform.key}
                          href={link.startsWith('http') ? link : `https://${platform.key}.com/${link.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center space-x-3 px-6 py-4 rounded-xl bg-gradient-to-r ${platform.color} text-white hover:shadow-lg transition-all duration-300 group`}
                        >
                          <platform.icon size={20} />
                          <span className="font-medium">{link.replace('@', '').replace('https://', '')}</span>
                          <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.a>
                      )
                    })}
                    {(!profile?.socialLinks || Object.keys(profile.socialLinks).length === 0) && (
                      <div className="col-span-full text-center py-8 bg-gray-700/30 rounded-xl border border-gray-600/30">
                        <Users className="mx-auto text-gray-400 mb-3" size={32} />
                        <span className="text-gray-400">Nenhuma rede social adicionada</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Favorite Genres Premium */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Star size={18} />
                  </div>
                  <span>Gêneros Favoritos</span>
                </h3>
                
                {editing ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {availableGenres.map(genre => {
                      const isSelected = (watch('favoriteGenres') || []).includes(genre)
                      return (
                        <motion.button
                          key={genre}
                          type="button"
                          onClick={() => handleGenreToggle(genre)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                            isSelected
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600/30'
                          }`}
                        >
                          {genre}
                        </motion.button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {(profile?.favoriteGenres || []).map(genre => (
                      <motion.span
                        key={genre}
                        whileHover={{ scale: 1.05 }}
                        className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 px-4 py-2 rounded-full text-sm border border-purple-500/30 backdrop-blur-lg"
                      >
                        {genre}
                      </motion.span>
                    ))}
                    {(!profile?.favoriteGenres || profile.favoriteGenres.length === 0) && (
                      <div className="w-full text-center py-8 bg-gray-700/30 rounded-xl border border-gray-600/30">
                        <Star className="mx-auto text-gray-400 mb-3" size={32} />
                        <span className="text-gray-400">Nenhum gênero selecionado</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Favorite Animes Premium */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-12"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Heart size={18} />
                    </div>
                    <span>Animes Favoritos</span>
                  </h3>
                  {!editing && isOwnProfile && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAnimeSelector(true)}
                      className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white px-6 py-3 rounded-xl text-sm transition-all duration-300 flex items-center space-x-2 shadow-lg"
                    >
                      <Heart size={16} />
                      <span>Adicionar</span>
                    </motion.button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  <AnimatePresence>
                    {(profile?.favoriteAnimes || []).map((anime, index) => (
                      <motion.div 
                        key={anime.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                        className="relative group"
                      >
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-t from-gray-900 to-transparent">
                          <img
                            src={anime.image}
                            alt={anime.title}
                            className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {isOwnProfile && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileHover={{ opacity: 1, scale: 1 }}
                              onClick={() => removeFavoriteAnime(anime.id)}
                              className="absolute top-3 right-3 bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
                            >
                              <X size={16} />
                            </motion.button>
                          )}

                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h4 className="text-white text-sm font-bold line-clamp-2 mb-2">{anime.title}</h4>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 bg-yellow-500/20 backdrop-blur-lg rounded-full px-2 py-1">
                                <Star className="text-yellow-400" size={12} />
                                <span className="text-yellow-400 text-xs font-medium">{anime.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {(!profile?.favoriteAnimes || profile.favoriteAnimes.length === 0) && (
                    <div className="col-span-full text-center py-12 bg-gray-700/30 rounded-xl border border-gray-600/30">
                      <Heart className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-400 mb-6 text-lg">Nenhum anime favorito adicionado</p>
                      {isOwnProfile && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAnimeSelector(true)}
                          className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white px-6 py-3 rounded-xl transition-all duration-300"
                        >
                          Adicionar Primeiro Favorito
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Anime Catalog Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-12"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Play size={18} />
                    </div>
                    <span>Catálogo de Animes</span>
                  </h3>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-gray-700/50 rounded-xl p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          viewMode === 'grid' 
                            ? 'bg-purple-600 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Grid size={16} />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          viewMode === 'list' 
                            ? 'bg-purple-600 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <List size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Buscar animes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-700/50 backdrop-blur-lg text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600/50 transition-all duration-300"
                      />
                    </div>
                  </div>
                  
                  <select
                    value={filterGenre}
                    onChange={(e) => setFilterGenre(e.target.value)}
                    className="bg-gray-700/50 backdrop-blur-lg text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600/50 transition-all duration-300"
                  >
                    <option value="">Todos os gêneros</option>
                    {availableGenres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                {/* Anime Grid/List */}
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6" 
                  : "space-y-4"
                }>
                  <AnimatePresence>
                    {filteredAnimes.slice(0, 12).map((anime, index) => (
                      <motion.div
                        key={anime._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: viewMode === 'grid' ? 1.05 : 1.02, y: -5 }}
                        className={viewMode === 'grid' 
                          ? "relative group cursor-pointer"
                          : "flex items-center space-x-4 bg-gray-700/30 backdrop-blur-lg rounded-xl p-4 border border-gray-600/30 cursor-pointer"
                        }
                      >
                        {viewMode === 'grid' ? (
                          <div className="relative overflow-hidden rounded-xl">
                            <img
                              src={anime.image || anime.imageUrl}
                              alt={anime.title}
                              className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <h4 className="text-white text-sm font-bold line-clamp-2 mb-2">{anime.title}</h4>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1 bg-yellow-500/20 backdrop-blur-lg rounded-full px-2 py-1">
                                  <Star className="text-yellow-400" size={12} />
                                  <span className="text-yellow-400 text-xs font-medium">{anime.rating}</span>
                                </div>
                                <span className="text-gray-300 text-xs">{anime.releaseYear}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <img
                              src={anime.image || anime.imageUrl}
                              alt={anime.title}
                              className="w-16 h-20 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h4 className="text-white font-bold mb-1">{anime.title}</h4>
                              <p className="text-gray-400 text-sm line-clamp-2 mb-2">{anime.synopsis}</p>
                              <div className="flex items-center space-x-4 text-xs">
                                <div className="flex items-center space-x-1">
                                  <Star className="text-yellow-400" size={12} />
                                  <span className="text-yellow-400">{anime.rating}</span>
                                </div>
                                <span className="text-gray-400">{anime.releaseYear}</span>
                                <span className="text-gray-400">{anime.episodes} eps</span>
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {filteredAnimes.length === 0 && (
                  <div className="text-center py-12 bg-gray-700/30 rounded-xl border border-gray-600/30">
                    <Search className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-400 text-lg">Nenhum anime encontrado</p>
                  </div>
                )}
              </motion.div>

              {/* Stats Premium */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-6"
              >
                {[
                  { 
                    label: 'Animes Assistidos', 
                    value: profile?.watchedCount || 0, 
                    icon: Eye, 
                    color: 'from-blue-500 to-cyan-500',
                    bgColor: 'from-blue-500/20 to-cyan-500/20'
                  },
                  { 
                    label: 'Gêneros Favoritos', 
                    value: (profile?.favoriteGenres || []).length, 
                    icon: Star, 
                    color: 'from-purple-500 to-pink-500',
                    bgColor: 'from-purple-500/20 to-pink-500/20'
                  },
                  { 
                    label: 'Animes Favoritos', 
                    value: (profile?.favoriteAnimes || []).length, 
                    icon: Heart, 
                    color: 'from-pink-500 to-red-500',
                    bgColor: 'from-pink-500/20 to-red-500/20'
                  },
                  { 
                    label: 'Redes Sociais', 
                    value: profile?.socialLinks ? Object.keys(profile.socialLinks).filter(key => profile.socialLinks[key as keyof typeof profile.socialLinks]).length : 0, 
                    icon: Users, 
                    color: 'from-green-500 to-emerald-500',
                    bgColor: 'from-green-500/20 to-emerald-500/20'
                  }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className={`bg-gradient-to-br ${stat.bgColor} backdrop-blur-lg rounded-2xl p-6 text-center border border-gray-600/30 shadow-lg`}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <stat.icon size={24} className="text-white" />
                    </div>
                    <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                      {stat.value}
                    </div>
                    <div className="text-gray-300 text-sm font-medium">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </form>
          </div>
        </motion.div>

        {/* Anime Selector Modal Premium */}
        <AnimatePresence>
          {showAnimeSelector && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800/90 backdrop-blur-xl rounded-2xl p-8 max-w-6xl w-full max-h-[80vh] overflow-y-auto border border-purple-500/20 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Heart size={18} />
                    </div>
                    <span>Escolher Anime Favorito</span>
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAnimeSelector(false)}
                    className="text-gray-400 hover:text-white transition-colors p-2"
                  >
                    <X size={28} />
                  </motion.button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {animes.map((anime, index) => (
                    <motion.button
                      key={anime._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => addFavoriteAnime(anime)}
                      className="text-left hover:bg-gray-700/50 rounded-xl p-3 transition-all duration-300 group"
                    >
                      <div className="relative overflow-hidden rounded-xl mb-3">
                        <img
                          src={anime.image || anime.imageUrl}
                          alt={anime.title}
                          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <h4 className="text-white text-sm font-bold line-clamp-2 mb-2">{anime.title}</h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 bg-yellow-500/20 backdrop-blur-lg rounded-full px-2 py-1">
                          <Star className="text-yellow-400" size={12} />
                          <span className="text-yellow-400 text-xs font-medium">{anime.rating}</span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome Message Premium */}
        <AnimatePresence>
          {isNewUser && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ delay: 0.6 }}
              className="mt-8 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-purple-500/30 rounded-2xl p-8 shadow-lg"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                    Bem-vindo ao Kuneda Animes! 🎉
                  </h3>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Complete seu perfil para uma experiência personalizada incrível! Adicione seu banner épico, 
                    avatar único, gêneros favoritos, animes que marcaram sua vida e suas redes sociais para 
                    conectar com outros otakus!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Profile
