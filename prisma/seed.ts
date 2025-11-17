import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar vendedores
  const vendedor1 = await prisma.vendedor.create({
    data: {
      nome: 'Carlos Silva',
      email: 'carlos@lonasexpress.com',
      telefone: '(11) 98765-4321',
    },
  })

  const vendedor2 = await prisma.vendedor.create({
    data: {
      nome: 'Ana Costa',
      email: 'ana@lonasexpress.com',
      telefone: '(11) 98765-4322',
    },
  })

  const vendedor3 = await prisma.vendedor.create({
    data: {
      nome: 'Pedro Lima',
      email: 'pedro@lonasexpress.com',
      telefone: '(11) 98765-4323',
    },
  })

  console.log('✅ Vendedores criados')

  // Criar produtos
  const produtos = await Promise.all([
    prisma.produto.create({
      data: {
        nome: 'Lona Transportadora Premium',
        categoria: 'Transportadora',
        preco: 850.00,
        descricao: 'Lona de alta resistência para esteiras transportadoras',
      },
    }),
    prisma.produto.create({
      data: {
        nome: 'Lona Especial 8mm',
        categoria: 'Especial',
        preco: 650.00,
        descricao: 'Lona especial com 8mm de espessura',
      },
    }),
    prisma.produto.create({
      data: {
        nome: 'Lona Alimentar',
        categoria: 'Alimentar',
        preco: 920.00,
        descricao: 'Lona para transporte de alimentos',
      },
    }),
    prisma.produto.create({
      data: {
        nome: 'Lona de Resistência 12mm',
        categoria: 'Resistência',
        preco: 780.00,
        descricao: 'Alta resistência para cargas pesadas',
      },
    }),
  ])

  console.log('✅ Produtos criados')

  // Criar clientes
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        nome: 'Civaldo Transportes',
        telefone: '(11) 3456-7890',
        email: 'contato@civaldotransportes.com',
        dataNascimento: new Date('1975-05-15'),
        endereco: 'Rua das Indústrias, 1000 - São Paulo',
        vendedorId: vendedor1.id,
        ultimaCompraData: new Date('2024-09-01'), // 2 meses atrás
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'João Silva Logística',
        telefone: '(11) 3456-7891',
        email: 'joao@jsl.com',
        dataNascimento: new Date('1980-08-20'),
        endereco: 'Av. Logística, 500 - Guarulhos',
        vendedorId: vendedor2.id,
        ultimaCompraData: new Date('2024-10-15'), // Compra recente
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Transportadora Rápida',
        telefone: '(11) 3456-7892',
        email: 'contato@transprapida.com',
        endereco: 'Rod. dos Bandeirantes, Km 25',
        vendedorId: vendedor1.id,
        ultimaCompraData: new Date('2024-08-10'), // 3 meses sem comprar
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Indústria ABC',
        telefone: '(11) 3456-7893',
        email: 'compras@industriaabc.com',
        dataNascimento: new Date('1990-03-10'),
        endereco: 'Distrito Industrial, 200 - Osasco',
        vendedorId: vendedor3.id,
        ultimaCompraData: new Date('2024-11-01'),
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Mineradora Sul',
        telefone: '(11) 3456-7894',
        email: 'vendas@mineradorasul.com',
        endereco: 'Zona Industrial, 800 - Campinas',
        vendedorId: vendedor2.id,
        ultimaCompraData: new Date('2024-07-20'), // 4 meses sem comprar
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Construtora Forte',
        telefone: '(11) 3456-7895',
        email: 'compras@construtoraforte.com',
        dataNascimento: new Date('1985-11-25'),
        endereco: 'Av. Construção, 1500 - São Paulo',
        vendedorId: vendedor1.id,
        ultimaCompraData: new Date('2024-10-28'),
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Agrícola Verde',
        telefone: '(11) 3456-7896',
        email: 'contato@agricolaverde.com',
        endereco: 'Fazenda Boa Vista - Sorocaba',
        vendedorId: vendedor3.id,
        ultimaCompraData: new Date('2024-06-15'), // 5 meses sem comprar
      },
    }),
    prisma.cliente.create({
      data: {
        nome: 'Distribuidora Total',
        telefone: '(11) 3456-7897',
        email: 'vendas@distribuidoratotal.com',
        dataNascimento: new Date('1978-07-08'),
        endereco: 'Centro Logístico, 3000 - Jundiaí',
        vendedorId: vendedor2.id,
        ultimaCompraData: new Date('2024-10-20'),
      },
    }),
  ])

  console.log('✅ Clientes criados')

  // Criar pedidos fechados
  const pedido1 = await prisma.pedido.create({
    data: {
      clienteId: clientes[0].id, // Civaldo
      vendedorId: vendedor1.id,
      status: 'FECHADO',
      valorTotal: 5100.00,
      dataPedido: new Date('2024-09-01'),
      itens: {
        create: [
          {
            produtoId: produtos[0].id,
            quantidade: 6,
            precoUnitario: 850.00,
            subtotal: 5100.00,
          },
        ],
      },
    },
  })

  await prisma.pedido.create({
    data: {
      clienteId: clientes[1].id, // João Silva
      vendedorId: vendedor2.id,
      status: 'FECHADO',
      valorTotal: 3900.00,
      dataPedido: new Date('2024-10-15'),
      itens: {
        create: [
          {
            produtoId: produtos[1].id,
            quantidade: 6,
            precoUnitario: 650.00,
            subtotal: 3900.00,
          },
        ],
      },
    },
  })

  // Criar pedidos abertos (orçamentos)
  await prisma.pedido.create({
    data: {
      clienteId: clientes[0].id, // Civaldo
      vendedorId: vendedor1.id,
      status: 'ABERTO',
      valorTotal: 4600.00,
      dataPedido: new Date('2024-10-25'),
      itens: {
        create: [
          {
            produtoId: produtos[0].id,
            quantidade: 4,
            precoUnitario: 850.00,
            subtotal: 3400.00,
          },
          {
            produtoId: produtos[3].id,
            quantidade: 2,
            precoUnitario: 780.00,
            subtotal: 1560.00,
          },
        ],
      },
    },
  })

  await prisma.pedido.create({
    data: {
      clienteId: clientes[1].id, // João Silva
      vendedorId: vendedor2.id,
      status: 'ABERTO',
      valorTotal: 1840.00,
      dataPedido: new Date('2024-10-28'),
      itens: {
        create: [
          {
            produtoId: produtos[2].id,
            quantidade: 2,
            precoUnitario: 920.00,
            subtotal: 1840.00,
          },
        ],
      },
    },
  })

  console.log('✅ Pedidos criados')

  // Criar alertas
  await prisma.alerta.create({
    data: {
      clienteId: clientes[0].id, // Civaldo - 2 meses sem comprar
      tipo: 'CLIENTE_INATIVO',
      mensagem: 'Sem compras há 2 meses - cliente VIP potencial',
      urgencia: 'ALTA',
      status: 'PENDENTE',
    },
  })

  await prisma.alerta.create({
    data: {
      clienteId: clientes[1].id, // João Silva - orçamento aberto
      tipo: 'ORCAMENTO_ABERTO',
      mensagem: 'Orçamento para Lona Transportadora Premium aberto há 20 dias',
      urgencia: 'ALTA',
      status: 'PENDENTE',
    },
  })

  await prisma.alerta.create({
    data: {
      clienteId: clientes[2].id, // Transportadora Rápida - 3 meses sem comprar
      tipo: 'CLIENTE_INATIVO',
      mensagem: 'Cliente sem compras há 3 meses',
      urgencia: 'MEDIA',
      status: 'PENDENTE',
    },
  })

  await prisma.alerta.create({
    data: {
      clienteId: clientes[4].id, // Mineradora Sul - 4 meses sem comprar
      tipo: 'CLIENTE_INATIVO',
      mensagem: 'Cliente inativo há 4 meses - necessário follow-up',
      urgencia: 'MEDIA',
      status: 'PENDENTE',
    },
  })

  await prisma.alerta.create({
    data: {
      clienteId: clientes[6].id, // Agrícola Verde - 5 meses sem comprar
      tipo: 'CLIENTE_INATIVO',
      mensagem: 'Cliente sem atividade há 5 meses',
      urgencia: 'BAIXA',
      status: 'PENDENTE',
    },
  })

  console.log('✅ Alertas criados')

  // Criar produtos favoritos
  await prisma.produtoFavorito.create({
    data: {
      clienteId: clientes[0].id,
      produtoId: produtos[0].id,
      frequencia: 8,
    },
  })

  await prisma.produtoFavorito.create({
    data: {
      clienteId: clientes[1].id,
      produtoId: produtos[1].id,
      frequencia: 5,
    },
  })

  console.log('✅ Produtos favoritos criados')

  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })