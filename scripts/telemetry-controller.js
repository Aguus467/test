/**
 * AngulismoTV - Telemetry Controller (UNIVERSAL)
 * Sistema unificado que maneja F1 + otras secciones
 * Reemplaza completamente telemetry-controller.js
 */

(function() {
  'use strict';

  // ==================== CONFIGURACIÓN DE PANELES POR SECCIÓN ====================
  const PANEL_CONFIG = {
    // 🏎️ F1 - Telemetría en vivo (sistema original)
    f1: {
      url: 'https://www.f1telemetry.com/es/live-timing',
      title: 'Telemetría F1 en Vivo',
      label: 'Telemetria F1:',
      buttonLabel: 'Telemetria F1',
      enabled: true,
      storageKey: 'angulismoTelemetryHidden', // Mantiene compatibilidad
      keyboardShortcut: 't'
    },

    // 🏍️ MotoGP - Timing en vivo
    motogp: {
      url: 'https://www.motogp.com/en/live-timing',
      title: 'Timing MotoGP',
      label: 'Timing MotoGP:',
      buttonLabel: 'Timing MotoGP',
      enabled: true,
      storageKey: 'angulismoPanelHidden_motogp',
      keyboardShortcut: 'l'
    },

    // 🏈 NFL - Estadísticas en vivo
    nfl: {
      url: 'https://www.nfl.com/scores',
      title: 'NFL Live Stats',
      label: 'NFL Stats:',
      buttonLabel: 'NFL Stats',
      enabled: true,
      storageKey: 'angulismoPanelHidden_nfl',
      keyboardShortcut: 'l'
    },

    // 🏀 NBA - Box Score en vivo
    nba: {
      url: 'https://www.nba.com/games',
      title: 'NBA Live',
      label: 'NBA Live:',
      buttonLabel: 'NBA Live',
      enabled: true,
      storageKey: 'angulismoPanelHidden_nba',
      keyboardShortcut: 'l'
    },

    // ⚽ Fútbol - Resultados en vivo
    futbol: {
      url: 'https://www.livescore.com',
      title: 'Resultados en Vivo',
      label: 'Marcadores:',
      buttonLabel: 'Marcadores',
      enabled: true,
      storageKey: 'angulismoPanelHidden_futbol',
      keyboardShortcut: 'l'
    },

    // 🏒 NHL - Hockey en vivo
    nhl: {
      url: 'https://www.nhl.com/scores',
      title: 'NHL Scores',
      label: 'NHL Live:',
      buttonLabel: 'NHL Live',
      enabled: true,
      storageKey: 'angulismoPanelHidden_nhl',
      keyboardShortcut: 'l'
    },

    // 🎾 Tennis - Resultados en vivo
    tennis: {
      url: 'https://www.flashscore.com/tennis/',
      title: 'Tennis Live',
      label: 'Tennis Live:',
      buttonLabel: 'Tennis',
      enabled: true,
      storageKey: 'angulismoPanelHidden_tennis',
      keyboardShortcut: 'l'
    },

    // 🎮 Default - Panel por defecto
    default: {
      url: 'https://promiedos.com.ar',
      title: 'Promiedos',
      label: 'Promiedos:',
      buttonLabel: 'Promiedos',
      enabled: true,
      storageKey: 'angulismoPanelHidden_default',
      keyboardShortcut: 'l'
    }
  };

  class TelemetryController {
    constructor() {
      // Elementos del DOM
      this.toggle = null; // Se crea dinámicamente
      this.toggleContainer = null; // Contenedor del botón
      this.labelElement = null; // Label del botón
      this.card = document.querySelector('.telemetry-card');
      this.container = document.querySelector('.container');
      this.iframe = document.getElementById('f1Telemetry');
      
      // Estado
      this.isHidden = false;
      this.currentSection = this.detectSection();
      this.config = this.getSectionConfig();
      
      console.log('🔍 Sección detectada:', this.currentSection);
      
      this.init();
    }

    // 🔥 DETECTAR SECCIÓN desde URL (c=X o channel=X)
    detectSection() {
      const urlParams = new URLSearchParams(window.location.search);
      const shortChannel = urlParams.get('c');
      const longChannel = urlParams.get('channel');
      const channel = (shortChannel || longChannel || 'default').toLowerCase();
      
      return channel;
    }

    // 🔥 OBTENER CONFIGURACIÓN DE LA SECCIÓN
    getSectionConfig() {
      return PANEL_CONFIG[this.currentSection] || PANEL_CONFIG.default;
    }

    init() {
      // 🔥 SI LA SECCIÓN NO TIENE PANEL, OCULTAR TODO
      if (!this.config.enabled) {
        // 🧪 TEST: Comentado para mantener botón visible siempre
        // this.hidePanelPermanently();
        // return;
        
        // Crear botón pero no activar panel
        this.setupToggleButton();
        if (this.toggle) {
          this.toggle.style.opacity = '0.5';
          this.toggle.style.cursor = 'not-allowed';
          this.toggle.title = 'Panel no disponible para esta sección';
        }
        return;
      }

      // 🔥 ACTIVAR MODO PANEL (siempre usar f1-mode para layout correcto)
      document.body.classList.add('f1-mode');
      
      console.log(`🚀 ${this.currentSection.toUpperCase()} MODE ACTIVADO`);

      // 🔥 CREAR O ENCONTRAR BOTÓN
      this.setupToggleButton();

      if (!this.toggle || !this.card || !this.iframe || !this.container) {
        console.warn('TelemetryController: Elementos no encontrados');
        return;
      }

      // 🔥 CONFIGURAR PANEL (URL + Label)
      this.setupPanel();

      // 🔥 Cargar estado guardado
      this.loadState();

      // Configurar evento de toggle
      this.toggle.addEventListener('click', () => this.toggleTelemetry());

      // Aplicar estado inicial
      if (this.isHidden) {
        this.hideTelemetry(false);
      } else {
        this.showTelemetry(false);
      }

      console.log(`✅ Panel inicializado: ${this.currentSection.toUpperCase()}`);
      console.log(`📺 URL cargada: ${this.config.url}`);
      console.log(`⌨️  Atajo: Ctrl+${this.config.keyboardShortcut.toUpperCase()}`);
    }

    // 🔥 CREAR O ENCONTRAR BOTÓN DE TOGGLE
    setupToggleButton() {
      // Buscar botón existente
      this.toggle = document.getElementById('telemetryToggle');
      
      // Si no existe, crearlo
      if (!this.toggle) {
        console.log('🔧 Creando botón de toggle...');
        this.createToggleButton();
      }
      
      // Asegurar que el botón esté visible
      if (this.toggle) {
        this.toggle.style.display = 'flex';
      }
    }

    // 🔥 CREAR BOTÓN Y LABEL DINÁMICAMENTE
    createToggleButton() {
      // Buscar la options-bar
      const optionsBar = document.querySelector('.options-bar');
      if (!optionsBar) {
        console.warn('Options bar no encontrada');
        return;
      }

      // Crear contenedor card-header
      this.toggleContainer = document.createElement('div');
      this.toggleContainer.className = 'card-header';

      // Crear label
      this.labelElement = document.createElement('label');
      this.labelElement.textContent = this.config.label;
      this.labelElement.style.fontWeight = '600';
      this.labelElement.style.color = 'var(--text-secondary)';
      this.labelElement.style.fontSize = '0.9rem';
      this.labelElement.style.marginRight = '-4px';

      // Crear botón
      this.toggle = document.createElement('button');
      this.toggle.id = 'telemetryToggle';
      this.toggle.className = 'telemetry-toggle';
      this.toggle.setAttribute('aria-label', `Minimizar ${this.config.buttonLabel}`);
      this.toggle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <path d="M12 5v14M5 12h14"/>
        </svg>`;

      // Ensamblar
      this.toggleContainer.appendChild(this.labelElement);
      this.toggleContainer.appendChild(this.toggle);

      // Insertar antes del botón de Chat (buscar el chat-toggle)
      const chatToggle = optionsBar.querySelector('.chat-toggle');
      if (chatToggle && chatToggle.parentElement) {
        const chatContainer = chatToggle.parentElement;
        optionsBar.insertBefore(this.toggleContainer, chatContainer);
      } else {
        // Si no encuentra chat, agregar al final
        optionsBar.appendChild(this.toggleContainer);
      }

      console.log('✅ Botón de toggle creado');
    }

    // 🔥 CONFIGURAR PANEL (URL + LABEL)
    setupPanel() {
      // Actualizar URL del iframe
      if (this.iframe) {
        this.iframe.src = this.config.url;
        this.iframe.title = this.config.title;
      }

      // Actualizar label si existe
      this.updateLabel();

      // Mostrar card
      if (this.card) {
        this.card.style.display = 'flex';
      }
    }

    // 🔥 ACTUALIZAR LABEL DEL BOTÓN + HACERLO CLICKEABLE
    updateLabel() {
      // Si el botón fue creado dinámicamente, el label ya está configurado
      if (this.labelElement) {
        this.labelElement.textContent = this.config.label;
        this.makeLabelClickable();
        return;
      }

      // Si el botón existía en el HTML, buscar su label
      if (this.toggle) {
        const cardHeader = this.toggle.closest('.card-header');
        if (cardHeader) {
          this.labelElement = cardHeader.querySelector('label');
          if (this.labelElement) {
            this.labelElement.textContent = this.config.label;
          } else {
            // Crear label si no existe
            this.labelElement = document.createElement('label');
            this.labelElement.textContent = this.config.label;
            this.labelElement.style.fontWeight = '600';
            this.labelElement.style.color = 'var(--text-secondary)';
            this.labelElement.style.fontSize = '0.9rem';
            this.labelElement.style.marginRight = '-4px';
            cardHeader.insertBefore(this.labelElement, this.toggle);
          }
        }
      }

      this.makeLabelClickable();
    }

    // 🔥 HACER EL LABEL CLICKEABLE PARA MOSTRAR SELECTOR
    makeLabelClickable() {
      if (!this.labelElement) return;

      // Hacer el label clickeable visualmente
      this.labelElement.style.cursor = 'pointer';
      this.labelElement.style.userSelect = 'none';
      this.labelElement.style.transition = 'color 0.2s ease';
      this.labelElement.title = 'Click para cambiar fuente';

      // Efecto hover
      this.labelElement.addEventListener('mouseenter', () => {
        this.labelElement.style.color = 'var(--accent)';
      });
      
      this.labelElement.addEventListener('mouseleave', () => {
        this.labelElement.style.color = 'var(--text-secondary)';
      });

      // Click para mostrar selector
      this.labelElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showSourceSelector();
      });
    }

    // 🔥 MOSTRAR SELECTOR DE FUENTES
    showSourceSelector() {
      // Si ya existe un selector, eliminarlo
      const existingSelector = document.getElementById('panelSourceSelector');
      if (existingSelector) {
        existingSelector.remove();
        return;
      }

      // Crear selector dropdown
      const selector = document.createElement('div');
      selector.id = 'panelSourceSelector';
      selector.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, rgba(20, 20, 40, 0.98), rgba(30, 30, 50, 0.98));
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 20px;
        z-index: 10000;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        min-width: 300px;
        max-width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        animation: fadeIn 0.2s ease;
      `;

      // Título
      const title = document.createElement('h3');
      title.textContent = 'Seleccionar Fuente';
      title.style.cssText = `
        margin: 0 0 15px 0;
        color: var(--accent);
        font-size: 1.1rem;
        font-weight: 700;
        text-align: center;
        border-bottom: 1px solid var(--border-color);
        padding-bottom: 10px;
      `;
      selector.appendChild(title);

      // Crear opciones
      const optionsContainer = document.createElement('div');
      optionsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
      `;

      // Obtener todas las secciones habilitadas
      Object.keys(PANEL_CONFIG).forEach(key => {
        const config = PANEL_CONFIG[key];
        if (!config.enabled) return;

        const option = document.createElement('button');
        option.textContent = config.buttonLabel;
        option.dataset.section = key;
        
        // Marcar la sección actual
        const isCurrent = key === this.currentSection;
        option.style.cssText = `
          padding: 12px 16px;
          background: ${isCurrent ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)'};
          border: 1px solid ${isCurrent ? 'var(--accent)' : 'var(--border-color)'};
          border-radius: 8px;
          color: ${isCurrent ? '#000' : 'var(--text-primary)'};
          font-weight: ${isCurrent ? '700' : '600'};
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        `;

        // Hover effect
        option.addEventListener('mouseenter', () => {
          if (!isCurrent) {
            option.style.background = 'rgba(255, 255, 255, 0.1)';
            option.style.borderColor = 'var(--accent)';
            option.style.transform = 'translateX(5px)';
          }
        });

        option.addEventListener('mouseleave', () => {
          if (!isCurrent) {
            option.style.background = 'rgba(255, 255, 255, 0.05)';
            option.style.borderColor = 'var(--border-color)';
            option.style.transform = 'translateX(0)';
          }
        });

        // Click para cambiar fuente
        option.addEventListener('click', () => {
          if (key !== this.currentSection) {
            this.changeSource(key);
          }
          selector.remove();
        });

        optionsContainer.appendChild(option);
      });

      selector.appendChild(optionsContainer);

      // Botón cerrar
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕ Cerrar';
      closeBtn.style.cssText = `
        margin-top: 15px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--text-secondary);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
      `;

      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255, 0, 0, 0.2)';
        closeBtn.style.borderColor = '#ff4444';
        closeBtn.style.color = '#ff4444';
      });

      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        closeBtn.style.borderColor = 'var(--border-color)';
        closeBtn.style.color = 'var(--text-secondary)';
      });

      closeBtn.addEventListener('click', () => selector.remove());
      selector.appendChild(closeBtn);

      // Agregar al DOM (sin overlay oscuro)
      document.body.appendChild(selector);

      // Cerrar al hacer click fuera del selector
      setTimeout(() => {
        document.addEventListener('click', function closeSelector(e) {
          if (!selector.contains(e.target) && e.target !== this.labelElement) {
            selector.remove();
            document.removeEventListener('click', closeSelector);
          }
        }.bind(this));
      }, 100);

      // Agregar animación CSS si no existe
      if (!document.getElementById('panelSelectorAnimation')) {
        const style = document.createElement('style');
        style.id = 'panelSelectorAnimation';
        style.textContent = `
          @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -45%); }
            to { opacity: 1; transform: translate(-50%, -50%); }
          }
        `;
        document.head.appendChild(style);
      }
    }

    // 🔥 CAMBIAR FUENTE DEL PANEL
    changeSource(newSection) {
      const newConfig = PANEL_CONFIG[newSection];
      if (!newConfig || !newConfig.enabled) {
        console.warn('Sección no válida:', newSection);
        return;
      }

      console.log(`🔄 Cambiando de ${this.currentSection} a ${newSection}`);

      // Actualizar configuración
      this.currentSection = newSection;
      this.config = newConfig;

      // Actualizar URL del iframe
      if (this.iframe) {
        this.iframe.src = this.config.url;
        this.iframe.title = this.config.title;
        console.log('📺 Nueva URL:', this.config.url);
      }

      // Actualizar label
      if (this.labelElement) {
        this.labelElement.textContent = this.config.label;
      }

      // Actualizar atributos del botón
      if (this.toggle) {
        this.toggle.setAttribute('aria-label', `Ocultar ${this.config.buttonLabel}`);
      }

      // Mostrar notificación
      this.showNotification(`✓ Cambiado a ${this.config.buttonLabel}`);
    }

    // 🔥 MOSTRAR NOTIFICACIÓN TEMPORAL
    showNotification(message) {
      const notification = document.createElement('div');
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, var(--accent), var(--accent-purple));
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        animation: slideIn 0.3s ease;
      `;

      // Agregar animación
      if (!document.getElementById('notificationAnimation')) {
        const style = document.createElement('style');
        style.id = 'notificationAnimation';
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }

      document.body.appendChild(notification);

      // Remover después de 3 segundos
      setTimeout(() => {
        notification.style.transition = 'all 0.3s ease';
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    // 🔥 OCULTAR PERMANENTEMENTE (sección sin panel)
    hidePanelPermanently() {
      // Ocultar botón si existe
      if (this.toggle) {
        const cardHeader = this.toggle.closest('.card-header');
        if (cardHeader) {
          cardHeader.style.display = 'none';
        }
      }

      // Ocultar card
      if (this.card) {
        this.card.style.display = 'none';
      }

      // Remover clases de modo
      document.body.classList.remove('f1-mode', 'left-panel-mode');

      console.log(`🚫 Panel desactivado para: ${this.currentSection}`);
    }

    toggleTelemetry() {
      this.isHidden = !this.isHidden;
      
      if (this.isHidden) {
        this.hideTelemetry(true);
      } else {
        this.showTelemetry(true);
      }

      this.saveState();
      console.log(`📊 Panel ${this.isHidden ? 'ocultado' : 'mostrado'} (${this.currentSection})`);
    }

    hideTelemetry(animate = true) {
      // Agregar clases para ocultar
      this.card.classList.add('hidden');
      this.container.classList.add('telemetry-hidden');
      this.toggle.classList.add('rotated');
      
      // Cambiar icono a "mostrar"
      this.toggle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <path d="M12 5v14M5 12h14"/>
        </svg>`;
      
      this.toggle.setAttribute('aria-label', `Mostrar ${this.config.buttonLabel}`);
    }

    showTelemetry(animate = true) {
      // Remover clases de ocultamiento
      this.card.classList.remove('hidden');
      this.container.classList.remove('telemetry-hidden');
      this.toggle.classList.remove('rotated');
      
      // Cambiar icono a "ocultar"
      this.toggle.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <path d="M12 19V5M5 12h14"/>
        </svg>`;
      
      this.toggle.setAttribute('aria-label', `Ocultar ${this.config.buttonLabel}`);
    }

    saveState() {
      try {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.isHidden));
      } catch (error) {
        console.warn('Error guardando estado del panel:', error);
      }
    }

    loadState() {
      try {
        const saved = localStorage.getItem(this.config.storageKey);
        if (saved !== null) {
          this.isHidden = JSON.parse(saved);
        }
      } catch (error) {
        console.warn('Error cargando estado del panel:', error);
        this.isHidden = false;
      }
    }

    // 🔥 API PÚBLICA - Cambiar URL dinámicamente
    changeURL(newUrl) {
      if (this.iframe) {
        this.iframe.src = newUrl;
        console.log('📺 URL del panel cambiada a:', newUrl);
      }
    }

    // 🔥 API PÚBLICA - Obtener sección actual
    getCurrentSection() {
      return this.currentSection;
    }

    // 🔥 API PÚBLICA - Verificar si está habilitado
    isPanelEnabled() {
      return this.config.enabled;
    }

    // 🔥 API PÚBLICA (Compatibilidad con código anterior)
    isF1Mode() {
      return this.currentSection === 'f1';
    }

    enableF1Mode() {
      console.warn('enableF1Mode() deprecado - usa detección automática por URL');
    }
  }

  function init() {
    // Crear instancia del controlador
    const telemetryController = new TelemetryController();

    // Exponer API global (mantener compatibilidad)
    window.AngulismoTV = window.AngulismoTV || {};
    window.AngulismoTV.telemetryController = telemetryController;
    window.AngulismoTV.leftPanelController = telemetryController; // Alias

    // 🔥 Atajo de teclado dinámico según la sección
    document.addEventListener('keydown', (e) => {
      if (telemetryController.isPanelEnabled() && 
          (e.ctrlKey || e.metaKey) && 
          e.key === telemetryController.config.keyboardShortcut) {
        e.preventDefault();
        telemetryController.toggleTelemetry();
      }
    });

    // Log de inicialización
    if (telemetryController.isPanelEnabled()) {
      const emoji = telemetryController.isF1Mode() ? '🏎️' : '📦';
      console.log(`${emoji} ${telemetryController.getCurrentSection().toUpperCase()} Panel - ACTIVADO`);
      console.log('📺 URL:', telemetryController.config.url);
    } else {
      console.log('ℹ️ Panel lateral desactivado para esta sección');
    }
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ==================== GUÍA DE USO ====================
  /*
  
  📚 ESTE SCRIPT UNIFICADO:
  
  ✅ Reemplaza completamente telemetry-controller.js
  ✅ Mantiene 100% compatibilidad con F1 (usa mismo storage key)
  ✅ Crea botón automáticamente si no existe en HTML
  ✅ Soporta múltiples secciones con configuración simple
  ✅ Selector de fuentes clickeando en el label
  ✅ Sin overlay oscuro - experiencia fluida
  
  🎯 SECCIONES DISPONIBLES:
  - f1      → Telemetría F1 (Ctrl+T)
  - motogp  → Timing MotoGP (Ctrl+L)
  - nfl     → NFL Stats (Ctrl+L)
  - nba     → NBA Live (Ctrl+L)
  - futbol  → Livescore (Ctrl+L)
  - nhl     → NHL Scores (Ctrl+L)
  - tennis  → Tennis Live (Ctrl+L)
  - default → Promiedos (Ctrl+L)
  
  ➕ AGREGAR NUEVA SECCIÓN:
  
  tuSeccion: {
    url: 'https://tu-web.com',
    title: 'Título del iframe',
    label: 'Label en UI:',
    buttonLabel: 'Texto botón',
    enabled: true,
    storageKey: 'angulismoPanelHidden_tuSeccion',
    keyboardShortcut: 'l'
  }
  
  🔧 API DISPONIBLE:
  
  window.AngulismoTV.telemetryController.changeURL('https://nueva-url.com');
  window.AngulismoTV.telemetryController.getCurrentSection();
  window.AngulismoTV.telemetryController.isPanelEnabled();
  window.AngulismoTV.telemetryController.isF1Mode();
  
  💡 USO DEL SELECTOR:
  
  - Click en el label (ej: "Telemetría F1:") para abrir selector
  - Selecciona cualquier fuente disponible
  - Cambio instantáneo sin recargar página
  - Notificación de confirmación
  - Click fuera o botón "✕ Cerrar" para cerrar
  
  📱 RESPONSIVE:
  
  - Layout adaptativo en móvil/tablet (apilado vertical)
  - Layout horizontal en landscape
  - Botón y selector optimizados para táctil
  
  🎨 CARACTERÍSTICAS:
  
  - Modal flotante sin overlay oscuro
  - Animaciones suaves de entrada/salida
  - Hover effects en todas las opciones
  - Opción actual destacada con color accent
  - Notificación toast en la esquina inferior derecha
  - Auto-cierre al click fuera del selector
  
  */

  console.log('📦 Telemetry Controller v3.1 - Universal Multi-Section System with Source Selector');

})();
