// ========================================
// FORO MEJORADO - AngulismoTV
// ========================================

const FORO_API_URL = 'https://foro.angulismotv.workers.dev';
let ultimoMensajeId = null;
let hayMensajesNuevos = false;

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    cargarMensajes();
    inicializarEventos();
    inicializarContadores();
    inicializarBusqueda();
    inicializarNotificaciones();
    
    // Recargar cada 15 segundos
    setInterval(verificarNuevosMensajes, 15000);
});

// ========================================
// INICIALIZAR EVENTOS
// ========================================
function inicializarEventos() {
    const foroMensaje = document.getElementById('foroMensaje');
    const foroNombre = document.getElementById('foroNombre');
    
    if (!foroMensaje || !foroNombre) {
        console.error('Elementos del formulario no encontrados');
        return;
    }
    
    // Enter para enviar
    foroMensaje.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    });
    
    // Auto-focus
    foroMensaje.focus();
    
    // Cargar nombre guardado
    const nombreGuardado = localStorage.getItem('foroNombre');
    if (nombreGuardado) {
        foroNombre.value = nombreGuardado;
    }
    
    // Guardar nombre al escribir
    foroNombre.addEventListener('input', function() {
        localStorage.setItem('foroNombre', this.value);
    });
}

// ========================================
// CONTADOR DE CARACTERES
// ========================================
function inicializarContadores() {
    const foroMensaje = document.getElementById('foroMensaje');
    const foroNombre = document.getElementById('foroNombre');
    
    if (!foroMensaje || !foroNombre) return;
    
    // Crear contadores
    const contadorNombre = crearContador(30);
    const contadorMensaje = crearContador(500);
    
    foroNombre.parentElement.appendChild(contadorNombre);
    foroMensaje.parentElement.appendChild(contadorMensaje);
    
    // Actualizar contadores
    foroNombre.addEventListener('input', () => actualizarContador(foroNombre, contadorNombre, 30));
    foroMensaje.addEventListener('input', () => actualizarContador(foroMensaje, contadorMensaje, 500));
}

function crearContador(max) {
    const contador = document.createElement('div');
    contador.className = 'char-counter';
    contador.textContent = `0/${max}`;
    return contador;
}

function actualizarContador(input, contador, max) {
    const longitud = input.value.length;
    contador.textContent = `${longitud}/${max}`;
    contador.style.color = longitud > max * 0.9 ? '#ff7f7f' : 'rgba(255,255,255,0.6)';
}

// ========================================
// BÚSQUEDA EN TIEMPO REAL
// ========================================
function inicializarBusqueda() {
    const searchInput = document.getElementById('searchMessages');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const termino = this.value.toLowerCase().trim();
        const mensajes = document.querySelectorAll('.mensaje-item');
        
        mensajes.forEach(msg => {
            const texto = msg.textContent.toLowerCase();
            if (termino === '' || texto.includes(termino)) {
                msg.style.display = 'block';
                msg.style.animation = 'fadeIn 0.3s ease';
            } else {
                msg.style.display = 'none';
            }
        });
    });
}

// ========================================
// SISTEMA DE NOTIFICACIONES
// ========================================
function inicializarNotificaciones() {
    // Pedir permiso para notificaciones del navegador
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

async function verificarNuevosMensajes() {
    try {
        const response = await fetch(FORO_API_URL + '/mensajes');
        if (!response.ok) return;
        
        const data = await response.json();
        if (!data.mensajes || data.mensajes.length === 0) return;
        
        const mensajes = data.mensajes;
        const mensajeMasReciente = mensajes[0]; // El más reciente es el primero
        
        if (ultimoMensajeId && mensajeMasReciente.id !== ultimoMensajeId) {
            mostrarNotificacionNuevoMensaje();
            
            // Notificación del navegador
            if (Notification.permission === "granted") {
                new Notification("💬 Nuevo mensaje en AngulismoTV", {
                    body: `${mensajeMasReciente.nombre}: ${mensajeMasReciente.mensaje.substring(0, 50)}...`,
                    icon: 'assets/logo.png'
                });
            }
        }
        
        ultimoMensajeId = mensajeMasReciente.id;
    } catch (error) {
        console.error('Error verificando mensajes:', error);
    }
}

function mostrarNotificacionNuevoMensaje() {
    const notif = document.createElement('div');
    notif.className = 'new-message-notification';
    notif.innerHTML = '💬 Hay mensajes nuevos <button onclick="cargarMensajes()">Ver ahora</button>';
    document.body.appendChild(notif);
    
    setTimeout(() => notif.classList.add('show'), 100);
    
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 5000);
}

