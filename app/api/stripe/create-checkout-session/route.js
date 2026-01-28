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
    const { plan_id } = await request.json();

    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Mapear plan_id para Stripe Price ID
    const priceMapping = {
      basic: process.env.STRIPE_PRICE_ID_BASIC,
      pro: process.env.STRIPE_PRICE_ID_PRO,
      enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE,
    };

    const priceId = priceMapping[plan_id];

    if (!priceId) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

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

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('[STRIPE] Error creating checkout session:', error);
    return NextResponse.json({ 
      error: 'Erro ao criar sessão de checkout',
      details: error.message 
    }, { status: 500 });
  }
}
