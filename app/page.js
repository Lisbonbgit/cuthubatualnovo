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
  const [activeTab, setActiveTab] = useState('home');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    if (user.tipo === 'admin') {
      router.push('/admin');
    } else if (user.tipo === 'barbeiro') {
      router.push('/barbeiro');
    } else if (user.tipo === 'cliente') {
      router.push('/cliente');
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
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-6">
            Estilo & Tradição
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 mb-12 max-w-2xl mx-auto">
            A melhor experiência de barbearia em Portugal.
            Marca já o teu horário.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-amber-600 hover:bg-amber-700 text-white text-lg px-8 py-6"
              onClick={() => setActiveTab('register')}
            >
              <Calendar className="mr-2 h-5 w-5" />
              Marcar Horário
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white text-lg px-8 py-6"
              onClick={() => setActiveTab('login')}
            >
              Entrar
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

      {/* Features Section */}
      <section className="py-20 bg-zinc-900">
        <div className="container">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Porquê Escolher-nos?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <Scissors className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle className="text-white">Profissionais Experientes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  Barbeiros qualificados com anos de experiência em cortes clássicos e modernos.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <Clock className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle className="text-white">Marcação Online</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  Sistema de marcação 24/7 para tua conveniência. Escolhe o melhor horário para ti.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <Star className="h-12 w-12 text-amber-600 mb-4" />
                <CardTitle className="text-white">Serviço Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-400">
                  Ambiente relaxante com produtos de alta qualidade para um resultado perfeito.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section className="py-20 bg-zinc-950" id="auth">
        <div className="container max-w-md">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
              <TabsTrigger value="login" className="data-[state=active]:bg-amber-600">Entrar</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-amber-600">Registar</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSuccess={redirectBasedOnUserType} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm onSuccess={redirectBasedOnUserType} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-zinc-900">
        <div className="container text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Tens uma Barbearia?
          </h2>
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            Cria a tua página online e começa a gerir marcações hoje mesmo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-amber-600 hover:bg-amber-700 text-lg px-8 py-6"
              onClick={() => router.push('/register/owner')}
            >
              <Scissors className="mr-2 h-5 w-5" />
              Criar Minha Barbearia
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-lg px-8 py-6"
              onClick={() => setActiveTab('login')}
            >
              Já Tenho Conta
            </Button>
          </div>
          <p className="text-amber-500 font-semibold mt-6 text-lg">
            🎉 7 dias grátis • Sem compromisso
          </p>
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