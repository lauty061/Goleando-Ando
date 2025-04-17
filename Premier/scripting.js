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
        "Fecha 1": ["2024-08-16", "2024-08-19"],
        "Fecha 2": ["2024-08-23", "2024-08-26"],
        "Fecha 3": ["2024-08-30", "2024-09-02"],
        "Fecha 4": ["2024-09-13", "2024-09-16"],
        "Fecha 5": ["2024-09-20", "2024-09-23"],
        "Fecha 6": ["2024-09-27", "2024-09-30"],
        "Fecha 7": ["2024-10-04", "2024-10-07"],
        "Fecha 8": ["2024-10-18", "2024-10-21"],
        "Fecha 9": ["2024-10-25", "2024-10-28"],
        "Fecha 10": ["2024-11-01", "2024-11-04"],
        "Fecha 11": ["2024-11-08", "2024-11-11"],
        "Fecha 12": ["2024-11-22", "2024-11-25"],
        "Fecha 13": ["2024-11-29", "2024-12-02"],
        "Fecha 14": ["2024-12-03", "2024-12-05"],
        "Fecha 15": ["2024-12-17", "2024-12-12"],
        "Fecha 16": ["2024-12-14", "2024-12-16"],
        "Fecha 17": ["2024-12-21", "2024-12-22"],
        "Fecha 18": ["2025-12-26", "2025-12-27"],
        "Fecha 19": ["2025-12-29", "2025-01-01"],
        "Fecha 20": ["2025-01-04", "2025-01-06"],
        "Fecha 21": ["2025-01-14", "2025-01-16"],
        "Fecha 22": ["2025-01-18", "2025-01-20"],
        "Fecha 23": ["2025-01-25", "2025-01-26"],
        "Fecha 24": ["2025-02-01", "2025-02-03"],
        "Fecha 25": ["2025-02-14", "2025-02-16"],
        "Fecha 26": ["2025-02-21", "2025-03-22"],
        "Fecha 27": ["2025-02-25", "2025-02-27"],
        "Fecha 28": ["2025-03-08", "2025-03-10"],
        "Fecha 29": ["2025-03-15", "2025-03-16"],
        "Fecha 30": ["2025-04-01", "2025-04-04"],
        "Fecha 31": ["2025-04-05", "2025-04-07"],
        "Fecha 32": ["2025-04-12", "2025-04-14"],
        "Fecha 33": ["2025-04-19", "2025-04-21"],
        "Fecha 34": ["2025-04-22", "2025-05-01"],
        "Fecha 35": ["2025-05-02", "2025-05-05"],
        "Fecha 36": ["2025-05-10", "2025-05-11"],
        "Fecha 37": ["2025-05-18", "2025-05-18"],
        "Fecha 38": ["2025-05-25", "2025-05-25"]
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
        let response = await fetch("resultadosing.json");
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
                colorFondo = "background-color: gold;";
                break;
            case 1:
            case 2:
            case 3:
            case 4:
                colorFondo = "background-color: lightblue;";
                break;
            case 5:
                colorFondo = "background-color: orange;";
                break;
            case 6:
                colorFondo = "background-color: lightgreen;";
                break;
            case 17:
            case 18:
            case 19:
                colorFondo = "background-color: #FF483D;";
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