// ========================================
// CARGAR MENSAJES (MEJORADO)
// ========================================
// ========================================
// CARGAR MENSAJES (MEJORADO) - CON ORDEN CORRECTO
// ========================================
async function cargarMensajes() {
    try {
        const lista = document.getElementById('listaMensajes');
        if (!lista) {
            console.error('Elemento listaMensajes no encontrado');
            return;
        }
        
        const response = await fetch(FORO_API_URL + '/mensajes');
        
        if (!response.ok) {
            throw new Error('Error en la respuesta: ' + response.status);
        }
        
        const data = await response.json();
        const mensajes = data.mensajes;
        
        if (!mensajes || mensajes.length === 0) {
            lista.innerHTML = '<div class="empty-state">No hay mensajes todavía.<br>¡Sé el primero en publicar!</div>';
            return;
        }
        
        // Actualizar estadísticas
        actualizarEstadisticas(mensajes);
        
        // 🔥 CORRECCIÓN: Invertir el orden para mostrar más recientes ABAJO
        const mensajesOrdenados = [...mensajes].reverse();
        
        // Crear HTML mejorado
        lista.innerHTML = mensajesOrdenados.map(msg => crearHTMLMensaje(msg)).join('');
        
        // Cargar reacciones para cada mensaje
        mensajesOrdenados.forEach(msg => {
            cargarReaccionesParaMensaje(msg.id);
        });
        
        // Guardar último ID
        if (mensajes.length > 0) {
            ultimoMensajeId = mensajes[0].id;
        }
        
        // Scroll al final (donde están los mensajes más recientes)
        setTimeout(() => {
            lista.scrollTop = lista.scrollHeight;
        }, 100);
        
    } catch (error) {
        console.error('Error cargando mensajes:', error);
        const lista = document.getElementById('listaMensajes');
        if (lista) {
            lista.innerHTML = '<div class="empty-state">Error al cargar los mensajes.<br>Intenta recargar la página.</div>';
        }
    }
}

