import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import twilio from 'twilio';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const MONGO_URL = process.env.MONGO_URL;

// Twilio WhatsApp Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

// Initialize Twilio client
let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

// Function to send WhatsApp notification
async function sendWhatsAppNotification(to, message) {
  if (!twilioClient) {
    console.log('[WhatsApp] Twilio not configured. Skipping WhatsApp notification.');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    // Ensure phone number has whatsapp: prefix and country code
    let formattedPhone = to;
    if (!formattedPhone.startsWith('whatsapp:')) {
      // If number doesn't start with +, add +351 (Portugal)
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+351${formattedPhone}`;
      }
      formattedPhone = `whatsapp:${formattedPhone}`;
    }

    console.log(`[WhatsApp] Sending to: ${formattedPhone}`);
    
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_WHATSAPP_FROM,
      to: formattedPhone
    });

    console.log(`[WhatsApp] Message sent successfully. SID: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error.message);
    return { success: false, error: error.message };
  }
}

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const client = await MongoClient.connect(MONGO_URL);
  cachedClient = client;
  return client;
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function generateTimeSlots(startTime, endTime, duration) {
  const slots = [];
  let current = startTime;
  
  while (current < endTime) {
    const hours = Math.floor(current / 60);
    const minutes = current % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    current += duration;
  }
  
  return slots;
}

