const CHANNELS_JSON = 'https://json.angulismotv.workers.dev/channels';
const EVENTOS_JSON = 'https://json.angulismotv.workers.dev/events';
const STREAMTP_EVENTOS = 'https://streamtp.angulismotv.workers.dev/eventos.json';
const LA14HD_EVENTOS = 'https://la14hd.angulismotv.workers.dev/eventos/json/agenda123.json';

// URL para cargar los canales personalizados para partidos específicos
const MATCH_CHANNELS_JSON = './scripts/channels.json';

function getSearchParam(name) {
  const params = new URLSearchParams(location.search);
  return params.get(name);
}

async function fetchJSON(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar ' + url);
  return res.json();
}

// 🔥 FUNCIÓN CORREGIDA - Ahora acepta el nombre del canal de Twitch
function setTwitchChat(twitchChannel = 'AngulismoTV') {
  const chat = document.getElementById('twitchChat');
  if (!chat) return;
  
  const parents = ['localhost', '127.0.0.1', 'angulismotv.pages.dev', location.hostname].filter(Boolean);
  const params = new URLSearchParams();
  parents.forEach(p => params.append('parent', p));
  params.set('darkpopout', '');
  
  chat.src = `https://www.twitch.tv/embed/${twitchChannel}/chat?${params.toString()}`;
  console.log('💬 Chat actualizado:', twitchChannel);
}

