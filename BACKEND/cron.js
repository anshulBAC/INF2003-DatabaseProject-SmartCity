const cron = require('node-cron');
const {
  updateRoadworks,
  updateTrafficIncidents,
  updateVMSEMAS,
  updateTrainServiceAlerts,
  updateTrafficSpeedBands,
  buildRoadNetworkGraph,
} = require('./nosql/lta');

console.log('Smart City NoSQL Cache Manager + Neo4j Graph Builder');

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
    await updateTrainServiceAlerts();
  } catch (e) {
    console.error('Train alerts cache update failed:', e.message);
  }
});

cron.schedule('0 2 * * *', async () => {
  try {
    console.log('[CRON] Caching Road Works Daily');
    await updateRoadworks();
  } catch (e) {
    console.error('Road works cache update failed:', e.message);
  }
});

cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('[CRON] Updating Traffic Speed Bands & Neo4j Graph (5 min)');
    await updateTrafficSpeedBands();
  } catch (e) {
    console.error('Traffic Speed Band update failed:', e.message);
  }
});

(async () => {
  try {
    console.log('[STARTUP] Building initial road network graph in Neo4j...');
    await buildRoadNetworkGraph();
    console.log('[STARTUP] Road network graph build complete!');
  } catch (e) {
    console.error('[STARTUP] Failed to build road network graph:', e.message);
  }
})();

console.log('\n=== NoSQL Cache & Neo4j Graph Refresh Schedule ===');
console.log('- VMS/EMAS & Incidents: Every 2 minutes');
console.log('- Train Alerts: Every 5 minutes');
console.log('- Road Works: Daily at 2 AM');
console.log('- Traffic Speed Bands & Graph Weights: Every 5 minutes');
console.log('- Bus Arrival: On-demand cache (30 sec TTL)');
console.log('- Road Network Graph: Built on startup, weights updated every 5 min');