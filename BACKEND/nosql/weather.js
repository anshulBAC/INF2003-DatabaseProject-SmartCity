require('dotenv').config();
const axios = require('axios');
const { connectDB } = require('./db');

async function fetchCurrentWeather() {
  try {
    const url = 'https://api.data.gov.sg/v1/environment/now';
    const { data } = await axios.get(url);
    if (!data.items?.length) throw new Error('No items in now API');

    const item = data.items[0];
    const reading = item.readings;
    const timestamp = new Date(item.timestamp);

    const weather = {
      condition: reading.weather?.description || 'Unknown',
      temperature: reading.temperature || 0,
      humidity: reading.humidity || 0,
      wind_speed: reading.wind_direction?.speed || 0,
      wind_direction: reading.wind_direction?.direction || 'N/A',
      thunder: (reading.weather?.description || '').toLowerCase().includes('thunder'),
      timestamp
    };

    const db = await connectDB();
    await db.collection('weather_current').replaceOne(
      { timestamp: { $gte: new Date(timestamp.getTime() - 60000) } },
      weather,
      { upsert: true }
    );

    console.log(`[WEATHER] Current: ${weather.condition} | ${weather.temperature}°C | Thunder: ${weather.thunder}`);
    return weather;
  } catch (err) {
    console.error('[WEATHER] fetchCurrentWeather failed:', err.message);
    return null;
  }
}

async function fetchForecast() {
  try {
    const url = 'https://api.data.gov.sg/v1/environment/24-hour-weather-forecast';
    const { data } = await axios.get(url);
    if (!data.items?.length) throw new Error('No items in forecast API');

    const forecasts = data.items[0].forecasts || [];
    const timestamp = new Date(data.items[0].timestamp);

    const periods = forecasts.map(f => ({
      period: f.period || 'Unknown',
      description: f.description || 'No data',
      temperature_low: f.temperature?.low || 0,
      temperature_high: f.temperature?.high || 0,
      rain_probability: f.rain_probability || 0,
      rainfall: f.rainfall || 0,
      thunder: (f.description || '').toLowerCase().includes('thunder'),
      timestamp
    }));

    const db = await connectDB();
    await db.collection('weather_forecast').deleteMany({});
    if (periods.length > 0) {
      await db.collection('weather_forecast').insertMany(periods);
    }

    console.log(`[WEATHER] Forecast updated: ${periods.length} periods`);
    return periods;
  } catch (err) {
    console.error('[WEATHER] fetchForecast failed:', err.message);
    return [];
  }
}

async function updateRainfall() {
  try {
    const db = await connectDB();
    const col = db.collection('rainfall');
    const now = new Date();
    now.setMinutes(Math.floor(now.getMinutes() / 5) * 5, 0, 0);
    const timestamp = now.toISOString().slice(0, 19);

    const url = 'https://api-open.data.gov.sg/v2/real-time/api/rainfall';
    const { data } = await axios.get(url, { params: { date_time: timestamp } });

    const items = data.items || [];
    let count = 0;

    for (const item of items) {
      const ts = new Date(item.timestamp);
      for (const r of item.readings) {
        await col.updateOne(
          { station_id: r.station_id, timestamp: ts },
          { $set: { value: r.value, timestamp: ts } },
          { upsert: true }
        );
        count++;
      }
    }
    console.log(`[WEATHER] Rainfall: ${count} readings @ ${timestamp}`);
  } catch (err) {
    console.error('[WEATHER] updateRainfall failed:', err.message);
  }
}

module.exports = { fetchCurrentWeather, fetchForecast, updateRainfall };