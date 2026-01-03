document.addEventListener("DOMContentLoaded", async function () {
    let ligaElement = document.getElementById("titulo-liga");
    if (!ligaElement) return;

    let liga = ligaElement.innerText.trim();
    let ligaData = await obtenerDatosLiga(liga);
    if (!ligaData) return;

    let fixtureData = ligaData.fixture || [];
    let tablaPosicionesData = ligaData.tabla_posiciones || [];
    let goleadoresData = ligaData.goleadores || [];

    let fechasTorneo = {
        "Fecha 1": ["2025-02-02", "2025-02-10"],
        "Fecha 2": ["2025-02-14", "2025-02-17"],
        "Fecha 3": ["2025-02-22", "2025-02-24"],
        "Fecha 4": ["2025-02-28", "2025-03-03"],
        "Fecha 5": ["2025-03-08", "2025-03-11"],
        "Fecha 6": ["2025-03-14", "2025-03-17"],
        "Fecha 7": ["2025-03-22", "2025-03-23"],
        "Fecha 8": ["2025-03-28", "2025-03-31"],
        "Fecha 9": ["2025-04-05", "2025-04-07"],
        "Fecha 10": ["2025-04-12", "2025-04-14"],
        "Fecha 11": ["2025-04-19", "2025-04-21"],
        "Fecha 12": ["2025-04-26", "2025-04-28"],
        "Fecha 13": ["2025-05-02", "2025-05-05"],
        "Fecha 14": ["2025-05-09", "2025-05-12"],
        "Fecha 15": ["2025-05-16", "2025-05-19"],
        "Fecha 16": ["2025-05-23", "2025-05-26"],
        "Fecha 17": ["2025-05-30", "2025-06-02"],
        "Fecha 18": ["2025-06-13", "2025-06-15"],
        "Fecha 19": ["2025-06-20", "2025-06-23"],
        "Fecha 20": ["2025-06-28", "2025-07-01"],
        "Fecha 21": ["2025-07-05", "2025-07-06"],
        "Fecha 22": ["2025-07-11", "2025-07-13"],
        "Fecha 23": ["2025-07-19", "2025-07-21"],
        "Fecha 24": ["2025-07-25", "2025-07-28"],
        "Fecha 25": ["2025-08-02", "2025-08-05"],
        "Fecha 26": ["2025-08-09", "2025-08-11"],
        "Fecha 27": ["2025-08-15", "2025-08-18"],
        "Fecha 28": ["2025-08-22", "2025-08-25"],
        "Fecha 29": ["2025-08-30", "2025-09-01"],
        "Fecha 30": ["2025-09-05", "2025-09-08"],
        "Fecha 31": ["2025-09-13", "2025-09-15"],
        "Fecha 32": ["2025-09-20", "2025-09-22"],
        "Fecha 33": ["2025-09-26", "2025-09-28"],
        "Fecha 34": ["2025-09-29", "2025-09-31"],
    };

    let fechaSelect = document.getElementById("fecha-select");
    fechaSelect.innerHTML = Object.keys(fechasTorneo)
        .map(fecha => `<option value="${fecha}">${fecha}: del ${fechasTorneo[fecha][0]} al ${fechasTorneo[fecha][1]}</option>`)
        .join("");

    mostrarPartidos(fixtureData, "Fecha 1", fechasTorneo);
    let zonasUnicas = [...new Set(tablaPosicionesData.map(e => e.zona))];
    crearSelectorGrupos(zonasUnicas, tablaPosicionesData);
    mostrarGoleadores(goleadoresData);

    fechaSelect.addEventListener("change", function () {
        mostrarPartidos(fixtureData, this.value, fechasTorneo);
    });
});

async function obtenerDatosLiga(liga) {
    try {
        let response = await fetch("../JSONs/resultadosbna.json");
        if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");
        let data = await response.json();
        return data[liga] || null;
    } catch (error) {
        console.error("❌ Error al cargar los datos:", error);
        return null;
    }
}

function convertirFecha(fechaStr) {
    let match = fechaStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return "";
    return `${match[3]}-${match[2]}-${match[1]}`;
}

