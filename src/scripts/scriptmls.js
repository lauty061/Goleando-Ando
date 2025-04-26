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
        "Semana 1": ["2025-02-22", "2025-02-23"],
        "Semana 2": ["2025-03-01", "2025-03-03"],
        "Semana 3": ["2025-03-08", "2025-03-09"],
        "Semana 4": ["2025-03-15", "2025-03-16"],
        "Semana 5": ["2025-03-22", "2025-03-23"],
        "Semana 6": ["2025-03-29", "2025-03-30"],
        "Semana 7": ["2025-04-05", "2025-04-06"],
        "Semana 8": ["2025-04-12", "2025-04-13"],
        "Semana 9": ["2025-04-19", "2025-04-19"],
        "Semana 10": ["2025-04-26", "2025-04-27"],
        "Semana 11": ["2025-05-03", "2025-05-04"],
        "Semana 12": ["2025-05-10", "2025-04-11"],
        "Semana 13": ["2025-05-14", "2025-05-18"],
        "Semana 14": ["2025-05-24", "2025-05-25"],
        "Semana 15": ["2025-05-28", "2025-06-01"],
        "Semana 16": ["2025-06-07", "2025-06-08"],
        "Semana 17": ["2025-06-12", "2025-06-14"],
        "Semana 18": ["2025-06-25", "2025-06-29"],
        "Semana 19": ["2025-07-03", "2025-07-06"],
        "Semana 20": ["2025-07-09", "2025-07-13"],
        "Semana 21": ["2025-07-16", "2025-07-19"],
        "Semana 22": ["2025-07-25", "2025-07-26"],
        "Semana 23": ["2025-08-09", "2025-08-10"],
        "Semana 24": ["2025-08-16", "2025-08-17"],
        "Semana 25": ["2025-08-23", "2025-08-24"],
        "Semana 26": ["2025-08-30", "2025-08-31"],
        "Semana 27": ["2025-09-06", "2025-09-06"],
        "Semana 28": ["2025-09-13", "2025-09-13"],
        "Semana 29": ["2025-09-16", "2025-09-21"],
        "Semana 30": ["2025-09-24", "2025-09-27"],
        "Semana 31": ["2025-10-04", "2025-10-05"],
        "Semana 32": ["2025-10-18", "2025-10-18"]
    };

    let fechaSelect = document.getElementById("fecha-select");
    fechaSelect.innerHTML = Object.keys(fechasTorneo)
        .map(fecha => `<option value="${fecha}">${fecha}: del ${fechasTorneo[fecha][0]} al ${fechasTorneo[fecha][1]}</option>`)
        .join("");

    mostrarPartidos(fixtureData, "Semana 1", fechasTorneo);
    let zonasUnicas = [...new Set(tablaPosicionesData.map(e => e.zona))];
    crearSelectorGrupos(zonasUnicas, tablaPosicionesData);
    mostrarGoleadores(goleadoresData);

    fechaSelect.addEventListener("change", function () {
        mostrarPartidos(fixtureData, this.value, fechasTorneo);
    });
});

async function obtenerDatosLiga(liga) {
    try {
        let response = await fetch("../JSONs/resultadosmls.json");
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
        gruposDisponibles.map(z => `<option value="${z}">${z}</option>`).join("");

    selector.addEventListener("change", function () {
        mostrarTablaPorGrupo(tablaData, this.value);
    });

    mostrarTablaPorGrupo(tablaData, selector.value);
}

function mostrarTablaPorGrupo(tablaData, grupoSeleccionado) {
    const container = document.getElementById("tabla-posiciones-table");
    if (!tablaData || tablaData.length === 0) {
        container.innerHTML = "<p>No hay datos disponibles</p>";
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
            <h3>${grupo}</h3>
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Escudo</th>
                        <th>Equipo</th>
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
            let colorFondo = "";
            switch (index) {
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                    colorFondo = "background-color: #649cd9;";
                    break;
                case 7:
                case 8:
                    colorFondo = "background-color: #FF751C;";
                    break;
            }
            html += `
                <tr style="${colorFondo}">
                    <td>${equipo.posicion}</td>
                    <td><img src="${equipo.escudo}" width="30" height="30" alt="${equipo.equipo}"></td>
                    <td>${equipo.equipo}</td>
                    <td>${equipo.puntos}</td>
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

        html += `</tbody></table>`;
        container.innerHTML += html;
    });
}


function crearSelectorGrupos(gruposDisponibles, tablaData) {
    const selector = document.getElementById("grupo-select");
    const opciones = [
        `<option value="todos">Todos los grupos</option>`,
        ...gruposDisponibles.map(z => `<option value="${z}">${z}</option>`),
    ];
    selector.innerHTML = opciones.join("");

    selector.addEventListener("change", function () {{
            mostrarTablaPorGrupo(tablaData, this.value);
        }
    });

    mostrarTablaPorGrupo(tablaData, selector.value);
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
