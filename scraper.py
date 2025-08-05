#!/usr/bin/env python3
import re
import json
import argparse
import logging
from urllib.parse import urljoin

import cloudscraper

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)

def make_scraper(retries=3, backoff=0.3):
    """Crea cloudscraper con reintentos para códigos 429, 5xx."""
    from requests.adapters import HTTPAdapter, Retry
    scraper = cloudscraper.create_scraper()
    retry = Retry(
        total=retries,
        backoff_factor=backoff,
        status_forcelist=[429, 500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    scraper.mount("https://", adapter)
    scraper.mount("http://", adapter)
    return scraper

def fetch_text(url, scraper=None, timeout=15):
    """Descarga texto y gestiona errores."""
    scraper = scraper or make_scraper()
    try:
        resp = scraper.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=timeout)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        logger.error(f"Error fetching {url}: {e}")
        return None

def extract_json_literal(js_code):
    """
    Extrae el bloque que inicia en la primera llave tras 'var channels'
    usando un contador de profundidad para cerrar correctamente.
    Luego limpia comentarios de línea y bloque.
    """
    idx = js_code.find("var channels")
    if idx < 0:
        raise ValueError("No se halló 'var channels' en el JS")

    start = js_code.find("{", idx)
    if start < 0:
        raise ValueError("No se halló '{' después de 'var channels'")

    depth = 0
    for pos in range(start, len(js_code)):
        if js_code[pos] == "{":
            depth += 1
        elif js_code[pos] == "}":
            depth -= 1
            if depth == 0:
                end = pos + 1
                break
    else:
        raise ValueError("No se encontró la llave de cierre del JSON")

    literal = js_code[start:end]
    # Eliminar //… y /*…*/  
    literal = re.sub(r"//.*", "", literal)
    literal = re.sub(r"/\*[\s\S]*?\*/", "", literal)
    return literal

def gather_urls(channel_cfg, base_url=None):
    """Recoge todas las cadenas con prefijo http/https o las convierte si son relativas."""
    urls = []
    for key, val in channel_cfg.items():
        if isinstance(val, str) and re.match(r"^https?://", val, re.I):
            urls.append(val)
        elif isinstance(val, str) and base_url:
            urls.append(urljoin(base_url, val))
    return urls

def main():
    parser = argparse.ArgumentParser(
        description="Extrae canales de un script.js que contiene `var channels`"
    )
    parser.add_argument(
        "script_url",
        help="URL directa al archivo script.js (p.ej. https://gh.alangulotv.blog/assets/script.js)"
    )
    parser.add_argument(
        "-o", "--output",
        help="Ruta de salida (archivo .txt). Si se omite, se imprime por consola."
    )
    args = parser.parse_args()

    scraper = make_scraper()
    js_code = fetch_text(args.script_url, scraper)
    if not js_code:
        logger.critical("No se pudo descargar el script.js")
        return

    try:
        raw_json = extract_json_literal(js_code)
        data = json.loads(raw_json)
    except Exception as e:
        logger.critical(f"Error al parsear JSON: {e}")
        return

    lines = []
    for canal, cfg in data.items():
        urls = gather_urls(cfg, base_url=args.script_url)
        if not urls:
            logger.warning(f"Canal '{canal}' sin URLs válidas, se omite.")
            continue

        lines.append(canal)
        lines.extend(urls)
        lines.append("")  # separador

    output = "\n".join(lines).strip() + "\n"
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output)
        logger.info(f"Resultado guardado en {args.output}")
    else:
        print(output)

if __name__ == "__main__":
    main()
