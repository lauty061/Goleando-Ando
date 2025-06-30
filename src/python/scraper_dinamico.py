import requests
from bs4 import BeautifulSoup
import json
import os
import logging
from typing import List, Dict, Optional, Any

# Configuración de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Constantes
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
DEFAULT_HEADERS = {"User-Agent": USER_AGENT}
RUTA_BASE_JSON = os.path.join(os.path.dirname(__file__), "..", "JSONs") # Ruta relativa al script
FALLBACK_SHIELD_URL = "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg"

# --- Funciones de Utilidad ---
def fix_encoding(text: str) -> str:
    """Intenta corregir problemas comunes de codificación."""
    try:
        return text.encode("latin1").decode("utf-8")
    except UnicodeEncodeError: # Si ya es UTF-8 o similar y falla latin1
        return text
    except Exception:
        return text

def fetch_html(url: str) -> Optional[BeautifulSoup]:
    """Obtiene el contenido HTML de una URL y lo parsea con BeautifulSoup."""
    try:
        response = requests.get(url, headers=DEFAULT_HEADERS, timeout=15)
        response.raise_for_status() # Lanza HTTPError para respuestas 4xx/5xx
        return BeautifulSoup(response.text, 'html.parser')
    except requests.exceptions.RequestException as e:
        logging.error(f"❌ Error al obtener la página {url}: {e}")
        return None

# --- Funciones de Scraping Específicas ---

