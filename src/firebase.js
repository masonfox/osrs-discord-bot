require('dotenv').config();
const firebase = require("firebase-admin");
require("firebase/firestore");

// retrieve base64 credentials from .env
const creds = JSON.parse(Buffer.from(process.env.FIREBASE_CONFIG_BASE64, 'base64').toString('ascii'))

/**
 * Service-account auth for Firebase-admin SDK
 */
const app = firebase.initializeApp({
  credential: firebase.credential.cert(creds)
});

const db = firebase.firestore();

exports.app = app;
exports.db = db;
