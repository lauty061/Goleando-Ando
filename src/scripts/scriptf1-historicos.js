document.addEventListener("DOMContentLoaded", async () => {
  await loadAllTimeRecords();
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

function renderTable(container, headers, rowsHtml) {
  container.innerHTML = `
    <div class="scrollable-table">
      <table class="tabla">
        <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>
        <tbody>${rowsHtml || `<tr><td colspan="${headers.length}">Sin datos</td></tr>`}</tbody>
      </table>
    </div>`;
}

async function loadAllTimeRecords() {
  const JSON_PATH = `../JSONs/F1/f1_all_time_records.json`;
  const data = await fetchJson(JSON_PATH);
  
  if (!data) {
    console.error("No se pudieron cargar los récords históricos");
    return;
  }
  
  const countryNameMap = {
    'NED': 'Netherlands',
    'GER': 'Germany',
    'GBR': 'Great Britain',
    'ARG': 'Argentina',
    'FRA': 'France',
    'ITA': 'Italy',
    'ESP': 'Spain',
    'AUT': 'Austria',
    'BRA': 'Brazil',
    'BEL': 'Belgium'
  };
  
  function getFlagSVG(countryCode) {
    if (!countryCode || !data.country_flag_svgs) return '';
    const countryName = countryNameMap[countryCode];
    if (countryName && data.country_flag_svgs[countryName]) {
      return data.country_flag_svgs[countryName];
    }
    return '';
  }
  
  renderTable(
    document.getElementById("tabla-campeonatos-pilotos"),
    ["#", "", "Piloto", "Campeonatos"],
    data.driver_championships.map(d => {
      const flagSVG = getFlagSVG(d.nationality);
      const headshotHtml = d.headshot 
        ? `<img src="${d.headshot}" alt="${escapeHtml(d.name)}" class="piloto-img" loading="lazy" onerror="this.style.display='none';">` 
        : '';
      return `<tr>
        <td>${d.rank}</td>
        <td>${flagSVG ? flagSVG : ''}</td>
        <td class="piloto-info">
          ${headshotHtml}
          <span>${escapeHtml(d.name)}</span>
        </td>
        <td class="font-bold">${d.championships}</td>
      </tr>`;
    }).join("")
  );
  
  renderTable(
    document.getElementById("tabla-victorias-pilotos"),
    ["#", "", "Piloto", "Victorias"],
    data.driver_wins.map(d => {
      const flagSVG = getFlagSVG(d.nationality);
      const headshotHtml = d.headshot 
        ? `<img src="${d.headshot}" alt="${escapeHtml(d.name)}" class="piloto-img" loading="lazy" onerror="this.style.display='none';">` 
        : '';
      return `<tr>
        <td>${d.rank}</td>
        <td>${flagSVG ? flagSVG : ''}</td>
        <td class="piloto-info">
          ${headshotHtml}
          <span>${escapeHtml(d.name)}</span>
        </td>
        <td class="font-bold">${d.wins}</td>
      </tr>`;
    }).join("")
  );
  
  renderTable(
    document.getElementById("tabla-campeonatos-equipos"),
    ["#", "", "Equipo", "Campeonatos"],
    data.team_championships.map(d => {
      const logoHtml = d.logo 
        ? `<img src="${d.logo}" alt="${escapeHtml(d.team)}" class="team-logo" onerror="this.style.display='none'">` 
        : '';
      return `<tr>
        <td>${d.rank}</td>
        <td>${logoHtml}</td>
        <td>${escapeHtml(d.team)}</td>
        <td class="font-bold">${d.championships}</td>
      </tr>`;
    }).join("")
  );
  
  renderTable(
    document.getElementById("tabla-victorias-equipos"),
    ["#", "", "Equipo", "Victorias"],
    data.team_wins.map(d => {
      const logoHtml = d.logo 
        ? `<img src="${d.logo}" alt="${escapeHtml(d.team)}" class="team-logo" onerror="this.style.display='none'">` 
        : '';
      return `<tr>
        <td>${d.rank}</td>
        <td>${logoHtml}</td>
        <td>${escapeHtml(d.team)}</td>
        <td class="font-bold">${d.wins}</td>
      </tr>`;
    }).join("")
  );
}
