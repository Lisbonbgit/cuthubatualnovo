'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import { FooterSimple } from '@/components/ui/footer';

function CriarBarbeariaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 15; // 15 tentativas = 30 segundos

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/planos');
        return;
      }

      try {
        const res = await fetch('/api/subscriptions/status', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          router.push('/planos');
          return;
        }

        const data = await res.json();

        // ainda sem subscrição → aguarda webhook
        if (!data.has_subscription) {
          const payment = searchParams.get('payment');
          if (payment === 'success' && retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1);
            setTimeout(check, 2000); // Tenta novamente em 2 segundos
            return;
          }
          // Se excedeu tentativas ou não veio do pagamento
          router.push('/planos');
          return;
        }

        // já tem barbearia → admin
        if (data.has_barbearia) {
          router.push('/admin');
          return;
        }

        // tem subscrição mas não tem barbearia
        setHasSubscription(true);
      } catch {
        router.push('/planos');
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [router, searchParams, retryCount]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Card className="bg-zinc-900 border-zinc-700 p-6">
          <CardContent className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="text-white">Pagamento confirmado</p>
            <p className="text-zinc-400 text-sm">
              A verificar a subscrição… ({retryCount}/{MAX_RETRIES})
            </p>
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasSubscription) return null;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="flex items-center justify-center py-20">
        <Card className="bg-zinc-900 border-zinc-700 max-w-md w-full">
          <CardContent className="p-6 text-center text-white">
            <h1 className="text-2xl font-bold mb-2">
              Tudo pronto 🎉
            </h1>
            <p className="text-zinc-400">
              A sua subscrição está ativa.
            </p>
            <p className="text-zinc-400 mt-2">
              Vá para o painel para continuar.
            </p>

            <button
              onClick={() => router.push('/admin')}
              className="mt-6 w-full bg-amber-600 hover:bg-amber-700 py-3 rounded text-black font-semibold"
            >
              Ir para o Painel
            </button>
          </CardContent>
        </Card>
      </main>
      <FooterSimple variant="dark" />
    </div>
  );
}

export default function CriarBarbeariaPage() {
  return (
    <Suspense>
      <CriarBarbeariaContent />
    </Suspense>
  );
}
