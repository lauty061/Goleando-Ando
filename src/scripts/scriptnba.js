document.addEventListener("DOMContentLoaded", async function () {
    const liga = "NBA";
    let ligaData = await obtenerDatosLiga(liga);
    if (!ligaData) return;

    let fixtureData = ligaData.fixture || [];
    let tablaData = ligaData.tabla_posiciones || {};
    let estadisticasData = ligaData.estadisticas_jugadores || [];

    mostrarEstadisticas(estadisticasData);

    let conferenciaSelect = document.getElementById("conferencia-select");
    let conferencias = Object.keys(tablaData);
    conferenciaSelect.innerHTML = conferencias.map(c => `<option value="${c}">${c}</option>`).join("");

    const rondas = [...new Set(fixtureData.map(p => p.fecha_torneo))];
    const rondaSelect = document.getElementById("ronda-select");
    rondaSelect.innerHTML = rondas.map(r => `<option value="${r}">${r}</option>`).join("");

    mostrarPartidos(fixtureData, rondas[0]);
    mostrarTablaPosiciones(tablaData[conferencias[0]]);

    conferenciaSelect.addEventListener("change", function () {
        mostrarTablaPosiciones(tablaData[this.value]);
    });

    rondaSelect.addEventListener("change", function () {
        mostrarPartidos(fixtureData, this.value);
    });
});

async function obtenerDatosLiga(liga) {
    try {
        let response = await fetch("../JSONs/resultadosnba.json");
        if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");
        let data = await response.json();
        return data[liga] || null;
    } catch (error) {
        console.error("❌ Error al cargar los datos:", error);
        return null;
    }
}

function mostrarPartidos(fixtureData, rondaSeleccionada) {
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

    const partidos = fixtureData.filter(p => p.fecha_torneo === rondaSeleccionada);

    if (!partidos.length) {
        fixtureTable.innerHTML += `<tr><td colspan="6">No hay partidos disponibles</td></tr>`;
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

    if (!tablaData || !tablaData.length) {
        tabla.innerHTML = "<tr><td colspan='10'>No hay datos disponibles</td></tr>";
        return;
    }

    tabla.innerHTML = `
        <tr>
            <th>#</th>
            <th>Escudo</th>
            <th>Equipo</th>
            <th>%PG</th>
            <th>Pts</th>
            <th>PJ</th>
            <th>PP</th>
            <th>PF</th>
            <th>PC</th>
            <th>DG</th>
        </tr>
    `;

    tablaData.forEach((equipo, index) => {
        tabla.innerHTML += `
            <tr>
                <td>${equipo.posicion}</td>
                <td><img src="${equipo.escudo}" width="30" height="30" alt="${equipo.equipo}"></td>
                <td>${equipo.equipo}</td>
                <td>${equipo.porcentaje_pg}</td>
                <td>${equipo.puntos}</td>
                <td>${equipo.pj}</td>
                <td>${equipo.pp}</td>
                <td>${equipo.pf}</td>
                <td>${equipo.pc}</td>
                <td>${equipo.dg}</td>
            </tr>
        `;
    });
}

function mostrarEstadisticas(estadisticas) {
    const tabla = document.getElementById("tabla-estadisticas-jugadores");
    if (!estadisticas || !estadisticas.length) {
        tabla.innerHTML = "<tr><td colspan='12'>No hay datos disponibles</td></tr>";
        return;
    }

    tabla.innerHTML = `
    <tr>
        <th>Jugador</th>
        <th>Logo</th>
        <th>Equipo</th>
        <th>PJ</th>
        <th>PP</th>
        <th>PTS</th>
        <th>REB</th>
        <th>AST</th>
        <th>ROB</th>
        <th>FG%</th>
        <th>FT%</th>
        <th>3P%</th>
    </tr>
    `;

    estadisticas.forEach(j => {
        tabla.innerHTML += `
        <tr>
            <td>${j.jugador}</td>
            <td><img src="${j.logo}" alt="${j.equipo}" width="30" height="30"></td>
            <td>${j.equipo}</td>
            <td>${j.pj}</td>
            <td>${j.pp}</td>
            <td>${j.pts}</td>
            <td>${j.reb}</td>
            <td>${j.ast}</td>
            <td>${j.rob}</td>
            <td>${j["fg%"]}</td>
            <td>${j["ft%"]}</td>
            <td>${j["3p%"]}</td>
        </tr>
        `;
    });
}