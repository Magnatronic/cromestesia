import './styles.css'

// Cromestesia - Music Visualization Therapy App
class MusicVisualization {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.bufferLength = null;
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    
    // Current settings
    this.currentMode = 'drums';
    this.currentTheme = 'space';
    this.isRunning = false;
    this.animationSpeed = 1;
    this.sensitivity = 1;
    this.highContrast = false;
    
    // Frequency analysis
    this.sampleRate = 44100; // Will be updated when audio context is created
    this.fftSize = 2048;
    
    // Frequency ranges in Hz (more accurate than bin indices)
    this.bassRangeHz = { start: 20, end: 250 };    // Bass: 20-250 Hz (kick, bass guitar)
    this.midRangeHz = { start: 250, end: 4000 };   // Mid: 250-4000 Hz (vocals, snare, guitar)
    this.trebleRangeHz = { start: 4000, end: 16000 }; // Treble: 4000-16000 Hz (hi-hats, cymbals)
    
    // Calculated bin ranges (will be set when audio starts)
    this.bassRange = { start: 0, end: 30 };      
    this.midRange = { start: 30, end: 150 };     
    this.trebleRange = { start: 150, end: 512 };
    
    // Visualization particles and effects
    this.particles = [];
    this.pulses = [];
    this.waves = [];
    
    // Debug and testing
    this.debugMode = false;
    this.frequencyLog = [];
    this.calibrationMode = false;
    this.maxFrequencyValues = { bass: 0, mid: 0, treble: 0, overall: 0 };
    
