/**
 * SPACE DEFENDER - Modern 2D Space Shooter Game
 * Built with HTML5 Canvas and modern JavaScript (ES6+)
 * Features: Player movement, shooting, enemies, collision detection, scoring, and audio
 */

class SpaceDefender {
  constructor() {
    // Initialize game state and configuration
    this.canvas = null;
    this.ctx = null;
    this.gameState = 'start'; // 'start', 'playing', 'paused', 'gameOver'
    this.score = 0;
    this.lives = 3;
    this.lastTime = 0;
    
    // Game objects arrays
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.explosions = [];
    
    // Timing variables
    this.enemySpawnTimer = 0;
    this.enemySpawnDelay = 2000; // milliseconds
    
    // Input handling
    this.keys = {};
    this.lastShotTime = 0;
    this.shotDelay = 150; // milliseconds between shots
    
    // Audio system
    this.sounds = {};
    this.musicPlaying = false;
    
    // Game settings
    this.gameSpeed = 1;
    this.enemySpeed = 2;
    this.bulletSpeed = 8;
    this.playerSpeed = 6;
    
    this.init();
  }

  /**
   * Initialize the game - set up canvas, event listeners, and audio
   */
  init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupAudio();
    this.createPlayer();
    
    // Start the game loop
    this.gameLoop();
    
