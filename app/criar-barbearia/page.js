'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scissors, Loader2, CheckCircle2 } from 'lucide-react';
import { FooterSimple } from '@/components/ui/footer';
import { Navbar } from '@/components/ui/navbar';
import { SuccessModal } from '@/components/ui/modals';

function CreateBarbeariaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [hasValidSubscription, setHasValidSubscription] = useState(false);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState([]);
  
  // Barbershop fields
  const [nomeBarbearia, setNomeBarbearia] = useState('');
  const [descricao, setDescricao] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [passwordAdmin, setPasswordAdmin] = useState('');

  useEffect(() => {
    setMounted(true);
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      window.location.href = '/planos';
      return;
    }

    try {
      const response = await fetch('/api/subscriptions/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (!data.has_subscription) {
          // Sem subscription - redirecionar para escolher plano
          window.location.href = '/planos';
          return;
        }

        if (data.has_barbearia) {
          // Já tem barbearia - ir para admin
          window.location.href = '/admin';
          return;
        }

        // Tem subscription mas não tem barbearia - OK para criar
        setHasValidSubscription(true);
      } else {
        window.location.href = '/planos';
      }
    } catch (error) {
      console.error('Error:', error);
      window.location.href = '/planos';
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Criar barbearia (com subscription já validada)
      const barbeariaResponse = await fetch('/api/barbearias', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: nomeBarbearia,
          descricao,
          email_admin: emailAdmin,
          password_admin: passwordAdmin
        })
      });

      const barbeariaData = await barbeariaResponse.json();

      if (barbeariaResponse.ok) {
        // Login automático com admin
        localStorage.removeItem('token');
        
        if (barbeariaData.admin_token) {
          localStorage.setItem('token', barbeariaData.admin_token);
          
          // Show success modal
          setSuccessDetails([
            { label: 'Email de Login', value: emailAdmin },
            { label: 'Barbearia', value: nomeBarbearia },
            { label: 'Próximo Passo', value: 'Adicionar profissionais e serviços' }
          ]);
          setShowSuccessModal(true);
          
          // Redirect after 3s
          setTimeout(() => {
            window.location.href = '/admin';
          }, 3000);
        } else {
          window.location.href = '/';
        }
      } else {
        setError(barbeariaData.error || 'Erro ao criar barbearia');
        setLoading(false);
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
      setLoading(false);
    }
  };

  if (!mounted || checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!hasValidSubscription) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Pagamento Confirmado!</h1>
            <p className="text-zinc-400">Agora configure a sua barbearia</p>
          </div>

          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="pt-6">
              {error && (
                <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados da Barbearia */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg">Dados da Barbearia</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-sm">Nome da Barbearia *</Label>
                    <Input
                      value={nomeBarbearia}
                      onChange={(e) => setNomeBarbearia(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white h-11"
                      placeholder="Ex: Barbearia Premium Lisboa"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-sm">Descrição (opcional)</Label>
                    <Input
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white h-11"
                      placeholder="Ex: A melhor barbearia de Lisboa"
                    />
                  </div>
                </div>

                {/* Dados de Acesso */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold text-lg">Dados de Acesso ao Painel Admin</h3>
                  <p className="text-zinc-500 text-sm">
                    Use estes dados para fazer login e gerir a barbearia
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="emailAdmin" className="text-zinc-400 text-sm">Email *</Label>
                      <Input
                        id="emailAdmin"
                        type="email"
                        value={emailAdmin}
                        onChange={(e) => setEmailAdmin(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-white h-11"
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passwordAdmin" className="text-zinc-400 text-sm">Palavra-passe *</Label>
                      <Input
                        id="passwordAdmin"
                        type="password"
                        value={passwordAdmin}
                        onChange={(e) => setPasswordAdmin(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-white h-11"
                        placeholder="Mínimo 6 caracteres"
                        minLength="6"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-600 hover:bg-amber-700 h-12 text-base"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A criar...
                      </>
                    ) : (
                      'Criar Barbearia'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <FooterSimple variant="dark" />
      
      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Barbearia Criada com Sucesso!"
        message="A redirecionar para o painel admin..."
        details={successDetails}
      />
    </div>
  );
}

export default function CreateBarbeariaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    }>
      <CreateBarbeariaContent />
    </Suspense>
  );
}
