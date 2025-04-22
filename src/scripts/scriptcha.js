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
        "Fecha 1": ["2024-09-17", "2024-09-19"],
        "Fecha 2": ["2024-10-01", "2024-10-02"],
        "Fecha 3": ["2024-10-22", "2024-10-23"],
        "Fecha 4": ["2024-11-05", "2024-11-06"],
        "Fecha 5": ["2024-11-26", "2024-11-27"],
        "Fecha 6": ["2024-12-10", "2024-12-11"],
        "Fecha 7": ["2025-01-21", "2025-01-22"],
        "Fecha 8": ["2025-01-29", "2025-01-29"],
        "PlayOff": ["2025-02-11", "2025-02-19"],
        "Octavos": ["2025-03-04", "2025-03-12"],
        "Cuartos": ["2025-04-08", "2025-04-16"],
        "Semis":   ["2025-04-29", "2025-05-06"],
        "Final":   ["2025-05-31", "2025-05-31"],
    };


    let fechaSelect = document.getElementById("fecha-select");
    fechaSelect.innerHTML = Object.keys(fechasTorneo)
        .map(fecha => `<option value="${fecha}">${fecha}: del ${fechasTorneo[fecha][0]} al ${fechasTorneo[fecha][1]}</option>`)
        .join("");

    mostrarPartidos(fixtureData, "Fecha 1", fechasTorneo);
    mostrarTablaPosiciones(tablaPosicionesData);
    mostrarGoleadores(goleadoresData);

    fechaSelect.addEventListener("change", function () {
        mostrarPartidos(fixtureData, this.value, fechasTorneo);
    });
});

async function obtenerDatosLiga(liga) {
    try {
        let response = await fetch("/src/JSONs/resultadoscha.json");
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

function mostrarTablaPosiciones(tablaData) {
    let tabla = document.getElementById("tabla-posiciones-table");

    if (!tablaData || tablaData.length === 0) {
        tabla.innerHTML = "<tr><td colspan='10'>No hay datos disponibles</td></tr>";
        return;
    }

    tabla.innerHTML = `
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
    `;

    tablaData.forEach((equipo, index) => {
        let colorFondo = "";
        switch (index) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
                colorFondo = "background-color: lightblue";
                break;
            case 8:
            case 9:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 15:
            case 16:
            case 17:
            case 18:
            case 19:
            case 20:
            case 21:
            case 22:
            case 23:
                colorFondo = "background-color: orange";
                break;
        }
        tabla.innerHTML += `
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