    this.init();
  }

  async init() {
    this.setupCanvas();
    this.setupEventListeners();
    this.setupAccessibility();
    
    // Initialize with default state
    this.updateModeStatus();
    this.updateThemeStatus();
    this.updateAudioStatus('Inactive');
  }

  setupCanvas() {
    this.canvas = document.getElementById('visualization-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size to match container
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }

  setupEventListeners() {
    // Audio controls
    document.getElementById('start-btn').addEventListener('click', () => this.startVisualization());
    document.getElementById('stop-btn').addEventListener('click', () => this.stopVisualization());
    
    // Mode selection
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setMode(e.target.closest('.mode-btn').dataset.mode));
    });
    
    // Theme selection
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setTheme(e.target.closest('.theme-btn').dataset.theme));
    });
    
    // Settings panel
    const settingsToggle = document.querySelector('.settings-toggle');
    const settingsPanel = document.querySelector('.settings-panel');
    
    settingsToggle.addEventListener('click', () => {
      settingsPanel.classList.toggle('open');
    });
    
    // Settings controls
    document.getElementById('contrast-toggle').addEventListener('change', (e) => {
      this.toggleHighContrast(e.target.checked);
    });
    
    document.getElementById('animation-speed').addEventListener('input', (e) => {
      this.animationSpeed = parseFloat(e.target.value);
    });
    
    document.getElementById('sensitivity').addEventListener('input', (e) => {
      this.sensitivity = parseFloat(e.target.value);
    });
    
    // Add debug mode toggle (Ctrl+D)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        this.toggleDebugMode();
      }
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        this.calibrateFrequencies();
      }
    });
  }

  setupAccessibility() {
    // Keyboard navigation for mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
    
    // Keyboard navigation for theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  }

  async startVisualization() {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      // Create audio context and analyser
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      
      // Configure analyser
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.8;
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);
      
      // Connect audio graph
      this.microphone.connect(this.analyser);
      
      // Start visualization
      this.isRunning = true;
      this.animate();
      
      // Update UI
      document.getElementById('start-btn').disabled = true;
      document.getElementById('stop-btn').disabled = false;
      this.updateAudioStatus('Active');
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      this.updateAudioStatus('Error: Microphone access denied');
    }
  }

  stopVisualization() {
    this.isRunning = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.microphone) {
      this.microphone.disconnect();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Reset particles and effects
    this.particles = [];
    this.pulses = [];
    this.waves = [];
    
    // Update UI
    document.getElementById('start-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;
    this.updateAudioStatus('Inactive');
    this.updateAudioLevel(0);
  }

  setMode(mode) {
    this.currentMode = mode;
    
    // Update button states
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    
    const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-pressed', 'true');
    
    this.updateModeStatus();
  }

  setTheme(theme) {
    this.currentTheme = theme;
    
    // Update button states
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    });
    
    const activeBtn = document.querySelector(`[data-theme="${theme}"]`);
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-pressed', 'true');
    
    this.updateThemeStatus();
  }

  toggleHighContrast(enabled) {
    this.highContrast = enabled;
    document.body.classList.toggle('high-contrast', enabled);
  }

  animate() {
    if (!this.isRunning) return;
    
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Analyze frequency bands
    const frequencies = this.analyzeFrequencies();
    
    // Update audio level indicator
    this.updateAudioLevel(frequencies.overall);
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Apply theme background
    this.drawThemeBackground();
    
    // Draw visualization based on mode
    switch (this.currentMode) {
      case 'drums':
        this.visualizeDrums(frequencies);
        break;
      case 'singing':
        this.visualizeSinging(frequencies);
        break;
      case 'ambient':
        this.visualizeAmbient(frequencies);
        break;
    }
    
    // Update and draw particles
    this.updateParticles();
  }

  analyzeFrequencies() {
    const bassRaw = this.getAverageFrequency(this.bassRange.start, this.bassRange.end);
    const midRaw = this.getAverageFrequency(this.midRange.start, this.midRange.end);
    const trebleRaw = this.getAverageFrequency(this.trebleRange.start, this.trebleRange.end);
    
    // Apply frequency-specific weighting AFTER getting raw values
    const bass = Math.min(bassRaw * 0.4, 1.0);    // Reduce bass significantly
    const mid = Math.min(midRaw * 1.0, 1.0);      // Keep mid as baseline
    const treble = Math.min(trebleRaw * 3.0, 1.0); // Boost treble significantly
    
    const overall = (bass + mid + treble) / 3;
    
    const frequencies = {
      bass: bass * this.sensitivity,
      mid: mid * this.sensitivity,
      treble: treble * this.sensitivity,
      overall: overall * this.sensitivity
    };
    
    // Debug logging
    if (this.debugMode) {
      this.logFrequencyData(frequencies, { bassRaw, midRaw, trebleRaw });
      this.updateDebugDisplay(frequencies);
    }
    
    // Update max values for calibration
    this.maxFrequencyValues.bass = Math.max(this.maxFrequencyValues.bass, frequencies.bass);
    this.maxFrequencyValues.mid = Math.max(this.maxFrequencyValues.mid, frequencies.mid);
    this.maxFrequencyValues.treble = Math.max(this.maxFrequencyValues.treble, frequencies.treble);
    this.maxFrequencyValues.overall = Math.max(this.maxFrequencyValues.overall, frequencies.overall);
    
    return frequencies;
  }

  getAverageFrequency(startIndex, endIndex) {
    let sum = 0;
    let count = 0;
    
    // Skip the first few bins (0-2) to avoid DC offset
    const actualStart = Math.max(startIndex, 2);
    
    for (let i = actualStart; i < Math.min(endIndex, this.dataArray.length); i++) {
      sum += this.dataArray[i];
      count++;
    }
    
    // Return raw average without any weighting (weighting happens in analyzeFrequencies)
    return count > 0 ? sum / count / 255 : 0;
  }

  drawThemeBackground() {
    const { width, height } = this.canvas;
    const gradient = this.ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    
    switch (this.currentTheme) {
      case 'space':
        gradient.addColorStop(0, 'rgba(15, 15, 35, 0.8)');
        gradient.addColorStop(0.5, 'rgba(26, 26, 58, 0.6)');
        gradient.addColorStop(1, 'rgba(45, 45, 90, 0.4)');
        break;
      case 'underwater':
        gradient.addColorStop(0, 'rgba(0, 50, 100, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 75, 150, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 100, 200, 0.4)');
        break;
      case 'forest':
        gradient.addColorStop(0, 'rgba(20, 50, 20, 0.8)');
        gradient.addColorStop(0.5, 'rgba(30, 75, 30, 0.6)');
        gradient.addColorStop(1, 'rgba(40, 100, 40, 0.4)');
        break;
      case 'minimal':
        gradient.addColorStop(0, 'rgba(15, 15, 23, 0.9)');
        gradient.addColorStop(1, 'rgba(15, 15, 23, 0.9)');
        break;
    }
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
  }

  visualizeDrums(frequencies) {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Kick drum - screen pulses
    if (frequencies.bass > 0.3) {
      this.pulses.push({
        x: centerX,
        y: centerY,
        radius: 10,
        maxRadius: Math.min(width, height) * 0.4,
        alpha: frequencies.bass,
        color: this.getThemeColor('bass')
      });
    }
    
    // Snare - radial ripples
    if (frequencies.mid > 0.2) {
      for (let i = 0; i < 3; i++) {
        this.pulses.push({
          x: centerX + (Math.random() - 0.5) * 200,
          y: centerY + (Math.random() - 0.5) * 200,
          radius: 5,
          maxRadius: 150,
          alpha: frequencies.mid * 0.8,
          color: this.getThemeColor('mid')
        });
      }
    }
    
    // Hi-hats - sparks
    if (frequencies.treble > 0.15) {
      for (let i = 0; i < 8; i++) {
        this.particles.push({
          x: centerX + (Math.random() - 0.5) * 300,
          y: centerY + (Math.random() - 0.5) * 300,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          size: Math.random() * 4 + 2,
          alpha: frequencies.treble,
          life: 30,
          maxLife: 30,
          color: this.getThemeColor('treble')
        });
      }
    }
    
    // Draw pulses
    this.drawPulses();
  }

  visualizeSinging(frequencies) {
    const { width, height } = this.canvas;
    
    // High notes - twinkling particles
    if (frequencies.treble > 0.1) {
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 6 + 3,
          alpha: frequencies.treble,
          life: 60,
          maxLife: 60,
          color: this.getThemeColor('treble'),
          twinkle: true
        });
      }
    }
    
    // Sustained notes - flowing waves
    if (frequencies.mid > 0.15) {
      this.waves.push({
        x: 0,
        y: height / 2,
        amplitude: frequencies.mid * 100,
        frequency: 0.02,
        speed: 2,
        alpha: frequencies.mid,
        color: this.getThemeColor('mid')
      });
    }
    
    // Harmonics - color gradients
    if (frequencies.overall > 0.2) {
      this.drawHarmonicGradient(frequencies);
    }
    
    this.drawWaves();
  }

  visualizeAmbient(frequencies) {
    const { width, height } = this.canvas;
    
    // Classic equalizer bars
    this.drawEqualizer(frequencies);
    
    // Gentle waveform overlay
    this.drawWaveform(frequencies);
  }

  drawPulses() {
    this.pulses = this.pulses.filter(pulse => {
      pulse.radius += (pulse.maxRadius - pulse.radius) * 0.1 * this.animationSpeed;
      pulse.alpha *= 0.95;
      
      if (pulse.alpha > 0.01) {
        this.ctx.beginPath();
        this.ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = pulse.color.replace('1)', `${pulse.alpha})`);
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        return true;
      }
      return false;
    });
  }

  drawWaves() {
    this.waves = this.waves.filter(wave => {
      wave.x += wave.speed * this.animationSpeed;
      wave.alpha *= 0.98;
      
      if (wave.alpha > 0.01 && wave.x < this.canvas.width + 100) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = wave.color.replace('1)', `${wave.alpha})`);
        this.ctx.lineWidth = 2;
        
        for (let x = 0; x < this.canvas.width; x += 5) {
          const y = wave.y + Math.sin((x + wave.x) * wave.frequency) * wave.amplitude;
          if (x === 0) {
            this.ctx.moveTo(x, y);
          } else {
            this.ctx.lineTo(x, y);
          }
        }
        
        this.ctx.stroke();
        return true;
      }
      return false;
    });
  }

  drawEqualizer(frequencies) {
    const { width, height } = this.canvas;
    const barCount = 32;
    const barWidth = width / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const freqIndex = Math.floor((i / barCount) * this.dataArray.length);
      const barHeight = (this.dataArray[freqIndex] / 255) * height * 0.8;
      
      const x = i * barWidth;
      const y = height - barHeight;
      
      const color = this.getThemeColor('bass');
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, barWidth - 2, barHeight);
    }
  }

  drawWaveform(frequencies) {
    const { width, height } = this.canvas;
    const centerY = height / 2;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.getThemeColor('mid');
    this.ctx.lineWidth = 2;
    
    for (let i = 0; i < this.dataArray.length; i++) {
      const x = (i / this.dataArray.length) * width;
      const y = centerY + (this.dataArray[i] - 128) * 2;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.stroke();
  }

  drawHarmonicGradient(frequencies) {
    const { width, height } = this.canvas;
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    
    const intensity = frequencies.overall;
    const baseColor = this.getThemeColor('mid');
    
    gradient.addColorStop(0, baseColor.replace('1)', `${intensity * 0.3})`));
    gradient.addColorStop(0.5, baseColor.replace('1)', `${intensity * 0.6})`));
    gradient.addColorStop(1, baseColor.replace('1)', `${intensity * 0.3})`));
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
  }

  updateParticles() {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx * this.animationSpeed;
      particle.y += particle.vy * this.animationSpeed;
      particle.life--;
      
      const lifeRatio = particle.life / particle.maxLife;
      const currentAlpha = particle.alpha * lifeRatio;
      
      if (particle.life > 0) {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        if (particle.twinkle) {
          const twinkleAlpha = currentAlpha * (0.5 + 0.5 * Math.sin(Date.now() * 0.01));
          this.ctx.fillStyle = particle.color.replace('1)', `${twinkleAlpha})`);
        } else {
          this.ctx.fillStyle = particle.color.replace('1)', `${currentAlpha})`);
        }
        
        this.ctx.fill();
        return true;
      }
      return false;
    });
  }

  getThemeColor(frequency) {
    switch (this.currentTheme) {
      case 'space':
        return {
          bass: 'rgba(99, 102, 241, 1)',
          mid: 'rgba(245, 158, 11, 1)',
          treble: 'rgba(236, 72, 153, 1)'
        }[frequency];
      case 'underwater':
        return {
          bass: 'rgba(59, 130, 246, 1)',
          mid: 'rgba(16, 185, 129, 1)',
          treble: 'rgba(34, 197, 94, 1)'
        }[frequency];
      case 'forest':
        return {
          bass: 'rgba(34, 197, 94, 1)',
          mid: 'rgba(132, 204, 22, 1)',
          treble: 'rgba(254, 240, 138, 1)'
        }[frequency];
      case 'minimal':
        return {
          bass: 'rgba(156, 163, 175, 1)',
          mid: 'rgba(209, 213, 219, 1)',
          treble: 'rgba(243, 244, 246, 1)'
        }[frequency];
      default:
        return 'rgba(255, 255, 255, 1)';
    }
  }

  updateAudioLevel(level) {
    const levelBar = document.querySelector('.level-bar');
    const percentage = Math.min(level * 100, 100);
    levelBar.style.setProperty('--level', `${percentage}%`);
    
    // Apply the level using CSS custom property
    levelBar.querySelector('::after')?.style.setProperty('width', `${percentage}%`);
    
    // Direct style update for better browser compatibility
    const afterElement = levelBar.querySelector('::after') || levelBar;
    if (levelBar.style.setProperty) {
      levelBar.style.setProperty('--level-width', `${percentage}%`);
    }
  }

  updateModeStatus() {
    const modeNames = {
      drums: 'Drums',
      singing: 'Singing',
      ambient: 'Ambient Music'
    };
    document.getElementById('mode-status').textContent = `Mode: ${modeNames[this.currentMode]}`;
  }

  updateThemeStatus() {
    const themeNames = {
      space: 'Space',
      underwater: 'Ocean',
      forest: 'Forest',
      minimal: 'Mono'
    };
    document.getElementById('theme-status').textContent = `Theme: ${themeNames[this.currentTheme]}`;
  }

  updateAudioStatus(status) {
    document.getElementById('audio-status').textContent = `Audio: ${status}`;
  }
  
  // Debug and testing methods
  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    
    if (this.debugMode) {
      this.createDebugOverlay();
      console.log('🔍 Debug mode enabled - Frequency data will be logged');
      console.log('📊 Press Ctrl+C to calibrate frequency ranges');
    } else {
      this.removeDebugOverlay();
      console.log('🔍 Debug mode disabled');
    }
  }
  
  createDebugOverlay() {
    // Remove existing overlay if present
    this.removeDebugOverlay();
    
    const overlay = document.createElement('div');
    overlay.id = 'debug-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      z-index: 1000;
      border: 1px solid #6366f1;
      backdrop-filter: blur(10px);
    `;
    
    overlay.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 0.5rem; color: #6366f1;">
        🔍 FREQUENCY DEBUG
      </div>
      <div id="debug-bass">Bass: 0.00 (0%)</div>
      <div id="debug-mid">Mid: 0.00 (0%)</div>
      <div id="debug-treble">Treble: 0.00 (0%)</div>
      <div id="debug-overall">Overall: 0.00 (0%)</div>
      <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #94a3b8;">
        Ctrl+D: Toggle debug<br>
        Ctrl+C: Calibrate ranges
      </div>
    `;
    
    document.body.appendChild(overlay);
  }
  
  removeDebugOverlay() {
    const existing = document.getElementById('debug-overlay');
    if (existing) {
      existing.remove();
    }
  }
  
  updateDebugDisplay(frequencies) {
    const bassEl = document.getElementById('debug-bass');
    const midEl = document.getElementById('debug-mid');
    const trebleEl = document.getElementById('debug-treble');
    const overallEl = document.getElementById('debug-overall');
    
    if (bassEl) {
      const bassPercent = ((frequencies.bass / Math.max(this.maxFrequencyValues.bass, 0.01)) * 100).toFixed(0);
      bassEl.textContent = `Bass: ${frequencies.bass.toFixed(3)} (${bassPercent}%)`;
    }
    
    if (midEl) {
      const midPercent = ((frequencies.mid / Math.max(this.maxFrequencyValues.mid, 0.01)) * 100).toFixed(0);
      midEl.textContent = `Mid: ${frequencies.mid.toFixed(3)} (${midPercent}%)`;
    }
    
    if (trebleEl) {
      const treblePercent = ((frequencies.treble / Math.max(this.maxFrequencyValues.treble, 0.01)) * 100).toFixed(0);
      trebleEl.textContent = `Treble: ${frequencies.treble.toFixed(3)} (${treblePercent}%)`;
    }
    
    if (overallEl) {
      const overallPercent = ((frequencies.overall / Math.max(this.maxFrequencyValues.overall, 0.01)) * 100).toFixed(0);
      overallEl.textContent = `Overall: ${frequencies.overall.toFixed(3)} (${overallPercent}%)`;
    }
  }
  
  logFrequencyData(frequencies, rawValues = null) {
    const timestamp = Date.now();
    const logEntry = {
      timestamp,
      ...frequencies,
      mode: this.currentMode,
      theme: this.currentTheme
    };
    
    this.frequencyLog.push(logEntry);
    
    // Keep only last 100 entries
    if (this.frequencyLog.length > 100) {
      this.frequencyLog = this.frequencyLog.slice(-100);
    }
    
    // Enhanced debug logging with raw values
    if (rawValues && this.frequencyLog.length % 30 === 0) {
      console.log(`🎵 Raw: B=${(rawValues.bassRaw*100).toFixed(1)}% M=${(rawValues.midRaw*100).toFixed(1)}% T=${(rawValues.trebleRaw*100).toFixed(1)}%`);
      console.log(`🔧 Weighted: B=${(frequencies.bass*100).toFixed(1)}% M=${(frequencies.mid*100).toFixed(1)}% T=${(frequencies.treble*100).toFixed(1)}%`);
    }
    
    // Log significant frequency spikes
    if (frequencies.bass > 0.7 || frequencies.mid > 0.7 || frequencies.treble > 0.7) {
      console.log('🎵 Frequency spike detected:', {
        bass: frequencies.bass.toFixed(3),
        mid: frequencies.mid.toFixed(3),
        treble: frequencies.treble.toFixed(3),
        mode: this.currentMode
      });
    }
  }
  
  calibrateFrequencies() {
    this.maxFrequencyValues = { bass: 0, mid: 0, treble: 0, overall: 0 };
    console.log('🎯 Frequency calibration reset! Play some music for 10-15 seconds to recalibrate.');
    
    // Visual feedback
    if (this.debugMode) {
      const overlay = document.getElementById('debug-overlay');
      if (overlay) {
        overlay.style.borderColor = '#10b981';
        setTimeout(() => {
          overlay.style.borderColor = '#6366f1';
        }, 1000);
      }
    }
  }
  
  exportFrequencyLog() {
    const data = JSON.stringify(this.frequencyLog, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `cromestesia-frequency-log-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log('📄 Frequency log exported');
  }

  // ...existing code...
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new MusicVisualization();
});

// Add CSS custom property support for audio level
const style = document.createElement('style');
style.textContent = `
  .level-bar::after {
    width: var(--level-width, 0%) !important;
  }
`;
document.head.appendChild(style);
