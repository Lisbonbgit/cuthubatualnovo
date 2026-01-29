import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;
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
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 });
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    // Find user and update email_confirmado
    const result = await db.collection('utilizadores').updateOne(
      { _id: new ObjectId(decoded.userId) },
      { 
        $set: { 
          email_confirmado: true,
          email_confirmado_em: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
    }

    // Redirect to success page with message
    return NextResponse.redirect(new URL('/?email_confirmado=true', request.url));

  } catch (error) {
    console.error('Email confirmation error:', error);
    return NextResponse.json({ error: 'Erro ao confirmar email' }, { status: 500 });
  }
}
