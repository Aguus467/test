// ==================== Sistema de Personalización Completo ====================

(function() {
  'use strict';

  // Detectar tipo de dispositivo
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const supportsHover = window.matchMedia('(hover: hover)').matches;

  // ==================== Configuración por defecto ====================
  const defaultSettings = {
    // Preset
    preset: 'medium',
    
    // Efectos visuales
    starsEnabled: true,
    starsCount: 70,
    shootingStars: true,
    comets: true,
    planets: true,
    auroras: true,
    galaxy: true,
    stardust: true,
    
    // Animaciones
    animationSpeed: 1, // 0=pausado, 0.5=lento, 1=normal, 1.5=rápido, 2=muy rápido
    hoverEffects: true,
    parallax: true,
    interactiveParticles: true,
    
    // Blur
    blurIntensity: 16,
    backdropFilter: true,
    
    // Apariencia
    bgOpacity: 70,
    shadowIntensity: 100,
    accentColor: '#72d6ff',
    
    // Optimización
    batterySaver: false,
    gpuAcceleration: true
  };

  // Presets predefinidos
  const presets = {
    ultra: {
      starsCount: 150,
      shootingStars: true,
      comets: true,
      planets: true,
      auroras: true,
      galaxy: true,
      stardust: true,
      animationSpeed: 1.5,
      hoverEffects: true,
      parallax: true,
      interactiveParticles: true,
      blurIntensity: 20,
      backdropFilter: true,
      bgOpacity: 70,
      shadowIntensity: 150,
      batterySaver: false,
      gpuAcceleration: true
    },
    high: {
      starsCount: 100,
      shootingStars: true,
      comets: true,
      planets: true,
      auroras: true,
      galaxy: true,
      stardust: true,
      animationSpeed: 1,
      hoverEffects: true,
      parallax: true,
      interactiveParticles: true,
      blurIntensity: 16,
      backdropFilter: true,
      bgOpacity: 70,
      shadowIntensity: 100,
      batterySaver: false,
      gpuAcceleration: true
    },
    medium: {
      starsCount: 70,
      shootingStars: true,
      comets: false,
      planets: true,
      auroras: true,
      galaxy: false,
      stardust: false,
      animationSpeed: 1,
      hoverEffects: true,
      parallax: false,
      interactiveParticles: false,
      blurIntensity: 12,
      backdropFilter: true,
      bgOpacity: 70,
      shadowIntensity: 75,
      batterySaver: false,
      gpuAcceleration: true
    },
    low: {
      starsCount: 40,
      shootingStars: false,
      comets: false,
      planets: false,
      auroras: false,
      galaxy: false,
      stardust: false,
      animationSpeed: 0.5,
      hoverEffects: false,
      parallax: false,
      interactiveParticles: false,
      blurIntensity: 6,
      backdropFilter: false,
      bgOpacity: 80,
      shadowIntensity: 50,
      batterySaver: true,
      gpuAcceleration: false
    }
  };

  // ==================== Storage Management ====================
  function loadSettings() {
    try {
      const saved = localStorage.getItem('angulismoSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      }
    } catch (error) {
      console.warn('Error loading settings:', error);
    }
    return { ...defaultSettings };
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem('angulismoSettings', JSON.stringify(settings));
      return true;
    } catch (error) {
      console.warn('Error saving settings:', error);
      return false;
    }
  }

  let currentSettings = loadSettings();

  // ==================== DOM Elements ====================
  const elements = {
    // Panel
    customizeGear: document.getElementById('customizeGear'),
    customizePanel: document.getElementById('customizePanel'),
    closePanel: document.getElementById('closePanel'),
    panelOverlay: document.getElementById('panelOverlay'),
    
    // Presets
    presetButtons: document.querySelectorAll('.preset-btn'),
    
    // Efectos visuales
    starsToggle: document.getElementById('starsToggle'),
    starsIntensity: document.getElementById('starsIntensity'),
    starsValue: document.getElementById('starsValue'),
    shootingStarsToggle: document.getElementById('shootingStarsToggle'),
    cometsToggle: document.getElementById('cometsToggle'),
    planetsToggle: document.getElementById('planetsToggle'),
    aurorasToggle: document.getElementById('aurorasToggle'),
    galaxyToggle: document.getElementById('galaxyToggle'),
    stardustToggle: document.getElementById('stardustToggle'),
    
    // Animaciones
    animationSpeed: document.getElementById('animationSpeed'),
    animSpeedValue: document.getElementById('animSpeedValue'),
    hoverEffectsToggle: document.getElementById('hoverEffectsToggle'),
    parallaxToggle: document.getElementById('parallaxToggle'),
    particlesToggle: document.getElementById('particlesToggle'),
    
    // Blur
    blurIntensity: document.getElementById('blurIntensity'),
    blurValue: document.getElementById('blurValue'),
    backdropToggle: document.getElementById('backdropToggle'),
    
    // Apariencia
    bgOpacity: document.getElementById('bgOpacity'),
    opacityValue: document.getElementById('opacityValue'),
    shadowIntensity: document.getElementById('shadowIntensity'),
    shadowValue: document.getElementById('shadowValue'),
    colorOptions: document.querySelectorAll('.color-option'),
    
    // Optimización
    batterySaverToggle: document.getElementById('batterySaverToggle'),
    gpuAccelToggle: document.getElementById('gpuAccelToggle'),
    fpsEstimate: document.getElementById('fpsEstimate'),
    activeElements: document.getElementById('activeElements'),
    
    // Acciones
    resetSettings: document.getElementById('resetSettings'),
    exportSettings: document.getElementById('exportSettings'),
    importSettings: document.getElementById('importSettings'),
    
    // Starfield
    starfield: document.getElementById('starfield')
  };

  // ==================== Panel Controls ====================
  function openPanel() {
    if (elements.customizePanel) {
      elements.customizePanel.classList.add('active');
      if (elements.panelOverlay) {
        elements.panelOverlay.classList.add('active');
      }
      document.body.style.overflow = 'hidden';
    }
  }

  function closePanel() {
    if (elements.customizePanel) {
      elements.customizePanel.classList.remove('active');
      if (elements.panelOverlay) {
        elements.panelOverlay.classList.remove('active');
      }
      document.body.style.overflow = '';
    }
  }

  // Event listeners para panel
  if (elements.customizeGear) {
    elements.customizeGear.addEventListener('click', openPanel);
  }

  if (elements.closePanel) {
    elements.closePanel.addEventListener('click', closePanel);
  }

  if (elements.panelOverlay) {
    elements.panelOverlay.addEventListener('click', closePanel);
  }

  // Cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.customizePanel?.classList.contains('active')) {
      closePanel();
    }
    // Atajo Ctrl/Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (elements.customizePanel?.classList.contains('active')) {
        closePanel();
      } else {
        openPanel();
      }
    }
  });

  // ==================== Apply Settings ====================
  function applySettings() {
    const root = document.documentElement;
    
    // Accent color
    root.style.setProperty('--accent', currentSettings.accentColor);
    root.style.setProperty('--accent-glow', `${currentSettings.accentColor}80`);
    
    // Blur
    root.style.setProperty('--blur-amount', `${currentSettings.blurIntensity}px`);
    root.style.setProperty('--agenda-blur', `${currentSettings.blurIntensity}px`);
    
    if (!currentSettings.backdropFilter) {
      root.style.setProperty('--blur-amount', '0px');
      root.style.setProperty('--agenda-blur', '0px');
    }
    
    // Animation speed
    const speedMap = { 0: 0, 0.5: 2, 1: 1, 1.5: 0.66, 2: 0.5 };
    const durationMultiplier = speedMap[currentSettings.animationSpeed] || 1;
    root.style.setProperty('--animation-speed', `${0.3 * durationMultiplier}s`);
    root.style.setProperty('--agenda-animation-speed', `${0.3 * durationMultiplier}s`);
    
    // Opacity
    const opacity = currentSettings.bgOpacity / 100;
    root.style.setProperty('--bg-card', `rgba(20, 20, 40, ${opacity * 0.7})`);
    
    // Shadow intensity
    const shadowMult = currentSettings.shadowIntensity / 100;
    root.style.setProperty('--agenda-shadow-intensity', shadowMult);
    
    // Starfield visibility
    if (elements.starfield) {
      elements.starfield.style.display = currentSettings.starsEnabled ? 'block' : 'none';
    }
    
    // Elementos específicos
    applyElementVisibility('.shooting-star', currentSettings.shootingStars);
    applyElementVisibility('.comet', currentSettings.comets);
    applyElementVisibility('.planet', currentSettings.planets);
    applyElementVisibility('.aurora', currentSettings.auroras);
    applyElementVisibility('.spiral-galaxy', currentSettings.galaxy);
    applyElementVisibility('.stardust', currentSettings.stardust);
    
    // Hover effects
    if (!currentSettings.hoverEffects) {
      root.style.setProperty('--hover-transform', 'none');
    } else {
      root.style.setProperty('--hover-transform', 'translateY(-3px)');
    }
    
    // GPU Acceleration
    const gpuClass = currentSettings.gpuAcceleration ? 'gpu-enabled' : 'gpu-disabled';
    document.body.classList.remove('gpu-enabled', 'gpu-disabled');
    document.body.classList.add(gpuClass);
    
    // Battery saver
    if (currentSettings.batterySaver) {
      document.body.classList.add('battery-saver');
      // Pausar animaciones no críticas
      document.querySelectorAll('.star, .shooting-star, .comet, .aurora').forEach(el => {
        el.style.animationPlayState = 'paused';
      });
    } else {
      document.body.classList.remove('battery-saver');
      document.querySelectorAll('.star, .shooting-star, .comet, .aurora').forEach(el => {
        el.style.animationPlayState = 'running';
      });
    }
    
    // Regenerar estrellas si es necesario
    updateStars();
    
    // Actualizar performance info
    updatePerformanceInfo();
  }

  function applyElementVisibility(selector, visible) {
    document.querySelectorAll(selector).forEach(el => {
      el.style.display = visible ? '' : 'none';
    });
  }

  // ==================== Stars Management ====================
  let starsCache = [];

  function generateStars(count) {
    if (!elements.starfield) return;
    
    // Limpiar estrellas existentes
    const existingStars = elements.starfield.querySelectorAll('.star');
    existingStars.forEach(star => star.remove());
    
    starsCache = [];
    const fragment = document.createDocumentFragment();
    
    const regularStars = Math.floor(count * 0.85);
    
    for (let i = 0; i < regularStars; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      
      const layer = Math.floor(Math.random() * 3) + 1;
      star.classList.add(`layer-${layer}`);
      star.setAttribute('data-speed', layer * 0.2);
      
      const size = Math.random() * 2.5 + 0.5;
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.top = Math.random() * 100 + '%';
      star.style.left = Math.random() * 100 + '%';
      star.style.animationDuration = (Math.random() * 3 + 3) + 's';
      star.style.animationDelay = Math.random() * 4 + 's';
      
      fragment.appendChild(star);
      starsCache.push(star);
    }
    
    elements.starfield.appendChild(fragment);
  }

  function updateStars() {
    const currentCount = document.querySelectorAll('.star').length;
    const targetCount = Math.floor(currentSettings.starsCount * 0.85);
    
    if (Math.abs(currentCount - targetCount) > 10 && currentSettings.starsEnabled) {
      generateStars(currentSettings.starsCount);
    }
  }

  // ==================== UI Updates ====================
  function updateUI() {
    // Presets
    elements.presetButtons?.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === currentSettings.preset);
    });
    
    // Toggles
    if (elements.starsToggle) elements.starsToggle.checked = currentSettings.starsEnabled;
    if (elements.shootingStarsToggle) elements.shootingStarsToggle.checked = currentSettings.shootingStars;
    if (elements.cometsToggle) elements.cometsToggle.checked = currentSettings.comets;
    if (elements.planetsToggle) elements.planetsToggle.checked = currentSettings.planets;
    if (elements.aurorasToggle) elements.aurorasToggle.checked = currentSettings.auroras;
    if (elements.galaxyToggle) elements.galaxyToggle.checked = currentSettings.galaxy;
    if (elements.stardustToggle) elements.stardustToggle.checked = currentSettings.stardust;
    if (elements.hoverEffectsToggle) elements.hoverEffectsToggle.checked = currentSettings.hoverEffects;
    if (elements.parallaxToggle) elements.parallaxToggle.checked = currentSettings.parallax;
    if (elements.particlesToggle) elements.particlesToggle.checked = currentSettings.interactiveParticles;
    if (elements.backdropToggle) elements.backdropToggle.checked = currentSettings.backdropFilter;
    if (elements.batterySaverToggle) elements.batterySaverToggle.checked = currentSettings.batterySaver;
    if (elements.gpuAccelToggle) elements.gpuAccelToggle.checked = currentSettings.gpuAcceleration;
    
    // Ranges
    if (elements.starsIntensity) {
      elements.starsIntensity.value = currentSettings.starsCount;
      const progress = ((currentSettings.starsCount - 20) / (150 - 20)) * 100;
      elements.starsIntensity.style.setProperty('--range-progress', `${progress}%`);
    }
    if (elements.starsValue) elements.starsValue.textContent = currentSettings.starsCount;
    
    if (elements.animationSpeed) {
      elements.animationSpeed.value = currentSettings.animationSpeed;
      const speedLabels = { 0: 'Pausado', 0.5: 'Lento', 1: 'Normal', 1.5: 'Rápido', 2: 'Muy rápido' };
      if (elements.animSpeedValue) elements.animSpeedValue.textContent = speedLabels[currentSettings.animationSpeed];
    }
    
    if (elements.blurIntensity) {
      elements.blurIntensity.value = currentSettings.blurIntensity;
      const progress = (currentSettings.blurIntensity / 30) * 100;
      elements.blurIntensity.style.setProperty('--range-progress', `${progress}%`);
    }
    if (elements.blurValue) elements.blurValue.textContent = `${currentSettings.blurIntensity}px`;
    
    if (elements.bgOpacity) {
      elements.bgOpacity.value = currentSettings.bgOpacity;
      const progress = ((currentSettings.bgOpacity - 30) / (100 - 30)) * 100;
      elements.bgOpacity.style.setProperty('--range-progress', `${progress}%`);
    }
    if (elements.opacityValue) elements.opacityValue.textContent = `${currentSettings.bgOpacity}%`;
    
    if (elements.shadowIntensity) {
      elements.shadowIntensity.value = currentSettings.shadowIntensity;
      const progress = (currentSettings.shadowIntensity / 150) * 100;
      elements.shadowIntensity.style.setProperty('--range-progress', `${progress}%`);
    }
    if (elements.shadowValue) elements.shadowValue.textContent = `${currentSettings.shadowIntensity}%`;
    
    // Color
    elements.colorOptions?.forEach(option => {
      option.classList.toggle('active', option.dataset.color === currentSettings.accentColor);
    });
  }

  // ==================== Performance Info ====================
  function updatePerformanceInfo() {
    if (!elements.fpsEstimate || !elements.activeElements) return;
    
    // Calcular FPS estimado basado en configuración
    let estimatedFPS = 60;
    
    if (currentSettings.batterySaver) estimatedFPS -= 15;
    if (!currentSettings.gpuAcceleration) estimatedFPS -= 10;
    if (currentSettings.starsCount > 100) estimatedFPS -= 5;
    if (currentSettings.blurIntensity > 20) estimatedFPS -= 5;
    if (currentSettings.parallax) estimatedFPS -= 3;
    if (currentSettings.interactiveParticles) estimatedFPS -= 3;
    
    estimatedFPS = Math.max(30, Math.min(60, estimatedFPS));
    
    elements.fpsEstimate.textContent = `${estimatedFPS} FPS`;
    elements.fpsEstimate.style.color = estimatedFPS >= 55 ? '#4ade80' : 
                                        estimatedFPS >= 45 ? '#fbbf24' : '#f87171';
    
    // Contar elementos activos
    const activeCount = document.querySelectorAll('.star, .shooting-star, .comet, .planet, .aurora, .stardust').length;
    elements.activeElements.textContent = activeCount;
  }

  // ==================== Event Listeners ====================
  
  // Presets
  elements.presetButtons?.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      currentSettings = {
        ...currentSettings,
        ...presets[preset],
        preset,
        accentColor: currentSettings.accentColor // Mantener color
      };
      saveSettings(currentSettings);
      updateUI();
      applySettings();
      showFeedback(btn, 'Preset aplicado');
    });
  });

  // Stars
  if (elements.starsToggle) {
    elements.starsToggle.addEventListener('change', () => {
      currentSettings.starsEnabled = elements.starsToggle.checked;
      saveSettings(currentSettings);
      applySettings();
    });
  }

  if (elements.starsIntensity) {
    elements.starsIntensity.addEventListener('input', () => {
      const value = parseInt(elements.starsIntensity.value);
      currentSettings.starsCount = value;
      if (elements.starsValue) elements.starsValue.textContent = value;
      const progress = ((value - 20) / (150 - 20)) * 100;
      elements.starsIntensity.style.setProperty('--range-progress', `${progress}%`);
    });
    
    elements.starsIntensity.addEventListener('change', () => {
      saveSettings(currentSettings);
      applySettings();
    });
  }

  // Other toggles
  const toggleMap = {
    shootingStarsToggle: 'shootingStars',
    cometsToggle: 'comets',
    planetsToggle: 'planets',
    aurorasToggle: 'auroras',
    galaxyToggle: 'galaxy',
    stardustToggle: 'stardust',
    hoverEffectsToggle: 'hoverEffects',
    parallaxToggle: 'parallax',
    particlesToggle: 'interactiveParticles',
    backdropToggle: 'backdropFilter',
    batterySaverToggle: 'batterySaver',
    gpuAccelToggle: 'gpuAcceleration'
  };

  Object.entries(toggleMap).forEach(([elementKey, settingKey]) => {
    const element = elements[elementKey];
    if (element) {
      element.addEventListener('change', () => {
        currentSettings[settingKey] = element.checked;
        saveSettings(currentSettings);
        applySettings();
      });
    }
  });

  // Animation speed
  if (elements.animationSpeed) {
    elements.animationSpeed.addEventListener('input', () => {
      const value = parseFloat(elements.animationSpeed.value);
      const labels = { 0: 'Pausado', 0.5: 'Lento', 1: 'Normal', 1.5: 'Rápido', 2: 'Muy rápido' };
      if (elements.animSpeedValue) elements.animSpeedValue.textContent = labels[value];
      currentSettings.animationSpeed = value;
    });
    
    elements.animationSpeed.addEventListener('change', () => {
      saveSettings(currentSettings);
      applySettings();
    });
  }

  // Blur
  if (elements.blurIntensity) {
    elements.blurIntensity.addEventListener('input', () => {
      const value = parseInt(elements.blurIntensity.value);
      if (elements.blurValue) elements.blurValue.textContent = `${value}px`;
      const progress = (value / 30) * 100;
      elements.blurIntensity.style.setProperty('--range-progress', `${progress}%`);
      currentSettings.blurIntensity = value;
    });
    
    elements.blurIntensity.addEventListener('change', () => {
      saveSettings(currentSettings);
      applySettings();
    });
  }

  // Opacity
  if (elements.bgOpacity) {
    elements.bgOpacity.addEventListener('input', () => {
      const value = parseInt(elements.bgOpacity.value);
      if (elements.opacityValue) elements.opacityValue.textContent = `${value}%`;
      const progress = ((value - 30) / (100 - 30)) * 100;
      elements.bgOpacity.style.setProperty('--range-progress', `${progress}%`);
      currentSettings.bgOpacity = value;
    });
    
    elements.bgOpacity.addEventListener('change', () => {
      saveSettings(currentSettings);
      applySettings();
    });
  }

  // Shadow
  if (elements.shadowIntensity) {
    elements.shadowIntensity.addEventListener('input', () => {
      const value = parseInt(elements.shadowIntensity.value);
      if (elements.shadowValue) elements.shadowValue.textContent = `${value}%`;
      const progress = (value / 150) * 100;
      elements.shadowIntensity.style.setProperty('--range-progress', `${progress}%`);
      currentSettings.shadowIntensity = value;
    });
    
    elements.shadowIntensity.addEventListener('change', () => {
      saveSettings(currentSettings);
      applySettings();
    });
  }

  // Color
  elements.colorOptions?.forEach(option => {
    option.addEventListener('click', () => {
      currentSettings.accentColor = option.dataset.color;
      saveSettings(currentSettings);
      updateUI();
      applySettings();
    });
  });

  // Reset
  if (elements.resetSettings) {
    elements.resetSettings.addEventListener('click', () => {
      if (confirm('¿Restaurar todos los ajustes por defecto?')) {
        currentSettings = { ...defaultSettings };
        saveSettings(currentSettings);
        updateUI();
        applySettings();
        showFeedback(elements.resetSettings, '✓ Restaurado');
      }
    });
  }

  // Export
  if (elements.exportSettings) {
    elements.exportSettings.addEventListener('click', () => {
      const dataStr = JSON.stringify(currentSettings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'angulismo-settings.json';
      link.click();
      URL.revokeObjectURL(url);
      showFeedback(elements.exportSettings, '✓ Exportado');
    });
  }

  // Import
  if (elements.importSettings) {
    elements.importSettings.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const imported = JSON.parse(event.target.result);
              currentSettings = { ...defaultSettings, ...imported };
              saveSettings(currentSettings);
              updateUI();
              applySettings();
              showFeedback(elements.importSettings, '✓ Importado');
            } catch (error) {
              alert('Error al importar: archivo inválido');
            }
          };
          reader.readAsText(file);
        }
      };
      input.click();
    });
  }

  // ==================== Helpers ====================
  function showFeedback(button, text) {
    if (!button) return;
    const originalText = button.textContent;
    button.textContent = text;
    button.classList.add('success-feedback');
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('success-feedback');
    }, 2000);
  }

  // ==================== Initialize ====================
  function initialize() {
    // Aplicar preset automático si es primera vez
    if (!localStorage.getItem('angulismoSettings')) {
      const autoPreset = isMobile ? 'medium' : 'high';
      currentSettings = {
        ...currentSettings,
        ...presets[autoPreset],
        preset: autoPreset
      };
      saveSettings(currentSettings);
    }
    
    updateUI();
    applySettings();
    generateStars(currentSettings.starsCount);
    
    console.log('🎨 Sistema de personalización cargado');
    console.log('Preset activo:', currentSettings.preset);
    console.log('Atajo: Ctrl+K para personalizar');
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Exponer API global (opcional)
  window.AngulismoCustomization = {
    getSettings: () => ({ ...currentSettings }),
    applyPreset: (preset) => {
      if (presets[preset]) {
        currentSettings = { ...currentSettings, ...presets[preset], preset };
        saveSettings(currentSettings);
        updateUI();
        applySettings();
      }
    },
    reset: () => {
      currentSettings = { ...defaultSettings };
      saveSettings(currentSettings);
      updateUI();
      applySettings();
    }
  };

})();