// 🔥 NUEVA FUNCIÓN - Extrae el canal de Twitch de una URL de iframe
function extractTwitchChannel(iframeUrl) {
  if (!iframeUrl) return null;
  
  try {
    // Patrones comunes de URLs de Twitch
    const patterns = [
      /twitch\.tv\/([^\/\?]+)/i,
      /twitch\.tv\/embed\/([^\/\?]+)/i,
      /player\.twitch\.tv\/\?channel=([^&]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = iframeUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  } catch (e) {
    console.error('Error extrayendo canal de Twitch:', e);
  }
  
  return null;
}

function updateIframe(iframeUrl) {
  const frame = document.getElementById('playerFrame');
  frame.src = iframeUrl;
  
  // 🔥 ACTUALIZAR CHAT AUTOMÁTICAMENTE
  const twitchChannel = extractTwitchChannel(iframeUrl);
  if (twitchChannel) {
    setTwitchChat(twitchChannel);
  }
}

function populateOptions(channel, selectedIndex) {
  const select = document.getElementById('optionSelect');
  select.innerHTML = '';
  channel.options.forEach((opt, idx) => {
    const o = document.createElement('option');
    o.value = String(idx);
    o.textContent = opt.name || `Opción ${idx + 1}`;
    if (idx === selectedIndex) o.selected = true;
    select.appendChild(o);
  });
}

function setChannelHeader(channel) {
  const nameEl = document.getElementById('channel-name');
  const logoEl = document.getElementById('channel-logo');
  nameEl.textContent = channel.name;
  logoEl.src = channel.logo;
  logoEl.alt = channel.name;
}

function syncUrl(selectedIndex) {
  const params = new URLSearchParams(location.search);
  params.set('opt', String(selectedIndex));
  history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
}

async function init() {
  // Inicializar chat por defecto
  setTwitchChat();
  
  const channelName = getSearchParam('channel');
  const matchId = getSearchParam('match');
  const optParam = getSearchParam('opt');
  const eventParam = getSearchParam('event');
  const selectedIndex = Number.isInteger(Number(optParam)) ? Number(optParam) : 0;

  let channel;
  let matchHasCustomChannels = false;
  let availableChannels = [];
  
  // Si tenemos un enlace codificado en base64, lo usamos directamente
  if (eventParam) {
    try {
      const iframeUrl = atob(eventParam);
      console.log('Usando enlace directo:', iframeUrl);
      
      // Crear un canal virtual con el iframe decodificado
      channel = {
        name: 'Transmisión',
        logo: './assets/logo2.png',
        options: [{
          name: 'Opción 1',
          iframe: iframeUrl
        }]
      };
      
      // Ocultar elementos del encabezado y controles de opciones ya que no tenemos información del canal
      const channelInfo = document.getElementById('channel-info');
      const optionControls = document.getElementById('option-controls');
      
      if (channelInfo) {
        channelInfo.style.display = 'none';
      }
      
      if (optionControls) {
        optionControls.style.display = 'none';
      }
      
      // Actualizar el iframe y el chat
      updateIframe(iframeUrl);
      return;
    } catch (e) {
      console.error('Error decodificando enlace:', e);
    }
  }
  
  // Primero intentamos buscar el canal en eventos.json si hay un matchId
  if (matchId) {
    console.log('Buscando evento con ID:', matchId);
    try {
      const [eventosData, streamTPData, la14HDData] = await Promise.all([
        fetchJSON(EVENTOS_JSON).catch(() => []),
        fetchJSON(STREAMTP_EVENTOS).catch(() => []),
        fetchJSON(LA14HD_EVENTOS).catch(() => [])
      ]);
      
      let evento = eventosData.find(ev => `manual-${ev.id}` === matchId);
      
      if (!evento) {
        evento = streamTPData.find(ev => `streamtp-${ev.id}` === matchId);
      }
      
      if (!evento) {
        evento = la14HDData.find(ev => `la14hd-${ev.id}` === matchId);
      }
      
      if (evento && Array.isArray(evento.canales) && evento.canales.length > 0) {
        console.log('Evento encontrado con', evento.canales.length, 'canales personalizados');
        matchHasCustomChannels = true;
        availableChannels = evento.canales;
        
        if (channelName) {
          channel = evento.canales.find(c => (c.name || '').toLowerCase() === channelName.toLowerCase());
        }
        
        if (!channel) {
          const firstChannel = evento.canales[0];
          const params = new URLSearchParams(location.search);
          params.set('channel', firstChannel.name);
          window.location.href = `${location.pathname}?${params.toString()}`;
          return;
        }
      }
    } catch (e) {
      console.error('Error cargando eventos:', e);
    }
  }
  
  if (!channel && !matchHasCustomChannels) {
    if (!channelName) {
      alert('Falta el parámetro "channel" o "event" en la URL');
      return;
    }
    
    try {
      const data = await fetchJSON(CHANNELS_JSON);
      channel = data.channels.find(c => (c.name || '').toLowerCase() === channelName.toLowerCase());
      availableChannels = data.channels;
    } catch (e) {
      console.error(e);
      alert('No se pudo cargar la lista de canales.');
      return;
    }
  }
  
  if (!channel) {
    window.location.href = '/';
    return;
  }

  // Crear el selector de canales disponibles
  const channelSelector = document.getElementById('channelSelector');
  if (channelSelector) {
    channelSelector.innerHTML = '';
    availableChannels.forEach(ch => {
      const option = document.createElement('option');
      option.value = ch.name;
      option.textContent = ch.name;
      if (ch.name === channel.name) {
        option.selected = true;
      }
      channelSelector.appendChild(option);
    });

    channelSelector.addEventListener('change', (e) => {
      const params = new URLSearchParams(location.search);
      params.set('channel', e.target.value);
      window.location.href = `${location.pathname}?${params.toString()}`;
    });
  }

  if (!getSearchParam('event')) {
    setChannelHeader(channel);
  }
  
  const idx = Math.min(Math.max(selectedIndex, 0), Math.max(channel.options.length - 1, 0));
  populateOptions(channel, idx);
  updateIframe(channel.options[idx].iframe);
  syncUrl(idx);

  document.getElementById('optionSelect').addEventListener('change', (e) => {
    const i = Number(e.target.value);
    updateIframe(channel.options[i].iframe);
    syncUrl(i);
  });

  document.getElementById('reloadBtn').addEventListener('click', () => {
    const i = Number(document.getElementById('optionSelect').value);
    updateIframe(channel.options[i].iframe);
  });
}

document.addEventListener('DOMContentLoaded', init);
