import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar todos os produtos
export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      where: { ativo: true },
      include: {
        itensPedido: {
          select: {
            quantidade: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    })

    // Calcular quantidade vendida de cada produto
    const produtosFormatados = produtos.map(produto => {
      const totalVendido = produto.itensPedido.reduce((acc, item) => acc + item.quantidade, 0)
      
      return {
        id: produto.id,
        name: produto.nome,
        category: produto.categoria,
        price: Number(produto.preco),
        description: produto.descricao || '',
        sold: totalVendido,
      }
    })

    return NextResponse.json(produtosFormatados)
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar produtos' },
      { status: 500 }
    )
  }
}

// POST - Criar novo produto
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { name, category, price, description } = body

    // Validações
    if (!name || !category || !price) {
      return NextResponse.json(
        { error: 'Nome, categoria e preço são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar produto
    const produto = await prisma.produto.create({
      data: {
        nome: name,
        categoria: category,
        preco: price,
        descricao: description || null,
      },
    })

    return NextResponse.json({
      id: produto.id,
      name: produto.nome,
      category: produto.categoria,
      price: Number(produto.preco),
      description: produto.descricao || '',
      sold: 0,
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    )
  }
}