import requests
import json
import os
from datetime import datetime, timedelta

def obtener_datos_nba():
    """Obtiene datos de ESPN API (endpoint interno JSON)"""
    
    equipos_logos = {
        "ATL": "https://cdn.nba.com/logos/nba/1610612737/primary/L/logo.svg",
        "BOS": "https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg",
        "BKN": "https://cdn.nba.com/logos/nba/1610612751/primary/L/logo.svg",
        "CHA": "https://cdn.nba.com/logos/nba/1610612766/primary/L/logo.svg",
        "CHI": "https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg",
        "CLE": "https://cdn.nba.com/logos/nba/1610612739/primary/L/logo.svg",
        "DAL": "https://cdn.nba.com/logos/nba/1610612742/primary/L/logo.svg",
        "DEN": "https://cdn.nba.com/logos/nba/1610612743/primary/L/logo.svg",
        "DET": "https://cdn.nba.com/logos/nba/1610612765/primary/L/logo.svg",
        "GSW": "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg",
        "GS": "https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg",
        "HOU": "https://cdn.nba.com/logos/nba/1610612745/primary/L/logo.svg",
        "IND": "https://cdn.nba.com/logos/nba/1610612754/primary/L/logo.svg",
        "LAC": "https://cdn.nba.com/logos/nba/1610612746/primary/L/logo.svg",
        "LAL": "https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg",
        "MEM": "https://cdn.nba.com/logos/nba/1610612763/primary/L/logo.svg",
        "MIA": "https://cdn.nba.com/logos/nba/1610612748/primary/L/logo.svg",
        "MIL": "https://cdn.nba.com/logos/nba/1610612749/primary/L/logo.svg",
        "MIN": "https://cdn.nba.com/logos/nba/1610612750/primary/L/logo.svg",
        "NO": "https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg",
        "NOP": "https://cdn.nba.com/logos/nba/1610612740/primary/L/logo.svg",
        "NYK": "https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg",
        "NY": "https://cdn.nba.com/logos/nba/1610612752/primary/L/logo.svg",
        "OKC": "https://cdn.nba.com/logos/nba/1610612760/primary/L/logo.svg",
        "ORL": "https://cdn.nba.com/logos/nba/1610612753/primary/L/logo.svg",
        "PHI": "https://cdn.nba.com/logos/nba/1610612755/primary/L/logo.svg",
        "PHX": "https://cdn.nba.com/logos/nba/1610612756/primary/L/logo.svg",
        "POR": "https://cdn.nba.com/logos/nba/1610612757/primary/L/logo.svg",
        "SAC": "https://cdn.nba.com/logos/nba/1610612758/primary/L/logo.svg",
        "SA": "https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg",
        "SAS": "https://cdn.nba.com/logos/nba/1610612759/primary/L/logo.svg",
        "TOR": "https://cdn.nba.com/logos/nba/1610612761/primary/L/logo.svg",
        "UTAH": "https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg",
        "UTA": "https://cdn.nba.com/logos/nba/1610612762/primary/L/logo.svg",
        "WSH": "https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg",
        "WAS": "https://cdn.nba.com/logos/nba/1610612764/primary/L/logo.svg"
    }
    
    partidos = []
    
    print("📊 Obteniendo partidos desde ESPN...")
    
    try:
        url = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
        
        for offset in range(-10, 3):
            fecha = datetime.now() + timedelta(days=offset)
            fecha_str = fecha.strftime("%Y%m%d")
            
            params = {"dates": fecha_str}
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if "events" in data:
                    for event in data["events"]:
                        try:
                            name = event.get("name", "")
                            shortName = event.get("shortName", "")
                            date = event.get("date", "")
                            status_type = event.get("status", {}).get("type", {}).get("name", "STATUS_SCHEDULED")
                            status_detail = event.get("status", {}).get("type", {}).get("detail", "")
                            
                            competitions = event.get("competitions", [])
                            if not competitions:
                                continue
                            
                            competition = competitions[0]
                            competitors = competition.get("competitors", [])
                            
                            if len(competitors) < 2:
                                continue
                            
                            home_team = None
                            away_team = None
                            
                            for comp in competitors:
                                if comp.get("homeAway") == "home":
                                    home_team = comp
                                elif comp.get("homeAway") == "away":
                                    away_team = comp
                            
                            if not home_team or not away_team:
                                continue
                            
                            home_abbr = home_team.get("team", {}).get("abbreviation", "???")
                            home_score = home_team.get("score", "-")
                            
                            away_abbr = away_team.get("team", {}).get("abbreviation", "???")
                            away_score = away_team.get("score", "-")
                            
                            if status_type == "STATUS_FINAL":
                                estado = "Finalizado"
                            elif status_type == "STATUS_IN_PROGRESS":
                                estado = "En vivo"
                            else:
                                estado = "Por jugar"
                            
                            try:
                                dt = datetime.fromisoformat(date.replace("Z", "+00:00"))
                                fecha_torneo = dt.strftime("%d/%m/%Y")
                                fecha_completa = f"{dt.strftime('%d/%m/%Y %H:%M')} {estado}"
                            except:
                                fecha_torneo = fecha.strftime("%d/%m/%Y")
                                fecha_completa = f"{fecha.strftime('%d/%m/%Y')} {estado}"
                            
                            home_logo = equipos_logos.get(home_abbr, "")
                            away_logo = equipos_logos.get(away_abbr, "")
                            
                            partidos.append({
                                "fecha_torneo": fecha_torneo,
                                "fecha": fecha_completa,
                                "local": home_abbr,
                                "goles_local": str(home_score) if home_score != "-" else "-",
                                "escudo_local": home_logo,
                                "visitante": away_abbr,
                                "goles_visita": str(away_score) if away_score != "-" else "-",
                                "escudo_visita": away_logo
                            })
                            
                        except Exception as e:
                            print(f"⚠️ Error procesando partido: {e}")
                            continue
    except Exception as e:
        print(f"⚠️ Error obteniendo partidos: {e}")
    
    print("📊 Obteniendo tabla de posiciones...")
    
    tabla_posiciones = {"Este": [], "Oeste": []}
    
    try:
        url = "https://site.api.espn.com/apis/v2/sports/basketball/nba/standings"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if "children" in data:
                for conference in data["children"]:
                    conf_name = conference.get("name", "")
                    
                    if "East" in conf_name or "Este" in conf_name:
                        conf_key = "Este"
                    elif "West" in conf_name or "Oeste" in conf_name:
                        conf_key = "Oeste"
                    else:
                        continue
                    
                    if "standings" in conference and "entries" in conference["standings"]:
                        for entry in conference["standings"]["entries"]:
                            try:
                                team = entry.get("team", {})
                                team_abbr = team.get("abbreviation", "???")
                                team_name = team.get("displayName", team_abbr)
                                
                                stats = entry.get("stats", [])
                                
                                wins = 0
                                losses = 0
                                win_pct = 0.0
                                pf = 0
                                pa = 0
                                
                                for stat in stats:
                                    name = stat.get("name", "")
                                    value = stat.get("value", 0)
                                    
                                    if name == "wins":
                                        wins = int(value)
                                    elif name == "losses":
                                        losses = int(value)
                                    elif name == "winPercent":
                                        win_pct = float(value)
                                    elif name == "pointsFor":
                                        pf = int(value)
                                    elif name == "pointsAgainst":
                                        pa = int(value)
                                
                                logo = equipos_logos.get(team_abbr, "")
                                
                                tabla_posiciones[conf_key].append({
                                    "escudo": logo,
                                    "equipo": f"{team_abbr} {team_name}",
                                    "porcentaje_pg": f"{win_pct:.3f}",
                                    "puntos": str(wins + losses),
                                    "pj": str(wins),
                                    "pp": str(losses),
                                    "pf": pf,
                                    "pc": pa,
                                    "dg": pf - pa,
                                    "win_pct_num": win_pct  # Para ordenar
                                })
                            except Exception as e:
                                print(f"⚠️ Error procesando equipo: {e}")
                                continue
        
        # Ordenar por porcentaje de victorias (de mayor a menor) y asignar posiciones
        for conf_key in ["Este", "Oeste"]:
            tabla_posiciones[conf_key].sort(key=lambda x: x["win_pct_num"], reverse=True)
            for idx, equipo in enumerate(tabla_posiciones[conf_key], 1):
                equipo["posicion"] = str(idx)
                del equipo["win_pct_num"]  # Eliminar campo auxiliar
                
    except Exception as e:
        print(f"⚠️ Error obteniendo tabla: {e}")
    
    return {
        "fixture": partidos,
        "tabla_posiciones": tabla_posiciones
    }

carpeta_destino = r"C:\Users\Usuario\Desktop\nueva carpeta(7)\Pagina Futbol\src\JSONs"
os.makedirs(carpeta_destino, exist_ok=True)
ruta_archivo = os.path.join(carpeta_destino, "resultadosnba.json")

print("Iniciando scrapper de NBA desde ESPN...")

try:
    datos_nba = obtener_datos_nba()
    
    datos_finales = {"NBA": datos_nba}
    
    with open(ruta_archivo, "w", encoding="utf-8") as f:
        json.dump(datos_finales, f, ensure_ascii=False, indent=4)
    
    print(f"\nNBA: {len(datos_nba['fixture'])} partidos obtenidos")
    print(f"Tabla: Este ({len(datos_nba['tabla_posiciones']['Este'])} equipos) y Oeste ({len(datos_nba['tabla_posiciones']['Oeste'])} equipos)")
    print(f"Datos guardados en '{ruta_archivo}'.")
    
except Exception as e:
    print(f"Error general: {e}")
    import traceback
    traceback.print_exc()
