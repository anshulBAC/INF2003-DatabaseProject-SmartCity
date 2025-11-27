const accidentOut = qs("#accidents-table");

async function fetchAccidents() {
  showStatus(accidentOut, { loading: true });
  try {
    // Use traffic incidents collection as a reasonable source for accidents
    const response = await fetch("http://localhost:5000/api/traffic/incidents");
    if (!response.ok) throw new Error("Failed to fetch incidents.");
    const j = await response.json();
    // Map to expected accidents shape: { area, road, severity, date }
    return (j.data || []).map(it => ({
      area: it.Area || it.area || 'Unknown',
      road: (it.Message || it.message || '').split(' at ')[0] || 'Road',
      severity: it.Severity || it.severity || 'Unknown',
      date: it.cachedAt || new Date().toISOString()
    }));
  } catch (e) {
    console.warn('Accidents API failed, falling back to local data:', e.message);
    try {
      const local = await fetch('../data/traffic_incidents.json').then(r => r.json());
      return (local || []).map(it => ({
        area: it.Area || it.area || 'Unknown',
        road: (it.Message || it.message || '').split(' at ')[0] || 'Road',
        severity: it.Severity || it.severity || 'Unknown',
        date: it.cachedAt || new Date().toISOString()
      }));
    } catch (lf) {
      showStatus(accidentOut, { error: e.message });
      return [];
    }
  }
}

async function renderAccidents() {
  const accidents = await fetchAccidents();

  if (!accidents.length) {
    showStatus(accidentOut, { empty: true, message: "No accident records available." });
    return;
  }

  accidentOut.innerHTML = renderTable(
    ["Area", "Road", "Severity", "Date"],
    accidents.map(a => [a.area, a.road, a.severity, a.date])
  );
  updateAccidentsChart(accidents);
}

function updateAccidentsChart(accidents) {
  const ctxAcc = document.getElementById("accidents-chart")?.getContext("2d");
  if (!ctxAcc) return;

  const areaCounts = accidents.reduce((acc, cur) => {
    acc[cur.area] = (acc[cur.area] || 0) + 1;
    return acc;
  }, {});

  if (window.accidentsChart) {
    window.accidentsChart.destroy();
  }

  window.accidentsChart = new Chart(ctxAcc, {
    type: "bar",
    data: {
      labels: Object.keys(areaCounts),
      datasets: [{
        label: "Number of Accidents",
        data: Object.values(areaCounts),
        backgroundColor: "#ff6b6b"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "#fff" } }
      },
      scales: {
        x: { ticks: { color: "#fff" } },
        y: { ticks: { color: "#fff" } }
      }
    }
  });
}

renderAccidents();
