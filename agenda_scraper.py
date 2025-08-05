import cloudscraper
import json
from urllib.parse import urljoin
from bs4 import BeautifulSoup

AGENDA_PAGE_URL = "https://alangulotv.blog/agenda-2/"

def make_scraper():
    return cloudscraper.create_scraper(
        browser={'browser': 'chrome', 'platform': 'windows', 'mobile': False}
    )

def fetch_content(scraper, url, referer=None):
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/116.0 Safari/537.36'
        )
    }
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
    soup = BeautifulSoup(html, 'html.parser')
    iframe = soup.find('iframe', src=lambda s: s and 'agenda' in s)
    if not iframe:
        print("[extract_iframe] No se encontró iframe con 'agenda' en src.")
        return None
    return urljoin(base_url, iframe['src'])

def parse_agenda_html(html, base_url):
    soup = BeautifulSoup(html, 'html.parser')
    events = []

    matches = soup.select('div.match-container')
    if not matches:
        print("[parse_agenda] No hay div.match-container en el HTML.")
        return events

    for match_div in matches:
        time_tag   = match_div.select_one('span.time')
        team_spans = match_div.select('span.team-name')
        logo_imgs  = match_div.select('img.team-logo')
        # asumimos que el contenedor de links está justo después
        links_div  = match_div.find_next_sibling('div', class_='links-container')
        link_tags  = links_div.select('a[href]') if links_div else []

        if not (time_tag and len(team_spans) >= 2 and len(logo_imgs) >= 2 and link_tags):
            print(f"[parse_agenda] Saltando bloque incompleto: {match_div[:50]}…")
            continue

        events.append({
            "hora":           time_tag.get_text(strip=True),
            "equipoLocal":    team_spans[0].get_text(strip=True),
            "logoLocal":      urljoin(base_url, logo_imgs[0]['src']),
            "equipoVisitante":team_spans[1].get_text(strip=True),
            "logoVisitante":  urljoin(base_url, logo_imgs[1]['src']),
            "urls":           [urljoin(base_url, a['href']) for a in link_tags]
        })

    return events

def main():
    print("Iniciando scraping de la agenda…")
    scraper = make_scraper()

    print(f"P1: Descargando página principal: {AGENDA_PAGE_URL}")
    main_html = fetch_content(scraper, AGENDA_PAGE_URL)
    if not main_html:
        exit(1)

    print("P2: Extrayendo URL del iframe…")
    iframe_url = extract_agenda_iframe_url(main_html, AGENDA_PAGE_URL)
    if not iframe_url:
        exit(1)

    print(f"P3: Descargando contenido de la agenda: {iframe_url}")
    agenda_html = fetch_content(scraper, iframe_url, referer=AGENDA_PAGE_URL)
    if not agenda_html:
        exit(1)

    print("P4: Parseando eventos…")
    events = parse_agenda_html(agenda_html, iframe_url)

    out_file = "eventos.json"
    print(f"P5: Guardando {len(events)} evento(s) en {out_file}")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)

    print("¡Listo! eventos.json actualizado.")

if __name__ == "__main__":
    main()
