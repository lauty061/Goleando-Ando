let currentFechaIndex = 0;
let fechasUnicas = [];
let fixtureDataGlobal = [];
let datosGlobalesStats = {}; 

document.addEventListener("DOMContentLoaded", async function () {
    const liga = "NBA";
    let ligaData = await obtenerDatosLiga(liga);
    if (!ligaData) return;

    fixtureDataGlobal = ligaData.fixture || [];
    let tablaData = ligaData.tabla_posiciones || {};
    let estadisticasData = ligaData.estadisticas_jugadores || {};
    
    datosGlobalesStats = estadisticasData;

    mostrarEstadisticas('puntos');

    let conferenciaSelect = document.getElementById("conferencia-select");
    let conferencias = Object.keys(tablaData);
    if (conferencias.length > 0) {
        conferenciaSelect.innerHTML = conferencias.map(c => `<option value="${c}">${c}</option>`).join("");
        mostrarTablaPosiciones(tablaData[conferencias[0]]);
    }

    conferenciaSelect.addEventListener("change", function () {
        mostrarTablaPosiciones(tablaData[this.value]);
    });

    fechasUnicas = [...new Set(fixtureDataGlobal.map(p => p.fecha_torneo))];
    const rondaSelect = document.getElementById("ronda-select");
    
    if (fechasUnicas.length > 0) {
        rondaSelect.innerHTML = fechasUnicas.map(r => `<option value="${r}">${r}</option>`).join("");
        
        let hoy = new Date();
        let dia = String(hoy.getDate()).padStart(2, '0');
        let mes = String(hoy.getMonth() + 1).padStart(2, '0');
        let fechaHoyStr = `${dia}/${mes}`;
        
        if (fechasUnicas.includes(fechaHoyStr)) {
            currentFechaIndex = fechasUnicas.indexOf(fechaHoyStr);
        } else {
            currentFechaIndex = 0;
        }
        
        updateFechaDisplay();
        mostrarPartidos(fixtureDataGlobal, fechasUnicas[currentFechaIndex]);
    }

    document.getElementById("fecha-prev").addEventListener("click", () => navigateFecha(-1));
    document.getElementById("fecha-next").addEventListener("click", () => navigateFecha(1));
    
    rondaSelect.addEventListener("change", function() {
        const selectedFecha = this.value;
        currentFechaIndex = fechasUnicas.indexOf(selectedFecha);
        updateFechaDisplay();
        mostrarPartidos(fixtureDataGlobal, selectedFecha);
    });
});

window.cambiarStat = function(categoria) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    mostrarEstadisticas(categoria);
}

async function obtenerDatosLiga(liga) {
    try {
        let response = await fetch(`../JSONs/resultadosnba.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error("Error JSON");
        let data = await response.json();
        return data[liga] || null;
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

function mostrarPartidos(fixtureData, rondaSeleccionada) {
    let fixtureTable = document.getElementById("fixture-table");
    fixtureTable.innerHTML = `
        <thead>
            <tr>
                <th class="text-center">Estado/Hora</th>
                <th class="text-right">Local</th>
                <th class="text-center">Res</th>
                <th class="text-left">Visitante</th>
            </tr>
        </thead>
        <tbody>
    `;

    const partidos = fixtureData.filter(p => p.fecha_torneo === rondaSeleccionada);

    if (!partidos.length) {
        fixtureTable.innerHTML += `<tr><td colspan="4" class="text-center">No hay partidos</td></tr>`;
        fixtureTable.innerHTML += `</tbody>`;
        return;
    }

    partidos.forEach(p => {
        let hora = p.fecha.replace(" ET", "");
        let resultado = p.goles_local === "-" ? "vs" : `${p.goles_local} - ${p.goles_visita}`;
        
        let claseEstado = "";
        if (!hora.includes("Final") && (hora.includes("Q") || hora.includes("Half") || hora.includes(":"))) {
            if(hora.includes("Q") || hora.includes("Half")) claseEstado = "live-text";
        }

        fixtureTable.innerHTML += `
            <tr>
                <td class="text-center ${claseEstado}">${hora}</td>
                <td class="text-right">
                    <div class="flex-align-center justify-end">
                        ${p.nombre_local} <img src="${p.escudo_local}" class="team-logo-mini" loading="lazy">
                    </div>
                </td>
                <td class="text-center font-bold result-cell">${resultado}</td>
                <td class="text-left">
                    <div class="flex-align-center justify-start">
                        <img src="${p.escudo_visita}" class="team-logo-mini" loading="lazy"> ${p.nombre_visita}
                    </div>
                </td>
            </tr>
        `;
    });
    fixtureTable.innerHTML += `</tbody>`;
}

function mostrarTablaPosiciones(tablaData) {
    let tabla = document.getElementById("tabla-posiciones-table");

    if (!tablaData || !tablaData.length) {
        tabla.innerHTML = "<tr><td colspan='6' class='text-center'>No hay datos</td></tr>";
        return;
    }

    tabla.innerHTML = `
        <thead>
            <tr>
                <th>#</th>
                <th class="text-left">Equipo</th>
                <th>V-D</th>
                <th>%PG</th>
                <th>Racha</th>
                <th>L10</th>
            </tr>
        </thead>
        <tbody>
    `;

    tablaData.forEach((equipo) => {
        let pos = parseInt(equipo.posicion);
        let claseFila = "";
        
        if (pos <= 6) claseFila = "zona-verde";
        else if (pos <= 10) claseFila = "zona-oro";

        tabla.innerHTML += `
            <tr>
                <td class="${claseFila}">${equipo.posicion}</td>
                <td class="text-left">
                    <div class="flex-align-center justify-start">
                        <img src="${equipo.escudo}" class="team-logo-mini" loading="lazy">
                        ${equipo.equipo}
                    </div>
                </td>
                <td>${equipo.record}</td>
                <td class="font-bold">${equipo.porcentaje_pg}</td>
                <td>${equipo.racha}</td>
                <td>${equipo.l10}</td>
            </tr>
        `;
    });
    tabla.innerHTML += `</tbody>`;
}

function mostrarEstadisticas(categoria) {
    const tabla = document.getElementById("tabla-estadisticas-jugadores");
    const datosCategoria = datosGlobalesStats[categoria];

    if (!datosCategoria || !datosCategoria.length) {
        tabla.innerHTML = "<tr><td colspan='4' class='text-center'>No hay datos</td></tr>";
        return;
    }

    let tituloColumna = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    if(categoria === 'fg_pct') tituloColumna = "TC%";

    tabla.innerHTML = `
    <thead>
        <tr>
            <th>#</th>
            <th class="text-left">Jugador</th>
            <th>Equipo</th>
            <th>${tituloColumna}</th>
        </tr>
    </thead>
    <tbody>
    `;

    datosCategoria.forEach((j, index) => {
        tabla.innerHTML += `
        <tr>
            <td>${index + 1}</td>
            <td class="text-left">
                <div class="flex-align-center justify-start">
                    <img src="${j.foto}" class="player-img" alt="${j.jugador}">
                    <span class="font-bold">${j.jugador}</span>
                </div>
            </td>
            <td>${j.equipo}</td>
            <td class="stat-highlight">${j.valor}</td>
        </tr>
        `;
    });
    tabla.innerHTML += `</tbody>`;
}

function updateFechaDisplay() {
    const display = document.getElementById("fecha-display");
    const prevBtn = document.getElementById("fecha-prev");
    const nextBtn = document.getElementById("fecha-next");
    const selectElem = document.getElementById("ronda-select");

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