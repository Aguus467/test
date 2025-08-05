import requests
import json
import re

# Descargar contenido desde la URL
url = "https://gh.alangulotv.blog/assets/script.js"
print(f"🔗 Descargando desde: {url}")
contenido = requests.get(url).text

# Mostrar primeros caracteres del contenido descargado (debug)
print("📦 Primeros 300 caracteres descargados:")
print(contenido[:300])

# Buscar array agendaEventos
match = re.search(r'agendaEventos\s*=\s*(\[.*?\]);', contenido, re.DOTALL)

if match:
    json_str = match.group(1)
    try:
        data = json.loads(json_str)
        with open("agenda.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("✅ agenda.json generado correctamente")
    except json.JSONDecodeError as e:
        print("❌ Error al parsear JSON:", e)
else:
    print("❌ No se encontró el array agendaEventos en el script.")