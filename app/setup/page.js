'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scissors, Loader2, Check, ArrowLeft } from 'lucide-react';
import { FooterSimple } from '@/components/ui/footer';
import { Navbar } from '@/components/ui/navbar';

export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get('plan');
  
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  
  // Plan state
  const [selectedPlan, setSelectedPlan] = useState(planFromUrl || 'pro');
  const [plans, setPlans] = useState([]);
  
  // Barbershop fields
  const [nomeBarbearia, setNomeBarbearia] = useState('');
  const [descricao, setDescricao] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [passwordAdmin, setPasswordAdmin] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchPlans();
    checkIfAlreadyHasBarbearia();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const checkIfAlreadyHasBarbearia = async () => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setChecking(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      setChecking(false);
      return;
    }

    try {
      const meResponse = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!meResponse.ok) {
        localStorage.removeItem('token');
        setChecking(false);
        return;
      }

      const meData = await meResponse.json();

      // If user is admin or barbeiro, redirect to admin
      if (meData.user.tipo === 'admin' || meData.user.tipo === 'barbeiro') {
        window.location.href = '/admin';
        return;
      }

      // If user is cliente, redirect to home
      if (meData.user.tipo === 'cliente') {
        window.location.href = '/';
        return;
      }

      // Check if owner already has barbershop
      const subResponse = await fetch('/api/subscriptions/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (subResponse.ok) {
        const subData = await subResponse.json();
        
        if (subData.has_barbearia) {
          window.location.href = '/';
          return;
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Step 1: Create owner account using admin credentials
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome: nomeBarbearia, // Use barbershop name as owner name
          email: emailAdmin, 
          password: passwordAdmin, 
          tipo: 'owner' 
        })
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        setError(registerData.error || 'Erro ao criar conta');
        setLoading(false);
        return;
      }

      const token = registerData.token;
      localStorage.setItem('token', token);

      // Step 2: Subscribe to plan
      const subResponse = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          plan_id: selectedPlan,
          payment_method: 'mock_card'
        })
      });

      const subData = await subResponse.json();

      if (!subResponse.ok) {
        setError(subData.error || 'Erro ao ativar plano');
        setLoading(false);
        return;
      }

      // Step 3: Create barbershop (admin will use same email/password)
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
        // Clear owner token
        localStorage.removeItem('token');
        
        // Show success and redirect
        alert('✅ Barbearia criada com sucesso!\n\nFaça login com:\nEmail: ' + emailAdmin);
        window.location.href = '/';
      } else {
        setError(barbeariaData.error || 'Erro ao criar barbearia');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  if (!mounted || checking) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-zinc-950 flex flex-col">
      {/* Navbar */}
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl mx-auto">
          <div className="text-center mb-6">
            <Scissors className="h-12 w-12 text-amber-600 mx-auto mb-3" />
            <h1 className="text-3xl font-bold text-white mb-2">Criar Sua Barbearia</h1>
            <p className="text-zinc-400 text-sm">
              Preencha os dados para criar sua barbearia
            </p>
          </div>

          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded text-sm">
                    {error}
                  </div>
                )}

                {/* Plan Selection */}
                <div className="space-y-3">
                  <Label className="text-zinc-300 text-base font-semibold">1. Escolha seu Plano</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedPlan === plan.id
                            ? 'border-amber-500 bg-amber-900/20'
                            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium text-sm">{plan.name}</span>
                          {selectedPlan === plan.id && (
                            <Check className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <span className="text-amber-500 font-bold">{plan.price}€</span>
                        <span className="text-zinc-500 text-xs">/mês</span>
                      </button>
                    ))}
                  </div>
                  <div className="bg-amber-900/20 rounded-lg p-3">
                    <p className="text-amber-400 text-sm font-medium">🎉 7 dias grátis incluídos</p>
                    <p className="text-zinc-400 text-xs mt-1">
                      Após o período de teste, será cobrado {selectedPlanData?.price || 49}€/mês
                    </p>
                  </div>
                </div>

                {/* Barbershop Data */}
                <div className="space-y-4 pt-4 border-t border-zinc-700">
                  <Label className="text-zinc-300 text-base font-semibold">2. Dados da Barbearia</Label>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeBarbearia" className="text-zinc-400 text-sm">Nome da Barbearia *</Label>
                      <Input
                        id="nomeBarbearia"
                        type="text"
                        value={nomeBarbearia}
                        onChange={(e) => setNomeBarbearia(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-white h-11"
                        placeholder="Ex: Barbearia Premium Lisboa"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descricao" className="text-zinc-400 text-sm">Descrição (opcional)</Label>
                      <Input
                        id="descricao"
                        type="text"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-white h-11"
                        placeholder="Ex: A melhor barbearia da cidade"
                      />
                    </div>
                  </div>
                </div>

                {/* Login Credentials */}
                <div className="space-y-4 pt-4 border-t border-zinc-700">
                  <Label className="text-zinc-300 text-base font-semibold">3. Dados de Acesso</Label>
                  <p className="text-zinc-500 text-xs -mt-2">
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

      <FooterSimple variant="dark" />
    </div>
  );
}
