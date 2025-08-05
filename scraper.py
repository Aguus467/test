#!/usr/bin/env python3
import re
import json
import argparse
import logging
from urllib.parse import urljoin

import cloudscraper

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(H:%M:%S) %(levelname)s %(message)s"
)
logger = logging.getLogger(__name__)

def make_scraper(retries=3, backoff=0.3):
    from requests.adapters import HTTPAdapter, Retry
    scraper = cloudscraper.create_scraper()
    retry = Retry(
        total=retries, backoff_factor=backoff,
        status_forcelist=[429, 500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    scraper.mount("https://", adapter)
    scraper.mount("http://", adapter)
    return scraper

def fetch_text(url, scraper=None, timeout=15):
    scraper = scraper or make_scraper()
    try:
        resp = scraper.get(url, headers={"User-Agent":"Mozilla/5.0"}, timeout=timeout)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        logger.error(f"Error fetching {url}: {e}")
        return None

def extract_json_literal(js_code):
    m = re.search(r'JSON\.parse\(\s*["\']([\s\S]*?)["\']\s*\)', js_code)
    if not m:
        raise ValueError("No hallé JSON.parse(…) en el JS")
    raw = m.group(1)
    # Desescapa
    literal = raw.replace(r'\"', '"').replace(r'\\', '\\')
    return literal

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
        description="Extrae canales de JSON.parse en un script.js"
    )
    parser.add_argument("script_url",
                        help="URL del script.js que contiene JSON.parse")
    parser.add_argument("-o", "--output",
                        help="Archivo destino (txt). Si no, imprime en consola.")
    args = parser.parse_args()

    js = fetch_text(args.script_url)
    if not js:
        logger.critical("No descargué el JS")
        return

    try:
        raw_json = extract_json_literal(js)
        data = json.loads(raw_json)
    except Exception as e:
        logger.critical(f"Error al parsear JSON: {e}")
        return

    lines = []
    for canal, cfg in data.items():
        urls = gather_urls(cfg, base_url=args.script_url)
        if not urls:
            logger.warning(f"'{canal}' sin URLs. Omitido.")
            continue
        lines.append(canal)
        lines.extend(urls)
        lines.append("")

    output = "\n".join(lines).strip() + "\n"
    if args.output:
        # Asegurar directorio
        from pathlib import Path
        p = Path(args.output)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(output, encoding="utf-8")
        logger.info(f"Guardado en {args.output}")
    else:
        print(output)

if __name__ == "__main__":
    main()
