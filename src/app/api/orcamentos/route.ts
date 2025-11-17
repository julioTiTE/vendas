import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar todos os orçamentos/pedidos
export async function GET() {
  try {
    const pedidos = await prisma.pedido.findMany({
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
        itens: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        dataPedido: 'desc',
      },
    })

    const pedidosFormatados = pedidos.map(pedido => {
      // CORREÇÃO: converter status corretamente
      let status: 'open' | 'closed' | 'cancelled' = 'open'
      
      if (pedido.status === 'FECHADO') {
        status = 'closed'
      } else if (pedido.status === 'CANCELADO') {
        status = 'cancelled'
      } else if (pedido.status === 'ABERTO') {
        status = 'open'
      }

      return {
        id: pedido.id,
        clientName: pedido.cliente.nome,
        sellerName: pedido.vendedor.nome,
        total: Number(pedido.valorTotal),
        status: status,
        createdAt: pedido.dataPedido.toISOString(),
        productsCount: pedido.itens.length,
      }
    })

    return NextResponse.json(pedidosFormatados)
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar pedidos' },
      { status: 500 }
    )
  }
}

// POST - Criar novo orçamento/pedido
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { clienteId, vendedorId, itens, observacoes } = body

    // Validações
    if (!clienteId || !vendedorId || !itens || itens.length === 0) {
      return NextResponse.json(
        { error: 'Cliente, vendedor e pelo menos um produto são obrigatórios' },
        { status: 400 }
      )
    }

    // Calcular valor total
    let valorTotal = 0
    const itensFormatados = []

    for (const item of itens) {
      const produto = await prisma.produto.findUnique({
        where: { id: item.produtoId },
      })

      if (!produto) {
        return NextResponse.json(
          { error: `Produto ${item.produtoId} não encontrado` },
          { status: 404 }
        )
      }

      const subtotal = Number(produto.preco) * item.quantidade
      valorTotal += subtotal

      itensFormatados.push({
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        precoUnitario: Number(produto.preco),
        subtotal,
      })
    }

    // Criar pedido com itens
    const pedido = await prisma.pedido.create({
      data: {
        clienteId,
        vendedorId,
        valorTotal,
        status: 'ABERTO', // SEMPRE criar como ABERTO
        observacoes: observacoes || null,
        itens: {
          create: itensFormatados,
        },
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
        itens: {
          include: {
            produto: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      id: pedido.id,
      clientName: pedido.cliente.nome,
      sellerName: pedido.vendedor.nome,
      total: Number(pedido.valorTotal),
      status: 'open', // Retornar como 'open'
      createdAt: pedido.dataPedido.toISOString(),
      productsCount: pedido.itens.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar pedido:', error)
    return NextResponse.json(
      { error: 'Erro ao criar pedido' },
      { status: 500 }
    )
  }
}