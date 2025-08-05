import requests
import re
import json
from urllib.parse import urljoin

# URL de la página que contiene la agenda
AGENDA_PAGE_URL = "https://alangulotv.space/agenda"

def fetch_content(url):
    """Descarga el contenido de texto de una URL."""
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
        agenda_path = match.group(1)
        return urljoin(base_url, agenda_path)
    print("Error: No se pudo encontrar el iframe de la agenda.")
    return None

def parse_agenda_html(html):
    """Parsea el HTML de la agenda y extrae los eventos."""
    events = []
    # Usamos regex para encontrar cada bloque de partido
    matches = re.findall(r'<div class="row">[\s\S]*?<div class="cell" data-title="Hora">([\s\S]*?)</div>[\s\S]*?<div class="cell logos">[\s\S]*?<img src="([^"]*)">[\s\S]*?<span class="team-name">([^<]*)</span>[\s\S]*?<img src="([^"]*)">[\s\S]*?<span class="team-name">([^<]*)</span>[\s\S]*?<a href="([^"]*)"', html)

    for match in matches:
        hora = match[0].strip()
        logo_local = match[1].strip()
        equipo_local = match[2].strip()
        logo_visitante = match[3].strip()
        equipo_visitante = match[4].strip()
        url = match[5].strip()

        # Nos aseguramos de que la URL sea completa
        if not url.startswith('http'):
            url = urljoin(AGENDA_PAGE_URL, url)

        events.append({
            "hora": hora,
            "equipoLocal": equipo_local,
            "logoLocal": logo_local,
            "equipoVisitante": equipo_visitante,
            "logoVisitante": logo_visitante,
            "urls": [url]
        })
    return events

def main():
    """Función principal del script de la agenda."""
    print("Iniciando scraping de la agenda...")
    
    print("Paso 1: Descargando página principal de la agenda...")
    main_html = fetch_content(AGENDA_PAGE_URL)
    if not main_html:
        exit(1)

    print("Paso 2: Extrayendo URL del iframe de la agenda...")
    iframe_url = extract_agenda_iframe_url(main_html, AGENDA_PAGE_URL)
    if not iframe_url:
        exit(1)

    print(f"Paso 3: Descargando contenido de la agenda desde: {iframe_url}")
    agenda_html = fetch_content(iframe_url)
    if not agenda_html:
        exit(1)

    print("Paso 4: Parseando eventos del HTML...")
    events_list = parse_agenda_html(agenda_html)
    
    if not events_list:
        print("No se encontraron eventos o hubo un error al parsear.")
        # Creamos un archivo vacío para indicar que no hay eventos hoy
        with open("eventos.json", "w", encoding="utf-8") as f:
            json.dump([], f, indent=2, ensure_ascii=False)
        print("Archivo eventos.json creado vacío.")
        return

    # Guardar el resultado en el archivo eventos.json
    with open("eventos.json", "w", encoding="utf-8") as f:
        json.dump(events_list, f, indent=2, ensure_ascii=False)

    print(f"¡Éxito! Archivo eventos.json actualizado con {len(events_list)} eventos.")

if __name__ == "__main__":
    main()
