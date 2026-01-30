import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.tipo !== 'owner') {
      return NextResponse.json(
        { error: 'Apenas owners podem criar barbearias' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nome, descricao, email, palavra_passe } = body;

    if (!nome || !email || !palavra_passe) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar se já existe barbearia para este owner
      const [existing] = await connection.query(
        'SELECT id FROM barbearias WHERE owner_id = ?',
        [decoded.userId]
      );

      if (existing.length > 0) {
        await connection.rollback();
        return NextResponse.json({
          success: true,
          message: 'Barbearia já existe',
          barbearia_id: existing[0].id
        });
      }

      // Criar nova barbearia
      const [result] = await connection.query(
        `INSERT INTO barbearias 
         (nome, descricao, email, palavra_passe, owner_id, ativo, criado_em) 
         VALUES (?, ?, ?, ?, ?, 1, NOW())`,
        [nome, descricao || null, email, palavra_passe, decoded.userId]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Barbearia criada com sucesso',
        barbearia_id: result.insertId
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Erro ao criar barbearia:', error);
    return NextResponse.json(
      { error: 'Erro ao criar barbearia', details: error.message },
      { status: 500 }
    );
  }
}
