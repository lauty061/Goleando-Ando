// archivo: actualizar_tabla_posiciones.js
document.addEventListener("DOMContentLoaded", async function () {
    let ligaElement = document.getElementById("titulo-liga");
    if (!ligaElement) return;

    let liga = ligaElement.innerText.trim();
    let ligaData = await obtenerDatosLiga(liga);
    if (!ligaData) return;

    let fixtureData = ligaData.fixture || [];
    let tablaPosicionesData = ligaData.tabla_posiciones || [];
    let goleadoresData = ligaData.goleadores || [];

    // Asignar zona 'Apertura' si no existe
    tablaPosicionesData.forEach(equipo => {
        if (!equipo.zona) {
            equipo.zona = "Apertura";
        }
    });

    let fechasTorneo = {
        "Fecha 1": ["2025-02-21", "2025-02-24"],
        "Fecha 2": ["2025-02-14", "2025-02-17"],
        "Fecha 3": ["2025-02-21", "2025-02-24"],
        "Fecha 4": ["2025-02-27", "2025-03-02"],
        "Fecha 5": ["2025-03-07", "2025-03-10"],
        "Fecha 6": ["2025-03-27", "2025-03-30"],
        "Fecha 7": ["2025-04-04", "2025-04-06"],
        "Fecha 8": ["2025-04-11", "2025-04-14"],
        "Fecha 9": ["2025-04-17", "2025-04-20"],
        "Fecha 10": ["2025-04-26", "2025-04-28"],
        "Fecha 11": ["2025-05-01", "2025-05-04"],
        "Fecha 12": ["2025-05-09", "2025-05-12"],
        "Fecha 13": ["2025-05-16", "2025-05-19"],
        "Fecha 14": ["2025-05-20", "2025-05-20"],
        "Fecha 15": ["Sin Designar", "Sin Designar"],
        "Fecha 16": ["Sin Designar", "Sin Designar"],
        "Fecha 17": ["Sin Designar", "Sin Designar"],
        "Fecha 18": ["Sin Designar", "Sin Designar"],
        "Fecha 19": ["Sin Designar", "Sin Designar"],
    };

    let fechaSelect = document.getElementById("fecha-select");
    fechaSelect.innerHTML = Object.keys(fechasTorneo)
        .map(fecha => `<option value="${fecha}">${fecha}: del ${fechasTorneo[fecha][0]} al ${fechasTorneo[fecha][1]}</option>`)
        .join("");

    mostrarPartidos(fixtureData, "Fecha 1", fechasTorneo);
    crearSelectorTablas(tablaPosicionesData);
    mostrarGoleadores(goleadoresData);

    fechaSelect.addEventListener("change", function () {
        mostrarPartidos(fixtureData, this.value, fechasTorneo);
    });
});

async function obtenerDatosLiga(liga) {
    try {
        let response = await fetch("../JSONs/resultadosperu.json");
        if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");
        let data = await response.json();
        return data[liga] || null;
    } catch (error) {
        console.error("Error al cargar los datos:", error);
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
                <td>${p.goles_local ?? ""}</td>
                <td>VS</td>
                <td>${p.goles_visita ?? ""}</td>
                <td><img src="${p.escudo_visita}" width="30"> ${p.visitante}</td>
            </tr>
        `;
    });
}

function crearSelectorTablas(tablaData) {
    const selector = document.getElementById("grupo-select");
    const opciones = [
        `<option value="apertura">Apertura</option>`,
        `<option value="anual">Tabla Anual</option>`,
    ];
    selector.innerHTML = opciones.join("");

    selector.addEventListener("change", function () {
        if (this.value === "anual") {
            mostrarTablaAnual(tablaData);
        } else {
            mostrarTablaPorGrupo(tablaData, "Apertura");
        }
    });

    mostrarTablaPorGrupo(tablaData, "Apertura");
}

function mostrarTablaPorGrupo(tablaData, grupoSeleccionado) {
    const container = document.getElementById("tabla-posiciones-table");
    if (!tablaData.length) {
        container.innerHTML = "<p>No hay datos disponibles</p>";
        return;
    }

    let equipos = tablaData.filter(e => (e.zona || "").toLowerCase() === grupoSeleccionado.toLowerCase());
    equipos.sort((a, b) => a.posicion - b.posicion);

    let html = `
        <h3>${grupoSeleccionado}</h3>
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
                ${equipos.map(e => {
                    let colorFondo = "";
                    if (parseInt(e.posicion) === 1) {
                        colorFondo = "background-color: #ebd442;";
                    }
                    return `
                        <tr style="${colorFondo}">
                            <td>${e.posicion}</td>
                            <td><img src="${e.escudo}" width="30"></td>
                            <td>${e.equipo}</td>
                            <td>${e.puntos}</td>
                            <td>${e.pj}</td>
                            <td>${e.pg}</td>
                            <td>${e.pe}</td>
                            <td>${e.pp}</td>
                            <td>${e.gf}</td>
                            <td>${e.gc}</td>
                            <td>${e.dg}</td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function mostrarTablaAnual(tablaData) {
    const container = document.getElementById("tabla-posiciones-table");
    if (!tablaData.length) {
        container.innerHTML = "<p>No hay datos disponibles</p>";
        return;
    }

    let equipos = [...tablaData];
    equipos.sort((a, b) => b.puntos - a.puntos || b.dg - a.dg || b.gf - a.gf);
    equipos.forEach((e, i) => e.posicion = i + 1);

    let html = `
        <h3>Tabla Anual</h3>
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
                ${equipos.map(e => {
                    let colorFondo = "";
                    if (e.posicion >= 1 && e.posicion <= 2) {
                        colorFondo = "background-color: #bfb662;";
                    } else if (e.posicion >= 3 && e.posicion <= 6) {
                        colorFondo = "background-color: #649cd9;";
                    }
                    else if (e.posicion >= 17 && e.posicion <= 19) {
                        colorFondo = "background-color: #f23d3a;";
                    }
                    return `
                        <tr style="${colorFondo}">
                            <td>${e.posicion}</td>
                            <td><img src="${e.escudo}" width="30"></td>
                            <td>${e.equipo}</td>
                            <td>${e.puntos}</td>
                            <td>${e.pj}</td>
                            <td>${e.pg}</td>
                            <td>${e.pe}</td>
                            <td>${e.pp}</td>
                            <td>${e.gf}</td>
                            <td>${e.gc}</td>
                            <td>${e.dg}</td>
                        </tr>
                    `;
                }).join("")}
            </tbody>
        </table>
    `;

    container.innerHTML = html;
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