export async function POST(request, { params }) {
  try {
    const path = params?.path ? params.path.join('/') : '';
    const body = await request.json();
    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    // AUTH - Register
    if (path === 'auth/register') {
      const { email, password, nome, tipo, barbearia_id } = body;
      
      const existingUser = await db.collection('utilizadores').findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: 'Email já registado' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        email,
        password: hashedPassword,
        nome,
        tipo: tipo || 'cliente',
        barbearia_id: barbearia_id || null,
        criado_em: new Date(),
        // Donos precisam de subscription, clientes não
        requires_subscription: tipo === 'owner' || (!tipo && !barbearia_id)
      };

      const result = await db.collection('utilizadores').insertOne(user);
      const token = jwt.sign(
        { userId: result.insertedId.toString(), email, tipo: user.tipo, barbearia_id: user.barbearia_id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({ token, user: { ...user, _id: result.insertedId, password: undefined } });
    }

    // AUTH - Login
    if (path === 'auth/login') {
      const { email, password } = body;
      
      const user = await db.collection('utilizadores').findOne({ email });
      if (!user) {
        return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
      }

      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, tipo: user.tipo, barbearia_id: user.barbearia_id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({ token, user: { ...user, password: undefined } });
    }

    // GET Planos - Rota pública para obter todos os planos disponíveis
    if (path === 'planos') {
      const planos = await db.collection('planos')
        .find({ ativo: true })
        .toArray();

      return NextResponse.json({ planos });
    }

    // BARBEARIAS - Create
    if (path === 'barbearias') {
      const { nome, descricao, email_admin, password_admin } = body;
      
      let userId = null;
      
      // Verificar se usuário tem subscription ativa
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decodedToken = verifyToken(token);
        
        if (decodedToken) {
          userId = decodedToken.userId;
          
          // Verificar subscription
          const subscription = await db.collection('subscriptions').findOne({
            user_id: userId,
            status: { $in: ['active', 'trialing'] }
          });

          if (!subscription) {
            return NextResponse.json({ 
              error: 'Precisa de uma assinatura ativa para criar uma barbearia',
              requires_subscription: true 
            }, { status: 403 });
          }

          // Buscar limites do plano
          const plano = await db.collection('planos').findOne({ id: subscription.plano });
          
          if (plano && plano.limite_barbearias !== -1) {
            // Verificar limite de barbearias do plano
            const existingBarbearias = await db.collection('barbearias')
              .countDocuments({ owner_id: userId });

            if (existingBarbearias >= plano.limite_barbearias) {
              return NextResponse.json({ 
                error: 'Limite de barbearias atingido',
                message: `O seu plano ${plano.nome} permite apenas ${plano.limite_barbearias} barbearia(s). Para criar mais barbearias, atualize o seu plano.`,
                upgrade_required: true,
                current_plan: plano.nome,
                limit: plano.limite_barbearias
              }, { status: 403 });
            }
          }
        }
      }
      
      const slug = nome.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const existingBarbearia = await db.collection('barbearias').findOne({ slug });
      if (existingBarbearia) {
        return NextResponse.json({ error: 'Já existe uma barbearia com este nome' }, { status: 400 });
      }

      const barbearia = {
        nome,
        slug,
        descricao: descricao || '',
        logo: null,
        owner_id: userId,
        criado_em: new Date()
      };

      const barbeariaResult = await db.collection('barbearias').insertOne(barbearia);
      const barbeariaId = barbeariaResult.insertedId.toString();

      const hashedPassword = await bcrypt.hash(password_admin, 10);
      const admin = {
        email: email_admin,
        password: hashedPassword,
        nome: 'Administrador',
        tipo: 'admin',
        barbearia_id: barbeariaId,
        criado_em: new Date()
      };

      await db.collection('utilizadores').insertOne(admin);

      const diasSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
      const horariosPadrao = diasSemana.map(dia => ({
        barbearia_id: barbeariaId,
        dia_semana: dia,
        hora_inicio: dia === 'domingo' ? null : '09:00',
        hora_fim: dia === 'domingo' ? null : '19:00',
        ativo: dia !== 'domingo'
      }));

      await db.collection('horarios_funcionamento').insertMany(horariosPadrao);

      return NextResponse.json({ barbearia: { ...barbearia, _id: barbeariaId } });
    }

    // Protected routes - require authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // BARBEIROS - Add (Admin only)
    if (path === 'barbeiros') {
      if (decoded.tipo !== 'admin' && decoded.tipo !== 'owner') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      // Verificar limite de barbeiros do plano
      const subscription = await db.collection('subscriptions').findOne({
        barbearia_id: decoded.barbearia_id,
        status: { $in: ['active', 'trialing'] }
      });

      if (subscription) {
        const plano = await db.collection('planos').findOne({ id: subscription.plano });
        
        if (plano && plano.limite_barbeiros !== -1) {
          // Contar barbeiros ativos
          const totalBarbeiros = await db.collection('utilizadores').countDocuments({
            barbearia_id: decoded.barbearia_id,
            tipo: 'barbeiro',
            ativo: { $ne: false }
          });

          if (totalBarbeiros >= plano.limite_barbeiros) {
            return NextResponse.json({ 
              error: 'Limite de barbeiros atingido',
              message: `O seu plano ${plano.nome} permite apenas ${plano.limite_barbeiros} barbeiro(s). Para adicionar mais barbeiros, atualize o seu plano.`,
              upgrade_required: true,
              current_plan: plano.nome,
              limit: plano.limite_barbeiros
            }, { status: 403 });
          }
        }
      }

      const { email, password, nome, telemovel, biografia, especialidades, local_id } = body;
      
      const existingUser = await db.collection('utilizadores').findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: 'Email já registado' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const barbeiro = {
        email,
        password: hashedPassword,
        nome,
        telemovel: telemovel || '',
        biografia: biografia || '',
        especialidades: especialidades || [],
        tipo: 'barbeiro',
        barbearia_id: decoded.barbearia_id,
        local_id: local_id || null,
        ativo: true,
        criado_em: new Date()
      };

      const result = await db.collection('utilizadores').insertOne(barbeiro);
      return NextResponse.json({ barbeiro: { ...barbeiro, _id: result.insertedId, password: undefined } });
    }

    // SERVIÇOS - Create
    if (path === 'servicos') {
      if (decoded.tipo !== 'admin' && decoded.tipo !== 'owner') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { nome, preco, duracao } = body;
      const servico = {
        nome,
        preco: parseFloat(preco),
        duracao: parseInt(duracao),
        barbearia_id: decoded.barbearia_id,
        criado_em: new Date()
      };

      const result = await db.collection('servicos').insertOne(servico);
      return NextResponse.json({ servico: { ...servico, _id: result.insertedId } });
    }

    // PRODUTOS - Create
    if (path === 'produtos') {
      if (decoded.tipo !== 'admin' && decoded.tipo !== 'owner') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { nome, preco, descricao, imagem } = body;
      const produto = {
        nome,
        preco: parseFloat(preco),
        descricao: descricao || '',
        imagem: imagem || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400',
        barbearia_id: decoded.barbearia_id,
        criado_em: new Date()
      };

      const result = await db.collection('produtos').insertOne(produto);
      return NextResponse.json({ produto: { ...produto, _id: result.insertedId } });
    }

    // LOCAIS - Create (Criar novo local/filial)
    if (path === 'locais') {
      if (decoded.tipo !== 'admin' && decoded.tipo !== 'owner') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      // Verificar limite de locais do plano
      const subscription = await db.collection('subscriptions').findOne({
        barbearia_id: decoded.barbearia_id,
        status: { $in: ['active', 'trialing'] }
      });

      if (subscription) {
        const plano = await db.collection('planos').findOne({ id: subscription.plano });
        
        if (plano && plano.limite_barbearias !== -1) {
          // Contar locais ativos
          const totalLocais = await db.collection('locais').countDocuments({
            barbearia_id: decoded.barbearia_id,
            ativo: { $ne: false }
          });

          if (totalLocais >= plano.limite_barbearias) {
            return NextResponse.json({ 
              error: 'Limite de locais atingido',
              message: `O seu plano ${plano.nome} permite apenas ${plano.limite_barbearias} local(is). Para adicionar mais locais, atualize o seu plano.`,
              upgrade_required: true,
              current_plan: plano.nome,
              limit: plano.limite_barbearias
            }, { status: 403 });
          }
        }
      }

      const { nome, morada, telefone, email, horarios } = body;

      if (!nome || !morada) {
        return NextResponse.json({ error: 'Nome e morada são obrigatórios' }, { status: 400 });
      }

      // Horários padrão se não fornecidos
      const horariosDefault = {
        segunda: { inicio: '09:00', fim: '19:00', ativo: true },
        terca: { inicio: '09:00', fim: '19:00', ativo: true },
        quarta: { inicio: '09:00', fim: '19:00', ativo: true },
        quinta: { inicio: '09:00', fim: '19:00', ativo: true },
        sexta: { inicio: '09:00', fim: '19:00', ativo: true },
        sabado: { inicio: '09:00', fim: '18:00', ativo: true },
        domingo: { inicio: null, fim: null, ativo: false }
      };

      const local = {
        barbearia_id: decoded.barbearia_id,
        nome,
        morada,
        telefone: telefone || '',
        email: email || '',
        horarios: horarios || horariosDefault,
        ativo: true,
        criado_em: new Date()
      };

      const result = await db.collection('locais').insertOne(local);
      return NextResponse.json({ local: { ...local, _id: result.insertedId } });
    }

    // PLANOS CLIENTE - Create
    if (path === 'planos-cliente') {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { nome, preco, duracao, descricao } = body;
      const plano = {
        nome,
        preco: parseFloat(preco),
        duracao: parseInt(duracao),
        descricao: descricao || '',
        barbearia_id: decoded.barbearia_id,
        criado_em: new Date()
      };

      const result = await db.collection('planos_cliente').insertOne(plano);
      return NextResponse.json({ plano: { ...plano, _id: result.insertedId } });
    }

    // SUPORTE - Create ticket
    if (path === 'suporte') {
      const { assunto, mensagem, prioridade } = body;

      if (!assunto || !mensagem) {
        return NextResponse.json({ error: 'Assunto e mensagem são obrigatórios' }, { status: 400 });
      }

      // Get user and barbershop info
      const userInfo = await db.collection('utilizadores').findOne({ _id: new ObjectId(decoded.userId) });
      let barbeariaInfo = null;
      if (decoded.barbearia_id) {
        barbeariaInfo = await db.collection('barbearias').findOne({ _id: new ObjectId(decoded.barbearia_id) });
      }

      const ticket = {
        user_id: decoded.userId,
        user_nome: userInfo?.nome || 'Desconhecido',
        user_email: userInfo?.email || decoded.email,
        user_tipo: decoded.tipo,
        barbearia_id: decoded.barbearia_id || null,
        barbearia_nome: barbeariaInfo?.nome || null,
        assunto,
        mensagem,
        prioridade: prioridade || 'normal',
        status: 'aberto',
        respostas: [],
        criado_em: new Date(),
        atualizado_em: new Date()
      };

      const result = await db.collection('suporte_tickets').insertOne(ticket);

      // Mock email notification
      console.log(`[MOCK EMAIL] Novo ticket de suporte: ${assunto} - de ${userInfo?.email}`);

      return NextResponse.json({ 
        ticket: { ...ticket, _id: result.insertedId },
        message: 'Ticket criado com sucesso! Entraremos em contacto em breve.'
      });
    }

    // MARCAÇÕES - Create
    if (path === 'marcacoes') {
      const { barbeiro_id, servico_id, data, hora, local_id } = body;

      const servicoObj = await db.collection('servicos').findOne({ _id: new ObjectId(servico_id) });
      if (!servicoObj) {
        return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
      }

      const existingMarcacao = await db.collection('marcacoes').findOne({
        barbeiro_id,
        data,
        hora,
        status: { $nin: ['cancelada', 'rejeitada'] }
      });

      if (existingMarcacao) {
        return NextResponse.json({ error: 'Horário já ocupado' }, { status: 400 });
      }

      const marcacao = {
        cliente_id: decoded.userId,
        barbeiro_id,
        servico_id,
        barbearia_id: decoded.barbearia_id || servicoObj.barbearia_id,
        local_id: local_id || null,
        data,
        hora,
        status: 'aceita', // Aprovação automática
        criado_em: new Date(),
        atualizado_em: new Date()
      };

      const result = await db.collection('marcacoes').insertOne(marcacao);

      // Send WhatsApp notification
      try {
        // Get client info
        const cliente = await db.collection('utilizadores').findOne({ _id: new ObjectId(decoded.userId) });
        
        // Get barbeiro info
        const barbeiro = await db.collection('utilizadores').findOne({ _id: new ObjectId(barbeiro_id) });
        
        // Get barbearia info
        const barbearia = await db.collection('barbearias').findOne({ 
          _id: new ObjectId(marcacao.barbearia_id) 
        });

        // Get local info if exists
        let localInfo = '';
        if (local_id) {
          const local = await db.collection('locais').findOne({ _id: new ObjectId(local_id) });
          if (local && local.morada) {
            localInfo = `\n📍 Local: ${local.morada}`;
          }
        }

        // Format WhatsApp message
        const whatsappMessage = `Olá ${cliente?.nome || 'Cliente'}! 

A sua marcação foi confirmada:
📅 Data: ${data}
🕐 Hora: ${hora}
💈 Serviço: ${servicoObj.nome}
👨‍🦰 Barbeiro: ${barbeiro?.nome || 'N/A'}

Barbearia: ${barbearia?.nome || 'CutHub'}${localInfo}

Até breve!`;

        // Send WhatsApp if client has phone number
        if (cliente?.telemovel) {
          await sendWhatsAppNotification(cliente.telemovel, whatsappMessage);
        } else {
          console.log('[WhatsApp] Cliente sem número de telemóvel. Notificação não enviada.');
        }
      } catch (error) {
        console.error('[WhatsApp] Error preparing notification:', error);
        // Don't fail the request if WhatsApp fails
      }

      // Mock email notification
      console.log(`[MOCK EMAIL] Nova marcação confirmada automaticamente para ${data} às ${hora}`);

      return NextResponse.json({ marcacao: { ...marcacao, _id: result.insertedId } });
    }

    // HORÁRIOS - Update
    if (path === 'horarios') {
      if (decoded.tipo !== 'admin' && decoded.tipo !== 'owner') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { horarios } = body;
      
      for (const horario of horarios) {
        await db.collection('horarios_funcionamento').updateOne(
          { barbearia_id: decoded.barbearia_id, dia_semana: horario.dia_semana },
          { $set: horario },
          { upsert: true }
        );
      }

      return NextResponse.json({ success: true });
    }

    // SUBSCRIPTIONS - Create (Mock Payment)
    if (path === 'subscriptions') {
      const { plan_id, payment_method } = body;

      const plans = {
        basic: { name: 'Básico', price: 29, barbearias_limit: 1, barbeiros_limit: 2 },
        pro: { name: 'Pro', price: 49, barbearias_limit: 1, barbeiros_limit: 5 },
        enterprise: { name: 'Enterprise', price: 99, barbearias_limit: 5, barbeiros_limit: 999 }
      };

      if (!plans[plan_id]) {
        return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
      }

      // Check if user already has active subscription
      const existingSubscription = await db.collection('subscriptions').findOne({
        user_id: decoded.userId,
        status: 'active'
      });

      if (existingSubscription) {
        return NextResponse.json({ error: 'Já possui uma assinatura ativa' }, { status: 400 });
      }

      // Mock payment processing (always succeeds)
      console.log(`[MOCK PAYMENT] Processing ${plans[plan_id].price}€ for user ${decoded.email}`);

      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days trial

      const nextBillingDate = new Date(trialEndDate);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      const subscription = {
        user_id: decoded.userId,
        plan_id,
        plan_name: plans[plan_id].name,
        price: plans[plan_id].price,
        status: 'active',
        trial_end: trialEndDate,
        next_billing_date: nextBillingDate,
        payment_method: payment_method || 'mock',
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await db.collection('subscriptions').insertOne(subscription);

      console.log(`[MOCK PAYMENT] Payment successful! Subscription activated for ${decoded.email}`);
      console.log(`[MOCK PAYMENT] Trial period: 7 days (ends ${trialEndDate.toLocaleDateString('pt-PT')})`);

      return NextResponse.json({ 
        subscription: { ...subscription, _id: result.insertedId },
        message: 'Assinatura ativada com sucesso! Trial de 7 dias iniciado.'
      });
    }

    // SUBSCRIPTIONS - Cancel
    if (path === 'subscriptions/cancel') {
      const subscription = await db.collection('subscriptions').findOne({
        user_id: decoded.userId,
        status: 'active'
      });

      if (!subscription) {
        return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada' }, { status: 404 });
      }

      await db.collection('subscriptions').updateOne(
        { _id: subscription._id },
        { 
          $set: { 
            status: 'canceled',
            canceled_at: new Date(),
            updated_at: new Date()
          } 
        }
      );

      return NextResponse.json({ message: 'Assinatura cancelada com sucesso' });
    }

    // Subscription Change - Alterar plano existente
    if (path === 'subscription/change') {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { plano } = body;

      if (!plano) {
        return NextResponse.json({ error: 'Plano não especificado' }, { status: 400 });
      }

      // Buscar subscription atual
      const currentSubscription = await db.collection('subscriptions').findOne({
        barbearia_id: decoded.barbearia_id,
        status: { $in: ['active', 'trialing'] }
      });

      if (!currentSubscription) {
        return NextResponse.json({ error: 'Nenhuma subscrição ativa encontrada' }, { status: 404 });
      }

      // Atualizar para o novo plano
      await db.collection('subscriptions').updateOne(
        { _id: currentSubscription._id },
        { 
          $set: { 
            plano: plano,
            status: 'active', // Remove trial ao mudar de plano
            alterado_em: new Date(),
            historico_alteracoes: [
              ...(currentSubscription.historico_alteracoes || []),
              {
                plano_anterior: currentSubscription.plano,
                plano_novo: plano,
                data: new Date()
              }
            ]
          } 
        }
      );

      return NextResponse.json({ 
        success: true, 
        message: `Plano alterado para ${plano} com sucesso` 
      });
    }

    // Subscription Cancel - Cancelar subscrição
    if (path === 'subscription/cancel') {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      // Buscar subscription atual
      const currentSubscription = await db.collection('subscriptions').findOne({
        barbearia_id: decoded.barbearia_id,
        status: { $in: ['active', 'trialing'] }
      });

      if (!currentSubscription) {
        return NextResponse.json({ error: 'Nenhuma subscrição ativa encontrada' }, { status: 404 });
      }

      await db.collection('subscriptions').updateOne(
        { _id: currentSubscription._id },
        { 
          $set: { 
            status: 'cancelled',
            cancelado_em: new Date(),
            motivo_cancelamento: body.motivo || 'Cancelado pelo utilizador'
          } 
        }
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Subscrição cancelada com sucesso' 
      });
    }

    // BARBEARIA - Update Settings
    if (path === 'barbearia/settings') {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { nome, descricao, telefone, email_contacto, imagem_hero } = body;

      await db.collection('barbearias').updateOne(
        { _id: new ObjectId(decoded.barbearia_id) },
        { 
          $set: { 
            nome,
            descricao: descricao || '',
            telefone: telefone || '',
            email_contacto: email_contacto || '',
            imagem_hero: imagem_hero || '',
            atualizado_em: new Date()
          } 
        }
      );

      return NextResponse.json({ success: true, message: 'Configurações atualizadas' });
    }

    // BARBEARIA - Stripe Configuration
    if (path === 'barbearia/stripe-config') {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { stripe_public_key, stripe_secret_key } = body;

      if (!stripe_public_key || !stripe_secret_key) {
        return NextResponse.json({ error: 'Chaves do Stripe são obrigatórias' }, { status: 400 });
      }

      // Validar formato das chaves
      if (!stripe_public_key.startsWith('pk_')) {
        return NextResponse.json({ error: 'Publishable Key inválida (deve começar com pk_)' }, { status: 400 });
      }

      if (!stripe_secret_key.startsWith('sk_')) {
        return NextResponse.json({ error: 'Secret Key inválida (deve começar com sk_)' }, { status: 400 });
      }

      const updateData = {
        stripe_public_key,
        stripe_configured: true,
        atualizado_em: new Date()
      };

      // Só atualizar a secret key se foi fornecida (por segurança)
      if (stripe_secret_key && stripe_secret_key.length > 10) {
        updateData.stripe_secret_key = stripe_secret_key;
      }

      await db.collection('barbearias').updateOne(
        { _id: new ObjectId(decoded.barbearia_id) },
        { $set: updateData }
      );

      return NextResponse.json({ success: true, message: 'Configuração do Stripe guardada com sucesso' });
    }

    // BARBEARIA - WhatsApp/Twilio Configuration
    if (path === 'barbearia/whatsapp-config') {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { twilio_account_sid, twilio_auth_token, twilio_whatsapp_number, whatsapp_enabled } = body;

      const updateData = {
        whatsapp_enabled: whatsapp_enabled || false,
        atualizado_em: new Date()
      };

      // Se está a ativar, validar e guardar as credenciais
      if (whatsapp_enabled) {
        if (!twilio_account_sid || !twilio_auth_token || !twilio_whatsapp_number) {
          return NextResponse.json({ error: 'Todas as credenciais Twilio são obrigatórias para ativar WhatsApp' }, { status: 400 });
        }

        // Validar formato básico
        if (!twilio_account_sid.startsWith('AC')) {
          return NextResponse.json({ error: 'Account SID inválido (deve começar com AC)' }, { status: 400 });
        }

        updateData.twilio_account_sid = twilio_account_sid;
        updateData.twilio_auth_token = twilio_auth_token;
        updateData.twilio_whatsapp_number = twilio_whatsapp_number;
        updateData.whatsapp_configured = true;
      } else {
        // Se está a desativar, apenas marcar como desativado
        updateData.whatsapp_enabled = false;
      }

      await db.collection('barbearias').updateOne(
        { _id: new ObjectId(decoded.barbearia_id) },
        { $set: updateData }
      );

      return NextResponse.json({ success: true, message: 'Configuração do WhatsApp guardada com sucesso' });
    }

    // PLANOS CLIENTE - Create
    if (path === 'planos-cliente') {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { nome, preco, duracao, descricao } = body;

      if (!nome || !preco) {
        return NextResponse.json({ error: 'Nome e preço são obrigatórios' }, { status: 400 });
      }

      const plano = {
        nome,
        preco: parseFloat(preco),
        duracao: parseInt(duracao) || 30,
        descricao: descricao || '',
        barbearia_id: decoded.barbearia_id,
        ativo: true,
        criado_em: new Date()
      };

      const result = await db.collection('planos_cliente').insertOne(plano);
      return NextResponse.json({ plano: { ...plano, _id: result.insertedId } });
    }

    // CLIENTES MANUAL - Criar cliente manualmente (Admin/Barbeiro)
    if (path === 'clientes/manual') {
      if (decoded.tipo !== 'admin' && decoded.tipo !== 'barbeiro') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { nome, email, telemovel } = body;

      if (!nome) {
        return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
      }

      // Verificar se já existe um cliente com este email (se fornecido)
      if (email) {
        const existingUser = await db.collection('utilizadores').findOne({ email });
        if (existingUser) {
          return NextResponse.json({ error: 'Já existe um cliente com este email' }, { status: 400 });
        }
      }

      // Gerar email fictício se não fornecido (para clientes sem email)
      const emailFinal = email || `cliente_${Date.now()}@manual.local`;

      // Criar cliente sem password (conta manual)
      const cliente = {
        email: emailFinal,
        nome,
        telemovel: telemovel || '',
        tipo: 'cliente',
        barbearia_id: decoded.barbearia_id,
        criado_manualmente: true,
        criado_por: decoded.userId,
        criado_em: new Date()
      };

      const result = await db.collection('utilizadores').insertOne(cliente);
      
      console.log(`[MOCK EMAIL] Novo cliente criado manualmente: ${nome}`);

      return NextResponse.json({ cliente: { ...cliente, _id: result.insertedId } });
    }

    // MARCAÇÕES MANUAL - Criar marcação manual (Admin/Barbeiro)
    if (path === 'marcacoes/manual') {
      if (decoded.tipo !== 'admin' && decoded.tipo !== 'barbeiro') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { cliente_id, barbeiro_id, servico_id, data, hora } = body;

      // Validações
      if (!cliente_id || !barbeiro_id || !servico_id || !data || !hora) {
        return NextResponse.json({ 
          error: 'Todos os campos são obrigatórios (cliente, barbeiro, serviço, data e hora)' 
        }, { status: 400 });
      }

      // Verificar se o cliente existe
      const cliente = await db.collection('utilizadores').findOne({ _id: new ObjectId(cliente_id) });
      if (!cliente) {
        return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
      }

      // Verificar se o barbeiro existe
      const barbeiro = await db.collection('utilizadores').findOne({ _id: new ObjectId(barbeiro_id), tipo: 'barbeiro' });
      if (!barbeiro) {
        return NextResponse.json({ error: 'Barbeiro não encontrado' }, { status: 404 });
      }

      // Se é barbeiro, só pode criar marcações para si próprio
      if (decoded.tipo === 'barbeiro' && barbeiro_id !== decoded.userId) {
        return NextResponse.json({ error: 'Só pode criar marcações para si próprio' }, { status: 403 });
      }

      // Verificar se o serviço existe
      const servico = await db.collection('servicos').findOne({ _id: new ObjectId(servico_id) });
      if (!servico) {
        return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
      }

      // Verificar se o horário está disponível
      const existingMarcacao = await db.collection('marcacoes').findOne({
        barbeiro_id,
        data,
        hora,
        status: { $nin: ['cancelada', 'rejeitada'] }
      });

      if (existingMarcacao) {
        return NextResponse.json({ error: 'Este horário já está ocupado' }, { status: 400 });
      }

      // Criar marcação com status 'aceita' (já que é manual)
      const marcacao = {
        cliente_id,
        barbeiro_id,
        servico_id,
        barbearia_id: decoded.barbearia_id || servico.barbearia_id,
        data,
        hora,
        status: 'aceita', // Marcações manuais já começam aceitas
        criado_manualmente: true,
        criado_por: decoded.userId,
        criado_em: new Date(),
        atualizado_em: new Date()
      };

      const result = await db.collection('marcacoes').insertOne(marcacao);

      // Enviar notificação WhatsApp se configurado
      const barbearia = await db.collection('barbearias').findOne({ _id: new ObjectId(decoded.barbearia_id || servico.barbearia_id) });
      if (barbearia && barbearia.twilio_account_sid && barbearia.twilio_auth_token && cliente.telemovel) {
        try {
          await sendWhatsAppNotification(barbearia, cliente.telemovel, 'booking_confirmation', {
            customerName: cliente.nome,
            barbershopName: barbearia.nome,
            date: data,
            time: hora
          });
        } catch (whatsappError) {
          console.error('Erro ao enviar WhatsApp:', whatsappError);
        }
      }

      console.log(`[MOCK EMAIL] Nova marcação manual criada para ${cliente.nome} em ${data} às ${hora}`);

      return NextResponse.json({ 
        marcacao: { ...marcacao, _id: result.insertedId },
        message: 'Marcação criada com sucesso'
      });
    }

    // STRIPE CHECKOUT - Criar sessão de pagamento para plano
    if (path === 'checkout/create-session') {
      const { plano_id, success_url, cancel_url, barbearia_id } = body;

      if (!plano_id || !barbearia_id) {
        return NextResponse.json({ error: 'plano_id e barbearia_id são obrigatórios' }, { status: 400 });
      }

      // Verificar autenticação do cliente
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.json({ error: 'Token necessário' }, { status: 401 });
      }
      const decoded = verifyToken(authHeader.replace('Bearer ', ''));
      if (!decoded) {
        return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
      }

      // Buscar a barbearia para obter as chaves Stripe
      const barbearia = await db.collection('barbearias').findOne({ _id: new ObjectId(barbearia_id) });
      if (!barbearia) {
        return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 });
      }

      if (!barbearia.stripe_secret_key) {
        return NextResponse.json({ error: 'Esta barbearia ainda não configurou o Stripe' }, { status: 400 });
      }

      // Buscar o plano
      const plano = await db.collection('planos_cliente').findOne({ _id: new ObjectId(plano_id) });
      if (!plano) {
        return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 });
      }

      // Buscar dados do cliente
      const cliente = await db.collection('utilizadores').findOne({ _id: new ObjectId(decoded.userId) });

      // Criar instância do Stripe com a chave secreta da barbearia
      const stripe = new Stripe(barbearia.stripe_secret_key);

      // Criar sessão de checkout
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `${plano.nome} - Assinatura Mensal`,
                description: `Assinatura mensal: ${plano.descricao || plano.nome} - ${barbearia.nome}. Renovação automática todos os meses.`,
              },
              unit_amount: Math.round(plano.preco * 100), // em cêntimos
              recurring: {
                interval: 'month',
                interval_count: 1,
              },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          description: `Assinatura do plano "${plano.nome}" - ${barbearia.nome}`,
        },
        customer_email: cliente?.email,
        metadata: {
          barbearia_id: barbearia_id,
          plano_id: plano_id,
          cliente_id: decoded.userId,
        },
        success_url: success_url || `${request.headers.get('origin')}/barbearia/${barbearia.slug}?success=true`,
        cancel_url: cancel_url || `${request.headers.get('origin')}/barbearia/${barbearia.slug}?canceled=true`,
      });

      return NextResponse.json({ 
        sessionId: session.id,
        url: session.url 
      });
    }

    // WHATSAPP - Enviar notificação manual
    if (path === 'notifications/whatsapp') {
      if (decoded.tipo !== 'admin' && decoded.tipo !== 'barbeiro') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { phone, template, variables } = body;

      if (!phone || !template) {
        return NextResponse.json({ error: 'phone e template são obrigatórios' }, { status: 400 });
      }

      const barbearia = await db.collection('barbearias').findOne({ _id: new ObjectId(decoded.barbearia_id) });
      
      if (!barbearia || !barbearia.twilio_account_sid || !barbearia.twilio_auth_token) {
        return NextResponse.json({ error: 'WhatsApp não configurado. Configure nas definições.' }, { status: 400 });
      }

      try {
        const result = await sendWhatsAppNotification(barbearia, phone, template, variables);
        return NextResponse.json({ success: true, messageSid: result.sid });
      } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // BARBEIRO HORÁRIOS - Guardar horários do barbeiro
    if (path === 'barbeiro/horarios') {
      if (decoded.tipo !== 'barbeiro') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { horario_semanal, hora_almoco_inicio, hora_almoco_fim, excepcoes } = body;

      // Estrutura do horario_semanal: { 0: {ativo: false}, 1: {ativo: true, inicio: "09:00", fim: "19:00"}, ... }
      // Exceções: [{ data: "2026-01-30", tipo: "folga" }, { data: "2026-01-31", inicio: "09:00", fim: "13:00", motivo: "Só manhã" }]

      await db.collection('utilizadores').updateOne(
        { _id: new ObjectId(decoded.userId) },
        { 
          $set: { 
            horario_trabalho: {
              horario_semanal: horario_semanal || {},
              hora_almoco_inicio: hora_almoco_inicio || null,
              hora_almoco_fim: hora_almoco_fim || null,
              excepcoes: excepcoes || [],
              atualizado_em: new Date()
            }
          } 
        }
      );

      return NextResponse.json({ success: true, message: 'Horários guardados com sucesso' });
    }

    // BARBEIRO EXCEÇÕES - Adicionar exceção de horário
    if (path === 'barbeiro/horarios/excecao') {
      if (decoded.tipo !== 'barbeiro') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { data, tipo, inicio, fim, motivo } = body;

      if (!data || !tipo) {
        return NextResponse.json({ error: 'Data e tipo são obrigatórios' }, { status: 400 });
      }

      // tipo: 'folga' (dia inteiro off), 'parcial' (horário diferente), 'extra' (trabalha num dia que normalmente não trabalha)
      const excecao = {
        data,
        tipo,
        inicio: inicio || null,
        fim: fim || null,
        motivo: motivo || '',
        criado_em: new Date()
      };

      await db.collection('utilizadores').updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $push: { 'horario_trabalho.excepcoes': excecao } }
      );

      return NextResponse.json({ success: true, excecao });
    }

    // BARBEIRO EXCEÇÕES - Remover exceção
    if (path === 'barbeiro/horarios/excecao/remover') {
      if (decoded.tipo !== 'barbeiro') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { data } = body;

      await db.collection('utilizadores').updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $pull: { 'horario_trabalho.excepcoes': { data } } }
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Rota não encontrada' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const path = params?.path ? params.path.join('/') : '';
    const { searchParams } = new URL(request.url);
    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    // Public routes
    // GET Available Plans (public - no auth required)
    if (path === 'plans') {
      const plans = [
        {
          id: 'basic',
          name: 'Básico',
          price: 29,
          currency: 'EUR',
          interval: 'month',
          features: [
            '1 barbearia',
            'Até 2 barbeiros',
            'Marcações ilimitadas',
            'Suporte por email'
          ],
          limits: {
            barbearias: 1,
            barbeiros: 2
          }
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 49,
          currency: 'EUR',
          interval: 'month',
          popular: true,
          features: [
            'Até 2 barbearias',
            'Até 5 barbeiros',
            'Marcações ilimitadas',
            'Suporte prioritário',
            'Relatórios avançados'
          ],
          limits: {
            barbearias: 2,
            barbeiros: 5
          }
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 99,
          currency: 'EUR',
          interval: 'month',
          features: [
            'Até 5 barbearias',
            'Barbeiros ilimitados',
            'Marcações ilimitadas',
            'Suporte 24/7',
            'API access',
            'White-label'
          ],
          limits: {
            barbearias: 5,
            barbeiros: 999
          }
        }
      ];

      return NextResponse.json({ plans });
    }

    // GET Barbearia by slug (public)
    if (path.startsWith('barbearias/')) {
      const slug = path.split('/')[1];
      const barbearia = await db.collection('barbearias').findOne({ slug });
      
      if (!barbearia) {
        return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 });
      }

      const servicos = await db.collection('servicos')
        .find({ barbearia_id: barbearia._id.toString() })
        .toArray();

      const produtos = await db.collection('produtos')
        .find({ barbearia_id: barbearia._id.toString() })
        .toArray();

      // Buscar planos de cliente (para assinaturas dos clientes)
      const planos = await db.collection('planos_cliente')
        .find({ barbearia_id: barbearia._id.toString(), ativo: { $ne: false } })
        .toArray();

      // Buscar locais ativos
      const locais = await db.collection('locais')
        .find({ barbearia_id: barbearia._id.toString(), ativo: { $ne: false } })
        .toArray();

      // Buscar apenas barbeiros ativos
      const barbeiros = await db.collection('utilizadores')
        .find({ barbearia_id: barbearia._id.toString(), tipo: 'barbeiro', ativo: { $ne: false } })
        .project({ password: 0 })
        .toArray();

      // Adicionar informações do local a cada barbeiro
      const barbeirosComLocal = barbeiros.map(barbeiro => {
        if (barbeiro.local_id) {
          const local = locais.find(l => l._id.toString() === barbeiro.local_id);
          return { ...barbeiro, local: local ? { _id: local._id, nome: local.nome } : null };
        }
        return { ...barbeiro, local: null };
      });

      return NextResponse.json({
        barbearia,
        servicos,
        produtos,
        planos,
        locais,
        barbeiros: barbeirosComLocal
      });
    }

    // GET Planos - Rota pública para obter todos os planos do SaaS
    if (path === 'planos') {
      const planos = await db.collection('planos')
        .find({ ativo: true })
        .toArray();

      return NextResponse.json({ planos });
    }

    // Protected routes
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // GET Current User
    if (path === 'auth/me') {
      const user = await db.collection('utilizadores').findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { password: 0 } }
      );
      return NextResponse.json({ user });
    }

    // GET Barbeiros (Admin)
    if (path === 'barbeiros') {
      const barbeiros = await db.collection('utilizadores')
        .find({ barbearia_id: decoded.barbearia_id, tipo: 'barbeiro' })
        .project({ password: 0 })
        .toArray();

      // Adicionar informações do local a cada barbeiro
      const barbeirosComLocal = await Promise.all(
        barbeiros.map(async (barbeiro) => {
          if (barbeiro.local_id) {
            const local = await db.collection('locais').findOne(
              { _id: new ObjectId(barbeiro.local_id) },
              { projection: { nome: 1, morada: 1 } }
            );
            return { ...barbeiro, local };
          }
          return { ...barbeiro, local: null };
        })
      );

      return NextResponse.json({ barbeiros: barbeirosComLocal });
    }

    // GET Serviços
    if (path === 'servicos') {
      const barbeariaId = searchParams.get('barbearia_id') || decoded.barbearia_id;
      const servicos = await db.collection('servicos')
        .find({ barbearia_id: barbeariaId })
        .toArray();
      return NextResponse.json({ servicos });
    }

    // GET Produtos
    if (path === 'produtos') {
      const barbeariaId = searchParams.get('barbearia_id') || decoded.barbearia_id;
      const produtos = await db.collection('produtos')
        .find({ barbearia_id: barbeariaId })
        .toArray();
      return NextResponse.json({ produtos });
    }

    // GET Planos Cliente
    if (path === 'planos-cliente') {
      const barbeariaId = searchParams.get('barbearia_id') || decoded.barbearia_id;
      const planos = await db.collection('planos_cliente')
        .find({ barbearia_id: barbeariaId })
        .toArray();
      return NextResponse.json({ planos });
    }

    // GET Horários da Barbearia
    if (path === 'horarios') {
      const horarios = await db.collection('horarios_funcionamento')
        .find({ barbearia_id: decoded.barbearia_id })
        .toArray();
      return NextResponse.json({ horarios });
    }

    // GET Horários do Barbeiro (individual)
    if (path === 'barbeiro/horarios') {
      if (decoded.tipo !== 'barbeiro' && decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const barbeiroId = searchParams.get('barbeiro_id') || decoded.userId;
      
      const barbeiro = await db.collection('utilizadores').findOne(
        { _id: new ObjectId(barbeiroId) },
        { projection: { horario_trabalho: 1, nome: 1 } }
      );

      if (!barbeiro) {
        return NextResponse.json({ error: 'Barbeiro não encontrado' }, { status: 404 });
      }

      // Se não tem horário definido, retornar horário padrão
      const horarioPadrao = {
        horario_semanal: {
          0: { ativo: false }, // Domingo
          1: { ativo: true, inicio: '09:00', fim: '19:00' }, // Segunda
          2: { ativo: true, inicio: '09:00', fim: '19:00' }, // Terça
          3: { ativo: true, inicio: '09:00', fim: '19:00' }, // Quarta
          4: { ativo: true, inicio: '09:00', fim: '19:00' }, // Quinta
          5: { ativo: true, inicio: '09:00', fim: '19:00' }, // Sexta
          6: { ativo: true, inicio: '09:00', fim: '13:00' }, // Sábado
        },
        hora_almoco_inicio: '13:00',
        hora_almoco_fim: '14:00',
        excepcoes: []
      };

      return NextResponse.json({ 
        horario: barbeiro.horario_trabalho || horarioPadrao,
        barbeiro_nome: barbeiro.nome
      });
    }

    // GET Subscription Status
    if (path === 'subscriptions/status') {
      const subscription = await db.collection('subscriptions').findOne({
        user_id: decoded.userId
      }, { sort: { created_at: -1 } });

      // Check if owner has any barbershops
      const barbearia = await db.collection('barbearias').findOne({
        owner_id: decoded.userId
      });

      if (!subscription) {
        return NextResponse.json({ 
          has_subscription: false,
          has_barbearia: !!barbearia,
          requires_subscription: true 
        });
      }

      const now = new Date();
      const trialEnded = subscription.trial_end && new Date(subscription.trial_end) < now;
      const daysUntilTrial = subscription.trial_end 
        ? Math.ceil((new Date(subscription.trial_end) - now) / (1000 * 60 * 60 * 24))
        : 0;

      return NextResponse.json({
        has_subscription: true,
        has_barbearia: !!barbearia,
        barbearia: barbearia ? { nome: barbearia.nome, slug: barbearia.slug } : null,
        subscription: {
          ...subscription,
          trial_ended: trialEnded,
          days_until_trial_end: daysUntilTrial > 0 ? daysUntilTrial : 0,
          is_trial: subscription.status === 'active' && !trialEnded
        }
      });
    }

    // GET Barbearia Settings
    if (path === 'barbearia/settings') {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const barbearia = await db.collection('barbearias').findOne({
        _id: new ObjectId(decoded.barbearia_id)
      });

      if (!barbearia) {
        return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 });
      }

      // Buscar subscription por barbearia_id
      let subscription = await db.collection('subscriptions').findOne({
        barbearia_id: decoded.barbearia_id,
        status: { $in: ['active', 'trialing'] }
      });

      // Fallback: buscar por user_id se owner_id existir
      if (!subscription && barbearia.owner_id) {
        subscription = await db.collection('subscriptions').findOne({
          user_id: barbearia.owner_id,
          status: { $in: ['active', 'trialing'] }
        });
      }

      return NextResponse.json({ 
        barbearia,
        subscription 
      });
    }

    // GET Subscription - Obter subscrição atual
    if (path === 'subscription') {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const subscription = await db.collection('subscriptions').findOne({
        barbearia_id: decoded.barbearia_id,
        status: { $in: ['active', 'trialing'] }
      });

      return NextResponse.json({ subscription });
    }

    // ==================== LOCAIS (Múltiplas Localizações) ====================

    // GET Locais - Listar todos os locais da barbearia
    if (path === 'locais') {
      if (decoded.tipo !== 'admin' && decoded.tipo !== 'barbeiro') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const locais = await db.collection('locais')
        .find({ barbearia_id: decoded.barbearia_id, ativo: { $ne: false } })
        .sort({ criado_em: 1 })
        .toArray();

      // Adicionar contagem de barbeiros por local
      const locaisComStats = await Promise.all(
        locais.map(async (local) => {
          const totalBarbeiros = await db.collection('utilizadores').countDocuments({
            barbearia_id: decoded.barbearia_id,
            tipo: 'barbeiro',
            local_id: local._id.toString(),
            ativo: { $ne: false }
          });
          return { ...local, totalBarbeiros };
        })
      );

      return NextResponse.json({ locais: locaisComStats });
    }

    // GET Suporte Tickets
    if (path === 'suporte') {
      let query = {};
      
      // Super admin vê todos os tickets
      if (decoded.tipo === 'super_admin') {
        // Pode filtrar por status
        const status = searchParams.get('status');
        if (status && status !== 'todos') {
          query.status = status;
        }
      } else {
        // Outros utilizadores veem apenas os seus tickets
        query.user_id = decoded.userId;
      }

      const tickets = await db.collection('suporte_tickets')
        .find(query)
        .sort({ criado_em: -1 })
        .toArray();

      return NextResponse.json({ tickets });
    }

    // GET Local por ID
    if (path.startsWith('locais/') && !path.includes('/horarios')) {
      const localId = path.split('/')[1];
      
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const local = await db.collection('locais').findOne({
        _id: new ObjectId(localId),
        barbearia_id: decoded.barbearia_id
      });

      if (!local) {
        return NextResponse.json({ error: 'Local não encontrado' }, { status: 404 });
      }

      // Buscar barbeiros deste local
      const barbeiros = await db.collection('utilizadores')
        .find({ 
          barbearia_id: decoded.barbearia_id, 
          tipo: 'barbeiro', 
          local_id: localId,
          ativo: { $ne: false } 
        })
        .project({ password: 0 })
        .toArray();

      return NextResponse.json({ local, barbeiros });
    }

    // GET Clientes (CRM)
    if (path === 'clientes') {
      if (decoded.tipo !== 'admin' && decoded.tipo !== 'barbeiro') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      // Buscar TODOS os clientes registrados nesta barbearia (não apenas os com marcações)
      const todosClientes = await db.collection('utilizadores')
        .find({ 
          barbearia_id: decoded.barbearia_id, 
          tipo: 'cliente'
        })
        .project({ password: 0 })
        .toArray();

      // Também buscar clientes que fizeram marcações (podem não ter barbearia_id definido)
      const marcacoes = await db.collection('marcacoes')
        .find({ barbearia_id: decoded.barbearia_id })
        .toArray();

      const clienteIdsComMarcacoes = [...new Set(marcacoes.map(m => m.cliente_id))];

      // Buscar clientes que têm marcações mas podem não ter barbearia_id
      const clientesComMarcacoes = await db.collection('utilizadores')
        .find({ 
          _id: { $in: clienteIdsComMarcacoes.map(id => {
            try { return new ObjectId(id); } catch { return null; }
          }).filter(id => id !== null) },
          tipo: 'cliente'
        })
        .project({ password: 0 })
        .toArray();

      // Combinar listas sem duplicatas
      const clientesMap = new Map();
      todosClientes.forEach(c => clientesMap.set(c._id.toString(), c));
      clientesComMarcacoes.forEach(c => clientesMap.set(c._id.toString(), c));
      
      const clientes = Array.from(clientesMap.values());

      // Adicionar estatísticas de cada cliente
      const clientesComStats = await Promise.all(
        clientes.map(async (cliente) => {
          const clienteMarcacoes = await db.collection('marcacoes')
            .find({ 
              cliente_id: cliente._id.toString(),
              barbearia_id: decoded.barbearia_id 
            })
            .toArray();

          const totalGasto = await Promise.all(
            clienteMarcacoes
              .filter(m => m.status === 'concluida')
              .map(async (m) => {
                const servico = await db.collection('servicos').findOne({ _id: new ObjectId(m.servico_id) });
                return servico ? servico.preco : 0;
              })
          );

          return {
            ...cliente,
            total_marcacoes: clienteMarcacoes.length,
            marcacoes_concluidas: clienteMarcacoes.filter(m => m.status === 'concluida').length,
            total_gasto: totalGasto.reduce((a, b) => a + b, 0),
            ultima_visita: clienteMarcacoes.length > 0 
              ? clienteMarcacoes.sort((a, b) => new Date(b.data) - new Date(a.data))[0].data
              : null
          };
        })
      );

      return NextResponse.json({ clientes: clientesComStats });
    }

    // GET Planos Cliente (para barbearia)
    if (path === 'planos-cliente') {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const planos = await db.collection('planos_cliente')
        .find({ barbearia_id: decoded.barbearia_id })
        .toArray();

      return NextResponse.json({ planos });
    }

    // ==================== MASTER BACKOFFICE ROUTES ====================
    
    // GET Master Dashboard Stats
    if (path === 'master/dashboard') {
      if (decoded.tipo !== 'super_admin') {
        return NextResponse.json({ error: 'Acesso negado. Apenas super_admin.' }, { status: 403 });
      }

      // Total de barbearias
      const totalBarbearias = await db.collection('barbearias').countDocuments();
      const barbeariasAtivas = await db.collection('barbearias').countDocuments({ ativa: { $ne: false } });
      const barbeariasInativas = await db.collection('barbearias').countDocuments({ ativa: false });

      // Total de utilizadores por tipo
      const totalUtilizadores = await db.collection('utilizadores').countDocuments();
      const totalAdmins = await db.collection('utilizadores').countDocuments({ tipo: 'admin' });
      const totalBarbeiros = await db.collection('utilizadores').countDocuments({ tipo: 'barbeiro' });
      const totalClientes = await db.collection('utilizadores').countDocuments({ tipo: 'cliente' });
      const totalOwners = await db.collection('utilizadores').countDocuments({ tipo: 'owner' });

      // Total de marcações
      const totalMarcacoes = await db.collection('marcacoes').countDocuments();
      const marcacoesPendentes = await db.collection('marcacoes').countDocuments({ status: 'pendente' });
      const marcacoesAceitas = await db.collection('marcacoes').countDocuments({ status: 'aceita' });
      const marcacoesConcluidas = await db.collection('marcacoes').countDocuments({ status: 'concluida' });
      const marcacoesCanceladas = await db.collection('marcacoes').countDocuments({ status: { $in: ['cancelada', 'rejeitada'] } });

      // Marcações dos últimos 7 dias
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      const marcacoesUltimos7Dias = await db.collection('marcacoes').countDocuments({
        criado_em: { $gte: seteDiasAtras }
      });

      // Novas barbearias nos últimos 30 dias
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
      const novasBarbearias30Dias = await db.collection('barbearias').countDocuments({
        criado_em: { $gte: trintaDiasAtras }
      });

      // Subscriptions por plano
      const subscriptionsPorPlano = await db.collection('subscriptions').aggregate([
        { $group: { _id: '$plano', count: { $sum: 1 } } }
      ]).toArray();

      // Receita total (simulada - baseada em subscriptions)
      const subscriptionsAtivas = await db.collection('subscriptions').countDocuments({ status: 'active' });

      return NextResponse.json({
        barbearias: {
          total: totalBarbearias,
          ativas: barbeariasAtivas,
          inativas: barbeariasInativas,
          novas30Dias: novasBarbearias30Dias
        },
        utilizadores: {
          total: totalUtilizadores,
          admins: totalAdmins,
          barbeiros: totalBarbeiros,
          clientes: totalClientes,
          owners: totalOwners
        },
        marcacoes: {
          total: totalMarcacoes,
          pendentes: marcacoesPendentes,
          aceitas: marcacoesAceitas,
          concluidas: marcacoesConcluidas,
          canceladas: marcacoesCanceladas,
          ultimos7Dias: marcacoesUltimos7Dias
        },
        subscriptions: {
          ativas: subscriptionsAtivas,
          porPlano: subscriptionsPorPlano
        }
      });
    }

    // GET Master Barbearias List
    if (path === 'master/barbearias') {
      if (decoded.tipo !== 'super_admin') {
        return NextResponse.json({ error: 'Acesso negado. Apenas super_admin.' }, { status: 403 });
      }

      const barbearias = await db.collection('barbearias')
        .find({})
        .sort({ criado_em: -1 })
        .toArray();

      // Enriquecer com dados adicionais
      const barbeariasComDados = await Promise.all(
        barbearias.map(async (b) => {
          const totalUtilizadores = await db.collection('utilizadores').countDocuments({ barbearia_id: b._id.toString() });
          const totalMarcacoes = await db.collection('marcacoes').countDocuments({ barbearia_id: b._id.toString() });
          const subscription = await db.collection('subscriptions').findOne({ barbearia_id: b._id.toString() });
          const owner = await db.collection('utilizadores').findOne({ 
            barbearia_id: b._id.toString(), 
            tipo: { $in: ['admin', 'owner'] } 
          }, { projection: { nome: 1, email: 1 } });

          return {
            ...b,
            totalUtilizadores,
            totalMarcacoes,
            subscription: subscription ? {
              plano: subscription.plano,
              status: subscription.status,
              data_fim: subscription.data_fim
            } : null,
            owner
          };
        })
      );

      return NextResponse.json({ barbearias: barbeariasComDados });
    }

    // GET Master Barbearia Details
    if (path.startsWith('master/barbearias/') && !path.includes('/toggle')) {
      if (decoded.tipo !== 'super_admin') {
        return NextResponse.json({ error: 'Acesso negado. Apenas super_admin.' }, { status: 403 });
      }

      const barbeariaId = path.split('/')[2];
      const barbearia = await db.collection('barbearias').findOne({ _id: new ObjectId(barbeariaId) });
      
      if (!barbearia) {
        return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 });
      }

      const utilizadores = await db.collection('utilizadores')
        .find({ barbearia_id: barbeariaId })
        .project({ password: 0 })
        .toArray();

      const marcacoes = await db.collection('marcacoes')
        .find({ barbearia_id: barbeariaId })
        .sort({ data: -1 })
        .limit(50)
        .toArray();

      const servicos = await db.collection('servicos')
        .find({ barbearia_id: barbeariaId })
        .toArray();

      const subscription = await db.collection('subscriptions')
        .findOne({ barbearia_id: barbeariaId });

      return NextResponse.json({
        barbearia,
        utilizadores,
        marcacoes,
        servicos,
        subscription
      });
    }

    // GET Master Recent Activity
    if (path === 'master/atividade') {
      if (decoded.tipo !== 'super_admin') {
        return NextResponse.json({ error: 'Acesso negado. Apenas super_admin.' }, { status: 403 });
      }

      // Últimas marcações
      const ultimasMarcacoes = await db.collection('marcacoes')
        .find({})
        .sort({ criado_em: -1 })
        .limit(20)
        .toArray();

      // Enriquecer com dados
      const marcacoesComDados = await Promise.all(
        ultimasMarcacoes.map(async (m) => {
          const barbearia = await db.collection('barbearias').findOne({ _id: new ObjectId(m.barbearia_id) });
          const cliente = await db.collection('utilizadores').findOne(
            { _id: new ObjectId(m.cliente_id) },
            { projection: { nome: 1, email: 1 } }
          );
          return {
            ...m,
            barbearia_nome: barbearia?.nome,
            cliente_nome: cliente?.nome
          };
        })
      );

      // Últimos registos
      const ultimosRegistos = await db.collection('utilizadores')
        .find({})
        .sort({ criado_em: -1 })
        .limit(10)
        .project({ password: 0 })
        .toArray();

      return NextResponse.json({
        ultimasMarcacoes: marcacoesComDados,
        ultimosRegistos
      });
    }

    // GET Marcações
    if (path === 'marcacoes') {
      let query = {};
      
      if (decoded.tipo === 'cliente') {
        query.cliente_id = decoded.userId;
      } else if (decoded.tipo === 'barbeiro') {
        query.barbeiro_id = decoded.userId;
      } else if (decoded.tipo === 'admin') {
        query.barbearia_id = decoded.barbearia_id;
      }

      const marcacoes = await db.collection('marcacoes')
        .find(query)
        .sort({ data: -1, hora: -1 })
        .toArray();

      const marcacoesComDetalhes = await Promise.all(
        marcacoes.map(async (m) => {
          const cliente = await db.collection('utilizadores').findOne(
            { _id: new ObjectId(m.cliente_id) },
            { projection: { password: 0 } }
          );
          const barbeiro = await db.collection('utilizadores').findOne(
            { _id: new ObjectId(m.barbeiro_id) },
            { projection: { nome: 1, foto: 1 } }
          );
          const servico = await db.collection('servicos').findOne(
            { _id: new ObjectId(m.servico_id) },
            { projection: { nome: 1, preco: 1, duracao: 1 } }
          );
          
          // Get local information if exists
          let local = null;
          if (m.local_id) {
            local = await db.collection('locais').findOne(
              { _id: new ObjectId(m.local_id) },
              { projection: { nome: 1, morada: 1 } }
            );
          }

          return {
            ...m,
            cliente,
            barbeiro,
            servico,
            local
          };
        })
      );

      return NextResponse.json({ marcacoes: marcacoesComDetalhes });
    }

    // GET Available Slots
    if (path === 'marcacoes/slots') {
      const barbeiro_id = searchParams.get('barbeiro_id');
      const data = searchParams.get('data');
      const servico_id = searchParams.get('servico_id');

      if (!barbeiro_id || !data || !servico_id) {
        return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
      }

      const servico = await db.collection('servicos').findOne({ _id: new ObjectId(servico_id) });
      if (!servico) {
        return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
      }

      const barbeiro = await db.collection('utilizadores').findOne({ _id: new ObjectId(barbeiro_id) });
      if (!barbeiro) {
        return NextResponse.json({ error: 'Barbeiro não encontrado' }, { status: 404 });
      }

      const dataObj = new Date(data);
      const diaSemanaNum = dataObj.getDay(); // 0 = Domingo, 6 = Sábado
      const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const diaSemana = diasSemana[diaSemanaNum];

      // Verificar se o barbeiro tem horário individual definido
      const horarioBarbeiro = barbeiro.horario_trabalho;
      let horaInicio, horaFim, horaAlmocoInicio, horaAlmocoFim;
      let trabalhaNestesDia = true;

      if (horarioBarbeiro && horarioBarbeiro.horario_semanal) {
        const horarioDia = horarioBarbeiro.horario_semanal[diaSemanaNum];
        
        if (!horarioDia || !horarioDia.ativo) {
          // Barbeiro não trabalha neste dia
          return NextResponse.json({ slots: [], message: 'Barbeiro não trabalha neste dia' });
        }

        horaInicio = horarioDia.inicio || '09:00';
        horaFim = horarioDia.fim || '19:00';
        horaAlmocoInicio = horarioBarbeiro.hora_almoco_inicio;
        horaAlmocoFim = horarioBarbeiro.hora_almoco_fim;

        // Verificar exceções para esta data específica
        if (horarioBarbeiro.excepcoes && horarioBarbeiro.excepcoes.length > 0) {
          const excecao = horarioBarbeiro.excepcoes.find(e => e.data === data);
          if (excecao) {
            if (excecao.tipo === 'folga') {
              return NextResponse.json({ slots: [], message: 'Barbeiro de folga neste dia' });
            } else if (excecao.tipo === 'parcial') {
              // Horário diferente para este dia
              horaInicio = excecao.inicio || horaInicio;
              horaFim = excecao.fim || horaFim;
            }
          }
        }
      } else {
        // Usar horário de funcionamento da barbearia como fallback
        const horarioFuncionamento = await db.collection('horarios_funcionamento').findOne({
          barbearia_id: barbeiro.barbearia_id,
          dia_semana: diaSemana,
          ativo: true
        });

        if (!horarioFuncionamento || !horarioFuncionamento.hora_inicio) {
          return NextResponse.json({ slots: [] });
        }

        horaInicio = horarioFuncionamento.hora_inicio;
        horaFim = horarioFuncionamento.hora_fim;
      }

      const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
      const [horaFimH, horaFimM] = horaFim.split(':').map(Number);
      const startMinutes = horaInicioH * 60 + horaInicioM;
      const endMinutes = horaFimH * 60 + horaFimM;

      let allSlots = generateTimeSlots(startMinutes, endMinutes, servico.duracao);

      // Remover slots durante o horário de almoço
      if (horaAlmocoInicio && horaAlmocoFim) {
        const [almocoInicioH, almocoInicioM] = horaAlmocoInicio.split(':').map(Number);
        const [almocoFimH, almocoFimM] = horaAlmocoFim.split(':').map(Number);
        const almocoInicioMin = almocoInicioH * 60 + almocoInicioM;
        const almocoFimMin = almocoFimH * 60 + almocoFimM;

        allSlots = allSlots.filter(slot => {
          const [slotH, slotM] = slot.split(':').map(Number);
          const slotMin = slotH * 60 + slotM;
          // Slot não pode começar durante o almoço
          return slotMin < almocoInicioMin || slotMin >= almocoFimMin;
        });
      }

      // Remover slots já ocupados por marcações
      const marcacoesExistentes = await db.collection('marcacoes')
        .find({
          barbeiro_id,
          data,
          status: { $nin: ['cancelada', 'rejeitada'] }
        })
        .toArray();

      const horasOcupadas = marcacoesExistentes.map(m => m.hora);
      const slotsDisponiveis = allSlots.filter(slot => !horasOcupadas.includes(slot));

      return NextResponse.json({ slots: slotsDisponiveis });
    }

    return NextResponse.json({ error: 'Rota não encontrada' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const path = params?.path ? params.path.join('/') : '';
    const body = await request.json();
    const client = await connectToDatabase();
    const db = client.db('barbearia_saas');

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // UPDATE Marcação Status
    if (path.startsWith('marcacoes/')) {
      const marcacaoId = path.split('/')[1];
      const { status, observacoes } = body;

      const validStatus = ['pendente', 'aceita', 'concluida', 'cancelada', 'rejeitada'];
      if (!validStatus.includes(status)) {
        return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
      }

      const updateData = { 
        status, 
        atualizado_em: new Date()
      };

      if (observacoes) {
        updateData.observacoes = observacoes;
      }

      // Registrar quem atualizou
      if (decoded.tipo === 'barbeiro') {
        updateData.atualizado_por = 'barbeiro';
      } else if (decoded.tipo === 'admin') {
        updateData.atualizado_por = 'admin';
      }

      const result = await db.collection('marcacoes').updateOne(
        { _id: new ObjectId(marcacaoId) },
        { $set: updateData }
      );

      console.log(`[MOCK EMAIL] Marcação ${status} - Cliente será notificado`);

      return NextResponse.json({ success: true, message: `Marcação ${status} com sucesso` });
    }

    // UPDATE Serviço
    if (path.startsWith('servicos/')) {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const servicoId = path.split('/')[1];
      const { nome, preco, duracao } = body;

      await db.collection('servicos').updateOne(
        { _id: new ObjectId(servicoId) },
        { $set: { nome, preco: parseFloat(preco), duracao: parseInt(duracao) } }
      );

      return NextResponse.json({ success: true });
    }

    // UPDATE Local (Filial)
    if (path.startsWith('locais/') && !path.includes('/horarios')) {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const localId = path.split('/')[1];
      const { nome, morada, telefone, email, horarios, ativo } = body;

      const updateData = {
        atualizado_em: new Date()
      };

      if (nome !== undefined) updateData.nome = nome;
      if (morada !== undefined) updateData.morada = morada;
      if (telefone !== undefined) updateData.telefone = telefone;
      if (email !== undefined) updateData.email = email;
      if (horarios !== undefined) updateData.horarios = horarios;
      if (ativo !== undefined) updateData.ativo = ativo;

      await db.collection('locais').updateOne(
        { _id: new ObjectId(localId), barbearia_id: decoded.barbearia_id },
        { $set: updateData }
      );

      const updatedLocal = await db.collection('locais').findOne({ _id: new ObjectId(localId) });

      return NextResponse.json({ local: updatedLocal, success: true });
    }

    // UPDATE Plano Cliente
    if (path.startsWith('planos-cliente/')) {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const planoId = path.split('/')[1];
      const { nome, preco, duracao, descricao } = body;

      await db.collection('planos_cliente').updateOne(
        { _id: new ObjectId(planoId) },
        { $set: { nome, preco: parseFloat(preco), duracao: parseInt(duracao), descricao } }
      );

      return NextResponse.json({ success: true });
    }

    // UPDATE Barbeiro
    if (path.startsWith('barbeiros/')) {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const barbeiroId = path.split('/')[1];
      const { nome, email, telemovel, biografia, especialidades, ativo, password } = body;

      const updateData = {
        nome,
        email,
        telemovel: telemovel || '',
        biografia: biografia || '',
        especialidades: especialidades || [],
        ativo: ativo !== undefined ? ativo : true,
        atualizado_em: new Date()
      };

      // Adicionar local_id se fornecido
      if (body.local_id !== undefined) {
        updateData.local_id = body.local_id;
      }

      // Se uma nova password foi fornecida, hash e atualizar
      if (password && password.length >= 6) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // Verificar se o email já existe em outro utilizador
      const existingUser = await db.collection('utilizadores').findOne({ 
        email, 
        _id: { $ne: new ObjectId(barbeiroId) } 
      });
      if (existingUser) {
        return NextResponse.json({ error: 'Email já registado por outro utilizador' }, { status: 400 });
      }

      await db.collection('utilizadores').updateOne(
        { _id: new ObjectId(barbeiroId) },
        { $set: updateData }
      );

      const updatedBarbeiro = await db.collection('utilizadores').findOne(
        { _id: new ObjectId(barbeiroId) },
        { projection: { password: 0 } }
      );

      return NextResponse.json({ barbeiro: updatedBarbeiro, success: true });
    }

    // UPDATE Barbeiro Profile (próprio barbeiro pode editar o seu perfil)
    if (path === 'barbeiro/perfil') {
      if (decoded.tipo !== 'barbeiro') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { nome, telemovel, biografia, especialidades, foto, password } = body;

      const updateData = {
        nome,
        telemovel: telemovel || '',
        biografia: biografia || '',
        especialidades: especialidades || [],
        foto: foto || null,
        atualizado_em: new Date()
      };

      // Se uma nova password foi fornecida, hash e atualizar
      if (password && password.length >= 6) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await db.collection('utilizadores').updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $set: updateData }
      );

      const updatedBarbeiro = await db.collection('utilizadores').findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { password: 0 } }
      );

      return NextResponse.json({ user: updatedBarbeiro, success: true });
    }

    // UPDATE Cliente Profile (próprio cliente pode editar o seu perfil)
    if (path === 'cliente/perfil') {
      if (decoded.tipo !== 'cliente') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { nome, telemovel, password } = body;

      const updateData = {
        nome,
        telemovel: telemovel || '',
        atualizado_em: new Date()
      };

      // Se uma nova password foi fornecida, hash e atualizar
      if (password && password.length >= 6) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await db.collection('utilizadores').updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $set: updateData }
      );

      const updatedCliente = await db.collection('utilizadores').findOne(
        { _id: new ObjectId(decoded.userId) },
        { projection: { password: 0 } }
      );

      return NextResponse.json({ user: updatedCliente, success: true });
    }

    // ==================== MASTER BACKOFFICE PUT ROUTES ====================

    // Toggle Barbearia Status (ativar/desativar)
    if (path.startsWith('master/barbearias/') && path.endsWith('/toggle')) {
      if (decoded.tipo !== 'super_admin') {
        return NextResponse.json({ error: 'Acesso negado. Apenas super_admin.' }, { status: 403 });
      }

      const barbeariaId = path.split('/')[2];
      const barbearia = await db.collection('barbearias').findOne({ _id: new ObjectId(barbeariaId) });
      
      if (!barbearia) {
        return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 });
      }

      const novoStatus = !barbearia.ativa;
      
      await db.collection('barbearias').updateOne(
        { _id: new ObjectId(barbeariaId) },
        { 
          $set: { 
            ativa: novoStatus,
            atualizado_em: new Date(),
            atualizado_por: 'super_admin'
          } 
        }
      );

      return NextResponse.json({ 
        success: true, 
        ativa: novoStatus,
        message: novoStatus ? 'Barbearia ativada com sucesso' : 'Barbearia desativada com sucesso'
      });
    }

    // Update Barbearia by Super Admin
    if (path.startsWith('master/barbearias/') && !path.endsWith('/toggle')) {
      if (decoded.tipo !== 'super_admin') {
        return NextResponse.json({ error: 'Acesso negado. Apenas super_admin.' }, { status: 403 });
      }

      const barbeariaId = path.split('/')[2];
      const { nome, descricao, ativa } = body;

      const updateData = {
        atualizado_em: new Date(),
        atualizado_por: 'super_admin'
      };

      if (nome !== undefined) updateData.nome = nome;
      if (descricao !== undefined) updateData.descricao = descricao;
      if (ativa !== undefined) updateData.ativa = ativa;

      await db.collection('barbearias').updateOne(
        { _id: new ObjectId(barbeariaId) },
        { $set: updateData }
      );

      const updatedBarbearia = await db.collection('barbearias').findOne({ _id: new ObjectId(barbeariaId) });

      return NextResponse.json({ barbearia: updatedBarbearia, success: true });
    }

    // PUT Suporte Ticket - Atualizar status ou responder
    if (path.startsWith('suporte/')) {
      const ticketId = path.split('/')[1];
      const { status, resposta } = body;

      // Apenas super_admin pode responder/atualizar tickets
      if (decoded.tipo !== 'super_admin') {
        return NextResponse.json({ error: 'Apenas administradores podem responder tickets' }, { status: 403 });
      }

      const updateData = {
        atualizado_em: new Date()
      };

      if (status) {
        updateData.status = status;
      }

      // Se tem resposta, adiciona ao array de respostas
      if (resposta) {
        const novaResposta = {
          texto: resposta,
          autor: 'Suporte',
          autor_id: decoded.userId,
          data: new Date()
        };

        await db.collection('suporte_tickets').updateOne(
          { _id: new ObjectId(ticketId) },
          { 
            $set: updateData,
            $push: { respostas: novaResposta }
          }
        );

        // Mock email notification
        const ticket = await db.collection('suporte_tickets').findOne({ _id: new ObjectId(ticketId) });
        console.log(`[MOCK EMAIL] Resposta ao ticket enviada para ${ticket?.user_email}`);
      } else {
        await db.collection('suporte_tickets').updateOne(
          { _id: new ObjectId(ticketId) },
          { $set: updateData }
        );
      }

      const updatedTicket = await db.collection('suporte_tickets').findOne({ _id: new ObjectId(ticketId) });
      return NextResponse.json({ ticket: updatedTicket, success: true });
    }

    return NextResponse.json({ error: 'Rota não encontrada' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const path = params?.path ? params.path.join('/') : '';
    const client = await connectToDatabase();
    const db = client.db('barbearia_saas');

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (decoded.tipo !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // DELETE Serviço
    if (path.startsWith('servicos/')) {
      const servicoId = path.split('/')[1];
      await db.collection('servicos').deleteOne({ _id: new ObjectId(servicoId) });
      return NextResponse.json({ success: true });
    }

    // DELETE Plano Cliente
    if (path.startsWith('planos-cliente/')) {
      const planoId = path.split('/')[1];
      await db.collection('planos_cliente').deleteOne({ _id: new ObjectId(planoId) });
      return NextResponse.json({ success: true });
    }

    // DELETE Barbeiro
    if (path.startsWith('barbeiros/')) {
      const barbeiroId = path.split('/')[1];
      await db.collection('utilizadores').deleteOne({ _id: new ObjectId(barbeiroId) });
      return NextResponse.json({ success: true });
    }

    // DELETE Local
    if (path.startsWith('locais/')) {
      const localId = path.split('/')[1];
      
      // Verificar se há barbeiros associados ao local
      const barbeirosNoLocal = await db.collection('utilizadores').countDocuments({
        barbearia_id: decoded.barbearia_id,
        tipo: 'barbeiro',
        local_id: localId
      });

      if (barbeirosNoLocal > 0) {
        return NextResponse.json({ 
          error: 'Não é possível eliminar este local pois existem barbeiros associados. Reatribua os barbeiros primeiro.',
          has_barbeiros: true
        }, { status: 400 });
      }

      // Verificar se há marcações futuras neste local
      const hoje = new Date().toISOString().split('T')[0];
      const marcacoesFuturas = await db.collection('marcacoes').countDocuments({
        barbearia_id: decoded.barbearia_id,
        local_id: localId,
        data: { $gte: hoje },
        status: { $in: ['pendente', 'aceita'] }
      });

      if (marcacoesFuturas > 0) {
        return NextResponse.json({ 
          error: 'Não é possível eliminar este local pois existem marcações futuras. Cancele ou conclua as marcações primeiro.',
          has_marcacoes: true
        }, { status: 400 });
      }

      // Desativar em vez de eliminar (soft delete)
      await db.collection('locais').updateOne(
        { _id: new ObjectId(localId), barbearia_id: decoded.barbearia_id },
        { $set: { ativo: false, desativado_em: new Date() } }
      );

      return NextResponse.json({ success: true, message: 'Local desativado com sucesso' });
    }

    return NextResponse.json({ error: 'Rota não encontrada' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}