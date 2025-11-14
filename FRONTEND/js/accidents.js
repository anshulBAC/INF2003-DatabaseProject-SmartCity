const accidentOut = qs("#accidents-table");

async function fetchAccidents() {
  showStatus(accidentOut, { loading: true });
  try {
    const response = await fetch("http://localhost:5000/api/accidents");
    if (!response.ok) throw new Error("Failed to fetch accidents.");
    return await response.json();
  } catch (e) {
    showStatus(accidentOut, { error: e.message });
    return [];
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
