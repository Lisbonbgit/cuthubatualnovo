'use client';

import { useState } from 'react';
import { Send, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function Footer({ variant = 'dark' }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !message) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setSending(true);
    setError('');

    // Simular envio de email (em produção, conectar a um serviço de email)
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setEmail('');
      setMessage('');
      
      // Reset após 5 segundos
      setTimeout(() => setSent(false), 5000);
    }, 1500);
  };

  const isDark = variant === 'dark';

  return (
    <footer className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-100 border-gray-200'} border-t mt-auto`}>
      {/* Caixa de Contacto */}
      <div className={`${isDark ? 'bg-zinc-950/50' : 'bg-white'} py-12`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${isDark ? 'bg-amber-600/20' : 'bg-violet-100'} mb-4`}>
              <Mail className={`h-7 w-7 ${isDark ? 'text-amber-500' : 'text-violet-600'}`} />
            </div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              Entre em Contacto
            </h3>
            <p className={`${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              Tem alguma dúvida ou sugestão? Envie-nos uma mensagem!
            </p>
          </div>

          {sent ? (
            <div className={`text-center py-8 ${isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'} rounded-xl border`}>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className={`text-lg font-semibold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                Mensagem enviada com sucesso!
              </p>
              <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'} mt-1`}>
                Entraremos em contacto em breve.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    type="email"
                    placeholder="O seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${isDark ? 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'} h-12`}
                    required
                  />
                </div>
                <div className="md:hidden">
                  <Textarea
                    placeholder="A sua mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className={`${isDark ? 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'} min-h-[100px]`}
                    required
                  />
                </div>
              </div>
              <div className="hidden md:block">
                <Textarea
                  placeholder="A sua mensagem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`${isDark ? 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'} min-h-[120px]`}
                  required
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <div className="text-center">
                <Button
                  type="submit"
                  disabled={sending}
                  className={`${isDark ? 'bg-amber-600 hover:bg-amber-700' : 'bg-violet-600 hover:bg-violet-700'} text-white px-8 h-12`}
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      A enviar...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Rodapé */}
      <div className={`${isDark ? 'bg-zinc-950' : 'bg-gray-50'} py-6`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className={`${isDark ? 'text-zinc-400' : 'text-gray-600'} text-sm`}>
            © 2026 CutHub. Todos os direitos reservados.
          </p>
          <p className={`${isDark ? 'text-zinc-500' : 'text-gray-500'} text-xs mt-1`}>
            Plataforma de gestão para barbearias
          </p>
        </div>
      </div>
    </footer>
  );
}

// Footer simples sem caixa de email (para páginas internas)
export function FooterSimple({ variant = 'dark' }) {
  const isDark = variant === 'dark';

  return (
    <footer className={`${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-gray-200'} border-t py-6 mt-auto`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className={`${isDark ? 'text-zinc-400' : 'text-gray-600'} text-sm`}>
          © 2026 CutHub. Todos os direitos reservados.
        </p>
        <p className={`${isDark ? 'text-zinc-500' : 'text-gray-500'} text-xs mt-1`}>
          Plataforma de gestão para barbearias
        </p>
      </div>
    </footer>
  );
}
