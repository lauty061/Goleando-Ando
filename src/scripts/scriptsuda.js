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
        "Fecha 1": ["2025-04-01", "2025-04-03"],
        "Fecha 2": ["2025-04-08", "2025-04-10"],
        "Fecha 3": ["2025-04-22", "2025-04-24"],
        "Fecha 4": ["2025-05-06", "2025-05-08"],
        "Fecha 5": ["2025-05-13", "2025-05-15"],
        "Fecha 6": ["2025-05-27", "2025-05-29"],
        "Octavos": ["A confirmar", "A confirmar"],
        "Cuartos": ["A confirmar", "A confirmar"],
        "Semis": ["A confirmar", "A confirmar"],
        "Final": ["A confirmar", "A confirmar"],
    };

    let fechaSelect = document.getElementById("fecha-select");
    fechaSelect.innerHTML = Object.keys(fechasTorneo)
        .map(fecha => `<option value="${fecha}">${fecha}: del ${fechasTorneo[fecha][0]} al ${fechasTorneo[fecha][1]}</option>`)
        .join("");

    mostrarPartidos(fixtureData, "Fecha 1", fechasTorneo);
    mostrarTablaPosiciones(tablaPosicionesData);
    mostrarGoleadores(goleadoresData);
    llenarSelectorGrupos(tablaPosicionesData);

    fechaSelect.addEventListener("change", function () {
        mostrarPartidos(fixtureData, this.value, fechasTorneo);
    });

    document.getElementById("grupo-select").addEventListener("change", function () {
        mostrarTablaPosiciones(tablaPosicionesData, this.value);
    });
});

async function obtenerDatosLiga(liga) {
    try {
        let response = await fetch("../JSONs/resultadossuda.json");
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

function mostrarTablaPosiciones(tablaData, grupoSeleccionado = null) {
    const container = document.getElementById("tabla-posiciones-table");
    if (!tablaData || tablaData.length === 0) {
        container.innerHTML = "<p>No hay datos disponibles</p>";
        return;
    }

    const grupos = tablaData.reduce((acc, equipo) => {
        const grupo = equipo.grupo || "Sin grupo";
        if (!acc[grupo]) acc[grupo] = [];
        acc[grupo].push(equipo);
        return acc;
    }, {});

    container.innerHTML = "";

    for (const [grupo, equipos] of Object.entries(grupos)) {
        if (grupoSeleccionado && grupo !== grupoSeleccionado) continue;

        let html = `<h3 style="font-size: 1.4em;">${grupo}</h3>`;
        html += `
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
                <tbody>`;

        equipos.forEach((e, index) => {
            let style = "";
            if (index === 0 || index === 1) {
                style = ' style="background-color: #c8f7c5;"';
            } else if (index === 2) {
                style = ' style="background-color: #b2ebf2;"';
            }

            html += `
                <tr${style}>
                    <td>${e.posicion}</td>
                    <td><img src="${e.escudo}" width="30" height="30" alt="${e.equipo}"></td>
                    <td>${e.equipo}</td>
                    <td>${e.puntos}</td>
                    <td>${e.pj}</td>
                    <td>${e.pg}</td>
                    <td>${e.pe}</td>
                    <td>${e.pp}</td>
                    <td>${e.gf}</td>
                    <td>${e.gc}</td>
                    <td>${e.dg}</td>
                </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML += html;
    }
}

function llenarSelectorGrupos(tablaData) {
    const select = document.getElementById("grupo-select");
    const grupos = [...new Set(tablaData.map(e => e.grupo || "Sin grupo"))];
    select.innerHTML = `<option value="">Todos los grupos</option>` +
        grupos.map(g => `<option value="${g}">${g}</option>`).join("");
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
