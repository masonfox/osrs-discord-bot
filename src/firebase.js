require('dotenv').config();
const firebase = require("firebase-admin");
require("firebase/firestore");

const env = process.env;

/**
 * Service-account auth for Firebase-admin SDK
 */
const app = firebase.initializeApp({
  credential: firebase.credential.cert({
    "type": env.CRED_TYPE,
    "project_id": env.CRED_PROJECT_ID,
    "private_key_id": env.CRED_PRIVATE_KEY_ID,
    "private_key": env.CRED_PRIVATE_KEY,
    "client_email": env.CRED_CLIENT_EMAIL,
    "client_id": env.CRED_CLIENT_ID,
    "auth_uri": env.CRED_AUTH_URI,
    "token_uri": env.CRED_TOKEN_URI,
    "auth_provider_x509_cert_url": env.CRED_AUTH_PROVIDER_CERT_URL,
    "client_x509_cert_url": env.CRED_CLIENT_CERT_URL
  })
});

const db = firebase.firestore();

exports.app = app;
exports.db = db;
