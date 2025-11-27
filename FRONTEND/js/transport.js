function initTransport() {

  const carparkOut = document.querySelector("#carpark-table");
  const carparkFilter = document.querySelector("#filter-carpark");
  const btnCarpark = document.querySelector("#btn-carpark-refresh");
  const carparkProgress = document.querySelector("#carpark-progress");
  const indicatorFilter = document.querySelector("#filter-indicator");


  if (!carparkOut || !carparkFilter || !btnCarpark || !carparkProgress) {
    console.error('Transport.js: Required DOM elements not found. Retrying...');
    setTimeout(initTransport, 100);
    return;
  }

  let allCarparkData = [];

  function showStatus(element, options) {
    if (!element) return;
    if (options.loading) {
      element.innerHTML = '<p style="text-align: center; color: var(--muted);">Loading...</p>';
    } else if (options.error) {
      element.innerHTML = `<p style="text-align: center; color: var(--danger);">Error: ${options.error}</p>`;
    } else if (options.empty) {
      element.innerHTML = `<p style="text-align: center; color: var(--muted);">${options.message || 'No data available'}</p>`;
    }
  }

  function renderTable(headers, rows) {
    return `
    <table>
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.join('')}
      </tbody>
    </table>
  `;
  }
    
  function getMarkerColor(lots) {
    if (lots === 0) return "#f44336";
    if (lots <= 9) return "#ff9800";
    if (lots <= 29) return "#ffc107";
    return "#4caf50";
  }

  function renderCarparkRow(carpark) {
    const progressWidth = Math.min((carpark.lots / 100) * 100, 100);
    const statusColor = getMarkerColor(carpark.lots);
    const textColor = (carpark.lots === 0 || carpark.lots > 29) ? 'white' : 'black';
    return `
    <tr>
      <td>${carpark.name}</td>
      <td style="font-weight: 600; font-size: 16px;">${carpark.lots}</td>
      <td>
        <span class="badge" style="
          background-color: ${statusColor};
          color: ${textColor};
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600; 
      ">${carpark.status}</span></td>
      <td>
        <dic style="width: 100px; height: 8px; background: #333; border-radius: 4px;">
          <div style="
            width: ${progressWidth}%;
            height: 8px;
            background: ${statusColor};
            border-radius: 4px;
            background: ${statusColor};
          "></div>
        </div>
      </td>
    </tr>
  `;
  }

  function inferCarparkStatus(lots) {
    if (lots === 0) return 'Full';
    if (lots <= 9) return 'Almost Full';
    if (lots <= 29) return 'Filling Fast';
    return 'Available';
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async function fetchCarparks() {
    const term = (carparkFilter.value || "").toLowerCase();
    showStatus(carparkOut, { loading: true });
    try {
      const url = new URL("http://localhost:8000/api/carparks");
        // FastAPI supports `area` filter; use client-side filter if necessary
        if (term) url.searchParams.append("area", term);

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch carparks.");
      return await response.json();
    } catch (e) {
      console.warn('Carparks API failed, falling back to local data:', e.message);
      try {
        const local = await fetch('../data/carparks.json').then(r => r.json());
        return local || [];
      } catch (lf) {
        showStatus(carparkOut, { error: e.message });
        return [];
      }
    }
  }

  async function loadCarparks() {
    const raw = await fetchCarparks();
    // normalize fields from FastAPI / SQL export to the shape used by UI
    const filtered = raw.map(p => ({
      name: p.Development || p.CarParkID || p.name || p.Location || 'Carpark',
      lat: p.Latitude || p.latitude || null,
      lon: p.Longitude || p.longitude || null,
      lots: Number(p.AvailableLots || p.availableLots || p.lots || 0),
      status: inferCarparkStatus(Number(p.AvailableLots || p.availableLots || p.lots || 0))
    }));
    const indicator = indicatorFilter.value;

    let data = filtered;
    if (indicator) {
      data = filtered.filter(c => c.status.toLowerCase() === indicator.toLowerCase());
    }

    const total = data.length;

    if (total > 0) {
      const available = data.filter(c => c.status === "Available").length;
      const percent = Math.round((available / total) * 100);

      const bar = document.getElementById("carpark-bar");
      const percentText = document.getElementById("carpark-percent");

      if (bar && percentText) {
        bar.style.width = `${percent}%`;
        bar.style.background = percent > 60 ? "#4caf50" :
                               percent > 30 ? "#ffc107" :
                               percent > 10 ? "#ff9800" : "#f44336";
        percentText.textContent = `${percent}% available (${available}/${total})`;
      }
    }

    if (!data.length) {
      showStatus(carparkOut, { empty: true, message: "No matching carparks." });
      return;
    }

    carparkOut.innerHTML = renderTable(
      ["Carpark", "Lots Available", "Status", "Indicator"],
      data.map(c => renderCarparkRow(c))
    );
  }

  if (btnCarpark) btnCarpark.addEventListener("click", loadCarparks);
  if (carparkFilter) carparkFilter.addEventListener("input", debounce(loadCarparks, 300));
  if (indicatorFilter) indicatorFilter.addEventListener("change", loadCarparks);

  loadCarparks();

} 

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTransport);
} else {
  initTransport();
}