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

export async function POST(request) {
  try {
    const auth = request.headers.get('authorization');

    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const token = auth.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    if (decoded.tipo !== 'owner') {
      return NextResponse.json(
        { error: 'Apenas owners podem criar barbearias' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nome, descricao, email, palavra_passe } = body;

    if (!nome || !email || !palavra_passe) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    // Verificar se já existe barbearia para este owner
    const existing = await db.collection('barbearias').findOne({
      owner_id: decoded.userId,
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Barbearia já existe',
        barbearia_id: existing._id.toString()
      });
    }

    // Criar nova barbearia
    const result = await db.collection('barbearias').insertOne({
      nome,
      descricao: descricao || null,
      email,
      palavra_passe,
      owner_id: decoded.userId,
      ativo: true,
      criado_em: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Barbearia criada com sucesso',
      barbearia_id: result.insertedId.toString()
    });

  } catch (error) {
    console.error('Erro ao criar barbearia:', error);
    return NextResponse.json(
      { error: 'Erro ao criar barbearia', details: error.message },
      { status: 500 }
    );
  }
}
