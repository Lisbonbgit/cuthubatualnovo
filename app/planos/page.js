'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2, Crown, Zap, Rocket } from 'lucide-react';
import { SuccessModal } from '@/components/ui/modals';

export default function PlanosPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  const [user, setUser] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    setMounted(true);
    checkAuth();
    fetchPlans();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
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
            // Already has subscription, redirect to setup
            router.push('/setup');
          }
        }
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error:', error);
      router.push('/');
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    setSubscribing(planId);

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          plan_id: planId,
          payment_method: 'mock_card'
        })
      });

      const data = await response.json();

      if (response.ok) {
        const planName = plans.find(p => p.id === planId)?.name || 'Pro';
        setSuccessData({
          title: 'Assinatura Ativada!',
          message: data.message,
          planName: planName,
          trialDays: '7 dias'
        });
        setShowSuccessModal(true);
      } else {
        alert(`❌ ${data.error}`);
      }
    } catch (error) {
      alert('Erro ao processar assinatura');
    } finally {
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

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Escolha o Seu Plano</h1>
          {user && <p className="text-zinc-400 text-sm">Olá, {user.nome}</p>}
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Comece Hoje com 7 Dias Grátis
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio. Sem compromisso, cancele quando quiser.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative ${
                plan.popular 
                  ? 'bg-gradient-to-b from-amber-900/20 to-zinc-800 border-amber-600 border-2' 
                  : 'bg-zinc-800 border-zinc-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-amber-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Mais Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pt-8">
                <div className="mb-4 flex justify-center">
                  {getPlanIcon(plan.id)}
                </div>
                <CardTitle className="text-white text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-white">{plan.price}€</span>
                  <span className="text-zinc-400 ml-2">/mês</span>
                </div>
                <CardDescription className="text-zinc-400">
                  7 dias grátis, depois {plan.price}€/mês
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-zinc-300">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-zinc-700 hover:bg-zinc-600'
                  }`}
                  size="lg"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribing !== null}
                >
                  {subscribing === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A processar...
                    </>
                  ) : (
                    'Começar Trial Grátis'
                  )}
                </Button>

                <p className="text-xs text-zinc-500 text-center">
                  💳 Pagamento mockado para demonstração
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <h3 className="text-white font-semibold mb-2">✅ 7 Dias Grátis</h3>
                  <p className="text-zinc-400 text-sm">
                    Teste todas as funcionalidades sem compromisso
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">🔄 Cancele Quando Quiser</h3>
                  <p className="text-zinc-400 text-sm">
                    Sem contratos de permanência ou taxas de cancelamento
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">💾 Dados Seguros</h3>
                  <p className="text-zinc-400 text-sm">
                    Seus dados permanecem salvos mesmo após cancelamento
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-12 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Perguntas Frequentes
          </h3>
          <div className="space-y-4">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  O que acontece após os 7 dias grátis?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  Após o período de trial, a sua assinatura é automaticamente cobrada mensalmente.
                  Pode cancelar a qualquer momento antes do fim do trial sem ser cobrado.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  Posso mudar de plano depois?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  Sim! Pode fazer upgrade ou downgrade do seu plano a qualquer momento.
                  A diferença de preço será ajustada proporcionalmente.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  E se eu cancelar a assinatura?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  Os seus dados ficam salvos por 90 dias. Durante este período, pode reativar
                  a qualquer momento. Após 90 dias, os dados são permanentemente removidos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            router.push('/setup');
          }}
          title={successData.title || 'Sucesso!'}
          message={successData.message}
          details={[
            { label: 'Plano Escolhido', value: successData.planName },
            { label: 'Trial Grátis', value: successData.trialDays }
          ]}
        />
      )}
    </div>
  );
}
