require('dotenv').config();
const { MongoClient } = require('mongodb');

const user = process.env.MONGODB_USER;
const password = process.env.MONGODB_PASSWORD;
const cluster = process.env.MONGODB_CLUSTER;
const dbName = process.env.MONGODB_NAME;

const uri = `mongodb+srv://${user}:${password}@${cluster}/?retryWrites=true&w=majority&appName=${dbName}`;

let client;
let db;

async function connectDB() {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  console.log("Connected to MongoDB:", dbName);
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

module.exports = { connectDB, closeDB };