def scrape_fixture(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extrae los datos del fixture de una página parseada."""
    partidos = []
    jornada_actual = None
    if not soup:
        return partidos

    for elemento in soup.find_all(["h2", "div"], class_=["titulo", "partido"]):
        if elemento.name == "h2" and "Jornada" in elemento.text:
            jornada_actual = elemento.text.strip()
        elif elemento.name == "div" and "partido" in elemento.get("class", []):
            try:
                equipo_local_tag = elemento.find_all("span", class_="partido-name")
                equipo_visita_tag = elemento.find_all("span", class_="partido-name")
                goles_local_tag = elemento.find_all("span", class_="partido-goles")
                goles_visita_tag = elemento.find_all("span", class_="partido-goles")
                escudo_local_img = elemento.find_all("div", class_="partido-escudo")[0].find("img")
                escudo_visita_img = elemento.find_all("div", class_="partido-escudo")[1].find("img")
                fecha_partido_tag = elemento.find("span", class_="date")

                if not (len(equipo_local_tag) > 0 and len(equipo_visita_tag) > 1 and \
                        len(goles_local_tag) > 0 and len(goles_visita_tag) > 1 and \
                        escudo_local_img and escudo_visita_img and fecha_partido_tag):
                    logging.warning("⚠️ Faltan datos en un partido, se omitirá.")
                    continue

                equipo_local = fix_encoding(equipo_local_tag[0].text.strip())
                equipo_visita = fix_encoding(equipo_visita_tag[1].text.strip())
                goles_local = goles_local_tag[0].text.strip()
                goles_visita = goles_visita_tag[1].text.strip()
                escudo_local = escudo_local_img.get("data-src", escudo_local_img.get("src", FALLBACK_SHIELD_URL))
                escudo_visita = escudo_visita_img.get("data-src", escudo_visita_img.get("src", FALLBACK_SHIELD_URL))
                fecha_partido = fecha_partido_tag.text.strip()

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
            except (AttributeError, IndexError) as e:
                logging.warning(f"⚠️ Error procesando un partido: {e}, se omitirá.")
    return partidos

def scrape_tabla_posiciones(soup: BeautifulSoup, tiene_zonas: bool) -> List[Dict[str, Any]]:
    """Extrae los datos de la tabla de posiciones de una página parseada."""
    tabla_posiciones = []
    if not soup:
        return tabla_posiciones

    tabla = soup.find("table", id="posiciones")
    if not tabla:
        logging.warning("❌ No se encontró la tabla de posiciones.")
        return tabla_posiciones

    filas = tabla.find_all("tr")
    zona_actual = None

    for fila in filas:
        if tiene_zonas:
            th_zona = fila.find("th", class_="zona")
            if th_zona:
                zona_actual = fix_encoding(th_zona.text.strip())
                continue

        columnas = fila.find_all("td")
        if len(columnas) < 10: # Mínimo de columnas esperado
            continue

        try:
            posicion = columnas[0].text.strip()
            img_tag = columnas[1].find("img")
            equipo_escudo = img_tag.get("data-src", img_tag.get("src", FALLBACK_SHIELD_URL)) if img_tag else FALLBACK_SHIELD_URL

            equipo_nombre = fix_encoding(columnas[2].text.strip())
            puntos = columnas[3].text.strip()
            pj = columnas[4].text.strip()
            pg = columnas[5].text.strip()
            pe = columnas[6].text.strip()
            pp = columnas[7].text.strip()

            gf_text = columnas[8].text.strip()
            gc_text = columnas[9].text.strip()

            gf = int(gf_text) if gf_text else 0
            gc = int(gc_text) if gc_text else 0
            dg = gf - gc

            entrada_tabla = {
                "posicion": posicion,
                "escudo": equipo_escudo,
                "equipo": equipo_nombre,
                "puntos": puntos,
                "pj": pj,
                "pg": pg,
                "pe": pe,
                "pp": pp,
                "gf": gf,
                "gc": gc,
                "dg": dg
            }
            if tiene_zonas:
                entrada_tabla["zona"] = zona_actual

            tabla_posiciones.append(entrada_tabla)

        except (ValueError, AttributeError, IndexError) as e:
            logging.warning(f"⚠️ Error procesando una fila de la tabla: {e}, se omitirá.")
    return tabla_posiciones

def scrape_goleadores(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Extrae los datos de los goleadores de una página parseada."""
    goleadores = []
    if not soup:
        return goleadores

    tabla = soup.find("table", class_="stats-table")
    if not tabla:
        logging.warning("❌ No se encontró la tabla de goleadores.")
        return goleadores

    tbody = tabla.find("tbody")
    if not tbody:
        logging.warning("❌ No se encontró el cuerpo (tbody) de la tabla de goleadores.")
        return goleadores

    filas = tbody.find_all("tr")
    for fila in filas:
        columnas = fila.find_all("td")
        if len(columnas) < 3:
            continue
        try:
            nombre = fix_encoding(columnas[0].text.strip())
            img_tag = columnas[1].find("img")
            escudo = img_tag.get("data-src", img_tag.get("src", FALLBACK_SHIELD_URL)) if img_tag else FALLBACK_SHIELD_URL
            equipo = fix_encoding(img_tag.get("alt", "Equipo no disponible")) if img_tag else "Equipo no disponible"
            goles_text = columnas[2].text.strip()
            goles = int(goles_text) if goles_text else 0

            goleadores.append({
                "nombre": nombre,
                "equipo": equipo,
                "escudo": escudo,
                "goles": goles
            })
        except (ValueError, AttributeError, IndexError) as e:
            logging.warning(f"⚠️ Error procesando un goleador: {e}, se omitirá.")
    return goleadores

# --- Función Principal de Scraping por Liga ---

def obtener_datos_liga(config_liga: Dict[str, Any]) -> Dict[str, Any]:
    """Obtiene todos los datos (fixture, tabla, goleadores) para una liga configurada."""
    nombre_liga = config_liga["nombre"]
    logging.info(f"📌 Obteniendo datos de {nombre_liga}...")

    datos_liga = {
        "nombre_liga": nombre_liga,
        "fixture": [],
        "tabla_posiciones": [],
        "goleadores": []
    }

    # Scrape Fixture
    if config_liga.get("url_fixture"):
        soup_fixture = fetch_html(config_liga["url_fixture"])
        if soup_fixture:
            datos_liga["fixture"] = scrape_fixture(soup_fixture)

    # Scrape Tabla de Posiciones
    if config_liga.get("url_tabla"):
        soup_tabla = fetch_html(config_liga["url_tabla"])
        if soup_tabla:
            datos_liga["tabla_posiciones"] = scrape_tabla_posiciones(soup_tabla, config_liga.get("tiene_zonas", False))

    # Scrape Goleadores
    if config_liga.get("url_goleadores"):
        soup_goleadores = fetch_html(config_liga["url_goleadores"])
        if soup_goleadores:
            datos_liga["goleadores"] = scrape_goleadores(soup_goleadores)

    return datos_liga

# --- Guardado de Datos ---

def guardar_json(datos: Dict[str, Any], nombre_archivo: str):
    """Guarda los datos en un archivo JSON."""
    os.makedirs(RUTA_BASE_JSON, exist_ok=True)
    ruta_archivo = os.path.join(RUTA_BASE_JSON, f"{nombre_archivo}.json")
    try:
        with open(ruta_archivo, "w", encoding="utf-8") as f:
            json.dump(datos, f, ensure_ascii=False, indent=4)
        logging.info(f"✅ Datos guardados en '{ruta_archivo}'.")
    except IOError as e:
        logging.error(f"❌ Error al guardar el archivo JSON {ruta_archivo}: {e}")

# --- Flujo Principal ---

def main():
    """Flujo principal del scraper dinámico."""
    # Cargar configuración de ligas
    try:
        with open(os.path.join(os.path.dirname(__file__), "config_ligas.json"), "r", encoding="utf-8") as f:
            config_general = json.load(f)
        ligas_a_scrapear = config_general.get("ligas", [])
        if not ligas_a_scrapear:
            logging.warning("No se encontraron ligas en el archivo de configuración.")
            return
    except FileNotFoundError:
        logging.error("❌ Archivo de configuración 'config_ligas.json' no encontrado.")
        return
    except json.JSONDecodeError:
        logging.error("❌ Error al decodificar el archivo 'config_ligas.json'. Asegúrate de que sea un JSON válido.")
        return

    for config_liga in ligas_a_scrapear:
        nombre_liga_para_archivo = config_liga.get("identificador_json", config_liga["nombre"].lower().replace(" ", "_"))

        # En los archivos originales, los datos se guardaban bajo una clave que era el nombre de la liga.
        # Para mantener una estructura similar si es necesario, o para permitir flexibilidad:
        # Aquí, el JSON guardado contendrá directamente el fixture, tabla y goleadores de ESA liga.
        # Si se quisiera replicar la estructura anterior (un JSON por liga, con el nombre de la liga como clave principal),
        # se haría: datos_finales = {config_liga["nombre"]: obtener_datos_liga(config_liga)}
        # Pero para simplificar y dado que cada liga tendrá su propio JSON, guardamos directamente el resultado.

        datos_completos_liga = obtener_datos_liga(config_liga)

        # Crear un diccionario que contenga el nombre de la liga como clave principal,
        # y dentro de este, los datos de fixture, tabla y goleadores.
        # Esto replica la estructura de los JSONs originales.
        output_data = {
            config_liga["nombre"]: {
                "fixture": datos_completos_liga["fixture"],
                "tabla_posiciones": datos_completos_liga["tabla_posiciones"],
                "goleadores": datos_completos_liga["goleadores"]
            }
        }

        guardar_json(output_data, nombre_liga_para_archivo)

    logging.info("🏁 Proceso de scraping completado para todas las ligas configuradas.")

if __name__ == "__main__":
    main()
