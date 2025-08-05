import cloudscraper
import json
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import time

# URL de la página principal que contiene el iframe de la agenda
AGENDA_PAGE_URL = "https://alangulotv.space/agenda"

def make_scraper():
    """Crea una instancia del scraper de Cloudflare."""
    return cloudscraper.create_scraper(
        browser={'browser': 'chrome', 'platform': 'windows', 'mobile': False}
    )

def fetch_content(scraper, url, referer=None):
    """Descarga el contenido de una URL usando el scraper."""
    headers = {'User-Agent': 'Mozilla/5.0'}
    if referer:
        headers['Referer'] = referer
    try:
        resp = scraper.get(url, headers=headers, timeout=20)
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"[fetch_content] Error en {url}: {e}")
        return None

def extract_agenda_iframe_url(html, base_url):
    """Extrae la URL del iframe de la agenda del SCRIPT de la página."""
    soup = BeautifulSoup(html, 'html.parser')
    # Encuentra el tag <script> que contiene la lógica para crear el iframe
    script_tag = soup.find('script', string=re.compile(r"const iframeHTML"))
    if not script_tag:
        print("[extract_iframe] No se encontró el tag <script> que define 'iframeHTML'.")
        return None
    
    # Extrae la URL del iframe usando regex
    match = re.search(r"const iframeHTML = '<iframe src=\"([^\"]*)\"", script_tag.string)
    if not match:
        print("[extract_iframe] No se pudo extraer la URL del iframe desde el script.")
        return None
        
    iframe_path = match.group(1)
    # Reemplaza la variable de JS con un timestamp para evitar la caché
    iframe_path = re.sub(r"'\s*\+\s*cacheBuster\s*\+\s*'", f'?v={int(time.time())}', iframe_path)
    return urljoin(base_url, iframe_path)

def parse_agenda_html(html, base_url):
    """Parsea el HTML de la agenda y extrae los datos de cada evento."""
    soup = BeautifulSoup(html, 'html.parser')
    events = []
    match_containers = soup.select('div.match-container')
    if not match_containers:
        print("[parse_agenda] No se encontraron contenedores de partidos (div.match-container).")
        return events

    for match_div in match_containers:
        time_tag = match_div.select_one('span.time')
        team_spans = match_div.select('span.team-name')
        logo_imgs = match_div.select('img.team-logo')
        links_div = match_div.find_next_sibling('div', class_='links-container')
        link_tags = links_div.select('a[href]') if links_div else []

        if not (time_tag and len(team_spans) >= 2 and len(logo_imgs) >= 2 and link_tags):
            continue

        events.append({
            "hora": time_tag.get_text(strip=True),
            "equipoLocal": team_spans[0].get_text(strip=True),
            "logoLocal": urljoin(base_url, logo_imgs[0]['src']),
            "equipoVisitante": team_spans[1].get_text(strip=True),
            "logoVisitante": urljoin(base_url, logo_imgs[1]['src']),
            "urls": [urljoin(base_url, a['href']) for a in link_tags]
        })
    return events

def main():
    print("Iniciando scraping de la agenda...")
    scraper = make_scraper()

    print(f"P1: Descargando página principal: {AGENDA_PAGE_URL}")
    main_html = fetch_content(scraper, AGENDA_PAGE_URL)
    if not main_html: exit(1)

    print("P2: Extrayendo URL del iframe de la agenda...")
    iframe_url = extract_agenda_iframe_url(main_html, AGENDA_PAGE_URL)
    if not iframe_url: exit(1)

    print(f"P3: Descargando contenido de la agenda desde: {iframe_url}")
    agenda_html = fetch_content(scraper, iframe_url, referer=AGENDA_PAGE_URL)
    if not agenda_html: exit(1)

    print("P4: Parseando eventos...")
    events = parse_agenda_html(agenda_html, iframe_url)

    out_file = "eventos.json"
    print(f"P5: Guardando {len(events)} evento(s) en {out_file}")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)

    print("¡Listo! eventos.json actualizado.")

if __name__ == "__main__":
    main()
