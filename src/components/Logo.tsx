import React from 'react'

interface LogoProps {
  size?: number
  className?: string
  showText?: boolean
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '', showText = false }) => {
  return (
    <div className={`inline-flex items-center space-x-2.5 ${className}`}>
      <div 
        style={{ width: size, height: size }}
        className="relative shrink-0 flex items-center justify-center"
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_8px_rgba(239,68,68,0.25)]"
        >
          {/* Base do Emblema */}
          <rect width="40" height="40" rx="10" fill="#121215" stroke="#27272a" strokeWidth="1.5" />
          
          {/* Haste Vertical do K */}
          <path d="M12 9V31" stroke="#f4f4f5" strokeWidth="3.2" strokeLinecap="round" />
          
          {/* Braço Superior com corte angular */}
          <path d="M27 10L14 21" stroke="#f4f4f5" strokeWidth="3.2" strokeLinecap="round" />
          
          {/* Lâmina / Golpe Carmesim (Katana Slash) */}
          <path d="M16 17L28 31" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
          
          {/* Faísca de corte no ápice */}
          <path d="M25 9.5L29 13.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <span className="text-zinc-100 text-lg font-bold tracking-tight">
          Kuneda <span className="text-red-500">Animes</span>
        </span>
      )}
    </div>
  )
}

export default Logo