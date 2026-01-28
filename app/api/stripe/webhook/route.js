import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import Stripe from 'stripe';
import { EmailService } from '@/lib/email-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
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
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verificar assinatura do webhook
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err) {
      console.error('[STRIPE WEBHOOK] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    console.log('[STRIPE WEBHOOK] Event received:', event.type);

    // Processar eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Obter subscription do Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        const userId = session.metadata.user_id || session.client_reference_id;
        const planId = session.metadata.plan_id;

        // Criar ou atualizar subscription no MongoDB
        await db.collection('subscriptions').updateOne(
          { user_id: userId },
          {
            $set: {
              user_id: userId,
              plan_id: planId,
              plano: planId,
              plan_name: planId.charAt(0).toUpperCase() + planId.slice(1),
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
              stripe_price_id: subscription.items.data[0].price.id,
              status: subscription.status, // 'trialing' or 'active'
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              cancel_at_period_end: subscription.cancel_at_period_end,
              created_at: new Date(),
              updated_at: new Date(),
            }
          },
          { upsert: true }
        );

        // Buscar usuário para enviar email
        const user = await db.collection('utilizadores').findOne({ _id: new ObjectId(userId) });

        // Enviar emails (não bloquear)
        try {
          if (user?.email) {
            const planNames = { basic: 'Básico', pro: 'Pro', enterprise: 'Enterprise' };
            const planPrices = { basic: 29, pro: 49, enterprise: 99 };
            
            await EmailService.sendSubscriptionConfirmation(user.email, user.nome, {
              name: planNames[planId] || planId,
              price: planPrices[planId] || 0
            });

            await EmailService.notifyAdminNewSubscription({
              userEmail: user.email,
              planName: planNames[planId] || planId,
              price: planPrices[planId] || 0,
              paymentMethod: 'Stripe'
            });
          }
        } catch (emailError) {
          console.error('[STRIPE WEBHOOK] Error sending emails:', emailError);
        }

        console.log('[STRIPE WEBHOOK] Subscription created for user:', userId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        // Atualizar subscription no MongoDB
        await db.collection('subscriptions').updateOne(
          { stripe_subscription_id: subscription.id },
          {
            $set: {
              status: subscription.status,
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
              current_period_start: new Date(subscription.current_period_start * 1000),
              current_period_end: new Date(subscription.current_period_end * 1000),
              cancel_at_period_end: subscription.cancel_at_period_end,
              updated_at: new Date(),
            }
          }
        );

        console.log('[STRIPE WEBHOOK] Subscription updated:', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        // Marcar subscription como cancelada
        await db.collection('subscriptions').updateOne(
          { stripe_subscription_id: subscription.id },
          {
            $set: {
              status: 'cancelled',
              cancelled_at: new Date(),
              updated_at: new Date(),
            }
          }
        );

        console.log('[STRIPE WEBHOOK] Subscription cancelled:', subscription.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
        // Marcar subscription como past_due
        if (invoice.subscription) {
          await db.collection('subscriptions').updateOne(
            { stripe_subscription_id: invoice.subscription },
            {
              $set: {
                status: 'past_due',
                updated_at: new Date(),
              }
            }
          );
        }

        console.log('[STRIPE WEBHOOK] Payment failed for invoice:', invoice.id);
        break;
      }

      default:
        console.log('[STRIPE WEBHOOK] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[STRIPE WEBHOOK] Error processing webhook:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error.message 
    }, { status: 500 });
  }
}
