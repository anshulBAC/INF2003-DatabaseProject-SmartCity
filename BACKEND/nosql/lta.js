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
    console.log(`LTA ${endpoint} returned ${data.length} records`);
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
    const doc = { ...d, timestamp: d.Timestamp ? new Date(d.Timestamp) : new Date() }; 
    const result = await col.updateOne(
      { LinkID: d.LinkID },
      { $set: doc },
      { upsert: true }
    );
    if (result.upsertedCount > 0 || result.modifiedCount > 0) count++;
  }
  console.log(`Updated ${count} traffic records`);
  return count;
}

async function updateCarparks() {
  const db = await connectDB();
  const col = db.collection('carpark_availability');
  const data = await fetchFromLTA('CarParkAvailabilityv2?$skip=0&$top=5000');
  const values = data.value || data;
  let count = 0;
  for (const cp of values) {
    const doc = { ...cp, timestamp: new Date() };
    const result = await col.updateOne(
      { CarParkID: cp.CarParkID },
      { $set: doc },
      { upsert: true }
    );
    if (result.upsertedCount > 0 || result.modifiedCount > 0) count++;
  }
  console.log(`Updated ${count} carparks`);
  return count;
}

async function updateRoadworks() {
  const db = await connectDB();
  const col = db.collection('roadworks');
  const data = await fetchFromLTA('RoadWorks?$skip=0&$top=5000');
  let count = 0;
  for (const rw of data) {
    const doc = { ...rw, updatedAt: new Date() };
    const result = await col.updateOne(
      { RoadName: rw.RoadName, StartDate: rw.StartDate },
      { $set: doc },
      { upsert: true }
    );
    if (result.upsertedCount > 0 || result.modifiedCount > 0) count++;
  }
  console.log(`Updated ${count} roadworks`);
  return count;
}

async function updateTrafficIncidents() {
  const db = await connectDB();
  const col = db.collection('traffic_incidents');
  const data = await fetchFromLTA('TrafficIncidents?$skip=0&$top=5000');
  let count = 0;
  for (const inc of data) {
    const doc = { ...inc, updatedAt: new Date() };
    const result = await col.updateOne(
      { Message: inc.Message, StartDate: inc.StartDate },
      { $set: doc },
      { upsert: true }
    );
    if (result.upsertedCount > 0 || result.modifiedCount > 0) count++;
  }
  console.log(`Updated ${count} traffic incidents`);
  return count;
}

module.exports = { updateTraffic, updateCarparks, updateRoadworks, updateTrafficIncidents };