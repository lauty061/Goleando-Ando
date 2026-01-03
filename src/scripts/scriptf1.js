let currentFechaIndex = 0;
let fechasUnicas = [];
let racesGlobal = [];

document.addEventListener("DOMContentLoaded", async () => {
  const JSON_PATH = "../JSONs/f1_2025.json";
  const data = await fetchJson(JSON_PATH);
  if (!data) return;

  window.__F1_DATA = data;
  racesGlobal = data.races || [];

  const { drivers = [], teams = [] } = data;

  renderFixtureAll(racesGlobal);
  populateCountrySelect(racesGlobal);
  mostrarTablaPilotos(drivers);
  mostrarConstructores(teams);
  renderProximaCarrera(racesGlobal);
  renderUltimaCarrera(racesGlobal);
});

async function fetchJson(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (e) {
    console.error("No pude cargar JSON:", e);
    return null;
  }
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[m]);
}
function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }
function safeImgTag(src, cls, alt = "") {
  return src ? `<img src="${escapeAttr(src)}" class="${escapeAttr(cls)}" alt="${escapeAttr(alt)}" loading="lazy" onerror="this.style.display='none';">` : "";
}
function renderTable(container, headers, rowsHtml) {
  container.innerHTML = `
    <div class="scrollable-table">
      <table class="tabla">
        <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
        <tbody>${rowsHtml || `<tr><td colspan="${headers.length}">Sin datos</td></tr>`}</tbody>
      </table>
    </div>`;
}

function getHeadshotUrl(url) {
  return url || "";
}

