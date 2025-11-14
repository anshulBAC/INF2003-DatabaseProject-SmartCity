const listOut = document.querySelector("#traffic-list");
const filterRoad = document.querySelector("#filter-road");
const filterCond = document.querySelector("#filter-condition");
const btnRefresh = document.querySelector("#btn-refresh");
const btnPause = document.querySelector("#btn-pause");

let paused = false;

btnPause?.addEventListener("click", () => {
  paused = !paused;
  btnPause.textContent = paused ? "Resume Auto-Refresh" : "Pause Auto-Refresh";
});

function mapConditionFromSpeed(speed) {
  if (speed < 20) return "Jam";
  if (speed < 40) return "Heavy";
  if (speed < 60) return "Moderate";
  return "Smooth";
}

function getBadge(condition) {
  const c = condition.toLowerCase();
  if (c === "smooth") return `<span class="badge badge-smooth">Smooth</span>`;
  if (c === "moderate") return `<span class="badge badge-moderate">Moderate</span>`;
  if (c === "heavy") return `<span class="badge badge-heavy">Heavy</span>`;
  if (c === "jam") return `<span class="badge badge-jam">Jam</span>`;
  return `<span class="badge badge-jam">Unknown</span>`;
}

async function loadTraffic() {
  if (paused) return;

  try {
    const url = new URL("http://localhost:5000/api/traffic");
    const term = filterRoad.value.trim();

    if (term) url.searchParams.append("q", term);

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to load traffic data.");

    const api = await res.json();
    let data = api.data || [];

    // Convert speed → condition
    data = data.map(d => {
      const speed = d.SpeedBand ?? 0;
      const cond = mapConditionFromSpeed(speed);

      return {
        ...d,
        speed,
        condition: cond
      };
    });

    if (filterCond.value) {
      const selected = filterCond.value.toLowerCase();
      data = data.filter(item => item.condition.toLowerCase() === selected);
    }

    renderTrafficList(data);

  } catch (err) {
    listOut.innerHTML = `<p style="color:red;">${err.message}</p>`;
  }
}

function renderTrafficList(data) {
  if (data.length === 0) {
    listOut.innerHTML = `<p class="muted">No traffic results found.</p>`;
    return;
  }

  listOut.innerHTML = data
    .map(
      (item) => `
        <div class="traffic-card">
          <div>
            <h3>${item.road}</h3>
            <div class="traffic-meta">
              <b>Area:</b> ${item.area}<br>
              <b>Speed:</b> ${item.speed} km/h
            </div>
          </div>

          <div>${getBadge(item.condition)}</div>
        </div>
      `
    )
    .join("");
}

btnRefresh?.addEventListener("click", loadTraffic);
filterRoad?.addEventListener("input", ui.debounce(loadTraffic, 300));
filterCond?.addEventListener("change", loadTraffic);

loadTraffic();
setInterval(() => { if (!paused) loadTraffic(); }, 30000);
