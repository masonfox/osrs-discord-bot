// Import all env vars from .env file
require('dotenv').config()

export const NODE_ENV = process.env.NODE_ENV
export const CLIENT_TOKEN = process.env.CLIENT_TOKEN
export const PERSIST_PLAYER_UPDATES = process.env.PERSIST_PLAYER_UPDATES
export const FIREBASE_CONFIG_BASE64 = process.env.FIREBASE_CONFIG_BASE64