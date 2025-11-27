require('dotenv').config();
const axios = require('axios');
const { connectDB } = require('./db');

const API_KEY = process.env.DATAGOVSG_API_KEY;

async function fetchWeatherData(endpoint, collectionName, dataType) {
  try {
    const url = `https://api-open.data.gov.sg/v2/real-time/api/${endpoint}`;
    const headers = API_KEY ? { 'x-api-key': API_KEY } : {};
    
    const { data } = await axios.get(url, { headers });
    
    if (!data?.data?.stations || data.data.stations.length === 0) {
      throw new Error(`No data from ${endpoint}`);
    }

    const timestamp = new Date(data.data.readings[0].timestamp);
    const stations = data.data.stations;
    const readings = data.data.readings[0].data;

    const weatherRecords = stations.map((station, index) => ({
      stationId: station.id,
      stationName: station.name,
      location: station.location,
      latitude: station.location.latitude,
      longitude: station.location.longitude,
      value: readings[index].value,
      timestamp: timestamp,
      cachedAt: new Date()
    }));

    const db = await connectDB();
    await db.collection(collectionName).deleteMany({});
    const result = await db.collection(collectionName).insertMany(weatherRecords);

    console.log(`[WEATHER] ${dataType}: Inserted ${result.insertedCount} records`);
    return result.insertedCount;
  } catch (err) {
    console.error(`[WEATHER] Error fetching ${dataType}:`, err.message);
    return 0;
  }
}

async function updateAirTemperature() {
  return await fetchWeatherData('air-temperature', 'weather_temperature', 'Air Temperature');
}

async function updateRainfall() {
  return await fetchWeatherData('rainfall', 'weather_rainfall', 'Rainfall');
}

async function updateRelativeHumidity() {
  return await fetchWeatherData('relative-humidity', 'weather_humidity', 'Relative Humidity');
}

async function updateWindDirection() {
  return await fetchWeatherData('wind-direction', 'weather_wind_direction', 'Wind Direction');
}

async function updateWindSpeed() {
  return await fetchWeatherData('wind-speed', 'weather_wind_speed', 'Wind Speed');
}

async function updateAllWeatherData() {
  console.log('[WEATHER] Updating all weather data...');
  const results = await Promise.all([
    updateAirTemperature(),
    updateRainfall(),
    updateRelativeHumidity(),
    updateWindDirection(),
    updateWindSpeed()
  ]);
  
  const total = results.reduce((sum, count) => sum + count, 0);
  console.log(`[WEATHER] Total records updated: ${total}`);
  return total;
}

module.exports = {
  updateAirTemperature,
  updateRainfall,
  updateRelativeHumidity,
  updateWindDirection,
  updateWindSpeed,
  updateAllWeatherData
};
