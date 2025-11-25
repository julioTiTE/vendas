// src/app/api/alertas/gerar/route.ts
import { NextResponse } from 'next/server';
import { geradorAlertas } from '@/lib/gerador-alertas';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log('🔄 Iniciando geração de alertas...');
    
    // 🗑️ LIMPA TODOS OS ALERTAS DE ANIVERSÁRIO PENDENTES
    const deletados = await prisma.alerta.deleteMany({
      where: {
        tipo: 'ANIVERSARIO',
        status: 'PENDENTE'
      }
    });
    console.log(`🗑️  ${deletados.count} alertas de aniversário antigos removidos`);
    
    await geradorAlertas.gerarTodosAlertas();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Alertas gerados com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao gerar alertas:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar alertas' },
      { status: 500 }
    );
  }
}