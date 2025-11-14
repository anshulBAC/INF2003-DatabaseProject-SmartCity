const cron = require('node-cron');
const { updateTraffic, updateCarparks, updateRoadworks, updateTrafficIncidents } = require('./lta');
const { fetchCurrentWeather, fetchForecast, updateRainfall } = require('./weather');

console.log("Smart City Cron started (SG Time: Nov 11, 2025)");

cron.schedule('*/2 * * * *', async () => {
  try {
    console.log('=== LTA Update ===');
    await Promise.all([updateTraffic(), updateCarparks(), updateRoadworks(), updateTrafficIncidents()]);
  } catch (e) {
    console.error('LTA update failed:', e.message);
  }
});

cron.schedule('*/15 * * * *', async () => {
  try {
    console.log('=== Weather Update ===');
    await fetchCurrentWeather();
    await fetchForecast();
  } catch (e) {
    console.error('Weather update failed:', e.message);
  }
});

cron.schedule('*/5 * * * *', updateRainfall);