import requests
from bs4 import BeautifulSoup
import json
import os
import time
from urllib.parse import urljoin, urlparse, urlunparse
import posixpath
import re

YEAR = 2025
BASE = "https://www.formula1.com"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
OUT_DIR = os.path.join(os.path.expanduser("~"), "Desktop", "nueva carpeta(7)", "Pagina Futbol", "src", "JSONs")
os.makedirs(OUT_DIR, exist_ok=True)
OUTPUT_FILE = os.path.join(OUT_DIR, f"f1_{YEAR}.json")
REQUEST_TIMEOUT = 15
RETRIES = 3
SLEEP_BETWEEN = 0.8

def fetch_soup(url, tries=RETRIES):
    headers = {"User-Agent": USER_AGENT, "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"}
    attempt = 0
    while attempt < tries:
        try:
            r = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
            if r.status_code == 200:
                return BeautifulSoup(r.text, "html.parser")
        except Exception:
            pass
        attempt += 1
        time.sleep(1)
    return None

def normalize_url(href):
    if not href:
        return None
    joined = urljoin(BASE + "/", href)
    p = urlparse(joined)
    normalized_path = posixpath.normpath(p.path)
    if not normalized_path.startswith("/"):
        normalized_path = "/" + normalized_path
    return urlunparse((p.scheme or "https", p.netloc or urlparse(BASE).netloc, normalized_path, p.params, p.query, p.fragment))

def clean_text(text):
    if not text:
        return None
    text = re.sub(r"Flag of [A-Za-zÀ-ÖØ-öø-ÿ\s']+", "", text)
    return re.sub(r"\s+", " ", text).strip()

