import requests
import re
import json

# Apuntamos directamente al script que contiene los datos
SCRIPT_URL = "https://gh.alangulotv.blog/script.js"

# (El diccionario IMAGE_URLS y las funciones auxiliares quedan igual)
IMAGE_URLS = {
    "ESPN": "https://p.alangulotv.blog/ESPN",
    "ESPN 2": "https://p.alangulotv.blog/ESPN2",
    # ... (etc.)
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
        data = json.loads(json_text)
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
    print("Iniciando scraping de canales...")
    js_code = fetch_content(SCRIPT_URL)
    if not js_code: exit(1)
    
    json_text = extract_channels_json_text(js_code)
    if not json_text: exit(1)
        
    channels_list = process_channels(json_text)
    if channels_list is None: exit(1)

    final_structure = structure_into_sections(channels_list)
    with open("canales.json", "w", encoding="utf-8") as f:
        json.dump(final_structure, f, indent=2, ensure_ascii=False)
    print("Éxito: canales.json actualizado.")

if __name__ == "__main__":
    main()
