import React from 'react';

interface BeachPartyBackgroundProps {
  className?: string;
  opacity?: number;
}

export default function BeachPartyBackground({ className = '', opacity = 0.4 }: BeachPartyBackgroundProps) {
  return (
    <div className={`fixed inset-0 overflow-hidden z-0 ${className}`}>
      {/* Beach Sunset Gradient Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(17, 24, 39, 0.95) 0%,
              rgba(31, 41, 55, 0.9) 15%,
              rgba(55, 65, 81, 0.8) 30%,
              rgba(120, 53, 15, 0.7) 50%,
              rgba(247, 158, 2, 0.6) 70%,
              rgba(251, 191, 36, 0.4) 85%,
              rgba(252, 211, 77, 0.3) 100%
            ),
            radial-gradient(
              ellipse at 75% 80%,
              rgba(247, 158, 2, 0.2) 0%,
              rgba(194, 65, 12, 0.1) 40%,
              transparent 70%
            )
          `,
          opacity: opacity
        }}
      />

      {/* Beach Party Silhouettes SVG */}
      <div className="absolute inset-0 flex items-end justify-center">
        <svg
          viewBox="0 0 1200 400"
          className="w-full h-2/3 opacity-60"
          style={{ transform: 'translateY(50px)' }}
        >
          {/* Beach ground */}
          <ellipse cx="600" cy="380" rx="500" ry="20" fill="rgba(0,0,0,0.3)" />
          
          {/* Bonfire */}
          <g transform="translate(600, 300)">
            {/* Fire flames with 30 BPM animation - DHR Orange Theme */}
            <path 
              d="M-15,60 Q-20,40 -10,20 Q0,0 10,20 Q20,40 15,60 Z" 
              fill="rgba(247, 158, 2, 0.8)"
              className="animate-pulse"
              style={{ animationDuration: '2s' }} // 30 BPM = 2 second intervals
            />
            <path 
              d="M-8,55 Q-12,35 -5,18 Q0,5 5,18 Q12,35 8,55 Z" 
              fill="rgba(251, 191, 36, 0.9)"
              className="animate-pulse"
              style={{ animationDuration: '2s', animationDelay: '0.3s' }}
            />
            <path 
              d="M-3,50 Q-6,32 -2,20 Q0,10 2,20 Q6,32 3,50 Z" 
              fill="rgba(252, 211, 77, 0.7)"
              className="animate-pulse"
              style={{ animationDuration: '2s', animationDelay: '0.6s' }}
            />
            
            {/* Logs */}
            <rect x="-25" y="55" width="50" height="8" rx="4" fill="rgba(0,0,0,0.6)" />
            <rect x="-20" y="50" width="40" height="6" rx="3" fill="rgba(0,0,0,0.5)" />
          </g>

          {/* Dancing People Silhouettes - 30 BPM synchronized movement */}
          
          {/* Dancer 1 - Left side */}
          <g transform="translate(450, 250)">
            <g className="animate-bounce" style={{ animationDuration: '2s', animationDelay: '0s' }}>
              {/* Head */}
              <circle cx="0" cy="0" r="12" fill="rgba(0,0,0,0.8)" />
              {/* Body */}
              <rect x="-6" y="12" width="12" height="35" rx="6" fill="rgba(0,0,0,0.8)" />
              {/* Arms - dancing position */}
              <rect x="-18" y="18" width="12" height="4" rx="2" fill="rgba(0,0,0,0.8)" transform="rotate(-20)" />
              <rect x="6" y="18" width="12" height="4" rx="2" fill="rgba(0,0,0,0.8)" transform="rotate(30)" />
              {/* Legs */}
              <rect x="-8" y="47" width="6" height="20" rx="3" fill="rgba(0,0,0,0.8)" />
              <rect x="2" y="47" width="6" height="20" rx="3" fill="rgba(0,0,0,0.8)" />
            </g>
          </g>

          {/* Dancer 2 - Right side */}
          <g transform="translate(750, 240)">
            <g className="animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.5s' }}>
              <circle cx="0" cy="0" r="10" fill="rgba(0,0,0,0.8)" />
              <rect x="-5" y="10" width="10" height="30" rx="5" fill="rgba(0,0,0,0.8)" />
              <rect x="-15" y="15" width="10" height="3" rx="2" fill="rgba(0,0,0,0.8)" transform="rotate(25)" />
              <rect x="5" y="15" width="10" height="3" rx="2" fill="rgba(0,0,0,0.8)" transform="rotate(-15)" />
              <rect x="-6" y="40" width="5" height="18" rx="3" fill="rgba(0,0,0,0.8)" />
              <rect x="1" y="40" width="5" height="18" rx="3" fill="rgba(0,0,0,0.8)" />
            </g>
          </g>

          {/* Dancer 3 - Behind fire */}
          <g transform="translate(570, 260)">
            <g className="animate-bounce" style={{ animationDuration: '2s', animationDelay: '1s' }}>
              <circle cx="0" cy="0" r="8" fill="rgba(0,0,0,0.6)" />
              <rect x="-4" y="8" width="8" height="25" rx="4" fill="rgba(0,0,0,0.6)" />
              <rect x="-12" y="12" width="8" height="3" rx="2" fill="rgba(0,0,0,0.6)" transform="rotate(-30)" />
              <rect x="4" y="12" width="8" height="3" rx="2" fill="rgba(0,0,0,0.6)" transform="rotate(20)" />
              <rect x="-5" y="33" width="4" height="15" rx="2" fill="rgba(0,0,0,0.6)" />
              <rect x="1" y="33" width="4" height="15" rx="2" fill="rgba(0,0,0,0.6)" />
            </g>
          </g>

          {/* Dancer 4 - Far left */}
          <g transform="translate(380, 270)">
            <g className="animate-bounce" style={{ animationDuration: '2s', animationDelay: '1.5s' }}>
              <circle cx="0" cy="0" r="11" fill="rgba(0,0,0,0.8)" />
              <rect x="-5" y="11" width="10" height="32" rx="5" fill="rgba(0,0,0,0.8)" />
              <rect x="-16" y="16" width="11" height="4" rx="2" fill="rgba(0,0,0,0.8)" transform="rotate(15)" />
              <rect x="5" y="16" width="11" height="4" rx="2" fill="rgba(0,0,0,0.8)" transform="rotate(-25)" />
              <rect x="-7" y="43" width="6" height="19" rx="3" fill="rgba(0,0,0,0.8)" />
              <rect x="1" y="43" width="6" height="19" rx="3" fill="rgba(0,0,0,0.8)" />
            </g>
          </g>

          {/* Dancer 5 - Far right */}
          <g transform="translate(820, 255)">
            <g className="animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.7s' }}>
              <circle cx="0" cy="0" r="9" fill="rgba(0,0,0,0.7)" />
              <rect x="-4" y="9" width="8" height="28" rx="4" fill="rgba(0,0,0,0.7)" />
              <rect x="-13" y="13" width="9" height="3" rx="2" fill="rgba(0,0,0,0.7)" transform="rotate(-10)" />
              <rect x="4" y="13" width="9" height="3" rx="2" fill="rgba(0,0,0,0.7)" transform="rotate(35)" />
              <rect x="-5" y="37" width="4" height="16" rx="2" fill="rgba(0,0,0,0.7)" />
              <rect x="1" y="37" width="4" height="16" rx="2" fill="rgba(0,0,0,0.7)" />
            </g>
          </g>

          {/* Dancing couple - center-left */}
          <g transform="translate(520, 245)">
            <g className="animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.2s' }}>
              {/* Person 1 */}
              <circle cx="-15" cy="0" r="10" fill="rgba(0,0,0,0.8)" />
              <rect x="-20" y="10" width="10" height="30" rx="5" fill="rgba(0,0,0,0.8)" />
              <rect x="-8" y="15" width="8" height="3" rx="2" fill="rgba(0,0,0,0.8)" />
              
              {/* Person 2 */}
              <circle cx="15" cy="0" r="9" fill="rgba(0,0,0,0.8)" />
              <rect x="10" y="9" width="10" height="28" rx="5" fill="rgba(0,0,0,0.8)" />
              <rect x="0" y="13" width="8" height="3" rx="2" fill="rgba(0,0,0,0.8)" />
            </g>
          </g>

          {/* Distant figure on beach */}
          <g transform="translate(680, 280)">
            <g className="animate-bounce" style={{ animationDuration: '2s', animationDelay: '1.2s' }}>
              <circle cx="0" cy="0" r="6" fill="rgba(0,0,0,0.5)" />
              <rect x="-3" y="6" width="6" height="20" rx="3" fill="rgba(0,0,0,0.5)" />
              <rect x="-8" y="9" width="6" height="2" rx="1" fill="rgba(0,0,0,0.5)" transform="rotate(20)" />
              <rect x="2" y="9" width="6" height="2" rx="1" fill="rgba(0,0,0,0.5)" transform="rotate(-20)" />
            </g>
          </g>
        </svg>
      </div>

      {/* Firelight glow effect - DHR Orange */}
      <div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle, rgba(247, 158, 2, 0.1) 0%, transparent 70%)`,
          animationDuration: '3s'
        }}
      />

      {/* Floating sparks - DHR Orange Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              backgroundColor: 'rgba(247, 158, 2, 0.3)',
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              left: `${45 + Math.random() * 10}%`,
              top: `${60 + Math.random() * 20}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Ocean waves silhouette */}
      <div className="absolute bottom-0 w-full h-20 opacity-40">
        <svg viewBox="0 0 1200 80" className="w-full h-full">
          <path 
            d="M0,40 Q300,20 600,40 T1200,40 L1200,80 L0,80 Z" 
            fill="rgba(0,0,0,0.3)"
            className="animate-pulse"
            style={{ animationDuration: '4s' }}
          />
        </svg>
      </div>
    </div>
  );
}