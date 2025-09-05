
import React, { useState, useEffect } from 'react'
import { Play, ExternalLink, Star, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { lumi } from '../lib/lumi'

interface StreamingService {
  _id: string
  service_name: string
  service_url: string
  availability: string
  subscription_required: boolean
  region: string
  language: string
}

interface StreamingServicesProps {
  animeId: string
}

const StreamingServices: React.FC<StreamingServicesProps> = ({ animeId }) => {
  const [services, setServices] = useState<StreamingService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStreamingServices = async () => {
      try {
        const { list } = await lumi.entities.streaming_services.list({
          filter: { anime_id: animeId }
        })
        setServices(list)
      } catch (error) {
        console.error('Erro ao carregar serviços de streaming:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStreamingServices()
  }, [animeId])

  const getServiceIcon = (serviceName: string) => {
    const icons: Record<string, string> = {
      'Crunchyroll': '🧡',
      'Netflix': '🔴',
      'Funimation': '💜',
      'Amazon Prime': '💙',
      'Hulu': '💚',
      'Disney+': '⭐'
    }
    return icons[serviceName] || '📺'
  }

  const getServiceColor = (serviceName: string) => {
    const colors: Record<string, string> = {
      'Crunchyroll': 'from-orange-500 to-orange-600',
      'Netflix': 'from-red-500 to-red-600',
      'Funimation': 'from-purple-500 to-purple-600',
      'Amazon Prime': 'from-blue-500 to-blue-600',
      'Hulu': 'from-green-500 to-green-600',
      'Disney+': 'from-blue-400 to-purple-500'
    }
    return colors[serviceName] || 'from-gray-500 to-gray-600'
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Onde Assistir</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Onde Assistir</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-2">📺</div>
          <p className="text-gray-400">Serviços de streaming não encontrados</p>
          <p className="text-gray-500 text-sm mt-1">
            Verifique outros sites ou aguarde disponibilização
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
        <Play size={20} />
        <span>Onde Assistir</span>
      </h3>

      <div className="space-y-3">
        {services.map((service, index) => (
          <motion.div
            key={service._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-r ${getServiceColor(service.service_name)} rounded-lg p-4 hover:scale-105 transition-transform duration-200`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getServiceIcon(service.service_name)}
                </div>
                <div>
                  <h4 className="text-white font-semibold flex items-center space-x-2">
                    <span>{service.service_name}</span>
                    {service.subscription_required && (
                      <Crown size={16} className="text-yellow-300" />
                    )}
                  </h4>
                  <div className="flex items-center space-x-2 text-sm text-white/80">
                    <span className="capitalize">{service.language}</span>
                    <span>•</span>
                    <span>{service.region}</span>
                    {service.availability === 'disponivel' && (
                      <>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Star size={12} className="fill-current" />
                          <span>Disponível</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {service.subscription_required && (
                  <span className="bg-black/30 text-white text-xs px-2 py-1 rounded">
                    Premium
                  </span>
                )}
                
                <a
                  href={service.service_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-colors"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>

            {service.availability === 'em_breve' && (
              <div className="mt-2 text-center">
                <span className="bg-yellow-500/20 text-yellow-300 text-xs px-3 py-1 rounded-full">
                  Em breve
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <p className="text-gray-400 text-sm">
          💡 Dica: Verifique a disponibilidade em sua região
        </p>
      </div>
    </div>
  )
}

export default StreamingServices
