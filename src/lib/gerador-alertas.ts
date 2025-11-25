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
   * Aniversariantes do dia e dos próximos 7 dias
   */
  private async gerarAlertasAniversario(): Promise<void> {
    const hoje = new Date();
    const daquiA7Dias = new Date();
    daquiA7Dias.setDate(hoje.getDate() + 7);

    // Busca clientes com aniversário nos próximos 7 dias
    const clientes = await prisma.cliente.findMany({
      where: {
        ativo: true,
        dataNascimento: {
          not: null
        }
      },
      include: {
        vendedor: true,
        alertas: {
          where: {
            tipo: 'ANIVERSARIO',
            status: 'PENDENTE',
            dataCriacao: {
              gte: new Date(hoje.getFullYear(), 0, 1) // Alertas deste ano
            }
          }
        }
      }
    });

    for (const cliente of clientes) {
      if (!cliente.dataNascimento) continue;

      const dataNascimento = new Date(cliente.dataNascimento);
      const aniversarioEsteAno = new Date(
        hoje.getFullYear(),
        dataNascimento.getMonth(),
        dataNascimento.getDate()
      );

      // Verifica se o aniversário é nos próximos 7 dias
      const diasAteAniversario = Math.ceil(
        (aniversarioEsteAno.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diasAteAniversario >= 0 && diasAteAniversario <= 7) {
        // Verifica se já não existe alerta pendente
        if (cliente.alertas.length === 0) {
          const urgencia = diasAteAniversario === 0 ? 'ALTA' : 
                          diasAteAniversario <= 3 ? 'MEDIA' : 'BAIXA';
          
          const mensagemDias = diasAteAniversario === 0 ? 'hoje' :
                              diasAteAniversario === 1 ? 'amanhã' :
                              `em ${diasAteAniversario} dias`;

          await prisma.alerta.create({
            data: {
              clienteId: cliente.id,
              tipo: 'ANIVERSARIO',
              status: 'PENDENTE',
              urgencia,
              mensagem: `🎂 Aniversário de ${cliente.nome} ${mensagemDias}!`
            }
          });

          console.log(`✅ Alerta de aniversário criado: ${cliente.nome} (${mensagemDias})`);
        }
      }
    }
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