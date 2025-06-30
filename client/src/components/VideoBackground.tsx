import React, { useRef, useEffect, useState } from 'react';
import videoSrc from '@assets/Video_Ready_Deep_House_Sunset_1751327610493.mp4';

interface VideoBackgroundProps {
  className?: string;
  opacity?: number;
  overlay?: 'dark' | 'gradient' | 'none';
  silhouette?: boolean;
}

export default function VideoBackground({ 
  className = '', 
  opacity = 0.3, 
  overlay = 'dark',
  silhouette = true 
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoaded(true);
      video.play().catch(console.error);
    };

    const handleLoadedData = () => {
      video.currentTime = 0;
    };

    video.addEventListener('canplaythrough', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    
    // Ensure video loops seamlessly
    video.addEventListener('ended', () => {
      video.currentTime = 0;
      video.play().catch(console.error);
    });

    return () => {
      video.removeEventListener('canplaythrough', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, []);

  const overlayStyles = {
    dark: 'bg-black/60',
    gradient: 'bg-gradient-to-b from-black/80 via-black/40 to-black/80',
    none: ''
  };

  const videoFilters = silhouette 
    ? 'brightness(0.2) contrast(2) saturate(0.1) blur(1px)' 
    : 'brightness(0.4) contrast(1.2) saturate(0.8)';

  return (
    <div className={`fixed inset-0 overflow-hidden z-0 ${className}`}>
      {/* Video Background */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          opacity: opacity,
          filter: videoFilters
        }}
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Overlay */}
      {overlay !== 'none' && (
        <div className={`absolute inset-0 ${overlayStyles[overlay]}`} />
      )}

      {/* DHR Logo Watermark Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5"
          style={{
            background: `radial-gradient(circle, rgba(247, 158, 2, 0.1) 0%, transparent 70%)`,
            width: '60vw',
            height: '60vh',
            filter: 'blur(100px)'
          }}
        />
      </div>

      {/* Ambient Particles for Extra Atmosphere */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-orange-400/10 rounded-full animate-pulse"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 6}s`
            }}
          />
        ))}
      </div>

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute bg-gradient-to-br from-orange-400/5 to-amber-400/5 rounded-full blur-sm animate-float"
            style={{
              width: `${20 + Math.random() * 40}px`,
              height: `${20 + Math.random() * 40}px`,
              left: `${Math.random() * 90}%`,
              top: `${Math.random() * 90}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 12}s`
            }}
          />
        ))}
      </div>

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
      )}
    </div>
  );
}