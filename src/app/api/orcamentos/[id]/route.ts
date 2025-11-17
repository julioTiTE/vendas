import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: true,
        vendedor: {
          select: {
            id: true,
            nome: true,
          },
        },
        itens: {
          include: {
            produto: true,
          },
        },
      },
    })

    if (!pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(pedido)
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar pedido' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { status, observacoes } = body

    // CORREÇÃO: converter status do frontend para o formato do banco
    let statusDB: 'ABERTO' | 'FECHADO' | 'CANCELADO' | undefined = undefined
    
    if (status) {
      const statusLower = status.toLowerCase()
      if (statusLower === 'open' || statusLower === 'aberto') {
        statusDB = 'ABERTO'
      } else if (statusLower === 'closed' || statusLower === 'fechado') {
        statusDB = 'FECHADO'
      } else if (statusLower === 'cancelled' || statusLower === 'cancelado') {
        statusDB = 'CANCELADO'
      }
    }

    // Atualizar pedido
    const pedidoAtualizado = await prisma.pedido.update({
      where: { id },
      data: {
        status: statusDB,
        observacoes: observacoes !== undefined ? observacoes : undefined,
      },
      include: {
        cliente: {
          select: {
            nome: true,
          },
        },
        vendedor: {
          select: {
            nome: true,
          },
        },
        itens: true,
      },
    })

    // Se o pedido foi fechado, atualizar a data de última compra do cliente
    if (statusDB === 'FECHADO') {
      await prisma.cliente.update({
        where: { id: pedidoAtualizado.clienteId },
        data: { ultimaCompraData: new Date() },
      })
    }

    // Converter status de volta para o formato do frontend
    let statusFrontend: 'open' | 'closed' | 'cancelled' = 'open'
    if (pedidoAtualizado.status === 'FECHADO') {
      statusFrontend = 'closed'
    } else if (pedidoAtualizado.status === 'CANCELADO') {
      statusFrontend = 'cancelled'
    }

    return NextResponse.json({
      id: pedidoAtualizado.id,
      clientName: pedidoAtualizado.cliente.nome,
      sellerName: pedidoAtualizado.vendedor.nome,
      total: Number(pedidoAtualizado.valorTotal),
      status: statusFrontend,
      createdAt: pedidoAtualizado.dataPedido.toISOString(),
      productsCount: pedidoAtualizado.itens.length,
    })
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar pedido' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Cancelar pedido ao invés de deletar
    await prisma.pedido.update({
      where: { id },
      data: { status: 'CANCELADO' },
    })

    return NextResponse.json({ message: 'Pedido cancelado com sucesso' })
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao cancelar pedido' },
      { status: 500 }
    )
  }
}