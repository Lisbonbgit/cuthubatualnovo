import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { EmailService } from '@/lib/email-service';

const MONGO_URL = process.env.MONGO_URL;
const CRON_SECRET = process.env.CRON_SECRET || 'cron-secret-key';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const client = await MongoClient.connect(MONGO_URL);
  cachedClient = client;
  return client;
}

export async function GET(request) {
  try {
    // Verificar secret do cron (segurança básica)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    const now = new Date();
    let emailsSent = {
      reminders24h: 0,
      reminders60min: 0,
      errors: []
    };

    // 1. LEMBRETES DE 24 HORAS
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const marcacoes24h = await db.collection('marcacoes')
      .find({
        data: tomorrowDate,
        status: { $in: ['aceita', 'pendente'] },
        lembrete_24h_enviado: { $ne: true }
      })
      .toArray();

    for (const marcacao of marcacoes24h) {
      try {
        const cliente = await db.collection('utilizadores').findOne({ _id: new ObjectId(marcacao.cliente_id) });
        const servico = await db.collection('servicos').findOne({ _id: new ObjectId(marcacao.servico_id) });
        const barbearia = await db.collection('barbearias').findOne({ _id: new ObjectId(marcacao.barbearia_id) });
        const profissional = marcacao.barbeiro_id 
          ? await db.collection('utilizadores').findOne({ _id: new ObjectId(marcacao.barbeiro_id) })
          : null;

        if (cliente?.email) {
          await EmailService.sendBookingReminder24h(cliente.email, {
            clienteName: cliente.nome,
            data: marcacao.data,
            hora: marcacao.hora,
            servicoName: servico?.nome || 'Serviço',
            profissionalName: profissional?.nome || null,
            barbeariaName: barbearia?.nome || 'CutHub'
          });

          // Marcar como enviado
          await db.collection('marcacoes').updateOne(
            { _id: marcacao._id },
            { $set: { lembrete_24h_enviado: true, lembrete_24h_enviado_em: new Date() } }
          );

          emailsSent.reminders24h++;
        }
      } catch (error) {
        console.error('[CRON] Error sending 24h reminder:', error);
        emailsSent.errors.push({ type: '24h', marcacao_id: marcacao._id.toString(), error: error.message });
      }
    }

    // 2. LEMBRETES DE 60 MINUTOS
    const in60min = new Date(now.getTime() + 60 * 60 * 1000);
    const in60minDate = in60min.toISOString().split('T')[0];
    const in60minHour = `${String(in60min.getHours()).padStart(2, '0')}:${String(in60min.getMinutes()).padStart(2, '0')}`;

    const marcacoes60min = await db.collection('marcacoes')
      .find({
        data: in60minDate,
        hora: { $gte: in60minHour, $lte: `${String(in60min.getHours()).padStart(2, '0')}:59` },
        status: { $in: ['aceita', 'pendente'] },
        lembrete_60min_enviado: { $ne: true }
      })
      .toArray();

    for (const marcacao of marcacoes60min) {
      try {
        const cliente = await db.collection('utilizadores').findOne({ _id: new ObjectId(marcacao.cliente_id) });
        const servico = await db.collection('servicos').findOne({ _id: new ObjectId(marcacao.servico_id) });
        const barbearia = await db.collection('barbearias').findOne({ _id: new ObjectId(marcacao.barbearia_id) });
        const local = marcacao.local_id 
          ? await db.collection('locais').findOne({ _id: new ObjectId(marcacao.local_id) })
          : null;
        const profissional = marcacao.barbeiro_id 
          ? await db.collection('utilizadores').findOne({ _id: new ObjectId(marcacao.barbeiro_id) })
          : null;

        if (cliente?.email) {
          await EmailService.sendBookingReminder60min(cliente.email, {
            clienteName: cliente.nome,
            data: marcacao.data,
            hora: marcacao.hora,
            servicoName: servico?.nome || 'Serviço',
            profissionalName: profissional?.nome || null,
            barbeariaName: barbearia?.nome || 'CutHub',
            localMorada: local?.morada || null
          });

          // Marcar como enviado
          await db.collection('marcacoes').updateOne(
            { _id: marcacao._id },
            { $set: { lembrete_60min_enviado: true, lembrete_60min_enviado_em: new Date() } }
          );

          emailsSent.reminders60min++;
        }
      } catch (error) {
        console.error('[CRON] Error sending 60min reminder:', error);
        emailsSent.errors.push({ type: '60min', marcacao_id: marcacao._id.toString(), error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      emailsSent,
      message: `Enviados ${emailsSent.reminders24h} lembretes de 24h e ${emailsSent.reminders60min} lembretes de 60min`
    });

  } catch (error) {
    console.error('[CRON] Error in send-reminders:', error);
    return NextResponse.json({ 
      error: 'Erro ao enviar lembretes',
      details: error.message 
    }, { status: 500 });
  }
}
