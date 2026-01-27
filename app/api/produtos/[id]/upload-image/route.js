import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
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

export async function POST(request, { params }) {
  try {
    const { id } = params;
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Only admin and owner can upload product images
    if (decoded.tipo !== 'admin' && decoded.tipo !== 'owner') {
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

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Imagem muito grande. Máximo 5MB' 
      }, { status: 400 });
    }

    // Connect to database
    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    // Verify product exists and belongs to this barbearia
    const produto = await db.collection('produtos').findOne({
      _id: new ObjectId(id),
      barbearia_id: decoded.barbearia_id
    });

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Delete old image if exists
    if (produto.imagem) {
      try {
        const oldPath = join(process.cwd(), 'public', produto.imagem);
        await unlink(oldPath);
      } catch (error) {
        console.log('Old image not found or already deleted');
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${id}-${timestamp}.${extension}`;
    const filepath = `/uploads/produtos/${filename}`;
    const fullPath = join(process.cwd(), 'public', filepath);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(fullPath, buffer);

    // Update product with image path
    await db.collection('produtos').updateOne(
      { _id: new ObjectId(id) },
      { $set: { imagem: filepath } }
    );

    return NextResponse.json({ 
      success: true,
      imagem: filepath,
      message: 'Imagem carregada com sucesso'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Erro ao fazer upload da imagem' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Only admin and owner can delete product images
    if (decoded.tipo !== 'admin' && decoded.tipo !== 'owner') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Connect to database
    const client = await connectToDatabase();
    const db = client.db(process.env.DB_NAME || 'barbearia_saas');

    // Get product
    const produto = await db.collection('produtos').findOne({
      _id: new ObjectId(id),
      barbearia_id: decoded.barbearia_id
    });

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Delete image file if exists
    if (produto.imagem) {
      try {
        const fullPath = join(process.cwd(), 'public', produto.imagem);
        await unlink(fullPath);
      } catch (error) {
        console.log('Image file not found or already deleted');
      }
    }

    // Remove image from database
    await db.collection('produtos').updateOne(
      { _id: new ObjectId(id) },
      { $unset: { imagem: '' } }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Imagem removida com sucesso'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ 
      error: 'Erro ao remover imagem' 
    }, { status: 500 });
  }
}
