const channels = document.querySelectorAll('.channel-card');
const playerContainer = document.getElementById('player-container');
const player = document.getElementById('player');
const closeBtn = document.getElementById('close-player');

channels.forEach(channel => {
    channel.addEventListener('click', () => {
        const videoSrc = channel.getAttribute('data-video');
        
        // Detectar HLS (.m3u8) y usar video estándar si es mp4
        if(videoSrc.endsWith('.m3u8')) {
            if(Hls.isSupported()) {
                if(window.hls) window.hls.destroy(); // Limpiar instancia anterior
                window.hls = new Hls();
                window.hls.loadSource(videoSrc);
                window.hls.attachMedia(player);
                player.play();
            } else {
                alert('Tu navegador no soporta HLS.');
            }
        } else {
            player.src = videoSrc;
            player.play();
        }
        
        playerContainer.classList.remove('hidden');
    });
});

closeBtn.addEventListener('click', () => {
    player.pause();
    playerContainer.classList.add('hidden');
});

