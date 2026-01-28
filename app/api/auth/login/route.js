import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const MONGO_URL = process.env.MONGO_URL;
const JWT_SECRET = process.env.JWT_SECRET;

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(MONGO_URL);
  cachedClient = client;
  return client;
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { indication: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME);

    const user = await db.collection('utilizadores').findOne({ email });
    if (!user) {
      return NextResponse.json(
        { indication: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json(
        { indication: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        tipo: user.tipo
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token
    });

  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    return NextResponse.json(
      { indication: 'Erro interno' },
      { status: 500 }
    );
  }
}
