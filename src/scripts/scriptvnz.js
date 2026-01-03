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

    mostrarTablaPosiciones(tablaPosicionesData);
    mostrarGoleadores(goleadoresData);
});

async function obtenerDatosLiga(liga) {
    try {
        let response = await fetch("../JSONs/resultadosvnz.json");
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

function mostrarTablaPosiciones(tablaData) {
    let tabla = document.getElementById("tabla-posiciones-table");

    if (!tablaData || tablaData.length === 0) {
        tabla.innerHTML = "<tr><td colspan='10' class='text-center'>No hay datos disponibles</td></tr>";
        return;
    }

    tabla.innerHTML = `
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

    tablaData.forEach((equipo) => {
        let pos = parseInt(equipo.posicion);
        let claseFila = "";

        if (pos <= 8) {
            claseFila = "zona-azul";
        }

        tabla.innerHTML += `
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
    tabla.innerHTML += `</tbody>`;
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
