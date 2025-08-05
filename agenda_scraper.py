import requests
import cloudscraper
import json
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

AGENDA_PAGE_URL = "https://alangulotv.space/agenda"

# ---- HTTP CLIENT CON FALLOBACK A CLOUDSCRAPER ----

def make_session():
    session = requests.Session()
    session.headers.update({
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/116.0 Safari/537.36'
        ),
        'Accept-Language': 'es-ES,es;q=0.9',
        'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Connection': 'keep-alive'
    })
    return session

def fetch_content(url, referer=None, use_cloudscraper=False):
    if use_cloudscraper:
        scraper = cloudscraper.create_scraper(
            browser={'browser': 'chrome', 'platform': 'windows', 'mobile': False}
        )
        try:
            r = scraper.get(url, timeout=15)
            r.raise_for_status()
            return r.text
        except Exception as e:
            print(f"cloudscraper falló para {url}: {e}")
            return None

    session = make_session()
    if referer:
        session.headers['Referer'] = referer

    try:
        r = session.get(url, timeout=15)
        r.raise_for_status()
        return r.text
    except requests.HTTPError as he:
        if r.status_code == 403 and not use_cloudscraper:
            print("403 recibido. Reintentando con cloudscraper…")
            return fetch_content(url, referer=referer, use_cloudscraper=True)
        print(f"Error fetching {url}: {he}")
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
    return None

# ---- EXTRACCIÓN DE IFRAME CON BS4 ----

def extract_agenda_iframe_url(html, base_url):
    soup = BeautifulSoup(html, 'html.parser')
    iframe = soup.find('iframe', src=lambda u: u and 'agenda' in u)
    if not iframe:
        print("Error: no se encontró iframe con 'agenda' en src.")
        return None

    src = iframe['src']
    return urljoin(base_url, src)

# ---- PARSEO DE EVENTOS CON BS4 ----

def parse_agenda_html(html, base_url):
    soup = BeautifulSoup(html, 'html.parser')
    events = []

    for match_div in soup.select('div.match-container'):
        # Extraer hora
        time_tag = match_div.select_one('span.time')
        # Extraer equipos y logos
        teams = match_div.select('span.team-name')
        logos = match_div.select('img.team-logo')
        # Buscar el contenedor de enlaces justo después
        links_div = match_div.find_next_sibling('div', class_='links-container')
        link_tags = links_div.select('a[href]') if links_div else []

        if not(time_tag and len(teams)>=2 and len(logos)>=2 and link_tags):
            continue

        eventos = {
            "hora": time_tag.get_text(strip=True),
            "equipoLocal": teams[0].get_text(strip=True),
            "logoLocal": urljoin(base_url, logos[0]['src']),
            "equipoVisitante": teams[1].get_text(strip=True),
            "logoVisitante": urljoin(base_url, logos[1]['src']),
            "urls": [urljoin(base_url, a['href']) for a in link_tags]
        }
        events.append(eventos)

    return events

# ---- FLUJO PRINCIPAL ----

def main():
    print("Iniciando scraping de la agenda…")

    print(f"Paso 1: Descargando página principal desde {AGENDA_PAGE_URL}")
    main_html = fetch_content(AGENDA_PAGE_URL)
    if not main_html:
        exit(1)

    print("Paso 2: Extrayendo URL del iframe de la agenda…")
    iframe_url = extract_agenda_iframe_url(main_html, AGENDA_PAGE_URL)
    if not iframe_url:
        exit(1)

    print(f"Paso 3: Descargando contenido de la agenda desde {iframe_url}")
    agenda_html = fetch_content(iframe_url, referer=AGENDA_PAGE_URL)
    if not agenda_html:
        exit(1)

    print("Paso 4: Parseando eventos del HTML…")
    events_list = parse_agenda_html(agenda_html, iframe_url)

    output_file = "eventos.json"
    print(f"Paso 5: Guardando {len(events_list)} eventos en {output_file}")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(events_list, f, indent=2, ensure_ascii=False)

    print("¡Éxito! eventos.json actualizado.")

if __name__ == "__main__":
    main()
