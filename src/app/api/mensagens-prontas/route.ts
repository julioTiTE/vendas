// src/app/api/mensagens-prontas/route.ts
import { NextResponse } from 'next/server';

interface MensagemPronta {
  tipo: string;
  titulo: string;
  template: string;
  variaveis: string[];
}

const mensagensProntas: MensagemPronta[] = [
  // ANIVERSÁRIO
  {
    tipo: 'ANIVERSARIO',
    titulo: 'Parabéns - Simples',
    template: 'Olá {nome}! 🎂\n\nParabéns pelo seu aniversário! 🎉\nDesejamos um dia incrível e cheio de realizações!\n\nAproveite nosso presente especial: {desconto}% OFF em qualquer produto!\n\nAtenciosamente,\n{vendedor}',
    variaveis: ['nome', 'desconto', 'vendedor']
  },
  {
    tipo: 'ANIVERSARIO',
    titulo: 'Parabéns - Com Cupom',
    template: 'Feliz Aniversário, {nome}! 🎂🎁\n\nEste é um dia especial e queremos comemorar com você!\n\nSeu presente: Cupom {cupom} para {desconto}% de desconto válido até {dataValidade}.\n\nConte conosco!\n{vendedor}',
    variaveis: ['nome', 'cupom', 'desconto', 'dataValidade', 'vendedor']
  },
  
  // CLIENTE INATIVO
  {
    tipo: 'CLIENTE_INATIVO',
    titulo: 'Saudades - 30 dias',
    template: 'Olá {nome}!\n\nNotamos que você não passa por aqui há um tempinho... Sentimos sua falta! 😊\n\nTemos novidades e produtos que você vai adorar.\n\nQue tal dar uma olhadinha? Estou à disposição!\n\n{vendedor}',
    variaveis: ['nome', 'vendedor']
  },
  {
    tipo: 'CLIENTE_INATIVO',
    titulo: 'Retorno - 60 dias',
    template: 'Oi {nome}! 👋\n\nFaz tempo que não conversamos!\n\nTenho umas novidades incríveis para te mostrar. Posso te enviar o catálogo atualizado?\n\nVamos matar a saudade? 😊\n\n{vendedor}',
    variaveis: ['nome', 'vendedor']
  },
  {
    tipo: 'CLIENTE_INATIVO',
    titulo: 'Oferta Especial - 90 dias',
    template: 'Olá {nome}!\n\nQue saudade! 💙\n\nPreparamos uma oferta EXCLUSIVA pensando em você:\n{oferta}\n\nVocê tem até {dataValidade} para aproveitar!\n\nVamos conversar?\n\n{vendedor}',
    variaveis: ['nome', 'oferta', 'dataValidade', 'vendedor']
  },
  
  // ORÇAMENTO ABERTO
  {
    tipo: 'ORCAMENTO_ABERTO',
    titulo: 'Lembrete - 3 dias',
    template: 'Oi {nome}!\n\nTudo bem? 😊\n\nPassei aqui para saber se você teve tempo de olhar o orçamento que enviei.\n\nFicou com alguma dúvida? Estou aqui para ajudar!\n\n{vendedor}',
    variaveis: ['nome', 'vendedor']
  },
  {
    tipo: 'ORCAMENTO_ABERTO',
    titulo: 'Follow-up - 7 dias',
    template: 'Olá {nome}!\n\nVi que você demonstrou interesse em {produto}.\n\nAinda está pensando? Posso esclarecer alguma dúvida ou fazer algum ajuste no orçamento?\n\nEstou à disposição! 💬\n\n{vendedor}',
    variaveis: ['nome', 'produto', 'vendedor']
  },
  {
    tipo: 'ORCAMENTO_ABERTO',
    titulo: 'Última Chance - 15 dias',
    template: 'Oi {nome}!\n\nSeu orçamento de {produto} está prestes a vencer.\n\nConsegui uma condição especial para você fechar hoje: {condicao}\n\nO que acha? Vamos fechar? 😊\n\n{vendedor}',
    variaveis: ['nome', 'produto', 'condicao', 'vendedor']
  },
  
  // FOLLOW-UP GERAL
  {
    tipo: 'FOLLOWUP',
    titulo: 'Pós-venda',
    template: 'Olá {nome}!\n\nEspero que esteja gostando do seu {produto}! 😊\n\nSe precisar de qualquer coisa, é só chamar!\n\nObrigado pela confiança!\n\n{vendedor}',
    variaveis: ['nome', 'produto', 'vendedor']
  },
  {
    tipo: 'FOLLOWUP',
    titulo: 'Produtos Complementares',
    template: 'Oi {nome}!\n\nVi que você comprou {produtoComprado}.\n\nQueria te mostrar {produtoComplementar} que combina perfeitamente!\n\nPosso te enviar mais informações?\n\n{vendedor}',
    variaveis: ['nome', 'produtoComprado', 'produtoComplementar', 'vendedor']
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');

    if (tipo) {
      const filtradas = mensagensProntas.filter(m => m.tipo === tipo.toUpperCase());
      return NextResponse.json({ mensagens: filtradas });
    }

    // Retorna todas agrupadas por tipo
    const agrupadas = {
      ANIVERSARIO: mensagensProntas.filter(m => m.tipo === 'ANIVERSARIO'),
      CLIENTE_INATIVO: mensagensProntas.filter(m => m.tipo === 'CLIENTE_INATIVO'),
      ORCAMENTO_ABERTO: mensagensProntas.filter(m => m.tipo === 'ORCAMENTO_ABERTO'),
      FOLLOWUP: mensagensProntas.filter(m => m.tipo === 'FOLLOWUP')
    };

    return NextResponse.json({ mensagens: agrupadas });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar mensagens' },
      { status: 500 }
    );
  }
}

// Personalizar mensagem com dados do cliente
export async function POST(request: Request) {
  try {
    const { template, variaveis } = await request.json();
    
    let mensagem = template;
    
    // Substitui as variáveis
    Object.keys(variaveis).forEach(key => {
      const placeholder = `{${key}}`;
      mensagem = mensagem.replace(new RegExp(placeholder, 'g'), variaveis[key]);
    });

    return NextResponse.json({ mensagem });
  } catch (error) {
    console.error('Erro ao personalizar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro ao personalizar mensagem' },
      { status: 500 }
    );
  }
}