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
      
      // Verificar se usuário tem subscription ativa
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        
        if (decoded) {
          // Verificar subscription
          const subscription = await db.collection('subscriptions').findOne({
            user_id: decoded.userId,
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
            .countDocuments({ owner_id: decoded.userId });

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
        owner_id: decoded ? decoded.userId : null,
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

      const { email, password, nome } = body;
      
      const existingUser = await db.collection('utilizadores').findOne({ email });
      if (existingUser) {
        return NextResponse.json({ error: 'Email já registado' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const barbeiro = {
        email,
        password: hashedPassword,
        nome,
        tipo: 'barbeiro',
        barbearia_id: decoded.barbearia_id,
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

    // PLANOS - Create
    if (path === 'planos') {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const { nome, preco_mensal, beneficios } = body;
      const plano = {
        nome,
        preco_mensal: parseFloat(preco_mensal),
        beneficios: beneficios || [],
        barbearia_id: decoded.barbearia_id,
        criado_em: new Date()
      };

      const result = await db.collection('planos').insertOne(plano);
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
        status: { $ne: 'cancelada' }
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
        status: 'confirmada',
        criado_em: new Date()
      };

      const result = await db.collection('marcacoes').insertOne(marcacao);

      // Mock email notification
      console.log(`[MOCK EMAIL] Marcação confirmada para ${decoded.email} em ${data} às ${hora}`);

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

    // GET Planos
    if (path === 'planos') {
      const barbeariaId = searchParams.get('barbearia_id') || decoded.barbearia_id;
      const planos = await db.collection('planos')
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
      const { status } = body;

      const result = await db.collection('marcacoes').updateOne(
        { _id: new ObjectId(marcacaoId) },
        { $set: { status, atualizado_em: new Date() } }
      );

      return NextResponse.json({ success: true });
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

    // UPDATE Produto
    if (path.startsWith('produtos/')) {
      if (decoded.tipo !== 'admin') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }

      const produtoId = path.split('/')[1];
      const { nome, preco, descricao, imagem } = body;

      await db.collection('produtos').updateOne(
        { _id: new ObjectId(produtoId) },
        { $set: { nome, preco: parseFloat(preco), descricao, imagem } }
      );

      return NextResponse.json({ success: true });
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

    // DELETE Produto
    if (path.startsWith('produtos/')) {
      const produtoId = path.split('/')[1];
      await db.collection('produtos').deleteOne({ _id: new ObjectId(produtoId) });
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