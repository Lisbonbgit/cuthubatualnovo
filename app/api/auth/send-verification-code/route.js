import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const MONGO_URL = process.env.MONGO_URL;
const FROM_EMAIL = process.env.FROM_EMAIL;

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const client = await MongoClient.connect(MONGO_URL);
  cachedClient = client;
  return client;
}

// Gerar código de 4 dígitos
function generateVerificationCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    // Verificar se email já existe
    const existingUser = await db.collection('utilizadores').findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Este email já está registado' }, { status: 400 });
    }

    // Gerar código
    const code = generateVerificationCode();
    const hashedCode = await bcrypt.hash(code, 10);

    // Guardar código com expiração
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutos

    await db.collection('verification_codes').updateOne(
      { email },
      {
        $set: {
          email,
          code: hashedCode,
          attempts: 0,
          expires_at: expiresAt,
          created_at: new Date()
        }
      },
      { upsert: true }
    );

    // Enviar email com código
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Código de Verificação - CutHub',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">✂️ CutHub</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Código de Verificação</h2>
                
                <p style="color: #4b5563; font-size: 16px;">
                  Use o código abaixo para verificar o seu email:
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center; border: 2px solid #f59e0b;">
                  <div style="font-size: 48px; font-weight: bold; color: #1f2937; letter-spacing: 10px; font-family: monospace;">
                    ${code}
                  </div>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">
                  Este código é válido por <strong>10 minutos</strong>.
                </p>
                
                <p style="color: #6b7280; font-size: 14px;">
                  Se não solicitou este código, pode ignorar este email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  © 2026 CutHub. Todos os direitos reservados.<br>
                  Plataforma de gestão para barbearias
                </p>
              </div>
            </body>
          </html>
        `
      });

      console.log('[VERIFICATION] Code sent to:', email);
    } catch (emailError) {
      console.error('[VERIFICATION] Error sending email:', emailError);
      return NextResponse.json({ 
        error: 'Erro ao enviar código. Verifique o email.' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Código enviado para o seu email',
      expiresIn: 600 // 10 minutos em segundos
    });

  } catch (error) {
    console.error('[VERIFICATION] Error:', error);
    return NextResponse.json({ 
      error: 'Erro ao gerar código de verificação' 
    }, { status: 500 });
  }
}