function mostrarPartidos(fixtureData, jornadaSeleccionada, fechasTorneo) {
    let fixtureTable = document.getElementById("fixture-table");
    fixtureTable.innerHTML = `
        <tr>
            <th>Fecha</th>
            <th>Local</th>
            <th></th>
            <th>Resultado</th>
            <th></th>
            <th>Visitante</th>
        </tr>
    `;

    let [fechaInicio, fechaFin] = fechasTorneo[jornadaSeleccionada];
    let fechaInicioObj = new Date(fechaInicio + "T00:00:00");
    let fechaFinObj = new Date(fechaFin + "T23:59:59");

    let partidos = fixtureData.filter(p => {
        let fechaPartido = convertirFecha(p.fecha);
        if (!fechaPartido) return false;

        let fechaPartidoObj = new Date(fechaPartido + "T00:00:00");
        return fechaPartidoObj >= fechaInicioObj && fechaPartidoObj <= fechaFinObj;
    });

    if (partidos.length === 0) {
        fixtureTable.innerHTML += `<tr><td colspan="6">No hay partidos para esta fecha</td></tr>`;
        return;
    }

    partidos.forEach(p => {
        fixtureTable.innerHTML += `
            <tr>
                <td>${p.fecha}</td>
                <td><img src="${p.escudo_local}" width="30"> ${p.local}</td>
                <td>${p.goles_local}</td>
                <td>VS</td>
                <td>${p.goles_visita}</td>
                <td><img src="${p.escudo_visita}" width="30"> ${p.visitante}</td>
            </tr>
        `;
    });
}

function crearSelectorGrupos(gruposDisponibles, tablaData) {
    const selector = document.getElementById("grupo-select");
    selector.innerHTML = `<option value="todos">Todos los grupos</option>` +
        gruposDisponibles.map(z => `<option value="${z}">${z}</option>`).join("") +
        `<option value="bracket">Llave de Eliminación</option>`;

    selector.addEventListener("change", async function () {
        if (this.value === "bracket") {
            document.getElementById("tabla-container").style.display = "none";
            document.getElementById("bracket-container").style.display = "block";
            await cargarBracket();
        } else {
            document.getElementById("tabla-container").style.display = "block";
            document.getElementById("bracket-container").style.display = "none";
            mostrarTablaPorGrupo(tablaData, this.value);
        }
    });

    mostrarTablaPorGrupo(tablaData, selector.value);
}

async function cargarBracket() {
    try {
        const response = await fetch("../JSONs/resultadosbna.json");
        if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");
        const data = await response.json();
        const ligaData = data["Primera B Nacional"];
        
        if (!ligaData || !ligaData.fixture) {
            console.error("No hay datos de fixture disponibles");
            return;
        }

        const playoffMatches = ligaData.fixture.filter(match => {
            return match.fecha_torneo && (
                match.fecha_torneo.includes("Octavos") || 
                match.fecha_torneo.includes("Cuartos") || 
                match.fecha_torneo.includes("Semifinal") || 
                match.fecha_torneo.includes("Final")
            );
        });
        
        if (playoffMatches.length === 0) {
            document.getElementById('tournament-bracket').innerHTML = '<div class="bracket-empty"><div class="bracket-empty-text">No hay datos de llave disponibles todavía</div></div>';
            return;
        }

        const rounds = procesarRondasBNA(playoffMatches);
        const bracket = new TournamentBracket('tournament-bracket', ligaData);
        bracket.generateBracket(rounds);
    } catch (error) {
        console.error("Error al cargar el bracket:", error);
        document.getElementById('tournament-bracket').innerHTML = '<div class="bracket-empty"><div class="bracket-empty-text">Error al cargar los datos</div></div>';
    }
}

function procesarRondasBNA(matches) {
    const rondas = {};
    
    matches.forEach(match => {
        let ronda = match.fecha_torneo;
        
        if (!rondas[ronda]) {
            rondas[ronda] = [];
        }
        
        rondas[ronda].push({
            team1: match.local,
            team1_logo: match.escudo_local,
            team1_score: match.goles_local !== '-' ? parseInt(match.goles_local) || 0 : null,
            team2: match.visitante,
            team2_logo: match.escudo_visita,
            team2_score: match.goles_visita !== '-' ? parseInt(match.goles_visita) || 0 : null
        });
    });
    
    const rondasCombinadas = {};
    for (const ronda in rondas) {
        rondasCombinadas[ronda] = combinarPartidosIdaVuelta(rondas[ronda]);
    }
    
    return rondasCombinadas;
}

