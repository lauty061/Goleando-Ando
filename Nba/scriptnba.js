document.addEventListener("DOMContentLoaded", async function () {
    const liga = "NBA";
    let ligaData = await obtenerDatosLiga(liga);
    if (!ligaData) return;

    let fixtureData = ligaData.fixture || [];
    let tablaData = ligaData.tabla_posiciones || {};

    let conferenciaSelect = document.getElementById("conferencia-select");
    let conferencias = Object.keys(tablaData);
    conferenciaSelect.innerHTML = conferencias.map(c => `<option value="${c}">${c}</option>`).join("");

    mostrarPartidos(fixtureData);
    mostrarTablaPosiciones(tablaData[conferencias[0]]);

    conferenciaSelect.addEventListener("change", function () {
        mostrarTablaPosiciones(tablaData[this.value]);
    });
});

async function obtenerDatosLiga(liga) {
    try {
        let response = await fetch("resultadosnba.json");
        if (!response.ok) throw new Error("No se pudo cargar el archivo JSON");
        let data = await response.json();
        return data[liga] || null;
    } catch (error) {
        console.error("❌ Error al cargar los datos:", error);
        return null;
    }
}

function mostrarPartidos(fixtureData) {
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

    if (!fixtureData.length) {
        fixtureTable.innerHTML += `<tr><td colspan="6">No hay partidos disponibles</td></tr>`;
        return;
    }

    fixtureData.forEach(p => {
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
