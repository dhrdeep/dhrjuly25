import React from 'react';

interface SunsetDanceBackgroundProps {
  className?: string;
  opacity?: number;
}

export default function SunsetDanceBackground({ className = '', opacity = 0.6 }: SunsetDanceBackgroundProps) {
  return (
    <div 
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      {/* Sunset Gradient Background matching the photo */}
      <div 
        className="absolute inset-0 animate-pulse"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(247, 158, 2, 0.95) 0%,
              rgba(251, 146, 60, 0.9) 20%,
              rgba(253, 186, 116, 0.85) 40%,
              rgba(254, 215, 170, 0.8) 60%,
              rgba(255, 237, 213, 0.7) 80%,
              rgba(17, 24, 39, 0.6) 100%
            )
          `,
          animationDuration: '6s'
        }}
      />

      {/* Water reflection at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 animate-pulse"
        style={{
          background: `linear-gradient(
            180deg,
            transparent 0%,
            rgba(17, 24, 39, 0.3) 50%,
            rgba(17, 24, 39, 0.6) 100%
          )`,
          animationDuration: '4s'
        }}
      />

      {/* Animated Dancing Silhouettes - 30 BPM = 2s per beat */}
      <div className="absolute inset-0">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1200 600"
          className="absolute inset-0"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Main dancing couple (center, like in photo) */}
          <g transform="translate(600, 350)">
            <path
              d="M-30,100 L-30,60 Q-30,45 -25,40 L-20,35 Q-15,30 -10,35 L-5,40 Q0,45 0,60 L0,80 L10,90 L15,100"
              fill="rgba(0, 0, 0, 0.9)"
              className="animate-bounce"
              style={{ animationDuration: '2s', animationDelay: '0s' }}
            />
            <path
              d="M10,100 L10,65 Q10,50 15,45 L20,40 Q25,35 30,40 L35,45 Q40,50 40,65 L35,85 L25,95 L15,100"
              fill="rgba(0, 0, 0, 0.9)"
              className="animate-bounce"
              style={{ animationDuration: '2s', animationDelay: '1s' }}
            />
            <line x1="0" y1="70" x2="20" y2="75" stroke="rgba(0, 0, 0, 0.9)" strokeWidth="3" />
          </g>

          {/* Left group of dancers */}
          <g transform="translate(200, 380)">
            <path
              d="M0,80 L0,40 Q0,25 5,20 L10,15 Q15,10 20,15 L25,20 Q30,25 30,40 L30,60 L35,70 L40,80"
              fill="rgba(0, 0, 0, 0.8)"
              className="animate-bounce"
              style={{ animationDuration: '2s', animationDelay: '0.5s' }}
            />
            <path
              d="M50,80 L50,45 Q50,30 55,25 L60,20 Q65,15 70,20 L75,25 Q80,30 80,45 L75,65 L65,75 L55,80"
              fill="rgba(0, 0, 0, 0.8)"
              className="animate-bounce"
              style={{ animationDuration: '2s', animationDelay: '1.5s' }}
            />
          </g>

          {/* Right group of dancers */}
          <g transform="translate(950, 370)">
            <path
              d="M0,90 L0,50 Q0,35 5,30 L10,25 Q15,20 20,25 L25,30 Q30,35 30,50 L30,70 L35,80 L40,90"
              fill="rgba(0, 0, 0, 0.8)"
              className="animate-bounce"
              style={{ animationDuration: '2s', animationDelay: '0.25s' }}
            />
            <path
              d="M50,90 L50,55 Q50,40 55,35 L60,30 Q65,25 70,30 L75,35 Q80,40 80,55 L75,75 L65,85 L55,90"
              fill="rgba(0, 0, 0, 0.8)"
              className="animate-bounce"
              style={{ animationDuration: '2s', animationDelay: '1.25s' }}
            />
          </g>

          {/* Far left individual dancers */}
          <g transform="translate(100, 400)">
            <path
              d="M0,60 L0,30 Q0,20 5,15 L10,10 Q15,5 20,10 L25,15 Q30,20 30,30 L30,45 L35,55 L40,60"
              fill="rgba(0, 0, 0, 0.7)"
              className="animate-bounce"
              style={{ animationDuration: '2s', animationDelay: '0.75s' }}
            />
          </g>

          {/* Far right individual dancers */}
          <g transform="translate(1100, 390)">
            <path
              d="M0,70 L0,35 Q0,25 5,20 L10,15 Q15,10 20,15 L25,20 Q30,25 30,35 L30,50 L35,60 L40,70"
              fill="rgba(0, 0, 0, 0.7)"
              className="animate-bounce"
              style={{ animationDuration: '2s', animationDelay: '1.75s' }}
            />
          </g>

          {/* Additional background figures */}
          <g transform="translate(400, 420)">
            <ellipse cx="20" cy="30" rx="8" ry="25" fill="rgba(0, 0, 0, 0.6)" className="animate-pulse" style={{ animationDuration: '2s' }} />
            <ellipse cx="50" cy="28" rx="8" ry="25" fill="rgba(0, 0, 0, 0.6)" className="animate-pulse" style={{ animationDuration: '2s' }} />
          </g>

          <g transform="translate(750, 410)">
            <ellipse cx="20" cy="35" rx="8" ry="30" fill="rgba(0, 0, 0, 0.6)" className="animate-pulse" style={{ animationDuration: '2s' }} />
            <ellipse cx="60" cy="32" rx="8" ry="28" fill="rgba(0, 0, 0, 0.6)" className="animate-pulse" style={{ animationDuration: '2s' }} />
          </g>
        </svg>
      </div>

      {/* Sun disc - matching the photo's sun position */}
      <div 
        className="absolute animate-pulse"
        style={{
          top: '45%',
          left: '65%',
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(254, 215, 170, 0.7) 40%, transparent 70%)',
          borderRadius: '50%',
          animationDuration: '4s'
        }}
      />

      {/* Water reflection of sun */}
      <div 
        className="absolute bottom-16 animate-pulse"
        style={{
          left: '65%',
          width: '60px',
          height: '40px',
          background: 'linear-gradient(180deg, rgba(247, 158, 2, 0.4) 0%, transparent 100%)',
          borderRadius: '50%',
          transform: 'scaleY(0.5)',
          animationDuration: '4s',
          animationDelay: '1s'
        }}
      />

      {/* Gentle water ripples */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 left-0 right-0 border-t-2 animate-pulse"
            style={{
              borderColor: `rgba(247, 158, 2, ${0.1 + i * 0.05})`,
              height: `${8 + i * 4}px`,
              animationDuration: `${3 + i * 0.5}s`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
      </div>

      {/* Atmospheric particles floating */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-bounce opacity-30"
            style={{
              backgroundColor: 'rgba(254, 215, 170, 0.6)',
              width: '3px',
              height: '3px',
              left: `${20 + i * 8}%`,
              top: `${30 + i * 3}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s'
            }}
          />
        ))}
      </div>
    </div>
  );
}