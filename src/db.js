const { MongoClient } = require('mongodb');
const logger = require('../logger');

if(!process.env.MONGODB_CONNECTION_STRING) throw new Error("MongoDB connection string not provided in .env!")

// Config
const dbName = "osrsbuddy";

// Connection
class Mongo {
    constructor() {  
      this.client = new MongoClient(process.env.MONGODB_CONNECTION_STRING);
    }
    async init() {
      await this.client.connect();
      logger.info('MongoDB Connected');
  
      this.db = this.client.db(dbName);
    }
  }
  
  module.exports = new Mongo();