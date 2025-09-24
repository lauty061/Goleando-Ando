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
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}

    response = requests.get(url_fixture, headers=headers)
    if response.status_code != 200:
        print(f"❌ Error al obtener la página {url_fixture}")
        return None
    
    soup = BeautifulSoup(response.text, 'html.parser')
    partidos = []
    jornada_actual = None

    for elemento in soup.find_all(["div", "div"], class_=["topnav-fixture", "partido"]):
        if "topnav-fixture" in elemento.get("class", []):
            jornada_actual = elemento.get_text(strip=True).replace('>', '').replace('<', '')
        elif "partido" in elemento.get("class", []):
            try:
                nombres = elemento.find_all("span", class_="partido-name")
                goles = elemento.find_all("span", class_="partido-goles")
                escudos = elemento.find_all("div", class_="partido-escudo")
                
                fecha_partido = elemento.find("span", class_="date").get_text(separator=' ', strip=True)

                if len(nombres) < 2 or len(goles) < 2 or len(escudos) < 2:
                    continue

                equipo_local = fix_encoding(nombres[0].text.strip())
                equipo_visita = fix_encoding(nombres[1].text.strip())
                goles_local = goles[0].text.strip()
                goles_visita = goles[1].text.strip()
                escudo_local = escudos[0].find("img")["data-src"]
                escudo_visita = escudos[1].find("img")["data-src"]

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
            except Exception as e:
                print("⚠️ Error procesando un partido:", e)
                continue

    response = requests.get(url_tabla, headers=headers)
    if response.status_code != 200:
        print(f"❌ Error al obtener la página {url_tabla}")
        return None

    soup = BeautifulSoup(response.text, 'html.parser')
    tabla_posiciones = []
    grupo_actual = None

    for table in soup.find_all("table", class_="stats-table"):
        zona_th = table.find("th", class_="zona")
        if zona_th:
            grupo_actual = zona_th.get_text(strip=True)

        body = table.find("tbody")
        if not body:
            continue

        for fila in body.find_all("tr"):
            columnas = fila.find_all("td")
            if len(columnas) < 10:
                continue

            img_tag = columnas[1].find("img")
            escudo = img_tag.get("data-src") or img_tag.get("src", "")
            equipo = fix_encoding(columnas[2].text.strip())
            try:
                gf = int(columnas[8].text.strip())
                gc = int(columnas[9].text.strip())
                dg = gf - gc
            except:
                gf = gc = dg = 0

            tabla_posiciones.append({
                "grupo": grupo_actual,
                "posicion": columnas[0].text.strip(),
                "escudo": escudo,
                "equipo": equipo,
                "puntos": columnas[3].text.strip(),
                "pj": columnas[4].text.strip(),
                "pg": columnas[5].text.strip(),
                "pe": columnas[6].text.strip(),
                "pp": columnas[7].text.strip(),
                "gf": gf,
                "gc": gc,
                "dg": dg
            })

    response = requests.get(url_goleadores, headers=headers)
    goleadores = []
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        tabla = soup.find("table", class_="stats-table")
        if tabla:
            for fila in tabla.find("tbody").find_all("tr"):
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
                except:
                    continue

    return {
        "fixture": partidos,
        "tabla_posiciones": tabla_posiciones,
        "goleadores": goleadores
    }

ligas = {
    "Copa Libertadores": {
        "fixture": "https://www.tycsports.com/estadisticas/copa-libertadores/fixture.html",
        "tabla": "https://www.tycsports.com/estadisticas/copa-libertadores/tabla-de-posiciones.html",
        "goleadores": "https://www.tycsports.com/estadisticas/copa-libertadores/tabla-de-goleadores.html"
    },
}

datos = {}
for liga, urls in ligas.items():
    print(f"📌 Obteniendo datos de {liga}...")
    datos[liga] = obtener_fixture_y_tabla(urls["fixture"], urls["tabla"], urls["goleadores"], liga)

carpeta_destino = r"C:\\Users\\Usuario\\Desktop\\nueva carpeta(7)\\Pagina Futbol\\src\\JSONs"
os.makedirs(carpeta_destino, exist_ok=True)
ruta_archivo = os.path.join(carpeta_destino, "resultadoslib.json")
with open(ruta_archivo, "w", encoding="utf-8") as f:
    json.dump(datos, f, ensure_ascii=False, indent=4)

print(f"✅ Scraping completado. Datos guardados en '{ruta_archivo}'.")
