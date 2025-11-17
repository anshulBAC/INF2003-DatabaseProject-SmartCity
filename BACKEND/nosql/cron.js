const cron = require('node-cron');
const {
  updateTraffic,
  updateRoadworks,
  updateTrafficIncidents,
  updateVMSEMAS,
  updateTrainServiceAlerts,
} = require('./lta');

console.log("Smart City NoSQL Cache Manager");

cron.schedule('*/2 * * * *', async () => {
  try {
    console.log('=== Caching: VMS/EMAS & Incidents (2 min) ===');
    await Promise.all([
      updateVMSEMAS(),
      updateTrafficIncidents()
    ]);
  } catch (e) {
    console.error('Cache update failed:', e.message);
  }
});

cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('=== Caching: Speed Bands & Train Alerts (5 min) ===');
    await Promise.all([
      updateTraffic(),
      updateTrainServiceAlerts()
    ]);
  } catch (e) {
    console.error('Cache update failed:', e.message);
  }
});

cron.schedule('0 2 * * *', async () => {
  try {
    console.log('=== Caching: Road Works (Daily) ===');
    await updateRoadworks();
  } catch (e) {
    console.error('Cache update failed:', e.message);
  }
});

console.log('NoSQL cache refresh schedule:');
console.log('- VMS/EMAS & Incidents: Every 2 minutes');
console.log('- Speed Bands & Train Alerts: Every 5 minutes');
console.log('- Road Works: Daily at 2 AM');
console.log('- Bus Arrival: On-demand (cache 30 sec)');
