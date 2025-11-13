/**
 * AngulismoTV - Telemetry Controller (CONDICIONAL F1)
 * Solo se activa cuando c=F1 en la URL
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

    // 🔥 DETECTAR F1 por parámetro c=F1
    checkIfF1Content() {
      const urlParams = new URLSearchParams(window.location.search);
      const channel = urlParams.get('c') || urlParams.get('channel');
      const isF1 = channel && channel.toLowerCase() === 'f1';
      
      console.log('🔍 Detectando F1:', { channel, isF1 });
      return isF1;
    }

    init() {
      // 🔥 OCULTAR COMPLETAMENTE si no es F1
      if (!this.isF1Content) {
        this.hideTelemetryPermanently();
        return;
      }

      if (!this.toggle || !this.card || !this.iframe || !this.container) {
        console.warn('TelemetryController: Elementos no encontrados');
        return;
      }

      // 🔥 MOSTRAR controles F1
      this.toggle.style.display = 'flex';
      this.card.style.display = 'flex';
      
      this.toggle.addEventListener('click', () => this.toggleTelemetry());
      this.loadState();

      // Aplicar estado inicial
      if (this.isHidden) {
        this.hideTelemetry(false);
      }

      console.log('✅ TelemetryController inicializado - MODO F1 ACTIVADO');
    }

    // 🔥 OCULTAR PERMANENTEMENTE (no es F1)
    hideTelemetryPermanently() {
      if (this.toggle) this.toggle.style.display = 'none';
      if (this.card) this.card.style.display = 'none';
      // Forzar layout sin telemetría
      if (this.container) {
        this.container.classList.add('telemetry-hidden');
      }
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
    }

    hideTelemetry(animate = true) {
      this.card.classList.add('hidden');
      this.container.classList.add('telemetry-hidden');
      this.toggle.classList.add('rotated');
      
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
      this.card.classList.remove('hidden');
      this.container.classList.remove('telemetry-hidden');
      this.toggle.classList.remove('rotated');
      
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

    // 🔥 ACTIVAR MANUALMENTE (por si acaso)
    enableF1Mode() {
      this.isF1Content = true;
      this.toggle.style.display = 'flex';
      this.card.style.display = 'flex';
      this.init();
    }
  }

  function init() {
    const telemetryController = new TelemetryController();

    window.AngulismoTV = window.AngulismoTV || {};
    window.AngulismoTV.telemetryController = telemetryController;

    // Atajo de teclado solo para F1
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't' && telemetryController.isF1Content) {
        e.preventDefault();
        telemetryController.toggleTelemetry();
      }
    });

    if (telemetryController.isF1Content) {
      console.log('🏎️ F1 Telemetry Panel - ACTIVADO (c=F1 detectado)');
      console.log('⌨️  Atajo: Ctrl+T para alternar telemetría');
      
      // 🔥 APLICAR TEMA F1 AUTOMÁTICAMENTE
      document.body.classList.add('f1-theme');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();