require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

let db;

(async () => {
  try {
    db = await connectDB();
    console.log('Server connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
})();

app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

function getCacheAge(cachedAt) {
  if (!cachedAt) return null;
  return Math.floor((new Date() - new Date(cachedAt)) / 1000); 
}

function isCacheStale(cachedAt, ttlSeconds) {
  if (!cachedAt) return true;
  const age = getCacheAge(cachedAt);
  return age > ttlSeconds;
}

app.get('/api/traffic/speedbands', async (req, res) => {
  try {
    const { q, speedband, area, limit } = req.query;
    const findQuery = {};
    
    if (q) {
      findQuery.RoadName = { $regex: q, $options: 'i' };
    }
    
    if (area) {
      findQuery.Area = { $regex: area, $options: 'i' };
    }
    
    if (speedband) {
      const band = parseInt(speedband);
      if (band >= 1 && band <= 8) {
        findQuery.SpeedBand = band;
      }
    }
    
    const data = await db.collection('traffic_speedbands')
      .find(findQuery)
      .sort({ cachedAt: -1 })
      .limit(parseInt(limit) || 5000)
      .toArray();
    
    const cacheAge = data.length > 0 ? getCacheAge(data[0].cachedAt) : null;
    
    const mapped = data.map(d => ({
      linkId: d.LinkID,
      road: d.RoadName,
      area: d.Area,
      speedBand: d.SpeedBand,
      minSpeed: d.MinimumSpeed,
      maxSpeed: d.MaximumSpeed,
      roadCategory: d.RoadCategory,
      startLat: d.StartLat,
      startLon: d.StartLon,
      endLat: d.EndLat,
      endLon: d.EndLon
    }));
    
    res.json({ 
      data: mapped, 
      count: mapped.length,
      cache: {
        ageSeconds: cacheAge,
        ttl: 300
      }
    });
  } catch (err) {
    console.error('[/api/traffic/speedbands] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch traffic speed bands' });
  }
});

app.get('/api/traffic/incidents', async (req, res) => {
  try {
    const { type } = req.query;
    const findQuery = type ? { Type: { $regex: type, $options: 'i' } } : {};
    
    const data = await db.collection('traffic_incidents')
      .find(findQuery)
      .sort({ cachedAt: -1 })
      .toArray();
    
    const cacheAge = data.length > 0 ? getCacheAge(data[0].cachedAt) : null;
    
    const mapped = data.map(inc => ({
      type: inc.Type,
      message: inc.Message,
      latitude: inc.Latitude,
      longitude: inc.Longitude
    }));
    
    res.json({ 
      data: mapped, 
      count: mapped.length,
      cache: {
        ageSeconds: cacheAge,
        ttl: 120
      }
    });
  } catch (err) {
    console.error('[/api/traffic/incidents] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch traffic incidents' });
  }
});

app.get('/api/roadworks', async (req, res) => {
  try {
    const { q } = req.query;
    const findQuery = {};
    
    if (q) {
      findQuery.$or = [
        { RoadName: { $regex: q, $options: 'i' } },
        { Location: { $regex: q, $options: 'i' } }
      ];
    }
    
    const data = await db.collection('roadworks')
      .find(findQuery)
      .sort({ StartDate: -1 })
      .toArray();
    
    const cacheAge = data.length > 0 ? getCacheAge(data[0].cachedAt) : null;
    
    const mapped = data.map(rw => ({
      eventId: rw.EventID,
      roadName: rw.RoadName,
      startDate: rw.StartDate,
      endDate: rw.EndDate,
      location: rw.Location,
      department: rw.SvcDept,
      other: rw.Other
    }));
    
    res.json({ 
      data: mapped, 
      count: mapped.length,
      cache: {
        ageSeconds: cacheAge,
        ttl: 86400
      }
    });
  } catch (err) {
    console.error('[/api/roadworks] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch roadworks' });
  }
});

app.get('/api/vms', async (req, res) => {
  try {
    const data = await db.collection('vms_emas')
      .find({})
      .sort({ cachedAt: -1 })
      .toArray();
    
    const cacheAge = data.length > 0 ? getCacheAge(data[0].cachedAt) : null;
    
    const mapped = data.map(vms => ({
      equipmentId: vms.EquipmentID,
      latitude: vms.Latitude,
      longitude: vms.Longitude,
      message: vms.Message
    }));
    
    res.json({ 
      data: mapped, 
      count: mapped.length,
      cache: {
        ageSeconds: cacheAge,
        ttl: 120
      }
    });
  } catch (err) {
    console.error('[/api/vms] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch VMS/EMAS data' });
  }
});

