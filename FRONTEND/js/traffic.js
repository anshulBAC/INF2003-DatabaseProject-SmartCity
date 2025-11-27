const trafficOut = ui.qs("#traffic-table");
const filterRoad = ui.qs("#filter-road");
const filterCond = ui.qs("#filter-condition");
const btnRefresh = ui.qs("#btn-refresh");
const btnPause = ui.qs("#btn-pause");

let paused = false;

if (btnPause) {
  btnPause.addEventListener("click", () => {
    paused = !paused;
    btnPause.textContent = paused ? "Resume Auto-Refresh" : "Pause Auto-Refresh";
  });
}
function getTrafficColor(condition) {
  const cond = condition?.toLowerCase() || '';
  if (cond.includes('smooth')) return '#00FF00';
  if (cond.includes('moderate')) return '#FFD700';
  if (cond.includes('heavy')) return '#FF6B00'; 
  if (cond.includes('jam')) return '#FF0000';
  return '#FF0000';
}

  function deriveCondFromSpeed(speed) {
    const s = Number(speed || 0);
    if (isNaN(s)) return 'Unknown';
    if (s > 60) return 'Smooth';
    if (s > 40) return 'Moderate';
    if (s > 20) return 'Heavy';
    return 'Jam';
  }

async function loadTraffic() {
  if (paused) return;

  const term = (filterRoad?.value || "").toLowerCase();
  const cond = filterCond?.value;

  try {
    const url = new URL("http://localhost:5000/api/traffic/speedbands");
    if (term) url.searchParams.append("q", term);
    if (cond) url.searchParams.append("condition", cond);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error("Failed to fetch traffic data.");
    const apiResponse = await response.json();
    const filtered = apiResponse.data || [];

    if (window.updatetrafficMap) {
      window.updatetrafficMap(filtered);
    }

  } catch (e) {
    console.warn('Traffic API failed, falling back to local data:', e.message);
    try {
      const local = await fetch('../data/traffic_speedbands.json').then(r => r.json());
      const filteredLocal = (local || []).filter(item => {
        const termCheck = term ? (item.RoadName || '').toLowerCase().includes(term) : true;
        const condCheck = cond ? ((item.condition || '') === cond || (item.SpeedBand && String(item.SpeedBand) === cond)) : true;
        return termCheck && condCheck;
      });
      if (window.updatetrafficMap) window.updatetrafficMap(filteredLocal.map(f => ({
        startLat: f.StartLat || f.startLat,
        startLon: f.StartLon || f.startLon,
        endLat: f.EndLat || f.endLat,
        endLon: f.EndLon || f.endLon,
        road: f.RoadName || f.road,
        area: f.Area || f.area,
        speed: f.MinimumSpeed || f.minSpeed,
        condition: deriveCondFromSpeed(f.MinimumSpeed || f.minSpeed),
        updated_at: f.cachedAt || Date.now()
      })));
    } catch (lf) {
      ui.showStatus(trafficOut, { error: e.message });
    }
  }
}

btnRefresh?.addEventListener("click", loadTraffic);
filterRoad?.addEventListener("input", ui.debounce(loadTraffic, 300));
filterCond?.addEventListener("change", loadTraffic);

loadTraffic();
setInterval(() => { if (!paused) loadTraffic(); }, 30000);

document.addEventListener("DOMContentLoaded", () => {
  const mapContainer = document.getElementById("traffic-map");
  if (!mapContainer) return;

  mapContainer.textContent = "";

  const map = L.map(mapContainer, {
    center: [1.3521, 103.8198],
    zoom: 12,
    maxZoom: 19,
    minZoom: 10,
    zoomControl: true
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
    maxZoom: 19,
    minZoom: 10,
    tileSize: 256,
    keepBuffer: 2,
    updateWhenZooming: false,
    updateWhenIdle: true,
    crossOrigin: true
  }).addTo(map);

  function refreshMapSize() {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }

  window.addEventListener("load", refreshMapSize);
  setTimeout(refreshMapSize, 500);
  setTimeout(refreshMapSize, 1000);
  window.addEventListener("resize", refreshMapSize);

  let trafficLayers =[];

  window.updatetrafficMap = function (data) {
    trafficLayers.forEach(layer => map.removeLayer(layer));
    trafficLayers = [];

    const bounds = [];

    data.forEach((item) => {
      if (item.startLat && item.startLon && item.endLat && item.endLon) {

        const startLat = parseFloat(item.startLat);
        const startLon = parseFloat(item.startLon);
        const endLat = parseFloat(item.endLat);
        const endLon = parseFloat(item.endLon);

        if (!isNaN(startLat) && !isNaN(startLon) && !isNaN(endLat) && !isNaN(endLon)) {
          // compute condition & speed if not present
          const speedVal = item.speed || item.minSpeed || item.MinimumSpeed || ((item.minSpeed && item.maxSpeed) ? (Number(item.minSpeed) + Number(item.maxSpeed)) / 2 : null);
          const conditionVal = item.condition || item.condition || (speedVal ? (speedVal > 60 ? 'Smooth' : speedVal > 40 ? 'Moderate' : speedVal > 20 ? 'Heavy' : 'Jam') : 'Unknown');
          const color = getTrafficColor(conditionVal);
          const polyline = L.polyline(
            [
              [startLat, startLon],
              [endLat, endLon]
            ],
            {
              color: color,
              weight: 4,
              opacity: 0.8,
              lineJoin: 'round',
              className: 'traffic-line'
            }
          ).addTo(map);

          polyline.bindPopup(`
            <div style="font-family: sans-serif;">
              <b style="font-size: 14px;">${item.road}</b><br/>
              <b>Area:</b> ${item.area}<br/>
              <b>Speed:</b> ${speedVal ?? 'N/A'} km/h<br/>
              <b>Condition:</b> <span style="color: #FF0000;">${conditionVal}</span><br/>
              <small style="color: #666;">Updated: ${new Date(item.updated_at || item.cachedAt || Date.now()).toLocaleString('en-SG')}</small>
            </div>
          `);
          trafficLayers.push(polyline);
          bounds.push([startLat, startLon]);
          bounds.push([endLat, endLon]);
        } 
      }  
    });

    if (bounds.length > 0) {
      const latLngBounds = L.latLngBounds(bounds);
      map.fitBounds(latLngBounds, { padding: [50, 50], maxZoom: 14 });
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
    console.log(`Map updated with ${trafficLayers.length} traffic lines.`);
  };

  // Add legend
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = `
      <h4>Traffic Legend</h4>
      <div><span style="background: #00FF00; display: inline-block; width: 20px; height: 3px; margin-right: 5px;"></span>Smooth</div>
      <div><span style="background: #FFD700; display: inline-block; width: 20px; height: 3px; margin-right: 5px;"></span>Moderate</div>
      <div><span style="background: #FF6B00; display: inline-block; width: 20px; height: 3px; margin-right: 5px;"></span>Heavy</div>
      <div><span style="background: #FF0000; display: inline-block; width: 20px; height: 3px; margin-right: 5px;"></span>Jam</div>
    `;
    return div;
  };
  legend.addTo(map);
});