function combinarPartidosIdaVuelta(partidos) {
    const agrupados = {};
    const resultado = [];
    
    partidos.forEach(partido => {
        const equipos = [partido.team1, partido.team2].sort().join('_vs_');
        
        if (!agrupados[equipos]) {
            agrupados[equipos] = [];
        }
        agrupados[equipos].push(partido);
    });
    
    for (const key in agrupados) {
        const pareja = agrupados[key];
        
        if (pareja.length === 1) {
            resultado.push(pareja[0]);
        } else if (pareja.length >= 2) {
            const [p1, p2] = pareja;
            const equipos = key.split('_vs_');
            
            let score1 = 0;
            let score2 = 0;
            
            if (p1.team1_score !== null && p2.team2_score !== null) {
                score1 = (p1.team1 === equipos[0] ? p1.team1_score : p1.team2_score) + 
                         (p2.team1 === equipos[0] ? p2.team1_score : p2.team2_score);
                score2 = (p1.team1 === equipos[1] ? p1.team1_score : p1.team2_score) + 
                         (p2.team1 === equipos[1] ? p2.team1_score : p2.team2_score);
            }
            
            resultado.push({
                team1: equipos[0],
                team1_logo: p1.team1 === equipos[0] ? p1.team1_logo : p1.team2_logo,
                team1_score: score1,
                team2: equipos[1],
                team2_logo: p1.team1 === equipos[1] ? p1.team1_logo : p1.team2_logo,
                team2_score: score2
            });
        }
    }
    
    return resultado;
}

function mostrarTablaPorGrupo(tablaData, grupoSeleccionado) {
    const container = document.getElementById("tabla-posiciones-table");
    if (!tablaData || tablaData.length === 0) {
        container.innerHTML = "<div class='text-center p-4'>No hay datos disponibles</div>";
        return;
    }

    let dataAgrupada = tablaData.reduce((acc, equipo) => {
        const grupo = equipo.zona || "Sin grupo";
        if (!acc[grupo]) acc[grupo] = [];
        acc[grupo].push(equipo);
        return acc;
    }, {});

    const gruposOrdenados = Object.keys(dataAgrupada).sort((a, b) => a.localeCompare(b));
    container.innerHTML = "";

    gruposOrdenados.forEach(grupo => {
        if (grupoSeleccionado !== "todos" && grupo !== grupoSeleccionado) return;

        const equipos = dataAgrupada[grupo].sort((a, b) => a.posicion - b.posicion);
        
        let html = `
            <div class="grupo-block">
                <h3 class="grupo-titulo">${grupo}</h3>
                <div class="scrollable-table">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th class="text-left">Equipo</th>
                                <th>Pts</th>
                                <th>PJ</th>
                                <th>PG</th>
                                <th>PE</th>
                                <th>PP</th>
                                <th>GF</th>
                                <th>GC</th>
                                <th>DG</th>
                            </tr>
                        </thead>
                        <tbody>
        `;

        equipos.forEach((equipo, index) => {
            let claseFila = "";
            if (index == 0) { 
                claseFila = "zona-oro";
            }
            else if (index <= 7) { 
                claseFila = "zona-azul";
            }

            html += `
                <tr>
                    <td class="${claseFila} font-bold">${equipo.posicion}</td>
                    <td class="text-left">
                        <div class="flex-align-center justify-start">
                            <img src="${equipo.escudo}" class="team-logo-mini" loading="lazy" alt="${equipo.equipo}">
                            ${equipo.equipo}
                        </div>
                    </td>
                    <td class="font-bold">${equipo.puntos}</td>
                    <td>${equipo.pj}</td>
                    <td>${equipo.pg}</td>
                    <td>${equipo.pe}</td>
                    <td>${equipo.pp}</td>
                    <td>${equipo.gf}</td>
                    <td>${equipo.gc}</td>
                    <td>${equipo.dg}</td>
                </tr>
            `;
        });

        html += `</tbody></table></div></div>`;
        container.innerHTML += html;
    });
}

function mostrarGoleadores(data) {
    let tabla = document.getElementById("tabla-goleadores");
    if (!tabla || !data.length) {
        tabla.innerHTML = '<tr><td colspan="3">No hay datos de goleadores disponibles</td></tr>';
        return;
    }

    tabla.innerHTML = `
        <thead>
            <tr>
                <th>Jugador</th>
                <th>Equipo</th>
                <th>Goles</th>
            </tr>
        </thead>
        <tbody>
            ${data.map(g => `
                <tr>
                    <td>${g.nombre}</td>
                    <td><img src="${g.escudo}" alt="${g.equipo}" width="30"></td>
                    <td>${g.goles}</td>
                </tr>
            `).join("")}
        </tbody>
    `;
}
