# /scraper.py
import requests
from bs4 import BeautifulSoup
import json
import os

def fix_encoding(text):
    try:
        return text.encode("latin1").decode("utf-8")
    except Exception:
        return text

def obtener_fixture_y_tabla(url_fixture, url_tabla, url_goleadores, nombre_liga):
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
        elif elemento.name == "div" and "partido" in elemento["class"]:
            try:
                equipo_local = fix_encoding(elemento.find_all("span", class_="partido-name")[0].text.strip())
                equipo_visita = fix_encoding(elemento.find_all("span", class_="partido-name")[1].text.strip())
                goles_local = elemento.find_all("span", class_="partido-goles")[0].text.strip()
                goles_visita = elemento.find_all("span", class_="partido-goles")[1].text.strip()
                escudo_local = elemento.find_all("div", class_="partido-escudo")[0].find("img")["data-src"]
                escudo_visita = elemento.find_all("div", class_="partido-escudo")[1].find("img")["data-src"]
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
            except AttributeError:
                print("⚠️ Error procesando un partido, se omitirá.")

    # Tabla de posiciones
    response = requests.get(url_tabla, headers=headers)
    if response.status_code != 200:
        print(f"❌ Error al obtener la página {url_tabla}")
        return None
    soup = BeautifulSoup(response.text, 'html.parser')
    tabla_posiciones = []
    tabla = soup.find("table", id="posiciones")
    if not tabla:
        print("❌ No se encontró la tabla de posiciones")
        return None
    filas = tabla.find("tbody").find_all("tr")
    for fila in filas:
        columnas = fila.find_all("td")
        if len(columnas) < 10:
            continue
        img_tag = columnas[1].find("img")
        equipo_escudo = img_tag.get("data-src") if img_tag and img_tag.get("data-src") else img_tag.get("src", "")
        if not equipo_escudo:
            equipo_escudo = "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg"
        try:
            gf = int(columnas[8].text.strip())
            gc = int(columnas[9].text.strip())
            dg = gf - gc
        except ValueError:
            gf, gc, dg = 0, 0, 0
        equipo_nombre = fix_encoding(columnas[2].text.strip())
        tabla_posiciones.append({
            "posicion": columnas[0].text.strip(),
            "escudo": equipo_escudo,
            "equipo": equipo_nombre,
            "puntos": columnas[3].text.strip(),
            "pj": columnas[4].text.strip(),
            "pg": columnas[5].text.strip(),
            "pe": columnas[6].text.strip(),
            "pp": columnas[7].text.strip(),
            "gf": gf,
            "gc": gc,
            "dg": dg
        })

    # Goleadores
    response = requests.get(url_goleadores, headers=headers)
    goleadores = []
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        tabla = soup.find("table", class_="stats-table")
        if tabla:
            filas = tabla.find("tbody").find_all("tr")
            for fila in filas:
                columnas = fila.find_all("td")
                if len(columnas) < 3:
                    continue
                try:
                    nombre = fix_encoding(columnas[0].text.strip())
                    img_tag = columnas[1].find("img")
                    escudo = img_tag.get("data-src") or img_tag.get("src", "")
                    equipo = fix_encoding(img_tag.get("alt", ""))
                    goles = int(columnas[2].text.strip())
                    goleadores.append({
                        "nombre": nombre,
                        "equipo": equipo,
                        "escudo": escudo,
                        "goles": goles
                    })
                except Exception:
                    continue

    return {
        "fixture": partidos,
        "tabla_posiciones": tabla_posiciones,
        "goleadores": goleadores
    }

ligas = {
    "La Liga": {
        "fixture": "https://www.tycsports.com/estadisticas/la-liga-espana/fixture.html",
        "tabla": "https://www.tycsports.com/estadisticas/la-liga-espana/tabla-de-posiciones.html",
        "goleadores": "https://www.tycsports.com/estadisticas/la-liga-espana/tabla-de-goleadores.html"
    },
}

datos = {}
for liga, urls in ligas.items():
    print(f"📌 Obteniendo datos de {liga}...")
    datos[liga] = obtener_fixture_y_tabla(urls["fixture"], urls["tabla"], urls["goleadores"], liga)

carpeta_destino = r"C:\\Users\\Usuario\\Desktop\\nueva carpeta(7)\\Pagina Futbol\\La Liga"
os.makedirs(carpeta_destino, exist_ok=True)
ruta_archivo = os.path.join(carpeta_destino, "resultadosesp.json")
with open(ruta_archivo, "w", encoding="utf-8") as f:
    json.dump(datos, f, ensure_ascii=False, indent=4)
print(f"✅ Scraping completado. Datos guardados en '{ruta_archivo}'.")
