const layers = {
  traffic: L.layerGroup(),
  accidents: L.layerGroup(),
  cameras: L.layerGroup(),
  carparks: L.layerGroup()
};

async function fetchOverviewData() {
  try {
    const response = await fetch("http://localhost:5000/api/overview");
    return await response.json();
  } catch (e) {
    console.error("Overview Data Error:", e);
    return {
      traffic: [],
      accidents: [],
      cameras: [],
      carparks: []
    };
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const data = await fetchOverviewData();

  const map = L.map("cityMap").setView([1.3521, 103.8198], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  data.traffic.forEach(t => {
    L.circleMarker([t.lat, t.lon], {
      radius: 6,
      color: t.condition === "Heavy" ? "red" : "orange"
    })
    .bindPopup(`Traffic: ${t.condition}`)
    .addTo(layers.traffic);
  });

  data.accidents.forEach(a => {
    L.marker([a.lat, a.lon])
      .bindPopup(`Accident: ${a.type}`)
      .addTo(layers.accidents);
  });

  data.cameras.forEach(c => {
    L.marker([c.lat, c.lon])
      .bindPopup(`<b>Camera</b><br><img src="${c.url}" width="200">`)
      .addTo(layers.cameras);
  });

  data.carparks.forEach(p => {
    L.marker([p.lat, p.lon])
      .bindPopup(`Available Lots: ${p.lots}`)
      .addTo(layers.carparks);
  });

  document.getElementById("toggle-traffic").addEventListener("change", e => {
    e.target.checked ? map.addLayer(layers.traffic) : map.removeLayer(layers.traffic);
  });

  document.getElementById("toggle-accidents").addEventListener("change", e => {
    e.target.checked ? map.addLayer(layers.accidents) : map.removeLayer(layers.accidents);
  });

  document.getElementById("toggle-cameras").addEventListener("change", e => {
    e.target.checked ? map.addLayer(layers.cameras) : map.removeLayer(layers.cameras);
  });

  document.getElementById("toggle-carparks").addEventListener("change", e => {
    e.target.checked ? map.addLayer(layers.carparks) : map.removeLayer(layers.carparks);
  });

});
