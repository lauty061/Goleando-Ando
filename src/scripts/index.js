document.addEventListener("DOMContentLoaded", async () => {
    const ligas = {
        "Bundesliga": "src/JSONs/resultadosale.json",
        "Premier League": "src/JSONs/resultadosing.json",
        "La Liga": "src/JSONs/resultadosesp.json",
        "Serie A": "src/JSONs/resultadosita.json",
        "Ligue 1": "src/JSONs/resultadosfra.json",
        "Liga Argentina": "src/JSONs/resultadosarg.json",
        "Primera B Nacional": "src/JSONs/resultadosbna.json",
        "Primera B Metropolitana": "src/JSONs/resultadosbmetro.json",
        "Champions League": "src/JSONs/resultadoscha.json",
        "Uefa Europa League": "src/JSONs/resultadoseu.json",
        "Copa Libertadores": "src/JSONs/resultadoslib.json",
        "Copa Sudamericana": "src/JSONs/resultadossuda.json",
        "Eliminatorias Conmebol": "src/JSONs/resultadoseli.json",
        "MLS": "src/JSONs/resultadosmls.json",
        "Brasileirao": "src/JSONs/resultadosbra.json",
        "Liga AUF Uruguay": "src/JSONs/resultadosuru.json",
        "NBA": "src/JSONs/resultadosnba.json"
    };
    
    const contenedor = document.querySelector(".resumen-ligas");
    const tablaHoy = document.getElementById("tabla-hoy");
    let hoy = new Date().toISOString().split("T")[0];
    let partidosHoy = [];

    for (let liga in ligas) {
        try {
            const res = await fetch(ligas[liga]);
            const data = await res.json();
            const info = data[liga];
            const top = info.tabla_posiciones?.[0];
            const goleador = info.goleadores?.[0];
            contenedor.innerHTML += `
                <div class="liga-mini">
                    <h4>${liga}</h4>
                    <p>Líder: <strong>${top?.equipo || "N/A"}</strong> (${top?.puntos || 0} pts)</p>
                    <p>Goleador: ${goleador?.nombre || "N/A"} (${goleador?.goles || 0} goles)</p>
                </div>
            `;
            info.fixture?.forEach(p => {
                const fechaISO = convertirFecha(p.fecha);
                if (fechaISO === hoy) {
                    partidosHoy.push({ ...p, liga });
                }
            });
        } catch (e) {
            console.warn(`No se pudo cargar ${liga}:`, e);
        }
    }

    let html = `
    <tr>
        <th>Fecha</th>
        <th>Liga</th>
        <th>Local</th>
        <th>Resultado</th>
        <th>Visitante</th>
    </tr>
`;

if (partidosHoy.length === 0) {
    html += `<tr><td colspan="4">No hay partidos para hoy</td></tr>`;
} else {
    partidosHoy.forEach(p => {
        html += `
            <tr>
                <td>${p.fecha}</td>
                <td>${p.liga}</td>
                <td><img src="${p.escudo_local}" width="30"> ${p.local}</td>
                <td>${p.goles_local} - ${p.goles_visita}</td>
                <td><img src="${p.escudo_visita}" width="30"> ${p.visitante}</td>
            </tr>
        `;
    });
}
tablaHoy.innerHTML = html;
});

function convertirFecha(fechaStr) {
    const match = fechaStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return "";
    return `${match[3]}-${match[2]}-${match[1]}`;
}
partidosHoy.sort((a, b) => a.liga.localeCompare(b.liga));
