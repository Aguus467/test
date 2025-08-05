import requests
import json
import re

# URL del script original
url = "https://gh.alangulotv.blog/assets/script.js"
response = requests.get(url)
contenido = response.text

# Buscar el contenido de agendaEventos como array JSON
match = re.search(r'agendaEventos\s*=\s*(\[.*?\]);', contenido, re.DOTALL)

if match:
    json_str = match.group(1)

    # Convertir a objeto Python para validar y formatear
    try:
        data = json.loads(json_str)
        with open("agenda.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("✅ Extraído y guardado como agenda.json")
    except json.JSONDecodeError as e:
        print("❌ Error al parsear el JSON:", e)
else:
    print("❌ No se encontró agendaEventos en el archivo.")