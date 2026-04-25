let logosLigasGlobal = {};

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
        "Eliminatorias Conmebol": "src/JSONs/resultadoseli.json",
        "MLS": "src/JSONs/resultadosmls.json",
        "Brasileirao": "src/JSONs/resultadosbra.json",
        "Liga AUF Uruguay": "src/JSONs/resultadosuru.json",
        "División Profesional Bolivia": "src/JSONs/resultadosboli.json",
        "Copa de Primera": "src/JSONs/resultadospy.json",
        "Liga 1": "src/JSONs/resultadosperu.json",
        "Liga BetPlay Dimayor": "src/JSONs/resultadoscol.json",
        "Liga de Primera": "src/JSONs/resultadoschi.json",
        "Liga FUTVE": "src/JSONs/resultadosvnz.json",
        "NBA": "src/JSONs/resultadosnba.json",
    };

    const logosLigas = {
        "Bundesliga": "assets/imgs/BundesligaLogo.png",
        "Premier League": "assets/imgs/PremierLeagueLogo.png",
        "La Liga": "assets/imgs/LaLigaLogo.png",
        "Serie A": "assets/imgs/SerieALogo.png",
        "Ligue 1": "assets/imgs/Ligue1Logo.png",
        "Liga Argentina": "assets/imgs/LPFLogo.png",
        "Primera B Nacional": "assets/imgs/PrimeraNacionalogo.png",
        "Primera B Metropolitana": "assets/imgs/Primerabmetro.png",
        "Champions League": "assets/imgs/LogoChampions.png",
        "Uefa Europa League": "assets/imgs/logoeuropa.png",
        "Copa Libertadores": "assets/imgs/loogoliberta.png",
        "Eliminatorias Conmebol": "assets/imgs/CONMEBOL256x.png",
        "MLS": "assets/imgs/MLS.png",
        "Brasileirao": "assets/imgs/brasileirao.png",
        "Liga AUF Uruguay": "assets/imgs/Liga AUF Uruguaya - Blanco.png",
        "División Profesional Bolivia": "assets/imgs/Ligabolivia.png",
        "Copa de Primera": "assets/imgs/Copa de Primeraparaguay.png",
        "Liga 1": "assets/imgs/liga1peru.png",
        "Liga BetPlay Dimayor": "assets/imgs/ligacolombia.png",
        "Liga de Primera": "assets/imgs/ligachile.png",
        "Liga FUTVE": "assets/imgs/Ligaveneca.png",
        "NBA": "assets/imgs/logo-nba-256.png",
    };

    const urlsLigas = {
        "Bundesliga": "src/pages/liga-alemana.html",
        "Premier League": "src/pages/liga-inglesa.html",
        "La Liga": "src/pages/liga-espanola.html",
        "Serie A": "src/pages/liga-italiana.html",
        "Ligue 1": "src/pages/liga-francia.html",
        "Liga Argentina": "src/pages/liga-argentina.html",
        "Primera B Nacional": "src/pages/b-nacional.html",
        "Primera B Metropolitana": "src/pages/b-metropolitana.html",
        "Champions League": "src/pages/champions.html",
        "Uefa Europa League": "src/pages/europa-league.html",
        "Copa Libertadores": "src/pages/libertadores.html",
        "Eliminatorias Conmebol": "src/pages/eliminatorias.html",
        "MLS": "src/pages/mls.html",
        "Brasileirao": "src/pages/brasileirao.html",
        "Liga AUF Uruguay": "src/pages/liga-uruguay.html",
        "División Profesional Bolivia": "src/pages/liga-bolivia.html",
        "Copa de Primera": "src/pages/liga-paraguay.html",
        "Liga 1": "src/pages/liga-peru.html",
        "Liga BetPlay Dimayor": "src/pages/liga-colombia.html",
        "Liga de Primera": "src/pages/liga-chile.html",
        "Liga FUTVE": "src/pages/liga-venezuela.html",
        "NBA": "src/pages/nba.html",
    };

    logosLigasGlobal = logosLigas;

    const contenedor = document.querySelector(".resumen-ligas");
    const tablaHoy = document.getElementById("tabla-hoy");

    const hoyDate = new Date();
    const hoy = hoyDate.toLocaleDateString('en-CA');

    const entries = Object.entries(ligas);
    const results = await Promise.allSettled(
        entries.map(([liga, url]) =>
            fetch(url).then(r => r.json()).then(data => ({ liga, data: data[liga] }))
        )
    );
    const ligasOrdenadas = [];
    const todosLosPartidos = [];

    results.forEach(result => {
        if (result.status === "fulfilled") {
            const { liga, data: info } = result.value;
            if (!info) return;
            ligasOrdenadas.push({ liga, info });

            info.fixture?.forEach(p => {
                const fechaISO = convertirFecha(p.fecha, p.fecha_partido);
                todosLosPartidos.push({ ...p, liga, fechaISO });
            });
        } else {
            console.warn("No se pudo cargar una liga:", result.reason);
        }
    });

    const partidosHoy = todosLosPartidos.filter(p => p.fechaISO === hoy);

    contenedor.innerHTML = ligasOrdenadas.map(({ liga, info }, index) => {
        const top = info.tabla_posiciones?.[0];
        const goleador = info.goleadores?.[0];
        const escudoLider = top?.escudo || "";
        const escudoGoleador = goleador?.escudo || "";
        const badgeLiga = logosLigas[liga] || "";
        const url = urlsLigas[liga] || "#";

        return `
            <div class="liga-mini" onclick="window.location.href='${url}'" role="link" tabindex="0" aria-label="Ver ${liga}">
                <div class="liga-mini-header" style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 20px;">
                    ${badgeLiga ? `<img src="${badgeLiga}" alt="${liga}" style="width: 25px; height: 25px; object-fit: contain;">` : ""}
                    <h4 style="margin: 0; padding: 0; border: none;">${liga}</h4>
                </div>
                <div class="liga-mini-fila">
                    ${escudoLider ? `<img src="${escudoLider}" class="liga-mini-escudo" alt="${top?.equipo}" loading="lazy">` : ""}
                    <p>🏆 Líder: <strong>${top?.equipo || "N/A"}</strong> (${top?.puntos || 0} pts)</p>
                </div>
                <div class="liga-mini-fila">
                    ${escudoGoleador ? `<img src="${escudoGoleador}" class="liga-mini-escudo" alt="${goleador?.equipo}" loading="lazy">` : ""}
                    <p>⚽ ${goleador?.nombre || "N/A"} (${goleador?.goles || 0} goles)</p>
                </div>
            </div>
        `;
    }).join("");

    partidosHoy.sort((a, b) => a.liga.localeCompare(b.liga));
    renderTablaPartidos(tablaHoy, partidosHoy);
    renderVistaSemanal(todosLosPartidos, hoyDate);
});

