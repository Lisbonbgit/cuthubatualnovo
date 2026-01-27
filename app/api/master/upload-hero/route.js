import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
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

export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.tipo !== 'super_admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json({ error: 'Nenhuma imagem enviada' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Formato inválido. Use JPG, PNG ou WebP' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB for hero images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Imagem muito grande. Máximo 10MB' 
      }, { status: 400 });
    }

    // Connect to database
    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    // Get current settings to delete old image
    const currentSettings = await db.collection('saas_settings').findOne({ type: 'global' });
    
    if (currentSettings && currentSettings.hero_image) {
      try {
        const oldPath = join(process.cwd(), 'public', currentSettings.hero_image);
        await unlink(oldPath);
      } catch (error) {
        console.log('Old hero image not found or already deleted');
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `hero-${timestamp}.${extension}`;
    const filepath = `/uploads/saas/${filename}`;
    const fullPath = join(process.cwd(), 'public', filepath);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(fullPath, buffer);

    // Update or create SaaS settings
    await db.collection('saas_settings').updateOne(
      { type: 'global' },
      { 
        $set: { 
          hero_image: filepath,
          updated_at: new Date()
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ 
      success: true,
      hero_image: filepath,
      message: 'Imagem de capa carregada com sucesso'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Erro ao fazer upload da imagem' 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.tipo !== 'super_admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Connect to database
    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    // Get current settings
    const currentSettings = await db.collection('saas_settings').findOne({ type: 'global' });
    
    if (currentSettings && currentSettings.hero_image) {
      try {
        const fullPath = join(process.cwd(), 'public', currentSettings.hero_image);
        await unlink(fullPath);
      } catch (error) {
        console.log('Hero image file not found');
      }
    }

    // Remove hero image from settings
    await db.collection('saas_settings').updateOne(
      { type: 'global' },
      { 
        $unset: { hero_image: '' },
        $set: { updated_at: new Date() }
      }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Imagem de capa removida com sucesso'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ 
      error: 'Erro ao remover imagem' 
    }, { status: 500 });
  }
}
