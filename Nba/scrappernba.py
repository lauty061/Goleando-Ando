import requests
from bs4 import BeautifulSoup
import json
import os

def fix_encoding(text):
    try:
        return text.encode("latin1").decode("utf-8")
    except Exception:
        return text

def obtener_fixture_y_tabla(url_fixture, url_tabla, nombre_liga):
    headers = {"User-Agent": "Mozilla/5.0"}

    # Fixture
    response = requests.get(url_fixture, headers=headers)
    if response.status_code != 200:
        print(f"❌ Error al obtener la página {url_fixture}")
        return None
    soup = BeautifulSoup(response.text, 'html.parser')
    partidos = []
    jornada_actual = None

    for elemento in soup.find_all(["h2", "div"], class_=["titulo", "partido"]):
        if elemento.name == "h2" and "Jornada" in elemento.text:
            jornada_actual = elemento.text.strip()
        elif elemento.name == "div" and "partido" in elemento.get("class", []):
            try:
                nombres = elemento.find_all("span", class_="partido-name")
                goles = elemento.find_all("span", class_="partido-goles")
                escudos = elemento.find_all("div", class_="partido-escudo")

                equipo_local = fix_encoding(nombres[0].text.strip())
                equipo_visita = fix_encoding(nombres[1].text.strip())
                goles_local = goles[0].text.strip() if goles else ""
                goles_visita = goles[1].text.strip() if goles else ""
                escudo_local = escudos[0].find("img")["data-src"]
                escudo_visita = escudos[1].find("img")["data-src"]
                fecha_partido = elemento.find("span", class_="date").text.strip()

                partidos.append({
                    "fecha_torneo": jornada_actual,
                    "fecha": fecha_partido,
                    "local": equipo_local,
                    "goles_local": goles_local,
                    "escudo_local": escudo_local,
                    "visitante": equipo_visita,
                    "goles_visita": goles_visita,
                    "escudo_visita": escudo_visita
                })
            except Exception:
                print("⚠️ Error procesando un partido, se omitirá.")

    # Tabla de posiciones: Este y Oeste
    response = requests.get(url_tabla, headers=headers)
    if response.status_code != 200:
        print(f"❌ Error al obtener la página {url_tabla}")
        return None
    soup = BeautifulSoup(response.text, 'html.parser')

    tabla_posiciones = {}
    secciones = soup.find_all("div", class_="statsWrapPositions")
    for seccion in secciones:
        titulo = seccion.find("h2")
        conferencia = "General"
        if titulo and "Conferencia" in titulo.text:
            conferencia = titulo.text.strip().split()[-1]  # Este / Oeste

        tabla = seccion.find("table", id="posiciones")
        if not tabla:
            continue

        posiciones = []
        filas = tabla.find("tbody").find_all("tr")
        for fila in filas:
            columnas = fila.find_all("td")
            if len(columnas) < 9:
                continue
            img_tag = columnas[1].find("img")
            equipo_escudo = img_tag.get("data-src") if img_tag and img_tag.get("data-src") else img_tag.get("src", "")
            if not equipo_escudo:
                equipo_escudo = "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg"
            try:
                pf = int(columnas[7].text.strip())
                pc = int(columnas[8].text.strip())
                dg = pf - pc
            except ValueError:
                pf, pc, dg = 0, 0, 0
            equipo_nombre = fix_encoding(columnas[2].text.strip())
            posiciones.append({
                "posicion": columnas[0].text.strip(),
                "escudo": equipo_escudo,
                "equipo": equipo_nombre,
                "porcentaje_pg": columnas[3].text.strip(),
                "puntos": columnas[4].text.strip(),
                "pj": columnas[5].text.strip(),
                "pp": columnas[6].text.strip(),
                "pf": pf,
                "pc": pc,
                "dg": dg
            })

        tabla_posiciones[conferencia] = posiciones

    return {
        "fixture": partidos,
        "tabla_posiciones": tabla_posiciones
    }

ligas = {
    "NBA": {
        "fixture": "https://www.tycsports.com/estadisticas/estados-unidos/nba/fixture.html",
        "tabla": "https://www.tycsports.com/estadisticas/estados-unidos/nba/tabla-de-posiciones.html",
    },
}

carpeta_destino = r"C:\\Users\\Usuario\\Desktop\\nueva carpeta(7)\\Pagina Futbol\\NBA"
os.makedirs(carpeta_destino, exist_ok=True)
ruta_archivo = os.path.join(carpeta_destino, "resultadosnba.json")

# Cargar datos existentes si existen
if os.path.exists(ruta_archivo):
    with open(ruta_archivo, "r", encoding="utf-8") as f:
        datos = json.load(f)
else:
    datos = {}

# Scraping y merge
for liga, urls in ligas.items():
    print(f"📌 Obteniendo datos de {liga}...")
    nuevos_datos = obtener_fixture_y_tabla(urls["fixture"], urls["tabla"], liga)
    if not nuevos_datos:
        continue

    prev_fixture = datos.get(liga, {}).get("fixture", [])
    nuevo_fixture = nuevos_datos.get("fixture", [])

    fixture_dict = {f"{p['fecha']}|{p['local']}|{p['visitante']}": p for p in prev_fixture}

    for partido in nuevo_fixture:
        key = f"{partido['fecha']}|{partido['local']}|{partido['visitante']}"
        if key in fixture_dict:
            old = fixture_dict[key]
            if (partido['goles_local'], partido['goles_visita']) != (old['goles_local'], old['goles_visita']):
                fixture_dict[key] = partido  # actualizar goles
        else:
            fixture_dict[key] = partido  # nuevo partido

    datos[liga] = {
        "fixture": list(fixture_dict.values()),
        "tabla_posiciones": nuevos_datos.get("tabla_posiciones", {})
    }

# Guardar actualizado
with open(ruta_archivo, "w", encoding="utf-8") as f:
    json.dump(datos, f, ensure_ascii=False, indent=4)

print(f"✅ Scraping completado. Datos guardados en '{ruta_archivo}'.")
