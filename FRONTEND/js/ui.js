window.ui = window.ui || {};

function qs(selector, root = document) {
  return root.querySelector(selector);
}
window.ui.qs = qs;

function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}
window.ui.qsa = qsa;

function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}
window.ui.debounce = debounce;

function showStatus(element, { loading = false, error = null, empty = false, message = "No data available." } = {}) {
  if (!element) return;
  if (loading) {
    element.innerHTML = '<p class="muted status-message">Loading data...</p>';
  } else if (error) {
    element.innerHTML = `<p class="error status-message">Error: ${error}</p>`;
  } else if (empty) {
    element.innerHTML = `<p class="muted status-message">${message}</p>`;
  } else {
    element.innerHTML = "";
  }
}
window.ui.showStatus = showStatus;

function renderTable(headers, rows) {
  if (!rows || rows.length === 0) return "";
  const headerRow = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
  const bodyRows = rows.map(row =>
    `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`
  ).join("");
  return `<table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
}
window.ui.renderTable = renderTable;

const popupOverlay = qs("#popup-overlay");
const popupContent = qs("#popup-content");
const popupClose = qs("#popup-close");

if (popupClose) {
  popupClose.addEventListener("click", () => {
    popupOverlay?.classList.add("hidden");
  });
}

function openPopup(htmlContent) {
  if (popupContent) popupContent.innerHTML = htmlContent;
  if (popupOverlay) popupOverlay.classList.remove("hidden");
}
window.ui.openPopup = openPopup;

function renderCarparkRow(c) {
  const statusClass = c.status === "Available" ? "smooth" : c.status === "Filling Fast" ? "moderate" : "jam";
  const statusBadge = `<span class="badge ${statusClass}">${c.status}</span>`;
  return [c.name, c.lots, statusBadge];
}
window.ui.renderCarparkRow = renderCarparkRow;

function renderTrafficRow(r) {
  const badgeClass = r.condition.toLowerCase();
  const linkHTML = `
    <a href="#" class="road-link road-btn"
        data-road="${r.road}"
        data-area="${r.area}"
        data-speed="${r.speed}"
        data-condition="${r.condition}"
        data-updated="${new Date(r.updated_at).toISOString()}">${r.road}</a>
  `;
  return [
    linkHTML,
    r.area,
    r.speed,
    `<span class="badge ${badgeClass}">${r.condition}</span>`,
    new Date(r.updated_at).toLocaleString()
  ];
}
window.ui.renderTrafficRow = renderTrafficRow;

function renderTrafficPopupContent(r) {
  const badgeClass = r.condition.toLowerCase();
  return `
    <h2>Traffic Incident: ${r.road}</h2>
    <p><strong>Area:</strong> ${r.area}</p>
    <p><strong>Speed:</strong> ${r.speed} km/h</p>
    <p><strong>Condition:</strong> <span class="badge ${badgeClass}">${r.condition}</span></p>
    <p><strong>Last Updated:</strong> ${new Date(r.updated_at).toLocaleString()}</p>
  `;
}
window.ui.renderTrafficPopupContent = renderTrafficPopupContent;

function drawBarChart(canvas, labels, values, title = "Chart") {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#e6edf3";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(title, 20, 24);

  const margin = 50;
  const chartW = W - margin * 2;
  const chartH = H - margin * 2;
  const maxVal = Math.max(...values, 1);

  ctx.strokeStyle = "#6b7a90";
  ctx.beginPath();
  ctx.moveTo(margin, margin);
  ctx.lineTo(margin, H - margin);
  ctx.lineTo(W - margin, H - margin);
  ctx.stroke();

  const barW = chartW / values.length - 20;
  values.forEach((val, i) => {
    const barH = (val / maxVal) * (chartH - 20);
    const x = margin + i * (barW + 20) + 10;
    const y = H - margin - barH;

    ctx.fillStyle = "#00c2ff";
    ctx.fillRect(x, y, barW, barH);

    ctx.fillStyle = "#e6edf3";
    ctx.font = "12px sans-serif";
    ctx.fillText(val, x + barW / 4, y - 5);

    ctx.fillStyle = "#6b7a90";
    ctx.fillText(labels[i], x, H - margin + 20);
  });
}
window.ui.drawBarChart = drawBarChart;

function renderWeatherCardContent(w) {
  const icon = w.thunder ? 'thunderstorm' :
               w.condition.includes('Rain') ? 'cloud-rain' :
               w.condition.includes('Cloud') ? 'cloud' : 'sun';
  
  const thunderBadge = w.thunder ? '<span class="badge jam">Thunder</span>' : '';

  return `
    <div class="weather-current" style="display: flex; align-items: center; gap: 15px;">
      <div class="weather-icon" style="font-size: 2.5em;">${icon}</div>
      <div class="weather-details">
        <h3>${w.condition} ${thunderBadge}</h3>
        <p><strong>${w.temperature}°C</strong> • ${w.humidity}% humidity</p>
        <p>Wind: ${w.wind}</p>
        <small>Updated: ${new Date(w.timestamp).toLocaleTimeString('en-SG')}</small>
      </div>
    </div>
  `;
}
window.ui.renderWeatherCardContent = renderWeatherCardContent;