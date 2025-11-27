const weatherOut = ui.qs("#weather-card");
const btnRefresh = ui.qs("#btn-refresh-weather");
const btnToggle = ui.qs("#btn-toggle-forecast");
const currentDiv = ui.qs("#current-weather");
const forecastDiv = ui.qs("#forecast-weather");
const rainfallDiv = ui.qs("#rainfall-info");

let forecastVisible = false;

btnToggle?.addEventListener("click", () => {
  forecastVisible = !forecastVisible;
  forecastDiv.style.display = forecastVisible ? "block" : "none";
  btnToggle.textContent = forecastVisible ? "Hide Forecast" : "Forecast";
});

let weatherMap;
let regionLayer;

const weatherColors = {
  "Sunny": "#FFD639",
  "Fair": "#FFE26B",
  "Cloudy": "#A4A9AD",
  "Partly Cloudy": "#C9CED6",
  "Rain": "#4C8DFF",
  "Light Rain": "#7FB3FF",
  "Heavy Rain": "#0050DD",
  "Thunderstorm": "#FF5A5A",
  "Showers": "#59A5FF"
};

async function setupWeatherMap() {
  weatherMap = L.map("weather-map").setView([1.35, 103.82], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
  }).addTo(weatherMap);

  const geo = await fetch("../data/sg_regions.json").then(r => r.json());

  regionLayer = L.geoJSON(geo, {
    style: {
      fillColor: "#333",
      fillOpacity: 0.6,
      color: "#888",
      weight: 1
    },
    onEachFeature: (feature, layer) => {
      layer.bindPopup(`<strong>${feature.properties.name}</strong>`);
    }
  }).addTo(weatherMap);
}

function updateWeatherMap(forecastArray) {
  regionLayer.setStyle(feature => {
    const regionName = feature.properties.name;

    const regionWeather = forecastArray.find(
      f => f.area?.toLowerCase() === regionName.toLowerCase()
    );

    const condition = regionWeather?.description || "Cloudy";
    const color = weatherColors[condition] || "#A4A9AD";

    return {
      fillColor: color,
      color: "#333",
      weight: 1,
      fillOpacity: 0.7
    };
  });
}

async function loadWeather() {
  ui.showStatus(weatherOut, { loading: true });

  try {
    const response = await fetch("http://localhost:5000/api/weather");
    const data = await response.json();

    currentDiv.innerHTML = `
      <div style="padding:15px;">
        <h3>${data.current.condition}</h3>
        <div style="font-size:2.5em;">${data.current.temperature}°C</div>
        Humidity: ${data.current.humidity}%<br>
        Wind: ${data.current.wind_speed} km/h
      </div>
    `;

    forecastDiv.innerHTML = data.forecast.map(f => `
      <div style="padding:10px; border-bottom:1px solid #222;">
        <strong>${f.period}</strong><br>
        ${f.description} — ${f.temp_range} — ${f.rain_probability}
      </div>
    `).join("");

    rainfallDiv.innerHTML = `
      <strong>Rainfall (Last Hour):</strong> 
      ${data.rainfall.latest_mm} mm across ${data.rainfall.stations} stations
    `;

    updateWeatherMap(data.forecast);

    ui.showStatus(weatherOut, { success: true });

  } catch (e) {
    ui.showStatus(weatherOut, { error: e.message });
  }
}

setupWeatherMap();
loadWeather();
setInterval(loadWeather, 15 * 60 * 1000);
