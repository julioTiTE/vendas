// src/lib/email-service.ts

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  
  /**
   * Envia email genérico usando fetch direto
   */
  async enviarEmail({ to, subject, html }: EmailOptions) {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📧 Tentativa ${attempt} de enviar email para ${to}...`);
        
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Vendas <contato@juliotitedev.com.br>',
            to: [to],
            reply_to: 'juliotitedev@gmail.com',
            subject: subject,
            html: html,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(`❌ Erro na tentativa ${attempt}:`, data);
          lastError = data;
          
          if (attempt < maxRetries) {
            console.log(`⏳ Aguardando 2 segundos antes de tentar novamente...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
          
          return { success: false, error: data };
        }

        console.log(`✅ Email enviado com sucesso na tentativa ${attempt}:`, data);
        return { success: true, data };
      } catch (error) {
        console.error(`❌ Exceção na tentativa ${attempt}:`, error);
        lastError = error;
        
        if (attempt < maxRetries) {
          console.log(`⏳ Aguardando 2 segundos antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        
        return { success: false, error };
      }
    }

    return { success: false, error: lastError };
  }

  /**
   * Email de aniversário
   */
  async enviarAniversario(nome: string, email: string, cupom: string = 'ANIVER10') {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .cupom { background: #ffd700; color: #333; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎂 Feliz Aniversário!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${nome}</strong>!</p>
              
              <p>🎉 Hoje é um dia especial e queremos comemorar com você!</p>
              
              <p>Como presente, preparamos um cupom exclusivo de desconto:</p>
              
              <div class="cupom">
                ${cupom}
                <div style="font-size: 16px; font-weight: normal; margin-top: 10px;">
                  10% de desconto em qualquer produto!
                </div>
              </div>
              
              <p>✨ Válido por 7 dias a partir de hoje.</p>
              
              <p>Aproveite e faça suas compras com preço especial!</p>
              
              <p>Atenciosamente,<br>
              <strong>Equipe de Vendas</strong></p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.enviarEmail({
      to: email,
      subject: `🎂 Feliz Aniversário, ${nome}!`,
      html
    });
  }

  /**
   * Email de cliente inativo
   */
  async enviarClienteInativo(nome: string, email: string, diasInativo: number) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .destaque { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>😊 Sentimos sua Falta!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${nome}</strong>!</p>
              
              <p>Notamos que você não passa por aqui há ${diasInativo} dias... 💙</p>
              
              <div class="destaque">
                <strong>🎁 Novidades especialmente para você:</strong>
                <ul>
                  <li>Novos produtos chegando</li>
                  <li>Promoções exclusivas</li>
                  <li>Atendimento personalizado</li>
                </ul>
              </div>
              
              <p>Que tal dar uma olhadinha? Estamos com várias novidades que você vai adorar!</p>
              
              <p>Qualquer dúvida, é só chamar. Estamos aqui para te ajudar! 😊</p>
              
              <p>Atenciosamente,<br>
              <strong>Equipe de Vendas</strong></p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.enviarEmail({
      to: email,
      subject: `😊 ${nome}, sentimos sua falta!`,
      html
    });
  }

  /**
   * Email de follow-up de orçamento
   */
  async enviarFollowUpOrcamento(nome: string, email: string, valorOrcamento: number, diasAberto: number) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .orcamento { background: white; padding: 20px; border: 2px solid #4facfe; border-radius: 5px; margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Seu Orçamento Aguarda!</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${nome}</strong>!</p>
              
              <p>Vi que você demonstrou interesse em nossos produtos há ${diasAberto} dias.</p>
              
              <div class="orcamento">
                <div style="font-size: 14px; color: #666; margin-bottom: 10px;">Valor do Orçamento</div>
                <div style="font-size: 32px; font-weight: bold; color: #4facfe;">
                  R$ ${valorOrcamento.toFixed(2).replace('.', ',')}
                </div>
              </div>
              
              <p>Ainda está pensando? Posso esclarecer alguma dúvida ou fazer algum ajuste no orçamento?</p>
              
              <p>💬 Estou à disposição para ajudar no que precisar!</p>
              
              <p>Atenciosamente,<br>
              <strong>Equipe de Vendas</strong></p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.enviarEmail({
      to: email,
      subject: `📋 ${nome}, seu orçamento está esperando!`,
      html
    });
  }

  /**
   * Envia email de teste
   */
  async enviarEmailTeste(email: string) {
    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>🎉 Sistema de Email Configurado!</h2>
          <p>Este é um email de teste do seu sistema de vendas.</p>
          <p>Se você recebeu este email, significa que está tudo funcionando perfeitamente! ✅</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Sistema de Vendas - ${new Date().toLocaleString('pt-BR')}
          </p>
        </body>
      </html>
    `;

    return this.enviarEmail({
      to: email,
      subject: '✅ Teste - Sistema de Email Funcionando!',
      html
    });
  }
}

export const emailService = new EmailService();