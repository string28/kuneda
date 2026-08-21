import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Compass,
  Heart,
  User,
  MessageSquare,
  Menu,
  X,
  LogOut,
  Flame
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { lumi } from '../lib/lumi'
import SocialLogin from './SocialLogin'
import { Logo } from './Logo'

const Navbar: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navItems = [
    { name: 'Início', path: '/', icon: Flame },
    { name: 'Catálogo', path: '/catalog', icon: Compass },
    { name: 'Favoritos', path: '/favorites', icon: Heart },
    { name: 'Fórum', path: '/forum', icon: MessageSquare },
  ]

  const handleSignOut = async () => {
    await lumi.auth.signOut()
    setShowUserMenu(false)
    navigate('/')
  }

  const handleProfileClick = () => {
    navigate('/profile')
    setShowUserMenu(false)
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className="bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Katana Slash */}
          <Link to="/" className="flex items-center group transition-transform duration-200 hover:scale-105">
            <Logo size={34} showText={true} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-800/80 text-white'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon size={15} className={isActive ? 'text-red-500' : 'text-zinc-500'} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2.5 bg-[#121215] hover:bg-[#18181c] border border-zinc-800/80 rounded-xl px-2.5 py-1.5 transition-colors cursor-pointer"
                >
                  <img
                    src={user?.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'}
                    alt="Avatar"
                    className="w-6 h-6 rounded-lg object-cover border border-zinc-700"
                  />
                  <span className="text-zinc-200 text-xs font-medium hidden sm:block">
                    {user?.userName || 'Usuário'}
                  </span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-44 bg-[#121215] rounded-xl shadow-xl border border-zinc-800 py-1.5 z-50"
                    >
                      <button
                        type="button"
                        onClick={handleProfileClick}
                        className="flex items-center space-x-2 w-full px-3.5 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
                      >
                        <User size={14} className="text-zinc-400" />
                        <span>Meu Perfil</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigate('/favorites')
                          setShowUserMenu(false)
                        }}
                        className="flex items-center space-x-2 w-full px-3.5 py-2 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
                      >
                        <Heart size={14} className="text-zinc-400" />
                        <span>Favoritos</span>
                      </button>
                      <div className="border-t border-zinc-800/80 my-1" />
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 w-full px-3.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                      >
                        <LogOut size={14} />
                        <span>Sair</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <SocialLogin />
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-zinc-400 hover:text-zinc-100 p-1.5 cursor-pointer"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-zinc-800/80 py-3"
            >
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-zinc-800/80 text-white'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-red-500' : 'text-zinc-500'} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                
                {isAuthenticated && (
                  <>
                    <div className="border-t border-zinc-800/80 my-2" />
                    <button
                      type="button"
                      onClick={handleProfileClick}
                      className="flex items-center space-x-2.5 w-full px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <User size={16} className="text-zinc-500" />
                      <span>Meu Perfil</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex items-center space-x-2.5 w-full px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-zinc-800/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span>Sair</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {(showUserMenu || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false)
            setIsMobileMenuOpen(false)
          }}
        />
      )}
    </nav>
  )
}

export default Navbar