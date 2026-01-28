import { redirect } from 'next/navigation';

export default function RegisterOwnerPage() {
  redirect('/setup');
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scissors, ArrowLeft } from 'lucide-react';
import { FooterSimple } from '@/components/ui/footer';

export default function RegisterOwnerPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome, 
          email, 
          password, 
          tipo: 'owner' 
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        // Redirecionar para planos
        router.push('/planos');
      } else {
        setError(data.error || 'Erro ao registar');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-zinc-950 flex flex-col">
      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Back button */}
          <Button
            variant="ghost"
            className="text-zinc-400 hover:text-white mb-4"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <div className="text-center mb-6 md:mb-8">
            <Scissors className="h-12 w-12 md:h-16 md:w-16 text-amber-600 mx-auto mb-3 md:mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Crie Sua Barbearia</h1>
            <p className="text-zinc-400 text-sm md:text-base">
              Registe-se para começar a gerir a sua barbearia online
            </p>
          </div>

          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg md:text-xl">Criar Conta de Dono</CardTitle>
              <CardDescription className="text-zinc-400 text-sm">
                Após o registo, escolherá um plano para começar
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
                  <Label htmlFor="nome" className="text-zinc-300">Nome Completo</Label>
                  <Input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white h-11"
                    placeholder="Ex: Pedro Silva"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white h-11"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300">Palavra-passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 text-white h-11"
                    placeholder="Mínimo 6 caracteres"
                    minLength="6"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700 h-11 text-base"
                  disabled={loading}
                >
                  {loading ? 'A registar...' : 'Continuar para Escolher Plano'}
                </Button>

                <div className="pt-4 border-t border-zinc-700">
                  <p className="text-zinc-400 text-sm text-center">
                    Próximo passo: Escolher um plano de assinatura
                  </p>
                  <div className="mt-2 text-center">
                    <span className="text-amber-500 font-semibold">🎉 7 dias grátis</span>
                    <span className="text-zinc-500 text-sm ml-2">em todos os planos</span>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-zinc-500 text-sm">
              Já tem conta?{' '}
              <button
                onClick={() => router.push('/')}
                className="text-amber-600 hover:text-amber-500 font-medium"
              >
                Fazer Login
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <FooterSimple variant="dark" />
    </div>
  );
}
