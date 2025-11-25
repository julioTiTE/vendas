// lib/gerador-alertas.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AlertaGerado {
  clienteId: string;
  clienteNome: string;
  tipo: 'ANIVERSARIO' | 'CLIENTE_INATIVO' | 'ORCAMENTO_ABERTO';
  mensagem: string;
  urgencia: 'ALTA' | 'MEDIA' | 'BAIXA';
  telefone: string;
}

export class GeradorAlertas {
   private prisma: PrismaClient; // ← ADICIONAR ESTA LINHA

  constructor() {
    this.prisma = new PrismaClient(); // ← ADICIONAR ESTA LINHA
  }
  
  /**
   * Gera todos os alertas automaticamente
   */
  async gerarTodosAlertas(): Promise<void> {
    console.log('🔍 Iniciando geração de alertas...');
    
    // Limpa alertas antigos resolvidos (mais de 30 dias)
    await this.limparAlertasAntigos();
    
    // Gera cada tipo de alerta
    await this.gerarAlertasAniversario();
    await this.gerarAlertasClientesInativos();
    await this.gerarAlertasOrcamentosAbertos();
    
    console.log('✅ Alertas gerados com sucesso!');
  }

  /**
 * Gera alertas de aniversário (próximos 7 dias)
 */
private async gerarAlertasAniversario(): Promise<void> {
  // Usa horário de Brasília (GMT-3)
  const hoje = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas a data
  
  const daquiA7Dias = new Date(hoje);
  daquiA7Dias.setDate(hoje.getDate() + 7);

  console.log('📅 Verificando aniversários...');
  console.log('Hoje (Brasil):', hoje.toLocaleDateString('pt-BR'));
  console.log('Até:', daquiA7Dias.toLocaleDateString('pt-BR'));

  const clientes = await this.prisma.cliente.findMany({
    where: {
      ativo: true,
      dataNascimento: {
        not: null
      }
    },
    include: {
      vendedor: true
    }
  });

  console.log(`📊 Total de clientes com data de nascimento: ${clientes.length}`);

  const alertasCriados = [];

  for (const cliente of clientes) {
    if (!cliente.dataNascimento) continue;

    const nascimento = new Date(cliente.dataNascimento);
    
    // Cria uma data com o aniversário deste ano
    const aniversarioEsteAno = new Date(
      hoje.getFullYear(),
      nascimento.getMonth(),
      nascimento.getDate(),
      0, 0, 0, 0
    );

    // Se o aniversário já passou este ano, considera o próximo ano
    if (aniversarioEsteAno < hoje) {
      aniversarioEsteAno.setFullYear(hoje.getFullYear() + 1);
    }

    // Calcula diferença em dias (sem considerar horas)
    const diffDays = Math.floor((aniversarioEsteAno.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`👤 ${cliente.nome}:`);
    console.log(`   Nascimento: ${nascimento.toLocaleDateString('pt-BR')}`);
    console.log(`   Aniversário este ano: ${aniversarioEsteAno.toLocaleDateString('pt-BR')}`);
    console.log(`   Dias até aniversário: ${diffDays}`);

    // Gera alerta se falta 0 a 7 dias
    if (diffDays >= 0 && diffDays <= 7) {
      const alertaExistente = await this.prisma.alerta.findFirst({
        where: {
          clienteId: cliente.id,
          tipo: 'ANIVERSARIO',
          status: 'PENDENTE'
        }
      });

      if (!alertaExistente) {
        let mensagem = '';
        let urgencia: 'ALTA' | 'MEDIA' | 'BAIXA' = 'MEDIA';

        if (diffDays === 0) {
          mensagem = `🎂 Aniversário de ${cliente.nome} hoje!`;
          urgencia = 'ALTA';
        } else if (diffDays === 1) {
          mensagem = `🎉 Aniversário de ${cliente.nome} amanhã!`;
          urgencia = 'ALTA';
        } else if (diffDays <= 3) {
          mensagem = `🎂 Aniversário de ${cliente.nome} em ${diffDays} dias`;
          urgencia = 'MEDIA';
        } else {
          mensagem = `Aniversário de ${cliente.nome} em ${diffDays} dias`;
          urgencia = 'BAIXA';
        }

        const alerta = await this.prisma.alerta.create({
          data: {
            clienteId: cliente.id,
            tipo: 'ANIVERSARIO',
            mensagem,
            urgencia,
            status: 'PENDENTE'
          }
        });

        alertasCriados.push(alerta);
        console.log(`   ✅ Alerta criado: ${mensagem}`);
      } else {
        console.log(`   ⏭️  Alerta já existe`);
      }
    } else {
      console.log(`   ⏭️  Fora do range (${diffDays} dias)`);
    }
  }

  console.log(`✅ ${alertasCriados.length} alertas de aniversário criados`);
}
  /**
   * Clientes inativos (sem compra há X dias)
   */
  private async gerarAlertasClientesInativos(): Promise<void> {
    const hoje = new Date();
    const diasInatividade = [30, 60, 90]; // Alertar em 30, 60 e 90 dias

    for (const dias of diasInatividade) {
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() - dias);

      const clientes = await prisma.cliente.findMany({
        where: {
          ativo: true,
          OR: [
            {
              ultimaCompraData: {
                lte: dataLimite,
                gte: new Date(dataLimite.getTime() - (24 * 60 * 60 * 1000)) // Janela de 1 dia
              }
            },
            {
              AND: [
                { ultimaCompraData: null },
                { 
                  createdAt: {
                    lte: dataLimite,
                    gte: new Date(dataLimite.getTime() - (24 * 60 * 60 * 1000))
                  }
                }
              ]
            }
          ]
        },
        include: {
          alertas: {
            where: {
              tipo: 'CLIENTE_INATIVO',
              status: 'PENDENTE',
              mensagem: {
                contains: `${dias} dias`
              }
            }
          }
        }
      });

      for (const cliente of clientes) {
        // Verifica se já não existe alerta pendente para esse período
        if (cliente.alertas.length === 0) {
          const urgencia = dias >= 90 ? 'ALTA' : dias >= 60 ? 'MEDIA' : 'BAIXA';

          await prisma.alerta.create({
            data: {
              clienteId: cliente.id,
              tipo: 'CLIENTE_INATIVO',
              status: 'PENDENTE',
              urgencia,
              mensagem: `⏰ Cliente ${cliente.nome} sem comprar há ${dias} dias`
            }
          });

          console.log(`✅ Alerta de inatividade criado: ${cliente.nome} (${dias} dias)`);
        }
      }
    }
  }

