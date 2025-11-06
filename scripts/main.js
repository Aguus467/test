//MAIN.JS


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

// MEJORA la función parseStartTime:
function parseStartTime(str) {
  try {
    if (!str || typeof str !== 'string') return new Date(8640000000000000); // Fecha muy futura
    
    // Limpiar y estandarizar el formato de fecha
    let cleanStr = str.trim();
    
    // Si es solo hora, agregar fecha de hoy
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
    
    // Detectar formato de fecha (DD-MM-YYYY o YYYY-MM-DD)
    if (date.includes('-')) {
      const parts = date.split('-').map(Number);
      if (parts[0] > 1000) { // Es formato YYYY-MM-DD
        [yyyy, mm, dd] = parts;
      } else { // Es formato DD-MM-YYYY
        [dd, mm, yyyy] = parts;
        
        // Corregir año si es necesario (formato 2025-20-08 es inválido)
        if (yyyy < 1000) {
          yyyy += 2000; // Asumir siglo 21
        }
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

// Función para agrupar eventos duplicados
// REEMPLAZA la función groupDuplicateEvents con esta versión mejorada:
// REEMPLAZA completamente la función groupDuplicateEvents con esta versión:
function groupDuplicateEvents(events) {
  const grouped = {};
  
  events.forEach(event => {
    // Verificar si el evento tiene datos válidos
    if (!event || (!event.teams && !event.evento)) {
      console.log('Evento inválido omitido:', event);
      return;
    }
    
    // Extraer nombres de equipos de diferentes maneras
    let teamNames = [];
    let originalEventName = '';
    
    if (event.teams && Array.isArray(event.teams) && event.teams.length > 0) {
      // Si ya tiene teams definidos
      teamNames = event.teams.map(t => t.name?.toLowerCase().trim() || '').filter(name => name);
      originalEventName = event.teams.map(t => t.name).join(' vs ');
    } else if (event.evento) {
      // Intentar extraer equipos del título del evento
      originalEventName = event.evento;
      const eventoStr = event.evento.toLowerCase();
      
      // Limpiar el nombre del evento (remover prefijos como "NHL:", etc.)
      let cleanEventName = eventoStr;
      if (eventoStr.includes(':')) {
        cleanEventName = eventoStr.split(':').slice(1).join(':').trim();
      }
      
      if (cleanEventName.includes(' vs ')) {
        teamNames = cleanEventName.split(' vs ').map(name => name.trim());
      } else if (cleanEventName.includes(' - ')) {
        teamNames = cleanEventName.split(' - ').map(name => name.trim());
      } else {
        // Si no se pueden extraer equipos, usar el título completo limpio
        teamNames = [cleanEventName.trim()];
      }
    } else {
      console.log('Evento sin datos de equipos:', event);
      return;
    }
    
    if (teamNames.length === 0) {
      console.log('Evento sin nombres de equipos válidos:', event);
      return;
    }
    
    // Normalizar nombres de equipos (remover detalles extra)
    const normalizedTeamNames = teamNames.map(name => {
      // Remover "en español", "nhl:", etc.
      return name
        .replace(/nhl:\s*/gi, '')
        .replace(/en español\s*/gi, '')
        .replace(/\s*-\s*.+$/, '') // Remover todo después del último guión
        .trim();
    });
    
    // Crear clave única basada SOLO en los equipos (ignorar hora)
    const sortedTeamNames = normalizedTeamNames.sort().join('|');
    const key = sortedTeamNames; // Solo equipos, sin hora
    
    console.log(`Procesando evento: "${originalEventName}"`);
    console.log(`  Equipos normalizados: ${normalizedTeamNames.join(' vs ')}`);
    console.log(`  Clave de agrupación: ${key}`);
    console.log(`  Hora original: ${event.start_time}`);
    
    if (!grouped[key]) {
      console.log(`  → NUEVO GRUPO creado`);
      grouped[key] = {
        id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        start_time: event.start_time, // Usar la primera hora que encontremos
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
      console.log(`  → AGREGANDO a grupo existente`);
      
      // Evento duplicado - combinar opciones
      grouped[key].sources.push(event);
      
      // Mejorar la información si esta fuente tiene datos más completos
      if (event.description && !grouped[key].description) {
        grouped[key].description = event.description;
      }
      if (event.competition_name && !grouped[key].competition_name) {
        grouped[key].competition_name = event.competition_name;
      }
      
      // Usar la hora más temprana
      const currentTime = parseStartTime(grouped[key].start_time);
      const newTime = parseStartTime(event.start_time);
      if (newTime < currentTime) {
        grouped[key].start_time = event.start_time;
      }
      
      // Combinar networks evitando duplicados exactos
      const newNetworks = event.tv_networks || [];
      newNetworks.forEach(network => {
        const exists = grouped[key].allNetworks.some(existing => 
          existing.name === network.name && existing.link === network.link
        );
        if (!exists) {
          console.log(`    Agregando nueva opción: ${network.name}`);
          grouped[key].allNetworks.push(network);
        }
      });
      
      // Combinar canales evitando duplicados exactos
      const newCanales = event.canales || [];
      newCanales.forEach(canal => {
        const exists = grouped[key].allCanales.some(existing => 
          existing.name === canal.name && existing.link === canal.link
        );
        if (!exists) {
          grouped[key].allCanales.push(canal);
        }
      });
    }
    
    console.log(''); // Línea en blanco para separar eventos
  });
  
  const result = Object.values(grouped);
  console.log(`🎯 AGRUPACIÓN FINAL: ${events.length} eventos → ${result.length} grupos`);
  result.forEach((group, index) => {
    console.log(`   Grupo ${index + 1}: ${group.teams.map(t => t.name).join(' vs ')}`);
    console.log(`     Horas combinadas: ${group.sources.map(s => formatTime(s.start_time)).join(', ')}`);
    console.log(`     Opciones: ${group.allNetworks.length}`);
    console.log(`     Fuentes: ${group.sources.length}`);
  });
  
  return result;
}

function buildMatchCard(groupedEvent) {
  console.log(`Construyendo card para grupo:`, groupedEvent);
  
  const card = createEl('div', 'match-card');
  
  // Header (siempre visible)
  const header = createEl('div', 'match-header');
  
  const timeCol = createEl('div', 'time-col');
  const timeBadge = createEl('div', 'time-badge', formatTime(groupedEvent.start_time));
  timeCol.appendChild(timeBadge);
  
  const main = createEl('div', 'match-main');
  
  // Título del evento - USAR EL NOMBRE ORIGINAL MÁS DESCRIPTIVO
  let eventName = '';
  
  // Prioridad 1: Usar el evento original más descriptivo de todas las fuentes
  const allEventNames = groupedEvent.sources.map(source => source.evento).filter(name => name);
  if (allEventNames.length > 0) {
    // Encontrar el nombre más descriptivo (más largo)
    eventName = allEventNames.reduce((longest, current) => 
      current.length > longest.length ? current : longest, allEventNames[0]
    );
  } 
  // Prioridad 2: Usar los equipos si no hay nombre de evento
  else if (groupedEvent.teams && groupedEvent.teams.length > 0) {
    eventName = groupedEvent.teams.map(t => t.name).join(' vs ');
  }
  // Prioridad 3: Usar el primer evento disponible
  else if (groupedEvent.sources.length > 0 && groupedEvent.sources[0].evento) {
    eventName = groupedEvent.sources[0].evento;
  }
  // Último recurso
  else {
    eventName = 'Evento Deportivo';
  }
  
  const title = createEl('div', 'teams', eventName);
  main.appendChild(title);
  
  const meta = createEl('div', 'meta');
  
  // Descripción (usar la más descriptiva disponible)
  if (groupedEvent.description) {
    meta.appendChild(createEl('span', '', groupedEvent.description));
  } else {
    // Buscar descripción en las fuentes
    const allDescriptions = groupedEvent.sources.map(source => source.description).filter(desc => desc);
    if (allDescriptions.length > 0) {
      meta.appendChild(createEl('span', '', allDescriptions[0]));
    }
  }
  
  // Badge con cantidad de opciones disponibles
  const optionsCount = Math.max(groupedEvent.allNetworks.length, groupedEvent.allCanales.length);
  const sourcesBadge = createEl('span', 'sources-badge', `${optionsCount} opciones`);
  //meta.appendChild(sourcesBadge);
  
  // Info de fuentes combinadas
  const sourcesInfo = createEl('span', 'sources-info', `[${groupedEvent.sources.length} fuentes]`);
  //meta.appendChild(sourcesInfo);
  
  //main.appendChild(meta);
  
  header.appendChild(timeCol);
  header.appendChild(main);
  
  // Icono de expansión
  const expandIcon = createEl('div', 'expand-icon');
  expandIcon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
  header.appendChild(expandIcon);
  
  card.appendChild(header);
  
  // Dropdown con opciones (oculto inicialmente)
  const dropdown = createEl('div', 'dropdown hidden');
  const menu = createEl('ul', 'channel-menu');
  
  // Usar allNetworks si está disponible, sino allCanales
  const options = groupedEvent.allNetworks.length > 0 ? groupedEvent.allNetworks : groupedEvent.allCanales;
  
  console.log(`Opciones para "${eventName}":`, options);
  
  if (options.length === 0) {
    const li = createEl('li', 'channel-item');
    li.textContent = 'Sin opciones disponibles';
    li.style.opacity = '0.6';
    menu.appendChild(li);
  } else {
options.forEach((option, index) => {
  const li = createEl('li', 'channel-item');
  const left = createEl('div', 'left');
  const play = createEl('span', 'play-icon');
  
  // Mostrar el nombre del canal/opción
  let optionName = option.name || `Opción ${index + 1}`;
  
  // Si es YouTube, mostrar ícono especial
  if (optionName.toLowerCase().includes('youtube')) {
    optionName = `📺 ${optionName}`;
  }
  
  const name = createEl('span', '', optionName);
  
  left.appendChild(play);
  left.appendChild(name);
  li.appendChild(left);
  
  li.addEventListener('click', (event) => {
    event.stopPropagation();
    
    console.log(`Clic en opción: ${option.name} para evento: ${eventName}`);
    console.log('Estructura de la opción:', option);
    
    let encodedUrl = '';
    
    // 🔥 PRIORIDAD 1: Si tiene 'link' (ya viene en base64 de StreamTP/LA14HD)
    if (option.link) {
      encodedUrl = option.link;
      console.log('✅ Usando link codificado:', atob(encodedUrl));
    }
    // 🔥 PRIORIDAD 2: Si tiene 'iframe' (de eventos manuales)
    else if (option.iframe) {
      encodedUrl = btoa(option.iframe);
      console.log('✅ Codificando iframe:', option.iframe);
    }
    // ❌ Sin URL válida
    else {
      console.error('❌ Opción sin enlace válido:', option);
      alert('Esta opción no tiene un enlace disponible');
      return;
    }
    
    // Redirigir con el parámetro 'event' (transmision.js ya lo maneja)
    const params = new URLSearchParams();
    params.set('event', encodedUrl);
    
    console.log('🚀 Redirigiendo a:', `transmision.html?${params.toString()}`);
    
    window.top.location.href = `transmision.html?${params.toString()}`;
  });
  
  menu.appendChild(li);
});
  }
  
  dropdown.appendChild(menu);
  card.appendChild(dropdown);
  
  // Toggle del acordeón
  header.addEventListener('click', (e) => {
    if (e.target.closest('.channel-item')) return;
    
    const isExpanding = dropdown.classList.contains('hidden');
    console.log(`${isExpanding ? 'Expandiendo' : 'Contrayendo'} acordeón para: ${eventName}`);
    
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
    
    // 🔥 CORREGIDO: Extraer las opciones de cada canal
    let canales = [];
    
    if (Array.isArray(ev.canales)) {
      ev.canales.forEach(canal => {
        // Si el canal tiene options (estructura de canales manuales)
        if (canal.options && Array.isArray(canal.options)) {
          canal.options.forEach((opt, idx) => {
            canales.push({
              name: `${canal.name} - ${opt.name}`,
              iframe: opt.iframe,
              logo: canal.logo
            });
          });
        }
        // Si es solo un string (compatibilidad antigua)
        else if (typeof canal === 'string') {
          canales.push({ name: canal });
        }
        // Si es un objeto simple sin options
        else if (canal.name) {
          canales.push({
            name: canal.name,
            iframe: canal.iframe,
            logo: canal.logo
          });
        }
      });
    } else if (ev.canal) {
      // Compatibilidad con formato antiguo
      canales = [ev.canal];
    }
    
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

// Modificar renderAgendaUnified para usar eventos agrupados
async function renderAgendaUnified(apiData, manualEvents) {
  const agenda = document.getElementById('agenda');
  if (!agenda) return;
  agenda.textContent = '';
  
  if (!Array.isArray(manualEvents) || manualEvents.length === 0) {
    agenda.textContent = 'No hay partidos programados.';
    return;
  }

  // Agrupar eventos duplicados
  const groupedEvents = groupDuplicateEvents(manualEvents);
  console.log(`Eventos agrupados: ${manualEvents.length} → ${groupedEvents.length}`);
  
  // Ordenar por hora
  groupedEvents.sort((a, b) => {
    const timeA = formatTime(a.start_time);
    const timeB = formatTime(b.start_time);
    return timeA.localeCompare(timeB);
  });

  const listEl = createEl('div', 'matches');
  
  groupedEvents.forEach(event => {
    console.log(`Evento: ${event.teams.map(t => t.name).join(' vs ')} - ${event.allNetworks.length} opciones`);
    listEl.appendChild(buildMatchCard(event)); // ← Esto recibe el evento AGRUPADO
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

// Función para adaptar eventos de GitHub
async function adaptGitHubEvents(events) {
  if (!Array.isArray(events)) {
    console.error('gitHubEvents no es un array:', events);
    return [];
  }
  
  console.log('Adaptando eventos de GitHub:', events.length);
  
  return events.map(ev => {
    console.log('Procesando evento GitHub:', ev);
    
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
      console.log('Fecha formateada GitHub:', formattedDate);
    } else if (ev.time) {
      // Si solo tenemos la hora, usamos la fecha actual
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = pad(today.getMonth() + 1);
      const dd = pad(today.getDate());
      formattedDate = `${yyyy}-${mm}-${dd} ${ev.time}`;
      console.log('Fecha formateada GitHub (solo hora):', formattedDate);
    }
    
    const result = {
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
    
    console.log('Evento GitHub procesado:', result);
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
    const [channelData, manualEventsRaw, streamTPEventsRaw, la14HDEventsRaw, gitHubEventsRaw] = await Promise.all([
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
      }),
      fetchJSON(GITHUB_EVENTOS).catch(err => {
        console.error('Error al cargar GITHUB_EVENTOS:', err);
        return [];
      })
    ]);
    
    console.log('Eventos cargados:', {
      manualEvents: Array.isArray(manualEventsRaw) ? manualEventsRaw.length : 'no es un array',
      streamTPEvents: Array.isArray(streamTPEventsRaw) ? streamTPEventsRaw.length : 'no es un array',
      la14HDEvents: Array.isArray(la14HDEventsRaw) ? la14HDEventsRaw.length : 'no es un array',
      gitHubEvents: Array.isArray(gitHubEventsRaw) ? gitHubEventsRaw.length : 'no es un array'
    });
    
    // Adaptar eventos de todas las fuentes
    console.log('Adaptando eventos...');
    const manualEvents = await adaptManualEvents(Array.isArray(manualEventsRaw) ? manualEventsRaw : []);
    
    // Verificar la estructura de streamTPEventsRaw
    let streamTPArray = [];
    if (streamTPEventsRaw && typeof streamTPEventsRaw === 'object') {
      if (Array.isArray(streamTPEventsRaw)) {
        streamTPArray = streamTPEventsRaw;
      } else if (streamTPEventsRaw.Events && Array.isArray(streamTPEventsRaw.Events)) {
        streamTPArray = streamTPEventsRaw.Events;
      }
    }
    
    // Verificar la estructura de la14HDEventsRaw
    let la14HDArray = [];
    if (la14HDEventsRaw && typeof la14HDEventsRaw === 'object') {
      if (Array.isArray(la14HDEventsRaw)) {
        la14HDArray = la14HDEventsRaw;
      } else if (la14HDEventsRaw.Events && Array.isArray(la14HDEventsRaw.Events)) {
        la14HDArray = la14HDEventsRaw.Events;
      }
    }
    
    // Verificar la estructura de gitHubEventsRaw
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
    
    // Combinar todos los eventos
    const allEvents = [...manualEvents, ...streamTPEvents, ...la14HDEvents, ...gitHubEvents];
    console.log('Total de eventos combinados:', allEvents.length);
    
    if (agenda) {
      console.log('Renderizando agenda unificada con acordeón...');
      // ✅ CORREGIDO: Pasar todos los eventos combinados para agrupar
      await renderAgendaUnified(null, allEvents);
    }
    
    await renderChannels(channelData);
    console.log('Inicialización completada');
    
  } catch (err) {
    console.error('Error en la inicialización:', err);
    if (agenda) agenda.textContent = 'No se pudo cargar la agenda. Intenta nuevamente más tarde.';
  }
}

document.addEventListener('DOMContentLoaded', init);

// Función para mostrar/ocultar elementos
function toggleElement(element, show) {
  if (show) {
    element.classList.remove('hidden');
  } else {
    element.classList.add('hidden');
  }
}