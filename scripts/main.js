//MAIN.JS - VERSIÓN CORREGIDA CON SOPORTE PARA MÚLTIPLES OPCIONES

const API_URL = 'https://api.infutbol.site/matches/today';
const CHANNELS_JSON = 'https://json.angulismotv.workers.dev/channels';
let CHANNEL_LOGOS = {};
const EVENTOS_JSON = 'https://json.angulismotv.workers.dev/events';
const STREAMTP_EVENTOS = 'https://streamtp.angulismotv.workers.dev/eventos.json';
const LA14HD_EVENTOS = 'https://la14hd.angulismotv.workers.dev/eventos/json/agenda123.json';
const GITHUB_EVENTOS = 'https://raw.githubusercontent.com/Aguus467/test/refs/heads/main/json';

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
  if (!str) return '--:--';
  if (str.includes(' ')) {
    const parts = str.split(' ');
    if (parts.length < 2) return '--:--';
    return parts[1];
  }
  if (str.includes(':')) return str;
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
    let cleanStr = str.trim();
    if (cleanStr.includes(':') && !cleanStr.includes('-')) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = pad(today.getMonth() + 1);
      const dd = pad(today.getDate());
      cleanStr = `${yyyy}-${mm}-${dd} ${cleanStr}`;
    }
    const [date, time] = cleanStr.split(' ');
    if (!date || !time) return new Date(8640000000000000);
    let yyyy, mm, dd;
    if (date.includes('-')) {
      const parts = date.split('-').map(Number);
      if (parts[0] > 1000) {
        [yyyy, mm, dd] = parts;
      } else {
        [dd, mm, yyyy] = parts;
        if (yyyy < 1000) yyyy += 2000;
      }
    } else {
      return new Date(8640000000000000);
    }
    const [HH, MM] = time.split(':').map(Number);
    const dt = new Date(yyyy, (mm || 1) - 1, dd || 1, HH || 0, MM || 0, 0, 0);
    if (isNaN(dt.getTime())) {
      console.error('Fecha inválida:', str);
      return new Date(8640000000000000);
    }
    return dt;
  } catch (error) {
    console.error('Error al parsear fecha:', str, error);
    return new Date(8640000000000000);
  }
}

function groupDuplicateEvents(events) {
  const grouped = {};
  events.forEach(event => {
    if (!event || (!event.teams && !event.evento)) return;
    let teamNames = [];
    let originalEventName = '';
    if (event.teams && Array.isArray(event.teams) && event.teams.length > 0) {
      teamNames = event.teams.map(t => t.name?.toLowerCase().trim() || '').filter(name => name);
      originalEventName = event.teams.map(t => t.name).join(' vs ');
    } else if (event.evento) {
      originalEventName = event.evento;
      const eventoStr = event.evento.toLowerCase();
      let cleanEventName = eventoStr;
      if (eventoStr.includes(':')) {
        cleanEventName = eventoStr.split(':').slice(1).join(':').trim();
      }
      if (cleanEventName.includes(' vs ')) {
        teamNames = cleanEventName.split(' vs ').map(name => name.trim());
      } else if (cleanEventName.includes(' - ')) {
        teamNames = cleanEventName.split(' - ').map(name => name.trim());
      } else {
        teamNames = [cleanEventName.trim()];
      }
    } else {
      return;
    }
    if (teamNames.length === 0) return;
    const normalizedTeamNames = teamNames.map(name => {
      return name
        .replace(/nhl:\s*/gi, '')
        .replace(/en español\s*/gi, '')
        .replace(/\s*-\s*.+$/, '')
        .trim();
    });
    const sortedTeamNames = normalizedTeamNames.sort().join('|');
    const key = sortedTeamNames;
    if (!grouped[key]) {
      grouped[key] = {
        id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        start_time: event.start_time,
        teams: normalizedTeamNames.map(name => ({ name: name.toUpperCase() })),
        evento: originalEventName,
        description: event.description || '',
        competition_name: event.competition_name || '',
        competencia: event.competencia || '',
        status: event.status || { name: '' },
        slug: event.slug || `group-${key}`,
        sources: [event],
        allNetworks: [...(event.tv_networks || [])],
        allCanales: [...(event.canales || [])]
      };
    } else {
      grouped[key].sources.push(event);
      if (event.description && !grouped[key].description) {
        grouped[key].description = event.description;
      }
      if (event.competition_name && !grouped[key].competition_name) {
        grouped[key].competition_name = event.competition_name;
      }
      const currentTime = parseStartTime(grouped[key].start_time);
      const newTime = parseStartTime(event.start_time);
      if (newTime < currentTime) {
        grouped[key].start_time = event.start_time;
      }
      const newNetworks = event.tv_networks || [];
      newNetworks.forEach(network => {
        const exists = grouped[key].allNetworks.some(existing => 
          existing.name === network.name && existing.iframe === network.iframe && existing.link === network.link
        );
        if (!exists) grouped[key].allNetworks.push(network);
      });
      const newCanales = event.canales || [];
      newCanales.forEach(canal => {
        const exists = grouped[key].allCanales.some(existing => 
          existing.name === canal.name && existing.iframe === canal.iframe && existing.link === canal.link
        );
        if (!exists) grouped[key].allCanales.push(canal);
      });
    }
  });
  return Object.values(grouped);
}

