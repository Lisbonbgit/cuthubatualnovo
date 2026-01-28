import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

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

export async function POST(request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email e código são obrigatórios' }, { status: 400 });
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    // Buscar código
    const verificationRecord = await db.collection('verification_codes').findOne({ email });

    if (!verificationRecord) {
      return NextResponse.json({ error: 'Nenhum código encontrado para este email' }, { status: 404 });
    }

    // Verificar expiração
    if (new Date() > new Date(verificationRecord.expires_at)) {
      await db.collection('verification_codes').deleteOne({ email });
      return NextResponse.json({ error: 'Código expirado. Solicite um novo código.' }, { status: 400 });
    }

    // Verificar tentativas
    if (verificationRecord.attempts >= 3) {
      await db.collection('verification_codes').deleteOne({ email });
      return NextResponse.json({ 
        error: 'Número máximo de tentativas atingido. Solicite um novo código.' 
      }, { status: 400 });
    }

    // Verificar código
    const isValid = await bcrypt.compare(code, verificationRecord.code);

    if (!isValid) {
      // Incrementar tentativas
      await db.collection('verification_codes').updateOne(
        { email },
        { $inc: { attempts: 1 } }
      );

      const attemptsLeft = 3 - (verificationRecord.attempts + 1);
      return NextResponse.json({ 
        error: `Código inválido. ${attemptsLeft} tentativa(s) restante(s).`,
        attemptsLeft
      }, { status: 400 });
    }

    // Código válido! Marcar email como verificado e deletar código
    await db.collection('verification_codes').deleteOne({ email });

    // Marcar email como verificado temporariamente (usado antes de criar user)
    await db.collection('verified_emails').updateOne(
      { email },
      { 
        $set: { 
          email,
          verified_at: new Date(),
          expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
        } 
      },
      { upsert: true }
    );

    console.log('[VERIFICATION] Email verified successfully:', email);

    return NextResponse.json({ 
      success: true,
      message: 'Email verificado com sucesso!'
    });

  } catch (error) {
    console.error('[VERIFICATION] Error:', error);
    return NextResponse.json({ 
      error: 'Erro ao verificar código' 
    }, { status: 500 });
  }
}
