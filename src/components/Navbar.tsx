
import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {Home, Search, Heart, User, MessageSquare, Menu, X, LogOut, Settings} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { lumi } from '../lib/lumi'
import SocialLogin from './SocialLogin'

const Navbar: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navItems = [
    { name: 'Início', path: '/', icon: Home },
    { name: 'Catálogo', path: '/catalog', icon: Search },
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
    <nav className="bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center"
            >
              <span className="text-white font-bold text-lg">K</span>
            </motion.div>
            <span className="text-white text-xl font-bold hidden sm:block">
              Kuneda Animes
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 transition-colors"
                >
                  <img
                    src={user?.avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg'}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-white text-sm hidden sm:block">
                    {user?.userName || 'Usuário'}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2"
                    >
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        <User size={16} />
                        <span>Meu Perfil</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate('/favorites')
                          setShowUserMenu(false)
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        <Heart size={16} />
                        <span>Favoritos</span>
                      </button>
                      <hr className="border-gray-700 my-2" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors"
                      >
                        <LogOut size={16} />
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-300 hover:text-white p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
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
              className="md:hidden border-t border-gray-800 py-4"
            >
              <div className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                
                {isAuthenticated && (
                  <>
                    <hr className="border-gray-700 my-2" />
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <User size={20} />
                      <span>Meu Perfil</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <LogOut size={20} />
                      <span>Sair</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close menus */}
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
