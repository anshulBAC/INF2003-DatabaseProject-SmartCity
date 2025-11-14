/**
 * server.js
 * Smart City Backend API (Node.js + Express + MongoDB)
 * Real-time Singapore traffic, carparks, weather, overview
 * Uses ONLY LTA's official Area field → no fallback guessing
 * Auto-updates via cron.js
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let db;

(async () => {
  try {
    db = await connectDB();
    console.log(`MongoDB connected → ${db.databaseName}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
})();

app.get('/', (req, res) => {
  res.json({
    status: 'Smart City API is running',
    port: PORT,
    time: new Date().toLocaleString('en-SG'),
    version: '1.0.0'
  });
});

app.get('/api/traffic/preview', async (req, res) => {
  try {
    const data = await db.collection('traffic_speedbands')
      .find({})
      .sort({ timestamp: -1 })
      .limit(4)
      .toArray();

    const preview = data.map(d => ({
      road: d.RoadName || `Link ${d.LinkID}`,
      speed: d.SpeedBand ?? 0
    }));

    res.json(preview);
  } catch (err) {
    console.error('[/api/traffic/preview] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch traffic preview' });
  }
});

app.get('/api/traffic', async (req, res) => {
  try {
    const { q, condition, limit = 0 } = req.query;
    console.log(`[Traffic API] q="${q}" | condition="${condition}" | limit=${limit}`);

    const findQuery = {};

    if (q) {
      const regex = { $regex: q, $options: 'i' };
      findQuery.$or = [
        { RoadName: regex },
        { Area: regex },
        { LinkID: { $eq: q } }
      ];
    }

    if (condition && ['Smooth', 'Moderate', 'Heavy', 'Jam'].includes(condition)) {
      const thresholds = { Jam: 20, Heavy: 40, Moderate: 60, Smooth: 999 };
      findQuery.SpeedBand = { $lt: thresholds[condition] };
      if (condition === 'Smooth') findQuery.SpeedBand = { $gte: 60 };
    }

    const totalDocs = await db.collection('traffic_speedbands').estimatedDocumentCount();

    if (totalDocs === 0) {
      console.warn('No traffic data in DB → run updateTraffic()');
      return res.json({
        data: [],
        total_count: 0,
        overall_total: 0,
        message: 'No traffic data yet. Cron will fetch in <2 min. Or run:<br><code>node -e "require(\'./lta\').updateTraffic()"</code>'
      });
    }

    const filteredCount = await db.collection('traffic_speedbands').countDocuments(findQuery);

    const data = await db.collection('traffic_speedbands')
      .find(findQuery)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit) || 0)
      .toArray();

    const mapped = data.map(d => {
      const speed = d.SpeedBand ?? 0;
      let cond = 'Smooth';
      if (speed < 20) cond = 'Jam';
      else if (speed < 40) cond = 'Heavy';
      else if (speed < 60) cond = 'Moderate';

      let area = d.Area ? d.Area.replace(/ Region$/i, '').trim() : 'Other';
      if (area === 'Central') area = 'Central';
      else if (area === 'North') area = 'North';
      else if (area === 'East') area = 'East';
      else if (area === 'West') area = 'West';
      else if (area === 'North East') area = 'North East';

      return {
        road: d.RoadName || `Link ${d.LinkID}`,
        area,
        speed,
        condition: cond,
        updated_at: d.timestamp,
        startLat: d.StartLat,
        startLon: d.StartLon,
        endLat: d.EndLat,
        endLon: d.EndLon
      };
    });

    console.log(`Returned ${mapped.length} / ${filteredCount} (total: ${totalDocs})`);
    res.json({
      data: mapped,
      total_count: filteredCount,
      overall_total: totalDocs,
      filters_applied: { q, condition, limit: limit || 'unlimited' }
    });

  } catch (err) {
    console.error('[/api/traffic] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch traffic data' });
  }
});

app.get('/api/transport/carparks', async (req, res) => {
  try {
    const { q } = req.query;
    const find = q ? {
      $or: [
        { Development: { $regex: q, $options: 'i' } },
        { CarParkID: { $regex: q, $options: 'i' } }
      ]
    } : {};

    const data = await db.collection('carpark_availability')
      .find(find)
      .sort({ timestamp: -1 })
      .limit(200)
      .toArray();

    const out = data.map(cp => {
      const lots = cp.AvailableLots ?? 0;

      let status = "Available";
      if (lots === 0) status = "Full";
      else if (lots <= 9) status = "Almost Full";
      else if (lots <= 29) status = "Filling Fast";
      else status = "Available";

      return {
        name: cp.Development || `CP ${cp.CarParkID}`,
        lots,
        status
      };
    });

    res.json(out);
  } catch (err) {
    console.error('[/api/transport/carparks] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch carparks' });
  }
});

app.get('/api/weather', async (req, res) => {
  try {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const readings = await db.collection('rainfall')
      .find({ timestamp: { $gte: hourAgo } })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    const latest = readings[0] || { value: 0 };
    const condition = latest.value > 5 ? 'Rainy' :
      latest.value > 0 ? 'Light Rain' : 'Clear';
    const icon = latest.value > 5 ? 'Heavy Rain' :
      latest.value > 0 ? 'Light Rain' : 'Sunny';

    res.json({
      current: { condition, icon, value: latest.value, timestamp: latest.timestamp }
    });
  } catch (err) {
    console.error('[/api/weather] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

app.get('/api/overview', async (req, res) => {
  try {
    const accidents = await db.collection('traffic_incidents')
      .countDocuments({ Type: 'Accident' });

    const roads = await db.collection('traffic_speedbands')
      .estimatedDocumentCount();

    const dist = await db.collection('traffic_speedbands').aggregate([
      { $sort: { timestamp: -1 } },
      { $limit: 1000 },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$SpeedBand', 20] }, then: 'Jam' },
                { case: { $lt: ['$SpeedBand', 40] }, then: 'Heavy' },
                { case: { $lt: ['$SpeedBand', 60] }, then: 'Moderate' }
              ],
              default: 'Smooth'
            }
          },
          cnt: { $sum: 1 }
        }
      }
    ]).toArray();

    const trafficDist = { Smooth: 0, Moderate: 0, Heavy: 0, Jam: 0 };
    dist.forEach(d => { if (d._id) trafficDist[d._id] = d.cnt; });

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rain = await db.collection('rainfall')
      .countDocuments({ timestamp: { $gte: dayAgo } });

    res.json({
      kpis: { vehicles: roads.toLocaleString(), accidents },
      trafficDistribution: trafficDist,
      weatherDistribution: { Rainy: rain > 0 ? 1 : 0, Clear: rain === 0 ? 1 : 0 },
      mapMarkers: []
    });
  } catch (err) {
    console.error('[/api/overview] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

app.post('/api/admin/refresh', async (req, res) => {
  try {
    const { updateTraffic, updateCarparks } = require('./lta');
    const { updateRainfall } = require('./weather');
    await Promise.all([updateTraffic(), updateCarparks(), updateRainfall()]);
    res.json({ message: 'All data refreshed', time: new Date().toLocaleString('en-SG') });
  } catch (err) {
    console.error('[/api/admin/refresh] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Smart City API running → http://localhost:${PORT}`);
  console.log(`Time: ${new Date().toLocaleString('en-SG')}`);
});