  /**
   * Orçamentos/Pedidos abertos há mais de X dias
   */
  private async gerarAlertasOrcamentosAbertos(): Promise<void> {
    const hoje = new Date();
    const diasParaAlertar = [3, 7, 15]; // Alertar em 3, 7 e 15 dias

    for (const dias of diasParaAlertar) {
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() - dias);

      const pedidosAbertos = await prisma.pedido.findMany({
        where: {
          status: 'ABERTO',
          dataPedido: {
            lte: dataLimite,
            gte: new Date(dataLimite.getTime() - (24 * 60 * 60 * 1000)) // Janela de 1 dia
          }
        },
        include: {
          cliente: {
            include: {
              alertas: {
                where: {
                  tipo: 'ORCAMENTO_ABERTO',
                  status: 'PENDENTE',
                  mensagem: {
                    contains: `${dias} dias`
                  }
                }
              }
            }
          }
        }
      });

      for (const pedido of pedidosAbertos) {
        // Verifica se já não existe alerta pendente para esse pedido
        if (pedido.cliente.alertas.length === 0) {
          const urgencia = dias >= 15 ? 'ALTA' : dias >= 7 ? 'MEDIA' : 'BAIXA';

          await prisma.alerta.create({
            data: {
              clienteId: pedido.clienteId,
              tipo: 'ORCAMENTO_ABERTO',
              status: 'PENDENTE',
              urgencia,
              mensagem: `📋 Orçamento de ${pedido.cliente.nome} aberto há ${dias} dias (R$ ${pedido.valorTotal})`
            }
          });

          console.log(`✅ Alerta de orçamento criado: ${pedido.cliente.nome} (${dias} dias)`);
        }
      }
    }
  }

  /**
   * Remove alertas resolvidos com mais de 30 dias
   */
  private async limparAlertasAntigos(): Promise<void> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);

    const resultado = await prisma.alerta.deleteMany({
      where: {
        status: 'RESOLVIDO',
        dataCriacao: {
          lt: dataLimite
        }
      }
    });

    if (resultado.count > 0) {
      console.log(`🗑️  ${resultado.count} alertas antigos removidos`);
    }
  }
}