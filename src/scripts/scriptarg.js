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
        "Fecha 1": ["2025-01-23", "2025-01-26"],
        "Fecha 2": ["2025-01-27", "2025-01-30"],
        "Fecha 3": ["2025-02-01", "2025-02-04"],
        "Fecha 4": ["2025-02-06", "2025-02-09"],
        "Fecha 5": ["2025-02-11", "2025-02-13"],
        "Fecha 6": ["2025-02-14", "2025-02-17"],
        "Fecha 7": ["2025-02-21", "2025-02-24"],
        "Fecha 8": ["2025-02-28", "2025-03-04"],
        "Fecha 9": ["2025-03-07", "2025-03-10"],
        "Fecha 10": ["2025-03-14", "2025-03-17"],
        "Fecha 11": ["2025-03-27", "2025-03-30"],
        "Fecha 12": ["2025-04-04", "2025-04-07"],
        "Fecha 13": ["2025-04-11", "2025-04-15"],
        "Fecha 14": ["2025-04-18", "2025-04-22"],
        "Fecha 15": ["2025-04-26", "2025-04-29"],
        "Fecha 16": ["2025-05-04", "2025-05-04"]
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
        let response = await fetch("../JSONs/resultadosarg.json");
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
        const equipos = dataAgrupada[grupo];
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

        equipos.forEach(equipo => {
            html += `
                <tr>
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
                </tr>`;
        });

        html += `</tbody></table>`;
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
