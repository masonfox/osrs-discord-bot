require('dotenv').config();
const firebase = require("firebase-admin");
require("firebase/firestore");

const serviceAccount = require("../creds.json"); // requires setting up a firebase service account for admin-sdk

const app = firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
});

const db = firebase.firestore();

exports.app = app;
exports.db = db;
