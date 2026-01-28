'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scissors, Loader2, Check } from 'lucide-react';
import { FooterSimple } from '@/components/ui/footer';
import { Navbar } from '@/components/ui/navbar';

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
  const payment = searchParams.get('payment');
  const sessionId = searchParams.get('session_id');

  if (payment === 'success' && sessionId) {
    const token = localStorage.getItem('token');
    if (!token) return;

    // a cada 2 segundos pergunta ao backend se a subscrição já existe
    const interval = setInterval(async () => {
      const res = await fetch('/api/subscriptions/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.ready) {
        clearInterval(interval);
        window.location.href = '/admin';
      }
    }, 2000);

    return () => clearInterval(interval);
  }
}, [searchParams]);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState('pro');

  // dados
  const [nomeBarbearia, setNomeBarbearia] = useState('');
  const [descricao, setDescricao] = useState('');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [passwordAdmin, setPasswordAdmin] = useState('');

  // verificação
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    setMounted(true);
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const res = await fetch('/api/plans');
    const data = await res.json();
    setPlans(data.plans || []);
  };

  // PASSO 1 — enviar código (NÃO cria utilizador)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailAdmin,
          nome: nomeBarbearia,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao enviar código');
        setLoading(false);
        return;
      }

      setShowVerification(true);
      setLoading(false);
    } catch {
      setError('Erro de ligação');
      setLoading(false);
    }
  };

  // PASSO 2 — validar código → criar conta → Stripe
  const handleVerifyCode = async () => {
    setVerificationError('');

    try {
      const verifyRes = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailAdmin,
          code: verificationCode,
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setVerificationError(verifyData.error || 'Código inválido');
        return;
      }

      // criar utilizador
      const registerRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeBarbearia,
          email: emailAdmin,
          password: passwordAdmin,
          tipo: 'owner',
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        setVerificationError(registerData.error || 'Erro ao criar conta');
        return;
      }

      localStorage.setItem('token', registerData.token);

      // stripe
      const checkoutRes = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${registerData.token}`,
        },
        body: JSON.stringify({ plan_id: selectedPlan }),
      });

      const checkoutData = await checkoutRes.json();

      if (checkoutRes.ok && checkoutData.url) {
        window.location.href = checkoutData.url;
      } else {
        setVerificationError(checkoutData.error || 'Erro no pagamento');
      }
    } catch {
      setVerificationError('Erro inesperado');
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-xl bg-zinc-900 border-zinc-800 shadow-xl">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <Scissors className="h-12 w-12 text-amber-500 mx-auto mb-2" />
              <h1 className="text-2xl font-bold text-white">Criar Barbearia</h1>
              <p className="text-zinc-400 text-sm">
                Comece com 7 dias grátis
              </p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-300 p-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Label className="text-zinc-300">Plano</Label>
              <div className="grid grid-cols-3 gap-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-3 rounded-lg border ${
                      selectedPlan === plan.id
                        ? 'border-amber-500 bg-amber-900/20'
                        : 'border-zinc-700 bg-zinc-800'
                    }`}
                  >
                    <div className="text-white font-semibold">{plan.name}</div>
                    <div className="text-amber-400 text-sm">
                      {plan.price}€/mês
                    </div>
                  </button>
                ))}
              </div>

              <Input
                placeholder="Nome da Barbearia"
                value={nomeBarbearia}
                onChange={(e) => setNomeBarbearia(e.target.value)}
                required
              />

              <Input
                placeholder="Descrição (opcional)"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />

              <Input
                type="email"
                placeholder="Email"
                value={emailAdmin}
                onChange={(e) => setEmailAdmin(e.target.value)}
                required
              />

              <Input
                type="password"
                placeholder="Palavra-passe"
                value={passwordAdmin}
                onChange={(e) => setPasswordAdmin(e.target.value)}
                required
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {loading ? 'A enviar código…' : 'Continuar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* MODAL VERIFICAÇÃO */}
      {showVerification && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm bg-zinc-900 border-zinc-700">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">
                Confirme o seu email
              </h2>
              <p className="text-zinc-400 text-sm">
                Enviámos um código de 4 dígitos para:
                <br />
                <strong>{emailAdmin}</strong>
              </p>

              {verificationError && (
                <div className="bg-red-900/30 text-red-300 p-2 rounded text-sm">
                  {verificationError}
                </div>
              )}

              <Input
                placeholder="0000"
                maxLength={4}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="text-center tracking-widest text-lg"
              />

              <Button
                onClick={handleVerifyCode}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Confirmar Código
              </Button>

              <button
                onClick={() => {
                  setShowVerification(false);
                  setVerificationCode('');
                }}
                className="text-zinc-400 text-sm underline w-full"
              >
                Email errado? Recomeçar
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      <FooterSimple variant="dark" />
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupContent />
    </Suspense>
  );
}
