// ==================== Control de Música de Fondo ====================

// Estado inicial de la música
let isMusicPlaying = false;
let volume = 0.7; // Volumen por defecto (70%)

// Obtener elementos de forma segura
function getMusicElements() {
    return {
        backgroundMusic: document.getElementById('backgroundMusic'),
        musicToggle: document.getElementById('musicToggle'),
        musicIcon: document.getElementById('musicIcon'),
        volumeControl: document.getElementById('volumeControl'),
        volumeSlider: document.getElementById('volumeSlider'),
        volumeHandle: document.getElementById('volumeHandle')
    };
}

// Verificar si los elementos existen
function musicElementsExist() {
    const elements = getMusicElements();
    return elements.backgroundMusic && elements.musicToggle && elements.musicIcon;
}

// Cargar configuración guardada
function loadMusicSettings() {
    if (!musicElementsExist()) return;
    
    const savedVolume = localStorage.getItem('angulismotv_music_volume');
    const savedState = localStorage.getItem('angulismotv_music_state');
    
    if (savedVolume !== null) {
        volume = parseFloat(savedVolume);
        updateVolumeUI();
    }
    
    if (savedState === 'playing') {
        playMusic();
    }
}

// Guardar configuración
function saveMusicSettings() {
    localStorage.setItem('angulismotv_music_volume', volume);
    localStorage.setItem('angulismotv_music_state', isMusicPlaying ? 'playing' : 'paused');
}

// Actualizar interfaz de volumen
function updateVolumeUI() {
    if (!musicElementsExist()) return;
    
    const elements = getMusicElements();
    elements.volumeSlider.style.width = (volume * 100) + '%';
    elements.volumeHandle.style.right = ((1 - volume) * 100) + '%';
    elements.backgroundMusic.volume = volume;
}

// Reproducir música
function playMusic() {
    if (!musicElementsExist()) return;
    
    const elements = getMusicElements();
    elements.backgroundMusic.play().then(() => {
        isMusicPlaying = true;
        elements.musicIcon.textContent = '⏸';
        saveMusicSettings();
    }).catch(error => {
        console.log('Error al reproducir música:', error);
    });
}

// Pausar música
function pauseMusic() {
    if (!musicElementsExist()) return;
    
    const elements = getMusicElements();
    elements.backgroundMusic.pause();
    isMusicPlaying = false;
    elements.musicIcon.textContent = '▶';
    saveMusicSettings();
}

// Alternar reproducción/pausa
function toggleMusic() {
    if (isMusicPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

// Configurar controles de volumen
function setupVolumeControls() {
    if (!musicElementsExist()) return;
    
    const elements = getMusicElements();
    let isDragging = false;
    
    // Actualizar volumen al hacer clic en la barra
    elements.volumeControl.addEventListener('click', (e) => {
        const rect = elements.volumeControl.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        volume = Math.max(0, Math.min(1, clickX / rect.width));
        updateVolumeUI();
        saveMusicSettings();
    });
    
    // Arrastrar el controlador de volumen
    elements.volumeHandle.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const rect = elements.volumeControl.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        volume = Math.max(0, Math.min(1, clickX / rect.width));
        updateVolumeUI();
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            saveMusicSettings();
        }
    });
    
    // Soporte táctil para móviles
    elements.volumeHandle.addEventListener('touchstart', (e) => {
        isDragging = true;
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        
        const rect = elements.volumeControl.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        volume = Math.max(0, Math.min(1, touchX / rect.width));
        updateVolumeUI();
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            saveMusicSettings();
        }
    });
}

// Inicializar controles de música
function initMusicControls() {
    // Verificar si los elementos existen antes de inicializar
    if (!musicElementsExist()) {
        console.log('Controles de música no encontrados en esta página');
        return;
    }
    
    const elements = getMusicElements();
    elements.musicToggle.addEventListener('click', toggleMusic);
    setupVolumeControls();
    loadMusicSettings();
    updateVolumeUI();
    
    // En móviles, empezar con la música pausada para ahorrar batería
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        pauseMusic();
    }
}

// Auto-inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initMusicControls();
});