def normalize_name(raw_text):
    if not raw_text:
        return None
    s = re.sub(r"Flag of [A-Za-zÀ-ÖØ-öø-ÿ\s']+", "", raw_text)
    s = re.sub(r"(?<=[a-záéíóúñü])(?=[A-ZÁÉÍÓÚÑÜ])", " ", s)
    s = re.sub(r"[\u00A0/]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    tokens = s.split(" ")
    cleaned_tokens = []
    for t in tokens:
        if re.fullmatch(r"[A-ZÁÉÍÓÚÑ]{3}", t):
            continue
        cleaned_tokens.append(t)
    dedup = []
    for t in cleaned_tokens:
        if not dedup or dedup[-1] != t:
            dedup.append(t)
    if not dedup:
        return None
    name = " ".join(dedup).strip()
    parts = name.split()
    half = len(parts) // 2
    if half > 0 and parts[:half] == parts[half:2 * half]:
        name = " ".join(parts[:half])
    name = re.sub(r"\s+", " ", name).strip()
    return name

def text_or_none(node):
    return clean_text(node.get_text(strip=True)) if node else None

def safe_img_src(img_tag):
    if not img_tag:
        return None
    return img_tag.get("src") or img_tag.get("data-src") or img_tag.get("data-original") or None

def slug_to_title(slug):
    if not slug:
        return None
    s = slug.replace("-", " ")
    s = " ".join([w.capitalize() for w in s.split()])
    return s

def get_car_image_url(team_name, year=2025):
    """Construye la URL de la imagen del monoposto basándose en el nombre del equipo"""
    if not team_name:
        return None
    # Mapeo de nombres de equipos a sus slugs en las URLs de F1
    team_slugs = {
        "McLaren": "mclaren",
        "Mc Laren": "mclaren",
        "Ferrari": "ferrari",
        "Mercedes": "mercedes",
        "Red Bull Racing": "redbullracing",
        "Williams": "williams",
        "Racing Bulls": "racingbulls",
        "Aston Martin": "astonmartin",
        "Haas F1 Team": "haasf1team",
        "Kick Sauber": "kicksauber",
        "Alpine": "alpine"
    }
    
    team_slug = team_slugs.get(team_name)
    if not team_slug:
        # Intentar crear slug automáticamente
        team_slug = team_name.lower().replace(" ", "").replace("-", "")
    
    # URL base para las imágenes de los coches
    return f"https://media.formula1.com/image/upload/c_lfill,w_320/q_auto/v1740000000/common/f1/{year}/{team_slug}/{year}{team_slug}car.webp"

def get_slug_from_result_url(url):
    if not url:
        return None
    p = urlparse(url).path
    parts = [seg for seg in p.split("/") if seg]
    if 'race-result' in parts:
        idx = parts.index('race-result')
        if idx - 1 >= 0:
            return parts[idx - 1]
    return parts[-1] if parts else None

def parse_races_page(year):
    url = f"{BASE}/en/results/{year}/races"
    soup = fetch_soup(url)
    if not soup:
        return []
    # Intentar con ambas clases (vieja y nueva)
    table = soup.find("table", class_="f1-table") or soup.find("table", class_=lambda x: x and 'Table-module_table' in x)
    if not table:
        return []
    rows = table.find("tbody").find_all("tr")
    results = []
    for tr in rows:
        try:
            tds = tr.find_all("td")
            gp_anchor = tds[0].find("a") if len(tds) > 0 else None
            flag_svg = None
            flag_title = None
            country = None
            if gp_anchor:
                svg = gp_anchor.find("svg")
                if svg:
                    flag_svg = str(svg)
                    title_tag = svg.find("title")
                    if title_tag:
                        flag_title = title_tag.get_text(strip=True)
                        if flag_title and flag_title.lower().startswith("flag of"):
                            country = flag_title.replace("Flag of", "").strip()
            gp_href = gp_anchor.get("href") if gp_anchor else None
            gp_url = normalize_url(gp_href)
            date = text_or_none(tds[1]) if len(tds) > 1 else None
            winner_cell = tds[2] if len(tds) > 2 else None
            winner_anchor = winner_cell.find("a") if winner_cell else None
            winner_raw = winner_anchor.get_text(" ", strip=True) if winner_anchor else text_or_none(winner_cell)
            winner_name = normalize_name(winner_raw)
            winner_img = safe_img_src(winner_cell.find("img")) if winner_cell else None
            team_cell = tds[3] if len(tds) > 3 else None
            team_anchor = team_cell.find("a") if team_cell else None
            team_raw = team_anchor.get_text(" ", strip=True) if team_anchor else text_or_none(team_cell)
            team_name = normalize_name(team_raw) or clean_text(team_raw)
            if team_name:
                team_name = re.sub(r'\bMc\s+([A-Za-z])', r'Mc\1', team_name, flags=re.I)
                team_name = re.sub(r'\s+', ' ', team_name).strip()
            team_logo = safe_img_src(team_cell.find("img")) if team_cell else None
            laps = text_or_none(tds[4]) if len(tds) > 4 else None
            time_text = text_or_none(tds[5]) if len(tds) > 5 else None
            grand_prix = None
            if gp_anchor:
                combined = gp_anchor.get_text(" ", strip=True)
                gp_text = clean_text(combined)
                if gp_text:
                    grand_prix = gp_text
            if grand_prix:
                grand_prix = re.sub(r'\s*-\s*RACE RESULT.*$', '', grand_prix, flags=re.I).strip()
                grand_prix = grand_prix.title()
            results.append({
                "grand_prix": grand_prix or None,
                "country": country,
                "country_flag_svg": flag_svg,
                "country_flag_title": flag_title,
                "date": date,
                "winner": winner_name,
                "winner_img": winner_img,
                "team": team_name,
                "team_logo": team_logo,
                "laps": laps,
                "time": time_text,
                "result_page": gp_url
            })
        except Exception:
            pass
    return results

def parse_drivers_page(year):
    url = f"{BASE}/en/results/{year}/drivers"
    soup = fetch_soup(url)
    if not soup:
        return []
    # Intentar con ambas clases (vieja y nueva)
    table = soup.find("table", class_="f1-table") or soup.find("table", class_=lambda x: x and 'Table-module_table' in x)
    if not table:
        return []
    rows = table.find("tbody").find_all("tr")
    drivers = []
    for tr in rows:
        try:
            tds = tr.find_all("td")
            pos = text_or_none(tds[0]) if len(tds) > 0 else None
            driver_cell = tds[1]
            driver_anchor = driver_cell.find("a")
            driver_img = safe_img_src(driver_cell.find("img"))
            raw_driver_text = driver_anchor.get_text(" ", strip=True) if driver_anchor else driver_cell.get_text(" ", strip=True)
            driver_name = normalize_name(raw_driver_text)
            nationality = text_or_none(tds[2]) if len(tds) > 2 else None
            team_anchor = tds[3].find("a") if len(tds) > 3 and tds[3] else None
            team = normalize_name(team_anchor.get_text(" ", strip=True)) if team_anchor else text_or_none(tds[3]) if len(tds) > 3 else None
            team_cell = tds[3] if len(tds) > 3 else None
            team_logo = safe_img_src(team_cell.find("img")) if team_cell else None
            points = text_or_none(tds[4]) if len(tds) > 4 else None
            profile_href = driver_anchor.get("href") if driver_anchor else None
            profile_url = normalize_url(profile_href) if profile_href else None
            drivers.append({
                "pos": pos,
                "name": driver_name,
                "profile_url": profile_url,
                "img": driver_img,
                "nationality": nationality,
                "team": team,
                "team_logo": team_logo,
                "points": points
            })
        except Exception:
            pass
    return drivers

def parse_teams_page(year):
    url_candidates = [f"{BASE}/en/results/{year}/team", f"{BASE}/en/results/{year}/teams"]
    soup = None
    for u in url_candidates:
        soup = fetch_soup(u)
        if soup:
            # Intentar con ambas clases (vieja y nueva)
            table = soup.find("table", class_="f1-table") or soup.find("table", class_=lambda x: x and 'Table-module_table' in x)
            if table:
                break
    if not soup:
        return []
    table = soup.find("table", class_="f1-table") or soup.find("table", class_=lambda x: x and 'Table-module_table' in x)
    if not table:
        return []
    rows = table.find("tbody").find_all("tr")
    teams = []
    for tr in rows:
        try:
            tds = tr.find_all("td")
            pos = text_or_none(tds[0])
            team_cell = tds[1] if len(tds) > 1 else None
            team_anchor = team_cell.find("a") if team_cell else None
            team_name = normalize_name(team_anchor.get_text(" ", strip=True)) if team_anchor else text_or_none(team_cell)
            # Buscar imagen del monoposto en la celda del equipo
            car_img = None
            if team_cell:
                all_imgs = team_cell.find_all("img")
                for img in all_imgs:
                    src = safe_img_src(img)
                    if src and 'car' in src.lower():
                        car_img = src
                        break
            # Si no se encontró la imagen del coche en el HTML, construir la URL
            if not car_img and team_name:
                car_img = get_car_image_url(team_name, YEAR)
            team_logo_cell = tds[3] if len(tds) > 3 else None
            team_logo = safe_img_src(team_logo_cell.find("img")) if team_logo_cell else None
            points = text_or_none(tds[2]) if len(tds) > 2 else None
            profile_href = team_anchor.get("href") if team_anchor else None
            profile_url = normalize_url(profile_href) if profile_href else None
            teams.append({
                "pos": pos,
                "team": team_name,
                "profile_url": profile_url,
                "logo": team_logo,
                "car_img": car_img,
                "points": points
            })
        except Exception:
            pass
    return teams

def parse_race_result_page(result_url):
    soup = fetch_soup(result_url)
    if not soup:
        return [], None
    gp_title = None
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        gp_title = clean_text(h1.get_text(" ", strip=True))
    if not gp_title:
        og = soup.find("meta", property="og:title")
        if og and og.get("content"):
            gp_title = clean_text(og.get("content"))
    # Intentar con ambas clases (vieja y nueva)
    table = soup.find("table", class_="f1-table") or soup.find("table", class_=lambda x: x and 'Table-module_table' in x)
    if not table:
        return [], gp_title
    rows = table.find("tbody").find_all("tr")
    race_results = []
    for tr in rows:
        try:
            tds = tr.find_all("td")
            pos = text_or_none(tds[0]) if len(tds) > 0 else None
            car_number = text_or_none(tds[1]) if len(tds) > 1 else None
            driver_cell = tds[2] if len(tds) > 2 else None
            driver_img = safe_img_src(driver_cell.find("img")) if driver_cell else None
            raw_driver = driver_cell.get_text(" ", strip=True) if driver_cell else None
            driver_name = normalize_name(raw_driver)
            team = text_or_none(tds[3]) if len(tds) > 3 else None
            team_cell = tds[3] if len(tds) > 3 else None
            # Buscar imagen del monoposto y logo del equipo
            car_img = None
            team_logo = None
            if team_cell:
                all_imgs = team_cell.find_all("img")
                for img in all_imgs:
                    src = safe_img_src(img)
                    if src:
                        if 'car' in src.lower() or 'monoposto' in src.lower():
                            car_img = src
                        elif 'logo' in src.lower():
                            team_logo = src
                # Si no encontramos logo, usar la primera imagen
                if not team_logo and len(all_imgs) >= 1:
                    team_logo = safe_img_src(all_imgs[0])
            # Si no se encontró la imagen del coche en el HTML, construir la URL
            if not car_img and team:
                car_img = get_car_image_url(team, YEAR)
            laps = text_or_none(tds[4]) if len(tds) > 4 else None
            time_text = text_or_none(tds[5]) if len(tds) > 5 else None
            points = text_or_none(tds[6]) if len(tds) > 6 else None
            race_results.append({
                "pos": pos,
                "car_number": car_number,
                "driver": driver_name,
                "driver_img": driver_img,
                "team": team,
                "car_img": car_img,
                "team_logo": team_logo,
                "laps": laps,
                "time": time_text,
                "points": points
            })
        except Exception:
            pass
    return race_results, gp_title

def obtener_f1(year, descargar_resultados_detallados=True):
    data = {"year": year, "races": [], "drivers": [], "teams": [], "race_results": {}}
    races = parse_races_page(year)
    data["races"] = races
    time.sleep(SLEEP_BETWEEN)
    drivers = parse_drivers_page(year)
    data["drivers"] = drivers
    time.sleep(SLEEP_BETWEEN)
    teams = parse_teams_page(year)
    data["teams"] = teams
    time.sleep(SLEEP_BETWEEN)
    if descargar_resultados_detallados:
        for r in races:
            url = r.get("result_page")
            if url:
                rr, gp_title = parse_race_result_page(url)
                if not r.get("grand_prix"):
                    if gp_title:
                        cleaned = re.sub(r'\s*-\s*RACE RESULT.*$', '', gp_title, flags=re.I).strip()
                        r["grand_prix"] = cleaned.title()
                    else:
                        slug = get_slug_from_result_url(url)
                        r["grand_prix"] = slug_to_title(slug)
                if not r.get("country"):
                    r["country"] = r.get("grand_prix")
                data["race_results"][r.get("grand_prix") or url] = rr
                time.sleep(SLEEP_BETWEEN)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return data

if __name__ == "__main__":
    obtener_f1(YEAR, descargar_resultados_detallados=True)
