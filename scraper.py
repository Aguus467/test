import requests
import re
import json
from urllib.parse import urljoin

# APUNTAMOS DIRECTAMENTE AL SCRIPT QUE CONTIENE LOS DATOS PARA EVITAR EL BLOQUEO
SCRIPT_URL = "https://gh.alangulotv.blog/assets/script.js"

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
}

def fetch_content(url):
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching URL {url}: {e}")
        return None

def extract_channels_json_text(js_code):
    match = re.search(r'const\s+channels\s*=\s*(\{[\s\S]*?\});', js_code)
    if match:
        return match.group(1)
    print("Error: No se pudo encontrar 'const channels' en el script.")
    return None

def format_channel_name(key):
    base_name = re.sub(r'-[a-z0-9]+$', '', key)
    return base_name.replace("-", " ").title()

def process_channels(json_text):
    try:
        # ✅ FUNCIÓN DE LIMPIEZA MÁS ROBUSTA
        # 1. Eliminar comentarios de una sola línea
        cleaned_text = re.sub(r'//.*', '', json_text)
        # 2. Eliminar comentarios de múltiples líneas (por si acaso)
        cleaned_text = re.sub(r'/\*[\s\S]*?\*/', '', cleaned_text)
        # 3. Eliminar caracteres de control inválidos (la causa del error)
        cleaned_text = ''.join(c for c in cleaned_text if c.isprintable() or c in '\n\r\t')
        # 4. Eliminar comas finales antes de '}' o ']'
        cleaned_text = re.sub(r',\s*([}\]])', r'\1', cleaned_text)
        
        data = json.loads(cleaned_text)
        processed = {}
        for key, value in data.items():
            if not isinstance(value, dict) or not any(k.startswith('repro') for k in value):
                continue
            name = format_channel_name(key)
            if name not in processed:
                processed[name] = {
                    "nombre": name,
                    "imagenUrl": IMAGE_URLS.get(name, f"https://p.alangulotv.blog/{name.replace(' ', '').upper()}"),
                    "urls": []
                }
            urls = [v for k, v in value.items() if k.startswith('repro') and v]
            processed[name]["urls"].extend(urls)
        return list(processed.values())
    except json.JSONDecodeError as e:
        print(f"Error al decodificar JSON: {e}")
        print(f"Texto JSON problemático (primeros 500 caracteres): {json_text[:500]}")
        return None

def structure_into_sections(channels_list):
    deportes = [c for c in channels_list if any(kw in c["nombre"] for kw in ["Espn", "Tnt", "Tyc", "Fox", "Directv"])]
    nacionales = [c for c in channels_list if any(kw in c["nombre"] for kw in ["Publica", "Telefe", "Trece"])]
    otros = [c for c in channels_list if c not in deportes and c not in nacionales]
    return [
        {"seccionTitulo": "Deportes", "canales": deportes},
        {"seccionTitulo": "Canales Nacionales", "canales": nacionales},
        {"seccionTitulo": "Otros", "canales": otros}
    ]

def main():
    print(f"Paso 1: Descargando contenido del script desde: {SCRIPT_URL}")
    js_code = fetch_content(SCRIPT_URL)
    if not js_code: exit(1)
    
    print("Paso 2: Extrayendo el objeto de canales del JavaScript...")
    json_text = extract_channels_json_text(js_code)
    if not json_text: exit(1)
        
    print("Paso 3: Procesando y estructurando los canales...")
    channels_list = process_channels(json_text)
    if channels_list is None: exit(1)

    final_structure = structure_into_sections(channels_list)
    with open("canales.json", "w", encoding="utf-8") as f:
        json.dump(final_structure, f, indent=2, ensure_ascii=False)
    print("Éxito: canales.json actualizado.")

if __name__ == "__main__":
    main()
