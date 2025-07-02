import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
}

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  health: number;
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

type GameState = 'start' | 'playing' | 'paused' | 'gameOver';

const SpaceDefender = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>();
  const audioContextRef = useRef<AudioContext>();
  
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  const playerRef = useRef<Player>({
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    speed: 6,
    color: '#00f5ff'
  });
  
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  const keysRef = useRef<{[key: string]: boolean}>({});
  const lastShotTimeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const enemySpawnTimerRef = useRef(0);
  const enemySpawnDelayRef = useRef(2000);

  const shotDelay = 150;
  const playerSpeed = 6;
  const bulletSpeed = 8;
  const enemySpeed = 2;

  // Initialize canvas and game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const maxWidth = Math.min(window.innerWidth - 40, 1200);
      const maxHeight = Math.min(window.innerHeight - 40, 800);
      
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      
      // Reset player position when canvas resizes
      playerRef.current = {
        ...playerRef.current,
        x: maxWidth / 2,
        y: maxHeight - 80
      };
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Audio setup
  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio initialization failed:', error);
    }
  }, []);

  // Keyboard event handlers
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key.toLowerCase()] = true;
    
    switch (e.key.toLowerCase()) {
      case 'p':
        if (gameState === 'playing') {
          setGameState('paused');
        } else if (gameState === 'paused') {
          setGameState('playing');
        }
        break;
      case ' ':
        if (gameState === 'playing') {
          shoot();
        }
        e.preventDefault();
        break;
      case 'enter':
        if (gameState === 'start') {
          startGame();
        } else if (gameState === 'gameOver') {
          restartGame();
        }
        break;
    }
  }, [gameState]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current[e.key.toLowerCase()] = false;
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Touch controls
  const handleTouchStart = useCallback((direction: string) => {
    keysRef.current[direction] = true;
  }, []);

  const handleTouchEnd = useCallback((direction: string) => {
    keysRef.current[direction] = false;
  }, []);

  // Game logic functions
  const playSound = useCallback((type: 'shoot' | 'explosion' | 'gameOver') => {
    if (!audioContextRef.current) return;
    
    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
      case 'shoot':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'explosion':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'gameOver':
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 1);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
        break;
    }
  }, []);

  const shoot = useCallback(() => {
    const currentTime = Date.now();
    if (currentTime - lastShotTimeRef.current > shotDelay) {
      bulletsRef.current.push({
        x: playerRef.current.x,
        y: playerRef.current.y - 10,
        width: 4,
        height: 15,
        speed: bulletSpeed,
        color: '#ffff00'
      });
      
      lastShotTimeRef.current = currentTime;
      playSound('shoot');
    }
  }, [playSound]);

  const spawnEnemy = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const enemyWidth = 30;
    const x = Math.random() * (canvas.width - enemyWidth);
    
    enemiesRef.current.push({
      x: x,
      y: -enemyWidth,
      width: enemyWidth,
      height: enemyWidth,
      speed: enemySpeed + Math.random() * 2,
      color: '#ff4081',
      health: 1
    });
  }, []);

  const createExplosion = useCallback((x: number, y: number) => {
    explosionsRef.current.push({
      x: x,
      y: y,
      radius: 5,
      maxRadius: 40,
      alpha: 1,
      color: '#ff6b35'
    });
    
    // Create particle effects
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color: `hsl(${Math.random() * 60 + 15}, 100%, 60%)`
      });
    }
  }, []);

  const isColliding = useCallback((obj1: any, obj2: any) => {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  }, []);

  const takeDamage = useCallback(() => {
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameState('gameOver');
        playSound('gameOver');
      }
      return newLives;
    });
  }, [playSound]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    explosionsRef.current = [];
    enemySpawnTimerRef.current = 0;
    enemySpawnDelayRef.current = 2000;
    
    const canvas = canvasRef.current;
    if (canvas) {
      playerRef.current = {
        ...playerRef.current,
        x: canvas.width / 2,
        y: canvas.height - 80
      };
    }
  }, []);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  const returnToMenu = useCallback(() => {
    setGameState('start');
  }, []);

  // Game update loop
  const update = useCallback((deltaTime: number) => {
    if (gameState !== 'playing') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update player
    if ((keysRef.current['a'] || keysRef.current['arrowleft']) && playerRef.current.x > 0) {
      playerRef.current.x -= playerRef.current.speed;
    }
    if ((keysRef.current['d'] || keysRef.current['arrowright']) && playerRef.current.x < canvas.width - playerRef.current.width) {
      playerRef.current.x += playerRef.current.speed;
    }
    
    // Continuous shooting
    if (keysRef.current[' ']) {
      shoot();
    }

    // Update bullets
    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
      const bullet = bulletsRef.current[i];
      bullet.y -= bullet.speed;
      
      if (bullet.y < -bullet.height) {
        bulletsRef.current.splice(i, 1);
      }
    }

    // Update enemies
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const enemy = enemiesRef.current[i];
      enemy.y += enemy.speed;
      
      if (enemy.y > canvas.height) {
        enemiesRef.current.splice(i, 1);
        takeDamage();
      }
    }

    // Spawn enemies
    enemySpawnTimerRef.current += deltaTime;
    if (enemySpawnTimerRef.current > enemySpawnDelayRef.current) {
      spawnEnemy();
      enemySpawnTimerRef.current = 0;
      enemySpawnDelayRef.current = Math.max(800, enemySpawnDelayRef.current - 5);
    }

    // Check collisions
    for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
      const bullet = bulletsRef.current[i];
      
      for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
        const enemy = enemiesRef.current[j];
        
        if (isColliding(bullet, enemy)) {
          createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          bulletsRef.current.splice(i, 1);
          enemiesRef.current.splice(j, 1);
          setScore(prev => prev + 100);
          playSound('explosion');
          break;
        }
      }
    }

    // Player-Enemy collisions
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const enemy = enemiesRef.current[i];
      
      if (isColliding(playerRef.current, enemy)) {
        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        enemiesRef.current.splice(i, 1);
        takeDamage();
        playSound('explosion');
      }
    }

    // Update explosions
    for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
      const explosion = explosionsRef.current[i];
      explosion.radius += 2;
      explosion.alpha -= 0.05;
      
      if (explosion.alpha <= 0 || explosion.radius >= explosion.maxRadius) {
        explosionsRef.current.splice(i, 1);
      }
    }

    // Update particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const particle = particlesRef.current[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.02;
      particle.vy += 0.1; // gravity
      
      if (particle.life <= 0) {
        particlesRef.current.splice(i, 1);
      }
    }
  }, [gameState, shoot, spawnEnemy, createExplosion, isColliding, takeDamage, playSound]);

  // Render functions
  const renderBackground = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37 + time * 0.02) % canvas.width;
      const y = (i * 47 + time * 0.01) % canvas.height;
      const size = Math.sin(i + time * 0.001) * 2 + 2;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const renderPlayer = useCallback((ctx: CanvasRenderingContext2D) => {
    const p = playerRef.current;
    
    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
    
    // Ship body
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    ctx.moveTo(0, -p.height / 2);
    ctx.lineTo(-p.width / 3, p.height / 2);
    ctx.lineTo(-p.width / 6, p.height / 3);
    ctx.lineTo(p.width / 6, p.height / 3);
    ctx.lineTo(p.width / 3, p.height / 2);
    ctx.closePath();
    ctx.fill();
    
    // Engine glow
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    ctx.moveTo(-p.width / 6, p.height / 3);
    ctx.lineTo(0, p.height / 2 + 10);
    ctx.lineTo(p.width / 6, p.height / 3);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }, []);

  const renderBullets = useCallback((ctx: CanvasRenderingContext2D) => {
    bulletsRef.current.forEach(bullet => {
      ctx.fillStyle = bullet.color;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 8;
      
      ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
    });
  }, []);

  const renderEnemies = useCallback((ctx: CanvasRenderingContext2D) => {
    enemiesRef.current.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
      
      ctx.fillStyle = enemy.color;
      ctx.shadowColor = enemy.color;
      ctx.shadowBlur = 10;
      
      // Enemy ship design
      ctx.beginPath();
      ctx.moveTo(0, enemy.height / 2);
      ctx.lineTo(-enemy.width / 2, -enemy.height / 3);
      ctx.lineTo(-enemy.width / 4, -enemy.height / 2);
      ctx.lineTo(enemy.width / 4, -enemy.height / 2);
      ctx.lineTo(enemy.width / 2, -enemy.height / 3);
      ctx.closePath();
      ctx.fill();
      
      // Enemy details
      ctx.fillStyle = '#fff';
      ctx.fillRect(-2, -5, 4, 4);
      
      ctx.restore();
    });
  }, []);

  const renderExplosions = useCallback((ctx: CanvasRenderingContext2D) => {
    explosionsRef.current.forEach(explosion => {
      ctx.save();
      ctx.globalAlpha = explosion.alpha;
      
      const gradient = ctx.createRadialGradient(
        explosion.x, explosion.y, 0,
        explosion.x, explosion.y, explosion.radius
      );
      gradient.addColorStop(0, explosion.color);
      gradient.addColorStop(0.7, '#ffff00');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }, []);

  const renderParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 5;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }, []);

  // Main game loop
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Render background
    renderBackground(ctx, currentTime);
    
    if (gameState === 'playing' || gameState === 'paused') {
      update(deltaTime);
      
      // Render game objects
      renderPlayer(ctx);
      renderBullets(ctx);
      renderEnemies(ctx);
      renderExplosions(ctx);
      renderParticles(ctx);
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, update, renderBackground, renderPlayer, renderBullets, renderEnemies, renderExplosions, renderParticles]);

  // Start game loop
  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameLoop]);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-black overflow-hidden">
      {/* Animated star background */}
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: `
            radial-gradient(2px 2px at 20px 30px, #eee, transparent),
            radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 90px 40px, #fff, transparent),
            radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent),
            radial-gradient(2px 2px at 160px 30px, #fff, transparent)
          `,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 100px',
          animation: 'twinkle 4s ease-in-out infinite alternate'
        }}
      />

      {/* Start Screen */}
      {gameState === 'start' && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center space-y-8 p-8">
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
              SPACE DEFENDER
            </h1>
            <p className="text-xl text-blue-300 font-medium">Defend Earth from alien invasion</p>
            <Button 
              onClick={startGame}
              className="px-12 py-6 text-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black shadow-lg shadow-cyan-500/25 transform hover:scale-105 transition-all duration-200"
            >
              START GAME
            </Button>
            <div className="text-sm text-gray-400 space-y-1 mt-8">
              <p className="text-cyan-400 font-semibold">Controls:</p>
              <p>A/D or Arrow Keys - Move</p>
              <p>Spacebar - Shoot</p>
              <p>P - Pause</p>
            </div>
          </div>
        </div>
      )}

      {/* Game Screen */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <>
          <canvas 
            ref={canvasRef}
            className="border-2 border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 mx-auto mt-5"
          />
          
          {/* Game UI */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
            <div className="flex justify-between items-start p-8">
              <div className="bg-black/70 backdrop-blur-md px-6 py-4 rounded-lg border border-cyan-500/30">
                <div className="text-sm text-cyan-400 font-bold mb-2 tracking-wider">SCORE</div>
                <div className="text-3xl font-bold text-white">{score}</div>
              </div>
              <div className="bg-black/70 backdrop-blur-md px-6 py-4 rounded-lg border border-cyan-500/30">
                <div className="text-sm text-cyan-400 font-bold mb-2 tracking-wider">LIVES</div>
                <div className="flex space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-6 h-6 rounded-full border-2 ${
                        i < lives 
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 border-pink-500 shadow-lg shadow-pink-500/50' 
                          : 'bg-gray-600 border-gray-500'
                      }`}
                    >
                      {i < lives && <div className="text-white text-center text-sm leading-5">♥</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pause Overlay */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
              <div className="text-center bg-black/90 backdrop-blur-xl p-12 rounded-2xl border-2 border-cyan-500/50 shadow-2xl">
                <h2 className="text-5xl font-bold text-cyan-400 mb-4">PAUSED</h2>
                <p className="text-xl text-gray-300">Press P to resume</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameOver' && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center space-y-8 p-8">
            <h1 className="text-5xl md:text-6xl font-black text-red-500 animate-pulse">GAME OVER</h1>
            <div className="bg-black/50 backdrop-blur-md p-8 rounded-xl border border-cyan-500/30">
              <p className="text-xl text-cyan-400 mb-2">Final Score</p>
              <span className="text-4xl font-bold text-white">{score}</span>
            </div>
            <div className="space-x-4">
              <Button 
                onClick={restartGame}
                className="px-8 py-4 text-lg font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-black"
              >
                PLAY AGAIN
              </Button>
              <Button 
                onClick={returnToMenu}
                variant="outline"
                className="px-8 py-4 text-lg font-bold border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black"
              >
                MAIN MENU
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Controls */}
      <div className="md:hidden fixed bottom-5 left-0 right-0 flex justify-between items-end px-5 pointer-events-none z-40">
        <div className="flex flex-col items-center space-y-3 pointer-events-auto">
          <div className="flex space-x-3">
            <button
              onTouchStart={() => handleTouchStart('a')}
              onTouchEnd={() => handleTouchEnd('a')}
              className="w-16 h-16 bg-cyan-500/20 border-2 border-cyan-500/50 rounded-xl flex items-center justify-center text-cyan-400 text-2xl font-bold backdrop-blur-md active:bg-cyan-500/40 active:border-cyan-500 transition-all"
            >
              ←
            </button>
            <button
              onTouchStart={() => handleTouchStart('d')}
              onTouchEnd={() => handleTouchEnd('d')}
              className="w-16 h-16 bg-cyan-500/20 border-2 border-cyan-500/50 rounded-xl flex items-center justify-center text-cyan-400 text-2xl font-bold backdrop-blur-md active:bg-cyan-500/40 active:border-cyan-500 transition-all"
            >
              →
            </button>
          </div>
        </div>
        
        <button
          onTouchStart={() => handleTouchStart(' ')}
          onTouchEnd={() => handleTouchEnd(' ')}
          className="w-20 h-20 bg-yellow-500/20 border-3 border-yellow-500/50 rounded-full flex items-center justify-center text-yellow-400 text-lg font-bold backdrop-blur-md active:bg-yellow-500/40 active:border-yellow-500 transition-all pointer-events-auto"
        >
          FIRE
        </button>
      </div>

      {/* Mobile Pause Button */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <button
          onClick={() => setGameState(gameState === 'playing' ? 'paused' : 'playing')}
          className="md:hidden fixed top-5 right-5 w-12 h-12 bg-pink-500/20 border-2 border-pink-500/50 rounded-lg flex items-center justify-center text-pink-400 text-sm backdrop-blur-md active:bg-pink-500/40 active:border-pink-500 transition-all z-35"
        >
          ⏸
        </button>
      )}
    </div>
  );
};

export default SpaceDefender;