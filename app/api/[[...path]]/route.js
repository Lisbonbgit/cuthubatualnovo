import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey-change-in-production';
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
    const db = client.db('barbearia_saas');

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
            status: 'active'
          });

          if (!subscription) {
            return NextResponse.json({ 
              error: 'Precisa de uma assinatura ativa para criar uma barbearia',
              requires_subscription: true 
            }, { status: 403 });
          }

          // Verificar limite de barbearias do plano
          const existingBarbearias = await db.collection('barbearias')
            .countDocuments({ owner_id: userId });

          const planLimits = {
            'basic': 1,
            'pro': 1,
            'enterprise': 3
          };

          if (existingBarbearias >= (planLimits[subscription.plan_id] || 1)) {
            return NextResponse.json({ 
              error: 'Limite de barbearias do seu plano atingido' 
            }, { status: 403 });
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
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { email, password, nome, telemovel, biografia, especialidades } = body;
      
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
        ativo: true,
        criado_em: new Date()
      };

      const result = await db.collection('utilizadores').insertOne(barbeiro);
      return NextResponse.json({ barbeiro: { ...barbeiro, _id: result.insertedId, password: undefined } });
    }

    // SERVIÇOS - Create
    if (path === 'servicos') {
      if (decoded.tipo !== 'admin') {
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
      if (decoded.tipo !== 'admin') {
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

    // MARCAÇÕES - Create
    if (path === 'marcacoes') {
      const { barbeiro_id, servico_id, data, hora } = body;

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
        data,
        hora,
        status: 'pendente', // Agora começa como pendente
        criado_em: new Date(),
        atualizado_em: new Date()
      };

      const result = await db.collection('marcacoes').insertOne(marcacao);

      // Mock email notification
      console.log(`[MOCK EMAIL] Nova marcação pendente para aprovação em ${data} às ${hora}`);

      return NextResponse.json({ marcacao: { ...marcacao, _id: result.insertedId } });
    }

    // HORÁRIOS - Update
    if (path === 'horarios') {
      if (decoded.tipo !== 'admin') {
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
        enterprise: { name: 'Enterprise', price: 99, barbearias_limit: 3, barbeiros_limit: 999 }
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

    // BARBEARIA - Update Settings
    if (path === 'barbearia/settings') {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { nome, descricao, telefone, email_contacto } = body;

      await db.collection('barbearias').updateOne(
        { _id: new ObjectId(decoded.barbearia_id) },
        { 
          $set: { 
            nome,
            descricao: descricao || '',
            telefone: telefone || '',
            email_contacto: email_contacto || '',
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
    const db = client.db('barbearia_saas');

    // Public routes
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

      const planos = await db.collection('planos')
        .find({ barbearia_id: barbearia._id.toString() })
        .toArray();

      const barbeiros = await db.collection('utilizadores')
        .find({ barbearia_id: barbearia._id.toString(), tipo: 'barbeiro' })
        .project({ password: 0 })
        .toArray();

      return NextResponse.json({
        barbearia,
        servicos,
        produtos,
        planos,
        barbeiros
      });
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
      return NextResponse.json({ barbeiros });
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

    // GET Horários
    if (path === 'horarios') {
      const horarios = await db.collection('horarios_funcionamento')
        .find({ barbearia_id: decoded.barbearia_id })
        .toArray();
      return NextResponse.json({ horarios });
    }

    // GET Subscription Status
    if (path === 'subscriptions/status') {
      const subscription = await db.collection('subscriptions').findOne({
        user_id: decoded.userId
      }, { sort: { created_at: -1 } });

      if (!subscription) {
        return NextResponse.json({ 
          has_subscription: false,
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
        subscription: {
          ...subscription,
          trial_ended: trialEnded,
          days_until_trial_end: daysUntilTrial > 0 ? daysUntilTrial : 0,
          is_trial: subscription.status === 'active' && !trialEnded
        }
      });
    }

    // GET Available Plans
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
            '1 barbearia',
            'Até 5 barbeiros',
            'Marcações ilimitadas',
            'Suporte prioritário',
            'Relatórios avançados'
          ],
          limits: {
            barbearias: 1,
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
            'Até 3 barbearias',
            'Barbeiros ilimitados',
            'Marcações ilimitadas',
            'Suporte 24/7',
            'API access',
            'White-label'
          ],
          limits: {
            barbearias: 3,
            barbeiros: 999
          }
        }
      ];

      return NextResponse.json({ plans });
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

      // Get subscription if owner_id exists
      let subscription = null;
      if (barbearia.owner_id) {
        subscription = await db.collection('subscriptions').findOne({
          user_id: barbearia.owner_id
        }, { sort: { created_at: -1 } });
      }

      return NextResponse.json({ 
        barbearia,
        subscription 
      });
    }

    // GET Clientes (CRM)
    if (path === 'clientes') {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      // Buscar todos os clientes que já fizeram marcações nesta barbearia
      const marcacoes = await db.collection('marcacoes')
        .find({ barbearia_id: decoded.barbearia_id })
        .toArray();

      const clienteIds = [...new Set(marcacoes.map(m => m.cliente_id))];

      const clientes = await db.collection('utilizadores')
        .find({ 
          _id: { $in: clienteIds.map(id => new ObjectId(id)) }
        })
        .project({ password: 0 })
        .toArray();

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
            { projection: { nome: 1, email: 1 } }
          );
          const barbeiro = await db.collection('utilizadores').findOne(
            { _id: new ObjectId(m.barbeiro_id) },
            { projection: { nome: 1 } }
          );
          const servico = await db.collection('servicos').findOne(
            { _id: new ObjectId(m.servico_id) },
            { projection: { nome: 1, preco: 1, duracao: 1 } }
          );

          return {
            ...m,
            cliente,
            barbeiro,
            servico
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
      const diasSemana = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const diaSemana = diasSemana[dataObj.getDay()];

      const horarioFuncionamento = await db.collection('horarios_funcionamento').findOne({
        barbearia_id: barbeiro.barbearia_id,
        dia_semana: diaSemana,
        ativo: true
      });

      if (!horarioFuncionamento || !horarioFuncionamento.hora_inicio) {
        return NextResponse.json({ slots: [] });
      }

      const [horaInicio, minInicio] = horarioFuncionamento.hora_inicio.split(':').map(Number);
      const [horaFim, minFim] = horarioFuncionamento.hora_fim.split(':').map(Number);
      const startMinutes = horaInicio * 60 + minInicio;
      const endMinutes = horaFim * 60 + minFim;

      const allSlots = generateTimeSlots(startMinutes, endMinutes, servico.duracao);

      const marcacoesExistentes = await db.collection('marcacoes')
        .find({
          barbeiro_id,
          data,
          status: { $ne: 'cancelada' }
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

    return NextResponse.json({ error: 'Rota não encontrada' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}