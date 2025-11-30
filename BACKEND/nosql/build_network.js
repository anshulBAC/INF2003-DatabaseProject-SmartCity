/**
 * Build Neo4j Road Network from LTA - Final Working Version
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const neo4j = require('neo4j-driver');
const { connectNeo4j } = require('./neo4j');

const headers = {
  AccountKey: process.env.LTA_API_KEY,
  accept: 'application/json',
};

async function fetchFromLTA(endpoint) {
  let allData = [];
  let skip = 0;
  const batchSize = 500;
  
  while (true) {
    try {
      const url = skip === 0 
        ? `https://datamall2.mytransport.sg/ltaodataservice/${endpoint}`
        : `https://datamall2.mytransport.sg/ltaodataservice/${endpoint}?$skip=${skip}`;
      
      const res = await axios.get(url, { headers });
      const data = res.data.value || res.data;
      
      if (!data || data.length === 0) break;
      
      allData = allData.concat(data);
      
      if (data.length < batchSize) break;
      skip += batchSize;
      
    } catch (error) {
      console.error(`LTA ${endpoint} failed at skip=${skip}`);
      break;
    }
  }
  
  console.log(`✅ Fetched ${allData.length} records from LTA`);
  return allData;
}

async function clearNeo4jInBatches(session) {
    console.log('Clearing existing data in batches...');
    
    let deleted = 0;
    while (true) {
        const result = await session.run(`
            MATCH (n)
            WITH n LIMIT 5000
            DETACH DELETE n
            RETURN count(n) as deleted
        `);
        
        const batchDeleted = result.records[0]?.get('deleted').toNumber() || 0;
        deleted += batchDeleted;
        
        if (batchDeleted === 0) break;
        process.stdout.write(`\r  Deleted ${deleted.toLocaleString()} nodes`);
    }
    console.log('\n✅ Database cleared');
}

async function buildRoadNetworkGraph() {
  const possibleEndpoints = ['v3/TrafficSpeedBands', 'TrafficSpeedBands'];
  
  let speedData = [];
  for (const endpoint of possibleEndpoints) {
    speedData = await fetchFromLTA(endpoint);
    if (speedData && speedData.length > 0) break;
  }
  
  if (!speedData || speedData.length === 0) {
    throw new Error('No traffic speed band data available from LTA API');
  }
  
  console.log(`Processing ${speedData.length} segments...\n`);
  
  const processedData = speedData.map(seg => ({
    ...seg,
    MinSpeed: parseFloat(seg.MinimumSpeed),
    MaxSpeed: parseFloat(seg.MaximumSpeed),
    AvgSpeed: (parseFloat(seg.MinimumSpeed) + parseFloat(seg.MaximumSpeed)) / 2.0
  }));
  
  const neo4jDriver = connectNeo4j();
  const session = neo4jDriver.session({
    database: 'neo4j',
    defaultAccessMode: neo4j.session.WRITE
  });
  
  const batchSize = 500;  // Smaller batches
  let totalNodesCreated = 0;
  let totalRelsCreated = 0;
  
  try {
    // Clear in batches
    await clearNeo4jInBatches(session);
    
    console.log('\nLoading road network...');
    for (let i = 0; i < processedData.length; i += batchSize) {
      const batch = processedData.slice(i, i + batchSize);
      
      const cypher = `
      UNWIND $segments AS seg
      
      MERGE (start:Point {lat: toFloat(seg.StartLat), lon: toFloat(seg.StartLon)})
      ON CREATE SET start.id = toString(seg.StartLat) + '_' + toString(seg.StartLon)
      
      MERGE (end:Point {lat: toFloat(seg.EndLat), lon: toFloat(seg.EndLon)})
      ON CREATE SET end.id = toString(seg.EndLat) + '_' + toString(seg.EndLon)
      
      MERGE (start)-[r:ROAD_SEGMENT]->(end)
      SET r.link_id = seg.LinkID,
          r.road_name = seg.RoadName,
          r.road_category = seg.RoadCategory,
          r.min_speed = seg.MinSpeed,
          r.max_speed = seg.MaxSpeed,
          r.current_speed_kph = seg.AvgSpeed,
          r.distance_km = point.distance(
              point({latitude: toFloat(seg.StartLat), longitude: toFloat(seg.StartLon)}),
              point({latitude: toFloat(seg.EndLat), longitude: toFloat(seg.EndLon)})
          ) / 1000.0
      SET r.duration_sec = CASE
          WHEN r.current_speed_kph > 0 
          THEN (r.distance_km / r.current_speed_kph) * 3600
          ELSE 999999
      END
      `;
      
      const result = await session.run(cypher, { segments: batch });
      const counters = result.summary.counters.updates();
      totalNodesCreated += counters.nodesCreated || 0;
      totalRelsCreated += counters.relationshipsCreated || 0;
      
      process.stdout.write(`\r  Processed ${Math.min(i + batchSize, processedData.length).toLocaleString()}/${processedData.length.toLocaleString()} segments`);
    }
    
    console.log(`\n\n✅ Created ${totalNodesCreated.toLocaleString()} nodes`);
    console.log(`✅ Created ${totalRelsCreated.toLocaleString()} road segments`);
    
  } finally {
    await session.close();
    await neo4jDriver.close();
  }
}

async function main() {
    console.log('='.repeat(70));
    console.log('Building Neo4j Road Network from LTA Data');
    console.log('='.repeat(70));
    console.log('');
    
    try {
        await buildRoadNetworkGraph();
        
        console.log('\n' + '='.repeat(70));
        console.log('🎉 SUCCESS! Your routing now works across ALL of Singapore!');
        console.log('='.repeat(70));
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();