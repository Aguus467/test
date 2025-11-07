/**
 * AngulismoTV - UI Controller & Visual Effects
 * Maneja starfield, personalización y efectos visuales
 */

//TRANSMISION-UI.JS

(function() {
  'use strict';

  // ==================== Configuration ====================
  const CONFIG = {
    defaults: {
      accentColor: '#72d6ff',
      starsEnabled: true,
      starsCount: 70,
      bgOpacity: 70,
      autoChat: true,
      autoReload: false
    },
    starfield: {
      regularRatio: 0.85,
      shootingRatio: 0.05,
      comets: 2,
      planets: 2,
      stardustRatio: 0.3,
      headerStars: 15
    }
  };

  // ==================== State Management ====================
  class SettingsManager {
    constructor(defaults) {
      this.defaults = defaults;
      this.current = this.load();
    }

    load() {
      try {
        const saved = localStorage.getItem('angulismoSettings');
        return saved ? { ...this.defaults, ...JSON.parse(saved) } : { ...this.defaults };
      } catch (error) {
        console.warn('Error loading settings:', error);
        return { ...this.defaults };
      }
    }

    save() {
      try {
        localStorage.setItem('angulismoSettings', JSON.stringify(this.current));
      } catch (error) {
        console.warn('Error saving settings:', error);
      }
    }

    update(key, value) {
      this.current[key] = value;
      this.save();
    }

    reset() {
      this.current = { ...this.defaults };
      this.save();
    }

    get(key) {
      return this.current[key];
    }
  }

  // ==================== Starfield Generator ====================
  class StarfieldGenerator {
    constructor(container, config) {
      this.container = container;
      this.config = config;
      this.stars = [];
    }

    generate(count) {
      this.clear();
      const fragment = document.createDocumentFragment();

      this.createRegularStars(fragment, Math.floor(count * this.config.regularRatio));
      this.createShootingStars(fragment, Math.ceil(count * this.config.shootingRatio));
      this.createComets(fragment, this.config.comets);
      this.createPlanets(fragment, this.config.planets);
      this.createStardust(fragment, Math.floor(count * this.config.stardustRatio));

      this.container.appendChild(fragment);
    }

    clear() {
      const existingStars = this.container.querySelectorAll('.star, .shooting-star, .comet, .planet, .stardust');
      existingStars.forEach(star => star.remove());
      this.stars = [];
    }

    createRegularStars(fragment, count) {
      for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        const layer = Math.floor(Math.random() * 3) + 1;
        star.classList.add(`layer-${layer}`);
        star.dataset.speed = layer * 0.2;
        
        const size = Math.random() * 2.5 + 0.5;
        Object.assign(star.style, {
          width: size + 'px',
          height: size + 'px',
          top: Math.random() * 100 + '%',
          left: Math.random() * 100 + '%',
          animationDuration: (Math.random() * 3 + 3) + 's',
          animationDelay: Math.random() * 4 + 's'
        });
        
        fragment.appendChild(star);
        this.stars.push(star);
      }
    }

    createShootingStars(fragment, count) {
      for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'shooting-star';
        Object.assign(star.style, {
          top: Math.random() * 50 + '%',
          left: (Math.random() * 50 + 50) + '%',
          animationDelay: (Math.random() * 6 + 3) + 's',
          animationDuration: (Math.random() * 3 + 3) + 's',
          width: (Math.random() * 100 + 50) + 'px'
        });
        fragment.appendChild(star);
        this.stars.push(star);
      }
    }

    createComets(fragment, count) {
      for (let i = 0; i < count; i++) {
        const comet = document.createElement('div');
        comet.className = 'comet';
        Object.assign(comet.style, {
          top: Math.random() * 30 + '%',
          left: (Math.random() * 30 + 70) + '%',
          animationDelay: (Math.random() * 12 + 6) + 's'
        });
        fragment.appendChild(comet);
        this.stars.push(comet);
      }
    }

    createPlanets(fragment, count) {
      for (let i = 1; i <= count; i++) {
        const planet = document.createElement('div');
        planet.className = `planet planet-${i}`;
        fragment.appendChild(planet);
        this.stars.push(planet);
      }
    }

    createStardust(fragment, count) {
      for (let i = 0; i < count; i++) {
        const dust = document.createElement('div');
        dust.className = 'stardust';
        Object.assign(dust.style, {
          left: Math.random() * 100 + '%',
          bottom: '0',
          animationDelay: Math.random() * 20 + 's',
          animationDuration: (Math.random() * 10 + 15) + 's'
        });
        fragment.appendChild(dust);
        this.stars.push(dust);
      }
    }

    pauseAnimations() {
      this.stars.forEach(star => {
        if (star.style) star.style.animationPlayState = 'paused';
      });
    }

    resumeAnimations() {
      this.stars.forEach(star => {
        if (star.style) star.style.animationPlayState = 'running';
      });
    }
  }

  // ==================== Parallax Effect ====================
  class ParallaxController {
    constructor() {
      this.scrollY = 0;
      this.rafId = null;
      this.init();
    }

    init() {
      window.addEventListener('scroll', () => {
        this.scrollY = window.pageYOffset;
        if (!this.rafId) {
          this.rafId = requestAnimationFrame(() => this.update());
        }
      }, { passive: true });
    }

    update() {
      const stars = document.querySelectorAll('.star[data-speed]');
      stars.forEach(star => {
        const speed = parseFloat(star.dataset.speed) || 0;
        star.style.transform = `translateY(${this.scrollY * speed}px)`;
      });
      this.rafId = null;
    }
  }

  // ==================== Header Stars ====================
  class HeaderStars {
    constructor(header, count) {
      this.header = header;
      this.count = count;
      this.generate();
    }

    generate() {
      const fragment = document.createDocumentFragment();
      
      for (let i = 0; i < this.count; i++) {
        const star = document.createElement('div');
        star.className = 'header-star';
        
        const size = Math.random() * 2 + 1;
        Object.assign(star.style, {
          width: size + 'px',
          height: size + 'px',
          top: Math.random() * 100 + '%',
          left: Math.random() * 100 + '%',
          animationDelay: Math.random() * 3 + 's',
          animationDuration: (Math.random() * 2 + 2) + 's'
        });
        
        fragment.appendChild(star);
      }
      
      this.header.appendChild(fragment);
    }
  }

  // ==================== Settings UI Controller ====================
  class SettingsUI {
    constructor(settings, starfield) {
      this.settings = settings;
      this.starfield = starfield;
      this.elements = this.cacheElements();
      this.init();
    }

    cacheElements() {
      return {
        panel: document.getElementById('customizePanel'),
        openBtn: document.getElementById('customizeBtn'),
        closeBtn: document.getElementById('closePanel'),
        colorOptions: document.querySelectorAll('.color-option'),
        starsToggle: document.getElementById('starsToggle'),
        starsIntensity: document.getElementById('starsIntensity'),
        starsValue: document.getElementById('starsValue'),
        bgOpacity: document.getElementById('bgOpacity'),
        opacityValue: document.getElementById('opacityValue'),
        autoChatToggle: document.getElementById('autoChatToggle'),
        autoReloadToggle: document.getElementById('autoReloadToggle'),
        resetBtn: document.getElementById('resetSettings')
      };
    }

    init() {
      this.initializeUI();
      this.bindEvents();
      this.applySettings();
    }

    initializeUI() {
      const { starsToggle, starsIntensity, starsValue, bgOpacity, opacityValue, autoChatToggle, autoReloadToggle, colorOptions } = this.elements;
      
      if (starsToggle) starsToggle.checked = this.settings.get('starsEnabled');
      if (starsIntensity) starsIntensity.value = this.settings.get('starsCount');
      if (starsValue) starsValue.textContent = this.settings.get('starsCount');
      if (bgOpacity) bgOpacity.value = this.settings.get('bgOpacity');
      if (opacityValue) opacityValue.textContent = this.settings.get('bgOpacity') + '%';
      if (autoChatToggle) autoChatToggle.checked = this.settings.get('autoChat');
      if (autoReloadToggle) autoReloadToggle.checked = this.settings.get('autoReload');
      
      colorOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.color === this.settings.get('accentColor'));
      });
    }

    bindEvents() {
      const { panel, openBtn, closeBtn, colorOptions, starsToggle, starsIntensity, bgOpacity, autoChatToggle, autoReloadToggle, resetBtn } = this.elements;

      // Panel toggle
      if (openBtn) openBtn.addEventListener('click', () => panel?.classList.add('active'));
      if (closeBtn) closeBtn.addEventListener('click', () => panel?.classList.remove('active'));

      // Click outside to close
      document.addEventListener('click', (e) => {
        if (panel?.classList.contains('active') && 
            !panel.contains(e.target) && 
            e.target !== openBtn &&
            !openBtn?.contains(e.target)) {
          panel.classList.remove('active');
        }
      });

      // Color picker
      colorOptions.forEach(option => {
        option.addEventListener('click', () => {
          colorOptions.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
          this.settings.update('accentColor', option.dataset.color);
          this.applySettings();
        });
      });

      // Stars toggle
      if (starsToggle) {
        starsToggle.addEventListener('change', () => {
          this.settings.update('starsEnabled', starsToggle.checked);
          this.applySettings();
        });
      }

      // Stars intensity
      if (starsIntensity) {
        starsIntensity.addEventListener('input', () => {
          const value = parseInt(starsIntensity.value);
          this.elements.starsValue.textContent = value;
          this.settings.update('starsCount', value);
          this.applySettings();
        });
      }

      // Background opacity
      if (bgOpacity) {
        bgOpacity.addEventListener('input', () => {
          const value = parseInt(bgOpacity.value);
          this.elements.opacityValue.textContent = value + '%';
          this.settings.update('bgOpacity', value);
          this.applySettings();
        });
      }

      // Auto chat
      if (autoChatToggle) {
        autoChatToggle.addEventListener('change', () => {
          this.settings.update('autoChat', autoChatToggle.checked);
        });
      }

      // Auto reload
      if (autoReloadToggle) {
        autoReloadToggle.addEventListener('change', () => {
          this.settings.update('autoReload', autoReloadToggle.checked);
        });
      }

      // Reset
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          if (confirm('¿Estás seguro de que deseas restaurar todos los ajustes?')) {
            this.settings.reset();
            this.initializeUI();
            this.applySettings();
            this.showResetFeedback(resetBtn);
          }
        });
      }
    }

    applySettings() {
      const accentColor = this.settings.get('accentColor');
      const starsEnabled = this.settings.get('starsEnabled');
      const starsCount = this.settings.get('starsCount');
      const bgOpacity = this.settings.get('bgOpacity');

      // Apply accent color
      document.documentElement.style.setProperty('--accent', accentColor);
      document.documentElement.style.setProperty('--accent-glow', `${accentColor}80`);
      
      // Apply stars
      const starfieldEl = document.getElementById('starfield');
      if (starfieldEl) {
        starfieldEl.style.display = starsEnabled ? 'block' : 'none';
        
        if (starsEnabled) {
          const currentCount = document.querySelectorAll('.star.layer-1, .star.layer-2, .star.layer-3').length;
          if (Math.abs(currentCount - Math.floor(starsCount * 0.85)) > 10) {
            this.starfield.generate(starsCount);
          }
        }
      }
      
      // Apply background opacity
      const opacity = bgOpacity / 100;
      document.documentElement.style.setProperty('--bg-card', `rgba(20, 20, 40, ${opacity * 0.7})`);
      document.documentElement.style.setProperty('--bg-card-header', `rgba(40, 40, 70, ${opacity * 0.85})`);
    }

    showResetFeedback(btn) {
      const originalText = btn.textContent;
      const originalBg = btn.style.background;
      
      btn.textContent = '✓ Restaurado';
      btn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = originalBg;
      }, 2000);
    }
  }

  // ==================== Interactive Stardust ====================
  class InteractiveStardust {
    constructor() {
      if (window.matchMedia('(hover: hover)').matches) {
        this.init();
      }
    }

    init() {
      document.addEventListener('mousemove', (e) => {
        if (Math.random() < 0.05) {
          this.createDust(e.clientX, e.clientY);
        }
      });
    }

    createDust(x, y) {
      const dust = document.createElement('div');
      dust.className = 'stardust';
      Object.assign(dust.style, {
        left: x + 'px',
        top: y + 'px',
        position: 'fixed',
        animation: 'dustFloat 2s ease-out forwards',
        zIndex: '999'
      });
      document.body.appendChild(dust);
      setTimeout(() => dust.remove(), 2000);
    }
  }

  // ==================== Chat Controller CON COLAPSO COMPLETO ====================
