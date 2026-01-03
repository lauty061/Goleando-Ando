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
    
    if (typeof loadBracket === "function") {
        loadBracket("../JSONs/resultadosmls.json", "tournament-bracket");
    }
    
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
        <thead>
            <tr>
                <th>Fecha</th>
                <th class="text-right">Local</th>
                <th>Res</th>
                <th class="text-left">Visita</th>
            </tr>
        </thead>
        <tbody>
    `;

    let partidos = fixtureData.filter(p => p.fecha_torneo === jornadaSeleccionada);

    if (partidos.length === 0) {
        fixtureTable.innerHTML += `<tr><td colspan="4" class="text-center">No hay partidos para esta fecha</td></tr></tbody>`;
        return;
    }

    partidos.forEach(p => {
        fixtureTable.innerHTML += `
            <tr>
                <td>${p.fecha}</td>
                <td class="text-right">
                    <div class="flex-align-center justify-end">
                        ${p.local} <img src="${p.escudo_local}" class="team-logo-mini">
                    </div>
                </td>
                <td class="font-bold result-cell">${p.goles_local} - ${p.goles_visita}</td>
                <td class="text-left">
                    <div class="flex-align-center justify-start">
                        <img src="${p.escudo_visita}" class="team-logo-mini"> ${p.visitante}
                    </div>
                </td>
            </tr>
        `;
    });
    fixtureTable.innerHTML += `</tbody>`;
}

function crearSelectorGrupos(gruposDisponibles, tablaData) {
    const selector = document.getElementById("grupo-select");
    const opciones = [
        `<option value="todos">Todas las Conferencias</option>`,
        ...gruposDisponibles.map(z => `<option value="${z}">${z}</option>`),
        `<option value="bracket">Llave de Eliminación</option>`
    ];
    selector.innerHTML = opciones.join("");

    selector.addEventListener("change", function () {
        const valor = this.value;
        const bracketContainer = document.getElementById("bracket-container");
        const tablaContainer = document.getElementById("tabla-container") || document.getElementById("posiciones");

        if (valor === "bracket" && bracketContainer) {
            bracketContainer.style.display = "block";
            if(tablaContainer) tablaContainer.style.display = "none";
        } else {
            if(bracketContainer) bracketContainer.style.display = "none";
            if(tablaContainer) tablaContainer.style.display = "block";
            mostrarTablaPorConferencia(tablaData, valor);
        }
    });

    mostrarTablaPorConferencia(tablaData, selector.value);
}

function mostrarTablaPorConferencia(tablaData, grupoSeleccionado) {
    const container = document.getElementById("tabla-posiciones-table");
    if (!tablaData || tablaData.length === 0) {
        container.innerHTML = "<div class='text-center p-4'>No hay datos disponibles</div>";
        return;
    }

    let dataAgrupada = tablaData.reduce((acc, equipo) => {
        const grupo = equipo.zona || "General";
        if (!acc[grupo]) acc[grupo] = [];
        acc[grupo].push(equipo);
        return acc;
    }, {});

    const gruposOrdenados = Object.keys(dataAgrupada).sort();
    container.innerHTML = "";

    gruposOrdenados.forEach(grupo => {
        if (grupoSeleccionado !== "todos" && grupo !== grupoSeleccionado) return;

        const equipos = dataAgrupada[grupo].sort((a, b) => a.posicion - b.posicion);
        
        let html = `
            <div class="grupo-block">
                <h3 class="grupo-titulo">${grupo}</h3>
                <div class="scrollable-table">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th class="text-left">Equipo</th>
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
            let claseFila = "";
            let pos = parseInt(equipo.posicion);

            if (pos <= 7) { 
                claseFila = "zona-oro"; 
            } else if (pos <= 9) {
                claseFila = "zona-azul";
            }

            html += `
                <tr>
                    <td class="${claseFila} font-bold">${equipo.posicion}</td>
                    <td class="text-left">
                        <div class="flex-align-center justify-start">
                            <img src="${equipo.escudo}" class="team-logo-mini" loading="lazy" alt="${equipo.equipo}">
                            ${equipo.equipo}
                        </div>
                    </td>
                    <td class="font-bold">${equipo.puntos}</td>
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

        html += `</tbody></table></div></div>`;
        container.innerHTML += html;
    });
}

function mostrarGoleadores(data) {
    let tabla = document.getElementById("tabla-goleadores");
    if (!tabla || !data.length) {
        if(tabla) tabla.innerHTML = '<tr><td colspan="3" class="text-center">No hay datos de goleadores disponibles</td></tr>';
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
                    <td><img src="${g.escudo}" alt="${g.equipo}" class="team-logo-mini"></td>
                    <td class="font-bold">${g.goles}</td>
                </tr>
            `).join("")}
        </tbody>
    `;
}