function normalizeStr(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

function normalizeGP(r) {
  if (!r) return "";
  if (r.grand_prix) return String(r.grand_prix).replace(/\s*-\s*RACE RESULT.*$/i, "");
  return r.country || "";
}

function extractCountryFromGP(gp) {
  if (!gp) return null;
  const words = gp.split(/\s+/);
  const idx = words.findIndex(w => /grand|prix|gp/i.test(w));
  if (idx > 0) return words[idx - 1];
  if (words.length >= 2) return words[words.length - 2];
  return gp;
}

function getRaceResults(race, dataRoot) {
  let results = [];
  if (race.race_results) {
    results = Array.isArray(race.race_results)
      ? race.race_results
      : Object.values(race.race_results)[0] || [];
  }
  if ((!results || !results.length) && dataRoot?.race_results) {
    const target = (race.grand_prix || normalizeGP(race) || "").toLowerCase();
    const foundKey = Object.keys(dataRoot.race_results)
      .find(k => k.toLowerCase().includes(target));
    if (foundKey) results = dataRoot.race_results[foundKey] || [];
  }
  return results;
}

function safeId(str) {
  return "race-" + normalizeStr(str).replace(/[^a-z0-9_-]/g, "-");
}

function renderDriverRow(d) {
  const imgSrc = getHeadshotUrl(d.headshot || d.img || "");
  const avatar = safeImgTag(imgSrc, "piloto-img", d.name);
  const team_logo = safeImgTag(d.team_logo, "team-logo", d.team_logo);
  return `<tr>
  <td>${escapeHtml(d.pos || "")}</td>
  <td class="piloto-info">${avatar}</td>
  <td><span>${escapeHtml(d.name || "")}</span></td> 
  <td>${escapeHtml(d.nationality || "")}</td>
  <td>${team_logo}</td>
  <td>${escapeHtml(d.points || "")}</td>
  </tr>`;
}

function renderTeamRow(t) {
  const logo = safeImgTag(t.logo, "team-logo", t.team);
  return `<tr>
    <td>${escapeHtml(t.pos || "")}</td>
    <td>${escapeHtml(t.team || "")}</td>
    <td>${logo}</td>
    <td>${escapeHtml(t.points || "")}</td>
  </tr>`;
}

function renderFixtureAll(races) {
  const table = document.getElementById("fixture-table");
  if (!table) return;
  const tbody = table.querySelector("tbody") || table.createTBody();
  tbody.innerHTML = races.map(renderRaceRow).join("");
  tbody.querySelectorAll("tr[data-index]").forEach(tr =>
    tr.addEventListener("click", () => showRaceDetailsByIndex(Number(tr.dataset.index)))
  );
}

function populateCountrySelect(races) {
  const sel = document.getElementById("fecha-select");
  const details = document.getElementById("race-details");
  if (!sel || !details) return;
  const uniqueCountries = [];
  const seen = new Set();

  races.forEach(r => {
    const countryName = r.country || extractCountryFromGP(r.grand_prix);
    const flagSvg = r.country_flag_svg || '';

    if (countryName) {
      const norm = normalizeStr(countryName);
      if (!seen.has(norm)) {
        seen.add(norm);
        uniqueCountries.push({ name: countryName, flag: flagSvg });
      }
    }
  });

  fechasUnicas = ["all", ...uniqueCountries.map(c => c.name)];
  
  sel.innerHTML = `<option value="all" selected>Todas las carreras</option>` +
    uniqueCountries.map(c => {
      return `<option value="${escapeAttr(c.name)}">${escapeHtml(c.name)}</option>`;
    }).join("");

  currentFechaIndex = 0;
  renderAllRacesSummary(races);
  updateFechaDisplay();

  document.getElementById("fecha-prev").addEventListener("click", () => navigateFecha(-1, races));
  document.getElementById("fecha-next").addEventListener("click", () => navigateFecha(1, races));

  sel.addEventListener("change", () => {
    currentFechaIndex = fechasUnicas.indexOf(sel.value);
    updateFechaDisplay();
    if (sel.value === "all") renderAllRacesSummary(races);
    else showRaceDetailsByCountry(sel.value);
  });
}

function renderAllRacesSummary(races) {
  const details = document.getElementById("race-details");
  if (!details) return;
  const rows = races.map(r => {
    const grandPrixName = escapeHtml(normalizeGP(r) || r.grand_prix || "");
    const winnerName = escapeHtml(r.winner || "");
    const winnerImg = safeImgTag(getHeadshotUrl(r.winner_img), "piloto-img", r.winner);
    const teamLogo = safeImgTag(r.team_logo, "team-logo", r.team);
    const bandera = r.country_flag_svg; 
    return `<tr>
      <td class="fecha-cell">${escapeHtml(r.date || "")}</td>
      <td><span class="gp-info">${bandera} <span>${grandPrixName}</span></span></td>
      <td><span class="piloto-info">${winnerImg}<span>${winnerName}</span></span></td>
      <td>${teamLogo}</td><td>${escapeHtml(r.time || "")}</td>
    </tr>`;
  }).join("");

  renderTable(details, ["Fecha", "Gran Premio", "Ganador", "Equipo", "Tiempo"], rows);
}

function showRaceDetailsByIndex(index) {
  const race = window.__F1_DATA.races[index];
  if (race) renderRaceDetailsBlock(race);
}

function showRaceDetailsByCountry(country) {
  const details = document.getElementById("race-details");
  const normCountry = normalizeStr(country);
  const matches = window.__F1_DATA.races.filter(r => {
    const c1 = normalizeStr(r.country);
    const c2 = normalizeStr(r.grand_prix);
    return c1.includes(normCountry) || c2.includes(normCountry);
  });
  if (!matches.length) {
    details.innerHTML = `<p>No se encontraron carreras para <strong>${escapeHtml(country)}</strong></p>`;
    return;
  }
  details.innerHTML = matches.map(r => `<div id="${safeId(r.grand_prix)}"></div>`).join("");
  matches.forEach(r => renderRaceDetailsBlock(r));
}

function renderRaceDetailsBlock(race, races) {
  const details = document.getElementById("race-details");
  const container = details.querySelector(`#${safeId(race.grand_prix)}`) || details;
  const results = getRaceResults(race, window.__F1_DATA);
  if (!results.length) {
    container.innerHTML = `<p>No hay resultados para ${escapeHtml(race.grand_prix)}</p>`;
    return;
  }
  const rows = results.map(row => {
    const img = safeImgTag(getHeadshotUrl(row.driver_headshot || row.driver_img), "piloto-img", row.driver);
    const teamLogo = safeImgTag(row.team_logo, "team-logo", row.team);
    return `<tr>
      <td>${escapeHtml(row.pos || "")}</td>
      <td class="team-logo-cell">${img}</td>
      <td class="piloto-info"><span>${escapeHtml(row.driver || "")}</span></td>
      <td>${teamLogo}</td>
      <td>${escapeHtml(row.laps || "")}</td>
      <td>${escapeHtml(row.time || "")}</td>
      <td>${escapeHtml(row.points || "")}</td>
    </tr>`;
  }).join("");
  renderTable(container, ["Pos", "","Piloto", "Equipo", "Vueltas", "Tiempo", "Pts"], rows);
}

function mostrarTablaPilotos(drivers) {
  const cont = document.getElementById("tabla-posiciones-table");
  if (!cont) return;
  const rows = drivers.map(renderDriverRow).join("");
  renderTable(cont, ["#", "", "Piloto", "Nacionalidad", "Equipo", "Puntos"], rows);
}

function mostrarConstructores(teams) {
  const cont = document.getElementById("tabla-goleadores");
  if (!cont) return;

  const rows = teams.map(t => {
    const logo = safeImgTag(t.logo, "team-logo", t.team);
    const monoposto = safeImgTag(t.monoposto, "monoposto-img", t.team + " Monoposto");
    return `<tr>
      <td>${escapeHtml(t.pos || "")}</td>
      <td>${logo}</td>
      <td class="team-info">${escapeHtml(t.team || "")}</td>
      <td>${monoposto}</td>
      <td>${escapeHtml(t.points || "")}</td>
    </tr>`;
  }).join("");
  renderTable(cont, ["#", "","Equipo", "", "Puntos"], rows);
}

function renderProximaCarrera(races) {
  const el = document.getElementById("proxima-carrera");
  if (!el) return;
  const next = races.find(r => !r.time) || races[0];
  if (!next) { el.textContent = "Sin datos"; return; }
  el.innerHTML = `<div><strong>${escapeHtml(normalizeGP(next))}</strong><div>${escapeHtml(next.date || "")}</div></div>`;
}

function renderUltimaCarrera(races) {
  const cont = document.getElementById("tabla-ultima-carrera");
  if (!cont) return;
  const done = races.filter(r => getRaceResults(r, window.__F1_DATA).length);
  if (!done.length) { renderTable(cont, ["#", "","Piloto", "Equipo", "Tiempo", "Pts"], ""); return; }
  const last = done[done.length - 1];
  const results = getRaceResults(last, window.__F1_DATA);
  const rows = results.map(r => {
    const img = safeImgTag(getHeadshotUrl(r.driver_headshot || r.driver_img), "piloto-img", r.driver);
    const teamLogo = safeImgTag(r.team_logo, "team-logo", r.team);
    return `<tr>
      <td>${escapeHtml(r.pos || "")}</td>
      <td class="team-logo-cell">${img}</td>
      <td class="piloto-info"><span>${escapeHtml(r.driver || "")}</span></td>
      <td class="team-logo-cell">${teamLogo}</td>
      <td>${escapeHtml(r.time || "")}</td>
      <td>${escapeHtml(r.points || "")}</td>
    </tr>`;
  }).join("");
  renderTable(cont, ["#", "","Piloto", "Equipo", "Tiempo", "Pts"], rows);
}

function renderRaceRow(r, index) {
  const countryFlag = r.country_flag_svg || '';
  return `<tr data-index="${index}">
    <td>${escapeHtml(r.date || "")}</td>
    <td>${countryFlag} ${escapeHtml(normalizeGP(r))}</td>
  </tr>`;
}

function updateFechaDisplay() {
  const display = document.getElementById("fecha-display");
  const prevBtn = document.getElementById("fecha-prev");
  const nextBtn = document.getElementById("fecha-next");
  const selectElem = document.getElementById("fecha-select");

  if (display) {
    const displayText = fechasUnicas[currentFechaIndex] === "all" 
      ? "Todas las carreras" 
      : fechasUnicas[currentFechaIndex];
    display.textContent = displayText;
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

function navigateFecha(direction, races) {
  const newIndex = currentFechaIndex + direction;
  
  if (newIndex >= 0 && newIndex < fechasUnicas.length) {
    currentFechaIndex = newIndex;
    updateFechaDisplay();
    
    const selectedValue = fechasUnicas[currentFechaIndex];
    if (selectedValue === "all") {
      renderAllRacesSummary(races);
    } else {
      showRaceDetailsByCountry(selectedValue);
    }
  }
}