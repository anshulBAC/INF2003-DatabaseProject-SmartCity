require('dotenv').config();
const neo4j = require('neo4j-driver');

const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD; 

let driver;

function connectNeo4j() {
    if (driver) return driver;
    
    driver = neo4j.driver(
        NEO4J_URI,
        neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    );
    console.log('[Neo4j-Node] Driver instance created for cron job.');
    return driver;
}

module.exports = { connectNeo4j };