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
    console.log('[STRIPE WEBHOOK] === Incoming webhook request ===');
    
    if (!WEBHOOK_SECRET) {
      console.error('[STRIPE WEBHOOK] CRITICAL: STRIPE_WEBHOOK_SECRET not configured!');
      console.log('[STRIPE WEBHOOK] Webhook will process without signature validation (INSECURE)');
    } else {
      console.log('[STRIPE WEBHOOK] ✓ STRIPE_WEBHOOK_SECRET is configured');
    }
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    console.log('[STRIPE WEBHOOK] Body length:', body.length);
    console.log('[STRIPE WEBHOOK] Signature present:', !!signature);
    
    if (!signature) {
      console.error('[STRIPE WEBHOOK] ERROR: No stripe-signature header');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event;
    try {
      if (WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
        console.log('[STRIPE WEBHOOK] ✓ Signature verified successfully');
      } else {
        console.warn('[STRIPE WEBHOOK] ⚠️ Processing webhook WITHOUT signature validation!');
        event = JSON.parse(body);
      }
    } catch (err) {
      console.error('[STRIPE WEBHOOK] ❌ Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    console.log('[STRIPE WEBHOOK] ✓ Event received:', event.type);

    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;

        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        const userId = session.metadata.user_id || session.client_reference_id;
        const planId = session.metadata.plan_id;

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
              status: subscription.status,
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

        const user = await db.collection('utilizadores').findOne({ _id: new ObjectId(userId) });

        if (user) {
          await db.collection('utilizadores').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { stripe_customer_id: subscription.customer } }
          );
        }

        // ✅ ADIÇÃO CRÍTICA: CRIAR BARBEARIA AUTOMATICAMENTE
        const existingBarbearia = await db.collection('barbearias').findOne({
          owner_id: userId
        });

        if (!existingBarbearia) {
          await db.collection('barbearias').insertOne({
            owner_id: userId,
            nome: user?.nome || 'Minha Barbearia',
            descricao: '',
            plano: planId,
            stripe_subscription_id: subscription.id,
            criada_em: new Date(),
            ativa: true
          });

          console.log('[STRIPE WEBHOOK] Barbearia criada automaticamente para user:', userId);
        } else {
          console.log('[STRIPE WEBHOOK] Barbearia já existia para user:', userId);
        }

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

        console.log('[STRIPE WEBHOOK] Subscription + Barbearia processadas com sucesso');
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;

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
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

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
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;

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
        break;
      }

      default:
        console.log('[STRIPE WEBHOOK] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[STRIPE WEBHOOK] Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
