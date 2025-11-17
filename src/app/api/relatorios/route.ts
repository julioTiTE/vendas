import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    
    // Calcular datas para os períodos
    const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const days60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const days90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const days14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // 1. Clientes inativos (sem compra há X dias)
    const allClients = await prisma.cliente.findMany({
      select: {
        id: true,
        ultimaCompraData: true,
      },
    })

    const inactive30 = allClients.filter(
      c => !c.ultimaCompraData || c.ultimaCompraData < days30
    ).length

    const inactive60 = allClients.filter(
      c => !c.ultimaCompraData || c.ultimaCompraData < days60
    ).length

    const inactive90 = allClients.filter(
      c => !c.ultimaCompraData || c.ultimaCompraData < days90
    ).length

    // 2. Orçamentos abertos há mais de X dias
    const openQuotes7 = await prisma.pedido.count({
      where: {
        status: 'ABERTO',
        dataPedido: {
          lt: days7,
        },
      },
    })

    const openQuotes14 = await prisma.pedido.count({
      where: {
        status: 'ABERTO',
        dataPedido: {
          lt: days14,
        },
      },
    })

    const openQuotes30 = await prisma.pedido.count({
      where: {
        status: 'ABERTO',
        dataPedido: {
          lt: days30,
        },
      },
    })

    // 3. Performance por vendedor (apenas pedidos FECHADOS)
    const sellerPerformance = await prisma.pedido.groupBy({
      by: ['vendedorId'],
      where: {
        status: 'FECHADO',
      },
      _sum: {
        valorTotal: true,
      },
      _count: {
        id: true,
      },
    })

    // Buscar nomes dos vendedores
    const sellersWithDetails = await Promise.all(
      sellerPerformance.map(async (seller) => {
        const vendedor = await prisma.vendedor.findUnique({
          where: { id: seller.vendedorId },
          select: { nome: true },
        })

        return {
          name: vendedor?.nome || 'Vendedor Desconhecido',
          total: Number(seller._sum.valorTotal || 0),
          count: seller._count.id,
        }
      })
    )

    // Ordenar por total vendido (maior para menor)
    sellersWithDetails.sort((a, b) => b.total - a.total)

    // 4. Lista de clientes inativos (com detalhes)
    const inactiveClientsDetails = await prisma.cliente.findMany({
      where: {
        OR: [
          { ultimaCompraData: { lt: days30 } },
          { ultimaCompraData: null },
        ],
      },
      include: {
        vendedor: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        ultimaCompraData: 'asc',
      },
    })

    const inactiveClients = inactiveClientsDetails.map(client => ({
      id: client.id,
      name: client.nome,
      phone: client.telefone,
      email: client.email,
      lastPurchase: client.ultimaCompraData?.toISOString() || null,
      daysInactive: client.ultimaCompraData 
        ? Math.floor((now.getTime() - client.ultimaCompraData.getTime()) / (1000 * 60 * 60 * 24))
        : 999,
      seller: client.vendedor?.nome || 'Sem vendedor',
    }))

    // 5. Orçamentos abertos (com detalhes)
    const openQuotesDetails = await prisma.pedido.findMany({
      where: {
        status: 'ABERTO',
      },
      include: {
        cliente: {
          select: {
            nome: true,
            telefone: true,
          },
        },
        vendedor: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        dataPedido: 'asc',
      },
    })

    const openQuotes = openQuotesDetails.map(quote => ({
      id: quote.id,
      clientName: quote.cliente.nome,
      clientPhone: quote.cliente.telefone,
      sellerName: quote.vendedor.nome,
      value: Number(quote.valorTotal),
      date: quote.dataPedido.toISOString(),
      daysOpen: Math.floor((now.getTime() - quote.dataPedido.getTime()) / (1000 * 60 * 60 * 24)),
    }))

    return NextResponse.json({
      inactive30,
      inactive60,
      inactive90,
      openQuotes7,
      openQuotes14,
      openQuotes30,
      sellerPerformance: sellersWithDetails,
      inactiveClients,
      openQuotes,
    })

  } catch (error) {
    console.error('Erro ao gerar relatórios:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar relatórios' },
      { status: 500 }
    )
  }
}