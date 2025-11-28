require('dotenv').config();
const axios = require('axios');
const { connectDB } = require('./mongodb');
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
      
      console.log(`Fetching LTA: ${url}`);
      const res = await axios.get(url, { headers });
      const data = res.data.value || res.data;
      
      if (!data || data.length === 0) {
        break;
      }
      
      allData = allData.concat(data);
      console.log(`Fetched ${data.length} records (total: ${allData.length})`);
      
      if (data.length < batchSize) {
        break;
      }
      
      skip += batchSize;
      
    } catch (error) {
      console.error(`LTA ${endpoint} failed at skip=${skip}: ${error.response?.status} ${error.message}`);
      break;
    }
  }
  
  console.log(`LTA ${endpoint} total: ${allData.length} records`);
  return allData;
}


async function updateTrafficIncidents() {
  const db = await connectDB();
  const col = db.collection('traffic_incidents');

  const data = await fetchFromLTA('TrafficIncidents');

  await col.deleteMany({});
  if (data.length > 0) {
    const docs = data.map(d => ({
      ...d,
      cachedAt: new Date(),
    }));
    await col.insertMany(docs);
    console.log(`Cached ${docs.length} traffic incidents`);
    return docs.length;
  }
  return 0;
}

async function updateRoadworks() {
  const db = await connectDB();
  const col = db.collection('roadworks');

  const data = await fetchFromLTA('RoadWorks');

  await col.deleteMany({});
  if (data.length > 0) {
    const docs = data.map(d => ({
      ...d,
      cachedAt: new Date(),
    }));
    await col.insertMany(docs);
    console.log(`Cached ${docs.length} roadworks`);
    return docs.length;
  }
  return 0;
}

async function updateVMSEMAS() {
  const db = await connectDB();
  const col = db.collection('vms_emas');

  const data = await fetchFromLTA('VMS');
  console.log('[VMS] Sample from LTA:', JSON.stringify(data[0], null, 2));

  await col.deleteMany({});
  if (data.length > 0) {
    const docs = data.map(d => ({
      ...d,
      cachedAt: new Date(),
    }));
    await col.insertMany(docs);
    console.log(`Cached ${docs.length} VMS/EMAS records`);
    return docs.length;
  }
  return 0;
}

async function updateTrainServiceAlerts() {
  const db = await connectDB();
  const col = db.collection('train_service_alerts');

  const data = await fetchFromLTA('TrainServiceAlerts');
  console.log('[TRAIN] Sample from LTA:', JSON.stringify(data[0], null, 2));

  await col.deleteMany({});
  if (data.length > 0) {
    const docs = data.map(d => ({
      ...d,
      cachedAt: new Date(),
    }));
    await col.insertMany(docs);
    console.log(`Cached ${docs.length} train service alerts`);
    return docs.length;
  }
  return 0;
}

async function updateBusArrivalForStop(busStopCode) {
  const db = await connectDB();
  const col = db.collection('bus_arrival');

  const data = await fetchFromLTA(`v3/BusArrival?BusStopCode=${busStopCode}`);

  if (data && data.Services) {
    const doc = {
      BusStopCode: busStopCode,
      Services: data.Services,
      cachedAt: new Date(),
    };

    await col.updateOne(
      { BusStopCode: busStopCode },
      { $set: doc },
      { upsert: true }
    );
    console.log(`Cached bus arrival for stop ${busStopCode}`);
    return 1;
  }
  return 0;
}

async function updateTrafficSpeedBands() {
  const db = await connectDB();
  const col = db.collection('traffic_speed_bands');

  const data = await fetchFromLTA('v3/TrafficSpeedBands');

  await col.deleteMany({});
  if (data.length > 0) {
    const docs = data.map(d => ({
      ...d,
      cachedAt: new Date(),
    }));
    await col.insertMany(docs);
    console.log(`Cached ${docs.length} traffic speed bands in MongoDB.`);
    
    const neo4jDriver = connectNeo4j();
    const session = neo4jDriver.session({ database: 'neo4j' }); 
    
    try {
      const cypher = `
      UNWIND $segments AS segment
      MATCH (start:Point {lat: toFloat(segment.StartLat), lon: toFloat(segment.StartLon)})-
            [r:ROAD_SEGMENT]->
            (end:Point {lat: toFloat(segment.EndLat), lon: toFloat(segment.EndLon)})
      
      SET r.current_speed_kph = (toFloat(segment.MinimumSpeed) + toFloat(segment.MaximumSpeed)) / 2.0,
          r.duration_sec = CASE 
            WHEN toFloat(segment.SpeedBand) > 0 THEN (r.distance_km / toFloat(segment.SpeedBand)) * 3600
            ELSE 999999 
          END
      `;

      const result = await session.run(cypher, { segments: data });
      console.log(`Updated ${result.summary.counters.updates().relationships} road segment speeds in Neo4j.`);
      
    } catch (e) {
      console.error('[Neo4j] Speed Update Failed:', e.message);
    } finally {
      await session.close();
    }
    
    return docs.length;
  }
  return 0;
}

async function buildRoadNetworkGraph() {
  const speedData = await fetchFromLTA('v3/TrafficSpeedBands');
  
  console.log('Total speed data segments:', speedData ? speedData.length : 0);
  
  if (!speedData || speedData.length === 0) {
    console.log('No traffic speed band data available');
    return;
  }
  
  const neo4jDriver = connectNeo4j();
  const session = neo4jDriver.session();
  
  const batchSize = 1000;
  let totalNodesCreated = 0;
  let totalRelsCreated = 0;
  
  try {
    for (let i = 0; i < speedData.length; i += batchSize) {
      const batch = speedData.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(speedData.length/batchSize)} (${batch.length} segments)`);
      
      const cypher = `
      UNWIND $segments AS seg

      MERGE (start:Point {lat: toFloat(seg.StartLat), lon: toFloat(seg.StartLon)})
      ON CREATE SET start.id = toString(seg.StartLat) + '_' + toString(seg.StartLon)

      MERGE (end:Point {lat: toFloat(seg.EndLat), lon: toFloat(seg.EndLon)})
      ON CREATE SET end.id = toString(seg.EndLat) + '_' + toString(seg.EndLon)

      WITH start, end, seg,
          toFloat(toString(seg.MinimumSpeed)) AS minSpeed,
          toFloat(toString(seg.MaximumSpeed)) AS maxSpeed

      // Create only ONE direction - undirected queries will work both ways
      MERGE (start)-[r:ROAD_SEGMENT]->(end)
      SET r.link_id = seg.LinkID,
          r.road_name = seg.RoadName,
          r.road_category = seg.RoadCategory,
          r.speed_band = seg.SpeedBand,
          r.min_speed = minSpeed,
          r.max_speed = maxSpeed,
          r.current_speed_kph = CASE 
              WHEN minSpeed IS NOT NULL AND maxSpeed IS NOT NULL 
              THEN (minSpeed + maxSpeed) / 2.0
              ELSE 50.0
          END,
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
    }
    
    console.log(`Created ${totalNodesCreated} Point nodes`);
    console.log(`Created ${totalRelsCreated} ROAD_SEGMENT relationships (bidirectional)`);
    
  } catch (error) {
    console.error('Failed to build graph:', error.message);
    throw error;
  } finally {
    await session.close();
  }
}

module.exports = {
  updateTrafficIncidents,
  updateRoadworks,
  updateVMSEMAS,
  updateTrainServiceAlerts,
  updateBusArrivalForStop,
  updateTrafficSpeedBands,
  buildRoadNetworkGraph,
  fetchFromLTA,
};
