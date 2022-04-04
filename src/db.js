const { MongoClient } = require('mongodb');

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
      console.log('MongoDB Connected');
  
      this.db = this.client.db(dbName);
    }
  }
  
  module.exports = new Mongo();