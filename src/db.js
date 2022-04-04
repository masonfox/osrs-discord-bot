const { MongoClient } = require('mongodb');

// Config
const dbName = "osrsbuddy";

// Connection
class Mongo {
    constructor() {
      const url = 'mongodb://localhost:27017';
  
      this.client = new MongoClient(url);
    }
    async init() {
      await this.client.connect();
      console.log('MongoDB Connected');
  
      this.db = this.client.db(dbName);
    }
  }
  
  module.exports = new Mongo();