// ========================================
// CREAR HTML DE MENSAJE (MEJORADO)
// ========================================
function crearHTMLMensaje(msg) {
    const avatar = generarAvatar(msg.nombre);
    const mensajeFormateado = formatearMensaje(msg.mensaje);
    const editadoBadge = msg.editado ? '<span class="editado-badge">(editado)</span>' : '';
    
    return `
        <div class="mensaje-item" data-id="${msg.id}">
            <div class="mensaje-avatar">${avatar}</div>
            <div class="mensaje-content">
                <div class="mensaje-header">
                    <span class="mensaje-nombre">${escapeHTML(msg.nombre)}</span>
                    <span class="mensaje-fecha">${formatFecha(msg.fecha)} ${editadoBadge}</span>
                </div>
                <div class="mensaje-texto">${mensajeFormateado}</div>
                <div class="mensaje-acciones">
                    <div class="reacciones-container" id="reacciones-${msg.id}">
                        <!-- Reacciones se cargan dinámicamente -->
                    </div>
                    <button class="btn-reaccion" onclick="mostrarMenuReacciones('${msg.id}', event)">
                        😊 Reaccionar
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// SISTEMA DE AVATARES
// ========================================
function generarAvatar(nombre) {
    const iniciales = nombre.trim().split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
    
    // Generar color basado en el nombre
    const hash = nombre.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const colores = [
        '#72d6ff', '#ff7fff', '#7fff7f', '#ffff7f', 
        '#ff7f7f', '#7f7fff', '#ff7fcc', '#7fffcc'
    ];
    
    const color = colores[Math.abs(hash) % colores.length];
    
    return `<div class="avatar" style="background: ${color}">${iniciales}</div>`;
}

// ========================================
// FORMATEAR MENSAJE (DESTACAR CONTENIDO)
// ========================================
function formatearMensaje(texto) {
    let resultado = escapeHTML(texto);
    
    // Destacar @menciones
    resultado = resultado.replace(/@(\w+)/g, '<span class="mencion">@$1</span>');
    
    // Destacar #hashtags
    resultado = resultado.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
    
    // Convertir URLs en links
    resultado = resultado.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" rel="noopener" class="mensaje-link">🔗 Enlace</a>'
    );
    
    // Convertir saltos de línea
    resultado = resultado.replace(/\n/g, '<br>');
    
    return resultado;
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========================================
// SISTEMA DE REACCIONES (CON BACKEND)
// ========================================
function mostrarMenuReacciones(msgId, event) {
    event.stopPropagation();
    
    // Remover menús previos
    document.querySelectorAll('.reacciones-menu').forEach(m => m.remove());
    
    const menu = document.createElement('div');
    menu.className = 'reacciones-menu';
    menu.innerHTML = `
        <button onclick="agregarReaccion('${msgId}', '❤️')">❤️</button>
        <button onclick="agregarReaccion('${msgId}', '👍')">👍</button>
        <button onclick="agregarReaccion('${msgId}', '😂')">😂</button>
        <button onclick="agregarReaccion('${msgId}', '🔥')">🔥</button>
        <button onclick="agregarReaccion('${msgId}', '👏')">👏</button>
        <button onclick="agregarReaccion('${msgId}', '🎉')">🎉</button>
    `;
    
    const btn = event.target;
    btn.parentElement.appendChild(menu);
    
    // Cerrar al hacer click fuera
    setTimeout(() => {
        document.addEventListener('click', function cerrarMenu() {
            menu.remove();
            document.removeEventListener('click', cerrarMenu);
        });
    }, 100);
}

async function agregarReaccion(msgId, emoji) {
    try {
        // Obtener o generar userId
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substring(7);
            localStorage.setItem('userId', userId);
        }
        
        const response = await fetch(`${FORO_API_URL}/mensajes/${msgId}/reacciones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ emoji, userId })
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
            // Actualizar reacciones específicas de este mensaje
            await cargarReaccionesParaMensaje(msgId);
        }
    } catch (error) {
        console.error('Error agregando reacción:', error);
        mostrarAlerta('Error al agregar reacción', 'error');
    }
}

