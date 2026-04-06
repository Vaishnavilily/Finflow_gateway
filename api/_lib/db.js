import { MongoClient } from 'mongodb';

let cachedClient = null;

export async function getDb() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('Missing MONGODB_URI environment variable.');
    }

    if (!cachedClient) {
        cachedClient = new MongoClient(uri);
        await cachedClient.connect();
    }

    const dbName = process.env.MONGODB_DB || 'finflow';
    return cachedClient.db(dbName);
}
