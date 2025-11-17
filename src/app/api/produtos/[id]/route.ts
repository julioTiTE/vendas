import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const produto = await prisma.produto.findUnique({
      where: { id },
      include: {
        itensPedido: {
          select: {
            quantidade: true,
          },
        },
      },
    })

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    const totalVendido = produto.itensPedido.reduce((acc, item) => acc + item.quantidade, 0)

    return NextResponse.json({
      id: produto.id,
      name: produto.nome,
      category: produto.categoria,
      price: Number(produto.preco),
      description: produto.descricao || '',
      sold: totalVendido,
    })
  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar produto' },
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
    
    const { name, category, price, description } = body

    // Validações
    if (!name || !category || price === undefined) {
      return NextResponse.json(
        { error: 'Nome, categoria e preço são obrigatórios' },
        { status: 400 }
      )
    }

    // Atualizar produto
    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: {
        nome: name,
        categoria: category,
        preco: price,
        descricao: description || null,
      },
    })

    return NextResponse.json({
      id: produtoAtualizado.id,
      name: produtoAtualizado.nome,
      category: produtoAtualizado.categoria,
      price: Number(produtoAtualizado.preco),
      description: produtoAtualizado.descricao || '',
    })
  } catch (error) {
    console.error('Erro ao atualizar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
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

    // Marcar como inativo ao invés de deletar
    await prisma.produto.update({
      where: { id },
      data: { ativo: false },
    })

    return NextResponse.json({ message: 'Produto desativado com sucesso' })
  } catch (error) {
    console.error('Erro ao desativar produto:', error)
    return NextResponse.json(
      { error: 'Erro ao desativar produto' },
      { status: 500 }
    )
  }
}