async function cargarReaccionesParaMensaje(msgId) {
    try {
        const response = await fetch(`${FORO_API_URL}/mensajes/${msgId}/reacciones`);
        if (!response.ok) return;
        
        const reacciones = await response.json();
        const container = document.getElementById(`reacciones-${msgId}`);
        
        if (container && reacciones.length > 0) {
            let html = '';
            reacciones.forEach(r => {
                html += `<span class="reaccion-badge" onclick="agregarReaccion('${msgId}', '${r.emoji}')">${r.emoji} ${r.count}</span>`;
            });
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error cargando reacciones:', error);
    }
}

// ========================================
// ESTADÍSTICAS
// ========================================
function actualizarEstadisticas(mensajes) {
    const statsEl = document.getElementById('foroStats');
    if (!statsEl) return;
    
    const hoy = new Date().toDateString();
    const mensajesHoy = mensajes.filter(m => 
        new Date(m.fecha).toDateString() === hoy
    ).length;
    
    const usuariosUnicos = new Set(mensajes.map(m => m.nombre)).size;
    
    statsEl.innerHTML = `
        <div class="stat-item">
            <span class="stat-number">${mensajes.length}</span>
            <span class="stat-label">Mensajes totales</span>
        </div>
        <div class="stat-item">
            <span class="stat-number">${mensajesHoy}</span>
            <span class="stat-label">Hoy</span>
        </div>
        <div class="stat-item">
            <span class="stat-number">${usuariosUnicos}</span>
            <span class="stat-label">Usuarios</span>
        </div>
    `;
}

// ========================================
// FORMATEAR FECHA
// ========================================
// ========================================
// FORMATEAR FECHA - CON DEBUG Y CORRECCIÓN DE TIMEZONE
// ========================================
// ========================================
// FORMATEAR FECHA - INTERPRETACIÓN UTC EXPLÍCITA
// ========================================
function formatFecha(fechaString) {
    try {
        // 🔥 FORZAR INTERPRETACIÓN UTC
        let fecha;
        
        // Si la fecha no tiene 'Z' (UTC) al final, agregarlo
        if (!fechaString.endsWith('Z') && !fechaString.includes('+')) {
            fechaString += 'Z'; // Asumir UTC
        }
        
        fecha = new Date(fechaString);
        
        console.log('🔍 Debug fecha corregida:', {
            original: fechaString,
            fechaLocal: fecha.toString(),
            horaLocal: fecha.toLocaleTimeString(),
            diferenciaHoras: new Date().getHours() - fecha.getHours()
        });
        
        const ahora = new Date();
        const diferencia = ahora - fecha;
        const dias = Math.floor(diferencia / (3600000 * 24));
        
        const userLocale = navigator.language || 'es-ES';
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        const opciones = {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: userTimezone
        };
        
        const horaFormateada = fecha.toLocaleTimeString(userLocale, opciones);
        
        if (dias === 0) {
            return `Hoy ${horaFormateada}`;
        } else if (dias === 1) {
            return `Ayer ${horaFormateada}`;
        } else if (dias < 7) {
            const diaSemana = fecha.toLocaleDateString(userLocale, { 
                weekday: 'short',
                timeZone: userTimezone 
            });
            return `${diaSemana} ${horaFormateada}`;
        } else {
            return fecha.toLocaleDateString(userLocale, {
                day: 'numeric',
                month: 'short',
                ...opciones
            });
        }
        
    } catch (error) {
        console.error('Error formateando fecha:', error);
        // Fallback: mostrar tal cual viene del servidor
        return fechaString.split('T')[1]?.substring(0, 5) || '--:--';
    }
}

// ========================================
// ENVIAR MENSAJE (MEJORADO)
// ========================================
async function enviarMensaje() {
    const nombreInput = document.getElementById('foroNombre');
    const mensajeInput = document.getElementById('foroMensaje');
    
    if (!nombreInput || !mensajeInput) {
        mostrarAlerta('Error: formulario no encontrado', 'error');
        return;
    }
    
    const nombre = nombreInput.value.trim();
    const mensaje = mensajeInput.value.trim();
    
    if (!nombre) {
        mostrarAlerta('Por favor, ingresá tu nombre', 'warning');
        nombreInput.focus();
        return;
    }
    
    if (!mensaje) {
        mostrarAlerta('Por favor, escribí un mensaje', 'warning');
        mensajeInput.focus();
        return;
    }
    
    if (nombre.length > 30) {
        mostrarAlerta('El nombre no puede superar 30 caracteres', 'warning');
        return;
    }
    
    if (mensaje.length > 500) {
        mostrarAlerta('El mensaje no puede superar 500 caracteres', 'warning');
        return;
    }
    
    // Deshabilitar botón mientras envía
    const btnEnviar = document.querySelector('.btn-foro');
    if (btnEnviar) {
        btnEnviar.disabled = true;
        btnEnviar.textContent = 'Enviando...';
    }
    
    try {
        const response = await fetch(FORO_API_URL + '/mensajes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                nombre: nombre,
                mensaje: mensaje
            })
        });
        
        const resultado = await response.json();
        
        if (response.ok && resultado.success) {
            mensajeInput.value = '';
            mensajeInput.focus();
            
            mostrarAlerta('¡Mensaje publicado!', 'success');
            
            await cargarMensajes();
            
        } else {
            const errorMsg = resultado.error || 'Error al publicar el mensaje';
            mostrarAlerta(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('Error de conexión', 'error');
    } finally {
        if (btnEnviar) {
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'Enviar';
        }
    }
}

// ========================================
// SISTEMA DE ALERTAS
// ========================================
function mostrarAlerta(mensaje, tipo = 'info') {
    const alerta = document.createElement('div');
    alerta.className = `alerta alerta-${tipo}`;
    
    const iconos = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    alerta.innerHTML = `${iconos[tipo]} ${mensaje}`;
    document.body.appendChild(alerta);
    
    setTimeout(() => alerta.classList.add('show'), 100);
    
    setTimeout(() => {
        alerta.classList.remove('show');
        setTimeout(() => alerta.remove(), 300);
    }, 3000);
}

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================
window.enviarMensaje = enviarMensaje;
window.mostrarMenuReacciones = mostrarMenuReacciones;
window.agregarReaccion = agregarReaccion;
window.cargarMensajes = cargarMensajes;