import React, { useRef, useEffect, useState } from 'react';

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
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      console.log('Video can play - attempting to start...');
      setIsLoaded(true);
      video.play().catch((error) => {
        console.error('Video play failed:', error);
        setHasError(true);
      });
    };

    const handleLoadedData = () => {
      console.log('Video data loaded');
      video.currentTime = 0;
    };

    const handleError = (e: Event) => {
      console.error('Video error:', e);
      setHasError(true);
    };

    video.addEventListener('canplaythrough', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    
    // Ensure video loops seamlessly
    video.addEventListener('ended', () => {
      video.currentTime = 0;
      video.play().catch(console.error);
    });

    return () => {
      video.removeEventListener('canplaythrough', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
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
        <source src="/Video_Ready_Deep_House_Sunset_1751327610493.mp4" type="video/mp4" />
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

      {/* Cinematic Sunset Background - Always Visible */}
      <div className="absolute inset-0">
        {/* Deep House Sunset Gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(
                180deg,
                rgba(31, 41, 55, 0.95) 0%,
                rgba(75, 85, 99, 0.85) 20%,
                rgba(120, 53, 15, 0.6) 40%,
                rgba(194, 65, 12, 0.4) 60%,
                rgba(251, 146, 60, 0.3) 80%,
                rgba(252, 211, 77, 0.2) 100%
              ),
              radial-gradient(
                ellipse at 70% 20%,
                rgba(252, 211, 77, 0.15) 0%,
                rgba(251, 146, 60, 0.1) 30%,
                transparent 70%
              ),
              radial-gradient(
                ellipse at 30% 70%,
                rgba(147, 51, 234, 0.08) 0%,
                rgba(79, 70, 229, 0.05) 40%,
                transparent 70%
              )
            `
          }}
        />
        
        {/* Animated Sunset Layers */}
        <div 
          className="absolute inset-0 animate-pulse"
          style={{
            background: `
              radial-gradient(
                circle at 75% 25%,
                rgba(251, 146, 60, 0.08) 0%,
                transparent 50%
              )
            `,
            animationDuration: '8s'
          }}
        />
        
        {/* Silhouette Effect Layer */}
        <div className="absolute inset-0 bg-black/20" />
      </div>
    </div>
  );
}