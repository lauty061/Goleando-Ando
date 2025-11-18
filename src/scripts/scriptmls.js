document.addEventListener("DOMContentLoaded", async function () {
    let ligaElement = document.getElementById("titulo-liga");
    if (!ligaElement) return;

    let liga = ligaElement.innerText.trim();
    let ligaData = await obtenerDatosLiga(liga);
    if (!ligaData) return;

    let fixtureData = ligaData.fixture || [];
    let tablaPosicionesData = ligaData.tabla_posiciones || [];
    let goleadoresData = ligaData.goleadores || [];

    let fechasUnicas = [...new Set(fixtureData.map(p => p.fecha_torneo))];

    let fechaSelect = document.getElementById("fecha-select");
    fechaSelect.innerHTML = fechasUnicas
        .map(fecha => `<option value="${fecha}">${fecha}</option>`)
        .join("");

    if (fechasUnicas.length > 0) {
        mostrarPartidos(fixtureData, fechasUnicas[0]);
    }
    
    fechaSelect.addEventListener("change", function () {
        mostrarPartidos(fixtureData, this.value);
    });
    let zonasUnicas = [...new Set(tablaPosicionesData.map(e => e.zona))];
    crearSelectorGrupos(zonasUnicas, tablaPosicionesData);
    
    loadBracket("../JSONs/resultadosmls.json", "tournament-bracket");
    
    mostrarGoleadores(goleadoresData);
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

function mostrarPartidos(fixtureData, jornadaSeleccionada) {
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

    let partidos = fixtureData.filter(p => p.fecha_torneo === jornadaSeleccionada);

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
        `<option value="bracket">Llave de Eliminación</option>`
    ];
    selector.innerHTML = opciones.join("");

    selector.addEventListener("change", function () {
        const valor = this.value;
        if (valor === "bracket") {
            document.getElementById("bracket-container").style.display = "block";
            document.getElementById("tabla-container").style.display = "none";
        } else {
            document.getElementById("bracket-container").style.display = "none";
            document.getElementById("tabla-container").style.display = "block";
            mostrarTablaPorGrupo(tablaData, valor);
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
