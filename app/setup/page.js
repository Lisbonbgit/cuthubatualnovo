'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scissors } from 'lucide-react';
import { FooterSimple } from '@/components/ui/footer';

export default function SetupPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [passwordAdmin, setPasswordAdmin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setMounted(true);
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      // Check user info
      const meResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!meResponse.ok) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      const meData = await meResponse.json();

      // If user is admin or barbeiro, they should go to admin panel
      if (meData.user.tipo === 'admin' || meData.user.tipo === 'barbeiro') {
        router.push('/admin');
        return;
      }

      // If user is cliente, they shouldn't be here
      if (meData.user.tipo === 'cliente') {
        router.push('/');
        return;
      }

      // Only owners can be here - check subscription
      const subResponse = await fetch('/api/subscriptions/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (subResponse.ok) {
        const subData = await subResponse.json();
        
        // Check if owner already has a barbershop
        if (subData.has_barbearia) {
          // Already has barbershop, redirect to home
          window.location.href = '/';
          return;
        }

        if (!subData.has_subscription || subData.subscription?.status !== 'active') {
          // No active subscription, redirect to plans
          window.location.href = '/planos';
          return;
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
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
        // Clear owner token and redirect to login
        localStorage.removeItem('token');
        
        // Show success message and redirect
        alert('✅ Barbearia criada com sucesso!\n\nAgora faça login com as credenciais do administrador:\nEmail: ' + emailAdmin);
        
        // Force redirect to home page
        window.location.href = '/';
      } else {
        if (data.requires_subscription) {
          alert('❌ ' + data.error);
          router.push('/planos');
        } else if (data.upgrade_required) {
          alert('❌ ' + data.message);
          router.push('/gerir-plano');
        } else {
          setError(data.error || 'Erro ao criar barbearia');
        }
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || checking) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-zinc-950 flex items-center justify-center">
        <div className="text-amber-500 text-xl">A verificar...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-zinc-950 flex flex-col">
      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <Scissors className="h-12 w-12 md:h-16 md:w-16 text-amber-600 mx-auto mb-3 md:mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Criar Nova Barbearia</h1>
            <p className="text-zinc-400 text-sm md:text-base">Configure a sua barbearia e comece a gerir marcações online</p>
          </div>

          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg md:text-xl">Informações da Barbearia</CardTitle>
              <CardDescription className="text-zinc-400 text-sm">
                Preenche os dados para criar a tua barbearia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded text-sm">
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
                    className="bg-zinc-900 border-zinc-700 text-white h-11"
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
                    className="bg-zinc-900 border-zinc-700 text-white h-11"
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
                        className="bg-zinc-900 border-zinc-700 text-white h-11"
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
                        className="bg-zinc-900 border-zinc-700 text-white h-11"
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
                    className="flex-1 bg-amber-600 hover:bg-amber-700 h-11 text-base"
                    disabled={loading}
                  >
                    {loading ? 'A criar...' : 'Criar Barbearia'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 h-11"
                    onClick={() => {
                      localStorage.removeItem('token');
                      window.location.href = '/';
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-zinc-500 text-sm">
              Após criar a barbearia, faça login com as credenciais do administrador
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <FooterSimple variant="dark" />
    </div>
  );
}
