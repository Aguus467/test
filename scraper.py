import requests
import re
import json
from urllib.parse import urljoin

# URL de la página principal que carga el script.js
# Cambiar si la página principal cambia
MAIN_PAGE_URL = "https://gh.alangulotv.blog/"

# URLs de imágenes que ya tenemos (para no perderlas)
IMAGE_URLS = {
    "ESPN": "https://p.alangulotv.blog/ESPN",
    "ESPN 2": "https://p.alangulotv.blog/ESPN2",
    "ESPN 3": "https://p.alangulotv.blog/ESPN3",
    "ESPN 4": "https://p.alangulotv.blog/ESPN4",
    "ESPN Premium": "https://p.alangulotv.blog/ESPNPREMIUM",
    "TNT Sports": "https://p.alangulotv.blog/TNTSPORTS",
    "TyC Sports": "https://p.alangulotv.blog/TYCSPORTS",
    "Fox Sports": "https://p.alangulotv.blog/FOXSPORTS",
    "Fox Sports 2": "https://p.alangulotv.blog/FOXSPORTS2",
    "Fox Sports 3": "https://p.alangulotv.blog/FOXSPORTS3",
    "TV Pública": "https://p.alangulotv.blog/TVP",
    "Telefe": "https://p.alangulotv.blog/TELEFE",
    "El Trece": "https://tvlibreonline.org/img/eltrece.webp",
    "Fórmula 1": "https://p.alangulotv.blog/F1-2",
    "DAZN F1": "https://p.alangulotv.blog/DAZNF1",
    "DIRECTV Sports": "https://p.alangulotv.blog/DTV"
    # Añadir más si es necesario
}

def fetch_content(url):
    """Descarga el contenido de texto de una URL."""
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching URL {url}: {e}")
        return None

def extract_script_url(html, base_url):
    """Encuentra la URL del script.js principal en el HTML."""
    match = re.search(r'<script\s+src="([^"]*script\.js[^"]*)"', html)
    if match:
        script_path = match.group(1)
        return urljoin(base_url, script_path)
    print("Error: No se pudo encontrar la URL del script.js en el HTML.")
    return None

def extract_channels_json_text(js_code):
    """Extrae el objeto JavaScript 'channels' del código JS."""
    match = re.search(r'const\s+channels\s*=\s*(\{[\s\S]*?\});', js_code)
    if match:
        return match.group(1)
    print("Error: No se pudo encontrar el objeto 'const channels' en el código JS.")
    return None

def format_channel_name(key):
    """Convierte una clave como 'espn-premium-a' a un nombre legible como 'ESPN Premium'."""
    base_name = re.sub(r'-[a-z0-9]$', '', key)
    return base_name.replace("-", " ").title()

def process_channels(json_text):
    """Procesa el JSON extraído y lo convierte a la estructura de la app."""
    try:
        data = json.loads(json_text)
        processed_channels = {}
        for key, value in data.items():
            if not isinstance(value, dict) or not any(k.startswith('repro') for k in value):
                continue

            channel_name = format_channel_name(key)
            
            if channel_name not in processed_channels:
                processed_channels[channel_name] = {
                    "nombre": channel_name,
                    "imagenUrl": IMAGE_URLS.get(channel_name, f"https://p.alangulotv.blog/{channel_name.replace(' ', '').upper()}"),
                    "urls": []
                }
            
            urls = [v for k, v in value.items() if k.startswith('repro') and v]
            processed_channels[channel_name]["urls"].extend(urls)

        return list(processed_channels.values())
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return None

def structure_into_sections(channels_list):
    """Organiza la lista de canales en secciones."""
    deportes = [c for c in channels_list if any(keyword in c["nombre"] for keyword in ["Espn", "Tnt", "Tyc", "Fox", "Directv"])]
    nacionales = [c for c in channels_list if any(keyword in c["nombre"] for keyword in ["Publica", "Telefe", "Trece"])]
    otros = [c for c in channels_list if c not in deportes and c not in nacionales]

    return [
        {"seccionTitulo": "Deportes", "canales": deportes},
        {"seccionTitulo": "Canales Nacionales", "canales": nacionales},
        {"seccionTitulo": "Otros", "canales": otros}
    ]

def main():
    """Función principal del script."""
    print("Paso 1: Descargando HTML principal...")
    html = fetch_content(MAIN_PAGE_URL)
    if not html:
        exit(1)

    print("Paso 2: Extrayendo URL del script.js...")
    script_url = extract_script_url(html, MAIN_PAGE_URL)
    if not script_url:
        exit(1)
    
    print(f"Paso 3: Descargando contenido del script desde: {script_url}")
    js_code = fetch_content(script_url)
    if not js_code:
        exit(1)

    print("Paso 4: Extrayendo el objeto de canales del JavaScript...")
    json_text = extract_channels_json_text(js_code)
    if not json_text:
        exit(1)
        
    print("Paso 5: Procesando y estructurando los canales...")
    channels_list = process_channels(json_text)
    if channels_list is None:
        exit(1)

    final_structure = structure_into_sections(channels_list)

    with open("canales.json", "w", encoding="utf-8") as f:
        json.dump(final_structure, f, indent=2, ensure_ascii=False)

    print("¡Éxito! El archivo canales.json ha sido actualizado.")

if __name__ == "__main__":
    main()
