const API_URL = 'https://api.infutbol.site/matches/today';
const CHANNELS_JSON = 'https://json.angulismotv.workers.dev/channels';
let CHANNEL_LOGOS = {};
const EVENTOS_JSON = 'https://json.angulismotv.workers.dev/events';
const STREAMTP_EVENTOS = 'https://streamtp.angulismotv.workers.dev/eventos.json';
const LA14HD_EVENTOS = 'https://la14hd.angulismotv.workers.dev/eventos/json/agenda123.json';

async function fetchJSON(url, options = {}) {
  console.log(`Fetching data from: ${url}`);
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      mode: 'cors',
      ...options
    });
    if (!response.ok) throw new Error('Error al cargar ' + url);
    const data = await response.json();
    console.log(`Data loaded successfully from: ${url}`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

function createEl(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
}

function pad(n) { return n.toString().padStart(2, '0'); }
function formatTime(str) {
  if (!str) {
    console.log('formatTime: string vacío o nulo');
    return '--:--';
  }
  
  console.log('formatTime input:', str);
  
  // Si es una fecha completa con espacio (formato DD-MM-YYYY HH:MM o YYYY-MM-DD HH:MM)
  if (str.includes(' ')) {
    const parts = str.split(' ');
    if (parts.length < 2) {
      console.log('formatTime: formato incorrecto (sin hora):', str);
      return '--:--';
    }
    console.log('formatTime: extrayendo hora de fecha completa:', parts[1]);
    return parts[1]; // Devuelve la parte de la hora
  }
  
  // Si es solo una hora (formato HH:MM)
  if (str.includes(':')) {
    console.log('formatTime: formato de hora detectado:', str);
    return str;
  }
  
  console.log('formatTime: formato no reconocido:', str);
  return '--:--';
}
function formatDayBanner(dateStr) {
  const now = new Date();
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const d = now.getDate();
  const dia = dias[now.getDay()];
  const mes = meses[now.getMonth()];
  const year = now.getFullYear();
  return `Agenda - ${dia} ${pad(d)} de ${mes} de ${year}`;
}

function parseStartTime(str) {
  try {
    if (!str || typeof str !== 'string') return new Date(8640000000000000);
    const [date, time] = str.split(' ');
    if (!date || !time) return new Date(8640000000000000);
    
    let yyyy, mm, dd;
    
    // Detectar formato de fecha (DD-MM-YYYY o YYYY-MM-DD)
    if (date.includes('-')) {
      const parts = date.split('-').map(Number);
      if (parts[0] > 1000) { // Es formato YYYY-MM-DD
        [yyyy, mm, dd] = parts;
      } else { // Es formato DD-MM-YYYY
        [dd, mm, yyyy] = parts;
      }
    } else {
      return new Date(8640000000000000);
    }
    
    const [HH, MM] = time.split(':').map(Number);
    const dt = new Date(yyyy, (mm || 1) - 1, dd || 1, HH || 0, MM || 0, 0, 0);
    
    if (isNaN(dt.getTime())) {
      console.error('Fecha inválida:', str, 'Parsed as:', yyyy, mm, dd, HH, MM);
      return new Date(8640000000000000);
    }
    
    return dt;
  } catch (error) {
    console.error('Error al parsear fecha:', str, error);
    return new Date(8640000000000000);
  }
}

function buildMatchCard(match) {
  const card = createEl('div', 'match-card');

  const timeCol = createEl('div', 'time-col');
  const formattedTime = formatTime(match.start_time);
  console.log('Tiempo formateado:', match.start_time, '->', formattedTime);
  const timeBadge = createEl('div', 'time-badge', formattedTime || '--:--');
  timeCol.appendChild(timeBadge);
  
  const main = createEl('div', 'match-main');
  
  // Extraer nombre del evento y descripción del título
  let eventName = '';
  let eventDescription = '';
  const teamsText = match.teams?.map(t => t.name).join(' vs ') || match.evento || 'Evento sin título';
  console.log('Texto de equipos:', teamsText);
  
  if (teamsText.includes(':')) {
    const parts = teamsText.split(':');
    eventDescription = parts[0].trim();
    eventName = parts.slice(1).join(':').trim();
  } else {
    eventName = teamsText;
  }
  
  // Crear el título sin clase de competencia (para quitar el logo)
  const title = createEl('div', 'teams', eventName);
  main.appendChild(title);

  const meta = createEl('div', 'meta');
  // Usar la descripción extraída del título si existe
  if (eventDescription) {
    meta.appendChild(createEl('span', '', eventDescription));
  } else if (match.description) {
    meta.appendChild(createEl('span', '', match.description));
  }

  main.appendChild(meta);
  
  // Asegurarse de que meta tenga al menos un elemento
  if (!eventDescription && !match.description && !compName) {
    meta.appendChild(createEl('span', '', 'Sin detalles adicionales'));
  }

  const networks = Array.isArray(match.tv_networks) ? match.tv_networks : 
                  (Array.isArray(match.canales) ? match.canales : []);
  
  card.appendChild(timeCol);
  card.appendChild(main);
  const dropdown = createEl('div', 'dropdown');
  const menu = createEl('ul', 'channel-menu');
  dropdown.appendChild(menu);
  card.appendChild(dropdown);

  card.addEventListener('click', (e) => {
    if (e.target.closest('.channel-menu')) return;
    
    // En lugar de abrir el menú desplegable, redirigir directamente a la transmisión
    if (networks.length > 0) {
      const firstNetwork = networks[0];
      const link = firstNetwork.link || '';
      if (link) {
        window.top.location.href = `transmision.html?event=${link}`;
      } else {
        const params = new URLSearchParams();
        params.set('channel', firstNetwork.name);
        if (match.slug) params.set('match', match.slug);
        window.top.location.href = `transmision.html?${params.toString()}`;
      }
    }
  });
  
  // Añadir evento para abrir la transmisión al hacer clic en el card
  if (networks.length > 0) {
    card.addEventListener('dblclick', () => {
      const firstNetwork = networks[0];
      const link = firstNetwork.link || '';
      if (link) {
        window.top.location.href = `transmision.html?event=${link}`;
      } else {
        const params = new URLSearchParams();
        params.set('channel', firstNetwork.name);
        if (match.slug) params.set('match', match.slug);
        window.top.location.href = `transmision.html?${params.toString()}`;
      }
    });
  }

  if (networks.length === 0) {
    const li = createEl('li', 'channel-item');
    li.textContent = 'Sin canales reportados';
    li.style.opacity = '0.6';
    menu.appendChild(li);
  } else {
    for (const net of networks) {
      const li = createEl('li', 'channel-item');
      const left = createEl('div', 'left');
      const play = createEl('span', 'play-icon');
      const name = createEl('span', '', net.name);
      left.appendChild(play);
      left.appendChild(name);
      li.appendChild(left);
      li.addEventListener('click', (event) => {
        event.stopPropagation();
        // Si el canal tiene un enlace codificado en base64, lo usamos
        if (net.link) {
          window.top.location.href = `transmision.html?event=${net.link}`;
        } else {
          // Si no, usamos el método tradicional
          const params = new URLSearchParams();
          params.set('channel', net.name);
          if (match.slug) params.set('match', match.slug);
          window.top.location.href = `transmision.html?${params.toString()}`;
        }
      });
      menu.appendChild(li);
    }
  }

  return card;
}

async function adaptManualEvents(events) {
  return events.map(ev => {
    let teams = [];
    if (ev.evento.includes(' vs ')) {
      teams = ev.evento.split(' vs ').map(name => ({ name: name.trim() }));
    } else {
      teams = [{ name: ev.evento.trim() }];
    }
    let canales = Array.isArray(ev.canales) ? ev.canales : (ev.canal ? [ev.canal] : []);
    return {
      start_time: ev.fecha,
      teams: teams,
      evento: ev.evento,
      description: ev.descripcion || '',
      competition_name: ev.competencia || '',
      competencia: ev.competencia || '',
      tv_networks: canales.map(c => {
        // Si el canal es un objeto con estructura completa, lo usamos tal como está
        if (typeof c === 'object' && c.name) {
          return c;
        }
        // Si es solo un string, lo convertimos al formato anterior
        return { name: c };
      }),
      canales: canales,
      status: { name: ev.estado || '' },
      slug: `manual-${ev.id}`
    };
  });
}

function formatManualDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const dd = pad(d.getDate());
  const mm = pad(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const HH = pad(d.getHours());
  const MM = pad(d.getMinutes());
  return `${dd}-${mm}-${yyyy} ${HH}:${MM}`;
}

async function renderAgendaUnified(apiData, manualEvents) {
  const agenda = document.getElementById('agenda');
  if (!agenda) return;
  agenda.textContent = '';
  const allMatches = [];
  if (Array.isArray(manualEvents)) {
    console.log('Eventos manuales a renderizar:', manualEvents.length);
    // Filtrar eventos sin fecha o sin título
    const validEvents = manualEvents.filter(ev => {
      const hasTime = ev.start_time && ev.start_time.trim() !== '';
      const hasTitle = (ev.teams && ev.teams.length > 0) || (ev.evento && ev.evento.trim() !== '');
      if (!hasTime || !hasTitle) {
        console.log('Evento inválido descartado:', ev);
      }
      return hasTime && hasTitle;
    });
    console.log('Eventos válidos a renderizar:', validEvents.length);
    allMatches.push(...validEvents);
  }

  if (allMatches.length === 0) {
    agenda.textContent = 'No hay partidos programados.';
    return;
  }

  // Ordenar todos los eventos por hora
  allMatches.sort((a, b) => {
    const timeA = formatTime(a.start_time);
    const timeB = formatTime(b.start_time);
    return timeA.localeCompare(timeB);
  });
  console.log('Eventos ordenados por hora:', allMatches.length);

  const listEl = createEl('div', 'matches');
  
  // Crear tabla de eventos
  allMatches.forEach(m => {
    console.log('Renderizando evento:', m.evento || (m.teams ? m.teams.map(t => t.name).join(' vs ') : 'Sin título'));
    listEl.appendChild(buildMatchCard(m));
  });
  
  agenda.appendChild(listEl);
}

async function renderChannels(channelData) {
  const channelsGrid = document.getElementById('channelsGrid');
  if (!channelsGrid || !channelData || !Array.isArray(channelData.channels)) return;
  channelsGrid.innerHTML = '';
  channelData.channels.forEach(ch => {
    const card = createEl('div', 'channel-card');
    const img = createEl('img');
    img.src = ch.logo;
    img.alt = ch.name;
    const name = createEl('div', 'name', ch.name);
    card.appendChild(img);
    card.appendChild(name);
    card.addEventListener('click', () => {
      const params = new URLSearchParams();
      params.set('channel', ch.name);
      window.top.location.href = `transmision.html?${params.toString()}`;
    });
    if (ch.show == true) {
      channelsGrid.appendChild(card);
    }
  });
}

// Función para convertir hora de GMT-5 a GMT-3 (sumar 2 horas)
function convertGMT5ToGMT3(dateStr) {
  try {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    const [date, time] = dateStr.split(' ');
    if (!date || !time) return dateStr;
    
    let yyyy, mm, dd;
    
    // Detectar formato de fecha (DD-MM-YYYY o YYYY-MM-DD)
    if (date.includes('-')) {
      const parts = date.split('-').map(Number);
      if (parts[0] > 1000) { // Es formato YYYY-MM-DD
        [yyyy, mm, dd] = parts;
      } else { // Es formato DD-MM-YYYY
        [dd, mm, yyyy] = parts;
      }
    } else {
      console.error('Formato de fecha no reconocido:', dateStr);
      return dateStr;
    }
    
    const [HH, MM] = time.split(':').map(Number);
    
    // Crear fecha en GMT-5
    const dt = new Date(yyyy, (mm || 1) - 1, dd || 1, HH || 0, MM || 0, 0, 0);
    
    if (isNaN(dt.getTime())) {
      console.error('Fecha inválida en convertGMT5ToGMT3:', dateStr);
      return dateStr;
    }
    
    // Sumar 2 horas para convertir a GMT-3
    dt.setHours(dt.getHours() + 2);
    
    // Formatear la nueva fecha
    const newDD = pad(dt.getDate());
    const newMM = pad(dt.getMonth() + 1);
    const newYYYY = dt.getFullYear();
    const newHH = pad(dt.getHours());
    const newMM_min = pad(dt.getMinutes());
    
    return `${newDD}-${newMM}-${newYYYY} ${newHH}:${newMM_min}`;
  } catch (e) {
    console.error('Error al convertir zona horaria:', e);
    return dateStr;
  }
}

// Función para adaptar eventos de streamtpglobal
async function adaptStreamTPEvents(events) {
  if (!Array.isArray(events)) {
    console.error('streamTPEvents no es un array:', events);
    return [];
  }
  
  console.log('Adaptando eventos de StreamTP:', events.length);
  
  return events.map(ev => {
    console.log('Procesando evento StreamTP:', ev);
    
    // Formatear la fecha correctamente
    let formattedDate = '';
    if (ev.time) {
      // Obtener la fecha actual
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = pad(today.getMonth() + 1);
      const dd = pad(today.getDate());
      // Primero formateamos la fecha en formato YYYY-MM-DD HH:MM
      const initialDate = `${yyyy}-${mm}-${dd} ${ev.time}`;
      // Luego convertimos de GMT-5 a GMT-3
      formattedDate = convertGMT5ToGMT3(initialDate);
      console.log('Fecha original StreamTP:', initialDate);
      console.log('Fecha convertida a GMT-3:', formattedDate);
    }
    
    let teams = [];
    if (ev.title && ev.title.includes(' vs ')) {
      teams = ev.title.split(' vs ').map(name => ({ name: name.trim() }));
    } else if (ev.title) {
      teams = [{ name: ev.title.trim() }];
    }
    
    // Crear un enlace codificado en base64 para el canal
    const canales = [];
    if (ev.link) {
      canales.push({
        name: ev.category || 'Canal',
        link: btoa(ev.link || '')
      });
    }
    
    const result = {
      id: `streamtp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      start_time: formattedDate,
      teams: teams,
      evento: ev.title || '',
      description: ev.status || '',
      competition_name: ev.category || '',
      competencia: ev.category || '',
      tv_networks: canales,
      canales: canales,
      status: { name: ev.status || '' },
      slug: `streamtp-${Date.now()}`
    };
    
    console.log('Evento StreamTP procesado:', result);
    return result;
  });
}

// Función para adaptar eventos de la14hd
async function adaptLA14HDEvents(events) {
  if (!Array.isArray(events)) {
    console.error('la14HDEvents no es un array:', events);
    return [];
  }
  
  console.log('Adaptando eventos de LA14HD:', events.length);
  
  return events.map(ev => {
    console.log('Procesando evento LA14HD:', ev);
    
    let teams = [];
    if (ev.title && ev.title.includes(' vs ')) {
      teams = ev.title.split(' vs ').map(name => ({ name: name.trim() }));
    } else if (ev.title) {
      teams = [{ name: ev.title.trim() }];
    }
    
    // Crear un enlace codificado en base64 para cada canal
    const canales = [];
    if (ev.link) {
      canales.push({
        name: ev.category || 'Canal',
        link: btoa(ev.link || '')
      });
    }
    
    // Formatear la fecha correctamente
    let formattedDate = '';
    if (ev.date && ev.time) {
      // Asegurarse de que la fecha tenga el formato correcto (YYYY-MM-DD)
      const dateParts = ev.date.split('-');
      if (dateParts.length === 3) {
        // Asumimos que ya está en formato YYYY-MM-DD
        formattedDate = `${ev.date} ${ev.time}`;
      } else {
        // Si no tiene el formato esperado, usamos la fecha actual
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = pad(today.getMonth() + 1);
        const dd = pad(today.getDate());
        formattedDate = `${yyyy}-${mm}-${dd} ${ev.time}`;
      }
      console.log('Fecha formateada LA14HD:', formattedDate);
    } else if (ev.time) {
      // Si solo tenemos la hora, usamos la fecha actual
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = pad(today.getMonth() + 1);
      const dd = pad(today.getDate());
      formattedDate = `${yyyy}-${mm}-${dd} ${ev.time}`;
      console.log('Fecha formateada LA14HD (solo hora):', formattedDate);
    }
    
    const result = {
      id: `la14hd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      start_time: formattedDate,
      teams: teams,
      evento: ev.title || '',
      description: ev.status || '',
      competition_name: ev.category || '',
      competencia: ev.category || '',
      tv_networks: canales,
      canales: canales,
      status: { name: ev.status || '' },
      slug: `la14hd-${Date.now()}`
    };
    
    console.log('Evento LA14HD procesado:', result);
    return result;
  });
}

async function init() {
  const agenda = document.getElementById('agenda');
  const banner = document.getElementById('dayBanner');
  if (banner) banner.textContent = formatDayBanner();
  if (agenda) agenda.textContent = 'Cargando agenda...';
  try {
    console.log('Iniciando carga de eventos...');
    
    // Cargar datos de múltiples fuentes
    const [data, channelData, manualEventsRaw, streamTPEventsRaw, la14HDEventsRaw] = await Promise.all([
      fetchJSON(API_URL).catch(err => {
        console.error('Error al cargar API_URL:', err);
        return { matches: [] };
      }),
      fetchJSON(CHANNELS_JSON).catch(err => {
        console.error('Error al cargar CHANNELS_JSON:', err);
        return { channels: [] };
      }),
      fetchJSON(EVENTOS_JSON).catch(err => {
        console.error('Error al cargar EVENTOS_JSON:', err);
        return [];
      }),
      fetchJSON(STREAMTP_EVENTOS).catch(err => {
        console.error('Error al cargar STREAMTP_EVENTOS:', err);
        return [];
      }),
      fetchJSON(LA14HD_EVENTOS).catch(err => {
        console.error('Error al cargar LA14HD_EVENTOS:', err);
        return [];
      })
    ]);
    
    console.log('Eventos cargados:', {
      manualEvents: Array.isArray(manualEventsRaw) ? manualEventsRaw.length : 'no es un array',
      streamTPEvents: Array.isArray(streamTPEventsRaw) ? streamTPEventsRaw.length : 'no es un array',
      la14HDEvents: Array.isArray(la14HDEventsRaw) ? la14HDEventsRaw.length : 'no es un array'
    });
    
    if (channelData && Array.isArray(channelData.channels)) {
      CHANNEL_LOGOS = Object.fromEntries(
        channelData.channels.map(c => [String(c.name || '').toLowerCase(), c.logo])
      );
    }
    
    // Adaptar eventos de todas las fuentes
    console.log('Adaptando eventos...');
    const manualEvents = await adaptManualEvents(Array.isArray(manualEventsRaw) ? manualEventsRaw : []);
    console.log('Eventos manuales adaptados:', manualEvents.length);
    
    // Verificar la estructura de streamTPEventsRaw
    let streamTPArray = [];
    if (streamTPEventsRaw && typeof streamTPEventsRaw === 'object') {
      if (Array.isArray(streamTPEventsRaw)) {
        streamTPArray = streamTPEventsRaw;
      } else if (streamTPEventsRaw.Events && Array.isArray(streamTPEventsRaw.Events)) {
        streamTPArray = streamTPEventsRaw.Events;
        console.log('Usando streamTPEventsRaw.Events:', streamTPArray.length);
      }
    }
    
    // Verificar la estructura de la14HDEventsRaw
    let la14HDArray = [];
    if (la14HDEventsRaw && typeof la14HDEventsRaw === 'object') {
      if (Array.isArray(la14HDEventsRaw)) {
        la14HDArray = la14HDEventsRaw;
      } else if (la14HDEventsRaw.Events && Array.isArray(la14HDEventsRaw.Events)) {
        la14HDArray = la14HDEventsRaw.Events;
        console.log('Usando la14HDEventsRaw.Events:', la14HDArray.length);
      }
    }
    
    const streamTPEvents = await adaptStreamTPEvents(streamTPArray);
    console.log('Eventos StreamTP adaptados:', streamTPEvents.length);
    
    const la14HDEvents = await adaptLA14HDEvents(la14HDArray);
    console.log('Eventos LA14HD adaptados:', la14HDEvents.length);
    
    // Combinar todos los eventos
    const allEvents = [...manualEvents, ...streamTPEvents, ...la14HDEvents];
    console.log('Total de eventos combinados:', allEvents.length);
    
    if (agenda) {
      console.log('Renderizando agenda unificada...');
      await renderAgendaUnified(null, allEvents); // Pasamos null como apiData ya que no lo usamos
    }
    
    await renderChannels(channelData);
    console.log('Inicialización completada');
  } catch (err) {
    console.error('Error en la inicialización:', err);
    if (agenda) agenda.textContent = 'No se pudo cargar la agenda. Intenta nuevamente más tarde.';
  }
}

document.addEventListener('DOMContentLoaded', init);