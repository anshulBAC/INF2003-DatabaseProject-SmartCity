require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const neo4j = require('neo4j-driver');

const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD; 

let driver;

function connectNeo4j() {
    if (driver) return driver;
    
    if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
        console.error('Neo4j environment variables:');
        console.error('  NEO4J_URI:', NEO4J_URI ? 'SET' : 'MISSING');
        console.error('  NEO4J_USER:', NEO4J_USER ? 'SET' : 'MISSING');
        console.error('  NEO4J_PASSWORD:', NEO4J_PASSWORD ? 'SET' : 'MISSING');
        throw new Error('Neo4j credentials not found in .env file');
    }
    
    driver = neo4j.driver(
        NEO4J_URI,
        neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    );
    console.log('[Neo4j-Node] Driver instance created for cron job.');
    return driver;
}

module.exports = { connectNeo4j };