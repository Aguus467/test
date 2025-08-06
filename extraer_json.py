import requests
import re
import json

url = "https://gh.alangulotv.blog/assets/script.js"  # Cambiar si es otra URL
response = requests.get(url)
contenido = response.text

# Buscar channels = { ... };
match = re.search(r'channels\s*=\s*(\{.*?\})\s*;', contenido, re.DOTALL)

if match:
    canales_raw = match.group(1)

    try:
        # Usamos 'eval' con seguridad limitada (aunque lo ideal sería parsear más fuerte)
        canales_json = json.loads(canales_raw)
        with open("agenda.json", "w", encoding="utf-8") as f:
            json.dump(canales_json, f, ensure_ascii=False, indent=2)
        print("✅ Archivo agenda.json generado con éxito.")
    except Exception as e:
        print("❌ Error al convertir a JSON:", e)
else:
    print("❌ No se encontró el objeto channels en el JS.")