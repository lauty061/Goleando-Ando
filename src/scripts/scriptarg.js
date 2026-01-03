let currentFechaIndex = 0;
let fechasUnicas = [];
let fixtureDataGlobal = [];

document.addEventListener("DOMContentLoaded", async function () {
    let ligaElement = document.getElementById("titulo-liga");
    if (!ligaElement) return;

    let liga = ligaElement.innerText.trim();
    let ligaData = await obtenerDatosLiga(liga);
    if (!ligaData) return;

    fixtureDataGlobal = ligaData.fixture || [];
    let tablaPosicionesData = ligaData.tabla_posiciones || [];
    let goleadoresData = ligaData.goleadores || [];

    fechasUnicas = [...new Set(fixtureDataGlobal.map(p => p.fecha_torneo))];

    const fechaSelect = document.getElementById("fecha-select");
    fechaSelect.innerHTML = fechasUnicas
        .map(fecha => `<option value="${fecha}">${fecha}</option>`)
        .join("");

    if (fechasUnicas.length > 0) {
        currentFechaIndex = detectCurrentFecha(fixtureDataGlobal, fechasUnicas);
        updateFechaDisplay();
        mostrarPartidos(fixtureDataGlobal, fechasUnicas[currentFechaIndex]);
    }

    document.getElementById("fecha-prev").addEventListener("click", () => navigateFecha(-1));
    document.getElementById("fecha-next").addEventListener("click", () => navigateFecha(1));
    
    fechaSelect.addEventListener("change", function() {
        const selectedFecha = this.value;
        currentFechaIndex = fechasUnicas.indexOf(selectedFecha);
        updateFechaDisplay();
        mostrarPartidos(fixtureDataGlobal, selectedFecha);
    });

    let zonasUnicas = [...new Set(tablaPosicionesData.map(e => e.zona))];
    crearSelectorGrupos(zonasUnicas, tablaPosicionesData);

    loadBracket("../JSONs/resultadosarg.json", "tournament-bracket");

    mostrarGoleadores(goleadoresData);
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
        container.innerHTML = "<div class='text-center p-4'>No hay datos disponibles</div>";
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
            if (index <= 7) { 
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

function mostrarTablaAnual(tablaData) {
    const container = document.getElementById("tabla-posiciones-table");
    if (!tablaData || tablaData.length === 0) {
        container.innerHTML = "<div class='text-center'>No hay datos disponibles</div>";
        return;
    }

    let equiposMap = new Map();

    tablaData.forEach(e => {
        if (!equiposMap.has(e.equipo)) {
            equiposMap.set(e.equipo, {
                ...e,
                zona: "Tabla Anual"
            });
        }
    });

    let equipos = Array.from(equiposMap.values());

    equipos.sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        if (b.dg !== a.dg) return b.dg - a.dg;
        return b.gf - a.gf;
    });

    equipos.forEach((e, i) => e.posicion = i + 1);

    let html = `
        <h3 class="grupo-titulo">Tabla Anual</h3>
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

    equipos.forEach(e => {
        let claseFila = "";
        if (e.posicion >= 1 && e.posicion <= 3) claseFila = "zona-oro";
        else if (e.posicion >= 4 && e.posicion <= 9) claseFila = "zona-azul";
        else if (e.posicion === 30) claseFila = "zona-roja";

        html += `
            <tr>
                <td class="${claseFila} font-bold">${e.posicion}</td>
                <td class="text-left">
                    <div class="flex-align-center justify-start">
                        <img src="${e.escudo}" class="team-logo-mini" loading="lazy" alt="${e.equipo}">
                        ${e.equipo}
                    </div>
                </td>
                <td class="font-bold">${e.puntos}</td>
                <td>${e.pj}</td>
                <td>${e.pg}</td>
                <td>${e.pe}</td>
                <td>${e.pp}</td>
                <td>${e.gf}</td>
                <td>${e.gc}</td>
                <td>${e.dg}</td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

function crearSelectorGrupos(gruposDisponibles, tablaData) {
    const selector = document.getElementById("grupo-select");
    const opciones = [
        `<option value="todos">Todos los grupos</option>`,
        ...gruposDisponibles.map(z => `<option value="${z}">${z}</option>`),
        `<option value="anual">Tabla Anual</option>`,
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
            
            if (valor === "anual") {
                mostrarTablaAnual(tablaData);
            } else {
                mostrarTablaPorGrupo(tablaData, valor);
            }
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

function detectCurrentFecha(fixtureData, fechasUnicas) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let bestIndex = 0;
    let closestDiff = Infinity;

    for (let i = 0; i < fechasUnicas.length; i++) {
        const fechaName = fechasUnicas[i];
        const partidos = fixtureData.filter(p => p.fecha_torneo === fechaName);
        
        if (partidos.length === 0) continue;

        for (let partido of partidos) {
            const fechaStr = partido.fecha;
            const dateParts = fechaStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            
            if (dateParts) {
                const matchDate = new Date(dateParts[3], dateParts[2] - 1, dateParts[1]);
                matchDate.setHours(0, 0, 0, 0);
                
                const diff = matchDate - today;

                if (diff >= 0 && diff < closestDiff) {
                    closestDiff = diff;
                    bestIndex = i;
                } else if (diff < 0 && Math.abs(diff) < Math.abs(closestDiff)) {
                    closestDiff = diff;
                    bestIndex = i;
                }
            }
        }
    }

    return bestIndex;
}

function updateFechaDisplay() {
    const display = document.getElementById("fecha-display");
    const prevBtn = document.getElementById("fecha-prev");
    const nextBtn = document.getElementById("fecha-next");
    const selectElem = document.getElementById("fecha-select");

    if (display) {
        display.textContent = fechasUnicas[currentFechaIndex];
    }

    if (selectElem) {
        selectElem.value = fechasUnicas[currentFechaIndex];
    }

    if (prevBtn) {
        prevBtn.disabled = currentFechaIndex === 0;
    }

    if (nextBtn) {
        nextBtn.disabled = currentFechaIndex === fechasUnicas.length - 1;
    }
}

function navigateFecha(direction) {
    const newIndex = currentFechaIndex + direction;
    
    if (newIndex >= 0 && newIndex < fechasUnicas.length) {
        currentFechaIndex = newIndex;
        updateFechaDisplay();
        mostrarPartidos(fixtureDataGlobal, fechasUnicas[currentFechaIndex]);
    }
}
