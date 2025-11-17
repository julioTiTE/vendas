import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Contar clientes inativos (sem compra há mais de 30 dias)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const inactiveClients = await prisma.cliente.count({
      where: {
        OR: [
          { ultimaCompraData: { lt: thirtyDaysAgo } },
          { ultimaCompraData: null }
        ],
        ativo: true
      }
    })

    // Contar orçamentos abertos
    const openQuotes = await prisma.pedido.count({
      where: { status: 'ABERTO' }
    })

    // Calcular vendas do mês
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const monthSalesData = await prisma.pedido.aggregate({
      where: {
        status: 'FECHADO',
        dataPedido: { gte: firstDayOfMonth }
      },
      _sum: { valorTotal: true }
    })
    const monthSales = Number(monthSalesData._sum.valorTotal || 0)

    // Top vendedores dos últimos 6 meses (CORRIGIDO)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const topSellersData = await prisma.pedido.groupBy({
      by: ['vendedorId'],
      where: {
        status: 'FECHADO',
        dataPedido: { gte: sixMonthsAgo }
      },
      _sum: { valorTotal: true },
      orderBy: { _sum: { valorTotal: 'desc' } },
      take: 5
    })

    const topSellers = await Promise.all(
      topSellersData.map(async (item) => {
        const vendedor = await prisma.vendedor.findUnique({
          where: { id: item.vendedorId }
        })
        return {
          name: vendedor?.nome || 'Desconhecido',
          sales: Number(item._sum.valorTotal || 0)
        }
      })
    )

    // Top produtos (todos os tempos)
    const topProductsData = await prisma.itemPedido.groupBy({
      by: ['produtoId'],
      where: {
        pedido: {
          status: 'FECHADO'
        }
      },
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: 'desc' } },
      take: 5
    })

    const topProducts = await Promise.all(
      topProductsData.map(async (item) => {
        const produto = await prisma.produto.findUnique({
          where: { id: item.produtoId }
        })
        return {
          name: produto?.nome || 'Desconhecido',
          sold: item._sum.quantidade || 0
        }
      })
    )

    // ========================================
    // CRIAR ALERTAS AUTOMATICAMENTE
    // ========================================
    
    // 1. Buscar clientes inativos há mais de 30 dias
    const clientesInativos = await prisma.cliente.findMany({
      where: {
        OR: [
          { ultimaCompraData: { lt: thirtyDaysAgo } },
          { ultimaCompraData: null }
        ],
        ativo: true
      },
      take: 10
    })

    // 2. Criar alertas para clientes inativos (se não existir)
    for (const cliente of clientesInativos) {
      const diasInativo = cliente.ultimaCompraData 
        ? Math.floor((Date.now() - cliente.ultimaCompraData.getTime()) / (1000 * 60 * 60 * 24))
        : 999

      const alertaExistente = await prisma.alerta.findFirst({
        where: {
          clienteId: cliente.id,
          tipo: 'CLIENTE_INATIVO',
          status: 'PENDENTE'
        }
      })

      if (!alertaExistente) {
        let urgencia: 'BAIXA' | 'MEDIA' | 'ALTA' = 'BAIXA'
        if (diasInativo > 180) urgencia = 'ALTA'      // Mais de 6 meses
        else if (diasInativo > 90) urgencia = 'MEDIA' // 3-6 meses

        await prisma.alerta.create({
          data: {
            clienteId: cliente.id,
            tipo: 'CLIENTE_INATIVO',
            mensagem: `Cliente ${cliente.nome} sem comprar há ${diasInativo} dias`,
            urgencia,
            status: 'PENDENTE'
          }
        })
      }
    }

    // 3. Criar alertas para orçamentos abertos há mais de 7 dias
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const orcamentosAbertosAntigos = await prisma.pedido.findMany({
      where: {
        status: 'ABERTO',
        dataPedido: { lt: sevenDaysAgo }
      },
      include: {
        cliente: true
      },
      take: 10
    })

    for (const pedido of orcamentosAbertosAntigos) {
      const diasAberto = Math.floor((Date.now() - pedido.dataPedido.getTime()) / (1000 * 60 * 60 * 24))

      const alertaExistente = await prisma.alerta.findFirst({
        where: {
          clienteId: pedido.clienteId,
          tipo: 'ORCAMENTO_ABERTO',
          status: 'PENDENTE'
        }
      })

      if (!alertaExistente) {
        let urgencia: 'BAIXA' | 'MEDIA' | 'ALTA' = 'BAIXA'
        if (diasAberto > 30) urgencia = 'ALTA'
        else if (diasAberto > 14) urgencia = 'MEDIA'

        await prisma.alerta.create({
          data: {
            clienteId: pedido.clienteId,
            tipo: 'ORCAMENTO_ABERTO',
            mensagem: `Orçamento de ${pedido.cliente.nome} aberto há ${diasAberto} dias`,
            urgencia,
            status: 'PENDENTE'
          }
        })
      }
    }

    // Buscar alertas pendentes
    const alertasData = await prisma.alerta.findMany({
      where: { status: 'PENDENTE' },
      include: { cliente: true },
      orderBy: [
        { urgencia: 'desc' },
        { dataCriacao: 'desc' }
      ],
      take: 10
    })

    const alerts = alertasData.map((alerta) => {
      let urgency: 'high' | 'medium' | 'low' = 'low'
      
      if (alerta.urgencia === 'ALTA') {
        urgency = 'high'
      } else if (alerta.urgencia === 'MEDIA') {
        urgency = 'medium'
      }
      
      return {
        id: alerta.id,
        type: alerta.tipo,
        message: alerta.mensagem,
        client: alerta.cliente.nome,
        urgency
      }
    })

    // Dados de vendas dos últimos 6 meses
    const salesData = []
    const months = ['Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov']
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const sales = await prisma.pedido.aggregate({
        where: {
          status: 'FECHADO',
          dataPedido: {
            gte: firstDay,
            lte: lastDay
          }
        },
        _sum: { valorTotal: true }
      })

      salesData.push({
        month: months[5 - i],
        sales: Number(sales._sum.valorTotal || 0),
        target: 50000 + (i * 5000)
      })
    }

    // Mix de produtos (percentual de vendas por categoria)
    const productMixData = await prisma.itemPedido.groupBy({
      by: ['produtoId'],
      where: {
        pedido: {
          status: 'FECHADO'
        }
      },
      _sum: { subtotal: true }
    })

    const totalSales = productMixData.reduce((acc, item) => acc + Number(item._sum.subtotal || 0), 0)
    
    const productsByCategory: { [key: string]: number } = {}
    
    for (const item of productMixData) {
      const produto = await prisma.produto.findUnique({
        where: { id: item.produtoId }
      })
      if (produto) {
        const value = Number(item._sum.subtotal || 0)
        productsByCategory[produto.categoria] = (productsByCategory[produto.categoria] || 0) + value
      }
    }

    const productMix = Object.entries(productsByCategory).map(([name, value]) => ({
      name,
      value: totalSales > 0 ? Math.round((value / totalSales) * 100) : 0
    }))

    return NextResponse.json({
      inactiveClients,
      openQuotes,
      monthSales,
      topSellers,
      topProducts,
      alerts,
      salesData,
      productMix
    })
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar dashboard' },
      { status: 500 }
    )
  }
}