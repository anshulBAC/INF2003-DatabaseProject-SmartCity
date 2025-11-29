require('dotenv').config();
const redis = require('redis');

const REDIS_HOST = process.env.REDIS_HOST; 
const REDIS_PORT = process.env.REDIS_PORT;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

let client;

async function connectRedis() {
  if (client) return client;

  client = redis.createClient({
    socket: {
      host: REDIS_HOST,
      port: REDIS_PORT,
    },
    password: REDIS_PASSWORD,
  });

  client.on('error', (err) => console.error('Redis Client Error', err));
  
  try {
    await client.connect();
    console.log("Connected to Redis:", `${REDIS_HOST}:${REDIS_PORT}`);
    return client;
  } catch (err) {
    console.error("Failed to connect to Redis:", err.message);
    throw err;
  }
}

async function closeRedis() {
  if (client) {
    await client.quit();
    console.log("Disconnected from Redis");
  }
}

module.exports = { connectRedis, closeRedis };