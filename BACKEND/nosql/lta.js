require('dotenv').config();
const axios = require('axios');
const { connectDB } = require('./db');

const headers = {
  AccountKey: process.env.LTA_API_KEY,
  accept: 'application/json',
};

async function fetchFromLTA(endpoint) {
  try {
    const url = `https://datamall2.mytransport.sg/ltaodataservice/${endpoint}`;
    console.log(`Fetching LTA: ${url}`);
    const res = await axios.get(url, { headers });
    const data = res.data.value || res.data || [];
    console.log(`LTA ${endpoint} returned ${Array.isArray(data) ? data.length : 'N/A'} records`);
    return data;
  } catch (error) {
    console.error(`LTA ${endpoint} failed:`, error.response?.status, error.message);
    if (error.response?.status === 401) {
      throw new Error('Invalid LTA API Key - Check .env');
    }
    return [];
  }
}

async function updateTraffic() {
  const db = await connectDB();
  const col = db.collection('traffic_speedbands');
  const data = await fetchFromLTA('v4/TrafficSpeedBands?$skip=0&$top=5000');
  let count = 0;
  for (const d of data) {
    const doc = { ...d, timestamp: d.Timestamp ? new Date(d.Timestamp) : new Date(), cachedAt: new Date() };
    const result = await col.updateOne(
      { LinkID: d.LinkID },
      { $set: doc },
      { upsert: true }
    );
    if (result.upsertedCount > 0 || result.modifiedCount > 0) count++;
  }
  console.log(`Cached ${count} traffic speed band records`);
  return count;
}

async function updateTrafficIncidents() {
  const db = await connectDB();
  const col = db.collection('traffic_incidents');
  const data = await fetchFromLTA('TrafficIncidents?$skip=0&$top=5000');
  
  await col.deleteMany({});
  
  if (data.length > 0) {
    const docs = data.map(inc => ({ ...inc, cachedAt: new Date() }));
    await col.insertMany(docs);
    console.log(`Cached ${docs.length} traffic incidents`);
    return docs.length;
  }
  return 0;
}

async function updateRoadworks() {
  const db = await connectDB();
  const col = db.collection('roadworks');
  const data = await fetchFromLTA('RoadWorks?$skip=0&$top=5000');
  let count = 0;
  for (const rw of data) {
    const doc = { ...rw, cachedAt: new Date() };
    const result = await col.updateOne(
      { EventID: rw.EventID },
      { $set: doc },
      { upsert: true }
    );
    if (result.upsertedCount > 0 || result.modifiedCount > 0) count++;
  }
  console.log(`Cached ${count} roadworks`);
  return count;
}

async function updateVMSEMAS() {
  const db = await connectDB();
  const col = db.collection('vms_emas');
  const data = await fetchFromLTA('VMS?$skip=0&$top=5000');
  
  await col.deleteMany({});
  
  if (data.length > 0) {
    const docs = data.map(vms => ({ ...vms, cachedAt: new Date() }));
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
  
  await col.deleteMany({});
  
  if (data.Status) {
    const doc = {
      status: data.Status,
      messages: data.Message || [],
      cachedAt: new Date()
    };
    await col.insertOne(doc);
    console.log(`Cached train service alerts - Status: ${data.Status}`);
  } else if (Array.isArray(data) && data.length > 0) {
    const docs = data.map(alert => ({ ...alert, cachedAt: new Date() }));
    await col.insertMany(docs);
    console.log(`Cached ${docs.length} train service alerts`);
  } else {
    console.log('No train service alerts to cache');
  }
  
  return 1;
}

async function updateBusArrivalForStop(busStopCode, serviceNo = null) {
  const db = await connectDB();
  const col = db.collection('bus_arrival');
  
  let endpoint = `v3/BusArrival?BusStopCode=${busStopCode}`;
  if (serviceNo) {
    endpoint += `&ServiceNo=${serviceNo}`;
  }
  
  const data = await fetchFromLTA(endpoint);
  
  if (data && data.Services) {
    for (const service of data.Services) {
      const doc = {
        BusStopCode: busStopCode,
        ServiceNo: service.ServiceNo,
        Operator: service.Operator,
        NextBus: service.NextBus,
        NextBus2: service.NextBus2,
        NextBus3: service.NextBus3,
        cachedAt: new Date()
      };
      
      await col.updateOne(
        { BusStopCode: busStopCode, ServiceNo: service.ServiceNo },
        { $set: doc },
        { upsert: true }
      );
    }
    console.log(`Cached bus arrival for stop ${busStopCode}: ${data.Services.length} services`);
    return data.Services.length;
  }
  
  return 0;
}

module.exports = {
  updateTraffic,
  updateTrafficIncidents,
  updateRoadworks,
  updateVMSEMAS,
  updateTrainServiceAlerts,
  updateBusArrivalForStop
};
