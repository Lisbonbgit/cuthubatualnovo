import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';

const MONGO_URL = process.env.MONGO_URL;

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const client = await MongoClient.connect(MONGO_URL);
  cachedClient = client;
  return client;
}

export async function GET(request) {
  try {
    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    // Get SaaS settings (public)
    const settings = await db.collection('saas_settings').findOne({ type: 'global' });

    return NextResponse.json({ 
      settings: {
        hero_image: settings?.hero_image || null,
        site_name: 'CutHub',
        tagline: 'Cria a tua página online e começa a gerir marcações hoje mesmo'
      }
    });

  } catch (error) {
    console.error('Error fetching SaaS settings:', error);
    return NextResponse.json({ 
      settings: {
        hero_image: null,
        site_name: 'CutHub',
        tagline: 'Cria a tua página online e começa a gerir marcações hoje mesmo'
      }
    });
  }
}
