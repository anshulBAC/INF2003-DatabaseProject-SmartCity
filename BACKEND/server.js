require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./nosql/mongodb');
const { connectRedis, closeRedis } = require('./nosql/redis');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let db;
let redisClient;

(async () => {
  try {
    db = await connectDB();
    redisClient = await connectRedis();
    console.log('Server connected to MongoDB and Redis');
  } catch (error) {
    console.error('Failed to connect to databases:', error);
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

app.get('/api/traffic/incidents', async (req, res) => {
  const { type } = req.query;
  const cacheKey = type ? `traffic:incidents:${type.toLowerCase()}` : 'traffic:incidents:default';
  const TTL_SECONDS = 60; // Cache for 60 seconds

  try {
    // 1. Try to get data from Redis cache
    const cachedResult = await redisClient.get(cacheKey);

    if (cachedResult) {
      const data = JSON.parse(cachedResult);
      console.log(`[Redis HIT] for ${cacheKey}`);
      return res.json(data);
    }
    
    // 2. Redis MISS - Fetch from MongoDB
    console.log(`[Redis MISS] Fetching from MongoDB for ${cacheKey}`);
    
    let findQuery = {};
    if (type) {
      findQuery.Type = {$regex: type, $options: 'i'};
    } else {
      findQuery.Type = { 
        $not: { 
          $regex: 'heavy traffic|heavy vehicle traffic', 
          $options: 'i' 
        } 
      };
    }
    
    const data = await db
      .collection('traffic_incidents')
      .find(findQuery)
      .sort({ cachedAt: -1 })
      .toArray();

    const cacheAge = data.length > 0 ? getCacheAge(data[0].cachedAt) : null;

    const mapped = data.map(inc => ({
      type: inc.Type,
      message: inc.Message,
      latitude: inc.Latitude,
      longitude: inc.Longitude,
    }));
    
    const responseBody = {
      data: mapped,
      count: mapped.length,
      cache: {
        ageSeconds: cacheAge,
        ttl: TTL_SECONDS,
        source: 'MongoDB',
      },
    };

    // 3. Store result in Redis
    await redisClient.set(cacheKey, JSON.stringify(responseBody), {EX: TTL_SECONDS});

    res.json(responseBody);
  } catch (err) {
    console.error('[/api/traffic/incidents] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch traffic incidents' });
  }
});

app.get('/api/vms', async (req, res) => {
  const cacheKey = 'traffic:vms:all';
  const TTL_SECONDS = 60; // Cache for 60 seconds

  try {
    // 1. Try to get data from Redis cache
    const cachedResult = await redisClient.get(cacheKey);

    if (cachedResult) {
      const data = JSON.parse(cachedResult);
      console.log(`[Redis HIT] for ${cacheKey}`);
      return res.json(data);
    }
    
    // 2. Redis MISS - Fetch from MongoDB
    console.log(`[Redis MISS] Fetching from MongoDB for ${cacheKey}`);

    const data = await db
      .collection('vms_emas')
      .find({})
      .sort({ cachedAt: -1 })
      .limit(500)
      .toArray();

    const cacheAge = data.length > 0 ? getCacheAge(data[0].cachedAt) : null;

    const mapped = data.map(d => ({
      equipmentId: d.EquipmentID || d.equipmentId,
      latitude: d.Latitude || d.latitude,
      longitude: d.Longitude || d.longitude,
      Message: d.Message || '',
    }));
    
    const responseBody = {
      data: mapped,
      count: mapped.length,
      cache: {
        ageSeconds: cacheAge,
        ttl: TTL_SECONDS,
        source: 'MongoDB',
      },
    };

    // 3. Store result in Redis
    await redisClient.set(cacheKey, JSON.stringify(responseBody), {EX: TTL_SECONDS});

    res.json(responseBody);
  } catch (err) {
    console.error('[/api/vms] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch VMS data' });
  }
});

app.get('/api/train/alerts', async (req, res) => {
  const cacheKey = 'train:alerts:all';
  const TTL_SECONDS = 300; // Cache for 5 minutes

  try {
    // 1. Try to get data from Redis cache
    const cachedResult = await redisClient.get(cacheKey);

    if (cachedResult) {
      const data = JSON.parse(cachedResult);
      console.log(`[Redis HIT] for ${cacheKey}`);
      return res.json(data);
    }
    
    // 2. Redis MISS - Fetch from MongoDB
    console.log(`[Redis MISS] Fetching from MongoDB for ${cacheKey}`);

    const data = await db
      .collection('train_service_alerts')
      .find({})
      .sort({ cachedAt: -1 })
      .toArray();

    const cacheAge = data.length > 0 ? getCacheAge(data[0].cachedAt) : null;

    const mapped = data.map(d => ({
      status: d.Status,
      line: d.Line,
      direction: d.Direction,
      stations: d.Stations,
      content:
        d.Message && d.Message.length > 0 ? d.Message[0].Content : '',
      createdDate:
        d.Message && d.Message.length > 0 ? d.Message[0].CreatedDate : '',
    }));
    
    const responseBody = {
      data: mapped,
      count: mapped.length,
      cache: {
        ageSeconds: cacheAge,
        ttl: TTL_SECONDS,
        source: 'MongoDB',
      },
    };

    // 3. Store result in Redis
    await redisClient.set(cacheKey, JSON.stringify(responseBody), {EX: TTL_SECONDS});

    res.json(responseBody);
  } catch (err) {
    console.error('[/api/train/alerts] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch train alerts' });
  }
});

