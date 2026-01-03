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

    let fechasTorneo = {
        "Fecha 1": ["2023-09-07", "2023-09-08"],
        "Fecha 2": ["2023-09-12", "2023-09-12"],
        "Fecha 3": ["2023-10-12", "2023-10-12"],
        "Fecha 4": ["2023-10-17", "2023-10-17"],
        "Fecha 5": ["2023-11-16", "2023-11-16"],
        "Fecha 6": ["2023-11-21", "2023-11-21"],
        "Fecha 7": ["2024-09-05", "2024-05-05"],
        "Fecha 8": ["2024-09-10", "2024-09-10"],
        "Fecha 9": ["2024-10-10", "2024-10-10"],
        "Fecha 10": ["2024-10-15", "2024-10-15"],
        "Fecha 11": ["2024-11-14", "2024-11-15"],
        "Fecha 12": ["2024-11-19", "2024-11-19"],
        "Fecha 13": ["2025-03-20", "2025-03-21"],
        "Fecha 14": ["2025-03-25", "2025-03-25"],
        "Fecha 15": ["2025-06-09", "2025-06-09"],
        "Fecha 16": ["2025-06-14", "2025-06-14"],
        "Fecha 17": ["2025-09-08", "2025-09-08"],
        "Fecha 18": ["2025-09-16", "2025-09-16"],
    };

    const fechaSelect = document.getElementById("fecha-select");
    fechaSelect.innerHTML = Object.keys(fechasTorneo)
        .map(fecha => `<option value="${fecha}">${fecha}: del ${fechasTorneo[fecha][0]} al ${fechasTorneo[fecha][1]}</option>`)
        .join("");

    fechasUnicas = Object.keys(fechasTorneo);
    
    if (fechasUnicas.length > 0) {
        currentFechaIndex = 0;
        updateFechaDisplay();
        mostrarPartidos(fixtureDataGlobal, fechasUnicas[currentFechaIndex], fechasTorneo);
    }
    mostrarTablaPosiciones(tablaPosicionesData);
    mostrarGoleadores(goleadoresData);

    document.getElementById("fecha-prev").addEventListener("click", () => navigateFecha(-1, fechasTorneo));
    document.getElementById("fecha-next").addEventListener("click", () => navigateFecha(1, fechasTorneo));
    
    fechaSelect.addEventListener("change", function() {
        const selectedFecha = this.value;
        currentFechaIndex = fechasUnicas.indexOf(selectedFecha);
        updateFechaDisplay();
        mostrarPartidos(fixtureDataGlobal, selectedFecha, fechasTorneo);
    });
});

async function obtenerDatosLiga(liga) {
    try {
        let response = await fetch("../JSONs/resultadoseli.json");
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

        if (pos <= 6) {
            claseFila = "zona-azul";
        }
        else if (pos == 7) {
            claseFila = "zona-naranja";
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

function navigateFecha(direction, fechasTorneo) {
    const newIndex = currentFechaIndex + direction;
    
    if (newIndex >= 0 && newIndex < fechasUnicas.length) {
        currentFechaIndex = newIndex;
        updateFechaDisplay();
        mostrarPartidos(fixtureDataGlobal, fechasUnicas[currentFechaIndex], fechasTorneo);
    }
}
