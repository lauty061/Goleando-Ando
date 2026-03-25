class LeagueRenderer {
    constructor(config) {
        this.jsonPath = config.jsonPath;
        this.ligaName = config.ligaName || document.getElementById("titulo-liga")?.innerText.trim();
        this.zonasConfig = config.zonasConfig || []; 
        this.fixtureField = config.fixtureField || 'fecha_torneo';

        this.currentFechaIndex = 0;
        this.fechasUnicas = [];
        this.fixtureDataGlobal = [];
        this.tablaPosicionesData = [];
        this.goleadoresData = [];

        this.init();
    }

    async init() {
        if (!this.ligaName || !this.jsonPath) return;

        try {
            let response = await fetch(this.jsonPath);
            let data = await response.json();
            let ligaData = data[this.ligaName];

            if (!ligaData) return;

            this.fixtureDataGlobal = ligaData.fixture || [];
            this.tablaPosicionesData = ligaData.tabla_posiciones || [];
            this.goleadoresData = ligaData.goleadores || [];

            this.renderFixture();
            this.renderTablaPosiciones();
            this.renderGoleadores();

            if (typeof loadBracket === "function" && document.getElementById("tournament-bracket")) {
                loadBracket(this.jsonPath, "tournament-bracket");
            }

        } catch(e) {
            console.error("Error init LeagueRenderer", e);
        }
    }

    renderFixture() {
        this.fechasUnicas = [...new Set(this.fixtureDataGlobal.map(p => p[this.fixtureField] || p.fecha_torneo || p.fase))].filter(Boolean);

        const fechaSelect = document.getElementById("fecha-select") || document.getElementById("ronda-select");
        if(fechaSelect && this.fechasUnicas.length > 0) {
            fechaSelect.innerHTML = this.fechasUnicas.map(f => `<option value="${f}">${f}</option>`).join("");

            this.currentFechaIndex = this.detectCurrentFecha();
            this.updateFechaDisplay(fechaSelect);
            this.mostrarPartidos(this.fechasUnicas[this.currentFechaIndex]);

            fechaSelect.addEventListener("change", (e) => {
                this.currentFechaIndex = this.fechasUnicas.indexOf(e.target.value);
                this.updateFechaDisplay(fechaSelect);
                this.mostrarPartidos(e.target.value);
            });

            document.getElementById("fecha-prev")?.addEventListener("click", () => this.navigateFecha(-1, fechaSelect));
            document.getElementById("fecha-next")?.addEventListener("click", () => this.navigateFecha(1, fechaSelect));
        }
    }

    detectCurrentFecha() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let bestIndex = 0;
        let closestDiff = Infinity;

        for (let i = 0; i < this.fechasUnicas.length; i++) {
            const fechaName = this.fechasUnicas[i];
            const partidos = this.fixtureDataGlobal.filter(p => (p[this.fixtureField] || p.fecha_torneo || p.fase) === fechaName);

            if (partidos.length === 0) continue;

            for (let partido of partidos) {
                let f = partido.fecha || partido.fecha_partido;
                if (!f) continue;
                const dateParts = f.match(/(\d{2})\/(\d{2})\/(\d{4})/);
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

    updateFechaDisplay(fechaSelect) {
        if (!fechaSelect) return;
        const disp = document.getElementById("fecha-display");
        if(disp) {
            disp.innerText = this.fechasUnicas[this.currentFechaIndex] || "Fecha";
        }
        fechaSelect.value = this.fechasUnicas[this.currentFechaIndex];
    }

    navigateFecha(dir, fechaSelect) {
        if (this.fechasUnicas.length === 0) return;
        this.currentFechaIndex += dir;

        if (this.currentFechaIndex < 0) this.currentFechaIndex = 0;
        else if (this.currentFechaIndex >= this.fechasUnicas.length) this.currentFechaIndex = this.fechasUnicas.length - 1;

        this.updateFechaDisplay(fechaSelect);
        this.mostrarPartidos(this.fechasUnicas[this.currentFechaIndex]);
    }

    mostrarPartidos(jornada) {
        let fixtureTable = document.getElementById("fixture-table");
        if(!fixtureTable) return;
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

        let partidos = this.fixtureDataGlobal.filter(p => (p[this.fixtureField] || p.fecha_torneo || p.fase) === jornada);

        if (partidos.length === 0) {
            fixtureTable.innerHTML += `<tr><td colspan="6">No hay partidos para esta fecha</td></tr>`;
            return;
        }

        partidos.forEach(p => {
            fixtureTable.innerHTML += `
                <tr>
                    <td>${p.fecha || p.fecha_partido || ''}</td>
                    <td><img src="${p.escudo_local}" width="30"> ${p.local}</td>
                    <td>${p.goles_local}</td>
                    <td>VS</td>
                    <td>${p.goles_visita}</td>
                    <td><img src="${p.escudo_visita}" width="30"> ${p.visitante}</td>
                </tr>
            `;
        });
    }

    renderTablaPosiciones() {
        const grupoSelect = document.getElementById("grupo-select");
        let zonasUnicas = [...new Set(this.tablaPosicionesData.map(e => e.zona || e.grupo).filter(Boolean))];
        const hasBracket = document.getElementById("tournament-bracket") !== null;

        if (grupoSelect && (zonasUnicas.length > 0 || hasBracket)) {
            this.crearSelectorGrupos(zonasUnicas, hasBracket);
        } else {
            this.mostrarTablaUnica(this.tablaPosicionesData);
        }
    }

    crearSelectorGrupos(gruposDisponibles, hasBracket) {
        const selector = document.getElementById("grupo-select");
        if(!selector) return;

        let html = "";
        if (gruposDisponibles.length > 0) {
            html += `<option value="todos">Todos los grupos</option>` +
                gruposDisponibles.map(z => `<option value="${z}">${z}</option>`).join("");
        } else {
            html += `<option value="todos">Tabla Principal</option>`;
        }

        if (hasBracket) {
            html += `<option value="bracket">Llave de Eliminación</option>`;
        }

        selector.innerHTML = html;

        selector.addEventListener("change", () => {
            const bc = document.getElementById("bracket-container");
            const tc = document.getElementById("tabla-container");

            if (selector.value === "bracket") {
                if(bc) bc.style.display = "block";
                if(tc) tc.style.display = "none";
            } else {
                if(bc) bc.style.display = "none";
                if(tc) tc.style.display = "block";

                if (gruposDisponibles.length > 0) {
                    this.mostrarTablaPorGrupo(selector.value);
                } else {
                    this.mostrarTablaUnica(this.tablaPosicionesData);
                }
            }
        });

        if (gruposDisponibles.length > 0) {
            this.mostrarTablaPorGrupo(selector.value);
        } else {
            this.mostrarTablaUnica(this.tablaPosicionesData);
        }
    }

    mostrarTablaPorGrupo(grupoSeleccionado) {
        const container = document.getElementById("tabla-posiciones-table");
        if (!container) return;

        if (!this.tablaPosicionesData || this.tablaPosicionesData.length === 0) {
            container.innerHTML = "<div class='text-center p-4'>No hay datos disponibles</div>";
            return;
        }

        let dataAgrupada = this.tablaPosicionesData.reduce((acc, equipo) => {
            const grupo = equipo.zona || equipo.grupo || "Sin grupo";
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
                        <table class="styled-table">
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

            equipos.forEach((equipo) => {
                let claseFila = this.getZonaClass(equipo.posicion, grupo);
                let colExtras = "";
                if(equipo.gf !== undefined) {
                   colExtras = `<td>${equipo.gf}</td><td>${equipo.gc}</td>`;
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
                        ${colExtras}
                        <td>${equipo.dg}</td>
                    </tr>
                `;
            });

            html += `</tbody></table></div></div>`;
            container.innerHTML += html;
        });
    }

    mostrarTablaUnica(tablaData) {
        let tabla = document.getElementById("tabla-posiciones-table");
        if (!tabla) return;
        if (!tablaData || !tablaData.length) {
            tabla.innerHTML = "<tr><td>No data a mostrar</td></tr>";
            return;
        }

        let hasGF = tablaData[0].gf !== undefined;

        let html = `
            <thead>
                <tr>
                    <th>#</th>
                    <th class="text-left">Equipo</th>
                    <th>Pts</th>
                    <th>PJ</th>
                    <th>PG</th>
                    <th>PE</th>
                    <th>PP</th>
                    ${hasGF ? '<th>GF</th><th>GC</th>' : ''}
                    <th>DG</th>
                </tr>
            </thead>
            <tbody>`;

        tablaData.forEach((equipo) => {
            let claseFila = this.getZonaClass(equipo.posicion);
            let colExtras = hasGF ? `<td>${equipo.gf}</td><td>${equipo.gc}</td>` : "";

            html += `
                <tr>
                    <td class="${claseFila} font-bold">${equipo.posicion}</td>
                    <td class="text-left">
                        <div class="flex-align-center justify-start">
                            <img src="${equipo.escudo}" class="team-logo-mini" loading="lazy">
                            ${equipo.equipo}
                        </div>
                    </td>
                    <td class="font-bold">${equipo.puntos}</td>
                    <td>${equipo.pj}</td>
                    <td>${equipo.pg}</td>
                    <td>${equipo.pe}</td>
                    <td>${equipo.pp}</td>
                    ${colExtras}
                    <td>${equipo.dg}</td>
                </tr>`;
        });
        tabla.innerHTML = html + `</tbody>`;
    }

    getZonaClass(pos, grupoName = null) {
        let p = parseInt(pos);
        if (isNaN(p)) return "";
        let clase = "";

        for (let rule of this.zonasConfig) {
            if (rule.match && rule.match === p) {
                return rule.class;
            }
            if (rule.start && rule.end && p >= rule.start && p <= rule.end) {
                return rule.class;
            }
        }
        return clase;
    }

    renderGoleadores() {
        let tabla = document.getElementById("tabla-goleadores");
        if (!tabla) return;
        if (!this.goleadoresData || !this.goleadoresData.length) {
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
                ${this.goleadoresData.map(g => `
                    <tr>
                        <td>${g.nombre}</td>
                        <td><img src="${g.escudo}" alt="${g.equipo}" width="30"></td>
                        <td>${g.goles}</td>
                    </tr>
                `).join("")}
            </tbody>
        `;
    }
}
