const cron = require('node-cron');
const { connectNeo4j } = require('./nosql/neo4j');
const {
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
    console.log('[STARTUP] Checking if road network graph exists...');
    
    const neo4jDriver = connectNeo4j();
    const session = neo4jDriver.session();
    
    const result = await session.run('MATCH (p:Point) RETURN count(p) as count');
    const pointCount = result.records[0].get('count').toNumber();
    await session.close();
    
    if (pointCount > 0) {
      console.log(`[STARTUP] Graph already exists with ${pointCount} Point nodes. Skipping build.`);
      console.log('[STARTUP] Only traffic speed updates will run every 5 minutes.');
    } else {
      console.log('[STARTUP] Graph is empty. Building initial road network...');
      await buildRoadNetworkGraph();
      console.log('[STARTUP] Road network graph build complete!');
    }
  } catch (e) {
    console.error('[STARTUP] Failed to check/build road network graph:', e.message);
  }
})();

console.log('\n=== NoSQL Cache & Neo4j Graph Refresh Schedule ===');
console.log('- VMS/EMAS & Incidents: Every 2 minutes');
console.log('- Train Alerts: Every 5 minutes');
console.log('- Road Works: Daily at 2 AM');
console.log('- Traffic Speed Bands & Graph Weights: Every 5 minutes');
console.log('- Road Network Graph: Built on startup, weights updated every 5 min');