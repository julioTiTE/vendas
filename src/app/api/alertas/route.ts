// src/app/api/alertas/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendedorId = searchParams.get('vendedorId');
    const status = searchParams.get('status') || 'PENDENTE';

    const whereCondition: any = {
      status: status as 'PENDENTE' | 'RESOLVIDO'
    };

    // Se passar vendedorId, filtra pelos clientes desse vendedor
    if (vendedorId) {
      whereCondition.cliente = {
        vendedorId: vendedorId
      };
    }

    const alertas = await prisma.alerta.findMany({
      where: whereCondition,
      include: {
        cliente: {
          include: {
            vendedor: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      },
      orderBy: [
        { urgencia: 'desc' }, // ALTA primeiro
        { dataCriacao: 'desc' }
      ]
    });

    // Agrupa por tipo
    const porTipo = {
      ANIVERSARIO: alertas.filter(a => a.tipo === 'ANIVERSARIO'),
      CLIENTE_INATIVO: alertas.filter(a => a.tipo === 'CLIENTE_INATIVO'),
      ORCAMENTO_ABERTO: alertas.filter(a => a.tipo === 'ORCAMENTO_ABERTO'),
      FOLLOWUP: alertas.filter(a => a.tipo === 'FOLLOWUP')
    };

    return NextResponse.json({
      alertas,
      total: alertas.length,
      porTipo: {
        aniversarios: porTipo.ANIVERSARIO.length,
        inativos: porTipo.CLIENTE_INATIVO.length,
        orcamentos: porTipo.ORCAMENTO_ABERTO.length,
        followups: porTipo.FOLLOWUP.length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar alertas' },
      { status: 500 }
    );
  }
}

// Marcar alerta como resolvido
export async function PATCH(request: Request) {
  try {
    const { alertaId } = await request.json();

    const alerta = await prisma.alerta.update({
      where: { id: alertaId },
      data: { status: 'RESOLVIDO' }
    });

    return NextResponse.json({ success: true, alerta });
  } catch (error) {
    console.error('Erro ao resolver alerta:', error);
    return NextResponse.json(
      { error: 'Erro ao resolver alerta' },
      { status: 500 }
    );
  }
}