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
    console.log(
      `LTA ${endpoint} returned ${Array.isArray(data) ? data.length : 'N/A'} records`
    );
    return data;
  } catch (error) {
    console.error(`LTA ${endpoint} failed:`, error.response?.status, error.message);
    if (error.response?.status === 401) {
      throw new Error('Invalid LTA API Key - Check .env');
    }
    return [];
  }
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
    console.log(`✓ Cached ${docs.length} traffic incidents`);
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
    console.log(`✓ Cached ${docs.length} roadworks`);
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
    console.log(`✓ Cached ${docs.length} VMS/EMAS records`);
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
    console.log(`✓ Cached ${docs.length} train service alerts`);
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
    console.log(`✓ Cached bus arrival for stop ${busStopCode}`);
    return 1;
  }
  return 0;
}

module.exports = {
  updateTrafficIncidents,
  updateRoadworks,
  updateVMSEMAS,
  updateTrainServiceAlerts,
  updateBusArrivalForStop,
};
