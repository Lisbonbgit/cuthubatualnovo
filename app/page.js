'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Scissors, Clock, Users, Star, CheckCircle2 } from 'lucide-react';

export default function App() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (token) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        redirectBasedOnUserType(data.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const redirectBasedOnUserType = (user) => {
    if (user.tipo === 'super_admin') {
      router.push('/master');
    } else if (user.tipo === 'admin') {
      router.push('/admin');
    } else if (user.tipo === 'barbeiro') {
      router.push('/barbeiro');
    } else if (user.tipo === 'cliente') {
      router.push('/cliente');
    } else if (user.tipo === 'owner') {
      // Owner sem barbearia vai para setup, com barbearia vai ver planos/dashboard
      router.push('/setup');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-amber-500 text-xl">A carregar...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/90 via-zinc-950/70 to-zinc-950"></div>
        </div>

        <div className="container relative z-10 text-center">
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-4">
              BarbePRO
            </h1>
            <div className="h-1 w-32 bg-amber-600 mx-auto mb-6"></div>
          </div>
          
          <p className="text-2xl md:text-3xl text-zinc-300 mb-4 max-w-3xl mx-auto font-light">
            Cria a tua página online e começa a gerir marcações hoje mesmo
          </p>
          
          <p className="text-amber-500 font-semibold text-xl mb-12">
            🎉 7 dias grátis • Sem compromisso
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-amber-600 hover:bg-amber-700 text-white text-lg px-10 py-7"
              onClick={() => router.push('/register/owner')}
            >
              <Scissors className="mr-2 h-5 w-5" />
              Criar Minha Barbearia
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-lg px-10 py-7"
              onClick={() => setShowAuthModal(true)}
            >
              Já Tenho Conta
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-amber-600 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-amber-600 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-zinc-800 border-zinc-700 max-w-md w-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">Entrar na Conta</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuthModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>
              <CardDescription className="text-zinc-400">
                Acede ao teu painel de gestão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm onSuccess={(user) => {
                setShowAuthModal(false);
                redirectBasedOnUserType(user);
              }} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Section */}
      <section className="py-20 bg-zinc-900">
        <div className="container">
          <h2 className="text-4xl font-bold text-white text-center mb-4">
            Tudo o Que Precisas Para Gerir a Tua Barbearia
          </h2>
          <p className="text-zinc-400 text-center mb-16 text-lg">
            Sistema completo para modernizar o teu negócio
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-zinc-800 border-zinc-700 hover:border-amber-600 transition-all">
              <CardHeader>
                <Calendar className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle className="text-white">Marcações Online 24/7</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  Os teus clientes marcam horários a qualquer hora. Tu geres tudo num só painel.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700 hover:border-amber-600 transition-all">
              <CardHeader>
                <Users className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle className="text-white">Gestão de Equipa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  Adiciona barbeiros, define horários e acompanha o desempenho de cada um.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700 hover:border-amber-600 transition-all">
              <CardHeader>
                <Star className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle className="text-white">Página Profissional</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  URL própria para partilhares com os teus clientes. Moderno, rápido e mobile.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700 hover:border-amber-600 transition-all">
              <CardHeader>
                <CheckCircle2 className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle className="text-white">Sem Marcações Duplicadas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  Sistema inteligente previne conflitos e sobremarcações automaticamente.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700 hover:border-amber-600 transition-all">
              <CardHeader>
                <Clock className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle className="text-white">Horários Personalizados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  Define os teus horários de funcionamento por dia da semana facilmente.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700 hover:border-amber-600 transition-all">
              <CardHeader>
                <Scissors className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle className="text-white">Gestão de Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  Cria e edita os teus serviços com preços e durações em minutos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-zinc-950">
        <div className="container">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Junte-se a Centenas de Barbearias em Portugal
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-amber-600 mb-2">500+</div>
              <p className="text-zinc-400">Barbearias Activas</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-amber-600 mb-2">10K+</div>
              <p className="text-zinc-400">Marcações por Mês</p>
            </div>
            <div>
              <div className="text-5xl font-bold text-amber-600 mb-2">4.9⭐</div>
              <p className="text-zinc-400">Avaliação Média</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-20 bg-zinc-900">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Planos Para Todos os Tamanhos
            </h2>
            <p className="text-xl text-zinc-400">
              Desde pequenas barbearias a grandes redes. Temos o plano ideal para ti.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-zinc-800 border-zinc-700 text-center">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">Básico</CardTitle>
                <div className="text-4xl font-bold text-amber-600">29€</div>
                <p className="text-zinc-400 text-sm">/mês</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-zinc-400 text-sm">
                  <li>✓ 1 Barbearia</li>
                  <li>✓ 2 Barbeiros</li>
                  <li>✓ Marcações Ilimitadas</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-b from-amber-900/20 to-zinc-800 border-amber-600 border-2 text-center relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-amber-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Mais Popular
                </span>
              </div>
              <CardHeader className="pt-8">
                <CardTitle className="text-white text-2xl mb-2">Pro</CardTitle>
                <div className="text-4xl font-bold text-amber-600">49€</div>
                <p className="text-zinc-400 text-sm">/mês</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-zinc-400 text-sm">
                  <li>✓ 1 Barbearia</li>
                  <li>✓ 5 Barbeiros</li>
                  <li>✓ Suporte Prioritário</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700 text-center">
              <CardHeader>
                <CardTitle className="text-white text-2xl mb-2">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-amber-600">99€</div>
                <p className="text-zinc-400 text-sm">/mês</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-zinc-400 text-sm">
                  <li>✓ 3 Barbearias</li>
                  <li>✓ Barbeiros Ilimitados</li>
                  <li>✓ Suporte 24/7</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-lg px-10"
              onClick={() => router.push('/register/owner')}
            >
              Ver Todos os Planos
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-zinc-950">
        <div className="container text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Pronto Para Modernizar a Tua Barbearia?
          </h2>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Começa hoje com 7 dias grátis. Sem cartão de crédito. Cancela quando quiseres.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-lg px-10 py-7"
              onClick={() => router.push('/register/owner')}
            >
              <Scissors className="mr-2 h-5 w-5" />
              Começar Agora Grátis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-lg px-10 py-7"
              onClick={() => setShowAuthModal(true)}
            >
              Já Tenho Conta
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-8">
        <div className="container text-center">
          <p className="text-zinc-500">&copy; 2025 Barbearia SaaS. Todos os direitos reservados.</p>
          <p className="text-zinc-600 text-sm mt-2">Plataforma de gestão para barbearias em Portugal</p>
        </div>
      </footer>
    </div>
  );
}

function LoginForm({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        onSuccess(data.user);
      } else {
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white">Entrar na Conta</CardTitle>
        <CardDescription className="text-zinc-400">Acede ao teu painel</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white"
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
              className="bg-zinc-900 border-zinc-700 text-white"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-amber-600 hover:bg-amber-700"
            disabled={loading}
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function RegisterForm({ onSuccess }) {
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
        body: JSON.stringify({ nome, email, password, tipo: 'cliente' })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        onSuccess(data.user);
      } else {
        setError(data.error || 'Erro ao registar');
      }
    } catch (error) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white">Criar Conta</CardTitle>
        <CardDescription className="text-zinc-400">Regista-te como cliente</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 rounded">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-zinc-300">Nome</Label>
            <Input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-register" className="text-zinc-300">Email</Label>
            <Input
              id="email-register"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-register" className="text-zinc-300">Palavra-passe</Label>
            <Input
              id="password-register"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white"
              minLength="6"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-amber-600 hover:bg-amber-700"
            disabled={loading}
          >
            {loading ? 'A registar...' : 'Registar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}