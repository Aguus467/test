import requests
import re
import json
from urllib.parse import urljoin

SCRIPT_URL = "https://gh.alangulotv.blog/assets/script.js"

IMAGE_URLS = {
    "ESPN": "https://p.alangulotv.blog/ESPN",
    "ESPN 2": "https://p.alangulotv.blog/ESPN2",
    # … resto de mapeos …
}

def fetch_content(url):
    try:
        r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
        r.raise_for_status()
        return r.text
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None

def extract_channels_json_text(js_code):
    m = re.search(r'const\s+channels\s*=\s*(\{[\s\S]*?\});', js_code)
    if not m:
        print("No se encontró 'const channels' en el JS.")
        return None
    return m.group(1)

def format_channel_name(key):
    base = re.sub(r'-[a-z0-9]+$', '', key)
    return base.replace('-', ' ').title()

def process_channels(json_text):
    try:
        # 1) Eliminar comentarios //… pero no los de las URLs (://)
        text = re.sub(
            r'(?m)(?<!:)//.*$',
            '',
            json_text
        )
        # 2) Eliminar posibles comentarios /* … */
        text = re.sub(r'/\*[\s\S]*?\*/', '', text)
        # 3) Quitar comas finales antes de '}' o ']'
        text = re.sub(r',\s*([}\]])', r'\1', text)

        # Ahora parseamos JSON limpio
        data = json.loads(text)
        out = {}
        for key, value in data.items():
            if not isinstance(value, dict):
                continue
            # recogemos solo las claves repro1, repro2…
            urls = [v for k, v in value.items() if k.startswith('repro') and v]
            if not urls:
                continue

            name = format_channel_name(key)
            if name not in out:
                fallback = name.replace(' ', '').upper()
                img = IMAGE_URLS.get(name, f"https://p.alangulotv.blog/{fallback}")
                out[name] = {"nombre": name, "imagenUrl": img, "urls": []}

            out[name]["urls"].extend(urls)

        return list(out.values())

    except json.JSONDecodeError as e:
        print(f"Error al decodificar JSON: {e}")
        return None

def structure_into_sections(channels):
    deportes = [c for c in channels if any(k in c["nombre"].upper() for k in ["ESPN","TNT","TYC","FOX","DAZN"])]
    nacionales = [c for c in channels if any(k in c["nombre"].upper() for k in ["PÚBLICA","TELEFE","TRECE"])]
    otros = [c for c in channels if c not in deportes and c not in nacionales]
    return [
        {"seccionTitulo": "Deportes", "canales": deportes},
        {"seccionTitulo": "Canales Nacionales", "canales": nacionales},
        {"seccionTitulo": "Otros", "canales": otros}
    ]

def main():
    js = fetch_content(SCRIPT_URL)
    if not js: exit(1)

    raw = extract_channels_json_text(js)
    if not raw: exit(1)

    channels = process_channels(raw)
    if channels is None: exit(1)

    final = structure_into_sections(channels)
    with open("canales.json", "w", encoding="utf-8") as f:
        json.dump(final, f, indent=2, ensure_ascii=False)

    print("¡canales.json actualizado con éxito!")

if __name__ == "__main__":
    main()
