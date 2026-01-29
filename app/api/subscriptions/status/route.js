import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URL = process.env.MONGO_URL;

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(MONGO_URL);
  cachedClient = client;
  return client;
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function GET(request) {
  try {
    const auth = request.headers.get('authorization');

    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = auth.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    const subscription = await db.collection('subscriptions').findOne({
      user_id: decoded.userId,
      status: { $in: ['trialing', 'active'] },
    });

    const barbearia = await db.collection('barbearias').findOne({
      owner_id: decoded.userId,
    });

    return NextResponse.json({
      has_subscription: !!subscription,
      has_barbearia: !!barbearia,
    });
  } catch (error) {
    console.error('[SUBSCRIPTION STATUS ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao verificar subscrição' },
      { status: 500 }
    );
  }
}
