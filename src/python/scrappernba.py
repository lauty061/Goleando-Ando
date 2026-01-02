import json
import os
import time
from datetime import datetime, timedelta
import pandas as pd
from nba_api.stats.endpoints import leaguestandings, scoreboardv2, leagueleaders

TEMPORADA_ACTUAL = "2024-25"
DIAS_ATRAS = 3
DIAS_ADELANTE = 3
CARPETA_JSONS = os.path.join(os.path.dirname(__file__), "..", "JSONs")
RUTA_ARCHIVO = os.path.join(CARPETA_JSONS, "resultadosnba.json")

def obtener_datos_nba_full_calendar():
    tabla_posiciones = {"Este": [], "Oeste": []}
    id_a_nombre = {}

    try:
        df_standings = leaguestandings.LeagueStandings(season=TEMPORADA_ACTUAL).get_data_frames()[0]
        
        for _, row in df_standings.iterrows():
            conf = "Este" if row['Conference'] == 'East' else "Oeste"
            nombre_equipo = f"{row['TeamCity']} {row['TeamName']}"
            team_id = row['TeamID']
            
            id_a_nombre[team_id] = nombre_equipo
            
            tabla_posiciones[conf].append({
                "posicion": str(row['PlayoffRank']),
                "equipo": nombre_equipo,
                "escudo": f"https://cdn.nba.com/logos/nba/{team_id}/primary/L/logo.svg",
                "record": row['Record'],
                "porcentaje_pg": f"{row['WinPCT']:.3f}",
                "puntos": str(row['WINS']),
                "pj": str(row['WINS'] + row['LOSSES']),
                "pp": str(row['LOSSES']),
                "casa": row['HOME'],
                "fuera": row['ROAD'],
                "l10": row['L10'],
                "racha": str(row.get('strCurrentStreak', row.get('CurrentStreak', '-')))
            })
    except Exception:
        pass

    fixture = []
    fecha_hoy = datetime.now()
    rango_fechas = [fecha_hoy + timedelta(days=i) for i in range(-DIAS_ATRAS, DIAS_ADELANTE + 1)]

    for fecha in rango_fechas:
        fecha_str = fecha.strftime("%Y-%m-%d")
        fecha_display = fecha.strftime("%d/%m")

        try:
            board = scoreboardv2.ScoreboardV2(game_date=fecha_str)
            dfs = board.get_data_frames()
            
            if len(dfs) >= 2:
                df_games = dfs[0]
                df_scores = dfs[1]
                
                scores_map = {}
                for _, row in df_scores.iterrows():
                    scores_map[(row['GAME_ID'], row['TEAM_ID'])] = row['PTS']

                for _, game in df_games.iterrows():
                    home_id = game['HOME_TEAM_ID']
                    visita_id = game['VISITOR_TEAM_ID']
                    game_id = game['GAME_ID']
                    
                    pts_home = scores_map.get((game_id, home_id))
                    pts_visita = scores_map.get((game_id, visita_id))
                    
                    if pts_home is None or pd.isna(pts_home): pts_home = "-"
                    else: pts_home = str(int(pts_home))
                        
                    if pts_visita is None or pd.isna(pts_visita): pts_visita = "-"
                    else: pts_visita = str(int(pts_visita))

                    fixture.append({
                        "fecha_torneo": fecha_display,
                        "fecha": game['GAME_STATUS_TEXT'],
                        "local": str(home_id),
                        "nombre_local": id_a_nombre.get(home_id, "NBA Team"),
                        "goles_local": pts_home,
                        "escudo_local": f"https://cdn.nba.com/logos/nba/{home_id}/primary/L/logo.svg",
                        "visitante": str(visita_id),
                        "nombre_visita": id_a_nombre.get(visita_id, "NBA Team"),
                        "goles_visita": pts_visita,
                        "escudo_visita": f"https://cdn.nba.com/logos/nba/{visita_id}/primary/L/logo.svg"
                    })
            
            time.sleep(0.5)

        except Exception:
            continue

    estadisticas = {
        "puntos": [],
        "rebotes": [],
        "asistencias": [],
        "robos": [],
        "tapones": []
    }
    
    categorias_api = [
        ("PTS", "puntos"),
        ("REB", "rebotes"),
        ("AST", "asistencias"),
        ("STL", "robos"),
        ("BLK", "tapones")
    ]

    for abbrev, key in categorias_api:
        try:
            df_leaders = leagueleaders.LeagueLeaders(
                per_mode48="PerGame",
                scope="S",
                season=TEMPORADA_ACTUAL,
                season_type_all_star="Regular Season",
                stat_category_abbreviation=abbrev
            ).get_data_frames()[0]

            for _, p in df_leaders.head(10).iterrows():
                estadisticas[key].append({
                    "jugador": p['PLAYER'],
                    "equipo": p['TEAM'],
                    "foto": f"https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/{p['PLAYER_ID']}.png",
                    "valor": f"{p[abbrev]:.1f}"
                })
        except Exception:
            pass

    datos_finales = {
        "NBA": {
            "fixture": fixture,
            "tabla_posiciones": tabla_posiciones,
            "estadisticas_jugadores": estadisticas
        }
    }

    os.makedirs(CARPETA_JSONS, exist_ok=True)
    with open(RUTA_ARCHIVO, "w", encoding="utf-8") as f:
        json.dump(datos_finales, f, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    obtener_datos_nba_full_calendar()