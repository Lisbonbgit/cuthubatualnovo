import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'geral@lisbonb.com';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Serviço centralizado de envio de emails
export const EmailService = {
  
  // 1. Email de Confirmação de Conta
  async sendEmailConfirmation(userEmail, userName, confirmToken) {
    try {
      const confirmUrl = `${BASE_URL}/api/confirmar-email?token=${confirmToken}`;
      
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: userEmail,
        subject: 'Confirme o seu email - CutHub',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">✂️ CutHub</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Bem-vindo ao CutHub, ${userName || userEmail.split('@')[0]}!</h2>
                
                <p style="color: #4b5563; font-size: 16px;">
                  A sua conta foi criada com sucesso! 🎉
                </p>
                
                <p style="color: #4b5563; font-size: 16px;">
                  Para começar a usar o painel administrativo, por favor confirme o seu email clicando no botão abaixo:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${confirmUrl}" 
                     style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                            color: white; 
                            padding: 15px 40px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            font-weight: bold;
                            font-size: 16px;
                            display: inline-block;
                            box-shadow: 0 4px 6px rgba(245, 158, 11, 0.3);">
                    Confirmar Email
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">
                  Este link é válido por 24 horas.
                </p>
                
                <p style="color: #6b7280; font-size: 14px;">
                  Se não criou esta conta, pode ignorar este email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  © 2026 CutHub. Todos os direitos reservados.<br>
                  Plataforma de gestão para barbearias
                </p>
              </div>
            </body>
          </html>
        `
      });

      if (error) {
        console.error('[EMAIL] Error sending confirmation:', error);
        return { success: false, error };
      }

      console.log('[EMAIL] Confirmation email sent to:', userEmail);
      return { success: true, data };
    } catch (error) {
      console.error('[EMAIL] Exception sending confirmation:', error);
      return { success: false, error: error.message };
    }
  },

  // 2. Notificação Interna - Nova Barbearia Criada
  async notifyAdminNewBarbearia(barbeariaData) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `🆕 Nova Barbearia Criada - ${barbeariaData.nome}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">Nova Barbearia Criada no CutHub</h2>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Nome:</strong> ${barbeariaData.nome}</p>
                <p><strong>Slug:</strong> ${barbeariaData.slug}</p>
                <p><strong>Owner:</strong> ${barbeariaData.ownerEmail}</p>
                <p><strong>Data:</strong> ${new Date().toLocaleString('pt-PT')}</p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                Acesse o Master Backoffice para mais detalhes.
              </p>
            </body>
          </html>
        `
      });

      if (error) {
        console.error('[EMAIL] Error notifying admin:', error);
        return { success: false, error };
      }

      console.log('[EMAIL] Admin notification sent for new barbearia');
      return { success: true, data };
    } catch (error) {
      console.error('[EMAIL] Exception notifying admin:', error);
      return { success: false, error: error.message };
    }
  },

  // 3. Subscrição de Plano
  async sendSubscriptionConfirmation(userEmail, userName, planData) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: userEmail,
        subject: `Subscrição Confirmada - Plano ${planData.name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">✅ Subscrição Confirmada</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Olá ${userName},</p>
                
                <p>A sua subscrição foi confirmada com sucesso!</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 5px 0;"><strong>Plano:</strong> ${planData.name}</p>
                  <p style="margin: 5px 0;"><strong>Valor:</strong> ${planData.price}€/mês</p>
                  <p style="margin: 5px 0;"><strong>Estado:</strong> Ativa</p>
                  <p style="margin: 5px 0;"><strong>Período de Teste:</strong> 7 dias grátis</p>
                </div>
                
                <p>Aproveite todos os recursos do seu plano!</p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  © 2026 CutHub. Todos os direitos reservados.
                </p>
              </div>
            </body>
          </html>
        `
      });

      if (error) {
        console.error('[EMAIL] Error sending subscription confirmation:', error);
        return { success: false, error };
      }

      console.log('[EMAIL] Subscription confirmation sent to:', userEmail);
      return { success: true, data };
    } catch (error) {
      console.error('[EMAIL] Exception sending subscription:', error);
      return { success: false, error: error.message };
    }
  },

  // 4. Notificação Interna - Nova Subscrição
  async notifyAdminNewSubscription(subscriptionData) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `💳 Nova Subscrição - Plano ${subscriptionData.planName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">Nova Subscrição Realizada</h2>
              
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Cliente:</strong> ${subscriptionData.userEmail}</p>
                <p><strong>Plano:</strong> ${subscriptionData.planName}</p>
                <p><strong>Valor:</strong> ${subscriptionData.price}€/mês</p>
                <p><strong>Método de Pagamento:</strong> ${subscriptionData.paymentMethod}</p>
                <p><strong>Data:</strong> ${new Date().toLocaleString('pt-PT')}</p>
              </div>
            </body>
          </html>
        `
      });

      if (error) {
        console.error('[EMAIL] Error notifying admin subscription:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('[EMAIL] Exception notifying admin subscription:', error);
      return { success: false, error: error.message };
    }
  },

  // 5. Confirmação de Marcação
  async sendBookingConfirmation(clienteEmail, bookingData) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: clienteEmail,
        subject: `Marcação Confirmada - ${bookingData.barbeariaName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">✅ Marcação Confirmada</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Olá ${bookingData.clienteName}!</p>
                
                <p>A sua marcação foi confirmada com sucesso:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 8px 0;"><strong>📅 Data:</strong> ${bookingData.data}</p>
                  <p style="margin: 8px 0;"><strong>🕐 Hora:</strong> ${bookingData.hora}</p>
                  <p style="margin: 8px 0;"><strong>💈 Serviço:</strong> ${bookingData.servicoName}</p>
                  ${bookingData.profissionalName ? `<p style="margin: 8px 0;"><strong>👨‍🦰 Profissional:</strong> ${bookingData.profissionalName}</p>` : ''}
                  <p style="margin: 8px 0;"><strong>🏪 Barbearia:</strong> ${bookingData.barbeariaName}</p>
                  ${bookingData.localMorada ? `<p style="margin: 8px 0;"><strong>📍 Local:</strong> ${bookingData.localMorada}</p>` : ''}
                </div>
                
                <p>Até breve!</p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  © 2026 CutHub. Todos os direitos reservados.
                </p>
              </div>
            </body>
          </html>
        `
      });

      if (error) {
        console.error('[EMAIL] Error sending booking confirmation:', error);
        return { success: false, error };
      }

      console.log('[EMAIL] Booking confirmation sent to:', clienteEmail);
      return { success: true, data };
    } catch (error) {
      console.error('[EMAIL] Exception sending booking confirmation:', error);
      return { success: false, error: error.message };
    }
  },

  // 6. Lembrete 24h antes
  async sendBookingReminder24h(clienteEmail, bookingData) {
    try {
      const { data, error} = await resend.emails.send({
        from: FROM_EMAIL,
        to: clienteEmail,
        subject: `Lembrete: Marcação amanhã - ${bookingData.barbeariaName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">📅 Lembrete de Marcação</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Olá ${bookingData.clienteName}!</p>
                
                <p><strong>Lembrete:</strong> Tem uma marcação agendada para amanhã!</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                  <p style="margin: 8px 0;"><strong>📅 Data:</strong> ${bookingData.data}</p>
                  <p style="margin: 8px 0;"><strong>🕐 Hora:</strong> ${bookingData.hora}</p>
                  <p style="margin: 8px 0;"><strong>💈 Serviço:</strong> ${bookingData.servicoName}</p>
                  ${bookingData.profissionalName ? `<p style="margin: 8px 0;"><strong>👨‍🦰 Profissional:</strong> ${bookingData.profissionalName}</p>` : ''}
                  <p style="margin: 8px 0;"><strong>🏪 Local:</strong> ${bookingData.barbeariaName}</p>
                </div>
                
                <p>Contamos consigo! 💈</p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  © 2026 CutHub. Todos os direitos reservados.
                </p>
              </div>
            </body>
          </html>
        `
      });

      if (error) {
        console.error('[EMAIL] Error sending 24h reminder:', error);
        return { success: false, error };
      }

      console.log('[EMAIL] 24h reminder sent to:', clienteEmail);
      return { success: true, data };
    } catch (error) {
      console.error('[EMAIL] Exception sending 24h reminder:', error);
      return { success: false, error: error.message };
    }
  },

  // 7. Lembrete 60min antes
  async sendBookingReminder60min(clienteEmail, bookingData) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: clienteEmail,
        subject: `⏰ Lembrete: Marcação em 1 hora - ${bookingData.barbeariaName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">⏰ Em 1 Hora!</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Olá ${bookingData.clienteName}!</p>
                
                <p><strong>A sua marcação é daqui a 1 hora!</strong></p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 8px 0;"><strong>🕐 Hora:</strong> ${bookingData.hora}</p>
                  <p style="margin: 8px 0;"><strong>💈 Serviço:</strong> ${bookingData.servicoName}</p>
                  <p style="margin: 8px 0;"><strong>🏪 Local:</strong> ${bookingData.barbeariaName}</p>
                  ${bookingData.localMorada ? `<p style="margin: 8px 0;"><strong>📍 Morada:</strong> ${bookingData.localMorada}</p>` : ''}
                </div>
                
                <p>Até já! 💈</p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  © 2026 CutHub. Todos os direitos reservados.
                </p>
              </div>
            </body>
          </html>
        `
      });

      if (error) {
        console.error('[EMAIL] Error sending 60min reminder:', error);
        return { success: false, error };
      }

      console.log('[EMAIL] 60min reminder sent to:', clienteEmail);
      return { success: true, data };
    } catch (error) {
      console.error('[EMAIL] Exception sending 60min reminder:', error);
      return { success: false, error: error.message };
    }
  },

  // 8. Marcação Concluída
  async sendBookingCompleted(clienteEmail, bookingData) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: clienteEmail,
        subject: `Obrigado pela sua visita! - ${bookingData.barbeariaName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">✨ Obrigado!</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Olá ${bookingData.clienteName}!</p>
                
                <p>Obrigado por escolher ${bookingData.barbeariaName}!</p>
                
                <p>Esperamos que tenha gostado do nosso serviço. Será um prazer recebê-lo novamente em breve! ✂️</p>
                
                <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="color: #059669; font-size: 18px; margin: 0;">
                    <strong>Até à próxima! 💈</strong>
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                  © 2026 CutHub. Todos os direitos reservados.
                </p>
              </div>
            </body>
          </html>
        `
      });

      if (error) {
        console.error('[EMAIL] Error sending completion email:', error);
        return { success: false, error };
      }

      console.log('[EMAIL] Completion email sent to:', clienteEmail);
      return { success: true, data };
    } catch (error) {
      console.error('[EMAIL] Exception sending completion email:', error);
      return { success: false, error: error.message };
    }
  },

  // Helper function to check if Resend is configured
  isConfigured() {
    return !!process.env.RESEND_API_KEY;
  }
};
