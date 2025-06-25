import React, { useState, useEffect, useRef } from 'react';

interface Track {
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  bpm?: number;
  energy?: number; // 0-100
  mood?: string;
}

interface MoodConfig {
  colors: string[];
  particles: number;
  speed: number;
  opacity: number;
  blur: number;
  gradient: string;
  pulseIntensity: number;
}

interface AmbientMoodGeneratorProps {
  currentTrack?: Track;
  isPlaying: boolean;
  className?: string;
}

const moodConfigs: Record<string, MoodConfig> = {
  energetic: {
    colors: ['#ff6b35', '#f7a800', '#ff9500', '#e74c3c'],
    particles: 150,
    speed: 2.5,
    opacity: 0.8,
    blur: 2,
    gradient: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, rgba(247,168,0,0.05) 50%, transparent 100%)',
    pulseIntensity: 1.2
  },
  chill: {
    colors: ['#3498db', '#2ecc71', '#1abc9c', '#16a085'],
    particles: 80,
    speed: 1.2,
    opacity: 0.6,
    blur: 3,
    gradient: 'radial-gradient(circle, rgba(52,152,219,0.08) 0%, rgba(46,204,113,0.04) 50%, transparent 100%)',
    pulseIntensity: 0.8
  },
  deep: {
    colors: ['#9b59b6', '#8e44ad', '#663399', '#4a235a'],
    particles: 100,
    speed: 1.8,
    opacity: 0.7,
    blur: 4,
    gradient: 'radial-gradient(circle, rgba(155,89,182,0.1) 0%, rgba(142,68,173,0.05) 50%, transparent 100%)',
    pulseIntensity: 1.0
  },
  dark: {
    colors: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6'],
    particles: 60,
    speed: 1.0,
    opacity: 0.5,
    blur: 5,
    gradient: 'radial-gradient(circle, rgba(44,62,80,0.1) 0%, rgba(52,73,94,0.05) 50%, transparent 100%)',
    pulseIntensity: 0.6
  },
  uplifting: {
    colors: ['#f39c12', '#e67e22', '#d35400', '#f79e02'],
    particles: 120,
    speed: 2.0,
    opacity: 0.7,
    blur: 2,
    gradient: 'radial-gradient(circle, rgba(243,156,18,0.1) 0%, rgba(230,126,34,0.05) 50%, transparent 100%)',
    pulseIntensity: 1.1
  },
  ambient: {
    colors: ['#ecf0f1', '#bdc3c7', '#95a5a6', '#7f8c8d'],
    particles: 40,
    speed: 0.8,
    opacity: 0.4,
    blur: 6,
    gradient: 'radial-gradient(circle, rgba(236,240,241,0.08) 0%, rgba(189,195,199,0.04) 50%, transparent 100%)',
    pulseIntensity: 0.5
  }
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export default function AmbientMoodGenerator({ currentTrack, isPlaying, className = '' }: AmbientMoodGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const [currentMood, setCurrentMood] = useState<MoodConfig>(moodConfigs.ambient);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Analyze track and determine mood
  const analyzeMood = (track: Track): MoodConfig => {
    if (!track) return moodConfigs.ambient;

    const title = track.title.toLowerCase();
    const artist = track.artist.toLowerCase();
    const genre = track.genre?.toLowerCase() || '';

    // Energy-based analysis
    if (track.bpm && track.bpm > 128) {
      return moodConfigs.energetic;
    }

    // Keyword-based mood detection
    if (title.includes('chill') || title.includes('relax') || artist.includes('ambient')) {
      return moodConfigs.chill;
    }

    if (title.includes('deep') || genre.includes('deep') || artist.includes('deep')) {
      return moodConfigs.deep;
    }

    if (title.includes('dark') || title.includes('minimal') || genre.includes('minimal')) {
      return moodConfigs.dark;
    }

    if (title.includes('uplifting') || title.includes('progressive') || genre.includes('progressive')) {
      return moodConfigs.uplifting;
    }

    // Default based on genre
    if (genre.includes('house')) {
      return moodConfigs.uplifting;
    }

    if (genre.includes('techno')) {
      return moodConfigs.energetic;
    }

    return moodConfigs.ambient;
  };

  // Update mood when track changes
  useEffect(() => {
    if (currentTrack) {
      const newMood = analyzeMood(currentTrack);
      setCurrentMood(newMood);
    }
  }, [currentTrack]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize particles
  const initializeParticles = () => {
    particlesRef.current = [];
    for (let i = 0; i < currentMood.particles; i++) {
      createParticle();
    }
  };

  // Create a new particle
  const createParticle = () => {
    const particle: Particle = {
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      vx: (Math.random() - 0.5) * currentMood.speed,
      vy: (Math.random() - 0.5) * currentMood.speed,
      size: Math.random() * 4 + 1,
      color: currentMood.colors[Math.floor(Math.random() * currentMood.colors.length)],
      life: 0,
      maxLife: Math.random() * 300 + 100
    };
    particlesRef.current.push(particle);
  };

  // Update particle system
  const updateParticles = () => {
    if (!isPlaying) return;

    particlesRef.current.forEach((particle, index) => {
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Update life
      particle.life++;

      // Wrap around screen
      if (particle.x < 0) particle.x = dimensions.width;
      if (particle.x > dimensions.width) particle.x = 0;
      if (particle.y < 0) particle.y = dimensions.height;
      if (particle.y > dimensions.height) particle.y = 0;

      // Remove dead particles
      if (particle.life > particle.maxLife) {
        particlesRef.current.splice(index, 1);
        createParticle(); // Replace with new particle
      }
    });
  };

  // Render particles
  const renderParticles = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    if (!isPlaying) return;

    // Apply blur effect
    ctx.filter = `blur(${currentMood.blur}px)`;

    particlesRef.current.forEach(particle => {
      const alpha = (1 - particle.life / particle.maxLife) * currentMood.opacity;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Reset filter and alpha
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
  };

  // Animation loop
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    updateParticles();
    renderParticles(ctx);

    animationRef.current = requestAnimationFrame(animate);
  };

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && dimensions.width > 0) {
      initializeParticles();
      animate();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, currentMood, dimensions]);

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      {/* Gradient Background */}
      <div
        className="absolute inset-0 transition-all duration-3000 ease-out"
        style={{
          background: currentMood.gradient,
          opacity: isPlaying ? 1 : 0
        }}
      />
      
      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: isPlaying ? 1 : 0,
          transition: 'opacity 1s ease-out'
        }}
      />

      {/* Pulse Effect */}
      {isPlaying && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${currentMood.colors[0]}15 0%, transparent 70%)`,
            animation: `pulse ${60 / (currentTrack?.bpm || 120)}s ease-in-out infinite`,
            transform: `scale(${currentMood.pulseIntensity})`
          }}
        />
      )}

      {/* Track Info Overlay */}
      {currentTrack && isPlaying && (
        <div className="absolute bottom-4 right-4 bg-black/20 backdrop-blur-sm rounded-lg p-2 text-white text-xs">
          <div className="opacity-60">
            Mood: {Object.keys(moodConfigs).find(key => moodConfigs[key] === currentMood) || 'ambient'}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}