app.get('/api/traffic/speedbands', async (req, res) => {
  try {
    const data = await db.collection('traffic_speed_bands').find({}).toArray();
    const latest = data.length > 0 ? data[0] : null;

    res.json({
      data: data,
      lastUpdated: latest ? latest.cachedAt : null,
      ageSeconds: latest ? getCacheAge(latest.cachedAt) : null,
    });
  } catch (err) {
    console.error('[/api/traffic/speedbands] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch traffic speed bands' });
  }
});

app.post('/api/admin/refresh/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const {
      updateTrafficIncidents,
      updateVMSEMAS,
      updateTrainServiceAlerts,
    } = require('./nosql/lta');

    if (type === 'incidents') await redisClient.del('traffic:incidents:default', 'traffic:incidents:heavy', 'traffic:incidents:roadwork');
    if (type === 'vms') await redisClient.del('traffic:vms:all');
    if (type === 'train') await redisClient.del('train:alerts:all');
    
    let result;
    switch (type) {
      case 'incidents':
        result = await updateTrafficIncidents();
        break;
      case 'vms':
        result = await updateVMSEMAS();
        break;
      case 'train':
        result = await updateTrainServiceAlerts();
        break;
      default:
        return res.status(400).json({
          error:
            'Invalid type. Use: incidents, vms, train',
        });
    }

    res.json({
      message: `${type} data refreshed`,
      recordsUpdated: result,
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[/api/admin/refresh] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cache/stats', async (req, res) => {
  try {
    // 1. Get MongoDB Stats
    const collections = [
      'traffic_incidents',
      'vms_emas',
      'train_service_alerts',
    ];

    const stats = {};
    for (const col of collections) {
      const count = await db.collection(col).countDocuments();
      const latest = await db
        .collection(col)
        .findOne({}, { sort: { cachedAt: -1 } });

      stats[col] = {
        totalRecords: count,
        lastCached: latest?.cachedAt || null,
        ageSeconds: latest ? getCacheAge(latest.cachedAt) : null,
      };
    }
    
    // 2. Get Comprehensive Redis Info
    const redisPing = await redisClient.ping();
    const infoResult = await redisClient.info(); // Get ALL stats from Redis server

    // Parse specific metrics from the INFO string (Standard Redis format)
    const hitsMatch = infoResult.match(/keyspace_hits:(\d+)/);
    const missesMatch = infoResult.match(/keyspace_misses:(\d+)/);
    const expiredMatch = infoResult.match(/expired_keys:(\d+)/);
    const totalKeysMatch = infoResult.match(/db0:keys=(\d+)/); 
    const memoryMatch = infoResult.match(/used_memory:(\d+)/);

    res.json({
      cacheStats: stats,
      serverTime: new Date().toISOString(),
      redis: {
        status: redisPing === 'PONG' ? 'Connected' : 'Error',
        memoryUsage: memoryMatch ? `${Math.round(parseInt(memoryMatch[1]) / 1024)} KB` : 'N/A',
        activity: {
          keyspaceHits: hitsMatch ? parseInt(hitsMatch[1]) : 0,
          keyspaceMisses: missesMatch ? parseInt(missesMatch[1]) : 0,
          expiredKeys: expiredMatch ? parseInt(expiredMatch[1]) : 0,
          totalKeys: totalKeysMatch ? parseInt(totalKeysMatch[1]) : 0,
        }
      }
    });
  } catch (err) {
    console.error('[/api/cache/stats] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch cache stats' });
  }
});

app.delete('/api/cache/clear', async (req, res) => {
  try {
    const collections = [
      'traffic_incidents',
      'vms_emas',
      'train_service_alerts',
    ];

    let totalDeleted = 0;

    for (const col of collections) {
      const result = await db.collection(col).deleteMany({});
      totalDeleted += result.deletedCount;
      console.log(`[Cache Clear] Cleared ${result.deletedCount} docs from ${col}`);
    }
    
    // Clear Redis Cache
    const redisKeysDeleted = await redisClient.flushdb();

    res.json({
      message: 'Cache cleared successfully',
      deletedCount: totalDeleted,
      collections: collections,
      redisKeysDeleted: redisKeysDeleted === 'OK' ? 'All keys cleared' : 'Error clearing Redis',
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[/api/cache/clear] error:', err.message);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

app.listen(PORT, () => {
  console.log(`Smart City API running → http://localhost:${PORT}`);
  console.log(`Time: ${new Date().toLocaleString('en-SG')}`);
  console.log('Cache Strategy:');
  console.log('- MongoDB: Primary, persistent cache (updated by cron)');
  console.log('- Redis: Fast, in-memory API response cache (TTL: 60s/300s)');
});