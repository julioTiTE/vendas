import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        vendedor: {
          select: {
            nome: true,
          },
        },
        pedidos: {
          include: {
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
          orderBy: {
            dataPedido: 'desc',
          },
        },
      },
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar cliente' },
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
    
    const { nome, telefone, email, dataNascimento, endereco, observacoes } = body

    // Validações
    if (!nome || !telefone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    // Atualizar cliente
    const clienteAtualizado = await prisma.cliente.update({
      where: { id },
      data: {
        nome,
        telefone,
        email: email || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        endereco: endereco || null,
        observacoes: observacoes || null,
      },
      include: {
        vendedor: {
          select: {
            nome: true,
          },
        },
      },
    })

    return NextResponse.json(clienteAtualizado)
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente' },
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
    await prisma.cliente.update({
      where: { id },
      data: { ativo: false },
    })

    return NextResponse.json({ message: 'Cliente desativado com sucesso' })
  } catch (error) {
    console.error('Erro ao desativar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao desativar cliente' },
      { status: 500 }
    )
  }
}