class ChatController {
    constructor() {
      this.toggle = document.getElementById('chatToggle');
      this.card = document.querySelector('.chat-card');
      this.container = document.querySelector('.container');
      this.iframe = document.getElementById('twitchChat');
      this.isHidden = false;
      this.init();
    }

    init() {
      if (!this.toggle || !this.card || !this.iframe || !this.container) return;

      this.toggle.addEventListener('click', () => this.toggleChat());
    }

    toggleChat() {
      this.isHidden = !this.isHidden;
      
      if (this.isHidden) {
        // Ocultar chat completamente
        this.card.classList.add('hidden');
        this.container.classList.add('chat-hidden');
        this.toggle.classList.add('rotated');
        this.toggle.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            <path d="M8 11h8M8 15h6"/>
            <path d="M12 5v14"/>
          </svg>`;
        this.toggle.setAttribute('aria-label', 'Mostrar chat');
      } else {
        // Mostrar chat
        this.card.classList.remove('hidden');
        this.container.classList.remove('chat-hidden');
        this.toggle.classList.remove('rotated');
        this.toggle.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            <path d="M8 11h8M8 15h6"/>
            <path d="M12 19V5"/>
          </svg>`;
        this.toggle.setAttribute('aria-label', 'Ocultar chat');
      }
    }
}

  // ==================== Keyboard Shortcuts ====================
  class KeyboardShortcuts {
    constructor() {
      this.init();
    }

    init() {
      document.addEventListener('keydown', (e) => this.handleKeydown(e));
      
      // Escape to close panel
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const panel = document.getElementById('customizePanel');
          panel?.classList.remove('active');
        }
      });
    }

    handleKeydown(e) {
      // F for fullscreen
      if (e.key === 'f' || e.key === 'F') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          this.toggleFullscreen();
        }
      }
      
      // Ctrl/Cmd+R for reload
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        document.getElementById('reloadBtn')?.click();
      }
      
      // Ctrl/Cmd+K for customize panel
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const panel = document.getElementById('customizePanel');
        panel?.classList.toggle('active');
      }
    }

    toggleFullscreen() {
      const playerFrame = document.getElementById('playerFrame');
      if (!playerFrame) return;

      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerFrame.requestFullscreen().catch(err => {
          console.log('Fullscreen error:', err);
        });
      }
    }
  }

  // ==================== Easter Egg: Mini Constellation ====================

  // ==================== Visibility API for Battery Saving ====================
  class VisibilityController {
    constructor(starfield) {
      this.starfield = starfield;
      this.init();
    }

    init() {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.starfield.pauseAnimations();
        } else {
          this.starfield.resumeAnimations();
        }
      });
    }
  }

  // ==================== Prevent Double-Tap Zoom ====================
  class TouchController {
    constructor() {
      this.lastTouchEnd = 0;
      this.init();
    }

    init() {
      document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - this.lastTouchEnd <= 300) {
          e.preventDefault();
        }
        this.lastTouchEnd = now;
      }, false);
    }
  }

  // ==================== Initialize Everything ====================
  function init() {
    // Initialize settings
    const settingsManager = new SettingsManager(CONFIG.defaults);

    // Initialize starfield
    const starfieldEl = document.getElementById('starfield');
    const starfield = new StarfieldGenerator(starfieldEl, CONFIG.starfield);
    starfield.generate(settingsManager.get('starsCount'));

    // Initialize parallax
    new ParallaxController();

    // Initialize header stars
    const header = document.querySelector('.site-header');
    if (header) new HeaderStars(header, CONFIG.starfield.headerStars);

    // Initialize settings UI
    new SettingsUI(settingsManager, starfield);

    // Initialize interactive stardust
    new InteractiveStardust();

    // Initialize chat controller
    new ChatController();

    // Initialize keyboard shortcuts
    new KeyboardShortcuts();

    // Initialize easter egg
    new EasterEgg();

    // Initialize visibility controller
    new VisibilityController(starfield);

    // Initialize touch controller
    new TouchController();

    // Console messages
    console.log('🚀 AngulismoTV - Transmisión espacial optimizada');
    console.log('⌨️  Atajos: F (pantalla completa) | Ctrl+R (recargar) | Ctrl+K (personalizar)');
    console.log('🌟 Easter Egg: Haz 7 clicks en cualquier parte');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose settings manager for transmision.js
  window.AngulismoTV = window.AngulismoTV || {};
  window.AngulismoTV.getSettings = () => {
    const settings = new SettingsManager(CONFIG.defaults);
    return {
      autoChat: settings.get('autoChat'),
      autoReload: settings.get('autoReload')
    };
  };

})();