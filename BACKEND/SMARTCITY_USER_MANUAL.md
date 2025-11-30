# Smart City Framework - User Manual

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Requirements](#2-system-requirements)
3. [Environment Setup](#3-environment-setup)
4. [Database Configuration](#4-database-configuration)
5. [Application Configuration](#5-application-configuration)
6. [Running the Application](#6-running-the-application)
7. [Using the Dashboard](#7-using-the-dashboard)
8. [Troubleshooting](#8-troubleshooting)
9. [Appendix](#9-appendix)

---

## 1. Introduction

### 1.1 Purpose
This user manual provides detailed instructions for setting up, configuring, and running the Smart City Framework application. By following this manual, users will be able to successfully deploy and operate the complete system on their local machine.

### 1.2 System Overview
The Smart City Framework is a three-tier web application that provides:
- Real-time Singapore transportation data visualization
- Traffic-aware routing with turn-by-turn directions
- Interactive map interface with multiple transportation layers
- Live traffic monitoring and alerts

### 1.3 Architecture Components
The application consists of:
- **Frontend**: HTML/CSS/JavaScript dashboard (Port 5500)
- **Backend APIs**: 
  - Python FastAPI server (Port 8001) - NoSQL operations and routing
  - Node.js Express server (Port 8000) - SQL operations
- **Background Services**: Node.js cron job manager
- **Databases**:
  - MariaDB (Port 3306) - Historical structured data
  - MongoDB Atlas - Real-time dynamic data
  - Neo4j Aura - Graph database for routing
  - Redis - Caching layer

---

## 2. System Requirements

### 2.1 Hardware Requirements

**Minimum Requirements:**
- **Processor**: Dual-core CPU (2.0 GHz or higher)
- **RAM**: 8 GB
- **Storage**: 5 GB free disk space
- **Network**: Stable internet connection (minimum 10 Mbps)

**Recommended Requirements:**
- **Processor**: Quad-core CPU (2.5 GHz or higher)
- **RAM**: 16 GB
- **Storage**: 10 GB free disk space
- **Network**: High-speed internet connection (50+ Mbps)

### 2.2 Software Requirements

#### Operating System
- **macOS**: 10.15 (Catalina) or later
- **Windows**: Windows 10/11 (64-bit)
- **Linux**: Ubuntu 20.04 LTS or later, Debian 10+, CentOS 8+

#### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Python | 3.13 or higher | Backend API (FastAPI) |
| Node.js | 18.0 or higher | Backend API (Express) + Cron jobs |
| npm | 9.0 or higher | Node.js package manager |
| MariaDB | 12.0 or higher | Relational database |
| Git | 2.0 or higher | Version control |

#### Cloud Database Accounts Required
- **MongoDB Atlas** - Free tier account
- **Neo4j Aura** - Free tier account  
- **Redis Cloud** (optional) - Free tier account OR local Redis installation

#### External API Access
- **LTA DataMall API Key** - Free registration at https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html

### 2.3 Browser Requirements
- Google Chrome 90+
- Mozilla Firefox 88+
- Safari 14+
- Microsoft Edge 90+

---

## 3. Environment Setup

### 3.1 Installing Python 3.13

#### macOS
```bash
# Using Homebrew
brew install python@3.13

# Verify installation
python3 --version
# Expected output: Python 3.13.x
```

#### Windows
1. Download Python 3.13 from https://www.python.org/downloads/
2. Run the installer
3. **Important**: Check "Add Python to PATH" during installation
4. Verify installation:
```cmd
python --version
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install python3.13 python3.13-venv python3-pip

# Verify installation
python3.13 --version
```

### 3.2 Installing Node.js and npm

#### macOS
```bash
# Using Homebrew
brew install node@18

# Verify installation
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

#### Windows
1. Download Node.js 18 LTS from https://nodejs.org/
2. Run the installer (includes npm automatically)
3. Verify installation:
```cmd
node --version
npm --version
```

#### Linux (Ubuntu/Debian)
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3.3 Installing MariaDB

#### macOS
```bash
# Using Homebrew
brew install mariadb@12

# Start MariaDB service
brew services start mariadb

# Secure the installation
mysql_secure_installation
# Follow prompts to set root password
```

#### Windows
1. Download MariaDB from https://mariadb.org/download/
2. Run the MSI installer
3. During installation:
   - Set root password (remember this!)
   - Enable "Use UTF8 as default server's character set"
4. Start MariaDB from Services or Command Prompt:
```cmd
net start MariaDB
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install mariadb-server mariadb-client

# Start MariaDB service
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Secure the installation
sudo mysql_secure_installation
# Set root password when prompted
```

### 3.4 Installing Git

#### macOS
```bash
# Git comes pre-installed, or install via Homebrew
brew install git

# Verify
git --version
```

#### Windows
1. Download Git from https://git-scm.com/download/win
2. Run installer with default settings
3. Verify:
```cmd
git --version
```

#### Linux
```bash
sudo apt update
sudo apt install git

# Verify
git --version
```

### 3.5 Setting Up Cloud Databases

#### MongoDB Atlas Setup

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up for a free account
   - Verify your email

2. **Create Cluster**
   - Click "Build a Database"
   - Select "FREE" tier (M0 Sandbox)
   - Choose your preferred cloud provider and region (Singapore recommended)
   - Name your cluster: `smart-city-cluster`
   - Click "Create"

3. **Configure Database Access**
   - Go to "Database Access" in left menu
   - Click "Add New Database User"
   - Username: `smartcityuser`
   - Password: Generate a secure password (SAVE THIS!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" in left menu
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → Click "Connect"
   - Select "Connect your application"
   - Driver: Node.js, Version: 4.1 or later
   - Copy the connection string, it looks like:
   ```
   mongodb+srv://smartcityuser:<password>@smart-city-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - Save this connection string for later

#### Neo4j Aura Setup

1. **Create Account**
   - Go to https://neo4j.com/cloud/aura/
   - Click "Start Free"
   - Sign up for a free account

2. **Create Instance**
   - Click "New Instance"
   - Select "AuraDB Free"
   - Instance name: `smart-city-routing`
   - Region: Select closest to you (Singapore if available)
   - Click "Create"

3. **Save Credentials**
   - A popup will appear with your credentials
   - **IMPORTANT**: Download and save the credentials file
   - You'll receive:
     - Connection URI: `neo4j+s://xxxxx.databases.neo4j.io`
     - Username: `neo4j`
     - Password: (random generated password)
   - **You cannot recover this password later!**

4. **Wait for Instance**
   - Wait 2-3 minutes for instance to become active
   - Status will change from "Creating" to "Running"

#### Redis Setup (Optional - Local Installation)

**macOS:**
```bash
brew install redis
brew services start redis

# Test connection
redis-cli ping
# Expected output: PONG
```

**Windows:**
Download from https://github.com/microsoftarchive/redis/releases
Or use Redis Cloud free tier (recommended)

**Linux:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli ping
```

**Or use Redis Cloud:**
1. Go to https://redis.com/try-free/
2. Create free account
3. Create database
4. Save connection details (host, port, password)

### 3.6 Obtaining LTA DataMall API Key

1. **Register for Account**
   - Go to https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html
   - Click "Request for API Access"
   - Fill in the registration form:
     - Email address
     - Organization: Your university/personal
     - Purpose: Educational/Research project
   - Submit the form

2. **Verify Email**
   - Check your email for verification link
   - Click the link to verify your account

3. **Get API Key**
   - Log in to LTA DataMall
   - Go to "Account Settings"
   - Find your API Key (looks like: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - Copy and save this key securely

---

## 4. Database Configuration

### 4.1 Setting Up MariaDB

#### Step 1: Access MariaDB
```bash
# macOS/Linux
mysql -u root -p

# Windows
mysql -u root -p
# Enter the root password you set during installation
```

#### Step 2: Create Database
```sql
-- Create the smart_city database
CREATE DATABASE smart_city CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify database was created
SHOW DATABASES;

-- Exit MySQL
EXIT;
```

#### Step 3: Import Schema and Data

**Download the Project First:**
```bash
# Clone the repository (replace with your actual repo URL)
git clone https://github.com/yourusername/smart-city-framework.git
cd smart-city-framework
```

**Import the SQL file:**
```bash
# macOS/Linux
mysql -u root -p smart_city < BACKEND/sql/smart_city.sql

# Windows
mysql -u root -p smart_city < BACKEND\sql\smart_city.sql

# Enter root password when prompted
```

**This import will take 2-5 minutes** as it loads:
- 5,000+ bus stops
- 26,000+ bus routes
- 580 bus services
- 382 carparks
- 165 train stations
- 316 taxi stops
- 90+ traffic cameras

#### Step 4: Verify Data Import
```bash
# Access database
mysql -u root -p smart_city

# Check tables
SHOW TABLES;

# Expected output:
# +----------------------+
# | Tables_in_smart_city |
# +----------------------+
# | bus_routes           |
# | bus_services         |
# | bus_stops            |
# | carparks             |
# | taxi_stops           |
# | traffic_cameras      |
# | train_stations       |
# | ... (and more)       |
# +----------------------+

# Check data counts
SELECT COUNT(*) FROM bus_stops;     -- Should show ~5000+
SELECT COUNT(*) FROM bus_routes;    -- Should show ~26000+
SELECT COUNT(*) FROM train_stations; -- Should show ~165

# Exit
EXIT;
```

### 4.2 Setting Up Neo4j Road Network

The Neo4j graph database needs to be populated with Singapore's road network data.

#### Step 1: Navigate to Backend Directory
```bash
cd smart-city-framework/BACKEND
```

#### Step 2: Run Graph Builder Script
```bash
node nosql/build_network.js
```

**Expected Output:**
```
======================================================================
Building Neo4j Road Network from LTA Data
======================================================================

✅ Fetched 15000 records from LTA

Clearing existing data in batches...
  Deleted 0 nodes
✅ Database cleared

Loading road network...
  Processed 15,000/15,000 segments

✅ Created 8,234 nodes
✅ Created 15,000 road segments

======================================================================
🎉 SUCCESS! Your routing now works across ALL of Singapore!
======================================================================
```

**Note:** This process:
- Takes 5-10 minutes to complete
- Downloads real-time traffic data from LTA
- Creates geographic nodes for road intersections
- Builds road segment relationships with traffic speeds
- Only needs to be run once (unless you want to rebuild)

---

## 5. Application Configuration

### 5.1 Clone the Repository

```bash
# Navigate to your desired directory
cd ~/Documents  # or any preferred location

# Clone the repository
git clone https://github.com/yourusername/smart-city-framework.git

# Navigate into the project
cd smart-city-framework
```

### 5.2 Create Environment Configuration File

#### Step 1: Create .env File
```bash
# Navigate to BACKEND directory
cd BACKEND

# Create .env file
# macOS/Linux:
touch .env

# Windows:
type nul > .env
```

#### Step 2: Edit .env File

Open the `.env` file in your text editor and add the following configuration:

```env
# ============================================================================
# Smart City Framework - Environment Configuration
# ============================================================================

# Application Settings
APP_NAME=Smart City Framework
VERSION=1.0.0
DEBUG=true

# Server Ports
FASTAPI_PORT=8001
NODE_PORT=8000
FRONTEND_PORT=5500

# ============================================================================
# MariaDB Configuration
# ============================================================================
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_USER=root
MARIADB_PASSWORD=your_mariadb_root_password
MARIADB_DATABASE=smart_city

# ============================================================================
# MongoDB Atlas Configuration
# ============================================================================
MONGODB_USER=smartcityuser
MONGODB_PASSWORD=your_mongodb_password
MONGODB_CLUSTER=smart-city-cluster.xxxxx.mongodb.net
MONGODB_NAME=smart_city

# Alternative: Full connection string
# MONGODB_URI=mongodb+srv://smartcityuser:password@cluster.mongodb.net/smart_city

# ============================================================================
# Neo4j Aura Configuration
# ============================================================================
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_generated_password

# ============================================================================
# Redis Configuration
# ============================================================================
# For local Redis:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# For Redis Cloud:
# REDIS_HOST=redis-12345.cloud.redislabs.com
# REDIS_PORT=12345
# REDIS_PASSWORD=your_redis_cloud_password

# ============================================================================
# LTA DataMall API
# ============================================================================
LTA_API_KEY=your_lta_api_key_here

# ============================================================================
# CORS Settings (for development)
# ============================================================================
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500,http://localhost:8080
```

#### Step 3: Replace Placeholder Values

**Replace the following with your actual credentials:**

1. **MARIADB_PASSWORD**: Your MariaDB root password
2. **MONGODB_PASSWORD**: Your MongoDB user password
3. **MONGODB_CLUSTER**: Your actual cluster URL (from MongoDB Atlas)
4. **NEO4J_URI**: Your Neo4j Aura connection URI
5. **NEO4J_PASSWORD**: Your Neo4j generated password
6. **REDIS_HOST/PORT/PASSWORD**: Your Redis credentials (if using Redis Cloud)
7. **LTA_API_KEY**: Your LTA DataMall API key

**Example with real values:**
```env
MARIADB_PASSWORD=MySecure123!
MONGODB_PASSWORD=Mongo456Pass
MONGODB_CLUSTER=smart-city-cluster.ab12cd.mongodb.net
NEO4J_URI=neo4j+s://1a2b3c4d.databases.neo4j.io
NEO4J_PASSWORD=xYz789AbcDef
LTA_API_KEY=abcdef1234567890abcdef1234567890
```

### 5.3 Install Python Dependencies

#### Step 1: Create Virtual Environment
```bash
# Make sure you're in the BACKEND directory
cd BACKEND

# Create virtual environment
python3.13 -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# Your prompt should now show (venv)
```

#### Step 2: Upgrade pip
```bash
pip install --upgrade pip
```

#### Step 3: Install Dependencies
```bash
# Install main dependencies
pip install -r requirements.txt

# Install NoSQL-specific dependencies
pip install -r requirements_nosql.txt --break-system-packages
```

**Expected output:**
```
Successfully installed fastapi uvicorn sqlalchemy pymongo motor neo4j redis...
(multiple lines of installation messages)
```

**If you encounter errors:**
```bash
# For Python 3.13 compatibility issues, try:
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt --no-cache-dir
```

### 5.4 Install Node.js Dependencies

```bash
# Make sure you're in the BACKEND directory
cd BACKEND

# Install Node.js packages
npm install
```

**Expected output:**
```
added 523 packages from 412 contributors and audited 524 packages in 45.231s
```

**Package installation includes:**
- express (web framework)
- axios (HTTP client)
- dotenv (environment variables)
- mongodb (MongoDB driver)
- neo4j-driver (Neo4j driver)
- redis (Redis client)
- node-cron (scheduled tasks)
- mysql2 (MySQL/MariaDB driver)

### 5.5 Verify Configuration

#### Test Database Connections

**Test MariaDB:**
```bash
mysql -u root -p smart_city -e "SELECT COUNT(*) FROM bus_stops;"
# Should show count of bus stops (~5000+)
```

**Test MongoDB:**
```bash
# In your terminal
node -e "const {MongoClient} = require('mongodb'); const uri='your_mongodb_uri'; const client = new MongoClient(uri); client.connect().then(() => {console.log('MongoDB connected!'); client.close();})"
```

**Test Neo4j:**
```bash
# In your terminal
node -e "const neo4j = require('neo4j-driver'); const driver = neo4j.driver('your_neo4j_uri', neo4j.auth.basic('neo4j', 'your_password')); driver.verifyConnectivity().then(() => {console.log('Neo4j connected!'); driver.close();})"
```

**Test Redis:**
```bash
redis-cli ping
# Should output: PONG
```

---

## 6. Running the Application

### 6.1 Starting the Application

You need to run **4 separate terminal windows** or tabs to run all components.

#### Terminal 1: Start MariaDB (if not already running)

**macOS:**
```bash
brew services start mariadb

# Or start temporarily:
mysql.server start
```

**Windows:**
```cmd
net start MariaDB
```

**Linux:**
```bash
sudo systemctl start mariadb
```

#### Terminal 2: Start FastAPI Backend

```bash
# Navigate to project
cd ~/Documents/smart-city-framework/BACKEND

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate  # Windows

# Start FastAPI server
python nosql/main.py
```

**Expected Output:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Starting Smart City Framework API version=1.0.0
INFO:     Connected to MongoDB: smart_city
INFO:     Connected to Neo4j Graph Database
INFO:     Application startup completed successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

**Verification:**
Open browser to http://localhost:8001/docs to see API documentation.

#### Terminal 3: Start Cron Job Manager

```bash
# Open new terminal
cd ~/Documents/smart-city-framework/BACKEND

# Start cron job manager
node cron.js
```

**Expected Output:**
```
Smart City NoSQL Cache Manager + Neo4j Graph Builder
[STARTUP] Checking if road network graph exists...
[STARTUP] Graph already exists with 8234 Point nodes. Skipping build.
[STARTUP] Only traffic speed updates will run every 5 minutes.

=== NoSQL Cache & Neo4j Graph Refresh Schedule ===
- VMS/EMAS & Incidents: Every 2 minutes
- Train Alerts: Every 5 minutes
- Road Works: Daily at 2 AM
- Traffic Speed Bands & Graph Weights: Every 5 minutes
- Road Network Graph: Built on startup, weights updated every 5 min

[CRON] Caching VMS/EMAS & Incidents (2 min)
Fetching LTA: https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents
Fetched 12 records (total: 12)
Cached 12 traffic incidents
```

**This terminal will show updates every 2-5 minutes as data refreshes.**

#### Terminal 4: Start Frontend Server

```bash
# Open new terminal
cd ~/Documents/smart-city-framework/FRONTEND

# Start simple HTTP server
python3 -m http.server 5500
```

**Expected Output:**
```
Serving HTTP on :: port 5500 (http://[::]:5500/) ...
```

**Alternative: Using VS Code Live Server**
1. Open VS Code
2. Install "Live Server" extension
3. Right-click `dashboard.html`
4. Select "Open with Live Server"

### 6.2 Accessing the Dashboard

1. **Open your web browser**
2. **Navigate to:** `http://localhost:5500/html/dashboard.html`
3. **Wait for initial load:** The dashboard will fetch data from all sources (5-10 seconds)

**You should see:**
- Purple header with "🏙️ Smart City Dashboard"
- Statistics cards showing counts of bus stops, stations, etc.
- Interactive map centered on Singapore
- Colored markers on the map
- Scrolling live alerts at the top

### 6.3 Verifying Everything Works

#### Check 1: Statistics Display
In the sidebar under "📊 Statistics", you should see:
```
5,042         165
Bus Stops     Train Stations

382           316
Carparks      Taxi Stands

90            26,000+
Cameras       Bus Routes
```

#### Check 2: Map Markers
On the map, you should see:
- 🔵 Blue dots (Bus Stops) - thousands across Singapore
- 🔴 Red dots (Train Stations) - ~165 markers
- 🟢 Green dots (Carparks) - ~382 markers
- 🟣 Purple dots (Traffic Cameras) - ~90 markers

#### Check 3: Live Alerts
At the top of the map, the marquee should scroll with live alerts (if any are active).

#### Check 4: Route Planning
1. Click the "🧭 Routes" tab
2. Click anywhere on the map (sets start point - red marker)
3. Click another location (sets end point - green marker)
4. Click "Find Route" button
5. A colored route should appear showing traffic conditions
6. Route information displays: distance, duration, turn-by-turn directions

#### Check 5: API Health
Open these URLs in separate browser tabs to verify APIs:
- http://localhost:8001/docs - FastAPI interactive documentation
- http://localhost:8001/api/v1/traffic/incidents - Should return JSON with incidents
- http://localhost:8000/api/stats - Should return statistics JSON

### 6.4 Stopping the Application

To stop all services:

**Terminal 1 (FastAPI):**
```
Press CTRL+C
```

**Terminal 2 (Cron):**
```
Press CTRL+C
```

**Terminal 3 (Frontend):**
```
Press CTRL+C
```

**MariaDB:**
```bash
# macOS:
brew services stop mariadb

# Windows:
net stop MariaDB

# Linux:
sudo systemctl stop mariadb
```

---

## 7. Using the Dashboard

### 7.1 Dashboard Interface Overview

The dashboard has two main sections:

#### Left Sidebar
- **Tab Selector**: Switch between "🗺️ Layers" and "🧭 Routes"
- **Statistics Panel**: Real-time counts of transportation assets
- **Layer Controls**: Toggle visibility of map layers
- **Action Buttons**: Refresh data, clear cache
- **Legend**: Color guide for map markers

#### Main Map Area
- **Interactive Map**: Pan, zoom, and click on markers
- **Live Alert Marquee**: Scrolling real-time alerts at the top
- **Traffic Overlays**: Color-coded routes when planning navigation

### 7.2 Viewing Transportation Infrastructure

#### Step 1: Using Layer Controls

1. In the "🗺️ Layers" tab, you'll see checkboxes:
   ```
   ☑️ Bus Stops (5,042)
   ☑️ Train Stations (165)
   ☑️ Carparks (382)
   ☐ Taxi Stands (316)
   ☑️ Traffic Cameras (90)
   ☑️ Traffic Incidents (12)
   ```

2. **Check/Uncheck** any layer to show/hide it on the map

3. **Click any marker** on the map to see details:
   - **Bus Stops**: Stop name, code, road name
   - **Train Stations**: Station name, line, location
   - **Carparks**: Available lots, lot type, development name
   - **Traffic Cameras**: Live camera image feed
   - **Incidents**: Incident type and description

#### Step 2: Exploring Statistics

The statistics panel updates in real-time:
- **Bus Infrastructure**: Total stops, routes, services
- **Rail Network**: Station count
- **Parking**: Available carparks
- **Monitoring**: Active cameras

### 7.3 Planning Routes

#### Step 1: Switch to Routes Tab
Click the "🧭 Routes" tab in the sidebar

#### Step 2: Set Start Location
**Method 1: Click on Map**
- Click anywhere on the map
- A **red marker** 📍 appears at your start location
- Coordinates auto-fill in "From" field

**Method 2: Manual Entry**
- Type coordinates in "From" field
- Format: `1.3521, 103.8198` (latitude, longitude)
- Press Enter

#### Step 3: Set Destination
- Click another location on the map
- A **green marker** 📍 appears at your destination
- Coordinates auto-fill in "To" field

#### Step 4: Find Route
1. Click **"Find Route"** button
2. Wait 1-2 seconds for calculation
3. Route appears on map with color-coded segments

#### Step 5: Understanding Route Display

**Route Colors indicate traffic speed:**
- 🟢 **Green**: Fast traffic (>60 km/h) - Smooth flow
- 🟡 **Yellow**: Moderate (40-60 km/h) - Normal traffic
- 🟠 **Orange**: Slow (20-40 km/h) - Heavy traffic
- 🔴 **Red**: Congestion (<20 km/h) - Traffic jam

**Route Information Panel Shows:**
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

**Nearby Bus Stops:**
- Automatically shows 5 closest bus stops to destination
- Click any stop to zoom to its location

#### Step 6: Clear Route
- Click **"Clear Route"** button to remove route and markers
- Plan a new route by repeating steps 2-4

### 7.4 Monitoring Live Traffic

#### Live Alert Marquee
At the top of the map, watch for scrolling alerts:
- 📢 **VMS Messages**: Variable Message Signs (traffic advisories)
- 🚇 **Train Alerts**: MRT/LRT service disruptions
- 💥 **Traffic Incidents**: Accidents, breakdowns, roadworks

**Example:**
```
⚠️ Live Congestion & Alerts
[Scrolling] 📢 Heavy traffic on PIE → 🚇 NS Line: Train delay → 💥 Accident at Bukit Timah Rd
```

#### Traffic Incidents on Map
- Look for **emoji markers** indicating incident type:
  - 💥 Accident
  - 🚗 Vehicle Breakdown
  - 🚧 Roadwork
  - 🌊 Flooding
  - 🚦 Traffic Light Fault
- Click marker for full incident details

#### Traffic Camera Feeds
1. Enable "Traffic Cameras" layer
2. Purple markers (🟣) show camera locations
3. Click any camera marker
4. Live image feed displays in popup

### 7.5 Refreshing Data

#### Manual Refresh
Click **"🔄 Refresh Data"** button to:
- Reload all map layers
- Update statistics
- Fetch latest incidents and alerts
- Refresh traffic camera images

**Use when:**
- Data appears outdated
- New incidents not showing
- After network interruption

#### Auto-Refresh (Background)
The cron job automatically updates:
- **Every 2 minutes**: Traffic incidents, VMS alerts
- **Every 5 minutes**: Train alerts, traffic speeds
- **Graph updates**: Neo4j road weights updated every 5 minutes

You'll see updates in the cron terminal:
```
[CRON] Caching VMS/EMAS & Incidents (2 min)
Cached 15 traffic incidents
```

#### Clear Cache (Advanced)
Click **"🗑️ Clear All Cache"** to:
- Delete all MongoDB cached data
- Clear Redis cache
- Force fresh fetch from external APIs

**Warning:** This triggers immediate data refresh from all external APIs. Use only when:
- Data appears corrupted
- Experiencing cache-related issues
- Testing data pipeline

A confirmation dialog will appear. Click "OK" to proceed.

---

## 8. Troubleshooting

### 8.1 Application Won't Start

#### Problem: FastAPI server fails to start

**Symptom:**
```
ERROR: Could not import module
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
pip install -r requirements_nosql.txt --break-system-packages

# Try starting again
python nosql/main.py
```

#### Problem: Port already in use

**Symptom:**
```
ERROR: [Errno 48] Address already in use
```

**Solution:**
```bash
# Find process using the port
# macOS/Linux:
lsof -i :8001
kill -9 <PID>

# Windows:
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Then restart the server
```

### 8.2 Database Connection Issues

#### Problem: Cannot connect to MariaDB

**Symptom:**
```
ERROR 2002 (HY000): Can't connect to local MySQL server through socket
```

**Solution:**
```bash
# Check if MariaDB is running
# macOS:
brew services list | grep mariadb
brew services start mariadb

# Linux:
sudo systemctl status mariadb
sudo systemctl start mariadb

# Windows:
net start MariaDB

# Test connection
mysql -u root -p
```

#### Problem: MongoDB Atlas connection timeout

**Symptom:**
```
ServerSelectionTimeoutError: connection timeout
```

**Solution:**
1. Check internet connection
2. Verify IP whitelist in MongoDB Atlas:
   - Go to Network Access
   - Ensure "0.0.0.0/0" is whitelisted (for development)
3. Check connection string in `.env`:
   ```env
   MONGODB_CLUSTER=correct-cluster-name.mongodb.net
   MONGODB_PASSWORD=correct_password_no_special_chars
   ```
4. Test connection:
   ```bash
   mongosh "mongodb+srv://user:pass@cluster.mongodb.net/"
   ```

#### Problem: Neo4j authentication failed

**Symptom:**
```
Neo.ClientError.Security.Unauthorized
```

**Solution:**
1. Verify credentials in `.env`:
   ```env
   NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_correct_password
   ```
2. Check Neo4j Aura instance is running (not paused)
3. Reset password in Neo4j Aura console if needed
4. Rebuild road network:
   ```bash
   node nosql/build_network.js
   ```

### 8.3 Frontend Issues

#### Problem: Dashboard shows blank white page

**Solution:**
1. Open browser console (F12)
2. Check for errors
3. Common fixes:
   ```bash
   # Ensure frontend server is running
   cd FRONTEND
   python3 -m http.server 5500
   
   # Correct URL:
   http://localhost:5500/html/dashboard.html
   # NOT: http://localhost:5500/dashboard.html
   ```

#### Problem: "Loading data..." never completes

**Solution:**
1. Check backend APIs are running:
   ```bash
   # Test FastAPI
   curl http://localhost:8001/api/v1/traffic/incidents
   
   # Test Node.js API
   curl http://localhost:8000/api/stats
   ```

2. Check browser console for CORS errors
3. Verify `.env` CORS settings:
   ```env
   CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
   ```

4. Refresh the page (F5)

#### Problem: Map doesn't display

**Solution:**
1. Check internet connection (map tiles load from OpenStreetMap)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try different browser
4. Check console for JavaScript errors

#### Problem: No markers visible on map

**Solution:**
1. Verify layers are checked (sidebar checkboxes)
2. Zoom out to see full Singapore
3. Check data loaded:
   - Open http://localhost:8000/api/bus-stops?limit=10
   - Should return JSON with bus stops
4. Click "🔄 Refresh Data" button

### 8.4 Routing Issues

#### Problem: "No viable route found" error

**Solution:**
1. Ensure Neo4j road network is built:
   ```bash
   node nosql/build_network.js
   ```
2. Check cron job is updating speeds:
   ```
   Look for "[CRON] Updating Traffic Speed Bands" in cron terminal
   ```
3. Try clicking points within Singapore (not in water/outside)
4. Verify Neo4j connection:
   ```bash
   # Check Neo4j has data
   cypher-shell -u neo4j -p password -a neo4j+s://xxxxx.databases.neo4j.io
   MATCH (n:Point) RETURN count(n);
   # Should show ~8000+ nodes
   ```

#### Problem: Route calculation takes too long

**Solution:**
1. Try shorter routes (< 30 km)
2. Check Neo4j instance isn't overloaded
3. Verify traffic speed updates are running
4. Clear route and try again

### 8.5 Performance Issues

#### Problem: Dashboard is slow/laggy

**Solution:**
1. Reduce visible markers:
   - Uncheck some layers (especially Bus Stops)
   - Modify limit in dashboard.html:
     ```javascript
     // Line 161
     CONFIG.LIMITS.BUS_STOPS = 1000  // Reduce from 5000
     ```
2. Close unnecessary browser tabs
3. Increase system resources
4. Use Redis caching:
   ```env
   # Ensure Redis is configured in .env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

#### Problem: High CPU usage

**Solution:**
1. Check cron job frequency:
   - Every 2 minutes for high-frequency data is normal
   - Don't run multiple cron instances
2. Close browser when not using dashboard
3. Reduce data limits in API calls

### 8.6 Data Issues

#### Problem: Statistics show zero counts

**Solution:**
1. Verify MariaDB data import:
   ```bash
   mysql -u root -p smart_city
   SELECT COUNT(*) FROM bus_stops;
   # Should show 5000+
   ```
2. If zero, reimport data:
   ```bash
   mysql -u root -p smart_city < BACKEND/sql/smart_city.sql
   ```

#### Problem: No traffic incidents showing

**Solution:**
1. Check LTA API key is valid:
   ```bash
   # Test API directly
   curl -H "AccountKey: your_key" https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents
   ```
2. Verify cron job is running (check cron terminal)
3. Check MongoDB for cached data:
   ```bash
   mongosh "your_connection_string"
   use smart_city
   db.traffic_incidents.find().limit(5)
   ```
4. Clear cache and refresh:
   - Click "🗑️ Clear All Cache" in dashboard
   - Wait 2 minutes for cron to populate data

#### Problem: Old/stale data

**Solution:**
1. Check cron job terminal for errors
2. Manually clear cache (dashboard button)
3. Restart cron job:
   ```bash
   # Stop: Ctrl+C
   # Restart: node cron.js
   ```

### 8.7 Getting Help

If you continue experiencing issues:

1. **Check Logs:**
   ```bash
   # FastAPI logs
   tail -f backend.log  # if logging to file
   
   # Cron job output (in its terminal)
   
   # Browser console (F12)
   ```

2. **Test Individual Components:**
   ```bash
   # Test database connections
   mysql -u root -p smart_city
   mongosh "your_mongodb_uri"
   redis-cli ping
   
   # Test APIs
   curl http://localhost:8001/docs
   curl http://localhost:8000/api/stats
   ```

3. **Clean Restart:**
   ```bash
   # Stop all services
   # Kill all Python/Node processes
   
   # Clear caches
   redis-cli FLUSHALL
   
   # Restart in order:
   # 1. MariaDB
   # 2. FastAPI
   # 3. Cron
   # 4. Frontend
   ```

4. **Contact Support:**
   - Check GitHub Issues: [your-repo]/issues
   - Email: support@smart-city-framework.com
   - Include:
     - Error messages (full text)
     - Operating system
     - Software versions
     - Steps to reproduce

---

## 9. Appendix

### 9.1 Directory Structure Reference

```
smart-city-framework/
│
├── BACKEND/
│   ├── .env                          ← YOUR CONFIGURATION FILE
│   ├── venv/                         ← Python virtual environment
│   ├── package.json                  ← Node.js dependencies
│   ├── requirements.txt              ← Python dependencies
│   ├── requirements_nosql.txt        ← NoSQL Python packages
│   │
│   ├── app/
│   │   ├── config/
│   │   │   ├── database.py          ← Database connections
│   │   │   └── settings.py          ← App settings (reads .env)
│   │   ├── models/                  ← Data models
│   │   ├── services/                ← Business logic
│   │   └── utils/                   ← Helper functions
│   │
│   ├── nosql/
│   │   ├── main.py                  ← FastAPI server START HERE
│   │   ├── build_network.js         ← Neo4j setup script
│   │   ├── lta.js                   ← LTA API integration
│   │   ├── mongodb.js               ← MongoDB connection
│   │   ├── neo4j.js                 ← Neo4j connection
│   │   └── redis.js                 ← Redis connection
│   │
│   ├── sql/
│   │   ├── smart_city.sql           ← Database import file
│   │   └── smart_city_api.py        ← Node.js SQL API
│   │
│   └── cron.js                       ← Background job manager START HERE
│
└── FRONTEND/
    ├── html/
    │   └── dashboard.html            ← Main UI START HERE
    └── style.css                     ← Styling
```

### 9.2 Port Reference Table

| Port | Service | Purpose | Required |
|------|---------|---------|----------|
| 3306 | MariaDB | SQL database | Yes |
| 5500 | Frontend | Dashboard UI | Yes |
| 6379 | Redis | Cache (optional) | Optional |
| 7687 | Neo4j | Graph database | Yes (cloud) |
| 8000 | Node.js | SQL API | Yes |
| 8001 | FastAPI | NoSQL/Routing API | Yes |
| 27017 | MongoDB | NoSQL database | Yes (cloud) |

### 9.3 Environment Variables Complete Reference

```env
# Application
APP_NAME=Smart City Framework
VERSION=1.0.0
DEBUG=true                            # Set false for production

# Ports
FASTAPI_PORT=8001                     # Python API port
NODE_PORT=8000                        # Node.js API port
FRONTEND_PORT=5500                    # Frontend server port

# MariaDB (Local)
MARIADB_HOST=localhost                # Database host
MARIADB_PORT=3306                     # Database port
MARIADB_USER=root                     # Database user
MARIADB_PASSWORD=your_password        # Database password
MARIADB_DATABASE=smart_city           # Database name

# MongoDB Atlas (Cloud)
MONGODB_USER=smartcityuser            # MongoDB username
MONGODB_PASSWORD=your_password        # MongoDB password
MONGODB_CLUSTER=cluster.mongodb.net   # Cluster URL
MONGODB_NAME=smart_city               # Database name

# Neo4j Aura (Cloud)
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io  # Connection URI
NEO4J_USER=neo4j                      # Username (usually neo4j)
NEO4J_PASSWORD=your_password          # Generated password

# Redis (Local or Cloud)
REDIS_HOST=localhost                  # Redis host
REDIS_PORT=6379                       # Redis port
REDIS_PASSWORD=                       # Password (empty for local)

# LTA DataMall API
LTA_API_KEY=your_32_char_api_key     # Required for data access

# CORS (Development)
CORS_ORIGINS=http://localhost:5500    # Allowed origins
```

### 9.4 Common Commands Cheat Sheet

```bash
# === NAVIGATION ===
cd ~/Documents/smart-city-framework/BACKEND
cd ~/Documents/smart-city-framework/FRONTEND

# === PYTHON ENVIRONMENT ===
python3 --version                     # Check Python version
python3.13 -m venv venv               # Create virtual environment
source venv/bin/activate              # Activate (macOS/Linux)
venv\Scripts\activate                 # Activate (Windows)
deactivate                            # Deactivate environment
pip list                              # List installed packages
pip install -r requirements.txt      # Install dependencies

# === NODE.JS ===
node --version                        # Check Node.js version
npm --version                         # Check npm version
npm install                           # Install dependencies
npm list                              # List installed packages

# === DATABASE OPERATIONS ===
# MariaDB
mysql -u root -p                      # Connect to MariaDB
mysql -u root -p smart_city          # Connect to specific database
mysql -u root -p smart_city < file.sql  # Import SQL file
SHOW DATABASES;                       # List databases
USE smart_city;                       # Switch to database
SHOW TABLES;                          # List tables
SELECT COUNT(*) FROM table_name;     # Count records

# MongoDB
mongosh "connection_string"           # Connect to MongoDB
show dbs                              # List databases
use smart_city                        # Switch to database
show collections                      # List collections
db.collection_name.find().limit(5)   # Query collection

# Redis
redis-cli                             # Connect to Redis
PING                                  # Test connection
KEYS *                                # List all keys
FLUSHALL                              # Clear all data
GET key_name                          # Get value

# Neo4j
cypher-shell -u neo4j -p password    # Connect to Neo4j
MATCH (n) RETURN count(n);           # Count all nodes
MATCH (n:Point) RETURN count(n);     # Count Point nodes
MATCH ()-[r]->() RETURN count(r);    # Count relationships

# === STARTING SERVICES ===
# Terminal 1
python nosql/main.py                  # Start FastAPI

# Terminal 2
node cron.js                          # Start cron jobs

# Terminal 3
python3 -m http.server 5500          # Start frontend

# MariaDB
brew services start mariadb          # macOS
net start MariaDB                    # Windows
sudo systemctl start mariadb         # Linux

# === STOPPING SERVICES ===
Ctrl+C                                # Stop current process
pkill -f "python nosql/main.py"      # Kill FastAPI
pkill -f "node cron.js"              # Kill cron
pkill -f "http.server 5500"          # Kill frontend

brew services stop mariadb           # Stop MariaDB (macOS)
net stop MariaDB                     # Stop MariaDB (Windows)
sudo systemctl stop mariadb          # Stop MariaDB (Linux)

# === CHECKING STATUS ===
lsof -i :8001                         # Check port 8001 (macOS/Linux)
netstat -ano | findstr :8001         # Check port 8001 (Windows)
ps aux | grep python                  # Find Python processes
ps aux | grep node                    # Find Node.js processes

# === TESTING ===
curl http://localhost:8001/docs      # Test FastAPI
curl http://localhost:8000/api/stats # Test Node.js API
curl http://localhost:5500/html/dashboard.html  # Test frontend

# === GIT OPERATIONS ===
git clone URL                         # Clone repository
git pull                              # Update local copy
git status                            # Check status
git log --oneline                    # View commit history

# === TROUBLESHOOTING ===
tail -f logfile.log                  # Follow log file
cat .env                              # View environment variables
which python3                         # Find Python location
which node                            # Find Node.js location
```

### 9.5 External Resources

#### Official Documentation
- **Python**: https://docs.python.org/3/
- **Node.js**: https://nodejs.org/docs/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Express.js**: https://expressjs.com/
- **Leaflet.js**: https://leafletjs.com/reference.html

#### Database Documentation
- **MariaDB**: https://mariadb.com/kb/en/documentation/
- **MongoDB**: https://docs.mongodb.com/
- **Neo4j**: https://neo4j.com/docs/
- **Redis**: https://redis.io/documentation

#### API Documentation
- **LTA DataMall**: https://datamall.lta.gov.sg/content/datamall/en/dynamic-data.html
- **Data.gov.sg**: https://data.gov.sg/

#### Learning Resources
- **SQL Tutorial**: https://www.w3schools.com/sql/
- **Python Tutorial**: https://docs.python.org/3/tutorial/
- **JavaScript Tutorial**: https://javascript.info/
- **REST API Design**: https://restfulapi.net/

### 9.6 Glossary

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface - allows software to communicate |
| **CORS** | Cross-Origin Resource Sharing - security feature for web browsers |
| **Cron Job** | Scheduled task that runs automatically at specified intervals |
| **FastAPI** | Modern Python web framework for building APIs |
| **Graph Database** | Database that uses graph structures (nodes and relationships) |
| **LTA** | Land Transport Authority - Singapore's transport agency |
| **Polyglot Persistence** | Using multiple database technologies in one system |
| **REST API** | Representational State Transfer - architectural style for APIs |
| **Virtual Environment** | Isolated Python environment for dependencies |

### 9.7 Keyboard Shortcuts

#### Terminal Shortcuts
- `Ctrl+C` - Stop running process
- `Ctrl+Z` - Suspend process
- `Ctrl+D` - Exit shell
- `Ctrl+L` - Clear terminal
- `Tab` - Auto-complete command
- `↑/↓` - Navigate command history

#### Browser Shortcuts (Dashboard)
- `F5` - Refresh page
- `Ctrl+R` - Refresh page
- `F12` - Open developer tools
- `Ctrl+Shift+Delete` - Clear browser cache
- `Ctrl++` - Zoom in
- `Ctrl+-` - Zoom out
- `ESC` - Close popups

