/**
 * Database Connector and Unified Query Engine
 * 
 * Supports two operating modes:
 * 1. Online MongoDB Mode: via standard Mongoose.
 * 2. Offline JSON Database Mode: via automatic file system persistence.
 * 
 * This ensures the project runs out-of-the-box on any machine, even without MongoDB installed!
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Local storage path for offline database
const OFFLINE_DB_DIR = path.join(__dirname, '../data');
const OFFLINE_DB_FILE = path.join(OFFLINE_DB_DIR, 'db_fallback.json');

// Memory cache for offline JSON db
let offlineData = {
  users: [],
  resumes: [],
  jobDescriptions: []
};

let isOfflineMode = false;

// Ensure local directory and fallback DB file exist
function initOfflineDb() {
  if (!fs.existsSync(OFFLINE_DB_DIR)) {
    fs.mkdirSync(OFFLINE_DB_DIR, { recursive: true });
  }
  if (fs.existsSync(OFFLINE_DB_FILE)) {
    try {
      const fileData = fs.readFileSync(OFFLINE_DB_FILE, 'utf8');
      offlineData = JSON.parse(fileData);
      // Ensure all root arrays exist
      if (!offlineData.users) offlineData.users = [];
      if (!offlineData.resumes) offlineData.resumes = [];
      if (!offlineData.jobDescriptions) offlineData.jobDescriptions = [];
    } catch (err) {
      console.error('[DB Fallback] Error reading JSON DB file, resetting cache:', err.message);
      saveOfflineDb();
    }
  } else {
    saveOfflineDb();
  }
}

// Persist offline memory cache to file system
function saveOfflineDb() {
  try {
    fs.writeFileSync(OFFLINE_DB_FILE, JSON.stringify(offlineData, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB Fallback] Failed to persist data to JSON file:', err.message);
  }
}

// Helper to generate unique string IDs
function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Mock Model CRUD Provider for Local Storage
class LocalModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  get collection() {
    return offlineData[this.collectionName];
  }

  async find(query = {}) {
    let results = [...this.collection];
    // Simple filter matching
    Object.keys(query).forEach(key => {
      const val = query[key];
      results = results.filter(item => {
        if (typeof val === 'object' && val !== null) {
          // Deep or operational matches (like $ne or regex) are not strictly needed,
          // but we can handle simple properties:
          return JSON.stringify(item[key]) === JSON.stringify(val);
        }
        return item[key] === val;
      });
    });
    return results;
  }

  async findOne(query = {}) {
    const list = await this.find(query);
    return list[0] || null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(data) {
    const newItem = {
      _id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    this.collection.push(newItem);
    saveOfflineDb();
    return newItem;
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const index = this.collection.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    // Check for Mongoose atomic operations (like $set, $push etc.)
    let currentItem = this.collection[index];
    if (updateData.$set) {
      currentItem = { ...currentItem, ...updateData.$set };
    } else {
      currentItem = { ...currentItem, ...updateData };
    }
    
    currentItem.updatedAt = new Date().toISOString();
    this.collection[index] = currentItem;
    saveOfflineDb();
    return currentItem;
  }

  async findByIdAndDelete(id) {
    const index = this.collection.findIndex(item => item._id === id);
    if (index === -1) return null;
    const removedItem = this.collection.splice(index, 1)[0];
    saveOfflineDb();
    return removedItem;
  }

  async countDocuments(query = {}) {
    const list = await this.find(query);
    return list.length;
  }
}

// Connect to Database
async function connectDB() {
  const dbUri = process.env.MONGODB_URI;

  if (!dbUri) {
    console.log('\n======================================================');
    console.log('[DATABASE] MONGODB_URI not found in configuration.');
    console.log('[DATABASE] Running in OFFLINE JSON Database Mode.');
    console.log('[DATABASE] Data will be stored locally in: \n  ' + OFFLINE_DB_FILE);
    console.log('======================================================\n');
    isOfflineMode = true;
    initOfflineDb();
    return;
  }

  try {
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('\n======================================================');
    console.log('[DATABASE] MongoDB Connected successfully online.');
    console.log('======================================================\n');
    isOfflineMode = false;
  } catch (error) {
    console.warn('\n======================================================');
    console.warn('[DATABASE] MongoDB Connection Failed:');
    console.warn('  ' + error.message);
    console.warn('[DATABASE] Falling back automatically to OFFLINE JSON mode.');
    console.warn('[DATABASE] Local data saved in: \n  ' + OFFLINE_DB_FILE);
    console.warn('======================================================\n');
    isOfflineMode = true;
    initOfflineDb();
  }
}

// Unified wrappers to select appropriate database implementation dynamically
module.exports = {
  connectDB,
  isOffline: () => isOfflineMode,
  
  // Models routing
  User: {
    find: (q) => isOfflineMode ? new LocalModel('users').find(q) : mongoose.model('User').find(q),
    findOne: (q) => isOfflineMode ? new LocalModel('users').findOne(q) : mongoose.model('User').findOne(q),
    findById: (id) => isOfflineMode ? new LocalModel('users').findById(id) : mongoose.model('User').findById(id),
    create: (data) => isOfflineMode ? new LocalModel('users').create(data) : mongoose.model('User').create(data),
    findByIdAndUpdate: (id, data, opt) => isOfflineMode ? new LocalModel('users').findByIdAndUpdate(id, data, opt) : mongoose.model('User').findByIdAndUpdate(id, data, opt),
    findByIdAndDelete: (id) => isOfflineMode ? new LocalModel('users').findByIdAndDelete(id) : mongoose.model('User').findByIdAndDelete(id),
    countDocuments: (q) => isOfflineMode ? new LocalModel('users').countDocuments(q) : mongoose.model('User').countDocuments(q)
  },

  Resume: {
    find: (q) => isOfflineMode ? new LocalModel('resumes').find(q) : mongoose.model('Resume').find(q),
    findOne: (q) => isOfflineMode ? new LocalModel('resumes').findOne(q) : mongoose.model('Resume').findOne(q),
    findById: (id) => isOfflineMode ? new LocalModel('resumes').findById(id) : mongoose.model('Resume').findById(id),
    create: (data) => isOfflineMode ? new LocalModel('resumes').create(data) : mongoose.model('Resume').create(data),
    findByIdAndUpdate: (id, data, opt) => isOfflineMode ? new LocalModel('resumes').findByIdAndUpdate(id, data, opt) : mongoose.model('Resume').findByIdAndUpdate(id, data, opt),
    findByIdAndDelete: (id) => isOfflineMode ? new LocalModel('resumes').findByIdAndDelete(id) : mongoose.model('Resume').findByIdAndDelete(id),
    countDocuments: (q) => isOfflineMode ? new LocalModel('resumes').countDocuments(q) : mongoose.model('Resume').countDocuments(q)
  }
};
