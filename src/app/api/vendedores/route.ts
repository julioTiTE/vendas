import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar todos os vendedores
export async function GET() {
  try {
    const vendedores = await prisma.vendedor.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        ativo: true,
      },
      orderBy: {
        nome: 'asc',
      },
    })

    return NextResponse.json(vendedores)
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar vendedores' },
      { status: 500 }
    )
  }
}

// POST - Criar novo vendedor
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { nome, email, telefone } = body

    // Validações
    if (!nome || !telefone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar vendedor
    const vendedor = await prisma.vendedor.create({
      data: {
        nome,
        email: email || null,
        telefone,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        ativo: true,
      },
    })

    return NextResponse.json(vendedor, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar vendedor:', error)
    return NextResponse.json(
      { error: 'Erro ao criar vendedor' },
      { status: 500 }
    )
  }
}