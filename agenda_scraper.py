import requests
import re
import json
from urllib.parse import urljoin

# URL de la página que contiene la agenda
AGENDA_PAGE_URL = "https://alangulotv.blog/agenda-2/"

def fetch_content(url):
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching URL {url}: {e}")
        return None

def extract_agenda_iframe_url(html, base_url):
    """Encuentra la URL del iframe de la agenda en el HTML."""
    match = re.search(r'<iframe src="(/agenda\?[^"]*)"', html)
    if match:
        return urljoin(base_url, match.group(1))
    print("Error: No se pudo encontrar el iframe de la agenda.")
    return None

def parse_agenda_html(html):
    """Parsea el HTML de la agenda y extrae los eventos."""
    events = []
    # Regex para encontrar cada bloque de partido
    matches = re.findall(r'<div class="match-container">([\s\S]*?)</div>[\s\S]*?<div class="links-container">([\s\S]*?)</div>', html)

    for match_html, links_html in matches:
        # Extraer datos del partido
        time_match = re.search(r'<span class="time">([^<]*)</span>', match_html)
        teams = re.findall(r'<span class="team-name">([^<]*)</span>', match_html)
        logos = re.findall(r'<img decoding="async" src="([^"]*)" class="team-logo">', match_html)
        
        # Extraer links de transmisión
        links = re.findall(r'<a href="([^"]*)"', links_html)

        if time_match and len(teams) == 2 and len(logos) == 2 and links:
            events.append({
                "hora": time_match.group(1).strip(),
                "equipoLocal": teams[0].strip(),
                "logoLocal": logos[0].strip(),
                "equipoVisitante": teams[1].strip(),
                "logoVisitante": logos[1].strip(),
                "urls": [urljoin(AGENDA_PAGE_URL, link) for link in links]
            })
    return events

def main():
    print("Iniciando scraping de la agenda...")
    main_html = fetch_content(AGENDA_PAGE_URL)
    if not main_html: exit(1)

    iframe_url = extract_agenda_iframe_url(main_html, AGENDA_PAGE_URL)
    if not iframe_url: exit(1)

    print(f"Descargando contenido de la agenda desde: {iframe_url}")
    agenda_html = fetch_content(iframe_url)
    if not agenda_html: exit(1)

    events_list = parse_agenda_html(agenda_html)
    
    if not events_list:
        print("No se encontraron eventos. Creando archivo vacío.")
        with open("eventos.json", "w", encoding="utf-8") as f:
            json.dump([], f)
    else:
        with open("eventos.json", "w", encoding="utf-8") as f:
            json.dump(events_list, f, indent=2, ensure_ascii=False)
        print(f"Éxito: eventos.json actualizado con {len(events_list)} eventos.")

if __name__ == "__main__":
    main()
