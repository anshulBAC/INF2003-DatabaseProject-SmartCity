const trafficCanvas = ui.qs("#traffic-chart");
const trafficMeta = ui.qs("#traffic-meta");
const searchBtn = ui.qs("#q-btn");
const searchInput = ui.qs("#q-road");
const searchResults = ui.qs("#q-results");

async function fetchTrafficPreview() {
  try {
    const response = await fetch("http://localhost:5000/api/traffic/speedbands?limit=50");
    if (!response.ok) throw new Error("Failed to fetch traffic preview.");
    const j = await response.json();
    const arr = j.data || [];
    // map to preview shape { road, speed }
    return arr.map(a => ({
      road: a.RoadName || a.road || a.Road || 'Road',
      speed: a.minSpeed || a.MinimumSpeed || ((a.minSpeed && a.maxSpeed) ? Math.round((Number(a.minSpeed) + Number(a.maxSpeed)) / 2) : null)
    }));
  } catch (e) {
    console.warn("Traffic Preview Error, falling back to local data:", e);
    try {
      const local = await fetch('../data/traffic_preview.json').then(r => r.json());
      return local || [];
    } catch (lf) {
      console.error("Traffic Preview Local Fallback Error:", lf);
      return [];
    }
  }
}

async function loadTrafficPreview() {
  const trafficData = await fetchTrafficPreview();

  if (!trafficData.length) {
    trafficMeta.textContent = `Roads: 0 • Avg Speed: 0 km/h`;
    return;
  }

  const labels = trafficData.map(r => r.road);
  const values = trafficData.map(r => r.speed);

  ui.drawBarChart(trafficCanvas, labels, values, "Avg Speed (km/h)");

  const avgSpeed = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  trafficMeta.textContent = `Roads: ${labels.length} • Avg Speed: ${avgSpeed} km/h`;
}

async function runSearch() {
  const q = searchInput.value.trim().toLowerCase();
  const allTrafficData = await fetchTrafficPreview();

  if (!q) {
    searchResults.innerHTML = "";
    return;
  }

  const filtered = allTrafficData.filter(r => r.road.toLowerCase().includes(q));

  if (!filtered.length) {
    ui.showStatus(searchResults, { empty: true, message: "No matches found." });
    return;
  }

  searchResults.innerHTML = ui.renderTable(
    ["Road", "Speed (km/h)"],
    filtered.map(r => [r.road, r.speed])
  );
}

if (searchBtn) searchBtn.addEventListener("click", runSearch);
if (searchInput) searchInput.addEventListener("input", ui.debounce(runSearch, 300));

loadTrafficPreview();