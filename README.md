# 🏙️ Smart City Framework

A comprehensive real-time transportation data visualization and routing system for Singapore, built with a modern polyglot persistence architecture combining SQL and NoSQL databases.


## 📋 Table of Contents
- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Project Structure](#-project-structure)
- [Data Sources](#-data-sources)
- [Performance Optimization](#-performance-optimization)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

The Smart City Framework is an advanced transportation management system designed for Singapore's urban infrastructure. It provides real-time traffic monitoring, intelligent routing with live traffic data, and comprehensive visualization of transportation assets including buses, trains, taxis, and parking facilities.

Built as a comprehensive academic project for INF2003 Database Systems, this system demonstrates advanced database concepts including polyglot persistence, query optimization, graph algorithms, and real-time data processing. The project integrates multiple Singapore government APIs (LTA DataMall, Data.gov.sg, NEA, URA) into a unified platform that combines historical analytics with real-time monitoring.

### What Makes This Special

**🎯 Real-World Application**: Unlike typical academic projects, this system processes real data from Singapore's transportation infrastructure and can be used for actual urban planning and navigation.

**🗄️ Polyglot Persistence Mastery**: Strategic use of four different database technologies (MariaDB, MongoDB, Neo4j, Redis), each selected for its optimal use case - demonstrating deep understanding of when and why to use different database paradigms.

**⚡ Performance Engineering**: Achieved 481x speedup through intelligent indexing and query optimization, reducing database complexity from 28 tables to 9 core tables + 4 views while maintaining full functionality.

**🌐 Full-Stack Integration**: Complete three-tier architecture with Python FastAPI, Node.js Express, and interactive frontend, all communicating seamlessly through RESTful APIs.

**📊 Real-Time Intelligence**: Live data updates every 2-5 minutes through automated cron jobs, with intelligent caching strategies and traffic-aware routing that adapts to current road conditions.

### Key Highlights
- **Real-time Traffic Intelligence**: Live updates every 2-5 minutes from LTA DataMall
- **Graph-based Routing**: Neo4j-powered shortest path with traffic-aware duration calculations  
- **Polyglot Persistence**: Strategic database selection for optimal performance
- **Comprehensive Coverage**: 5,000+ bus stops, 26,000+ routes, 382 carparks, 165 train stations
- **Interactive Dashboard**: Real-time map visualization with traffic cameras and incidents
- **Production-Ready**: Deployed architecture with proper error handling, logging, and monitoring

## 🎥 Features Showcase

### Dashboard Overview
The Smart City Dashboard features a clean, modern interface with a purple gradient theme:

```
┌─────────────────────────────────────────────────────────────────┐
│  🏙️ Smart City Dashboard                                        │
│  Singapore Transportation Infrastructure & Route Planning        │
├────────────┬────────────────────────────────────────────────────┤
│            │                                                     │
│  📊 Stats  │              🗺️ INTERACTIVE MAP                    │
│  --------  │                                                     │
│  5,042     │     ⚠️ Live Congestion & Alerts                   │
│  Bus Stops │     [Scrolling: Heavy traffic on PIE...]          │
│            │                                                     │
│  🗺️ Layers│     🔵 🔴 🟢 🟠 🟣  ← Color-coded markers        │
│  ☑ Buses   │                                                     │
│  ☑ Trains  │     [Interactive Leaflet map with OpenStreetMap]   │
│  ☑ Parks   │                                                     │
│  ☐ Taxis   │     Click to explore • Pan to navigate             │
│  ☑ Cameras │                                                     │
│            │                                                     │
│  🔄 Refresh│                                                     │
│  🗑️ Clear │                                                     │
│            │                                                     │
│  Legend    │                                                     │
│  🔵 Bus    │                                                     │
│  🔴 Train  │                                                     │
│  🟢 Park   │                                                     │
└────────────┴────────────────────────────────────────────────────┘
```

### Route Planning Interface
Switch to Routes tab for traffic-aware navigation:

```
┌────────────────────────────────────────────────────────────────┐
│  🧭 Route Planner                                              │
├────────────┬───────────────────────────────────────────────────┤
│            │                                                    │
│  From:     │         🔴 START (Red Pin)                        │
│  1.3521,   │                                                    │
│  103.8198  │              ↓                                     │
│            │         🟢───→ Color-coded route                  │
│  To:       │         🟡───→ by traffic speed                   │
│  1.2966,   │         🟠───→                                     │
│  103.7764  │         🔴───→                                     │
│            │              ↓                                     │
│  Find      │         🟢 END (Green Pin)                        │
│  Route     │                                                    │
│            │  Route: Fastest Route                             │
│  Route     │  Distance: 15.2 km                                │
│  Info:     │  Duration: 18.5 mins                              │
│  --------  │                                                    │
│  ➡️ Continue│  Directions:                                      │
│  onto PIE  │  ➡️ Continue on PIE (2.3km)                       │
│  (2.3km)   │  ⬅️ Turn left onto CTE (5.1km)                    │
│            │  ➡️ Turn right onto Orchard (800m)                │
│  Nearby    │  ✓ Arrived at destination                         │
│  Bus Stops │                                                    │
│  • Stop A  │  Traffic Legend:                                  │
│  • Stop B  │  🟢 >60 km/h  🟡 40-60  🟠 20-40  🔴 <20        │
└────────────┴───────────────────────────────────────────────────┘
```

### Live Alert System
Real-time scrolling alerts at the top of the map:

```
┌──────────────────────────────────────────────────────────────┐
│ ⚠️ Live Congestion & Alerts                                  │
│ [Scrolling] 📢 Heavy traffic on PIE → 🚇 MRT delay NS Line → │
│             💥 Accident at Bukit Timah Rd → 🚧 Roadwork...   │
└──────────────────────────────────────────────────────────────┘
```

### Interactive Map Features

**1. Layer Visualization**
- Click checkbox to show/hide layers
- Real-time counter updates (e.g., "Bus Stops (5,042)")
- Color-coded markers for quick identification

**2. Traffic Camera Feeds**
- Purple markers for camera locations
- Click marker to view live image feed
- Camera ID and location details in popup

**3. Traffic Incidents**
- Dynamic emoji icons (💥 Accident, 🚧 Roadwork, 🌊 Flood)
- Incident type and description in popup
- Real-time updates every 2 minutes

**4. Carpark Availability**
- Green markers for parking facilities
- Shows available lots and lot type
- Development name and location

**5. Route Visualization**
```
Traffic Speed Color Coding:
🟢 Green Line  = Fast (>60 km/h)    - Smooth flow
🟡 Yellow Line = Moderate (40-60)    - Normal traffic
🟠 Orange Line = Slow (20-40)        - Heavy traffic
🔴 Red Line    = Congestion (<20)    - Jammed
```

## ✨ Features

### 🚦 Traffic Management
- **Live Traffic Speed Bands**: Real-time road segment speeds across Singapore
- **Traffic Incidents**: Up-to-date accident and roadwork information
- **Traffic Cameras**: 90+ live camera feeds with image URLs
- **VMS/EMAS Alerts**: Variable Message Signs and traffic management updates
- **Live Alert Marquee**: Scrolling real-time alerts at top of dashboard

### 🗺️ Intelligent Routing
- **Traffic-Aware Navigation**: Dynamic route calculation using current traffic conditions
- **Turn-by-Turn Directions**: Detailed navigation instructions with distance markers
- **Congestion Analysis**: Light/Moderate/Heavy traffic classification
- **Multi-Route Options**: Alternative route suggestions
- **Visual Traffic Overlay**: Color-coded route segments by current speed
- **Interactive Map Selection**: Click-to-route interface for easy planning

### 🚌 Public Transport
- **Bus Services**: 580 services with real-time schedule information
- **Train Network**: Complete MRT/LRT station coverage
- **Taxi Stands**: 316+ designated taxi pickup locations
- **Service Alerts**: Real-time train service disruptions
- **Nearby Stop Discovery**: Auto-suggest 5 closest bus stops to destination

### 🅿️ Parking Information
- **Carpark Availability**: Live parking lot availability data
- **Location Search**: Find nearby parking with coordinates
- **Multi-Agency Data**: HDB, URA, LTA parking facilities

### 📊 Dashboard Visualization
- **Interactive Map**: Leaflet-based map with layer controls
- **Tab-Based Interface**: Organized Layers and Routes views
- **Real-Time Statistics**: Live counters for all transportation assets
- **Color-Coded Markers**: Visual distinction between transportation types
- **Responsive Design**: Modern gradient purple theme
- **Loading States**: User-friendly loading indicators
- **Error Handling**: Graceful error messages and recovery

## 🏗️ Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                          │
│                                                               │
│  HTML5 + CSS3 + Leaflet.js + Chart.js                       │
│  Interactive Map | Real-time Updates | Traffic Cameras       │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                          │
│                                                               │
│  ┌────────────────────┐        ┌─────────────────────┐     │
│  │  FastAPI (Python)  │        │   Node.js Express   │     │
│  │  Port: 8000        │        │   Port: 5000        │     │
│  │  - Routing API     │        │   - SQL API         │     │
│  │  - Traffic API     │        │   - Historical Data │     │
│  │  - NoSQL Queries   │        │   - CRUD Operations │     │
│  └────────────────────┘        └─────────────────────┘     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Cron Job Manager (Node.js)                 │  │
│  │  - Every 2 min: VMS/EMAS, Traffic Incidents         │  │
│  │  - Every 5 min: Speed Bands, Neo4j Graph Updates    │  │
│  │  - Every 5 min: Train Service Alerts                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER                           │
│                                                               │
│  ┌─────────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐   │
│  │   MariaDB   │  │ MongoDB  │  │ Neo4j  │  │  Redis  │   │
│  │             │  │          │  │        │  │         │   │
│  │ Historical  │  │ Real-time│  │ Road   │  │ Cache   │   │
│  │ Structured  │  │ Streams  │  │ Network│  │ Layer   │   │
│  │ Data        │  │ Traffic  │  │ Graph  │  │         │   │
│  └─────────────┘  └──────────┘  └────────┘  └─────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Polyglot Persistence Strategy

| Database | Purpose | Data Types | Update Frequency |
|----------|---------|------------|------------------|
| **MariaDB** | Historical structured data | Bus stops, routes, services, stations, carparks | Static/Daily |
| **MongoDB** | Real-time dynamic data | Traffic incidents, VMS, train alerts, speed bands | 2-5 minutes |
| **Neo4j** | Road network graph | Traffic-aware routing, pathfinding | 5 minutes |
| **Redis** | High-speed caching | Frequently accessed queries | As needed |

### Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL DATA SOURCES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📡 LTA DataMall API          📊 Data.gov.sg                    │
│  ├── Bus data                 ├── Historical stats              │
│  ├── Train alerts             ├── Infrastructure locations      │
│  ├── Traffic cameras          └── Urban planning data           │
│  ├── Speed bands                                                 │
│  ├── Incidents                🌡️ NEA API                        │
│  └── Parking                  └── Weather data                   │
│                                                                  │
│                               🏢 URA API                         │
│                               └── Carpark data                   │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│              CRON JOB MANAGER (Node.js)                          │
├─────────────────────────────────────────────────────────────────┤
│  ⏰ Every 2 minutes:  VMS/EMAS, Traffic Incidents               │
│  ⏰ Every 5 minutes:  Train Alerts, Speed Bands                 │
│  ⏰ Neo4j Updates:    Graph weights from speed data             │
│  ⏰ Startup Check:    Build road network if empty               │
└──────────────────┬───────────────────────────────────────────────┘
                   │
          ┌────────┴────────┐
          ↓                  ↓
┌──────────────────┐  ┌──────────────────┐
│   MongoDB        │  │   Neo4j Graph    │
│   (Real-time)    │  │   (Routing)      │
├──────────────────┤  ├──────────────────┤
│ • Incidents      │  │ • Point nodes    │
│ • VMS alerts     │  │ • Road segments  │
│ • Train alerts   │  │ • Traffic speeds │
│ • Speed bands    │  │ • Durations      │
│                  │  │ • Shortest path  │
│ TTL: 2-5 min     │  │ Update: 5 min    │
└──────────────────┘  └──────────────────┘
          │                  │
          │         ┌────────┴────────┐
          │         ↓                  ↓
          │  ┌──────────────┐  ┌──────────────┐
          │  │   MariaDB    │  │    Redis     │
          │  │  (Historical)│  │   (Cache)    │
          │  ├──────────────┤  ├──────────────┤
          │  │ • Bus stops  │  │ • Query cache│
          │  │ • Routes     │  │ • Session    │
          │  │ • Stations   │  │ • API cache  │
          │  │ • Carparks   │  │              │
          │  │ • Cameras    │  │ TTL: Varies  │
          │  │              │  └──────────────┘
          │  │ Static/Daily │         │
          │  └──────────────┘         │
          │         │                 │
          └─────────┴─────────────────┘
                    │
          ┌─────────┴─────────┐
          ↓                    ↓
┌──────────────────┐  ┌──────────────────┐
│  FastAPI         │  │  Node.js         │
│  (Python)        │  │  (Express)       │
│  Port: 8001      │  │  Port: 8000      │
├──────────────────┤  ├──────────────────┤
│ • Routing API    │  │ • SQL queries    │
│ • Traffic API    │  │ • Historical data│
│ • NoSQL queries  │  │ • CRUD ops       │
│ • Neo4j routing  │  │ • Statistics     │
│ • Cache mgmt     │  │ • Bus/Train API  │
└──────────────────┘  └──────────────────┘
          │                    │
          └────────┬───────────┘
                   ↓
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (HTML/CSS/JS)                        │
│                    Port: 5500                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🗺️ Layers Tab              🧭 Routes Tab                       │
│  ├── Statistics dashboard   ├── Click-to-route                  │
│  ├── Layer toggles          ├── Traffic visualization           │
│  ├── Marker controls        ├── Turn-by-turn directions         │
│  └── Data refresh           └── Nearby stops                    │
│                                                                  │
│  📍 Interactive Leaflet Map with Real-time Updates              │
│  ⚠️ Live Alert Marquee (VMS, Incidents, Train Alerts)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                   │
                   ↓
              👤 END USER
```

### Data Persistence Decision Matrix

**When to use each database:**

| Requirement | Database Choice | Reason |
|-------------|----------------|--------|
| Static bus stop locations | MariaDB | Relational structure, infrequent updates |
| Real-time traffic incidents | MongoDB | Document-based, frequent updates |
| Traffic-aware routing | Neo4j | Graph relationships, pathfinding algorithms |
| High-speed API response cache | Redis | In-memory, sub-millisecond access |
| Complex queries with JOINs | MariaDB | SQL relationships, ACID compliance |
| Flexible schema for API data | MongoDB | Schemaless, handles varying API responses |
| Shortest path calculations | Neo4j | Native graph traversal, Dijkstra algorithm |
| Session management | Redis | TTL support, key-value store |

### Academic Context

This project was developed for **INF2003 Database Systems** at Singapore Institute of Technology, demonstrating concepts that go "far beyond" the module curriculum:

**Core Database Concepts Demonstrated:**
- ✅ Complex SQL queries with multiple JOINs and aggregations
- ✅ Database normalization and denormalization strategies  
- ✅ Index optimization and query performance tuning
- ✅ Transaction management and ACID properties
- ✅ View creation for query simplification
- ✅ Stored procedures and triggers (where applicable)

**Advanced Concepts Implemented:**
- ✅ **Polyglot Persistence**: Strategic use of SQL, NoSQL, Graph, and In-Memory databases
- ✅ **Graph Algorithms**: Neo4j Cypher for shortest path with dynamic edge weights
- ✅ **Real-time Processing**: Cron-based ETL pipelines with intelligent caching
- ✅ **Query Optimization**: 481x performance improvement through indexing strategies
- ✅ **Database Architecture**: Hybrid SQL/NoSQL design with clear separation of concerns
- ✅ **Spatial Queries**: Location-based searches with distance calculations
- ✅ **API Integration**: Multi-source data aggregation with error handling
- ✅ **Batch Processing**: Efficient bulk operations with transaction control

**Technical Documentation Depth:**
- Database schema design rationale
- Performance benchmarking and optimization analysis
- Trade-off discussions (foreign keys vs. API flexibility)
- Cost-benefit analysis of different database technologies
- Comparative implementation approaches

## 🛠️ Tech Stack

### Backend
- **FastAPI** (Python 3.13) - Main API framework for routing and traffic services
- **Node.js** (v18+) - SQL API server and cron job management
- **Express.js** - Node.js web framework
- **Uvicorn** - ASGI server for FastAPI

### Databases
- **MariaDB 12.0** - Primary relational database
- **MongoDB Atlas** - NoSQL document store for real-time data
- **Neo4j 5.x** - Graph database for routing algorithms
- **Redis** - In-memory cache and message broker

### Frontend
- **Leaflet.js** - Interactive mapping library
- **Chart.js** - Data visualization
- **HTML5/CSS3** - Modern web standards

### Data Processing
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computations
- **Python-dateutil** - Date/time handling

### External APIs
- **LTA DataMall API** - Singapore Land Transport Authority data
- **Data.gov.sg** - Singapore Government Open Data
- **NEA API** - National Environment Agency
- **URA API** - Urban Redevelopment Authority

## 📦 Prerequisites

### Required Software
- **Python 3.13+** with pip
- **Node.js 18+** with npm
- **MariaDB 12.0+**
- **MongoDB Atlas account** (or local MongoDB)
- **Neo4j AuraDB account** (or local Neo4j)
- **Redis** (local or cloud instance)

### API Keys Required
- LTA DataMall API Key ([Register here](https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html))
- MongoDB Atlas connection string
- Neo4j AuraDB credentials
- Redis connection details

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/smart-city-framework.git
cd smart-city-framework
```

### 2. Backend Setup

#### Python Environment (FastAPI)
```bash
cd BACKEND

# Create virtual environment
python3.13 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# For NoSQL-specific dependencies
pip install -r requirements_nosql.txt --break-system-packages
```

#### Node.js Dependencies
```bash
# In BACKEND directory
npm install
```

### 3. Database Setup

#### MariaDB
```bash
# Create database
mysql -u root -p

CREATE DATABASE smart_city;
USE smart_city;
SOURCE sql/smart_city.sql;
```

#### MongoDB
- Create a MongoDB Atlas cluster
- Whitelist your IP address
- Create a database user with read/write permissions
- Note your connection string

#### Neo4j
```bash
# Build the road network graph (one-time setup)
cd BACKEND/nosql
node build_network.js
```

This script will:
- Fetch all traffic speed band data from LTA
- Create Point nodes for road intersections
- Create ROAD_SEGMENT relationships with traffic data
- Takes ~5-10 minutes depending on network

#### Redis
- Set up Redis locally or use a cloud provider
- Note your connection details (host, port, password)

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `BACKEND` directory:

```env
# Application Settings
APP_NAME=Smart City Framework
VERSION=1.0.0
DEBUG=true

# MariaDB Configuration
MARIADB_HOST=localhost
MARIADB_USER=root
MARIADB_PASSWORD=your_password
MARIADB_DATABASE=smart_city

# MongoDB Configuration
MONGODB_USER=your_mongo_user
MONGODB_PASSWORD=your_mongo_password
MONGODB_CLUSTER=cluster0.xxxxx.mongodb.net
MONGODB_NAME=smart_city

# Neo4j Configuration
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# Redis Configuration
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# LTA DataMall API
LTA_API_KEY=your_lta_api_key

# Server Ports
FASTAPI_PORT=8000
NODE_PORT=5000
FRONTEND_PORT=5500
```

### Configuration Files

- `BACKEND/app/config/settings.py` - Application settings
- `BACKEND/app/config/database.py` - Database connection pools
- `BACKEND/package.json` - Node.js dependencies
- `BACKEND/requirements.txt` - Python dependencies

## 🎮 Running the Application

### Quick Start (All Services)

You'll need **4 terminal windows** to run the complete system:

#### Terminal 1: MariaDB Database
```bash
# Start MariaDB service
mysql.server start  # macOS
# OR
sudo systemctl start mariadb  # Linux
```

#### Terminal 2: FastAPI Server (Python - NoSQL/Routing)
```bash
cd BACKEND
source venv/bin/activate
python nosql/main.py
# Server runs on http://localhost:8001
```

#### Terminal 3: Node.js Cron Manager
```bash
cd BACKEND
node cron.js
# Background service - updates data every 2-5 minutes
```

#### Terminal 4: Frontend Dashboard
```bash
cd FRONTEND
python -m http.server 5500
# Or use Live Server extension in VS Code
# Dashboard available at http://localhost:5500/html/dashboard.html
```

### Accessing the Dashboard

1. Open your browser to: `http://localhost:5500/html/dashboard.html`
2. Wait for initial data load (~5-10 seconds)
3. Explore the **🗺️ Layers** tab to view transportation infrastructure
4. Switch to **🧭 Routes** tab to plan routes

### Using the Dashboard

#### Viewing Map Layers
1. **Toggle layers** using checkboxes in the sidebar
2. **Click markers** to see details (bus stop names, carpark availability, camera feeds)
3. **View statistics** at the top of the Layers tab
4. **Monitor live alerts** in the scrolling marquee at the top of the map

#### Planning Routes
1. Switch to the **Routes** tab
2. **Click the map** to set your starting point (red marker appears)
3. **Click again** to set your destination (green marker appears)
4. Click **"Find Route"** button
5. View:
   - Traffic-aware route with color-coded segments
   - Distance and estimated duration
   - Turn-by-turn directions
   - Nearby bus stops at destination

#### Understanding Route Colors
- 🟢 **Green**: Fast traffic (>60 km/h)
- 🟡 **Yellow**: Moderate traffic (40-60 km/h)
- 🟠 **Orange**: Slow traffic (20-40 km/h)
- 🔴 **Red**: Heavy congestion (<20 km/h)

#### Data Management
- **Refresh Data**: Click the refresh button to reload all layers
- **Clear Cache**: Force fresh data fetch from external APIs (removes MongoDB/Redis cache)

### Option 1: Run All Services Individually

#### Terminal 1: FastAPI Server
```bash
cd BACKEND
source venv/bin/activate
python nosql/main.py
# Runs on http://localhost:8000
```

#### Terminal 2: Node.js SQL API
```bash
cd BACKEND
node sql/smart_city_api.py
# Runs on http://localhost:5000
```

#### Terminal 3: Cron Job Manager
```bash
cd BACKEND
node cron.js
# Background service for data updates
```

#### Terminal 4: Frontend Server
```bash
cd FRONTEND
python -m http.server 5500
# Or use Live Server extension in VS Code
# Runs on http://localhost:5500
```

### Option 2: Production Deployment

```bash
# FastAPI with Gunicorn
gunicorn nosql.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Node.js with PM2
pm2 start sql/smart_city_api.py --name smart-city-sql
pm2 start cron.js --name smart-city-cron
```

## 📚 API Documentation

### FastAPI Interactive Docs
When running in DEBUG mode, access comprehensive API documentation at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Routing & Navigation
```http
GET /api/routing/optimize?start_lat=1.3521&start_lon=103.8198&end_lat=1.2966&end_lon=103.7764&vehicle_type=car
```
Returns traffic-aware optimized routes with turn-by-turn directions.

#### Traffic Monitoring
```http
GET /api/v1/traffic/incidents
```
Real-time traffic incidents and accidents.

```http
GET /api/v1/traffic/cameras
```
All traffic camera feeds with image URLs.

```http
GET /api/v1/traffic/vms-emas
```
Variable Message Signs and EMAS alerts.

#### Transportation Data
```http
GET /api/bus-stops?limit=100&offset=0
```
Paginated bus stop information.

```http
GET /api/train-stations
```
All MRT/LRT stations with locations.

```http
GET /api/v1/parking/overview
```
Comprehensive parking availability overview.

### Response Format

All API responses follow this structure:
```json
{
  "status": "success",
  "data": { ... },
  "metadata": {
    "timestamp": "2025-11-30T10:00:00Z",
    "source": "LTA DataMall"
  }
}
```

Error responses:
```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "detail": "Technical details (DEBUG mode only)"
}
```

## 🗄️ Database Schema

### MariaDB Tables (9 core + 4 views)

#### Core Tables
- **bus_stops** - 5,000+ bus stop locations
- **bus_routes** - 26,000+ route segments with schedules
- **bus_services** - 580 service definitions
- **carparks** - 382 carpark facilities
- **train_stations** - 165 MRT/LRT stations
- **taxi_stops** - 316 taxi stands
- **traffic_cameras** - 90+ camera locations
- **erp_rates** - Electronic Road Pricing rates
- **bus_interchange** - Major bus terminal info

#### Views (Optimized Queries)
- **view_bus_stops_with_services** - Bus stops joined with service counts
- **view_carpark_summary** - Aggregated parking statistics
- **view_train_station_routes** - Stations with line information
- **view_traffic_overview** - Combined traffic monitoring data

### MongoDB Collections

```javascript
// traffic_incidents
{
  Type: "Accident",
  Latitude: 1.3521,
  Longitude: 103.8198,
  Message: "Accident on PIE...",
  cachedAt: ISODate("2025-11-30T10:00:00Z")
}

// vms_emas
{
  DeviceID: "VMS001",
  Message: "Heavy traffic ahead",
  Latitude: 1.3521,
  Longitude: 103.8198,
  cachedAt: ISODate("2025-11-30T10:00:00Z")
}

// train_service_alerts
{
  Status: 1,
  AffectedSegments: "NS1-NS5",
  Message: "Train delay...",
  cachedAt: ISODate("2025-11-30T10:00:00Z")
}

// traffic_speed_bands
{
  LinkID: "12345",
  RoadName: "Pan Island Expressway",
  MinimumSpeed: 45,
  MaximumSpeed: 65,
  StartLat: 1.3521,
  StartLon: 103.8198,
  cachedAt: ISODate("2025-11-30T10:00:00Z")
}
```

### Neo4j Graph Model

```cypher
// Nodes
(:Point {lat: Float, lon: Float, id: String})

// Relationships
(:Point)-[:ROAD_SEGMENT {
  link_id: String,
  road_name: String,
  road_category: String,
  min_speed: Float,
  max_speed: Float,
  current_speed_kph: Float,
  distance_km: Float,
  duration_sec: Float
}]->(:Point)
```

## 🎨 Frontend Architecture

### Interactive Dashboard Features

The frontend provides a comprehensive real-time visualization and routing interface built with modern web technologies:

#### **Tab-Based Interface**
- **🗺️ Layers Tab**: Map layer controls and statistics
- **🧭 Routes Tab**: Interactive route planning with turn-by-turn directions

#### **Real-Time Visualization**
- **Interactive Leaflet Map**: Centered on Singapore (1.3521°N, 103.8198°E)
- **Layer Toggle System**: Show/hide different transportation layers
- **Live Traffic Alerts**: Scrolling marquee with real-time incidents, VMS messages, and train alerts
- **Color-Coded Markers**: 
  - 🔵 Bus Stops (Blue)
  - 🔴 Train Stations (Red)
  - 🟢 Carparks (Green)
  - 🟠 Taxi Stands (Orange)
  - 🟣 Traffic Cameras (Purple)
  - 💥 Traffic Incidents (Dynamic emojis)

#### **Smart Route Planning**
- **Click-to-Route**: Click map to set start/end points
- **Traffic-Aware Visualization**: Color-coded route segments by speed:
  - 🟢 Green: >60 km/h (Fast)
  - 🟡 Yellow: 40-60 km/h (Moderate)
  - 🟠 Orange: 20-40 km/h (Slow)
  - 🔴 Red: <20 km/h (Congestion)
- **Turn-by-Turn Directions**: Detailed navigation instructions
- **Nearby Bus Stops**: Automatic discovery of 5 closest stops

#### **Real-Time Data Updates**
- **Auto-Refresh**: Background cron jobs update data every 2-5 minutes
- **Manual Refresh**: User-triggered data reload
- **Cache Management**: Clear cache to force fresh data fetch
- **Live Statistics**: Real-time counters for all transportation assets

### Frontend Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Leaflet.js** | Interactive mapping library | 1.9.4 |
| **OpenStreetMap** | Base map tiles | Latest |
| **Vanilla JavaScript** | Application logic | ES6+ |
| **CSS3** | Modern styling with gradients | - |
| **HTML5** | Semantic markup | - |

### User Interface Components

#### Statistics Dashboard
```javascript
// Real-time statistics grid
- Bus Stops: 5,000+
- Train Stations: 165
- Carparks: 382
- Taxi Stands: 316
- Traffic Cameras: 90+
- Bus Routes: 26,000+
```

#### Layer Controls
Interactive checkboxes with live counts:
```html
☑️ Bus Stops (5,042)
☑️ Train Stations (165)
☑️ Carparks (382)
☐ Taxi Stands (316)
☑️ Traffic Cameras (90)
☑️ Traffic Incidents (12)
```

#### Route Information Display
```
🚗 Route: Fastest Route
Distance: 15.2 km
Duration: 18.5 mins

Directions:
➡️ Continue onto Pan Island Expressway (2.3km)
⬅️ Turn left onto Central Expressway (5.1km)
➡️ Turn right onto Orchard Road (800m)
✓ You have arrived at your destination
```

### API Integration

The frontend communicates with dual backend APIs:

```javascript
const CONFIG = {
    API: {
        SQL: 'http://localhost:8000',    // Historical data
        NOSQL: 'http://localhost:8001'   // Real-time data & routing
    }
};
```

**Key Frontend-Backend Interactions:**

| Frontend Action | Backend API | Response |
|----------------|-------------|----------|
| Load bus stops | `GET /api/bus-stops?limit=5000` | Array of bus stop objects |
| Load train stations | `GET /api/train-stations` | Array of station objects |
| Load carparks | `GET /api/carparks` | Array of carpark objects with availability |
| Load traffic cameras | `GET /api/traffic-cameras/live` | Array with live image URLs |
| Load incidents | `GET /api/v1/traffic/incidents` | Real-time incident data |
| Plan route | `GET /api/routing/optimize?start_lat=...` | Optimized routes with turn-by-turn |
| Load statistics | `GET /api/stats` | Aggregated counts |
| Clear cache | `DELETE /api/cache/clear` | Cache deletion confirmation |

### Custom Icon System

The dashboard uses a sophisticated SVG-based icon generation system:

```javascript
// Dynamic icon generator
const icons = {
    create: (color, size = [9, 9]) => L.icon({
        iconUrl: `data:image/svg+xml;base64,...`,
        iconSize: size,
        iconAnchor: [size[0]/2, size[1]/2]
    })
};

// Specialized route markers
icons.routeStart  // Red pin marker for origin
icons.routeEnd    // Green pin marker for destination

// Dynamic incident icons
icons.getIncident(type) // Returns emoji based on incident type:
// 💥 Accident, 🚗 Breakdown, 🚧 Roadwork, 🌊 Flood, 🚦 Traffic Light
```

### State Management

Client-side state is managed through a global state object:

```javascript
const state = {
    routeMode: 'driving',              // Transportation mode
    routingAlgo: 'neo4j',              // Routing algorithm
    routeMarkers: { from: null, to: null },  // Route start/end markers
    neo4jRouteLines: [],               // Active route polylines
    allBusStops: [],                   // Cached bus stops for nearby search
    liveAlerts: {                      // Real-time alert aggregation
        train: [],
        vms: [],
        incidents: []
    }
};
```

### Performance Optimizations

#### Efficient Data Loading
```javascript
// Parallel data fetching using Promise.allSettled
await Promise.allSettled([
    loadBusStops(),
    loadTrainStations(),
    loadCarparks(),
    loadCameras(),
    loadIncidents()
]);
```

#### Marker Clustering Strategy
- **Limit parameters**: Configurable limits prevent excessive marker rendering
- **Layer groups**: Efficient layer management with Leaflet LayerGroups
- **On-demand loading**: Taxi stops only load when checkbox is enabled

#### Smart Caching
- **Browser-side caching**: Stores bus stop data for nearby searches
- **Server-side caching**: Redis/MongoDB cache with TTL policies
- **Manual cache control**: User-triggered cache clearing

## 📁 Project Structure

```
smart-city-framework/
│
├── BACKEND/
│   ├── app/
│   │   ├── config/
│   │   │   ├── database.py          # Database connection management
│   │   │   └── settings.py          # Application configuration
│   │   ├── models/
│   │   │   ├── nosql_models.py      # MongoDB/Neo4j data models
│   │   │   └── sql_models.py        # SQLAlchemy ORM models
│   │   ├── services/
│   │   │   ├── traffic_service.py   # Traffic data processing
│   │   │   └── parking_service.py   # Parking availability logic
│   │   └── utils/
│   │       └── helpers.py           # Utility functions
│   │
│   ├── nosql/
│   │   ├── build_network.js         # One-time Neo4j graph builder
│   │   ├── lta.js                   # LTA API integration
│   │   ├── mongodb.js               # MongoDB connection
│   │   ├── neo4j.js                 # Neo4j driver setup
│   │   ├── redis.js                 # Redis connection
│   │   └── main.py                  # FastAPI application entry point
│   │
│   ├── sql/
│   │   ├── smart_city.sql           # Database schema and data dump
│   │   └── smart_city_api.py        # Node.js SQL API server
│   │
│   ├── cron.js                      # Automated data refresh jobs
│   ├── package.json                 # Node.js dependencies
│   ├── requirements.txt             # Python dependencies (SQL)
│   └── requirements_nosql.txt       # Python dependencies (NoSQL/Routing)
│
└── FRONTEND/
    ├── html/
    │   └── dashboard.html           # Single-page application (619 lines)
    │                                 # - Modular JavaScript architecture
    │                                 # - Real-time map visualization
    │                                 # - Interactive routing interface
    │                                 # - Live traffic alerts marquee
    └── style.css                    # Complete styling (623 lines)
                                      # - Gradient purple theme
                                      # - Responsive layout
                                      # - Tab system
                                      # - Map overlays
                                      # - Loading states
```

## 🌐 Data Sources

### LTA DataMall API
Primary source for real-time transportation data:
- Bus arrivals, routes, and services
- Traffic speed bands and incidents
- Carpark availability
- Train service alerts
- Taxi availability
- Traffic camera images

**API Endpoint**: `https://datamall2.mytransport.sg/ltaodataservice/`

### Data.gov.sg
Government open data portal:
- Historical transportation statistics
- Infrastructure locations
- Urban planning data

### Update Frequencies
- **High-frequency** (2 minutes): VMS/EMAS, Traffic Incidents
- **Medium-frequency** (5 minutes): Speed Bands, Train Alerts, Neo4j Updates
- **Low-frequency** (Daily/Static): Bus stops, Routes, Stations

## ⚡ Performance Optimization

### Database Optimizations

#### MariaDB Indexing Strategy
```sql
-- Composite indexes for common queries
CREATE INDEX idx_service_direction ON bus_routes(ServiceNo, Direction);
CREATE INDEX idx_stop_lookup ON bus_stops(BusStopCode);
CREATE INDEX idx_carpark_area ON carparks(Area, Development);

-- Spatial indexes for location queries
CREATE SPATIAL INDEX idx_bus_location ON bus_stops(Latitude, Longitude);
```

#### Query Performance Results
- Bus route lookup: **481x faster** with optimized indexes
- Carpark search: **~0.05s** average response time
- Database size: Reduced from 28 tables to **9 core tables + 4 views**

#### MongoDB Indexes
```javascript
db.traffic_speed_bands.createIndex({ LinkID: 1 })
db.traffic_incidents.createIndex({ cachedAt: -1 })
db.vms_emas.createIndex({ Location: "2dsphere" })
```

#### Neo4j Optimization
```cypher
// Index on Point coordinates for fast nearest-neighbor search
CREATE INDEX point_location FOR (p:Point) ON (p.lat, p.lon)

// Composite property index for route queries
CREATE INDEX road_segment_props FOR ()-[r:ROAD_SEGMENT]-() ON (r.current_speed_kph, r.distance_km)
```

### Caching Strategy

**Redis TTL Policies:**
- Traffic incidents: 120 seconds
- Speed bands: 300 seconds
- Static data (bus stops): 24 hours
- API responses: Conditional based on data volatility

### Concurrent Processing
```javascript
// Batch processing for bulk operations
const batchSize = 500;
for (let i = 0; i < data.length; i += batchSize) {
  const batch = data.slice(i, i + batchSize);
  await processBatch(batch);
}
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Frontend Issues

**Problem: Dashboard shows "Loading data..." indefinitely**
```bash
Solution:
1. Check that all backend services are running
2. Verify API endpoints in browser console (F12)
3. Check CORS settings in backend configuration
4. Ensure ports 8000, 8001, 5000 are accessible
```

**Problem: Map markers not appearing**
```bash
Solution:
1. Check browser console for JavaScript errors
2. Verify data is loading (check Network tab in DevTools)
3. Ensure layer checkboxes are enabled
4. Try refreshing the page (Ctrl+R)
```

**Problem: Route planning returns "No route found"**
```bash
Solution:
1. Ensure Neo4j road network is built (run build_network.js)
2. Check that cron job is updating traffic speeds
3. Verify Neo4j connection in FastAPI logs
4. Try clicking points within Singapore boundaries
```

#### Backend Issues

**Problem: FastAPI server won't start**
```bash
Solution:
1. Check Python version: python --version (requires 3.13+)
2. Verify all dependencies: pip list
3. Check MongoDB/Neo4j connectivity
4. Review .env file configuration
```

**Problem: Cron job not updating data**
```bash
Solution:
1. Check LTA API key is valid
2. Verify MongoDB connection string
3. Check Node.js version: node --version (requires 18+)
4. Review cron.js logs for error messages
```

**Problem: Neo4j routing errors**
```bash
Solution:
1. Verify Neo4j credentials in .env
2. Run build_network.js to populate graph database
3. Check Neo4j Aura instance is running
4. Ensure traffic speed updates are occurring (check cron logs)
```

#### Database Issues

**Problem: MariaDB connection refused**
```bash
Solution:
1. Start MariaDB: mysql.server start (macOS) or systemctl start mariadb (Linux)
2. Verify credentials in .env file
3. Check database exists: SHOW DATABASES;
4. Import schema if missing: SOURCE sql/smart_city.sql;
```

**Problem: MongoDB cache not updating**
```bash
Solution:
1. Verify MongoDB Atlas connection string
2. Check IP whitelist in MongoDB Atlas
3. Test connection: mongo "your-connection-string"
4. Use "Clear All Cache" button in dashboard
```

### Performance Issues

**Problem: Slow map loading**
```bash
Solution:
1. Reduce BUS_STOPS limit in CONFIG (dashboard.html line 161)
2. Disable unnecessary layers
3. Check network speed to APIs
4. Consider using Redis cache
```

**Problem: Routing takes too long**
```bash
Solution:
1. Ensure Neo4j indexes are created (check build_network.js)
2. Verify cron job is updating graph weights
3. Check Neo4j instance resources (RAM/CPU)
4. Consider shorter routes (< 30 km works best)
```

### Debug Mode

Enable debug logging in FastAPI:
```python
# In BACKEND/app/config/settings.py
DEBUG = True
```

Check browser console for frontend errors:
```
F12 (Chrome/Firefox) → Console tab
Look for red error messages
```

Check backend logs:
```bash
# FastAPI logs
tail -f backend.log

# Cron job logs
tail -f cron.log

# Check specific endpoint
curl http://localhost:8001/api/v1/traffic/incidents
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint for JavaScript
- Write unit tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Land Transport Authority (LTA)** - For comprehensive DataMall API providing real-time transportation data
- **Data.gov.sg** - Singapore Government Open Data Portal for infrastructure datasets
- **Singapore Institute of Technology** - INF2003 Database Systems Module
- **Team 11** - Project development and implementation
- **OpenStreetMap Contributors** - Base map tiles for visualization
- **Leaflet.js Community** - Excellent mapping library

## 📊 Project Statistics

### Codebase
- **Backend**: ~2,500 lines (Python + Node.js)
- **Frontend**: ~1,200 lines (HTML + CSS + JavaScript)
- **Database Schema**: 33,000+ lines (with data)
- **Total Files**: 25+ source files

### Data Coverage
- **Bus Infrastructure**: 5,042 stops, 26,000+ routes, 580 services
- **Rail Network**: 165 stations across MRT/LRT lines
- **Road Network**: 15,000+ segments in Neo4j graph
- **Parking**: 382 carparks with real-time availability
- **Monitoring**: 90+ traffic cameras, real-time incident tracking

### Performance Metrics
- **Query Optimization**: 481x speedup on key queries
- **Data Update Frequency**: 2-5 minute intervals
- **Average API Response**: <200ms for most endpoints
- **Route Calculation**: ~1-2 seconds for typical Singapore routes
- **Database Size**: ~180MB MariaDB + dynamic NoSQL collections

## 💡 Technical Achievements

### Database Engineering
- **Polyglot Persistence**: Strategic use of 4 different database technologies
- **Query Optimization**: From 28 tables down to 9 core tables + 4 views
- **Hybrid Architecture**: SQL for historical, NoSQL for real-time
- **Graph Algorithms**: Traffic-aware shortest path implementation

### System Integration
- **Multi-API Integration**: LTA DataMall, Data.gov.sg, NEA, URA
- **Real-time Processing**: Automated cron jobs with smart caching
- **Dual Backend**: Python FastAPI + Node.js Express for optimal performance
- **Cross-browser Compatibility**: Tested on Chrome, Firefox, Safari, Edge

### Advanced Features
- **Turn-by-Turn Navigation**: Direction generation with bearing calculations
- **Traffic-Aware Routing**: Real-time speed band integration in pathfinding
- **Live Visualization**: Color-coded routes, dynamic markers, scrolling alerts
- **Intelligent Caching**: Multi-tier caching with differentiated TTL policies


## 🗺️ Roadmap

### Current Status (v1.0.0)
- ✅ Real-time traffic monitoring
- ✅ Graph-based intelligent routing
- ✅ Comprehensive transportation data
- ✅ Interactive dashboard

### Planned Features (v2.0.0)
- 🔄 Machine learning traffic prediction
- 🔄 Multi-modal journey planning
- 🔄 Mobile app integration
- 🔄 User authentication and personalization
- 🔄 Historical analytics dashboard
- 🔄 Weather integration for route planning

## 📖 Quick Reference Guide

### Essential Commands

```bash
# Start all services
cd BACKEND && source venv/bin/activate && python nosql/main.py &
cd BACKEND && node cron.js &
cd FRONTEND && python -m http.server 5500 &

# Stop all services
pkill -f "python nosql/main.py"
pkill -f "node cron.js"
pkill -f "http.server 5500"

# Check service status
lsof -i :8001  # FastAPI
lsof -i :8000  # Node.js SQL API
lsof -i :5500  # Frontend

# View logs
tail -f BACKEND/nosql/app.log
tail -f BACKEND/cron.log

# Database operations
mysql -u root -p smart_city  # Access MariaDB
mongo "your-mongodb-uri"     # Access MongoDB
cypher-shell -u neo4j        # Access Neo4j

# Clear caches (via API)
curl -X DELETE http://localhost:8001/api/cache/clear

# Test endpoints
curl http://localhost:8001/api/v1/traffic/incidents
curl http://localhost:8000/api/bus-stops?limit=10
curl "http://localhost:8001/api/routing/optimize?start_lat=1.3521&start_lon=103.8198&end_lat=1.2966&end_lon=103.7764"
```

### Environment Variables Quick Reference

```env
# Required for basic operation
MARIADB_HOST=localhost
MARIADB_DATABASE=smart_city
MONGODB_CLUSTER=yourcluster.mongodb.net
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
LTA_API_KEY=your_lta_key_here

# Optional (defaults exist)
REDIS_HOST=localhost
DEBUG=true
FASTAPI_PORT=8001
```

### Port Reference

| Port | Service | Purpose |
|------|---------|---------|
| 3306 | MariaDB | Database server |
| 8001 | FastAPI | NoSQL API & Routing |
| 8000 | Node.js | SQL API & Historical data |
| 5500 | Frontend | Dashboard UI |
| 27017 | MongoDB | NoSQL database (if local) |
| 7687 | Neo4j | Graph database (if local) |
| 6379 | Redis | Cache server (if local) |

### File Locations Quick Reference

```
Important Files:
├── Configuration
│   ├── .env                          # All credentials
│   ├── BACKEND/app/config/settings.py  # App settings
│   └── BACKEND/app/config/database.py  # DB connections
│
├── Entry Points  
│   ├── BACKEND/nosql/main.py         # FastAPI server
│   ├── BACKEND/sql/smart_city_api.py # Node.js server
│   ├── BACKEND/cron.js               # Background jobs
│   └── FRONTEND/html/dashboard.html  # UI
│
├── Database
│   ├── BACKEND/sql/smart_city.sql    # Schema + data
│   └── BACKEND/nosql/build_network.js # Neo4j setup
│
└── Documentation
    ├── README.md                     # This file
    └── BACKEND/app/                  # API documentation
```

### Common API Endpoints

**Traffic & Routing (FastAPI - Port 8001)**
```
GET  /api/v1/traffic/incidents           # Real-time incidents
GET  /api/v1/traffic/cameras             # Traffic cameras
GET  /api/v1/traffic/vms-emas            # VMS alerts
GET  /api/routing/optimize               # Get optimized route
GET  /api/v1/parking/overview            # Parking availability
DELETE /api/cache/clear                  # Clear all caches
```

**Transportation Data (Node.js - Port 8000)**
```
GET  /api/bus-stops?limit=100            # Bus stops (paginated)
GET  /api/train-stations                 # Train stations
GET  /api/carparks                       # Carpark data
GET  /api/taxi-stops                     # Taxi stands
GET  /api/traffic-cameras/live           # Live camera feeds
GET  /api/stats                          # System statistics
```

### Dashboard Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1` | Switch to Layers tab |
| `2` | Switch to Routes tab |
| `R` | Refresh all data |
| `C` | Clear route |
| `ESC` | Close popups |
| `F5` | Reload page |

### Color Code Reference

**Map Markers**
- 🔵 Blue: Bus Stops
- 🔴 Red: Train Stations
- 🟢 Green: Carparks
- 🟠 Orange: Taxi Stands
- 🟣 Purple: Traffic Cameras

**Route Traffic Speeds**
- 🟢 Green: >60 km/h (Fast)
- 🟡 Yellow: 40-60 km/h (Moderate)
- 🟠 Orange: 20-40 km/h (Slow)
- 🔴 Red: <20 km/h (Congested)

**Incident Icons**
- 💥 Accident
- 🚗 Vehicle Breakdown
- 🚧 Roadwork
- 🌊 Flood
- 🚦 Traffic Light Fault
- ⚠️ Other Incidents

---

*Last Updated: November 30, 2025*
