'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Check, Crown, Zap, Rocket, ArrowLeft, AlertTriangle, 
  Calendar, CreditCard, Clock, X
} from 'lucide-react';
import { ConfirmModal, AlertModal } from '@/components/ui/modals';
import { FooterSimple } from '@/components/ui/footer';

export default function GerirPlanoPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, plan: null, action: null });
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }

    try {
      // Verificar utilizador
      const userRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!userRes.ok) {
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      const userData = await userRes.json();
      
      if (userData.user.tipo !== 'admin') {
        router.push('/');
        return;
      }

      setUser(userData.user);

      // Buscar subscription
      const subRes = await fetch('/api/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.subscription);
      }

      // Buscar planos disponíveis
      const plansRes = await fetch('/api/planos');
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.planos || []);
      }

    } catch (error) {
      console.error('Auth error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async () => {
    const { plan } = confirmModal;
    const token = localStorage.getItem('token');
    setChangingPlan(plan.id);

    try {
      const res = await fetch('/api/subscription/change', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          plano: plan.id,
          // Sem trial para mudanças de plano
          trial: false
        })
      });

      if (res.ok) {
        setAlertModal({
          isOpen: true,
          title: 'Plano Alterado!',
          message: `O seu plano foi alterado para ${plan.nome} com sucesso. As novas funcionalidades já estão disponíveis.`,
          type: 'success'
        });
        checkAuth(); // Recarregar dados
      } else {
        const error = await res.json();
        setAlertModal({
          isOpen: true,
          title: 'Erro',
          message: error.error || 'Erro ao alterar plano',
          type: 'error'
        });
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao processar pedido',
        type: 'error'
      });
    } finally {
      setChangingPlan(null);
      setConfirmModal({ isOpen: false, plan: null, action: null });
    }
  };

  const handleCancelPlan = async () => {
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setAlertModal({
          isOpen: true,
          title: 'Subscrição Cancelada',
          message: 'A sua subscrição foi cancelada. Poderá continuar a usar o serviço até ao fim do período atual.',
          type: 'info'
        });
        checkAuth();
      } else {
        const error = await res.json();
        setAlertModal({
          isOpen: true,
          title: 'Erro',
          message: error.error || 'Erro ao cancelar subscrição',
          type: 'error'
        });
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao processar pedido',
        type: 'error'
      });
    } finally {
      setConfirmModal({ isOpen: false, plan: null, action: null });
    }
  };

  const getPlanIcon = (planId) => {
    switch(planId) {
      case 'basic': return <Crown className="h-8 w-8" />;
      case 'pro': return <Zap className="h-8 w-8" />;
      case 'enterprise': return <Rocket className="h-8 w-8" />;
      default: return <Crown className="h-8 w-8" />;
    }
  };

  const getPlanColor = (planId) => {
    switch(planId) {
      case 'basic': return 'amber';
      case 'pro': return 'blue';
      case 'enterprise': return 'violet';
      default: return 'amber';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const isCurrentPlan = (planId) => {
    return subscription?.plano === planId;
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin')}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Painel
            </Button>
            <h1 className="text-xl font-bold text-white">Gerir Subscrição</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Subscription Card */}
        {subscription && (
          <Card className="bg-zinc-900 border-zinc-800 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-2xl flex items-center gap-3">
                    <div className={`w-12 h-12 bg-${getPlanColor(subscription.plano)}-600/20 rounded-xl flex items-center justify-center text-${getPlanColor(subscription.plano)}-500`}>
                      {getPlanIcon(subscription.plano)}
                    </div>
                    Plano {subscription.plano?.charAt(0).toUpperCase() + subscription.plano?.slice(1)}
                  </CardTitle>
                  <CardDescription className="text-zinc-400 mt-2">
                    A sua subscrição atual
                  </CardDescription>
                </div>
                <Badge className={`${
                  subscription.status === 'active' ? 'bg-green-900/50 text-green-400 border-green-700' :
                  subscription.status === 'trialing' ? 'bg-blue-900/50 text-blue-400 border-blue-700' :
                  subscription.status === 'cancelled' ? 'bg-red-900/50 text-red-400 border-red-700' :
                  'bg-zinc-800 text-zinc-400 border-zinc-600'
                } text-sm px-3 py-1`}>
                  {subscription.status === 'active' ? 'Ativo' :
                   subscription.status === 'trialing' ? 'Período de Teste' :
                   subscription.status === 'cancelled' ? 'Cancelado' : subscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Calendar className="h-5 w-5 text-zinc-500" />
                    <span className="text-zinc-400 text-sm">Data de Início</span>
                  </div>
                  <p className="text-white font-semibold">{formatDate(subscription.data_inicio)}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-zinc-500" />
                    <span className="text-zinc-400 text-sm">Próxima Renovação</span>
                  </div>
                  <p className="text-white font-semibold">{formatDate(subscription.data_fim)}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="h-5 w-5 text-zinc-500" />
                    <span className="text-zinc-400 text-sm">Valor Mensal</span>
                  </div>
                  <p className="text-amber-500 font-bold text-xl">
                    {plans.find(p => p.id === subscription.plano)?.preco?.toFixed(2) || '0.00'}€
                  </p>
                </div>
              </div>

              {subscription.status !== 'cancelled' && (
                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <Button
                    variant="outline"
                    className="border-red-600 text-red-500 hover:bg-red-600 hover:text-white"
                    onClick={() => setConfirmModal({ isOpen: true, plan: null, action: 'cancel' })}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar Subscrição
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Available Plans */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Alterar Plano</h2>
          <p className="text-zinc-400">
            Escolha um novo plano. A alteração é imediata e o valor será ajustado proporcionalmente.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.id);
            const color = getPlanColor(plan.id);
            
            return (
              <Card 
                key={plan.id} 
                className={`bg-zinc-900 border-2 transition-all ${
                  isCurrent 
                    ? `border-${color}-600 ring-2 ring-${color}-600/20` 
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <CardHeader className="text-center pb-2">
                  {isCurrent && (
                    <Badge className={`bg-${color}-600 text-white mb-3 mx-auto`}>
                      Plano Atual
                    </Badge>
                  )}
                  <div className={`w-16 h-16 bg-${color}-600/20 rounded-2xl flex items-center justify-center text-${color}-500 mx-auto mb-4`}>
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle className="text-white text-2xl">{plan.nome}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">{plan.preco?.toFixed(2)}€</span>
                    <span className="text-zinc-500">/mês</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.funcionalidades?.map((func, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-zinc-300 text-sm">
                        <Check className={`h-5 w-5 text-${color}-500 flex-shrink-0 mt-0.5`} />
                        <span>{func}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button disabled className="w-full bg-zinc-800 text-zinc-500">
                      Plano Atual
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full bg-${color}-600 hover:bg-${color}-700 text-white`}
                      onClick={() => setConfirmModal({ isOpen: true, plan, action: 'change' })}
                      disabled={changingPlan === plan.id}
                    >
                      {changingPlan === plan.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          A processar...
                        </>
                      ) : (
                        <>Mudar para {plan.nome}</>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="bg-amber-900/20 border-amber-800/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-amber-400 font-semibold mb-2">Informação Importante</h3>
                <ul className="text-zinc-300 text-sm space-y-1">
                  <li>• A mudança de plano é imediata e as novas funcionalidades ficam disponíveis de imediato.</li>
                  <li>• O valor será ajustado proporcionalmente ao tempo restante do período atual.</li>
                  <li>• Ao cancelar, manterá acesso até ao fim do período já pago.</li>
                  <li>• Pode reativar a subscrição a qualquer momento.</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <FooterSimple variant="dark" />

      {/* Confirm Modal - Change Plan */}
      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.action === 'change'}
        onClose={() => setConfirmModal({ isOpen: false, plan: null, action: null })}
        onConfirm={handleChangePlan}
        title="Confirmar Mudança de Plano"
        message={`Tem a certeza que deseja mudar para o plano ${confirmModal.plan?.nome}? O valor será de ${confirmModal.plan?.preco?.toFixed(2)}€/mês.`}
        confirmText="Confirmar Mudança"
        cancelText="Cancelar"
      />

      {/* Confirm Modal - Cancel Subscription */}
      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.action === 'cancel'}
        onClose={() => setConfirmModal({ isOpen: false, plan: null, action: null })}
        onConfirm={handleCancelPlan}
        title="Cancelar Subscrição"
        message="Tem a certeza que deseja cancelar a sua subscrição? Manterá acesso até ao fim do período atual."
        confirmText="Sim, Cancelar"
        cancelText="Não, Manter"
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
}
