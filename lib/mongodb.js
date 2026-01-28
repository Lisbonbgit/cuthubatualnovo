import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  throw new Error('MONGO_URL não definido nas variáveis de ambiente');
}

let cachedClient = null;

export async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = await MongoClient.connect(MONGO_URL);
  cachedClient = client;
  return client;
}
