import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const { nome, email, telefone } = body

    // Validações
    if (!nome || !telefone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    // Atualizar vendedor
    const vendedorAtualizado = await prisma.vendedor.update({
      where: { id },
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

    return NextResponse.json(vendedorAtualizado)
  } catch (error) {
    console.error('Erro ao atualizar vendedor:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar vendedor' },
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
    await prisma.vendedor.update({
      where: { id },
      data: { ativo: false },
    })

    return NextResponse.json({ message: 'Vendedor desativado com sucesso' })
  } catch (error) {
    console.error('Erro ao desativar vendedor:', error)
    return NextResponse.json(
      { error: 'Erro ao desativar vendedor' },
      { status: 500 }
    )
  }
}