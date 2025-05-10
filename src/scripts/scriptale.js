document.addEventListener("DOMContentLoaded", async function () {
    // Obtiene el nombre de la liga desde el encabezado
    let ligaElement = document.getElementById("titulo-liga");
    if (!ligaElement) return;

    let liga = ligaElement.innerText.trim();
    // Carga los datos desde el archivo JSON
    let ligaData = await obtenerDatosLiga(liga);
    if (!ligaData) return;

    let fixtureData = ligaData.fixture || [];
    let tablaPosicionesData = ligaData.tabla_posiciones || [];
    let goleadoresData = ligaData.goleadores || [];

    // Fechas de ligas
    let fechasTorneo = {
        "Fecha 1": ["2024-08-23", "2024-08-25"],
        "Fecha 2": ["2024-08-30", "2024-09-01"],
        "Fecha 3": ["2024-09-13", "2024-09-15"],
        "Fecha 4": ["2024-09-20", "2024-09-22"],
        "Fecha 5": ["2024-09-27", "2024-09-29"],
        "Fecha 6": ["2024-10-04", "2024-10-06"],
        "Fecha 7": ["2024-10-18", "2024-10-20"],
        "Fecha 8": ["2024-10-25", "2024-10-27"],
        "Fecha 9": ["2024-11-01", "2024-11-03"],
        "Fecha 10": ["2024-11-08", "2024-11-10"],
        "Fecha 11": ["2024-11-22", "2024-11-24"],
        "Fecha 12": ["2024-11-29", "2024-12-01"],
        "Fecha 13": ["2024-12-06", "2024-12-08"],
        "Fecha 14": ["2024-12-13", "2024-12-15"],
        "Fecha 15": ["2024-12-20", "2024-12-22"],
        "Fecha 16": ["2025-01-10", "2025-01-12"],
        "Fecha 17": ["2025-01-14", "2025-01-15"],
        "Fecha 18": ["2025-01-17", "2025-01-19"],
        "Fecha 19": ["2025-01-24", "2025-01-26"],
        "Fecha 20": ["2025-01-31", "2025-02-02"],
        "Fecha 21": ["2025-02-07", "2025-02-09"],
        "Fecha 22": ["2025-02-14", "2025-02-16"],
        "Fecha 23": ["2025-02-21", "2025-02-23"],
        "Fecha 24": ["2025-02-28", "2025-03-02"],
        "Fecha 25": ["2025-03-07", "2025-03-09"],
        "Fecha 26": ["2025-03-14", "2025-03-16"],
        "Fecha 27": ["2025-03-28", "2025-03-30"],
        "Fecha 28": ["2025-04-04", "2025-04-06"],
        "Fecha 29": ["2025-04-11", "2025-04-13"],
        "Fecha 30": ["2025-04-19", "2025-04-20"],
        "Fecha 31": ["2025-04-25", "2025-04-27"],
        "Fecha 32": ["2025-05-02", "2025-05-04"],
        "Fecha 33": ["2025-05-09", "2025-05-11"],
        "Fecha 34": ["2025-05-17", "2025-05-1"]
    };
    // Rellenar el <select> de fechas con opciones
    let fechaSelect = document.getElementById("fecha-select");
    fechaSelect.innerHTML = Object.keys(fechasTorneo)
        .map(fecha => `<option value="${fecha}">${fecha}: del ${fechasTorneo[fecha][0]} al ${fechasTorneo[fecha][1]}</option>`)
        .join("");
    
    // Mostrar datos iniciales (por defecto Fecha 1)
    mostrarPartidos(fixtureData, "Fecha 1", fechasTorneo);
    mostrarTablaPosiciones(tablaPosicionesData);
    mostrarGoleadores(goleadoresData);

    // Mostrar partidos al cambiar la fecha seleccionada
    fechaSelect.addEventListener("change", function () {
        mostrarPartidos(fixtureData, this.value, fechasTorneo);
    });
});
    // Carga el archivo JSON local y devuelve los datos de la liga especificada
async function obtenerDatosLiga(liga) {
    try {
        let response = await fetch("../JSONs/resultadosale.json");
        if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");
        let data = await response.json();
        return data[liga] || null;
    } catch (error) {
        console.error("❌ Error al cargar los datos:", error);
        return null;
    }
}
    // Convierte fecha en formato dd/mm/yyyy a yyyy-mm-dd para poder compararlas
function convertirFecha(fechaStr) {
    let match = fechaStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return "";
    return `${match[3]}-${match[2]}-${match[1]}`;
}
    // Renderiza los partidos de la jornada seleccionada
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
    // Insertar filas para cada partido
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

    // Colores de la tabla de posiciones
    tablaData.forEach((equipo, index) => {
        let colorFondo = "";
        switch (index) {
            case 0:
                colorFondo = "background-color: #ebd442;";
                break;
            case 1:
            case 2:
            case 3:
                colorFondo = "background-color: #649cd9;";
                break;
            case 4:
                colorFondo = "background-color: #FF751C;";
                break;
            case 5:
                colorFondo = "background-color: #82d15a;";
                break;
            case 15:
                colorFondo = "background-color: #f77239;";
                break;
            case 16:
            case 17:
                colorFondo = "background-color: #f23d3a;";
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
    // Tabla de goleadores
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



