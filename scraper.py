#!/usr/bin/env python3
import re
import json
import argparse
import logging
from pathlib import Path
from urllib.parse import urljoin

import cloudscraper

# --- Logging ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger(__name__)

def make_scraper(retries=3, backoff=0.3):
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
    scraper = scraper or make_scraper()
    try:
        resp = scraper.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=timeout)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        logger.error(f"Error descargando {url!r}: {e}")
        return None

def extract_json_literal(js_code):
    """
    Intenta extraer el JSON de canales buscando:
      1) window.channelsList = { … };
      2) JSON.parse("…");
      3) (opcional) eval(...) u otros patrones.
    """
    # 1) Asignación directa
    m = re.search(r'window\.channelsList\s*=\s*({[\s\S]*?})\s*;', js_code)
    if m:
        literal = m.group(1)
        literal = re.sub(r"//.*", "", literal)
        literal = re.sub(r"/\*[\s\S]*?\*/", "", literal)
        return literal

    # 2) JSON.parse("…")
    m = re.search(r'JSON\.parse\(\s*["\']([\s\S]*?)["\']\s*\)', js_code)
    if m:
        raw = m.group(1)
        literal = raw.replace(r'\"', '"').replace(r'\\', '\\')
        return literal

    raise ValueError("No hallé ningún JSON de canales en el JS")

def gather_urls(cfg, base_url=None):
    urls = []
    for key, val in cfg.items():
        if isinstance(val, str) and val.lower().startswith("http"):
            urls.append(val)
        elif isinstance(val, str) and base_url:
            urls.append(urljoin(base_url, val))
    return urls

def main():
    parser = argparse.ArgumentParser(
        description="Extrae lista de canales desde un script.js"
    )
    parser.add_argument("script_url", help="URL del script.js que contiene los canales")
    parser.add_argument("-o", "--output", help="Ruta de salida (txt). Si no, imprime por consola")
    args = parser.parse_args()

    js = fetch_text(args.script_url)
    if not js:
        logger.critical("No se pudo descargar el JS")
        return

    try:
        raw_json = extract_json_literal(js)
        data = json.loads(raw_json)
    except Exception as e:
        logger.critical(f"Error al parsear JSON: {e}")
        return

    # Generar líneas de salida
    lines = []
    for canal, cfg in data.items():
        urls = gather_urls(cfg, base_url=args.script_url)
        if not urls:
            logger.warning(f"'{canal}' no tiene URLs válidas, se omite")
            continue
        lines.append(canal)
        lines.extend(urls)
        lines.append("")  # separador

    output = "\n".join(lines).strip() + "\n"

    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(output, encoding="utf-8")
        logger.info(f"Guardado resultado en {args.output}")
    else:
        print(output)

if __name__ == "__main__":
    main()
