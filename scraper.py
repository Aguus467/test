#!/usr/bin/env python3
import re
import json
import argparse
import logging
from urllib.parse import urljoin
from collections import deque

import cloudscraper
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter, Retry

# --- Configuración de logging ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)

# --- Funciones de descarga con retry ---
def make_scraper(retries=3, backoff=0.3):
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
    scraper = scraper or make_scraper()
    try:
        resp = scraper.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=timeout)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        logger.error(f"Error al descargar {url!r}: {e}")
        return None

# --- Extracción del bloque JSON JavaScript ---
def extract_js_channels(html, base_url=None, pattern=None):
    """
    1) Busca <script src="..."> que coincida con pattern (si se da).
    2) Si no hay src, comprueba scripts inline buscando 'var channels'.
    3) Retorna el texto bruto de JS donde está 'var channels = { ... };'.
    """
    soup = BeautifulSoup(html, "html.parser")

    # 1) Scripts externos
    if pattern:
        tag = soup.find("script", src=re.compile(pattern))
        if tag and tag.get("src"):
            js_url = urljoin(base_url, tag["src"])
            logger.info(f"Encontrado script externo: {js_url}")
            return fetch_text(js_url)

    # 2) Scripts inline
    for tag in soup.find_all("script"):
        code = tag.string or ""
        if "var channels" in code:
            logger.info("Encontrado script inline con 'var channels'")
            return code

    raise RuntimeError("No se encontró el bloque 'var channels' en la página.")

# --- Parsing de objeto JS con múltiples URLs ---
def extract_json_literal(js_code):
    """
    Extrae desde la llave de inicio hasta la llave final
    contabilizando niveles anidados para capturar JSON completo.
    Luego elimina comentarios JS.
    """
    # Ubicar posición de "var channels"
    idx = js_code.find("var channels")
    if idx < 0:
        raise ValueError("No hallé 'var channels'")

    # Encontrar primera '{'
    start = js_code.find("{", idx)
    if start < 0:
        raise ValueError("No hallé '{' tras 'var channels'")

    # Usar pila para hallar cierre correspondiente
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
        raise ValueError("No hallé la llave de cierre del JSON")

    literal = js_code[start:end]

    # Eliminar comentarios de línea y bloque
    literal = re.sub(r"//.*", "", literal)
    literal = re.sub(r"/\*[\s\S]*?\*/", "", literal)
    return literal

# --- Descubrir todas las URLs válidas en cada canal ---
def gather_urls(channel_cfg, base_url=None):
    """
    Recorre todas las claves de channel_cfg,
    devuelve lista de URL absolutas (http/https).
    """
    urls = []
    for key, val in channel_cfg.items():
        if isinstance(val, str) and re.match(r"^https?://", val, re.IGNORECASE):
            urls.append(val)
        elif isinstance(val, str) and base_url:
            # válida para rutas relativas
            urls.append(urljoin(base_url, val))
    return urls

# --- Flujo principal ---
def main():
    parser = argparse.ArgumentParser(
        description="Scraper de canales con múltiples URLs"
    )
    parser.add_argument("page_url", help="URL de la página con el script")
    parser.add_argument(
        "-p", "--pattern", default=r"script\.js$",
        help="Regex para el src del JS (por defecto 'script.js')"
    )
    parser.add_argument(
        "-o", "--output",
        help="Archivo de salida (si se omite, imprime en pantalla)"
    )
    args = parser.parse_args()

    scraper = make_scraper()
    html = fetch_text(args.page_url, scraper)
    if not html:
        logger.critical("No pude descargar la página principal.")
        return

    try:
        js_code = extract_js_channels(html, base_url=args.page_url, pattern=args.pattern)
        raw_json = extract_json_literal(js_code)
        data = json.loads(raw_json)
    except Exception as e:
        logger.critical(f"Error al parsear JSON de canales: {e}")
        return

    lines = []
    for canal, cfg in data.items():
        urls = gather_urls(cfg, base_url=args.page_url)
        if not urls:
            logger.warning(f"'{canal}' no tiene URLs válidas, se omite.")
            continue

        lines.append(canal)
        lines.extend(urls)
        lines.append("")  # separación

    output = "\n".join(lines).strip() + "\n"
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output)
        logger.info(f"Guardado resultado en {args.output}")
    else:
        print(output)

if __name__ == "__main__":
    main()
