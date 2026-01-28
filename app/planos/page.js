'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Loader2, Crown, Zap, Rocket, ArrowLeft, Scissors } from 'lucide-react';
import { FooterSimple } from '@/components/ui/footer';
import { Navbar } from '@/components/ui/navbar';

export default function PlanosPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [user, setUser] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [hasBarbearia, setHasBarbearia] = useState(false);

  // Registration form state (for new users)
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
    fetchPlans();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      // No token - user needs to register, but can still view plans
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Check if already has subscription
        const subResponse = await fetch('/api/subscriptions/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (subResponse.ok) {
          const subData = await subResponse.json();
          if (subData.has_subscription && subData.subscription.status === 'active') {
            setHasActiveSubscription(true);
            setCurrentPlan(subData.subscription.plan_id);
          }
          if (subData.has_barbearia) {
            setHasBarbearia(true);
          }
        }
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const handleSelectPlan = (planId) => {
    // Go directly to setup page with plan ID
    window.location.href = `/setup?plan=${planId}`;
  };

  const handleRegisterAndSubscribe = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);

    try {
      // Step 1: Register as owner
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nome, 
          email, 
          password, 
          tipo: 'owner' 
        })
      });

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        setRegisterError(registerData.error || 'Erro ao criar conta');
        setRegisterLoading(false);
        return;
      }

      // Save token
      localStorage.setItem('token', registerData.token);
      setUser(registerData.user);

      // Step 2: Subscribe to selected plan
      const subResponse = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${registerData.token}`
        },
        body: JSON.stringify({ 
          plan_id: selectedPlan,
          payment_method: 'mock_card'
        })
      });

      const subData = await subResponse.json();

      if (subResponse.ok) {
        // Step 3: Redirect to setup page
        window.location.href = '/setup';
      } else {
        setRegisterError(subData.error || 'Erro ao ativar plano');
      }
    } catch (error) {
      setRegisterError('Erro de conexão. Tente novamente.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    setSubscribing(planId);

    try {
      // Criar Stripe Checkout Session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ plan_id: planId })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirecionar para Stripe Checkout
        window.location.href = data.url;
      } else {
        alert(`❌ ${data.error || 'Erro ao criar sessão de checkout'}`);
        setSubscribing(null);
      }
    } catch (error) {
      alert('❌ Erro de conexão. Tente novamente.');
      setSubscribing(null);
    }
  };

  const getPlanIcon = (planId) => {
    switch(planId) {
      case 'basic': return <Zap className="h-12 w-12 text-amber-600" />;
      case 'pro': return <Crown className="h-12 w-12 text-amber-600" />;
      case 'enterprise': return <Rocket className="h-12 w-12 text-amber-600" />;
      default: return <Zap className="h-12 w-12 text-amber-600" />;
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  // Registration Modal
  if (showRegisterForm) {
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    
    return (
      <div className="min-h-screen min-h-[100dvh] bg-zinc-950 flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md mx-auto">
            <Button
              variant="ghost"
              className="text-zinc-400 hover:text-white mb-4"
              onClick={() => setShowRegisterForm(false)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar aos Planos
            </Button>

            <div className="text-center mb-6">
              <Scissors className="h-12 w-12 text-amber-600 mx-auto mb-3" />
              <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
              <p className="text-zinc-400 text-sm">
                Plano selecionado: <span className="text-amber-500 font-semibold">{selectedPlanData?.name}</span> - {selectedPlanData?.price}€/mês
              </p>
            </div>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-lg">Dados da Conta</CardTitle>
                <CardDescription className="text-zinc-400 text-sm">
                  Crie sua conta para começar os 7 dias grátis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegisterAndSubscribe} className="space-y-4">
                  {registerError && (
                    <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded text-sm">
                      {registerError}
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

                  <div className="pt-4 border-t border-zinc-700">
                    <div className="bg-amber-900/20 rounded-lg p-3 mb-4">
                      <p className="text-amber-400 text-sm font-medium">🎉 7 dias grátis incluídos</p>
                      <p className="text-zinc-400 text-xs mt-1">
                        Após o período de teste, será cobrado {selectedPlanData?.price}€/mês
                      </p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-amber-600 hover:bg-amber-700 h-11 text-base"
                    disabled={registerLoading}
                  >
                    {registerLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A processar...
                      </>
                    ) : (
                      'Criar Conta e Começar Grátis'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <p className="text-zinc-500 text-sm">
                Já tem conta?{' '}
                <button
                  onClick={() => {
                    setShowRegisterForm(false);
                    router.push('/');
                  }}
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

  return (
    <div className="min-h-screen min-h-[100dvh] bg-zinc-950 flex flex-col">
      {/* Navbar */}
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 md:py-16">
          {/* Hero */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              {hasActiveSubscription 
                ? 'Altere o Seu Plano'
                : 'Comece Hoje com 7 Dias Grátis'
              }
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
              {hasActiveSubscription
                ? 'Escolha um novo plano para o seu negócio.'
                : 'Escolha o plano ideal para o seu negócio. Sem compromisso, cancele quando quiser.'
              }
            </p>
            {hasActiveSubscription && currentPlan && (
              <div className="mt-4 inline-block bg-amber-900/30 text-amber-400 px-4 py-2 rounded-lg">
                Plano atual: <strong>{plans.find(p => p.id === currentPlan)?.name || currentPlan}</strong>
              </div>
            )}
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.popular 
                    ? 'bg-gradient-to-b from-amber-900/20 to-zinc-800 border-amber-600 border-2' 
                    : 'bg-zinc-800 border-zinc-700'
                } ${currentPlan === plan.id ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-amber-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Mais Popular
                    </span>
                  </div>
                )}
                
                {currentPlan === plan.id && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Atual
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4 pt-8">
                  <div className="flex justify-center mb-4">
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl md:text-5xl font-bold text-white">{plan.price}€</span>
                    <span className="text-zinc-400">/mês</span>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-zinc-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full mt-6 ${
                      currentPlan === plan.id
                        ? 'bg-green-600 hover:bg-green-700'
                        : plan.popular
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-zinc-700 hover:bg-zinc-600'
                    }`}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={subscribing === plan.id || currentPlan === plan.id}
                  >
                    {subscribing === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A processar...
                      </>
                    ) : currentPlan === plan.id ? (
                      'Plano Atual'
                    ) : hasActiveSubscription ? (
                      'Mudar para este Plano'
                    ) : (
                      'Começar 7 Dias Grátis'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom info */}
          <div className="text-center mt-12">
            <p className="text-zinc-500 text-sm">
              Todos os planos incluem 7 dias de teste grátis. Cancele a qualquer momento.
            </p>
          </div>
        </div>
      </main>

      <FooterSimple variant="dark" />
    </div>
  );
}
