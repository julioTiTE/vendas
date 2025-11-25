// src/app/api/email/enviar-personalizado/route.ts
import { NextResponse } from 'next/server';
import { emailService } from '@/lib/email-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { alertaId, mensagem, assunto } = await request.json();

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

    // Converte a mensagem de texto para HTML (mantendo quebras de linha)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              padding: 20px;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 10px; 
            }
            .content {
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">${mensagem}</div>
            <div class="footer">
              Enviado por: ${alerta.cliente.vendedor.nome}<br>
              Sistema de Vendas - ${new Date().toLocaleString('pt-BR')}
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await emailService.enviarEmail({
      to: alerta.cliente.email,
      subject: assunto || `Mensagem de ${alerta.cliente.vendedor.nome}`,
      html
    });

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
      message: 'Email personalizado enviado com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar email' },
      { status: 500 }
    );
  }
}