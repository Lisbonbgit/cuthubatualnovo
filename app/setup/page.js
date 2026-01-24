'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scissors, ArrowLeft } from 'lucide-react';
import { SuccessModal } from '@/components/ui/modals';

export default function SetupPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [passwordAdmin, setPasswordAdmin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    setMounted(true);
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      const response = await fetch('/api/subscriptions/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.has_subscription || data.subscription.status !== 'active') {
          // No active subscription, redirect to plans
          router.push('/planos');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/barbearias', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome,
          descricao,
          email_admin: emailAdmin,
          password_admin: passwordAdmin
        })
      });

      const data = await response.json();

      if (response.ok) {
        const barbeariaUrl = `/barbearia/${data.barbearia.slug}`;
        setSuccessData({
          title: 'Barbearia Criada com Sucesso!',
          message: 'A tua barbearia está online e pronta para receber marcações.',
          nome: nome,
          slug: data.barbearia.slug,
          adminEmail: emailAdmin
        });
        setShowSuccessModal(true);
      } else {
        if (data.requires_subscription) {
          alert('❌ ' + data.error + '\n\nVais ser redirecionado para escolher um plano.');
          router.push('/planos');
        } else {
          setError(data.error || 'Erro ao criar barbearia');
        }
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSubscription) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-amber-500 text-xl">A verificar assinatura...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Scissors className="h-16 w-16 text-amber-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">Criar Nova Barbearia</h1>
          <p className="text-zinc-400">Configure a sua barbearia e comece a gerir marcações online</p>
        </div>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Informações da Barbearia</CardTitle>
            <CardDescription className="text-zinc-400">
              Preenche os dados para criar a tua barbearia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nome" className="text-zinc-300">Nome da Barbearia *</Label>
                <Input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                  placeholder="Ex: Barbearia Premium Lisboa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-zinc-300">Descrição</Label>
                <Input
                  id="descricao"
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                  placeholder="Ex: A melhor barbearia de Lisboa"
                />
              </div>

              <div className="border-t border-zinc-700 my-6 pt-6">
                <h3 className="text-white font-semibold mb-4">Dados do Administrador</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-admin" className="text-zinc-300">Email do Admin *</Label>
                    <Input
                      id="email-admin"
                      type="email"
                      value={emailAdmin}
                      onChange={(e) => setEmailAdmin(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white"
                      placeholder="admin@exemplo.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-admin" className="text-zinc-300">Palavra-passe do Admin *</Label>
                    <Input
                      id="password-admin"
                      type="password"
                      value={passwordAdmin}
                      onChange={(e) => setPasswordAdmin(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white"
                      placeholder="Mínimo 6 caracteres"
                      minLength="6"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  disabled={loading}
                >
                  {loading ? 'A criar...' : 'Criar Barbearia'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  className="border-zinc-700 text-zinc-300"
                  onClick={() => router.push('/')}
                >
                  Voltar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-zinc-500 text-sm">
            Após criar a barbearia, podes fazer login como administrador
          </p>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            router.push('/');
          }}
          title={successData.title || 'Sucesso!'}
          message={successData.message}
          details={[
            { label: 'Barbearia', value: successData.nome },
            { label: 'URL Pública', value: `/barbearia/${successData.slug}` },
            { label: 'Email Admin', value: successData.adminEmail }
          ]}
        />
      )}
    </div>
  );
}
