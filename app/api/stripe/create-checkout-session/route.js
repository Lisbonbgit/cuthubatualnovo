import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const JWT_SECRET = process.env.JWT_SECRET;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function POST(request) {
  try {
    console.log('[STRIPE CHECKOUT] === Starting checkout session creation ===');
    
    // Verificar se Stripe está configurado
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[STRIPE CHECKOUT] ERROR: STRIPE_SECRET_KEY not configured!');
      return NextResponse.json({ 
        error: 'Stripe não configurado. Contacte o administrador.',
        details: 'STRIPE_SECRET_KEY missing'
      }, { status: 500 });
    }
    console.log('[STRIPE CHECKOUT] ✓ STRIPE_SECRET_KEY is configured');

    const { plan_id } = await request.json();
    console.log('[STRIPE CHECKOUT] Plan requested:', plan_id);

    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[STRIPE CHECKOUT] ERROR: No authorization header');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      console.error('[STRIPE CHECKOUT] ERROR: Invalid token');
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    console.log('[STRIPE CHECKOUT] User authenticated:', decoded.email);

    // VERIFICAR SE EMAIL FOI VERIFICADO COM CÓDIGO
    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');
    
    const emailVerification = await db.collection('verified_emails').findOne({ 
      email: decoded.email 
    });
    
    if (!emailVerification) {
      console.error('[STRIPE CHECKOUT] ERROR: Email not verified with code');
      return NextResponse.json({ 
        error: 'Email não verificado',
        message: 'Por favor, verifique o seu email com o código de 4 dígitos antes de continuar.',
        requires_verification: true
      }, { status: 403 });
    }
    
    // Verificar se verificação ainda é válida (30 minutos)
    if (new Date() > new Date(emailVerification.expires_at)) {
      console.error('[STRIPE CHECKOUT] ERROR: Email verification expired');
      await db.collection('verified_emails').deleteOne({ email: decoded.email });
      return NextResponse.json({ 
        error: 'Verificação de email expirada',
        message: 'A verificação de email expirou. Solicite um novo código.',
        requires_verification: true
      }, { status: 403 });
    }
    
    console.log('[STRIPE CHECKOUT] ✓ Email verified successfully');

    // Mapear plan_id para Stripe Price ID
    const priceMapping = {
      basic: process.env.STRIPE_PRICE_ID_BASIC,
      pro: process.env.STRIPE_PRICE_ID_PRO,
      enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE,
    };

    const priceId = priceMapping[plan_id];
    
    console.log('[STRIPE CHECKOUT] Price mapping:', {
      plan_id,
      priceId,
      STRIPE_PRICE_ID_BASIC: process.env.STRIPE_PRICE_ID_BASIC ? 'SET' : 'NOT SET',
      STRIPE_PRICE_ID_PRO: process.env.STRIPE_PRICE_ID_PRO ? 'SET' : 'NOT SET',
      STRIPE_PRICE_ID_ENTERPRISE: process.env.STRIPE_PRICE_ID_ENTERPRISE ? 'SET' : 'NOT SET',
    });

    if (!priceId) {
      console.error('[STRIPE CHECKOUT] ERROR: Invalid plan_id or price not configured');
      return NextResponse.json({ error: 'Plano inválido ou não configurado' }, { status: 400 });
    }

    console.log('[STRIPE CHECKOUT] Using price_id:', priceId);
    console.log('[STRIPE CHECKOUT] Creating Stripe session...');

    // Criar Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: decoded.userId,
          user_email: decoded.email,
          plan_id: plan_id,
        },
      },
      customer_email: decoded.email,
      client_reference_id: decoded.userId,
      success_url: `${BASE_URL}/criar-barbearia?session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${BASE_URL}/planos?payment=cancelled`,
      metadata: {
        user_id: decoded.userId,
        plan_id: plan_id,
      },
    });

    console.log('[STRIPE CHECKOUT] ✓ Session created successfully:', session.id);
    console.log('[STRIPE CHECKOUT] Checkout URL:', session.url);

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('[STRIPE CHECKOUT] ❌ CRITICAL ERROR:', error);
    console.error('[STRIPE CHECKOUT] Error name:', error.name);
    console.error('[STRIPE CHECKOUT] Error message:', error.message);
    console.error('[STRIPE CHECKOUT] Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Erro ao criar sessão de checkout',
      details: error.message,
      errorType: error.type || error.name
    }, { status: 500 });
  }
}