    console.log('Space Defender initialized successfully!');
  }

  /**
   * Set up the game canvas with responsive sizing
   */
  setupCanvas() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size to fill the screen with some padding
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const maxWidth = Math.min(container.clientWidth - 40, 1200);
    const maxHeight = Math.min(container.clientHeight - 40, 800);
    
    this.canvas.width = maxWidth;
    this.canvas.height = maxHeight;
    
    // Update canvas styling
    this.canvas.style.width = maxWidth + 'px';
    this.canvas.style.height = maxHeight + 'px';
  }

  /**
   * Set up all event listeners for game controls and UI
   */
  setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // UI button controls - Enhanced for mobile
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    const mainMenuButton = document.getElementById('mainMenuButton');
    
    // Start button - multiple event types for better mobile support
    startButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Start button clicked');
      this.startGame();
    });
    
    startButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Start button touched');
    });
    
    startButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Start button touchend');
      this.startGame();
    });
    
    // Restart button
    restartButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.restartGame();
    });
    
    restartButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.restartGame();
    });
    
    // Main menu button
    mainMenuButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showMainMenu();
    });
    
    mainMenuButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showMainMenu();
    });
    
    // Mobile controls
    this.setupMobileControls();
    
    // Prevent default behavior for game keys
    document.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });
    
    // Add touch event debugging
    document.addEventListener('touchstart', (e) => {
      console.log('Touch started on:', e.target);
    });
  }

  /**
   * Set up mobile touch controls
   */
  setupMobileControls() {
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const shootBtn = document.getElementById('shootBtn');
    const pauseBtn = document.getElementById('mobilePauseBtn');
    
    // Left button
    leftBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.keys['a'] = true;
      leftBtn.classList.add('pressed');
    });
    
    leftBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.keys['a'] = false;
      leftBtn.classList.remove('pressed');
    });
    
    leftBtn.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.keys['a'] = false;
      leftBtn.classList.remove('pressed');
    });
    
    // Right button
    rightBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.keys['d'] = true;
      rightBtn.classList.add('pressed');
    });
    
    rightBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.keys['d'] = false;
      rightBtn.classList.remove('pressed');
    });
    
    rightBtn.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.keys['d'] = false;
      rightBtn.classList.remove('pressed');
    });
    
    // Shoot button
    shootBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.keys[' '] = true;
      shootBtn.classList.add('pressed');
    });
    
    shootBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.keys[' '] = false;
      shootBtn.classList.remove('pressed');
    });
    
    shootBtn.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.keys[' '] = false;
      shootBtn.classList.remove('pressed');
    });
    
    // Pause button
    pauseBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    
    pauseBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.gameState === 'playing') {
        this.pauseGame();
      } else if (this.gameState === 'paused') {
        this.resumeGame();
      }
    });
    
    // Prevent context menu on mobile
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    
    // Prevent pull-to-refresh and other gestures
    document.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
    
    // Prevent default touch behaviors on buttons
    const buttons = document.querySelectorAll('button, .mobile-btn');
    buttons.forEach(button => {
      button.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      });
      button.addEventListener('touchend', (e) => {
        e.stopPropagation();
      });
    });
  }

  /**
   * Set up audio system with fallback handling
   */
  setupAudio() {
    try {
      // Background music
      this.sounds.bgMusic = new Audio();
      this.sounds.bgMusic.loop = true;
      this.sounds.bgMusic.volume = 0.3;
      
      // Sound effects using Web Audio API synthesis
      this.createSynthSounds();
      
    } catch (error) {
      console.warn('Audio initialization failed:', error);
      // Create silent fallbacks
      this.sounds = {
        bgMusic: { play: () => {}, pause: () => {}, currentTime: 0 },
        shoot: { play: () => {} },
        explosion: { play: () => {} },
        gameOver: { play: () => {} }
      };
    }
  }

  /**
   * Create synthesized sound effects using Web Audio API
   */
  createSynthSounds() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Shooting sound
    this.sounds.shoot = {
      play: () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      }
    };
    
    // Explosion sound
    this.sounds.explosion = {
      play: () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
    };
    
    // Game over sound
    this.sounds.gameOver = {
      play: () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
      }
    };
  }

  /**
   * Create the player spaceship object
   */
  createPlayer() {
    this.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 80,
      width: 40,
      height: 40,
      speed: this.playerSpeed,
      color: '#00f5ff'
    };
  }

  /**
   * Handle keyboard input (key press)
   */
  handleKeyDown(e) {
    this.keys[e.key.toLowerCase()] = true;
    
    // Handle special keys
    switch (e.key.toLowerCase()) {
      case 'p':
        if (this.gameState === 'playing') {
          this.pauseGame();
        } else if (this.gameState === 'paused') {
          this.resumeGame();
        }
        break;
      case ' ':
        if (this.gameState === 'playing') {
          this.shoot();
        }
        break;
      case 'enter':
        if (this.gameState === 'start') {
          this.startGame();
        } else if (this.gameState === 'gameOver') {
          this.restartGame();
        }
        break;
    }
  }

  /**
   * Handle keyboard input (key release)
   */
  handleKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
  }

  /**
   * Start a new game
   */
  startGame() {
    console.log('Starting game...');
    this.gameState = 'playing';
    this.score = 0;
    this.lives = 3;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.explosions = [];
    this.enemySpawnTimer = 0;
    
    // Reset player position
    this.createPlayer();
    
    // Update UI
    this.updateUI();
    this.showScreen('gameScreen');
    
    // Start background music
    try {
      this.sounds.bgMusic.currentTime = 0;
      this.sounds.bgMusic.play();
      this.musicPlaying = true;
    } catch (error) {
      console.warn('Background music failed to play:', error);
    }
    
    console.log('Game started successfully!');
  }

  /**
   * Pause the game
   */
  pauseGame() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      document.getElementById('pauseOverlay').classList.remove('hidden');
      try {
        this.sounds.bgMusic.pause();
      } catch (error) {
        console.warn('Failed to pause music:', error);
      }
    }
  }

  /**
   * Resume the game from pause
   */
  resumeGame() {
    if (this.gameState === 'paused') {
      this.gameState = 'playing';
      document.getElementById('pauseOverlay').classList.add('hidden');
      try {
        this.sounds.bgMusic.play();
      } catch (error) {
        console.warn('Failed to resume music:', error);
      }
    }
  }

  /**
   * End the game and show game over screen
   */
  gameOver() {
    this.gameState = 'gameOver';
    
    // Stop background music
    try {
      this.sounds.bgMusic.pause();
      this.sounds.gameOver.play();
    } catch (error) {
      console.warn('Audio error on game over:', error);
    }
    
    // Update final score and show game over screen
    document.getElementById('finalScore').textContent = this.score;
    this.showScreen('gameOverScreen');
    
    console.log(`Game Over! Final Score: ${this.score}`);
  }

  /**
   * Restart the game
   */
  restartGame() {
    this.startGame();
  }

  /**
   * Return to main menu
   */
  showMainMenu() {
    this.gameState = 'start';
    try {
      this.sounds.bgMusic.pause();
    } catch (error) {
      console.warn('Failed to stop music:', error);
    }
    this.showScreen('startScreen');
  }

  /**
   * Show specific game screen
   */
  showScreen(screenId) {
    const screens = ['startScreen', 'gameScreen', 'gameOverScreen'];
    screens.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.classList.toggle('hidden', id !== screenId);
      }
    });
  }

  /**
   * Update game UI elements
   */
  updateUI() {
    document.getElementById('scoreValue').textContent = this.score;
    
    // Update health display
    const lifeIcons = document.querySelectorAll('.life-icon');
    lifeIcons.forEach((icon, index) => {
      icon.classList.toggle('active', index < this.lives);
    });
  }

  /**
   * Create a bullet when player shoots
   */
  shoot() {
    const currentTime = Date.now();
    if (currentTime - this.lastShotTime > this.shotDelay) {
      this.bullets.push({
        x: this.player.x,
        y: this.player.y - 10,
        width: 4,
        height: 15,
        speed: this.bulletSpeed,
        color: '#ffff00'
      });
      
      this.lastShotTime = currentTime;
      
      // Play shoot sound
      try {
        this.sounds.shoot.play();
      } catch (error) {
        console.warn('Shoot sound failed:', error);
      }
    }
  }

  /**
   * Spawn a new enemy
   */
  spawnEnemy() {
    const enemyWidth = 30;
    const x = Math.random() * (this.canvas.width - enemyWidth);
    
    this.enemies.push({
      x: x,
      y: -enemyWidth,
      width: enemyWidth,
      height: enemyWidth,
      speed: this.enemySpeed + Math.random() * 2,
      color: '#ff4081',
      health: 1
    });
  }

  /**
   * Update player position based on input
   */
  updatePlayer() {
    // Handle movement input
    if ((this.keys['a'] || this.keys['arrowleft']) && this.player.x > 0) {
      this.player.x -= this.player.speed;
    }
    if ((this.keys['d'] || this.keys['arrowright']) && this.player.x < this.canvas.width - this.player.width) {
      this.player.x += this.player.speed;
    }
    
    // Continuous shooting when spacebar is held
    if (this.keys[' ']) {
      this.shoot();
    }
  }

  /**
   * Update all bullets
   */
  updateBullets() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.y -= bullet.speed;
      
      // Remove bullets that are off-screen
      if (bullet.y < -bullet.height) {
        this.bullets.splice(i, 1);
      }
    }
  }

  /**
   * Update all enemies
   */
  updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.y += enemy.speed;
      
      // Check if enemy reached bottom (player loses life)
      if (enemy.y > this.canvas.height) {
        this.enemies.splice(i, 1);
        this.takeDamage();
      }
    }
  }

  /**
   * Check and handle all collisions
   */
  checkCollisions() {
    // Bullet-Enemy collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        
        if (this.isColliding(bullet, enemy)) {
          // Create explosion effect
          this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          
          // Remove bullet and enemy
          this.bullets.splice(i, 1);
          this.enemies.splice(j, 1);
          
          // Increase score
          this.score += 100;
          this.updateUI();
          
          // Play explosion sound
          try {
            this.sounds.explosion.play();
          } catch (error) {
            console.warn('Explosion sound failed:', error);
          }
          
          break;
        }
      }
    }
    
    // Player-Enemy collisions
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      if (this.isColliding(this.player, enemy)) {
        // Create explosion effect
        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        
        // Remove enemy and damage player
        this.enemies.splice(i, 1);
        this.takeDamage();
        
        // Play explosion sound
        try {
          this.sounds.explosion.play();
        } catch (error) {
          console.warn('Explosion sound failed:', error);
        }
      }
    }
  }

  /**
   * Check if two objects are colliding
   */
  isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  }

  /**
   * Handle player taking damage
   */
  takeDamage() {
    this.lives--;
    this.updateUI();
    
    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  /**
   * Create explosion effect at specified position
   */
  createExplosion(x, y) {
    // Add explosion to array for rendering
    this.explosions.push({
      x: x,
      y: y,
      radius: 5,
      maxRadius: 40,
      alpha: 1,
      color: '#ff6b35'
    });
    
    // Create particle effects
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color: `hsl(${Math.random() * 60 + 15}, 100%, 60%)`
      });
    }
  }

  /**
   * Update explosion effects
   */
  updateExplosions() {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      explosion.radius += 2;
      explosion.alpha -= 0.05;
      
      if (explosion.alpha <= 0 || explosion.radius >= explosion.maxRadius) {
        this.explosions.splice(i, 1);
      }
    }
  }

  /**
   * Update particle effects
   */
  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 0.02;
      particle.vy += 0.1; // gravity
      
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Render the player spaceship
   */
  renderPlayer() {
    const ctx = this.ctx;
    const p = this.player;
    
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
  }

  /**
   * Render all bullets
   */
  renderBullets() {
    const ctx = this.ctx;
    
    this.bullets.forEach(bullet => {
      ctx.fillStyle = bullet.color;
      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 8;
      
      ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);
    });
  }

  /**
   * Render all enemies
   */
  renderEnemies() {
    const ctx = this.ctx;
    
    this.enemies.forEach(enemy => {
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
  }

  /**
   * Render explosion effects
   */
  renderExplosions() {
    const ctx = this.ctx;
    
    this.explosions.forEach(explosion => {
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
  }

  /**
   * Render particle effects
   */
  renderParticles() {
    const ctx = this.ctx;
    
    this.particles.forEach(particle => {
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
  }

  /**
   * Render animated starfield background
   */
  renderBackground() {
    const ctx = this.ctx;
    
    // Create moving stars effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37 + this.lastTime * 0.02) % this.canvas.width;
      const y = (i * 47 + this.lastTime * 0.01) % this.canvas.height;
      const size = Math.sin(i + this.lastTime * 0.001) * 2 + 2;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Main game update loop
   */
  update(deltaTime) {
    if (this.gameState !== 'playing') return;
    
    // Update player
    this.updatePlayer();
    
    // Update bullets
    this.updateBullets();
    
    // Update enemies
    this.updateEnemies();
    
    // Spawn enemies
    this.enemySpawnTimer += deltaTime;
    if (this.enemySpawnTimer > this.enemySpawnDelay) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
      // Gradually increase difficulty
      this.enemySpawnDelay = Math.max(800, this.enemySpawnDelay - 5);
    }
    
    // Check collisions
    this.checkCollisions();
    
    // Update effects
    this.updateExplosions();
    this.updateParticles();
  }

  /**
   * Main game render loop
   */
  render() {
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render background
    this.renderBackground();
    
    if (this.gameState === 'playing' || this.gameState === 'paused') {
      // Render game objects
      this.renderPlayer();
      this.renderBullets();
      this.renderEnemies();
      this.renderExplosions();
      this.renderParticles();
    }
  }

  /**
   * Main game loop using requestAnimationFrame
   */
  gameLoop(currentTime = 0) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // Update game logic
    this.update(deltaTime);
    
    // Render graphics
    this.render();
    
    // Continue the loop
    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Space Defender...');
  window.game = new SpaceDefender();
});

// Handle page visibility changes to pause game
document.addEventListener('visibilitychange', () => {
  if (document.hidden && window.game && window.game.gameState === 'playing') {
    window.game.pauseGame();
  }
});
