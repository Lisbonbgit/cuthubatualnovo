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
    const { nome, email, password, tipo } = await request.json();

    if (!nome || !email || !password) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME);

    // Verificar se já existe
    const existingUser = await db.collection('utilizadores').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já registado' },
        { status: 400 }
      );
    }

    // Hash da password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar utilizador
    const result = await db.collection('utilizadores').insertOne({
      nome,
      email,
      password: hashedPassword,
      tipo: tipo || 'owner',
      criado_em: new Date(),
      ativo: true
    });

    const userId = result.insertedId.toString();

    // Criar token JWT
    const token = jwt.sign(
      { userId, email, tipo: tipo || 'owner' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      token
    });

  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
