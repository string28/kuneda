
import React from 'react'
import { motion } from 'framer-motion'
import {Chrome, Facebook, Mail, User} from 'lucide-react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface SocialLoginProps {
  onClose?: () => void
}

const SocialLogin: React.FC<SocialLoginProps> = ({ onClose }) => {
  const handleGoogleLogin = async () => {
    try {
      // Implementação do login com Google
      toast.success('Login com Google em desenvolvimento')
      // await lumi.auth.signInWithProvider('google')
    } catch (error) {
      toast.error('Erro ao fazer login com Google')
    }
  }

  const handleFacebookLogin = async () => {
    try {
      // Implementação do login com Facebook
      toast.success('Login com Facebook em desenvolvimento')
      // await lumi.auth.signInWithProvider('facebook')
    } catch (error) {
      toast.error('Erro ao fazer login com Facebook')
    }
  }

  const handleEmailLogin = async () => {
    try {
      await lumi.auth.signIn()
      onClose?.()
    } catch (error) {
      toast.error('Erro ao fazer login')
    }
  }

  const handleCreateAccount = async () => {
    try {
      // Implementação da criação de conta
      toast.success('Criação de conta em desenvolvimento')
      // await lumi.auth.signUp()
    } catch (error) {
      toast.error('Erro ao criar conta')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-gray-800 rounded-xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Entrar na Comunidade</h2>
          <p className="text-gray-400">
            Conecte-se com outros fãs de anime e compartilhe suas experiências
          </p>
        </div>

        <div className="space-y-4">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Chrome size={20} />
            <span>Continuar com Google</span>
          </button>

          {/* Facebook Login */}
          <button
            onClick={handleFacebookLogin}
            className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Facebook size={20} />
            <span>Continuar com Facebook</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">ou</span>
            </div>
          </div>

          {/* Email Login */}
          <button
            onClick={handleEmailLogin}
            className="w-full flex items-center justify-center space-x-3 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Mail size={20} />
            <span>Entrar com Email</span>
          </button>

          {/* Create Account */}
          <button
            onClick={handleCreateAccount}
            className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <User size={20} />
            <span>Criar Nova Conta</span>
          </button>
        </div>

        {/* Terms */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Ao continuar, você concorda com nossos{' '}
          <a href="#" className="text-blue-400 hover:underline">
            Termos de Uso
          </a>{' '}
          e{' '}
          <a href="#" className="text-blue-400 hover:underline">
            Política de Privacidade
          </a>
        </p>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </motion.div>
    </div>
  )
}

export default SocialLogin
