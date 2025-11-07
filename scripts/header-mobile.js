// scripts/header-mobile.js - VERSIÓN SIMPLIFICADA Y FUNCIONAL
document.addEventListener('DOMContentLoaded', function() {
    const siteHeader = document.querySelector('.site-header');
    const menuToggle = document.querySelector('.menu-toggle');
    const desktopNav = document.querySelector('.site-header nav');
    
    console.log('Header mobile script loaded');
    
    if (menuToggle && siteHeader) {
        console.log('Menu toggle found');
        
        // Crear navegación móvil
        let mobileNav = document.querySelector('.mobile-nav');
        if (!mobileNav) {
            mobileNav = document.createElement('nav');
            mobileNav.className = 'mobile-nav';
            
            // Copiar enlaces de la navegación desktop
            if (desktopNav) {
                const links = desktopNav.querySelectorAll('a');
                links.forEach(link => {
                    const clonedLink = link.cloneNode(true);
                    mobileNav.appendChild(clonedLink);
                });
            }
            
            document.body.appendChild(mobileNav);
            console.log('Mobile nav created');
        }
        
        // Crear overlay
        let navOverlay = document.querySelector('.nav-overlay');
        if (!navOverlay) {
            navOverlay = document.createElement('div');
            navOverlay.className = 'nav-overlay';
            document.body.appendChild(navOverlay);
            console.log('Overlay created');
        }
        
        // Control del menú
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Menu toggle clicked');
            
            const isActive = siteHeader.classList.contains('mobile-nav-active');
            
            if (isActive) {
                // Cerrar menú
                siteHeader.classList.remove('mobile-nav-active');
                mobileNav.classList.remove('active');
                navOverlay.style.display = 'none';
                document.body.style.overflow = '';
            } else {
                // Abrir menú
                siteHeader.classList.add('mobile-nav-active');
                mobileNav.classList.add('active');
                navOverlay.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
        
        // Cerrar menú al hacer click en overlay
        navOverlay.addEventListener('click', function() {
            console.log('Overlay clicked - closing menu');
            siteHeader.classList.remove('mobile-nav-active');
            mobileNav.classList.remove('active');
            this.style.display = 'none';
            document.body.style.overflow = '';
        });
        
        // Cerrar menú al hacer click en un enlace móvil
        mobileNav.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                console.log('Mobile nav link clicked - closing menu');
                siteHeader.classList.remove('mobile-nav-active');
                mobileNav.classList.remove('active');
                navOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
        
        // Cerrar menú al redimensionar a desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                siteHeader.classList.remove('mobile-nav-active');
                mobileNav.classList.remove('active');
                navOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    } else {
        console.error('Menu toggle or site header not found');
    }
});