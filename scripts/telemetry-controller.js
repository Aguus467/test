/**
 * AngulismoTV - Telemetry Controller (CONDICIONAL F1)
 * Solo se activa cuando c=F1 o channel=F1 en la URL
 */

(function() {
  'use strict';

  class TelemetryController {
    constructor() {
      this.toggle = document.getElementById('telemetryToggle');
      this.card = document.querySelector('.telemetry-card');
      this.container = document.querySelector('.container');
      this.iframe = document.getElementById('f1Telemetry');
      this.isHidden = false;
      this.isF1Content = this.checkIfF1Content();
      
      this.init();
    }

    // 🔥 DETECTAR F1 por parámetro c=F1 o channel=F1 (nombres cortos y largos)
    checkIfF1Content() {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Verificar ambos formatos (corto y largo)
      const shortChannel = urlParams.get('c');
      const longChannel = urlParams.get('channel');
      const channel = shortChannel || longChannel;
      
      const isF1 = channel && channel.toLowerCase() === 'f1';
      
      console.log('🔍 Detectando F1:', { shortChannel, longChannel, isF1 });
      return isF1;
    }

    init() {
      // 🔥 OCULTAR COMPLETAMENTE si no es F1
      if (!this.isF1Content) {
        this.hideTelemetryPermanently();
        return;
      }

      // 🔥 ACTIVAR MODO F1
      document.body.classList.add('f1-mode');
      console.log('🏎️ F1 MODE ACTIVADO');

      if (!this.toggle || !this.card || !this.iframe || !this.container) {
        console.warn('TelemetryController: Elementos no encontrados');
        return;
      }

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

      console.log('✅ TelemetryController inicializado - MODO F1 ACTIVADO');
      console.log('⌨️  Atajo: Ctrl+T para alternar telemetría');
    }

    // 🔥 OCULTAR PERMANENTEMENTE (no es F1)
    hideTelemetryPermanently() {
      // Ocultar botón de telemetría
      if (this.toggle) {
        this.toggle.style.display = 'none';
      }

      // Asegurar que la card está oculta
      if (this.card) {
        this.card.style.display = 'none';
      }

      // Remover clase F1 si existe
      document.body.classList.remove('f1-mode');

      console.log('🚫 No es F1 - Telemetría desactivada');
    }

    toggleTelemetry() {
      this.isHidden = !this.isHidden;
      
      if (this.isHidden) {
        this.hideTelemetry(true);
      } else {
        this.showTelemetry(true);
      }

      this.saveState();
      console.log(`📊 Telemetría ${this.isHidden ? 'ocultada' : 'mostrada'}`);
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
      
      this.toggle.setAttribute('aria-label', 'Mostrar telemetría F1');
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
      
      this.toggle.setAttribute('aria-label', 'Ocultar telemetría F1');
    }

    saveState() {
      try {
        localStorage.setItem('angulismoTelemetryHidden', JSON.stringify(this.isHidden));
      } catch (error) {
        console.warn('Error guardando estado de telemetría:', error);
      }
    }

    loadState() {
      try {
        const saved = localStorage.getItem('angulismoTelemetryHidden');
        if (saved !== null) {
          this.isHidden = JSON.parse(saved);
        }
      } catch (error) {
        console.warn('Error cargando estado de telemetría:', error);
        this.isHidden = false;
      }
    }

    // 🔥 API PÚBLICA - Activar manualmente (por si acaso)
    enableF1Mode() {
      this.isF1Content = true;
      document.body.classList.add('f1-mode');
      if (this.toggle) this.toggle.style.display = 'flex';
      if (this.card) this.card.style.display = 'flex';
      this.init();
    }

    // 🔥 API PÚBLICA - Verificar si está en modo F1
    isF1Mode() {
      return this.isF1Content;
    }
  }

  function init() {
    // Crear instancia del controlador
    const telemetryController = new TelemetryController();

    // Exponer API global
    window.AngulismoTV = window.AngulismoTV || {};
    window.AngulismoTV.telemetryController = telemetryController;

    // 🔥 Atajo de teclado Ctrl+T (solo en modo F1)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't' && telemetryController.isF1Mode()) {
        e.preventDefault();
        telemetryController.toggleTelemetry();
      }
    });

    // Log de inicialización
    if (telemetryController.isF1Mode()) {
      console.log('🏎️ F1 Telemetry Panel - ACTIVADO');
      console.log('📺 URL de telemetría:', document.getElementById('f1Telemetry')?.src);
    } else {
      console.log('ℹ️ Modo F1 desactivado (no se detectó c=F1 en URL)');
    }
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('📦 Telemetry Controller v2.0 loaded');

})();