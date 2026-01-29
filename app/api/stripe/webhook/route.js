import Stripe from 'stripe';
import { MongoClient, ObjectId } from 'mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const MONGO_URL = process.env.MONGO_URL;

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(MONGO_URL);
  cachedClient = client;
  return client;
}

export async function POST(request) {
  let event;

  try {
    // 🔴 OBRIGATÓRIO: body cru
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return new Response('Missing stripe-signature', { status: 400 });
    }

    // 🔐 Verificar assinatura Stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[STRIPE WEBHOOK] Signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const client = await connectToDatabase();
  const db = client.db(process.env.DB_NAME || 'barbearia_saas');

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription
        );

        const userId =
          session.metadata?.user_id ||
          session.client_reference_id;

        const planId = session.metadata?.plan_id;

        if (!userId) {
          console.error('[STRIPE WEBHOOK] userId ausente');
          break;
        }

        // Guardar subscrição
        await db.collection('subscriptions').updateOne(
          { user_id: userId },
          {
            $set: {
              user_id: userId,
              plan_id: planId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              created_at: new Date(),
              updated_at: new Date(),
            },
          },
          { upsert: true }
        );

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;

        await db.collection('subscriptions').updateOne(
          { stripe_subscription_id: subscription.id },
          {
            $set: {
              status: subscription.status,
              updated_at: new Date(),
            },
          }
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        await db.collection('subscriptions').updateOne(
          { stripe_subscription_id: subscription.id },
          {
            $set: {
              status: 'cancelled',
              updated_at: new Date(),
            },
          }
        );
        break;
      }

      default:
        console.log('[STRIPE WEBHOOK] Evento ignorado:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (err) {
    console.error('[STRIPE WEBHOOK] Erro interno:', err);
    return new Response('Webhook handler failed', { status: 500 });
  }
}