function buildMatchCard(groupedEvent) {
  console.log(`🎬 Construyendo card para:`, groupedEvent.evento);
  const card = createEl('div', 'match-card');
  const header = createEl('div', 'match-header');
  const timeCol = createEl('div', 'time-col');
  const timeBadge = createEl('div', 'time-badge', formatTime(groupedEvent.start_time));
  timeCol.appendChild(timeBadge);
  const main = createEl('div', 'match-main');
  let eventName = '';
  const allEventNames = groupedEvent.sources.map(source => source.evento).filter(name => name);
  if (allEventNames.length > 0) {
    eventName = allEventNames.reduce((longest, current) => 
      current.length > longest.length ? current : longest, allEventNames[0]
    );
  } else if (groupedEvent.teams && groupedEvent.teams.length > 0) {
    eventName = groupedEvent.teams.map(t => t.name).join(' vs ');
  } else {
    eventName = 'Evento Deportivo';
  }
  const title = createEl('div', 'teams', eventName);
  main.appendChild(title);
  header.appendChild(timeCol);
  header.appendChild(main);
  const expandIcon = createEl('div', 'expand-icon');
  expandIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
  header.appendChild(expandIcon);
  card.appendChild(header);
  const dropdown = createEl('div', 'dropdown hidden');
  const menu = createEl('ul', 'channel-menu');
  const options = groupedEvent.allNetworks.length > 0 ? groupedEvent.allNetworks : groupedEvent.allCanales;
  console.log(`📊 Opciones para "${eventName}":`, options.length);
  
  if (options.length === 0) {
    const li = createEl('li', 'channel-item');
    li.textContent = 'Sin opciones disponibles';
    li.style.opacity = '0.6';
    menu.appendChild(li);
  } else {
    options.forEach((option, index) => {
      console.log(`  ${index + 1}. ${option.name} - iframe:${!!option.iframe} link:${!!option.link}`);
      const li = createEl('li', 'channel-item');
      const left = createEl('div', 'left');
      const play = createEl('span', 'play-icon');
      let optionName = option.name || `Opción ${index + 1}`;
      if (optionName.toLowerCase().includes('youtube')) {
        optionName = `📺 ${optionName}`;
      }
      const name = createEl('span', '', optionName);
      left.appendChild(play);
      left.appendChild(name);
      li.appendChild(left);
      
      li.addEventListener('click', (event) => {
        event.stopPropagation();
        console.log(`🎬 Clic en: ${option.name}`);
        
        // 🔥 CREAR CANAL VIRTUAL CON TODAS LAS OPCIONES
        const virtualChannel = {
          name: eventName,
          logo: './assets/logo.png',
          options: options.map((opt, idx) => {
            let url = '';
            if (opt.iframe) {
              url = opt.iframe;
            } else if (opt.link) {
              try {
                url = atob(opt.link);
              } catch (e) {
                console.error('Error decodificando:', e);
                url = '';
              }
            }
            return {
              name: opt.name || `Opción ${idx + 1}`,
              iframe: url
            };
          })
        };
        
        // Codificar el canal virtual completo
        const encodedChannel = btoa(JSON.stringify(virtualChannel));
        
        const params = new URLSearchParams();
        params.set('virtualChannel', encodedChannel);
        params.set('opt', String(index)); // Opción seleccionada
        
        const transmisionUrl = `transmision.html?${params.toString()}`;
        
        console.log('🚀 Redirigiendo con canal virtual:', virtualChannel);
        console.log('🔗 URL:', transmisionUrl);
        
        window.top.location.href = transmisionUrl;
      });
      
      menu.appendChild(li);
    });
  }
  
  dropdown.appendChild(menu);
  card.appendChild(dropdown);
  header.addEventListener('click', (e) => {
    if (e.target.closest('.channel-item')) return;
    dropdown.classList.toggle('hidden');
    card.classList.toggle('expanded');
    expandIcon.classList.toggle('expanded');
  });
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
    let canales = [];
    if (Array.isArray(ev.canales)) {
      ev.canales.forEach(canal => {
        if (canal.options && Array.isArray(canal.options)) {
          canal.options.forEach((opt, idx) => {
            canales.push({
              name: `${canal.name} - ${opt.name}`,
              iframe: opt.iframe,
              logo: canal.logo
            });
          });
        }
        else if (typeof canal === 'string') {
          canales.push({ name: canal });
        }
        else if (canal.name) {
          canales.push({
            name: canal.name,
            iframe: canal.iframe,
            logo: canal.logo
          });
        }
      });
    } else if (ev.canal) {
      canales = [ev.canal];
    }
    console.log(`📝 Adaptado: ${ev.evento} - ${canales.length} opciones`);
    return {
      start_time: ev.fecha,
      teams: teams,
      evento: ev.evento,
      description: ev.descripcion || '',
      competition_name: ev.competencia || '',
      competencia: ev.competencia || '',
      tv_networks: canales,
      canales: canales,
      status: { name: ev.estado || '' },
      slug: `manual-${ev.id}`
    };
  });
}

