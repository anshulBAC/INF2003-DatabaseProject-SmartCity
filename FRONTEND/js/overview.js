const layers = {
  traffic: L.layerGroup(),
  accidents: L.layerGroup(),
  cameras: L.layerGroup(),
  carparks: L.layerGroup()
};

async function fetchOverviewData() {
  // Fetch from available backends:
  // - Traffic speedbands & incidents from nosql server (port 5000)
  // - Cameras and carparks from SQL/FastAPI server (port 8000)
  try {
    const [speedRes, incRes, camsRes, carRes] = await Promise.all([
      fetch("http://localhost:5000/api/traffic/speedbands"),
      fetch("http://localhost:5000/api/traffic/incidents"),
      fetch("http://localhost:8000/api/traffic-cameras"),
      fetch("http://localhost:8000/api/carparks")
    ]);

    const speedJson = speedRes.ok ? await speedRes.json() : { data: [] };
    const incJson = incRes.ok ? await incRes.json() : { data: [] };
    const camsJson = camsRes.ok ? await camsRes.json() : [];
    const carJson = carRes.ok ? await carRes.json() : [];

    const traffic = (speedJson.data || []).map(s => ({
      lat: s.startLat || s.StartLat || s.latitude || null,
      lon: s.startLon || s.StartLon || s.longitude || null,
      condition: s.condition || deriveTrafficCondition(s),
      road: s.road || s.RoadName || '',
      area: s.area || s.Area || '',
      speed: s.minSpeed || s.MaximumSpeed || s.minSpeed || null
    })).filter(t => t.lat && t.lon);

    const accidents = (incJson.data || []).map(i => ({
      lat: i.latitude || i.Latitude || i.lat || null,
      lon: i.longitude || i.Longitude || i.lon || null,
      type: i.type || i.Type || i.message || 'Incident'
    })).filter(a => a.lat && a.lon);

    const cameras = (Array.isArray(camsJson) ? camsJson : (camsJson.value || [])).map(c => ({
      lat: c.Latitude || c.latitude || c.lat || null,
      lon: c.Longitude || c.longitude || c.lon || null,
      url: c.ImageLink || c.ImageURL || c.Image || c.url || ''
    })).filter(c => c.lat && c.lon && c.url);

    const carparks = (Array.isArray(carJson) ? carJson : (carJson || [])).map(p => ({
      name: p.Development || p.CarParkID || p.name || p.Location || 'Carpark',
      lat: p.Latitude || p.latitude || null,
      lon: p.Longitude || p.longitude || null,
      lots: p.AvailableLots || p.availableLots || p.lots || 0
    }));

    return { traffic, accidents, cameras, carparks };
  } catch (e) {
    console.error("Overview Data Error:", e);
    // Fallback to local static JSON files
    try {
      const [speedJson, incJson, camsJson, carJson] = await Promise.all([
        fetch('../data/traffic_speedbands.json').then(r => r.json()),
        fetch('../data/traffic_incidents.json').then(r => r.json()),
        fetch('../data/traffic_cameras.json').then(r => r.json()),
        fetch('../data/carparks.json').then(r => r.json())
      ]);

      const traffic = (speedJson || []).map(s => ({
        lat: s.StartLat || s.startLat,
        lon: s.StartLon || s.startLon,
        condition: s.condition || (s.MinimumSpeed ? deriveTrafficCondition(s) : 'Unknown'),
        road: s.RoadName || s.road || '',
        area: s.Area || s.area || '',
        speed: s.MinimumSpeed || s.minSpeed || null
      })).filter(t => t.lat && t.lon);

      const accidents = (incJson || []).map(i => ({
        lat: i.Latitude || i.latitude || null,
        lon: i.Longitude || i.longitude || null,
        type: i.Type || i.type || i.Message || 'Incident'
      })).filter(a => a.lat && a.lon);

      const cameras = (camsJson || []).map(c => ({
        lat: c.Latitude || c.latitude || c.lat || null,
        lon: c.Longitude || c.longitude || c.lon || null,
        url: c.ImageLink || c.url || ''
      })).filter(c => c.lat && c.lon && c.url);

      const carparks = (carJson || []).map(p => ({
        name: p.Development || p.CarParkID || p.name || p.Location || 'Carpark',
        lat: p.Latitude || p.latitude || null,
        lon: p.Longitude || p.longitude || null,
        lots: p.AvailableLots || p.lots || 0
      }));

      return { traffic, accidents, cameras, carparks };
    } catch (err2) {
      console.error('Overview local fallback failed:', err2);
      return { traffic: [], accidents: [], cameras: [], carparks: [] };
    }
  }
}

function deriveTrafficCondition(s) {
  const minSpeed = Number(s.minSpeed || s.MinimumSpeed || s.min_speed || 0);
  if (isNaN(minSpeed)) return 'Unknown';
  if (minSpeed > 60) return 'Smooth';
  if (minSpeed > 40) return 'Moderate';
  if (minSpeed > 20) return 'Heavy';
  return 'Jam';
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
