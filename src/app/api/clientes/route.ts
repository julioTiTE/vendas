import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar todos os clientes
export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        vendedor: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    })

    // Transformar para o formato esperado pelo frontend
    const clientesFormatados = clientes.map(cliente => {
      const now = new Date()
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      let status: 'baixa' | 'media' | 'urgente' = 'baixa'
      
      if (cliente.ultimaCompraData) {
        const lastPurchase = new Date(cliente.ultimaCompraData)
        
        if (lastPurchase >= threeMonthsAgo) {
          // Última compra foi há menos de 3 meses
          status = 'baixa'
        } else if (lastPurchase >= sixMonthsAgo) {
          // Última compra foi entre 3 e 6 meses atrás
          status = 'media'
        } else {
          // Última compra foi há mais de 6 meses
          status = 'urgente'
        }
      } else {
        // Nunca comprou
        status = 'urgente'
      }

      return {
        id: cliente.id,
        name: cliente.nome,
        phone: cliente.telefone,
        email: cliente.email || '',
        lastPurchase: cliente.ultimaCompraData?.toISOString() || new Date().toISOString(),
        seller: cliente.vendedor.nome,
        status: status
      }
    })

    return NextResponse.json(clientesFormatados)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar clientes' },
      { status: 500 }
    )
  }
}

// POST - Criar novo cliente
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { name, phone, email, seller } = body

    // Validações básicas
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar vendedor pelo nome (ou pegar o primeiro se não encontrar)
    let vendedor = await prisma.vendedor.findFirst({
      where: {
        nome: {
          contains: seller || '',
          mode: 'insensitive'
        }
      }
    })

    // Se não encontrar vendedor, pegar o primeiro disponível
    if (!vendedor) {
      vendedor = await prisma.vendedor.findFirst()
    }

    if (!vendedor) {
      return NextResponse.json(
        { error: 'Nenhum vendedor disponível no sistema' },
        { status: 400 }
      )
    }

    // Criar cliente
    const cliente = await prisma.cliente.create({
      data: {
        nome: name,
        telefone: phone,
        email: email || null,
        vendedorId: vendedor.id,
        ultimaCompraData: new Date(),
      },
      include: {
        vendedor: {
          select: {
            nome: true,
          },
        },
      },
    })

    // Retornar no formato esperado (novo cliente = baixa prioridade)
    return NextResponse.json({
      id: cliente.id,
      name: cliente.nome,
      phone: cliente.telefone,
      email: cliente.email || '',
      lastPurchase: cliente.ultimaCompraData?.toISOString() || new Date().toISOString(),
      seller: cliente.vendedor.nome,
      status: 'baixa'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    )
  }
}