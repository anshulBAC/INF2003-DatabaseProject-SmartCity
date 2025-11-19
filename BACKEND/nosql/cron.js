const cron = require('node-cron');
const {
  updateRoadworks,
  updateTrafficIncidents,
  updateVMSEMAS,
  updateTrainServiceAlerts,
} = require('./lta');

console.log('Smart City NoSQL Cache Manager');

cron.schedule('*/2 * * * *', async () => {
  try {
    console.log('[CRON] Caching VMS/EMAS & Incidents (2 min)');
    await Promise.all([updateVMSEMAS(), updateTrafficIncidents()]);
  } catch (e) {
    console.error('Cache update failed:', e.message);
  }
});

cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('[CRON] Caching Train Alerts (5 min)');
    await Promise.all([updateTrainServiceAlerts()]);
  } catch (e) {
    console.error('Cache update failed:', e.message);
  }
});

cron.schedule('0 2 * * *', async () => {
  try {
    console.log('[CRON] Caching Road Works Daily');
    await updateRoadworks();
  } catch (e) {
    console.error('Cache update failed:', e.message);
  }
});

console.log('NoSQL cache refresh schedule:');
console.log('- VMSEMAS & Incidents: Every 2 minutes');
console.log('- Train Alerts: Every 5 minutes');
console.log('- Road Works: Daily at 2 AM');
console.log('- Bus Arrival: On-demand cache 30 sec');
