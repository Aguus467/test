/**
 * AngulismoTV - Player Controller
 * Maneja reproductor, canales, eventos y transmisiones
 */

//TRANSMISION.JS

(function() {
  'use strict';

  // ==================== Configuration ====================
  const CONFIG = {
    json: {
      channels: 'https://json.angulismotv.workers.dev/channels',
      events: 'https://json.angulismotv.workers.dev/events',
      streamTP: 'https://streamtp.angulismotv.workers.dev/eventos.json',
      la14HD: 'https://la14hd.angulismotv.workers.dev/eventos/json/agenda123.json',
      matchChannels: './scripts/channels.json'
    },
    twitch: {
      channel: 'AngulismoTV',
      parents: ['localhost', '127.0.0.1', 'angulismotv.pages.dev']
    },
    defaults: {
      logo: './assets/logo2.png',
      channelName: 'Transmisión'
    }
  };

  // ==================== Utility Functions ====================
  class Utils {
    static getSearchParam(name) {
      return new URLSearchParams(location.search).get(name);
    }

    static async fetchJSON(url) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (error) {
        console.warn(`Error fetching ${url}:`, error);
        throw error;
      }
    }

    static syncURL(params) {
      const newParams = new URLSearchParams(location.search);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          newParams.set(key, String(value));
        }
      });
      history.replaceState(null, '', `${location.pathname}?${newParams.toString()}`);
    }

    static decodeBase64(str) {
      try {
        return atob(str);
      } catch (e) {
        console.error('Error decoding base64:', e);
        return null;
      }
    }

    static redirect(params) {
      const newParams = new URLSearchParams(location.search);
      Object.entries(params).forEach(([key, value]) => {
        newParams.set(key, String(value));
      });
      window.location.href = `${location.pathname}?${newParams.toString()}`;
    }
  }

  // ==================== Player Controller ====================
  class PlayerController {
    constructor() {
      this.playerFrame = document.getElementById('playerFrame');
      this.reloadBtn = document.getElementById('reloadBtn');
      this.reloadAttempts = 0;
      this.maxReloadAttempts = 3;
      this.currentSource = null;
      this.currentOptionIndex = 0;
      this.init();
    }

    init() {
      if (!this.playerFrame) {
        console.error('Player frame not found');
        return;
      }

      // Reload button
      if (this.reloadBtn) {
        this.reloadBtn.addEventListener('click', () => this.reload());
      }

      // Error handling
      this.playerFrame.addEventListener('error', () => this.handleError());
      this.playerFrame.addEventListener('load', () => this.handleLoad());
    }

    setSource(url, optionIndex = 0) {
      if (!url) {
        console.warn('No URL provided to player');
        return;
      }
      
      this.currentSource = url;
      this.currentOptionIndex = optionIndex;
      
      // Usar la URL directamente del JSON sin modificaciones
      // Ya que en el JSON la opción 4 ya tiene la URL de la extensión
      let finalUrl = url;
      
      console.log('🎬 Loading stream:', finalUrl);
      console.log('📊 Option index:', optionIndex);
      
      this.playerFrame.src = finalUrl;
      this.reloadAttempts = 0;
    }

    reload() {
      if (!this.currentSource) return;
      
      this.playerFrame.classList.add('loading');
      
      if (this.reloadBtn) {
        this.reloadBtn.disabled = true;
        const originalHTML = this.reloadBtn.innerHTML;
        this.reloadBtn.innerHTML = '<svg class="icon-reload spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg> Recargando...';
        
        setTimeout(() => {
          this.reloadBtn.disabled = false;
          this.reloadBtn.innerHTML = originalHTML;
        }, 1000);
      }
      
      this.playerFrame.src = '';
      
      setTimeout(() => {
        // Recargar la URL original sin modificaciones
        this.playerFrame.src = this.currentSource;
        this.playerFrame.classList.remove('loading');
      }, 500);
    }

    handleError() {
      const settings = this.getSettings();
      
      if (settings.autoReload && this.reloadAttempts < this.maxReloadAttempts) {
        this.reloadAttempts++;
        console.log(`🔄 Auto-reload attempt ${this.reloadAttempts}/${this.maxReloadAttempts}`);
        
        setTimeout(() => {
          if (this.currentSource) {
            this.playerFrame.src = '';
            setTimeout(() => {
              this.playerFrame.src = this.currentSource;
            }, 1000);
          }
        }, 2000);
      } else if (this.reloadAttempts >= this.maxReloadAttempts) {
        console.error('❌ Max reload attempts reached');
      }
    }

    handleLoad() {
      this.reloadAttempts = 0;
      this.playerFrame.classList.remove('loading');
      console.log('✅ Stream loaded successfully');
    }

    getSettings() {
      if (window.AngulismoTV && window.AngulismoTV.getSettings) {
        return window.AngulismoTV.getSettings();
      }
      return { autoReload: false, autoChat: true };
    }
  }

  // ==================== Chat Controller ====================
  class ChatController {
    constructor() {
      this.chatFrame = document.getElementById('twitchChat');
      this.init();
    }

    init() {
      if (!this.chatFrame) return;
      this.setTwitchChat();
    }

    setTwitchChat() {
      const parents = [
        ...CONFIG.twitch.parents,
        location.hostname
      ].filter(Boolean);
      
      const params = new URLSearchParams();
      parents.forEach(p => params.append('parent', p));
      params.set('darkpopout', '');
      
      this.chatFrame.src = `https://www.twitch.tv/embed/${CONFIG.twitch.channel}/chat?${params.toString()}`;
      
      console.log('💬 Twitch chat initialized');
    }

    hide() {
      if (this.chatFrame) {
        this.chatFrame.style.display = 'none';
      }
    }

    show() {
      if (this.chatFrame) {
        this.chatFrame.style.display = 'block';
      }
    }
  }

  // ==================== Event Manager ====================
  class EventManager {
    constructor() {
      this.events = [];
    }

    async loadAllEvents() {
      console.log('📅 Loading events from all sources...');
      
      const sources = [
        { name: 'eventos', url: CONFIG.json.events, prefix: 'manual' },
        { name: 'streamTP', url: CONFIG.json.streamTP, prefix: 'streamtp' },
        { name: 'la14HD', url: CONFIG.json.la14HD, prefix: 'la14hd' }
      ];

      const results = await Promise.allSettled(
        sources.map(async ({ name, url, prefix }) => {
          try {
            const data = await Utils.fetchJSON(url);
            return { name, data, prefix };
          } catch (error) {
            console.warn(`Failed to load ${name}:`, error);
            return { name, data: [], prefix };
          }
        })
      );

      this.events = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      console.log('✅ Events loaded:', this.events.length, 'sources');
    }

    findEventById(matchId) {
      for (const source of this.events) {
        const event = source.data.find(ev => `${source.prefix}-${ev.id}` === matchId);
        if (event) {
          console.log(`✅ Event found in ${source.name}:`, event);
          return event;
        }
      }
      console.warn('❌ Event not found:', matchId);
      return null;
    }
  }

  // ==================== Channel Manager ====================
  class ChannelManager {
    constructor(player) {
      this.player = player;
      this.currentChannel = null;
      this.availableChannels = [];
      this.elements = {
        channelName: document.getElementById('channel-name'),
        channelLogo: document.getElementById('channel-logo'),
        channelInfo: document.getElementById('channel-info'),
        optionSelect: document.getElementById('optionSelect'),
        channelSelector: document.getElementById('channelSelector'),
        optionControls: document.getElementById('option-controls')
      };
    }

    async loadFromGeneralList(channelName) {
      try {
        const data = await Utils.fetchJSON(CONFIG.json.channels);
        const channel = data.channels.find(
          c => (c.name || '').toLowerCase() === channelName.toLowerCase()
        );
        
        if (channel) {
          this.availableChannels = data.channels;
          console.log('✅ Channel loaded from general list:', channel.name);
        }
        
        return channel;
      } catch (error) {
        console.error('Error loading channels:', error);
        throw new Error('No se pudo cargar la lista de canales');
      }
    }

    setChannel(channel, selectedIndex = 0) {
      this.currentChannel = channel;
      
      // Update header
      this.updateHeader(channel);
      
      // Populate options
      const idx = Math.min(Math.max(selectedIndex, 0), Math.max(channel.options.length - 1, 0));
      this.populateOptions(channel, idx);
      
      // Load stream - PASAR EL ÍNDICE AL PLAYER
      if (channel.options[idx] && channel.options[idx].iframe) {
        this.player.setSource(channel.options[idx].iframe, idx);
      }
      
      // Sync URL
      Utils.syncURL({ opt: idx });
    }

    updateHeader(channel) {
      if (this.elements.channelName) {
        this.elements.channelName.textContent = channel.name;
      }
      
      if (this.elements.channelLogo) {
        this.elements.channelLogo.src = channel.logo || CONFIG.defaults.logo;
        this.elements.channelLogo.alt = channel.name;
      }
    }

    hideHeader() {
      if (this.elements.channelInfo) {
        this.elements.channelInfo.style.display = 'none';
      }
      
      if (this.elements.optionControls) {
        this.elements.optionControls.style.display = 'none';
      }
    }

    populateOptions(channel, selectedIndex) {
      if (!this.elements.optionSelect) return;
      
      this.elements.optionSelect.innerHTML = '';
      
      channel.options.forEach((opt, idx) => {
        const option = document.createElement('option');
        option.value = String(idx);
        option.textContent = opt.name || `Opción ${idx + 1}`;
        option.selected = idx === selectedIndex;
        this.elements.optionSelect.appendChild(option);
      });

      // Add change listener - PASAR EL ÍNDICE AL PLAYER
      this.elements.optionSelect.addEventListener('change', (e) => {
        const i = Number(e.target.value);
        if (this.currentChannel.options[i]) {
          this.player.setSource(this.currentChannel.options[i].iframe, i);
          Utils.syncURL({ opt: i });
        }
      });
    }

    populateChannelSelector() {
      if (!this.elements.channelSelector) return;
      
      this.elements.channelSelector.innerHTML = '';
      
      this.availableChannels.forEach(ch => {
        const option = document.createElement('option');
        option.value = ch.name;
        option.textContent = ch.name;
        option.selected = ch.name === this.currentChannel?.name;
        this.elements.channelSelector.appendChild(option);
      });

      // Add change listener
      this.elements.channelSelector.addEventListener('change', (e) => {
        Utils.redirect({ channel: e.target.value });
      });
    }
  }

  // ==================== Direct Link Handler ====================
  class DirectLinkHandler {
    static async handle(eventParam, player, channelManager) {
      const decodedUrl = Utils.decodeBase64(eventParam);
      
      if (!decodedUrl) {
        console.error('❌ Failed to decode event parameter');
        return false;
      }

      console.log('🔗 Using direct link:', decodedUrl);
      
      // Create virtual channel
      const virtualChannel = {
        name: CONFIG.defaults.channelName,
        logo: CONFIG.defaults.logo,
        options: [{
          name: 'Opción 1',
          iframe: decodedUrl
        }]
      };
      
      // Hide UI elements
      channelManager.hideHeader();
      
      // Load stream
      player.setSource(decodedUrl, 0);
      
      return true;
    }
  }

  // ==================== Main Application ====================
  class TransmisionApp {
    constructor() {
      this.player = new PlayerController();
      this.chat = new ChatController();
      this.eventManager = new EventManager();
      this.channelManager = new ChannelManager(this.player);
    }

    async init() {
      console.log('🚀 AngulismoTV - Initializing...');
      
      // Get URL parameters
      const params = {
        event: Utils.getSearchParam('event'),
        match: Utils.getSearchParam('match'),
        channel: Utils.getSearchParam('channel'),
        opt: Utils.getSearchParam('opt')
      };

      const selectedIndex = Number.isInteger(Number(params.opt)) ? Number(params.opt) : 0;

      // Handle direct link
      if (params.event) {
        const handled = await DirectLinkHandler.handle(params.event, this.player, this.channelManager);
        if (handled) return;
      }

      // Handle match-based channels
      if (params.match) {
        const channel = await this.handleMatchChannel(params.match, params.channel);
        if (channel) {
          this.channelManager.setChannel(channel, selectedIndex);
          this.channelManager.populateChannelSelector();
          return;
        }
      }

      // Handle general channel
      if (params.channel) {
        try {
          const channel = await this.channelManager.loadFromGeneralList(params.channel);
          if (channel) {
            this.channelManager.setChannel(channel, selectedIndex);
            this.channelManager.populateChannelSelector();
            return;
          }
        } catch (error) {
          alert(error.message);
          return;
        }
      }

      // No valid parameters
      console.warn('⚠️  No valid channel or event parameters found');
      alert('Falta el parámetro "channel" o "event" en la URL');
    }

    async handleMatchChannel(matchId, channelName) {
      console.log('🎯 Loading match channels for:', matchId);
      
      await this.eventManager.loadAllEvents();
      const event = this.eventManager.findEventById(matchId);
      
      if (!event || !Array.isArray(event.canales) || event.canales.length === 0) {
        console.warn('⚠️  No custom channels found for match');
        return null;
      }

      console.log(`✅ Found ${event.canales.length} custom channels for match`);
      this.channelManager.availableChannels = event.canales;

      // Find requested channel
      let channel = null;
      if (channelName) {
        channel = event.canales.find(
          c => (c.name || '').toLowerCase() === channelName.toLowerCase()
        );
      }

      // Redirect to first channel if not found or not specified
      if (!channel) {
        const firstChannel = event.canales[0];
        console.log('🔄 Redirecting to first available channel:', firstChannel.name);
        Utils.redirect({ channel: firstChannel.name });
        return null;
      }

      return channel;
    }
  }

  // ==================== Initialize Application ====================
  function init() {
    const app = new TransmisionApp();
    app.init().catch(error => {
      console.error('❌ Initialization error:', error);
      alert('Error al inicializar la aplicación. Por favor, recarga la página.');
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose app for debugging
  window.AngulismoTV = window.AngulismoTV || {};
  window.AngulismoTV.version = '2.0.0';

  console.log('📺 AngulismoTV Player v2.0.0 loaded');


})();