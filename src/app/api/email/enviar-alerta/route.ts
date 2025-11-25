// src/app/api/email/enviar-alerta/route.ts
import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { alertaId } = await request.json();

    // Busca o alerta completo
    const alerta = await prisma.alerta.findUnique({
      where: { id: alertaId },
      include: {
        cliente: {
          include: {
            vendedor: true
          }
        }
      }
    });

    if (!alerta) {
      return NextResponse.json(
        { error: 'Alerta não encontrado' },
        { status: 404 }
      );
    }

    if (!alerta.cliente.email) {
      return NextResponse.json(
        { error: 'Cliente não possui email cadastrado' },
        { status: 400 }
      );
    }

    let result;

    // Envia email baseado no tipo de alerta
    switch (alerta.tipo) {
      case 'ANIVERSARIO':
        result = await emailService.enviarAniversario(
          alerta.cliente.nome,
          alerta.cliente.email
        );
        break;

      case 'CLIENTE_INATIVO':
        // Calcula dias de inatividade
        const diasInativo = alerta.cliente.ultimaCompraData 
          ? Math.floor((Date.now() - alerta.cliente.ultimaCompraData.getTime()) / (1000 * 60 * 60 * 24))
          : 90;
        
        result = await emailService.enviarClienteInativo(
          alerta.cliente.nome,
          alerta.cliente.email,
          diasInativo
        );
        break;

      case 'ORCAMENTO_ABERTO':
        // Busca o último orçamento aberto do cliente
        const orcamento = await prisma.pedido.findFirst({
          where: {
            clienteId: alerta.clienteId,
            status: 'ABERTO'
          },
          orderBy: {
            dataPedido: 'desc'
          }
        });

        if (!orcamento) {
          return NextResponse.json(
            { error: 'Orçamento não encontrado' },
            { status: 404 }
          );
        }

        const diasAberto = Math.floor(
          (Date.now() - orcamento.dataPedido.getTime()) / (1000 * 60 * 60 * 24)
        );

        result = await emailService.enviarFollowUpOrcamento(
          alerta.cliente.nome,
          alerta.cliente.email,
          Number(orcamento.valorTotal),
          diasAberto
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de alerta não suportado' },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: 'Erro ao enviar email' },
        { status: 500 }
      );
    }

    // Marca o alerta como resolvido
    await prisma.alerta.update({
      where: { id: alertaId },
      data: { status: 'RESOLVIDO' }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email enviado com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar email' },
      { status: 500 }
    );
  }
}