require('dotenv').config();
const { MongoClient } = require('mongodb');

const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const cluster = process.env.DB_CLUSTER;
const dbName = process.env.DB_NAME;

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