async function renderAgendaUnified(apiData, manualEvents) {
  const agenda = document.getElementById('agenda');
  if (!agenda) return;
  agenda.textContent = '';
  if (!Array.isArray(manualEvents) || manualEvents.length === 0) {
    agenda.textContent = 'No hay partidos programados.';
    return;
  }
  const groupedEvents = groupDuplicateEvents(manualEvents);
  console.log(`📋 Eventos: ${manualEvents.length} → ${groupedEvents.length} grupos`);
  groupedEvents.sort((a, b) => {
    const timeA = formatTime(a.start_time);
    const timeB = formatTime(b.start_time);
    return timeA.localeCompare(timeB);
  });
  const listEl = createEl('div', 'matches');
  groupedEvents.forEach(event => {
    listEl.appendChild(buildMatchCard(event));
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

function convertGMT5ToGMT3(dateStr) {
  try {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    const [date, time] = dateStr.split(' ');
    if (!date || !time) return dateStr;
    let yyyy, mm, dd;
    if (date.includes('-')) {
      const parts = date.split('-').map(Number);
      if (parts[0] > 1000) {
        [yyyy, mm, dd] = parts;
      } else {
        [dd, mm, yyyy] = parts;
      }
    } else {
      return dateStr;
    }
    const [HH, MM] = time.split(':').map(Number);
    const dt = new Date(yyyy, (mm || 1) - 1, dd || 1, HH || 0, MM || 0, 0, 0);
    if (isNaN(dt.getTime())) return dateStr;
    dt.setHours(dt.getHours() + 2);
    const newDD = pad(dt.getDate());
    const newMM = pad(dt.getMonth() + 1);
    const newYYYY = dt.getFullYear();
    const newHH = pad(dt.getHours());
    const newMM_min = pad(dt.getMinutes());
    return `${newDD}-${newMM}-${newYYYY} ${newHH}:${newMM_min}`;
  } catch (e) {
    return dateStr;
  }
}

async function adaptStreamTPEvents(events) {
  if (!Array.isArray(events)) return [];
  return events.map(ev => {
    let formattedDate = '';
    if (ev.time) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = pad(today.getMonth() + 1);
      const dd = pad(today.getDate());
      const initialDate = `${yyyy}-${mm}-${dd} ${ev.time}`;
      formattedDate = convertGMT5ToGMT3(initialDate);
    }
    let teams = [];
    if (ev.title && ev.title.includes(' vs ')) {
      teams = ev.title.split(' vs ').map(name => ({ name: name.trim() }));
    } else if (ev.title) {
      teams = [{ name: ev.title.trim() }];
    }
    const canales = [];
    if (ev.link) {
      canales.push({
        name: ev.category || 'Canal',
        link: btoa(ev.link || '')
      });
    }
    return {
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
  });
}

async function adaptLA14HDEvents(events) {
  if (!Array.isArray(events)) return [];
  return events.map(ev => {
    let teams = [];
    if (ev.title && ev.title.includes(' vs ')) {
      teams = ev.title.split(' vs ').map(name => ({ name: name.trim() }));
    } else if (ev.title) {
      teams = [{ name: ev.title.trim() }];
    }
    const canales = [];
    if (ev.link) {
      canales.push({
        name: ev.category || 'Canal',
        link: btoa(ev.link || '')
      });
    }
    let formattedDate = '';
    if (ev.date && ev.time) {
      const dateParts = ev.date.split('-');
      if (dateParts.length === 3) {
        formattedDate = `${ev.date} ${ev.time}`;
      } else {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = pad(today.getMonth() + 1);
        const dd = pad(today.getDate());
        formattedDate = `${yyyy}-${mm}-${dd} ${ev.time}`;
      }
    } else if (ev.time) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = pad(today.getMonth() + 1);
      const dd = pad(today.getDate());
      formattedDate = `${yyyy}-${mm}-${dd} ${ev.time}`;
    }
    return {
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
  });
}

async function adaptGitHubEvents(events) {
  if (!Array.isArray(events)) return [];
  return events.map(ev => {
    let teams = [];
    if (ev.title && ev.title.includes(' vs ')) {
      teams = ev.title.split(' vs ').map(name => ({ name: name.trim() }));
    } else if (ev.title) {
      teams = [{ name: ev.title.trim() }];
    }
    const canales = [];
    if (ev.link) {
      canales.push({
        name: ev.category || 'Canal',
        link: btoa(ev.link || '')
      });
    }
    let formattedDate = '';
    if (ev.date && ev.time) {
      const dateParts = ev.date.split('-');
      if (dateParts.length === 3) {
        formattedDate = `${ev.date} ${ev.time}`;
      } else {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = pad(today.getMonth() + 1);
        const dd = pad(today.getDate());
        formattedDate = `${yyyy}-${mm}-${dd} ${ev.time}`;
      }
    } else if (ev.time) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = pad(today.getMonth() + 1);
      const dd = pad(today.getDate());
      formattedDate = `${yyyy}-${mm}-${dd} ${ev.time}`;
    }
    return {
      id: `github-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      start_time: formattedDate,
      teams: teams,
      evento: ev.title || '',
      description: ev.status || '',
      competition_name: ev.category || '',
      competencia: ev.category || '',
      tv_networks: canales,
      canales: canales,
      status: { name: ev.status || '' },
      slug: `github-${Date.now()}`
    };
  });
}

async function init() {
  const agenda = document.getElementById('agenda');
  const banner = document.getElementById('dayBanner');
  if (banner) banner.textContent = formatDayBanner();
  if (agenda) agenda.textContent = 'Cargando agenda...';
  try {
    console.log('🚀 Iniciando carga...');
    const [channelData, manualEventsRaw, streamTPEventsRaw, la14HDEventsRaw, gitHubEventsRaw] = await Promise.all([
      fetchJSON(CHANNELS_JSON).catch(() => ({ channels: [] })),
      fetchJSON(EVENTOS_JSON).catch(() => []),
      fetchJSON(STREAMTP_EVENTOS).catch(() => []),
      fetchJSON(LA14HD_EVENTOS).catch(() => []),
      fetchJSON(GITHUB_EVENTOS).catch(() => [])
    ]);
    const manualEvents = await adaptManualEvents(Array.isArray(manualEventsRaw) ? manualEventsRaw : []);
    let streamTPArray = [];
    if (streamTPEventsRaw && typeof streamTPEventsRaw === 'object') {
      if (Array.isArray(streamTPEventsRaw)) {
        streamTPArray = streamTPEventsRaw;
      } else if (streamTPEventsRaw.Events && Array.isArray(streamTPEventsRaw.Events)) {
        streamTPArray = streamTPEventsRaw.Events;
      }
    }
    let la14HDArray = [];
    if (la14HDEventsRaw && typeof la14HDEventsRaw === 'object') {
      if (Array.isArray(la14HDEventsRaw)) {
        la14HDArray = la14HDEventsRaw;
      } else if (la14HDEventsRaw.Events && Array.isArray(la14HDEventsRaw.Events)) {
        la14HDArray = la14HDEventsRaw.Events;
      }
    }
    let gitHubArray = [];
    if (gitHubEventsRaw && typeof gitHubEventsRaw === 'object') {
      if (Array.isArray(gitHubEventsRaw)) {
        gitHubArray = gitHubEventsRaw;
      } else if (gitHubEventsRaw.Events && Array.isArray(gitHubEventsRaw.Events)) {
        gitHubArray = gitHubEventsRaw.Events;
      }
    }
    const streamTPEvents = await adaptStreamTPEvents(streamTPArray);
    const la14HDEvents = await adaptLA14HDEvents(la14HDArray);
    const gitHubEvents = await adaptGitHubEvents(gitHubArray);
    const allEvents = [...manualEvents, ...streamTPEvents, ...la14HDEvents, ...gitHubEvents];
    console.log(`✅ Total: ${allEvents.length} eventos`);
    if (agenda) {
      await renderAgendaUnified(null, allEvents);
    }
    await renderChannels(channelData);
  } catch (err) {
    console.error('❌ Error:', err);
    if (agenda) agenda.textContent = 'No se pudo cargar la agenda.';
  }
}

document.addEventListener('DOMContentLoaded', init);