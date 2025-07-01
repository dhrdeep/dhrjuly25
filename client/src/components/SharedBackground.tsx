import React from 'react';

interface SharedBackgroundProps {
  className?: string;
  intensity?: 'subtle' | 'normal' | 'intense';
}

const SharedBackground: React.FC<SharedBackgroundProps> = ({ 
  className = '', 
  intensity = 'normal' 
}) => {
  const getIntensityStyles = () => {
    switch (intensity) {
      case 'subtle':
        return {
          orbOpacity: '4',
          orbSize: 'small',
          pulseDelay: '0.5s'
        };
      case 'intense':
        return {
          orbOpacity: '12',
          orbSize: 'large',
          pulseDelay: '0.2s'
        };
      default:
        return {
          orbOpacity: '8',
          orbSize: 'medium',
          pulseDelay: '0.3s'
        };
    }
  };

  const styles = getIntensityStyles();

  return (
    <div className={`fixed inset-0 pointer-events-none ${className}`}>
      {/* Main Background Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900" />
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/5 via-transparent to-orange-900/5" />
      
      {/* Deep Pulsating Orbs - 15 BPM Synchronized */}
      <div className={`absolute top-8 left-4 w-12 h-12 bg-orange-400/${styles.orbOpacity} rounded-full blur-lg animate-pulse`} 
           style={{ animationDuration: '4s', animationDelay: '0.2s' }}></div>
      <div className={`absolute top-1/3 right-4 w-16 h-16 bg-orange-500/${Math.floor(parseInt(styles.orbOpacity) * 0.75)} rounded-full blur-xl animate-pulse`} 
           style={{ animationDuration: '4s', animationDelay: '1.4s' }}></div>
      <div className={`absolute bottom-32 left-8 w-20 h-20 bg-orange-300/${Math.floor(parseInt(styles.orbOpacity) * 0.6)} rounded-full blur-2xl animate-pulse`} 
           style={{ animationDuration: '4s', animationDelay: '2.6s' }}></div>
      <div className={`absolute top-3/4 right-1/5 w-14 h-14 bg-orange-600/${Math.floor(parseInt(styles.orbOpacity) * 1.2)} rounded-full blur-xl animate-pulse`} 
           style={{ animationDuration: '4s', animationDelay: '3.8s' }}></div>
      <div className={`absolute top-20 left-1/4 w-18 h-18 bg-orange-400/${Math.floor(parseInt(styles.orbOpacity) * 0.9)} rounded-full blur-2xl animate-pulse`} 
           style={{ animationDuration: '4s', animationDelay: '0.6s' }}></div>
      <div className={`absolute bottom-16 right-8 w-22 h-22 bg-orange-500/${Math.floor(parseInt(styles.orbOpacity) * 0.5)} rounded-full blur-3xl animate-pulse`} 
           style={{ animationDuration: '4s', animationDelay: '2.2s' }}></div>
      <div className={`absolute top-1/2 left-2 w-16 h-16 bg-orange-300/${Math.floor(parseInt(styles.orbOpacity) * 1.1)} rounded-full blur-xl animate-pulse`} 
           style={{ animationDuration: '4s', animationDelay: '1.8s' }}></div>
      <div className={`absolute bottom-1/4 right-2 w-14 h-14 bg-orange-600/${Math.floor(parseInt(styles.orbOpacity) * 0.8)} rounded-full blur-lg animate-pulse`} 
           style={{ animationDuration: '4s', animationDelay: '3.4s' }}></div>
      <div className={`absolute top-2/3 right-3/4 w-24 h-24 bg-orange-400/${Math.floor(parseInt(styles.orbOpacity) * 0.5)} rounded-full blur-3xl animate-pulse`} 
           style={{ animationDuration: '4s', animationDelay: '1.2s' }}></div>
      <div className={`absolute bottom-2/3 left-3/4 w-18 h-18 bg-orange-500/${styles.orbOpacity} rounded-full blur-2xl animate-pulse`} 
           style={{ animationDuration: '4s', animationDelay: '2.8s' }}></div>

      {/* Ghostly Floating Particles */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-orange-300/20 rounded-full animate-ping" 
           style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
      <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-orange-400/30 rounded-full animate-ping" 
           style={{ animationDuration: '8s', animationDelay: '3s' }}></div>
      <div className="absolute top-1/2 left-1/6 w-3 h-3 bg-orange-200/15 rounded-full animate-ping" 
           style={{ animationDuration: '10s', animationDelay: '5s' }}></div>
      <div className="absolute bottom-1/5 right-1/3 w-2 h-2 bg-orange-500/25 rounded-full animate-ping" 
           style={{ animationDuration: '7s', animationDelay: '2s' }}></div>

      {/* Deep Atmospheric Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-slate-900/20" />
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/3 via-transparent to-orange-800/3" />
      
      {/* Subtle Noise Texture */}
      <div className="absolute inset-0 opacity-5" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
             backgroundSize: '100px 100px'
           }} />

      {/* Ultra-Deep Pulsating Vein Network */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-orange-400/20 to-transparent animate-pulse" 
             style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-400/15 to-transparent animate-pulse" 
             style={{ animationDuration: '12s', animationDelay: '4s' }}></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-orange-300/10 to-transparent animate-pulse" 
             style={{ animationDuration: '10s', animationDelay: '6s' }}></div>
        <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/10 to-transparent animate-pulse" 
             style={{ animationDuration: '14s', animationDelay: '1s' }}></div>
      </div>

      {/* Depth Enhancement - Multiple Layers */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-gray-900/20 to-gray-900/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-gray-900/20" />
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/2 via-transparent via-transparent to-orange-800/3" />
    </div>
  );
};

export default SharedBackground;