function renderTablaPartidos(tablaEl, partidos) {
    if (!tablaEl) return;

    let html = `
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Liga</th>
                <th>Local</th>
                <th>Resultado</th>
                <th>Visitante</th>
            </tr>
        </thead>
        <tbody>
    `;

    if (partidos.length === 0) {
        html += `<tr><td colspan="5" class="text-center" style="padding: 20px; opacity: 0.6;">No hay partidos para este día</td></tr>`;
    } else {
        partidos.forEach(p => {
            const resultado = `${p.goles_local} - ${p.goles_visita}`;
            html += `
                <tr>
                    <td>${p.fecha_partido || p.fecha || ''}</td>
                    <td>${p.liga}</td>
                    <td><img src="${p.escudo_local}" width="30" loading="lazy" onerror="this.style.display='none'"> ${p.local}</td>
                    <td class="font-bold text-center result-cell">${resultado}</td>
                    <td><img src="${p.escudo_visita}" width="30" loading="lazy" onerror="this.style.display='none'"> ${p.visitante}</td>
                </tr>
            `;
        });
    }
    html += `</tbody>`;
    tablaEl.innerHTML = html;
}


function renderVistaSemanal(todosLosPartidos, hoyDate) {
    const weekTabs = document.getElementById("week-tabs");
    const tablaHoy = document.getElementById("tabla-hoy");
    if (!weekTabs || !tablaHoy) return;

    const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dias = [];

    for (let i = 0; i < 7; i++) {
        const d = new Date(hoyDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toLocaleDateString('en-CA');
        const label = i === 0 ? 'Hoy' : `${DIAS_ES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
        dias.push({ dateStr, label });
    }

    const matchesPorDia = {};
    dias.forEach(dia => {
        matchesPorDia[dia.dateStr] = todosLosPartidos.filter(p => p.fechaISO === dia.dateStr);
    });

    weekTabs.innerHTML = dias.map((dia, i) => {
        const count = matchesPorDia[dia.dateStr].length;
        return `
            <button class="week-tab ${i === 0 ? 'active' : ''}" data-date="${dia.dateStr}">
                ${dia.label}
                ${count > 0 ? `<span class="week-tab-badge">${count}</span>` : ''}
            </button>
        `;
    }).join('');

    weekTabs.querySelectorAll('.week-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            weekTabs.querySelectorAll('.week-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const partidos = [...(matchesPorDia[tab.dataset.date] || [])].sort((a, b) => a.liga.localeCompare(b.liga));
            renderTablaPartidos(tablaHoy, partidos);
        });
    });
}


function convertirFecha(fechaStr, fechaPartidoStr) {
    const fechaFinal = fechaPartidoStr || fechaStr;
    const match = fechaFinal?.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!match) return "";
    return `${match[3]}-${match[2]}-${match[1]}`;
}