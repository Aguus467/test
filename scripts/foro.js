// Cargar mensajes cuando la página se carga
const FORO_API_URL = 'https://foro.angulismotv.workers.dev';
document.addEventListener('DOMContentLoaded', function() {
    cargarMensajes();
    initMusicControls(); // Inicializar controles de música
    
    // Enviar con Enter
    document.getElementById('foroMensaje').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    });
    
    // Auto-focus en el mensaje
    document.getElementById('foroMensaje').focus();
});

// Función para cargar mensajes
async function cargarMensajes() {
    try {
        const response = await fetch(FORO_API_URL + '/mensajes');
        
        if (!response.ok) {
            throw new Error('Error en la respuesta: ' + response.status);
        }
        
        const mensajes = await response.json();
        const lista = document.getElementById('listaMensajes');
        
        if (!mensajes || mensajes.length === 0) {
            lista.innerHTML = '<div class="empty-state">No hay mensajes todavía.<br>¡Sé el primero en publicar!</div>';
            return;
        }
        
        // Ordenar: más antiguos arriba, más recientes abajo
        const mensajesOrdenados = [...mensajes].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        
        // Crear HTML de los mensajes
        lista.innerHTML = mensajesOrdenados.map(msg => `
            <div class="mensaje-item">
                <div class="mensaje-header">
                    <span class="mensaje-nombre">${msg.nombre}</span>
                    <span class="mensaje-fecha">${formatFecha(msg.fecha)}</span>
                </div>
                <div class="mensaje-texto">${msg.mensaje}</div>
            </div>
        `).join('');
        
        // Scroll al final
        setTimeout(() => {
            lista.scrollTop = lista.scrollHeight;
        }, 100);
        
    } catch (error) {
        console.error('Error cargando mensajes:', error);
        lista.innerHTML = '<div class="empty-state">Error al cargar los mensajes.<br>Intenta recargar la página.</div>';
    }
}

// Función para formatear fecha
function formatFecha(fechaString) {
    const fecha = new Date(fechaString);
    const ahora = new Date();
    
    if (fecha.toDateString() === ahora.toDateString()) {
        return `Hoy ${fecha.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        })}`;
    }
    
    const ayer = new Date(ahora);
    ayer.setDate(ahora.getDate() - 1);
    if (fecha.toDateString() === ayer.toDateString()) {
        return `Ayer ${fecha.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        })}`;
    }
    
    return fecha.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// Función para enviar mensaje
async function enviarMensaje() {
    const nombre = document.getElementById('foroNombre').value.trim();
    const mensaje = document.getElementById('foroMensaje').value.trim();
    
    if (!nombre) {
        alert('Por favor, ingresá tu nombre');
        document.getElementById('foroNombre').focus();
        return;
    }
    
    if (!mensaje) {
        alert('Por favor, escribí un mensaje');
        document.getElementById('foroMensaje').focus();
        return;
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
            document.getElementById('foroMensaje').value = '';
            document.getElementById('foroMensaje').focus();
            await cargarMensajes();
            
            // Scroll suave al formulario después de enviar
            setTimeout(() => {
                document.querySelector('.formulario-integrado').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 300);
            
        } else {
            alert('Error al publicar el mensaje');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// Recargar mensajes cada 20 segundos
setInterval(cargarMensajes, 20000);