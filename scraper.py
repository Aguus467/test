import requests
import re
import json

# URL de la página web que contiene el script con los canales
SOURCE_URL = "https://www.deportestvhd.com/2023/07/espn-en-vivo-online-por-internet.html" # Reemplazar si la fuente cambia

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

def fetch_html_content(url):
    """Descarga el contenido HTML de una URL."""
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching URL {url}: {e}")
        return None

def extract_channels_json_text(html):
    """Extrae el objeto JavaScript 'channels' del HTML usando regex."""
    # Regex para encontrar 'const channels = {...};'
    match = re.search(r'const\s+channels\s*=\s*(\{.*?\});', html, re.DOTALL)
    if match:
        return match.group(1)
    return None

def format_channel_name(key):
    """Convierte una clave como 'espn-premium-a' a un nombre legible como 'ESPN Premium'."""
    name = key.split('-')[0]
    if "tvp" in name: return "TV Pública"
    if "tyc" in name: return "TyC Sports"
    if "dtv" in name: return "DIRECTV Sports"
    return name.replace("fox", "Fox ").replace("espn", "ESPN ").replace("tnt", "TNT ").upper()

def process_channels(json_text):
    """Procesa el JSON extraído y lo convierte a la estructura de la app."""
    try:
        # Limpiamos el texto para que sea un JSON válido
        json_text = re.sub(r',\s*}', '}', json_text)
        json_text = re.sub(r',\s*]', ']', json_text)
        
        data = json.loads(json_text)
        
        processed_channels = {}
        for key, value in data.items():
            channel_name = format_channel_name(key)
            if channel_name not in processed_channels:
                processed_channels[channel_name] = {
                    "nombre": channel_name,
                    "imagenUrl": IMAGE_URLS.get(channel_name, f"https://p.alangulotv.blog/{channel_name.replace(' ', '').upper()}"),
                    "urls": []
                }
            
            # Agregamos todas las URLs de las opciones (repro1, repro2, etc.)
            for i in range(1, 5):
                repro_key = f"repro{i}"
                if repro_key in value and value[repro_key]:
                    processed_channels[channel_name]["urls"].append(value[repro_key])

        return list(processed_channels.values())
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return []

def structure_into_sections(channels_list):
    """Organiza la lista de canales en secciones."""
    deportes = [c for c in channels_list if any(keyword in c["nombre"] for keyword in ["ESPN", "Sports", "Fox", "DIRECTV"])]
    nacionales = [c for c in channels_list if any(keyword in c["nombre"] for keyword in ["Pública", "Telefe", "Trece"])]
    
    # El resto van a "Otros"
    otros_canales = [c for c in channels_list if c not in deportes and c not in nacionales]

    sections = [
        {"seccionTitulo": "Deportes", "canales": deportes},
        {"seccionTitulo": "Canales Nacionales", "canales": nacionales},
        {"seccionTitulo": "Otros", "canales": otros_canales}
    ]
    return sections

def main():
    """Función principal del script."""
    html = fetch_html_content(SOURCE_URL)
    if not html:
        return

    json_text = extract_channels_json_text(html)
    if not json_text:
        print("No se pudo encontrar el objeto 'channels' en el HTML.")
        return
        
    channels_list = process_channels(json_text)
    if not channels_list:
        print("No se pudieron procesar los canales.")
        return

    final_structure = structure_into_sections(channels_list)

    # Guardar el resultado en el archivo canales.json
    with open("canales.json", "w", encoding="utf-8") as f:
        json.dump(final_structure, f, indent=2, ensure_ascii=False)

    print("Archivo canales.json actualizado con éxito.")

if __name__ == "__main__":
    main()