app.get('/api/train/alerts', async (req, res) => {
  try {
    const data = await db.collection('train_service_alerts')
      .find({})
      .sort({ cachedAt: -1 })
      .toArray();
    
    const cacheAge = data.length > 0 ? getCacheAge(data[0].cachedAt) : null;
    
    res.json({ 
      data,
      count: data.length,
      cache: {
        ageSeconds: cacheAge,
        ttl: 300
      }
    });
  } catch (err) {
    console.error('[/api/train/alerts] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch train service alerts' });
  }
});

app.get('/api/bus/arrival', async (req, res) => {
  try {
    const { busStopCode, serviceNo } = req.query;
    
    if (!busStopCode) {
      return res.status(400).json({ 
        error: 'busStopCode parameter is required',
        example: '/api/bus/arrival?busStopCode=83139'
      });
    }
    
    const findQuery = { BusStopCode: busStopCode };
    if (serviceNo) {
      findQuery.ServiceNo = serviceNo;
    }
    
    const cachedData = await db.collection('bus_arrival')
      .find(findQuery)
      .sort({ cachedAt: -1 })
      .toArray();
    
    const TTL = 30;
    const isCacheFresh = cachedData.length > 0 && !isCacheStale(cachedData[0].cachedAt, TTL);
    
    if (isCacheFresh) {
      const cacheAge = getCacheAge(cachedData[0].cachedAt);
      console.log(`[Bus Arrival] Cache HIT for ${busStopCode} (age: ${cacheAge}s)`);
      
      res.json({ 
        busStopCode,
        services: cachedData,
        count: cachedData.length,
        cache: {
          hit: true,
          ageSeconds: cacheAge,
          ttl: TTL
        }
      });
    } else {
      console.log(`[Bus Arrival] Cache MISS/STALE for ${busStopCode} - Fetching from LTA API...`);
      
      const { updateBusArrivalForStop } = require('./lta');
      await updateBusArrivalForStop(busStopCode, serviceNo);
      
      const freshData = await db.collection('bus_arrival')
        .find(findQuery)
        .sort({ cachedAt: -1 })
        .toArray();
      
      res.json({ 
        busStopCode,
        services: freshData,
        count: freshData.length,
        cache: {
          hit: false,
          ageSeconds: 0,
          ttl: TTL
        }
      });
    }
  } catch (err) {
    console.error('[/api/bus/arrival] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch bus arrival data' });
  }
});

app.post('/api/admin/refresh/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const {
      updateTraffic,
      updateTrafficIncidents,
      updateRoadworks,
      updateVMSEMAS,
      updateTrainServiceAlerts,
      updateBusArrivalForStop
    } = require('./lta');
    
    let result;
    
    switch(type) {
      case 'traffic':
        result = await updateTraffic();
        break;
      case 'incidents':
        result = await updateTrafficIncidents();
        break;
      case 'roadworks':
        result = await updateRoadworks();
        break;
      case 'vms':
        result = await updateVMSEMAS();
        break;
      case 'train':
        result = await updateTrainServiceAlerts();
        break;
      case 'bus':
        const { busStopCode } = req.query;
        if (!busStopCode) {
          return res.status(400).json({ error: 'busStopCode query parameter required' });
        }
        result = await updateBusArrivalForStop(busStopCode);
        break;
      default:
        return res.status(400).json({ error: 'Invalid type. Use: traffic, incidents, roadworks, vms, train, bus' });
    }
    
    res.json({
      message: `${type} data refreshed`,
      recordsUpdated: result,
      time: new Date().toISOString()
    });
  } catch (err) {
    console.error('[/api/admin/refresh] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cache/stats', async (req, res) => {
  try {
    const collections = [
      'traffic_speedbands',
      'traffic_incidents',
      'roadworks',
      'vms_emas',
      'train_service_alerts',
      'bus_arrival'
    ];
    
    const stats = {};
    
    for (const col of collections) {
      const count = await db.collection(col).countDocuments();
      const latest = await db.collection(col).findOne({}, { sort: { cachedAt: -1 } });
      
      stats[col] = {
        totalRecords: count,
        lastCached: latest?.cachedAt || null,
        ageSeconds: latest ? getCacheAge(latest.cachedAt) : null
      };
    }
    
    res.json({ 
      cacheStats: stats,
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    console.error('[/api/cache/stats] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch cache stats' });
  }
});

app.listen(PORT, () => {
  console.log(`Smart City API running → http://localhost:${PORT}`);
  console.log(`Time: ${new Date().toLocaleString('en-SG')}`);
  console.log('Cache Strategy:');
  console.log('- Traffic/VMS/Train: Pre-cached via cron');
  console.log('- Bus Arrival: Cache-aside (lazy loading on-demand)');
});
